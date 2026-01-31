import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        proxy: {
            // Proxy API requests to Canton participant node in development
            '/v2': {
                target: 'http://localhost:7575',
                changeOrigin: true,
            },
        },
    },
})
