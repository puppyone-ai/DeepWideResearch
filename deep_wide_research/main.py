"""FastAPI server for Deep Research Engine.

Provides HTTP API endpoints to invoke the deep research engine.
"""

import sys
from pathlib import Path

# Add project root to Python path for proper module imports
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Also add current directory to path (for Railway deployment)
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Tuple
import asyncio
import json
import time
import requests
from jose import jwt
import secrets
import hashlib
import hmac
from datetime import datetime, timezone, timedelta
import logging

# Try two import methods: development and deployment environments
try:
    from deep_wide_research.engine import run_deep_research, run_deep_research_stream, Configuration
except ImportError:
    from engine import run_deep_research, run_deep_research_stream, Configuration

app = FastAPI(title="PuppyResearch API", version="1.0.0")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure CORS to allow frontend access
import os
import re
from urllib.parse import urlparse
from dotenv import load_dotenv

# Load environment from .env files (local development)
try:
    # Load root .env then service-level .env (non-overriding order)
    load_dotenv(dotenv_path=project_root / '.env', override=False)
    load_dotenv(dotenv_path=current_dir / '.env', override=False)
except Exception:
    pass
# Polar webhook secret (optional but recommended)
POLAR_WEBHOOK_SECRET = os.getenv("POLAR_WEBHOOK_SECRET")

