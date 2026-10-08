import "./globals.css";

export const metadata = {
  title: "AI Page Summarizer",
  description: "Paste a URL, get a summary.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
