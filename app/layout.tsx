import type { Metadata, Viewport } from "next";
import "./globals.css";

const appName = "Lamia Learn English";

export const metadata: Metadata = {
  title: {
    default: appName,
    template: `%s | ${appName}`
  },
  description: "Aplikasi mobile-first untuk belajar bahasa Inggris anak: Reading, Listening, Grammar, kuis, progres, dan laporan nilai.",
  applicationName: appName,
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" }
    ],
    shortcut: "/favicon.svg",
    apple: "/icon.svg"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0A7C6E"
};

const themeScript = `
(function(){
  try {
    var saved = localStorage.getItem('lamia-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved === 'dark' || saved === 'light' ? saved : (prefersDark ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
  } catch (_) {
    document.documentElement.dataset.theme = 'light';
  }
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