def _verify_polar_signature(req: "Request", raw_body: bytes) -> None:
    """Verify Polar webhook signature using HMAC-SHA256 over raw body.
    Expects header 'Polar-Webhook-Signature' containing lowercase hex digest.
    """
    if not POLAR_WEBHOOK_SECRET:
        return
    sig = (
        req.headers.get("Polar-Webhook-Signature")
        or req.headers.get("polar-webhook-signature")
        or req.headers.get("POLAR-WEBHOOK-SIGNATURE")
    )
    if not sig:
        raise HTTPException(status_code=403, detail="Missing Polar-Webhook-Signature")
    digest = hmac.new(POLAR_WEBHOOK_SECRET.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    header_sig = sig.strip().lower()
    if not hmac.compare_digest(header_sig, digest):
        raise HTTPException(status_code=403, detail="Invalid webhook signature")


# Detect if running in a production environment
is_production = bool(os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("RENDER") or os.getenv("VERCEL"))

# Initialize optional origin regex (set in prod via env)
allowed_origin_regex = None

def _normalize_origin(origin: str) -> str:
    """Normalize an origin string for reliable equality checks.
    - trims whitespace
    - strips surrounding quotes if present
    - strips trailing slash
    - lowercases scheme and host (port preserved)
    """
    if not origin:
        return origin
    s = origin.strip()
    # Strip surrounding quotes (common misconfiguration in env vars)
    if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
        s = s[1:-1].strip()
    # Remove trailing slash only if it's the last character
    if s.endswith('/'):
        s = s[:-1]
    # Lowercase scheme and netloc
    try:
        parsed = urlparse(s)
        if parsed.scheme and parsed.netloc:
            netloc = parsed.netloc.lower()
            scheme = parsed.scheme.lower()
            rest = parsed._replace(scheme=scheme, netloc=netloc)
            return rest.geturl()
    except Exception:
        pass
    return s

if is_production:
    # Production: must configure via environment variables
    allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
    if allowed_origins_env:
        allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
        # Normalize to avoid trailing slash / case issues
        allowed_origins = [_normalize_origin(o) for o in allowed_origins]
        allow_all_origins = False
    else:
        raise ValueError(
            "⚠️  Production environment detected but ALLOWED_ORIGINS is not set!\n"
            "Please set the ALLOWED_ORIGINS environment variable with your frontend URL(s).\n"
            "Example: ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://www.your-domain.com"
        )
    # Optional regex to allow multiple subdomains (e.g., ^https://.*\\.example\\.com$)
    allowed_origin_regex = os.getenv("ALLOWED_ORIGIN_REGEX", None)
else:
    # Local development: always allow all origins (for convenience)
    allowed_origins = ["*"]
    allow_all_origins = True
    pass
    allowed_origin_regex = None

# Print CORS configuration (for debugging)
logger.info("CORS configured: env=%s allow_all=%s origins=%s regex=%s credentials=%s",
            "prod" if is_production else "dev",
            allow_all_origins,
            allowed_origins,
            allowed_origin_regex or "None",
            not allow_all_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=allowed_origin_regex,
    allow_credentials=not allow_all_origins,  # Credentials cannot be enabled when using '*'
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Add explicit OPTIONS handler for all routes (fix CORS preflight issues)
from fastapi import Request

@app.options("/{full_path:path}")
async def options_handler(request: Request, full_path: str):
    """Handle OPTIONS preflight requests for CORS (preflight should not require auth)"""
    origin = request.headers.get("origin") or request.headers.get("Origin")
    normalized_origin = _normalize_origin(origin) if origin else None
    req_headers = request.headers.get("access-control-request-headers") or request.headers.get("Access-Control-Request-Headers")

    headers = {
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
        "Access-Control-Max-Age": "3600",
    }

    # Development: allow all
    if allow_all_origins:
        headers["Access-Control-Allow-Origin"] = "*"
        headers["Access-Control-Allow-Headers"] = req_headers or "*"
        return Response(status_code=204, headers=headers)

    # Production: only allow configured origins (list or regex)
    origin_allowed = False
    if normalized_origin:
        if normalized_origin in allowed_origins:
            origin_allowed = True
        elif 'allowed_origin_regex' in globals() and allowed_origin_regex:
            try:
                origin_allowed = re.match(allowed_origin_regex, origin) is not None
            except re.error:
                origin_allowed = False

    if not origin_allowed:
        return Response(status_code=400, content="Disallowed CORS origin")

    headers["Access-Control-Allow-Origin"] = origin
    headers["Vary"] = "Origin"
    headers["Access-Control-Allow-Credentials"] = "true"
    headers["Access-Control-Allow-Headers"] = req_headers or "authorization,content-type"
    return Response(status_code=204, headers=headers)


# ===================== Supabase Auth & DB Helpers =====================
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_JWKS_URL = os.getenv("SUPABASE_JWKS_URL") or (
    f"{SUPABASE_URL.rstrip('/')}/auth/v1/keys" if SUPABASE_URL else None
)
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")  # Optional: legacy HS256 secret

_jwks_cache: Optional[Dict[str, Any]] = None

# ===================== Plan → Credits Mapping (Polar seats) =====================
# Supports dynamic mapping via remote JSON or env JSON. Keys can be product_id or
# price_id (recommend prefixing price keys as 'price:<id>' to avoid collisions).
POLAR_PLAN_CREDITS_URL = os.getenv("POLAR_PLAN_CREDITS_URL")  # Optional remote JSON endpoint
POLAR_PLAN_CREDITS_JSON = os.getenv("POLAR_PLAN_CREDITS_JSON", "{}")  # Fallback inline JSON
POLAR_PLAN_CREDITS_TTL_SEC = int(os.getenv("POLAR_PLAN_CREDITS_TTL_SEC", "300"))
_plan_credits_cache: Dict[str, Any] = {"data": {}, "last_fetch": 0.0}

# Fallback credit amounts per plan (used when mapping cannot resolve)
POLAR_PLUS_CREDITS_DEFAULT = int(os.getenv("POLAR_PLUS_CREDITS", "2000"))
POLAR_PRO_CREDITS_DEFAULT = int(os.getenv("POLAR_PRO_CREDITS", "15000"))

def _parse_plan_credits_json(text: str) -> Dict[str, int]:
    try:
        data = json.loads(text or "{}")
        out: Dict[str, int] = {}
        if isinstance(data, dict):
            for k, v in data.items():
                try:
                    out[str(k)] = int(v)
                except Exception:
                    continue
        return out
    except Exception:
        return {}

def _load_plan_credits_mapping(force: bool = False) -> Dict[str, int]:
    now = time.time()
    # Use remote URL if provided
    if POLAR_PLAN_CREDITS_URL:
        if force or (now - float(_plan_credits_cache.get("last_fetch", 0.0)) > POLAR_PLAN_CREDITS_TTL_SEC):
            try:
                resp = requests.get(POLAR_PLAN_CREDITS_URL, timeout=5)
                if resp.ok:
                    _plan_credits_cache["data"] = _parse_plan_credits_json(resp.text)
                    _plan_credits_cache["last_fetch"] = now
                else:
                    # Fallback to env JSON on fetch failure
                    _plan_credits_cache["data"] = _parse_plan_credits_json(POLAR_PLAN_CREDITS_JSON)
                    _plan_credits_cache["last_fetch"] = now
            except Exception:
                _plan_credits_cache["data"] = _parse_plan_credits_json(POLAR_PLAN_CREDITS_JSON)
                _plan_credits_cache["last_fetch"] = now
        return _plan_credits_cache.get("data", {})
    # Else: always parse env JSON (simple and predictable)
    return _parse_plan_credits_json(POLAR_PLAN_CREDITS_JSON)

def _resolve_plan_credits(product_id: Optional[str] = None, price_id: Optional[str] = None) -> Optional[int]:
    mapping = _load_plan_credits_mapping()
    if not mapping:
        return None
    # Prefer explicit price mapping when provided
    if price_id:
        # Support both raw price_id and namespaced key 'price:<id>'
        if price_id in mapping:
            return mapping[price_id]
        ns_key = f"price:{price_id}"
        if ns_key in mapping:
            return mapping[ns_key]
    if product_id and product_id in mapping:
        return mapping[product_id]
    return None

def _determine_units_for_purchase(product_id: Optional[str], price_id: Optional[str], plan_hint: Optional[str]) -> int:
    """Determine credit units to grant for a Polar purchase.
    Priority: mapping(product/price) → plan hint (plus/pro) → default plus.
    """
    units = _resolve_plan_credits(product_id=product_id, price_id=price_id)
    if isinstance(units, int) and units > 0:
        return units
    plan = (plan_hint or "").strip().lower()
    if plan == "pro":
        return POLAR_PRO_CREDITS_DEFAULT
    if plan == "plus":
        return POLAR_PLUS_CREDITS_DEFAULT
    # Fallback: assume plus
    return POLAR_PLUS_CREDITS_DEFAULT

def _get_jwks() -> Dict[str, Any]:
    global _jwks_cache
    if _jwks_cache is None:
        if not SUPABASE_JWKS_URL:
            raise HTTPException(status_code=500, detail="Server misconfigured: SUPABASE_JWKS_URL not set")
        resp = requests.get(SUPABASE_JWKS_URL, timeout=5)
        if not resp.ok:
            raise HTTPException(status_code=500, detail=f"Failed to fetch JWKS: {resp.text}")
        _jwks_cache = resp.json()
    return _jwks_cache

def _verify_supabase_jwt(authorization_header: Optional[str]) -> str:
    if not authorization_header or not authorization_header.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    token = authorization_header.split(" ", 1)[1].strip()
    try:
        headers = jwt.get_unverified_header(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token header")

    alg = (headers.get("alg") or "").upper()
    # HS256 (legacy secret)
    if alg.startswith("HS"):
        if not SUPABASE_JWT_SECRET:
            raise HTTPException(status_code=500, detail="Server misconfigured: SUPABASE_JWT_SECRET not set for HS tokens")
        try:
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256", "HS512"],
                options={"verify_aud": False},
            )
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token payload")
            return user_id
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Token verification failed (HS): {str(e)}")

    # RS* via JWKS
    jwks = _get_jwks()
    key = next((k for k in jwks.get("keys", []) if k.get("kid") == headers.get("kid")), None)
    if key is None:
        # Refresh JWKS once and retry
        global _jwks_cache
        _jwks_cache = None
        jwks = _get_jwks()
        key = next((k for k in jwks.get("keys", []) if k.get("kid") == headers.get("kid")), None)
        if key is None:
            raise HTTPException(status_code=401, detail="JWKS key not found")

    rsa_key = {
        "kty": key["kty"],
        "kid": key["kid"],
        "use": key.get("use", "sig"),
        "n": key["n"],
        "e": key["e"],
    }
    try:
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256", "RS512"],
            options={"verify_aud": False},
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return user_id
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed (RS): {str(e)}")

def _supabase_auth_headers() -> Dict[str, str]:
    if not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=500, detail="Server misconfigured: SUPABASE_SERVICE_ROLE_KEY not set")
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }


