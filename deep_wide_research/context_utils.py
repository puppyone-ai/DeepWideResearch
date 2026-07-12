from __future__ import annotations

import json
from typing import Any, Dict, List, Optional, Callable


def _try_parse_json(text: Any) -> Optional[Any]:
    try:
        if isinstance(text, (dict, list)):
            return text
        if isinstance(text, (bytes, bytearray)):
            text = text.decode("utf-8", errors="ignore")
        if isinstance(text, str):
            return json.loads(text)
        return None
    except Exception:
        return None


def _infer_service_from_tool(tool_name: str) -> Optional[str]:
    name = (tool_name or "").lower()
    if "tavily" in name:
        return "tavily"
    if "exa" in name:
        return "exa"
    return None


def _coerce_url(item: Dict[str, Any]) -> Optional[str]:
    url = item.get("url")
    if url:
        return url
    possible = item.get("id")
    if isinstance(possible, str) and possible.startswith("http"):
        return possible
    return None


def tavily_search_to_sources(result_obj: Any, query: Optional[str]) -> List[Dict[str, Any]]:
    sources: List[Dict[str, Any]] = []

    candidates: List[Dict[str, Any]] = []
    top = _try_parse_json(result_obj)
    if isinstance(top, dict):
        candidates.append(top)
        for part in top.get("content", []) if isinstance(top.get("content"), list) else []:
            if isinstance(part, dict) and isinstance(part.get("text"), str):
                parsed = _try_parse_json(part.get("text"))
                if isinstance(parsed, dict):
                    candidates.append(parsed)

    for cand in candidates:
        sc = cand.get("structuredContent") if isinstance(cand, dict) else None
        if not (isinstance(sc, dict) and isinstance(sc.get("results"), list)):
            continue
        for r in sc["results"]:
            if not isinstance(r, dict):
                continue
            url = _coerce_url(r)
            if not url:
                continue
            text_val = r.get("content") or r.get("text") or ""
            src: Dict[str, Any] = {
                "service": "tavily",
                "query": query or sc.get("query") or "",
                "url": url,
                "title": r.get("title") or "",
            }
            if r.get("score") is not None:
                src["score"] = r.get("score")
            if text_val:
                src["text"] = text_val
                try:
                    snippet = str(text_val)
                    src["snippet"] = snippet[:240]
                except Exception:
                    pass
            if r.get("image"):
                src["image"] = r.get("image")
            if r.get("publishedDate"):
                src["publishedAt"] = r.get("publishedDate")
            sources.append(src)

    for i, s in enumerate(sources):
        s.setdefault("rank", i)
    return sources


def exa_search_to_sources(result_obj: Any, query: Optional[str]) -> List[Dict[str, Any]]:
    """Convert Exa search results to sources. Exa is the fastest and most accurate web search API for AI."""
    sources: List[Dict[str, Any]] = []

    candidates: List[Dict[str, Any]] = []
    top = _try_parse_json(result_obj)
    if isinstance(top, dict):
        candidates.append(top)
        for part in top.get("content", []) if isinstance(top.get("content"), list) else []:
            if isinstance(part, dict) and isinstance(part.get("text"), str):
                parsed = _try_parse_json(part.get("text"))
                if isinstance(parsed, dict):
                    candidates.append(parsed)

    for cand in candidates:
        if not (isinstance(cand, dict) and isinstance(cand.get("results"), list)):
            continue
        for r in cand["results"]:
            if not isinstance(r, dict):
                continue
            url = _coerce_url(r)
            if not url:
                continue
            text_val = r.get("text") or r.get("content") or ""
            src: Dict[str, Any] = {
                "service": "exa",
                "query": query or cand.get("query") or "",
                "url": url,
                "title": r.get("title") or "",
            }
            if text_val:
                src["text"] = text_val
                try:
                    snippet = str(text_val)
                    src["snippet"] = snippet[:240]
                except Exception:
                    pass
            if r.get("image"):
                src["image"] = r.get("image")
            if r.get("publishedDate"):
                src["publishedAt"] = r.get("publishedDate")
            sources.append(src)

    for i, s in enumerate(sources):
        s.setdefault("rank", i)
    return sources


# Registry for extensibility
SERVICE_NORMALIZERS: Dict[str, Callable[[Any, Optional[str]], List[Dict[str, Any]]]] = {
    "tavily": tavily_search_to_sources,
    "exa": exa_search_to_sources,
}


def get_normalizer(service: str) -> Optional[Callable[[Any, Optional[str]], List[Dict[str, Any]]]]:
    return SERVICE_NORMALIZERS.get((service or "").lower())


def extract_sources_from_result(service: str, query: Optional[str], result_obj: Any) -> List[Dict[str, Any]]:
    normalizer = get_normalizer(service)
    if not normalizer:
        return []
    return normalizer(result_obj, query)


def build_context_from_raw_notes(raw_notes: str) -> Dict[str, Any]:
    sources: List[Dict[str, Any]] = []
    parsed = _try_parse_json(raw_notes)
    if not isinstance(parsed, dict):
        return {"sources": []}
    tool_calls = parsed.get("tool_calls")
    if not isinstance(tool_calls, list):
        return {"sources": []}
    for call in tool_calls:
        if not isinstance(call, dict):
            continue
        tool_name = call.get("tool") or ""
        service = _infer_service_from_tool(tool_name)
        if service not in ("tavily", "exa"):
            continue
        args = call.get("arguments") or {}
        query = args.get("query") if isinstance(args, dict) else None
        result_obj = call.get("result")
        extracted = extract_sources_from_result(service, query, result_obj)
        sources.extend(extracted)
    dedup: Dict[str, Dict[str, Any]] = {}
    for s in sources:
        key = f"{s.get('service','')}|{s.get('url','')}"
        if key not in dedup:
            dedup[key] = s
    final_sources = list(dedup.values())
    for i, s in enumerate(final_sources):
        s["rank"] = i
    return {"sources": final_sources}


