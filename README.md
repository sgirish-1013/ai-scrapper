# AI Page Summarizer

Paste a URL, get a short AI summary. Built with Next.js (frontend + API route in one app), Cheerio for scraping, and the free Groq API (Llama 3.1) for summarization.

## Structure

- `app/page.js` - frontend (input, button, loading state, result)
- `app/api/summarize/route.js` - backend endpoint: validates URL, scrapes HTML, calls Groq

## Run locally

Frontend and backend run together as one Next.js app.

1. Get a free API key at https://console.groq.com/keys
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the **project root** (same folder as `package.json`):
   ```
   GROQ_API_KEY=your_key_here
   ```
   (See `.env.example`.)
4. Start the app:
   ```bash
   npm run dev
   ```
5. Open http://localhost:3000

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Import it at https://vercel.com/new.
3. Add `GROQ_API_KEY` under Settings > Environment Variables.
4. Deploy.

## Notes

- Only static HTML is scraped (no JavaScript rendering).
- Text is capped at 12,000 characters before being sent to the AI.
- Localhost and private IPs are blocked to prevent SSRF.
