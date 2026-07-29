import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // @lovable.dev/mcp-js 0.25 emits an invalid absolute npm: import on
  // Windows. Lovable/Linux builds keep the generated function up to date;
  // Windows contributors use the committed generated file.
  const canGenerateMcp = process.platform !== "win32";

  return {
    server: {
      // Lovable proxies the Linux dev server from outside its sandbox.
      // Keep Windows local-only while allowing that proxy to reach Vite.
      host: process.platform === "win32" ? "127.0.0.1" : "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      canGenerateMcp && mcpPlugin(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
  };
});
