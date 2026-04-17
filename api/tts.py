from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
import json
import asyncio

import edge_tts


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

DEFAULT_VOICE = "en-US-AvaNeural"


async def synthesize_speech(text: str, voice: str, rate: str, volume: str) -> bytes:
    communicate = edge_tts.Communicate(text, voice, rate=rate, volume=volume)
    audio_chunks = []

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_chunks.append(chunk["data"])

    return b"".join(audio_chunks)


class handler(BaseHTTPRequestHandler):
    def end_cors_headers(self) -> None:
        for key, value in CORS_HEADERS.items():
            self.send_header(key, value)

    def send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.end_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.end_cors_headers()
        self.end_headers()

    def do_GET(self) -> None:
        self.handle_tts("GET")

    def do_POST(self) -> None:
        self.handle_tts("POST")

    def handle_tts(self, method: str) -> None:
        try:
            if method == "POST":
                content_length = int(self.headers.get("Content-Length", "0"))
                raw_body = self.rfile.read(content_length) if content_length > 0 else b"{}"
                payload = json.loads(raw_body.decode("utf-8") or "{}")
                text = str(payload.get("text", "")).strip()
                voice = str(payload.get("voice", DEFAULT_VOICE)).strip() or DEFAULT_VOICE
                rate = str(payload.get("rate", "+0%")).strip() or "+0%"
                volume = str(payload.get("volume", "+0%")).strip() or "+0%"
            else:
                query = parse_qs(urlparse(self.path).query)
                text = query.get("text", [""])[0].strip()
                voice = query.get("voice", [DEFAULT_VOICE])[0].strip() or DEFAULT_VOICE
                rate = query.get("rate", ["+0%"])[0].strip() or "+0%"
                volume = query.get("volume", ["+0%"])[0].strip() or "+0%"

            if not text:
                self.send_json(400, {"error": "Missing text parameter"})
                return

            audio_data = asyncio.run(synthesize_speech(text, voice, rate, volume))

            self.send_response(200)
            self.end_cors_headers()
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Disposition", "attachment; filename=tts.mp3")
            self.send_header("Content-Type", "audio/mpeg")
            self.send_header("Content-Length", str(len(audio_data)))
            self.end_headers()
            self.wfile.write(audio_data)
        except Exception as error:
            self.send_json(500, {"error": str(error)})
