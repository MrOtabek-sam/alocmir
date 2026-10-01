import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

// On Vercel, Nitro detects the platform and emits a Vercel build automatically.
// Elsewhere it builds a Node server in .output/ (run with `npm start`).
export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [tanstackStart({ server: { entry: "server" } }), nitro(), react(), tailwindcss()],
});
