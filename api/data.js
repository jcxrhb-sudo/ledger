// Vercel Serverless Function - Gist API proxy
const GIST_ID = '7d1cff234801611561c8c1c3dfcac144';
const FILE_NAME = 'ledger-data.json';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ error: 'Token not configured' });

  const headers = { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Vercel-Ledger' };
  const gistUrl = 'https://api.github.com/gists/' + GIST_ID;

  try {
    if (req.method === 'GET') {
      const resp = await fetch(gistUrl, { headers });
      const gist = await resp.json();
      const content = gist.files && gist.files[FILE_NAME] && gist.files[FILE_NAME].content;
      if (!content) return res.status(200).json({ persons: [], records: [] });
      return res.status(200).json(JSON.parse(content));
    }
    if (req.method === 'POST') {
      const body = JSON.stringify({ files: { [FILE_NAME]: { content: JSON.stringify(req.body) } } });
      const resp = await fetch(gistUrl, { method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' }, body });
      if (!resp.ok) { const err = await resp.text(); return res.status(resp.status).json({ error: err }); }
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
