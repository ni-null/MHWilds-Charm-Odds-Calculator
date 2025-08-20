import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

const repoName = "MHWilds-Charm-Odds-Calculator"

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "development" ? "/" : `/${repoName}/`,
  build: {
    outDir: "docs",
    emptyOutDir: true,
  },
}))
