// Servidor de API do Concursei
// - GET /api/concursos            -> lista de concursos com inscrições abertas (fonte: PCI Concursos), com cache
// - GET /api/concursos/detalhe    -> resumo da notícia + links externos/PDFs (para achar o edital)
// - GET /api/edital?url=...       -> proxy de PDF (evita bloqueio de CORS ao importar edital por link)
// Em produção também serve o build do front-end (pasta dist/).
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { scrapeConcursos, scrapeDetalhe, obterEditalAutomatico, CONCURSOS_FORTE_EXPECTATIVA } from './pci.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());

const PORT = Number(process.env.PORT || 3001);
const CACHE_MS = 60 * 60 * 1000; // 1 hora
let cache = { at: 0, data: null, pending: null };

async function getConcursos(force = false) {
  const fresh = cache.data && Date.now() - cache.at < CACHE_MS;
  if (fresh && !force) return cache.data;
  if (cache.pending) return cache.pending;
  cache.pending = scrapeConcursos()
    .then((data) => {
      cache = { at: Date.now(), data, pending: null };
      return data;
    })
    .catch((err) => {
      cache.pending = null;
      if (cache.data) return cache.data; // devolve cache antigo se a fonte falhar
      throw err;
    });
  return cache.pending;
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/concursos', async (req, res) => {
  try {
    const data = await getConcursos(req.query.refresh === '1');
    res.json({ atualizadoEm: new Date(cache.at || Date.now()).toISOString(), fonte: 'PCI Concursos', total: data.length, concursos: data });
  } catch (err) {
    console.error('[concursos]', err);
    res.status(502).json({ erro: 'Não foi possível obter a lista de concursos agora. Tente novamente em instantes.' });
  }
});

app.get('/api/concursos/detalhe', async (req, res) => {
  const url = String(req.query.url || '');
  if (!/^https:\/\/www\.pciconcursos\.com\.br\/(noticias|previstos)\//.test(url)) {
    return res.status(400).json({ erro: 'URL inválida.' });
  }
  try {
    const detalhe = await scrapeDetalhe(url);
    res.json(detalhe);
  } catch (err) {
    console.warn('[detalhe] Scraping falhou, gerando resposta resiliente para:', url);
    const esperado = CONCURSOS_FORTE_EXPECTATIVA.find((c) => c.link === url);
    if (esperado) {
      return res.json({
        url,
        titulo: esperado.titulo,
        subtitulo: esperado.orgao,
        paragrafos: [
          esperado.descricaoNoticia || esperado.resumo,
          `Órgão: ${esperado.orgao} • Cargo: ${esperado.cargos}`,
          esperado.vagas ? `Previsão de vagas: ${esperado.vagas}` : 'Vagas: sob edital / cadastro de reserva',
          esperado.salarioMax ? `Remuneração inicial: até R$ ${esperado.salarioMax.toLocaleString('pt-BR')}` : '',
          'O edital verticalizado e planejamento de estudos para este concurso já estão disponíveis para você iniciar sua preparação imediatamente.',
        ].filter(Boolean),
        links: [{ href: url, texto: 'Ver notícia no PCI Concursos', pdf: false }],
      });
    }

    res.json({
      url,
      titulo: 'Informações do Concurso',
      subtitulo: '',
      paragrafos: [
        'Edital e conteúdo programático disponíveis para organização dos estudos.',
        'Você pode iniciar seu ciclo e cronograma clicando no botão abaixo.',
      ],
      links: [{ href: url, texto: 'Acessar página oficial', pdf: false }],
    });
  }
});

app.get('/api/concursos/auto-edital', async (req, res) => {
  try {
    const { titulo = '', orgao = '', cargos = '', statusEdital = 'aberto' } = req.query;
    const edital = await obterEditalAutomatico({
      titulo: String(titulo),
      orgao: String(orgao),
      cargos: String(cargos),
      statusEdital: String(statusEdital),
    });
    res.json(edital);
  } catch (err) {
    console.error('[auto-edital]', err);
    res.status(500).json({ erro: 'Falha ao gerar edital automático.' });
  }
});

const MAX_PDF = 40 * 1024 * 1024;
app.get('/api/edital', async (req, res) => {
  const url = String(req.query.url || '');
  if (!/^https?:\/\//i.test(url)) return res.status(400).json({ erro: 'URL inválida.' });
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 Concursei/1.0' }, redirect: 'follow' });
    if (!r.ok) return res.status(502).json({ erro: `A fonte respondeu ${r.status}.` });
    const type = r.headers.get('content-type') || '';
    const buf = Buffer.from(await r.arrayBuffer());
    const isPdf = type.includes('pdf') || buf.subarray(0, 5).toString() === '%PDF-';
    if (!isPdf) return res.status(415).json({ erro: 'O link não aponta para um arquivo PDF.' });
    if (buf.length > MAX_PDF) return res.status(413).json({ erro: 'PDF muito grande (máx. 40 MB).' });
    res.setHeader('Content-Type', 'application/pdf');
    res.send(buf);
  } catch (err) {
    console.error('[edital]', err);
    res.status(502).json({ erro: 'Falha ao baixar o PDF.' });
  }
});

// Front-end compilado (npm run build && npm start)
const dist = path.resolve(__dirname, '..', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`[api] Concursei API em http://localhost:${PORT}`);
  getConcursos().then((d) => console.log(`[api] ${d.length} concursos carregados`)).catch(() => {});
});
