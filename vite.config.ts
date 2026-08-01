import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { performLiveSearch } from './api/liveSearchService.js';

function livePhoneSearchPlugin(): Plugin {
  return {
    name: 'live-phone-search-api',
    configureServer(server) {
      server.middlewares.use('/api/search-phone', async (req, res) => {
        try {
          const reqUrl = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
          let rawQuery = reqUrl.searchParams.get('query') || '';

          rawQuery = rawQuery.replace(/[\r\n\0]/g, '').trim();

          if (!rawQuery) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing query parameter' }));
            return;
          }

          if (rawQuery.length > 150) {
            rawQuery = rawQuery.slice(0, 150);
          }

          const searchQuery = rawQuery.toLowerCase().includes('police') || rawQuery.toLowerCase().includes('sheriff')
            ? rawQuery
            : `${rawQuery} police non emergency phone number`;

          const result = await performLiveSearch(searchQuery);

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
        } catch (err: any) {
          console.error('Error in live search plugin:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Failed to complete search request.' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), livePhoneSearchPlugin()],
});
