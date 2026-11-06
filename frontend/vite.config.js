import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' ? '/Mediasaver/' : '/',
  plugins: [
    react(),
    {
      name: 'github-pages-spa-fallback',
      apply: 'build',
      closeBundle() {
        const outputDirectory = resolve(process.cwd(), 'dist')
        copyFileSync(
          resolve(outputDirectory, 'index.html'),
          resolve(outputDirectory, '404.html'),
        )
      },
    },
  ],
})
