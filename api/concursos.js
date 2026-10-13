import { scrapeConcursos, CONCURSOS_FORTE_EXPECTATIVA } from '../server/pci.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout scraping')), 6000)
    );
    const data = await Promise.race([scrapeConcursos(), timeoutPromise]);

    return res.status(200).json({
      atualizadoEm: new Date().toISOString(),
      fonte: 'PCI Concursos',
      total: data.length,
      concursos: data,
    });
  } catch (err) {
    console.warn('[vercel-api] Usando concursos base por timeout/erro:', err?.message || err);
    return res.status(200).json({
      atualizadoEm: new Date().toISOString(),
      fonte: 'Concursei Base',
      total: CONCURSOS_FORTE_EXPECTATIVA.length,
      concursos: CONCURSOS_FORTE_EXPECTATIVA,
    });
  }
}
