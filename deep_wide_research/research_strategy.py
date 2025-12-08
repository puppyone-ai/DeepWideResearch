"""Research stage strategy for Deep Research.

This module encapsulates the research step, fetching information from
external search providers and returning raw notes.

Uses prompt-based tool invocation without OpenAI function call API.
"""

from __future__ import annotations

import asyncio
import json
import re
import sys
import time
from datetime import datetime
from typing import Dict, List, Optional, Any

# Support both direct execution and module import - try absolute and relative imports
try:
    # Try importing as part of a package (development environment)
    from .providers import chat_complete
    from .mcp_client import get_registry
    from .newprompt import create_unified_research_prompt
    from .context_utils import extract_sources_from_result, _infer_service_from_tool
except ImportError:
    # Try absolute import (direct execution or deployment environment)
    try:
        from deep_wide_research.providers import chat_complete
        from deep_wide_research.mcp_client import get_registry
        from deep_wide_research.newprompt import create_unified_research_prompt
        from deep_wide_research.context_utils import extract_sources_from_result, _infer_service_from_tool
    except ImportError:
        # Import as standalone module (Railway deployment environment)
        from providers import chat_complete
        from mcp_client import get_registry
        from newprompt import create_unified_research_prompt
        from context_utils import extract_sources_from_result, _infer_service_from_tool


# MCP tool selection configuration: {server_name: [tool_names]}
# Note: HTTP MCP uses underscores in tool names (tavily_search, not tavily-search)
MCP_TOOLS_CONFIG = {
    "tavily": ["tavily_search"],  # Fixed: use underscore (HTTP MCP naming)
    "exa": ["web_search_exa"]
}

def build_mcp_tools_description(tools: List[Dict[str, Any]]) -> str:
    """Build MCP tool description for insertion into unified_research_prompt
    
    Args:
        tools: List of MCP tools
    
    Returns:
        Tool description text
    """
    if not tools:
        return "\n**Note**: No additional search tools are currently available."
    
    tools_description = []
    
    for idx, tool in enumerate(tools, 1):
        tool_name = tool.get("name", "unknown")
        tool_desc = tool.get("description", "No description")
        input_schema = tool.get("inputSchema", {})
        
        tool_text = f"{idx + 1}. **{tool_name}**: {tool_desc}"
        
        properties = input_schema.get("properties", {})
        required = input_schema.get("required", [])
        
        if properties:
            tool_text += "\n   Arguments:"
            for param_name, param_info in properties.items():
                param_type = param_info.get("type", "any")
                param_desc = param_info.get("description", "")
                is_required = "required" if param_name in required else "optional"
                tool_text += f"\n   - {param_name} ({is_required}, {param_type}): {param_desc}"
        
        tools_description.append(tool_text)
    
    tools_list = "\n\n".join(tools_description)
    
    # Tool call format description
    example_tool = tools[0]
    example_name = example_tool.get("name", "tool_name")
    example_args = {}
    example_props = example_tool.get("inputSchema", {}).get("properties", {})
    
    for param_name, param_info in list(example_props.items())[:2]:
        param_type = param_info.get("type", "string")
        example_args[param_name] = "example value" if param_type == "string" else (5 if param_type == "integer" else "value")
    
    example_json = json.dumps({"tool": example_name, "arguments": example_args}, indent=2)
    
    return f"""
{tools_list}

**Tool Call Format:**
<tool_call>
{example_json}
</tool_call>

You can call multiple tools in parallel by including multiple <tool_call> blocks."""


def parse_tool_calls(content: str) -> List[Dict[str, Any]]:
    """Parse tool calls from LLM response
    
    Example input:
    <tool_call>
    {
      "tool": "tavily_search",
      "arguments": {"query": "Python programming", "max_results": 5}
    }
    </tool_call>
    
    Returns: [{"tool": "tavily_search", "arguments": {...}, "id": "call_1"}]
    """
    tool_calls = []
    
    # Use regex to extract all <tool_call>...</tool_call> blocks
    pattern = r'<tool_call>(.*?)</tool_call>'
    matches = re.findall(pattern, content, re.DOTALL)
    
    for idx, match in enumerate(matches):
        try:
            # Try parsing JSON
            tool_data = json.loads(match.strip())
            tool_calls.append({
                "id": f"call_{idx + 1}",
                "tool": tool_data.get("tool", ""),
                "arguments": tool_data.get("arguments", {})
            })
        except json.JSONDecodeError as e:
            print(f"⚠️ Failed to parse tool call JSON: {e}")
            continue
    
    return tool_calls


