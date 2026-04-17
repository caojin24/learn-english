const UPSTREAM_TTS_URL = "http://101.43.4.79:8080/tts";
const DEFAULT_VOICE = "en-US-AvaNeural";

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const text = typeof req.query?.text === "string" ? req.query.text.trim() : "";
  const voice = typeof req.query?.voice === "string" ? req.query.voice.trim() : DEFAULT_VOICE;

  if (!text) {
    res.status(400).json({ error: "Missing text parameter" });
    return;
  }

  try {
    const upstreamUrl = new URL(UPSTREAM_TTS_URL);
    upstreamUrl.searchParams.set("text", text);
    upstreamUrl.searchParams.set("voice", voice || DEFAULT_VOICE);

    const upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        Accept: "audio/mpeg,audio/*;q=0.9,*/*;q=0.1",
      },
    });

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text();
      res.status(upstreamResponse.status).json({
        error: "Upstream TTS request failed",
        details: errorText.slice(0, 500),
      });
      return;
    }

    const arrayBuffer = await upstreamResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", upstreamResponse.headers.get("content-type") ?? "audio/mpeg");

    const contentDisposition = upstreamResponse.headers.get("content-disposition");
    if (contentDisposition) {
      res.setHeader("Content-Disposition", contentDisposition);
    }

    res.status(200).send(buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown TTS error";
    res.status(500).json({ error: "TTS proxy failed", details: message });
  }
}
