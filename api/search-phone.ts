import type { VercelRequest, VercelResponse } from '@vercel/node';
import { performLiveSearch } from './liveSearchService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const rawQuery = Array.isArray(req.query.query) ? req.query.query[0] : req.query.query || '';
    const sanitizedQuery = rawQuery.replace(/[\r\n\0]/g, '').trim();

    if (!sanitizedQuery) {
      res.status(400).json({ error: 'Missing query parameter' });
      return;
    }

    const cappedQuery = sanitizedQuery.length > 150 ? sanitizedQuery.slice(0, 150) : sanitizedQuery;

    const searchQuery = cappedQuery.toLowerCase().includes('police') || cappedQuery.toLowerCase().includes('sheriff')
      ? cappedQuery
      : `${cappedQuery} police non emergency phone number`;

    const result = await performLiveSearch(searchQuery);

    res.status(200).json(result);
  } catch (err: any) {
    console.error('Error in live search serverless function:', err);
    res.status(500).json({ error: 'Failed to complete search request.' });
  }
}
