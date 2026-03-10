import hashlib
import base64
import os
import time
import httpx
from datetime import datetime, timedelta
from typing import Tuple

from app.core.config import settings

CANVA_AUTH_URL = "https://www.canva.com/api/oauth/authorize"
CANVA_TOKEN_URL = "https://api.canva.com/rest/v1/oauth/token"
CANVA_IMPORT_URL = "https://api.canva.com/rest/v1/imports"
CANVA_DESIGNS_URL = "https://api.canva.com/rest/v1/designs"


def _generate_code_verifier() -> str:
    """Generate a random PKCE code verifier (64 url-safe bytes)."""
    return base64.urlsafe_b64encode(os.urandom(64)).rstrip(b"=").decode()


def _generate_code_challenge(verifier: str) -> str:
    """Derive S256 code challenge from verifier."""
    digest = hashlib.sha256(verifier.encode()).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode()


def build_auth_url(user_id: str) -> Tuple[str, str]:
    """
    Build the Canva OAuth authorization URL.
    Returns (auth_url, code_verifier) — caller must persist the verifier.
    """
    verifier = _generate_code_verifier()
    challenge = _generate_code_challenge(verifier)
    params = {
        "client_id": settings.CANVA_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": settings.CANVA_REDIRECT_URI,
        "scope": "design:content:write",
        "state": str(user_id),
        "code_challenge": challenge,
        "code_challenge_method": "S256",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return f"{CANVA_AUTH_URL}?{query}", verifier


def exchange_code(code: str, verifier: str) -> Tuple[str, str, datetime]:
    """
    Exchange an authorization code + PKCE verifier for tokens.
    Returns (access_token, refresh_token, expires_at).
    """
    resp = httpx.post(
        CANVA_TOKEN_URL,
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": settings.CANVA_REDIRECT_URI,
            "code_verifier": verifier,
            "client_id": settings.CANVA_CLIENT_ID,
            "client_secret": settings.CANVA_CLIENT_SECRET,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()
    expires_at = datetime.utcnow() + timedelta(seconds=data.get("expires_in", 3600))
    return data["access_token"], data.get("refresh_token", ""), expires_at


def refresh_access_token(refresh_token: str) -> Tuple[str, str, datetime]:
    """
    Refresh an expired access token.
    Returns (new_access_token, new_refresh_token, new_expires_at).
    """
    resp = httpx.post(
        CANVA_TOKEN_URL,
        data={
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": settings.CANVA_CLIENT_ID,
            "client_secret": settings.CANVA_CLIENT_SECRET,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()
    expires_at = datetime.utcnow() + timedelta(seconds=data.get("expires_in", 3600))
    return data["access_token"], data.get("refresh_token", refresh_token), expires_at


def import_pptx(access_token: str, pptx_bytes: bytes, filename: str) -> str:
    """
    Upload a PPTX file to Canva and return the edit URL.
    Polls until the import job completes (up to 60 seconds).
    """
    # Start the import job
    resp = httpx.post(
        CANVA_IMPORT_URL,
        content=pptx_bytes,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "Import-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "Name": filename,
        },
        timeout=30,
    )
    resp.raise_for_status()
    import_data = resp.json()
    import_id = import_data.get("job", {}).get("id") or import_data.get("id")

    if not import_id:
        raise ValueError(f"Canva import did not return a job ID: {import_data}")

    # Poll for completion
    poll_url = f"{CANVA_IMPORT_URL}/{import_id}"
    for _ in range(30):  # up to ~60s (30 * 2s)
        time.sleep(2)
        poll_resp = httpx.get(
            poll_url,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=15,
        )
        poll_resp.raise_for_status()
        poll_data = poll_resp.json()
        job = poll_data.get("job", poll_data)
        status = job.get("status")

        if status == "success":
            design_id = job.get("result", {}).get("design", {}).get("id")
            if not design_id:
                raise ValueError(f"Canva import succeeded but no design ID returned: {poll_data}")
            return f"https://www.canva.com/design/{design_id}/edit"

        if status == "failed":
            raise RuntimeError(f"Canva import failed: {job.get('error', poll_data)}")

    raise TimeoutError("Canva import timed out after 60 seconds")
