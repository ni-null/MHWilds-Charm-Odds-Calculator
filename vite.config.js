import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

const repoName = "SPDX-Operation-Manual"

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "development" ? "/" : `/${repoName}/`,
  build: {
    outDir: "docs",
    emptyOutDir: true,
  },
}))