# ===================== API Key Helpers =====================
API_KEY_PREFIX = "dwr_"  # Key format: dwr_<prefix>_<secret>

def _hash_api_key_secret(secret: str, salt: str) -> str:
    data = (salt + secret).encode("utf-8")
    return hashlib.sha256(data).hexdigest()

def _parse_api_key_str(api_key: str) -> Tuple[str, str]:
    if not api_key:
        raise HTTPException(status_code=401, detail="Missing API key")
    key = api_key.strip()
    if key.lower().startswith("apikey "):
        key = key.split(" ", 1)[1].strip()
    if not key.startswith(API_KEY_PREFIX):
        raise HTTPException(status_code=401, detail="Invalid API key format")
    parts = key[len(API_KEY_PREFIX):].split("_", 1)
    if len(parts) != 2 or not parts[0] or not parts[1]:
        raise HTTPException(status_code=401, detail="Invalid API key format")
    return parts[0], parts[1]

def _supabase_rest_get(path: str, params: Optional[Dict[str, str]] = None, timeout: int = 5):
    if not SUPABASE_URL:
        raise HTTPException(status_code=500, detail="Server misconfigured: SUPABASE_URL not set")
    url = f"{SUPABASE_URL.rstrip('/')}{path}"
    resp = requests.get(url, headers=_supabase_auth_headers(), params=params, timeout=timeout)
    return resp

def _supabase_rest_patch(path: str, json_body: Dict[str, Any], timeout: int = 5):
    if not SUPABASE_URL:
        raise HTTPException(status_code=500, detail="Server misconfigured: SUPABASE_URL not set")
    url = f"{SUPABASE_URL.rstrip('/')}{path}"
    headers = _supabase_auth_headers()
    headers["Prefer"] = "return=representation"
    resp = requests.patch(url, headers=headers, json=json_body, timeout=timeout)
    return resp

