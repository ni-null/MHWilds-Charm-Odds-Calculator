import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

import { fileURLToPath } from "url"
import { dirname, resolve } from "path"

const repoName = "MHWilds-Charm-Odds-Calculator"

export default defineConfig(() => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(dirname(fileURLToPath(import.meta.url)), "src"),
    },
  },
  base: `/${repoName}/`,
  build: {
    outDir: "docs",
    emptyOutDir: true,
  },
}))
