import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// export default defineConfig({
// plugins: [react()],
// })

export default defineConfig({
  plugins: [react()],

  server: {

    historyApiFallback: true,

    allowedHosts: [
      '.trycloudflare.com'
    ],

    proxy: {
        '/api': {
            target: 'http://localhost:3000',
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/api/, ''),
        },

        '/socket.io': {
            target: 'http://localhost:3000',
            changeOrigin: true,
            secure: false,
            ws: true,
        },
    },
  },

  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./pruebas/widget/setup.js",
    include: ["pruebas/widget/**/*.test.{js,jsx}"]
  },
})