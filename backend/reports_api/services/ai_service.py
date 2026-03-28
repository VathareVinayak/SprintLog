import json
import os
from urllib import error, request


OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "openrouter/auto"
AI_TIMEOUT_SECONDS = 20
FALLBACK_SUMMARY = "AI summary could not be generated for this report range."
FALLBACK_HIGHLIGHTS = [
    "AI highlights are unavailable right now.",
]


def _fallback_response():
    return {
        "summary": FALLBACK_SUMMARY,
        "highlights": FALLBACK_HIGHLIGHTS,
    }


def _normalize_content(content):
    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict):
                text = item.get("text")
                if text:
                    parts.append(str(text))
            elif isinstance(item, str):
                parts.append(item)
        return "\n".join(parts).strip()

    return ""


def _strip_code_fences(text):
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    return cleaned.strip()


def generate_report_summary(user, start_date, end_date, grouped_reports):
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        return _fallback_response()

    prompt = {
        "user": {
            "username": user.username,
            "full_name": getattr(user, "full_name", ""),
            "email": user.email,
        },
        "date_range": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
        },
        "reports": grouped_reports,
        "instruction": (
            "Generate a concise professional summary and 3 to 5 key highlights. "
            "Return valid JSON only with keys summary and highlights."
        ),
    }

    payload = {
        "model": OPENROUTER_MODEL,
        "temperature": 0.2,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are an assistant that summarizes daily work logs. "
                    "Return valid JSON with keys summary and highlights."
                ),
            },
            {
                "role": "user",
                "content": json.dumps(prompt),
            },
        ],
    }

    req = request.Request(
        OPENROUTER_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=AI_TIMEOUT_SECONDS) as response:
            body = json.loads(response.read().decode("utf-8"))
    except (error.URLError, TimeoutError, OSError, json.JSONDecodeError):
        return _fallback_response()

    choices = body.get("choices") or []
    if not choices:
        return _fallback_response()

    message = choices[0].get("message") or {}
    raw_content = _normalize_content(message.get("content"))
    if not raw_content:
        return _fallback_response()

    cleaned_content = _strip_code_fences(raw_content)

    try:
        parsed = json.loads(cleaned_content)
    except json.JSONDecodeError:
        return {
            "summary": cleaned_content,
            "highlights": FALLBACK_HIGHLIGHTS,
        }

    summary = str(parsed.get("summary") or "").strip()
    highlights = parsed.get("highlights") or []

    if not isinstance(highlights, list):
        highlights = FALLBACK_HIGHLIGHTS

    cleaned_highlights = [str(item).strip() for item in highlights if str(item).strip()]

    return {
        "summary": summary or FALLBACK_SUMMARY,
        "highlights": cleaned_highlights or FALLBACK_HIGHLIGHTS,
    }
