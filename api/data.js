// Vercel Serverless Function - 代理 GitHub Gist API
// 保护 GITHUB_TOKEN 不暴露到前端

const GIST_ID = '7d1cff234801611561c8c1c3dfcac144';
const GIST_FILE = 'ledger-data.json';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: 'GITHUB_TOKEN not configured' });
  }

  const headers = {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'ledger-app'
  };

  if (req.method === 'GET') {
    // 读取 Gist 数据
    try {
      const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, { headers });
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to fetch gist' });
      }
      const gist = await response.json();
      const content = gist.files?.[GIST_FILE]?.content || '{}';
      return res.status(200).send(content);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'POST') {
    // 写入 Gist 数据
    try {
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: { [GIST_FILE]: { content: body } }
        })
      });
      if (!response.ok) {
        const err = await response.text();
        return res.status(response.status).json({ error: err });
      }
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