async def _execute_single_tool(
    tc: Dict[str, Any],
    mcp_clients: List,
    cfg
) -> Dict[str, Any]:
    """Execute a single tool call"""
    result = None
    t_tool_start = time.perf_counter()
    # Route to the correct client by service name inferred from tool
    service = _infer_service_from_tool(tc.get("tool", "")) or ""
    # Prefer clients whose _server_name matches service; fallback to all
    ordered_clients = [c for c in mcp_clients if getattr(c, "_server_name", "").lower() == service] or list(mcp_clients)
    for client in ordered_clients:
        try:
            raw = await client.call_tool(tc["tool"], tc.get("arguments", {}))
            # If the server returned an explicit error marker, try next client
            if isinstance(raw, dict) and raw.get("isError") is True:
                continue
            result = json.dumps(raw)
            break  # Stop only when non-error result obtained
        except Exception:
            continue  # Try next client on failure
    
    if result is None:
        result = json.dumps({"error": f"Tool '{tc['tool']}' not found in any MCP server"})
    
    t_tool_end = time.perf_counter()
    try:
        if hasattr(cfg, "_timing_events"):
            cfg._timing_events.append({"label": f"Tool {tc['tool']} execution total", "seconds": t_tool_end - t_tool_start})
    except Exception:
        pass

    # Output tool result
    print(f"\n✓ Tool '{tc['tool']}' result ({len(result)} chars)")
    print(f"{'='*60}")
    
    return {
        "tool_call_id": tc["id"],
        "tool": tc["tool"],
        "result": result
    }


async def execute_tool_calls(
    tool_calls: List[Dict[str, Any]],
    mcp_clients: List,
    cfg
) -> List[Dict[str, Any]]:
    """Execute all tool calls in parallel and return results list"""
    if not tool_calls:
        return []
    
    # Execute all tool calls in parallel
    t_exec_start = time.perf_counter()
    tool_results = await asyncio.gather(
        *[_execute_single_tool(tc, mcp_clients, cfg) for tc in tool_calls]
    )
    t_exec_end = time.perf_counter()
    try:
        if hasattr(cfg, "_timing_events"):
            cfg._timing_events.append({"label": "execute_tool_calls gather", "seconds": t_exec_end - t_exec_start})
    except Exception:
        pass

    print(tool_results)
    
    return list(tool_results)


