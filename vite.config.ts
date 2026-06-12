import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(
        __dirname, 
        "./artifacts/mohalla/src"
      ),
    },
  },
  build: {
    outDir: "artifacts/mohalla/dist",
    rollupOptions: {
      input: "./artifacts/mohalla/index.html"
    }
  },
  base: "/",
  root: "./artifacts/mohalla",
})
