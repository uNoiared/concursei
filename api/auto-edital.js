import { obterEditalAutomatico } from '../server/pci.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { titulo = '', orgao = '', cargos = '', statusEdital = 'aberto' } = req.query;
    const edital = await obterEditalAutomatico({
      titulo: String(titulo),
      orgao: String(orgao),
      cargos: String(cargos),
      statusEdital: String(statusEdital),
    });
    return res.status(200).json(edital);
  } catch (err) {
    return res.status(500).json({ erro: 'Falha ao gerar edital automático.' });
  }
}
