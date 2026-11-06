import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // A API em C# (dotnet run --launch-profile http) responde em localhost:5095.
    // O Vite repassa para ela tudo que começa com /api (dados) e /uploads (fotos).
    proxy: {
      '/api': 'http://localhost:5095',
      '/uploads': 'http://localhost:5095',
    },
  },
})