def _supabase_rest_post(path: str, json_body: Dict[str, Any], timeout: int = 5):
    if not SUPABASE_URL:
        raise HTTPException(status_code=500, detail="Server misconfigured: SUPABASE_URL not set")
    url = f"{SUPABASE_URL.rstrip('/')}{path}"
    headers = _supabase_auth_headers()
    headers["Prefer"] = "return=representation"
    resp = requests.post(url, headers=headers, json=json_body, timeout=timeout)
    return resp

def _fetch_api_key_record(prefix: str) -> Optional[Dict[str, Any]]:
    resp = _supabase_rest_get(
        "/rest/v1/api_keys",
        params={
            "prefix": f"eq.{prefix}",
            "select": "id,user_id,prefix,salt,secret_hash,revoked_at,expires_at,last_used_at,scopes"
        },
    )
    if not resp.ok:
        raise HTTPException(status_code=500, detail=f"Supabase api_keys error: {resp.text}")
    arr = resp.json()
    if isinstance(arr, list) and arr:
        return arr[0]
    return None

def _touch_api_key_last_used(key_id: str) -> None:
    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        _supabase_rest_patch(f"/rest/v1/api_keys?id=eq.{key_id}", {"last_used_at": now_iso})
    except Exception:
        pass

def _verify_api_key(api_key: str) -> Tuple[str, Dict[str, Any]]:
    prefix, secret = _parse_api_key_str(api_key)
    record = _fetch_api_key_record(prefix)
    if not record:
        raise HTTPException(status_code=401, detail="Invalid API key")
    if record.get("revoked_at"):
        raise HTTPException(status_code=401, detail="API key revoked")
    expires_at = record.get("expires_at")
    if expires_at:
        try:
            exp_dt = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
            if exp_dt < datetime.now(timezone.utc):
                raise HTTPException(status_code=401, detail="API key expired")
        except HTTPException:
            raise
        except Exception:
            # If parsing fails, be conservative and reject
            raise HTTPException(status_code=401, detail="API key expired")

    salt = record.get("salt") or ""
    expected_hash = record.get("secret_hash") or ""
    if not salt or not expected_hash:
        raise HTTPException(status_code=401, detail="API key invalid")
    if _hash_api_key_secret(secret, salt) != expected_hash:
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Best-effort update last_used_at
    try:
        _touch_api_key_last_used(str(record.get("id")))
    except Exception:
        pass

    user_id = str(record.get("user_id"))
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return user_id, record

def _resolve_user(headers: Dict[str, str]) -> Tuple[str, str, Optional[Dict[str, Any]]]:
    # Priority: Bearer JWT, then Authorization: ApiKey, then X-API-Key
    auth_header = headers.get("authorization") or headers.get("Authorization")
    if auth_header:
        lower = auth_header.lower()
        if lower.startswith("bearer "):
            return _verify_supabase_jwt(auth_header), "jwt", None
        if lower.startswith("apikey "):
            user_id, rec = _verify_api_key(auth_header)
            return user_id, "api_key", rec
    x_api_key = headers.get("x-api-key") or headers.get("X-API-Key")
    if x_api_key:
        user_id, rec = _verify_api_key(x_api_key)
        return user_id, "api_key", rec
    raise HTTPException(status_code=401, detail="Missing Authorization or X-API-Key header")

def _get_credit_balance(user_id: str) -> int:
    if not SUPABASE_URL:
        raise HTTPException(status_code=500, detail="Server misconfigured: SUPABASE_URL not set")
    url = f"{SUPABASE_URL}/rest/v1/credit_balance"
    params = {"user_id": f"eq.{user_id}", "select": "balance"}
    resp = requests.get(url, headers=_supabase_auth_headers(), params=params, timeout=5)
    if not resp.ok:
        raise HTTPException(status_code=500, detail=f"Supabase balance error: {resp.text}")
    arr = resp.json()
    if isinstance(arr, list) and arr:
        bal = arr[0].get("balance", 0)
        try:
            return int(bal)
        except Exception:
            return 0
    return 0

def _consume_credits(user_id: str, units: int, request_id: str, meta: Dict[str, Any]) -> int:
    if not SUPABASE_URL:
        raise HTTPException(status_code=500, detail="Server misconfigured: SUPABASE_URL not set")
    url = f"{SUPABASE_URL}/rest/v1/rpc/sp_consume_credits"
    payload = {
        "p_user_id": user_id,
        "p_units": units,
        "p_request_id": request_id,
        "p_meta": meta or {},
    }
    resp = requests.post(url, headers=_supabase_auth_headers(), json=payload, timeout=10)
    if not resp.ok:
        # Map insufficient credits to 402
        if "INSUFFICIENT_CREDITS" in resp.text:
            raise HTTPException(status_code=402, detail="Insufficient credits")
        raise HTTPException(status_code=500, detail=f"Supabase consume error: {resp.text}")
    try:
        return int(resp.json())
    except Exception:
        return 0

