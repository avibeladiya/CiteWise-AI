import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { AuthProvider } from "@/lib/auth/provider";
import { useUIStore } from "@/store/ui";
import appCss from "../styles.css?url";

const APP_NAME = "CiteWise AI";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Upload a document. Ask a question. Every answer is grounded in the source — page, quote, and claim aligned.",
      },
      { name: "theme-color", content: "#0b0c0e" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Outfit:wght@400;500;600&display=swap",
      },
    ],
  }),
  component: Root,
});

function ThemedToaster() {
  const dark = useUIStore((s) => s.dark);
  return (
    <Toaster
      theme={dark ? "dark" : "light"}
      position="bottom-right"
      toastOptions={{
        className: "font-sans",
        style: {
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          color: "var(--color-fg)",
        },
      }}
    />
  );
}

function Root() {
  return (
    <html lang="en" className="dark antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-fg min-h-dvh">
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
          <ThemedToaster />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