async def run_research_llm_driven(
    topic: str, 
    cfg, 
    api_keys: Optional[dict] = None,
    mcp_config: Optional[Dict[str, List[str]]] = None,
    deep_param: float = 0.5,
    wide_param: float = 0.5,
    status_callback=None
) -> Dict[str, str]:
    """LLM-driven research loop using unified_research_prompt
    
    Args:
        topic: Research topic
        cfg: Configuration object
        api_keys: API key dictionary
        status_callback: Status callback function for sending real-time updates to frontend
    """
    if not topic:
        empty_json = json.dumps({"topic": "", "tool_calls": []}, ensure_ascii=False)
        return {"raw_notes": empty_json}
    
    # 1. Collect MCP tools - use configuration from frontend or default
    print("\n🔍 Collecting tools from MCP servers...")
    t_collect_start = time.perf_counter()
    registry = get_registry()
    
    # Use MCP configuration from frontend, or use default if not provided
    effective_config = mcp_config or MCP_TOOLS_CONFIG
    print(f"📋 Using MCP config: {effective_config}")
    
    mcp_tools, mcp_clients = await registry.collect_tools(effective_config)
    t_collect_end = time.perf_counter()
    try:
        if hasattr(cfg, "_timing_events"):
            cfg._timing_events.append({"label": "MCP collect_tools", "seconds": t_collect_end - t_collect_start})
    except Exception:
        pass
    
    if not mcp_tools:
        print("⚠️ No tools available")
        # Close any clients that were created before returning
        for client in mcp_clients:
            try:
                await client.close()
            except Exception:
                pass
        error_json = json.dumps({
            "topic": topic,
            "tool_calls": [],
            "error": "No tools available"
        }, ensure_ascii=False)
        return {
            "raw_notes": error_json
        }
    
    print(f"✅ Collected {len(mcp_tools)} tool(s):")
    for tool in mcp_tools:
        print(f"  - {tool.get('name', 'unknown')}")
    
    # Helper to close clients created by this request
    async def _close_mcp_clients():
        for client in mcp_clients:
            try:
                await client.close()
            except Exception:
                pass
    
    # 2. Build system prompt - dynamically generate using create_unified_research_prompt
    t_prompt_start = time.perf_counter()
    mcp_prompt = build_mcp_tools_description(mcp_tools)
    max_iterations = getattr(cfg, 'max_react_tool_calls', 8)
    
    system_prompt = create_unified_research_prompt(
        date=datetime.now().strftime("%Y-%m-%d"),
        mcp_prompt=mcp_prompt,
        max_researcher_iterations=max_iterations,
        deep_param=deep_param,
        wide_param=wide_param
    )
    t_prompt_end = time.perf_counter()
    try:
        if hasattr(cfg, "_timing_events"):
            cfg._timing_events.append({"label": "Build research system prompt", "seconds": t_prompt_end - t_prompt_start})
    except Exception:
        pass
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": topic}
    ]
    
    print(messages)
    
    max_steps = getattr(cfg, 'max_react_tool_calls', 8)
    conversation_history = []  # Save complete conversation history for final return
    tool_interactions: List[Dict[str, Any]] = []  # Accumulate all tool calls and results (for JSON raw_notes)
    contextjson: Dict[str, Any] = {"sources": []}

    # Tool calling loop
    for step in range(max_steps):
        # Print current context before prompting LLM
        try:
            print("\n[CONTEXT_JSON - research before prompt]")
            print(json.dumps(contextjson, ensure_ascii=False))
        except Exception:
            pass
        # Call LLM (pure conversation mode)
        t_llm_start = time.perf_counter()
        resp = await chat_complete(
            model=cfg.research_model,
            messages=messages,
            max_tokens=cfg.research_model_max_tokens,
            api_keys=api_keys,
        )
        t_llm_end = time.perf_counter()
        try:
            if hasattr(cfg, "_timing_events"):
                cfg._timing_events.append({"label": f"Step {step+1} LLM chat_complete", "seconds": t_llm_end - t_llm_start})
        except Exception:
            pass
        
        # Parse tool calls from response
        t_parse_start = time.perf_counter()
        tool_calls = parse_tool_calls(resp.content)
        t_parse_end = time.perf_counter()
        try:
            if hasattr(cfg, "_timing_events"):
                cfg._timing_events.append({"label": f"Step {step+1} parse tool calls", "seconds": t_parse_end - t_parse_start})
        except Exception:
            pass
        
        # Output raw LLM response
        print(f"\n{'='*60}")
        print(f"[Step {step+1}] LLM Output:")
        print(f"{'='*60}")
        print(f"Content:\n{resp.content}")
        if tool_calls:
            print(f"\n🔧 Parsed {len(tool_calls)} tool call(s):")
            for tc in tool_calls:
                print(f"  - {tc['tool']}: {tc['arguments']}")
        print(f"{'='*60}")
        
        # Save assistant response to history
        conversation_history.append({"role": "assistant", "content": resp.content})
        
        if not tool_calls:
            # No tool calls, LLM has provided final answer
            raw_json = json.dumps({
                "topic": topic,
                "tool_calls": tool_interactions,
            }, ensure_ascii=False)
            await _close_mcp_clients()
            return {
                "raw_notes": raw_json,
                "contextjson": contextjson
            }
        
        # Check if ResearchComplete was called
        if any(tc["tool"] == "ResearchComplete" for tc in tool_calls):
            print("\n✅ Research completed by agent")
            await _close_mcp_clients()
            return {
                "raw_notes": "\n\n".join([m["content"] for m in conversation_history if m.get("content")]),
                "contextjson": contextjson
            }
        
        # Add assistant message to conversation
        messages.append({"role": "assistant", "content": resp.content})
        
        # Send status update - notify frontend which tools are being used
        if status_callback and tool_calls:
            tools_being_used = [tc["tool"] for tc in tool_calls]
            unique_tools = list(set(tools_being_used))  # Deduplicate
            tools_text = ", ".join(unique_tools[:3])  # Show max 3 tools
            await status_callback(f"using {tools_text}")
        
        # Execute all tool calls
        t_tools_start = time.perf_counter()
        tool_results = await execute_tool_calls(tool_calls, mcp_clients, cfg)
        t_tools_end = time.perf_counter()
        try:
            if hasattr(cfg, "_timing_events"):
                cfg._timing_events.append({"label": f"Step {step+1} execute all tool calls", "seconds": t_tools_end - t_tools_start})
        except Exception:
            pass

        # Record this round's tool calls and results (structured as JSON items)
        call_info_map = {tc["id"]: {"tool": tc["tool"], "arguments": tc.get("arguments", {})} for tc in tool_calls}
        # Build/extend context from each tool result
        # Maintain simple dedup by (service,url)
        seen = {f"{s.get('service','')}|{s.get('url','')}": True for s in contextjson.get("sources", [])}
        for tr in tool_results:
            call_id = tr.get("tool_call_id")
            info = call_info_map.get(call_id, {})
            result_text = tr.get("result", "")
            # Parse once
            try:
                parsed_result: Any = json.loads(result_text)
            except Exception:
                parsed_result = result_text
            tool_name = tr.get("tool") or info.get("tool") or ""
            tool_args = info.get("arguments", {}) if isinstance(info.get("arguments", {}), dict) else {}
            query_val = tool_args.get("query")
            service = _infer_service_from_tool(tool_name) or "other"
            # Normalize sources for Tavily/Exa
            if service in ("tavily", "exa"):
                try:
                    new_sources = extract_sources_from_result(service, query_val, parsed_result)
                except Exception:
                    new_sources = []
                for s in new_sources:
                    key = f"{s.get('service','')}|{s.get('url','')}"
                    if key in seen:
                        continue
                    seen[key] = True
                    contextjson.setdefault("sources", []).append(s)

            # Save interaction record
            tool_interactions.append({
                "step": step + 1,
                "id": call_id,
                "tool": tool_name,
                "arguments": tool_args,
                "result": parsed_result,
            })

        # Reassign rank by order
        for i, s in enumerate(contextjson.get("sources", [])):
            s["rank"] = i

        # Inject context JSON for LLM instead of raw tool results
        ctx_block = f"<CONTEXT_JSON>\n{json.dumps(contextjson, ensure_ascii=False)}\n</CONTEXT_JSON>"
        messages.append({"role": "user", "content": ctx_block})
        conversation_history.append({"role": "contextjson", "content": ctx_block})

        # Send minimal sources update to frontend via status callback
        if status_callback:
            try:
                minimal_sources = [
                    {"service": s.get("service", ""), "query": s.get("query", ""), "url": s.get("url", "")}
                    for s in contextjson.get("sources", [])
                    if s.get("service") and s.get("url")
                ]
                await status_callback(json.dumps({"event": "sources_update", "sources": minimal_sources}, ensure_ascii=False))
            except Exception:
                pass
    
    # Reached max steps, return collected tool interactions as JSON
    raw_json = json.dumps({
        "topic": topic,
        "tool_calls": tool_interactions,
    }, ensure_ascii=False)
    await _close_mcp_clients()
    return {"raw_notes": raw_json, "contextjson": contextjson}


if __name__ == "__main__":
    """Can test directly by clicking Run button in VSCode"""
    import asyncio
    
    class TestConfig:
        research_model = "openai/o4-mini"
        research_model_max_tokens = 128000
        max_react_tool_calls = 3
    
    async def test():
        result = await run_research_llm_driven("History of Volkswagen over the past 50 years and its early development path?", TestConfig())
    
    asyncio.run(test())