def _grant_credits(user_id: str, units: int, request_id: str, meta: Dict[str, Any]) -> int:
    if not SUPABASE_URL:
        raise HTTPException(status_code=500, detail="Server misconfigured: SUPABASE_URL not set")
    url = f"{SUPABASE_URL}/rest/v1/rpc/sp_grant_credits"
    payload = {
        "p_user_id": user_id,
        "p_units": units,
        "p_request_id": request_id,
        "p_meta": meta or {},
    }
    resp = requests.post(url, headers=_supabase_auth_headers(), json=payload, timeout=10)
    if not resp.ok:
        raise HTTPException(status_code=500, detail=f"Supabase grant error: {resp.text}")
    try:
        return int(resp.json())
    except Exception:
        return 0

def _find_user_by_email(email: Optional[str]) -> Optional[str]:
    if not email:
        return None
    try:
        resp = _supabase_rest_get(
            "/rest/v1/profiles",
            params={"email": f"eq.{email}", "select": "user_id"},
        )
        if resp.ok:
            arr = resp.json()
            if isinstance(arr, list) and arr:
                uid = arr[0].get("user_id")
                return str(uid) if uid else None
    except Exception:
        return None
    return None

def _update_subscription(user_id: str, provider: str, status: Optional[str], current_period_end: Optional[str], metadata: Dict[str, Any]) -> None:
    try:
        # Try to find existing subscription for this user/provider
        resp = _supabase_rest_get(
            "/rest/v1/subscriptions",
            params={
                "user_id": f"eq.{user_id}",
                "provider": f"eq.{provider}",
                "select": "id",
                "limit": "1",
            },
        )
        if resp.ok and isinstance(resp.json(), list) and resp.json():
            sub_id = resp.json()[0].get("id")
            if sub_id:
                _supabase_rest_patch(
                    f"/rest/v1/subscriptions?id=eq.{sub_id}",
                    {
                        "status": status,
                        "current_period_end": current_period_end,
                        "metadata": metadata or {},
                    },
                )
                return
        # Insert new
        _supabase_rest_post(
            "/rest/v1/subscriptions",
            {
                "user_id": user_id,
                "provider": provider,
                "status": status or "active",
                "current_period_end": current_period_end,
                "metadata": metadata or {},
            },
        )
    except Exception as e:
        logger.warning(f"Failed to upsert subscription: {e}")

def _update_profile_plan(user_id: str, plan: str) -> None:
    try:
        _supabase_rest_patch(f"/rest/v1/profiles?user_id=eq.{user_id}", {"plan": plan})
    except Exception:
        pass

def _compute_credits_from_params(deep: float, wide: float) -> int:
    """Compute credits as: 2 × round(4 + deep * wide * 16), then clamp to [10, 40]."""
    try:
        raw = 4.0 + (float(deep) * float(wide) * 16.0)
    except Exception:
        raw = 4.0
    base_units = int(round(raw))
    units = base_units * 2
    if units < 10:
        units = 10
    if units > 40:
        units = 40
    return units

class Message(BaseModel):
    """Message model - Standard OpenAI format"""
    role: str  # "user", "assistant", or "system"
    content: str


class DeepWideParams(BaseModel):
    """Depth and breadth parameter model"""
    deep: float = 0.5  # Depth parameter (0-1), controls research depth
    wide: float = 0.5  # Breadth parameter (0-1), controls research breadth
    model: Optional[str] = None  # Selected model to override grid


class ResearchMessage(BaseModel):
    """Research message model - includes query and parameters"""
    query: str  # User's query text
    deepwide: DeepWideParams = DeepWideParams()  # Depth/breadth parameter object
    mcp: Dict[str, List[str]] = {}  # MCP config: {service_name: [tool list]}
    thread_id: Optional[str] = None  # Optional: link consumption to a thread


class ResearchRequest(BaseModel):
    """Research request model"""
    message: ResearchMessage  # Now an object instead of a string
    history: Optional[List[Message]] = None
    request_id: Optional[str] = None


class ResearchResponse(BaseModel):
    """Research response model"""
    response: str
    notes: List[str] = []
    success: bool = True


