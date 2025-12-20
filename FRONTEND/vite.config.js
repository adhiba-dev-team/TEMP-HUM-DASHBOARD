import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          mui: [
            '@mui/material',
            '@mui/icons-material',
            '@mui/x-charts',
            '@mui/x-date-pickers',
          ],
          utils: ['axios', 'dayjs', 'date-fns'],
        },
      },
    },
  },
});
