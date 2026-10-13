import { scrapeDetalhe, CONCURSOS_FORTE_EXPECTATIVA } from '../server/pci.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = String(req.query.url || '');
  if (!url) {
    return res.status(400).json({ erro: 'URL não fornecida.' });
  }

  try {
    const detalhe = await scrapeDetalhe(url);
    return res.status(200).json(detalhe);
  } catch (err) {
    const esperado = CONCURSOS_FORTE_EXPECTATIVA.find((c) => c.link === url);
    if (esperado) {
      return res.status(200).json({
        url,
        titulo: esperado.titulo,
        subtitulo: esperado.orgao,
        paragrafos: [
          esperado.descricaoNoticia || esperado.resumo,
          `Órgão: ${esperado.orgao} • Cargo: ${esperado.cargos}`,
          esperado.vagas ? `Previsão de vagas: ${esperado.vagas}` : 'Vagas: sob edital / cadastro de reserva',
          esperado.salarioMax ? `Remuneração inicial: até R$ ${esperado.salarioMax.toLocaleString('pt-BR')}` : '',
          'O edital verticalizado e planejamento de estudos para este concurso já estão disponíveis no Concursei.',
        ].filter(Boolean),
        links: [{ href: url, texto: 'Ver notícia no PCI Concursos', pdf: false }],
      });
    }

    return res.status(200).json({
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
}
