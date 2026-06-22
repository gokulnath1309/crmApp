import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Note on React 19 / Recharts Compatibility:
// Recharts depends internally on "react-is" to identify react elements.
// Under React 19, "react-is" is not resolved automatically by some package managers,
// causing a bundler crash: Failed to resolve import "react-is" from "recharts.js".
// Fix: We explicitly installed "react-is" in package.json and cleared Vite's .vite cache folder.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