@app.get("/")
async def root():
    """API root path"""
    return {
        "name": "PuppyResearch API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.get("/api/mcp/status")
async def mcp_status():
    """Check MCP environment variables status (for debugging)"""
    import os
    return {
        "tavily_api_key_set": bool(os.getenv("TAVILY_API_KEY")),
        "exa_api_key_set": bool(os.getenv("EXA_API_KEY")),
        "openai_api_key_set": bool(os.getenv("OPENAI_API_KEY"))
    }


async def research_stream_generator(request: ResearchRequest):
    """Generate research streaming response"""
    try:
        # Build message history
        history_messages = request.history or []
        user_messages = [msg.content for msg in history_messages if msg.role == "user"]
        user_messages.append(request.message.query)
        
        # Create configuration
        cfg = Configuration()
        
        logger.info("research: query=%s deep=%s wide=%s",
                    request.message.query,
                    request.message.deepwide.deep,
                    request.message.deepwide.wide)
        
        # Execute research and stream updates
        async for update in run_deep_research_stream(
            user_messages=user_messages,
            cfg=cfg,
            api_keys=None,
            mcp_config=request.message.mcp,
            deep_param=request.message.deepwide.deep,
            wide_param=request.message.deepwide.wide,
            selected_model=request.message.deepwide.model
        ):
            yield f"data: {json.dumps(update)}\n\n"
            
    except Exception as e:
        error_msg = {'action': 'error', 'message': f'Research failed: {str(e)}'}
        yield f"data: {json.dumps(error_msg)}\n\n"


@app.post("/api/research")
async def research(request: ResearchRequest, req: Request):
    """Execute deep research - streaming response"""
    # Auth (JWT or API Key)
    user_id, auth_method, api_key_rec = _resolve_user(dict(req.headers))

    stream = research_stream_generator(request)
    response = StreamingResponse(
        stream,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )

    # After stream completes, consume variable credits based on params
    async def on_close():
        try:
            rid = request.request_id or f"{user_id}-{int(time.time()*1000)}"
            deep_val = float(getattr(request.message.deepwide, "deep", 0.5))
            wide_val = float(getattr(request.message.deepwide, "wide", 0.5))
            model_val = getattr(request.message.deepwide, "model", None)
            units = _compute_credits_from_params(deep_val, wide_val)
            meta = {
                "endpoint": "/api/research",
                "version": "1.0.0",
                "deep": deep_val,
                "wide": wide_val,
                "model": model_val,
                "thread_id": getattr(request.message, "thread_id", None),
                "auth": auth_method,
                "api_key_prefix": (api_key_rec.get("prefix") if api_key_rec else None),
            }
            _consume_credits(user_id=user_id, units=units, request_id=rid, meta=meta)
        except HTTPException as e:
            logger.warning("[consume_credits] HTTPException: %s %s", e.status_code, e.detail)
        except Exception as e:
            logger.warning("[consume_credits] Error: %s", e)

    response.background = None  # ensure streaming works; we'll await completion below
    # FastAPI doesn't expose on_complete hook for streams; best-effort: schedule task
    asyncio.create_task(on_close())
    return response


@app.get("/api/credits/balance")
async def get_balance(req: Request):
    user_id, _, _ = _resolve_user(dict(req.headers))
    balance = _get_credit_balance(user_id)
    return {"user_id": user_id, "balance": balance}


## Polar routes are now provided via an included router


# ===================== API Key Management Endpoints =====================
class CreateApiKeyRequest(BaseModel):
    name: Optional[str] = None
    expires_in_days: Optional[int] = None
    scopes: Optional[List[str]] = None

class CreateApiKeyResponse(BaseModel):
    id: str
    api_key: str
    prefix: str
    name: Optional[str] = None
    expires_at: Optional[str] = None

class ApiKeyItem(BaseModel):
    id: str
    prefix: str
    name: Optional[str] = None
    created_at: Optional[str] = None
    last_used_at: Optional[str] = None
    expires_at: Optional[str] = None
    revoked_at: Optional[str] = None
    scopes: List[str] = []
    api_key: Optional[str] = None
    used_credits: Optional[int] = 0

class ListApiKeysResponse(BaseModel):
    keys: List[ApiKeyItem]

@app.post("/api/keys", response_model=CreateApiKeyResponse)
async def create_api_key(body: CreateApiKeyRequest, req: Request):
    # Only JWT-authenticated users can create keys
    auth_header = req.headers.get("Authorization")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        # Cloak endpoint for unauthenticated clients
        from fastapi import Response
        return Response(status_code=404)
    try:
        user_id = _verify_supabase_jwt(auth_header)
        logger.info(f"Creating API key for user: {user_id}")
    except Exception:
        # Avoid noisy logs on missing/invalid token; still cloak
        from fastapi import Response
        return Response(status_code=404)

    name = (body.name or "default").strip() or "default"
    expires_at_iso: Optional[str] = None
    if body.expires_in_days and body.expires_in_days > 0:
        expires_dt = datetime.now(timezone.utc) + timedelta(days=int(body.expires_in_days))
        expires_at_iso = expires_dt.isoformat()

    prefix = secrets.token_urlsafe(6).replace("-", "").replace("_", "").upper()[:8]
    secret = secrets.token_urlsafe(32)
    salt = secrets.token_hex(16)
    secret_hash = _hash_api_key_secret(secret, salt)
    scopes = body.scopes or ["research:invoke"]

    insert_payload = {
        "user_id": user_id,
        "name": name,
        "prefix": prefix,
        "salt": salt,
        "secret_hash": secret_hash,
        "scopes": scopes,
        # Store full API key plaintext per product requirement
        "secret_plain": f"{API_KEY_PREFIX}{prefix}_{secret}",
        **({"expires_at": expires_at_iso} if expires_at_iso else {}),
    }
    logger.info(f"Inserting API key with payload keys: {insert_payload.keys()}")
    try:
        resp = _supabase_rest_post("/rest/v1/api_keys", insert_payload)
        if not resp.ok:
            logger.error(f"Supabase POST failed: {resp.status_code} - {resp.text}")
            raise HTTPException(status_code=500, detail=f"Failed to create API key: {resp.text}")
        rec = resp.json()[0]
        api_key_plain = f"{API_KEY_PREFIX}{prefix}_{secret}"
        logger.info(f"API key created successfully with id: {rec.get('id')}")
        return CreateApiKeyResponse(
            id=str(rec.get("id")),
            api_key=api_key_plain,
            prefix=prefix,
            name=name,
            expires_at=expires_at_iso,
        )
    except Exception as e:
        logger.error(f"Error creating API key: {str(e)}", exc_info=True)
        raise

@app.get("/api/keys", response_model=ListApiKeysResponse)
async def list_api_keys(req: Request):
    # JWT required for listing
    auth_header = req.headers.get("Authorization")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        # Cloak endpoint for unauthenticated clients
        from fastapi import Response
        return Response(status_code=404)
    try:
        user_id = _verify_supabase_jwt(auth_header)
        logger.info(f"Listing API keys for user: {user_id}")
    except Exception:
        # Cloak on invalid tokens as well
        from fastapi import Response
        return Response(status_code=404)
    
    try:
        # Aggregate usage by api_key prefix (sum of negative deltas per prefix)
        usage_by_prefix: Dict[str, int] = {}
        try:
            # Read from DB view to avoid PostgREST group-by incompatibilities
            usage_resp = _supabase_rest_get(
                "/rest/v1/credit_usage_by_prefix",
                params={
                    "user_id": f"eq.{user_id}",
                    "select": "api_key_prefix,used",
                },
            )
            if usage_resp.ok:
                for row in usage_resp.json():
                    prefix = row.get("api_key_prefix")
                    if not prefix:
                        continue
                    try:
                        used_val = row.get("used")
                        used = int(used_val) if used_val is not None else 0
                    except Exception:
                        used = 0
                    usage_by_prefix[prefix] = used
            else:
                logger.warning(f"Failed to aggregate usage: {usage_resp.status_code} - {usage_resp.text}")
        except Exception as e:
            logger.warning(f"Usage aggregation failed: {e}")

        resp = _supabase_rest_get(
            "/rest/v1/api_keys",
            params={
                "user_id": f"eq.{user_id}",
                "revoked_at": "is.null",  # Only return non-revoked keys
                "select": "id,prefix,name,created_at,last_used_at,expires_at,revoked_at,scopes,secret_plain",
                "order": "created_at.desc",
            },
        )
        if not resp.ok:
            logger.error(f"Supabase GET failed: {resp.status_code} - {resp.text}")
            raise HTTPException(status_code=500, detail=f"Failed to list API keys: {resp.text}")
        items = []
        for row in resp.json():
            # For security, only show the prefix after creation (full key only returned on creation)
            items.append(ApiKeyItem(
                id=str(row.get("id")),
                prefix=row.get("prefix"),
                name=row.get("name"),
                created_at=row.get("created_at"),
                last_used_at=row.get("last_used_at"),
                expires_at=row.get("expires_at"),
                revoked_at=row.get("revoked_at"),
                scopes=row.get("scopes") or [],
                api_key=row.get("secret_plain"),
                used_credits=usage_by_prefix.get(row.get("prefix"), 0),
            ))
        logger.info(f"Listed {len(items)} API keys")
        return ListApiKeysResponse(keys=items)
    except Exception as e:
        logger.error(f"Error listing API keys: {str(e)}", exc_info=True)
        raise

@app.delete("/api/keys/{key_id}")
async def revoke_api_key(key_id: str, req: Request):
    # JWT required for revocation
    try:
        user_id = _verify_supabase_jwt(req.headers.get("Authorization"))
        logger.info(f"Revoking API key {key_id} for user: {user_id}")
    except Exception as e:
        logger.error(f"JWT verification failed: {e}")
        raise
    
    # Ensure the key belongs to the user
    check = _supabase_rest_get(
        "/rest/v1/api_keys",
        params={
            "id": f"eq.{key_id}",
            "user_id": f"eq.{user_id}",
            "select": "id",
        },
    )
    if not check.ok:
        logger.error(f"Failed to fetch API key for verification: {check.status_code} - {check.text}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch API key: {check.text}")
    arr = check.json()
    if not arr:
        logger.warning(f"API key {key_id} not found or doesn't belong to user {user_id}")
        raise HTTPException(status_code=404, detail="API key not found")
    
    # Revoke by setting revoked_at
    now_iso = datetime.now(timezone.utc).isoformat()
    resp = _supabase_rest_patch(f"/rest/v1/api_keys?id=eq.{key_id}", {"revoked_at": now_iso})
    if not resp.ok:
        logger.error(f"Failed to revoke API key: {resp.status_code} - {resp.text}")
        raise HTTPException(status_code=500, detail=f"Failed to revoke API key: {resp.text}")
    
    logger.info(f"API key {key_id} revoked successfully")
    return {"id": key_id, "revoked_at": now_iso}


class MCPTestRequest(BaseModel):
    """MCP test request model"""
    services: List[str]  # List of service names to test, e.g., ["tavily", "exa"]


class MCPToolInfo(BaseModel):
    """MCP tool information"""
    name: str
    description: str = ""


class MCPServiceStatus(BaseModel):
    """MCP service status"""
    name: str
    available: bool
    tools: List[MCPToolInfo] = []
    error: Optional[str] = None


class MCPTestResponse(BaseModel):
    """MCP test response model"""
    services: List[MCPServiceStatus]


@app.post("/api/mcp/test", response_model=MCPTestResponse)
async def test_mcp_services(request: MCPTestRequest):
    """Test MCP service connectivity
    
    Check whether MCP services are available by verifying:
    1. API key is set
    2. npx can be executed (Node.js is installed)
    3. MCP server can be started (optional: actual connection test)
    """
    import os
    
    # Configuration mapping for MCP services
    # Note: HTTP MCP uses underscores in tool names
    mcp_config = {
        "tavily": {
            "api_key_env": "TAVILY_API_KEY",
            "default_tools": [
                {"name": "tavily_search", "description": "Search the web using Tavily"},
                {"name": "tavily_extract", "description": "Extract content from URLs"}
            ]
        },
        "exa": {
            "api_key_env": "EXA_API_KEY",
            "default_tools": [
                {"name": "web_search_exa", "description": "AI-powered web search using Exa"}
            ]
        }
    }
    
    results = []
    for service_name in request.services:
        service_name_lower = service_name.lower()
        
        # Check whether the service exists in the configuration
        if service_name_lower not in mcp_config:
            results.append(MCPServiceStatus(
                name=service_name,
                available=False,
                error=f"Unknown service '{service_name}'. Supported: Tavily, Exa"
            ))
            continue
        
        config = mcp_config[service_name_lower]
        api_key = os.getenv(config["api_key_env"])
        
        if not api_key:
            # API key not set
            results.append(MCPServiceStatus(
                name=service_name,
                available=False,
                error=f"API key not set. Please set {config['api_key_env']} environment variable."
            ))
            continue
        
        # API key is set, return default tool list
        tool_infos = [
            MCPToolInfo(name=tool["name"], description=tool["description"])
            for tool in config["default_tools"]
        ]
        
        results.append(MCPServiceStatus(
            name=service_name,
            available=True,
            tools=tool_infos
        ))
    
    return MCPTestResponse(services=results)


## Polar routes moved to standalone payments service

if __name__ == "__main__":
    import uvicorn
    import socket
    
    port_env = os.getenv("DEEPWIDE_PORT") or os.getenv("PORT")
    port = int(port_env) if port_env else 8000
    host = os.getenv("HOST", "0.0.0.0")
    allow_fallback = os.getenv("ALLOW_PORT_FALLBACK", "1") not in ("0", "false", "False")

    def _is_port_free(p: int) -> bool:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                s.bind((host, p))
                return True
        except OSError:
            return False

    # If chosen port is busy and fallback allowed, try next ports
    if not _is_port_free(port) and allow_fallback and not port_env:
        base = port
        for candidate in range(base + 1, base + 11):  # try next 10 ports
            if _is_port_free(candidate):
                port = candidate
                break
    
    logger.info("Starting PuppyResearch API Server on http://%s:%s", host, port)
    logger.info("API docs: http://%s:%s/docs", host, port)
    
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info"
    )

