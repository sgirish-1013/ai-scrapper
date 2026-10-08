import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_CHARS = 12000;
const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[?::1\]?$)/i;

function validateUrl(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(u.protocol)) return null;
  if (PRIVATE_HOST.test(u.hostname)) return null;
  return u;
}

async function scrape(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; AISummarizer/1.0)" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Page returned status ${res.status}`);
  const type = res.headers.get("content-type") || "";
  if (!type.includes("text/html")) throw new Error("URL is not an HTML page");

  const $ = cheerio.load(await res.text());
  $("script, style, noscript, nav, footer, header, aside, form, iframe, svg").remove();

  const title = $("title").first().text().trim();
  const root = $("article").first().length ? $("article").first()
             : $("main").first().length ? $("main").first()
             : $("body");

  const text = root.text().replace(/\s+/g, " ").trim().slice(0, MAX_CHARS);
  return { title, text };
}

async function summarize(text) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY.trim()}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b",
      reasoning_effort: "low",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: "Summarize the webpage text in 3-5 concise sentences. Plain text only.",
        },
        { role: "user", content: text },
      ],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Groq ${res.status}: ${data?.error?.message || "request failed"}`);
  }
  return data.choices?.[0]?.message?.content?.trim() || "";
}

export async function POST(req) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "Server is missing GROQ_API_KEY" }, { status: 500 });
    }
    const { url } = await req.json();
    const parsed = validateUrl(url);
    if (!parsed) {
      return NextResponse.json({ error: "Please enter a valid public http(s) URL" }, { status: 400 });
    }

    const { title, text } = await scrape(parsed.href);
    if (text.length < 50) {
      return NextResponse.json({ error: "Couldn't find enough text on that page" }, { status: 422 });
    }

    const summary = await summarize(text);
    return NextResponse.json({ title, summary });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to summarize" }, { status: 500 });
  }
}
