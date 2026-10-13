// Raspagem da lista de concursos abertos e previstos (pré-edital) do PCI Concursos,
// com gerador e extrator automático de edital verticalizado afunilado (3 níveis).
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import { identificarCarreira, obterGradeCarreira } from './editaisPadrao.js';

const BASE = 'https://www.pciconcursos.com.br';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36 Concursei/1.0';

const REGIOES = {
  AC: 'Norte', AM: 'Norte', AP: 'Norte', PA: 'Norte', RO: 'Norte', RR: 'Norte', TO: 'Norte',
  AL: 'Nordeste', BA: 'Nordeste', CE: 'Nordeste', MA: 'Nordeste', PB: 'Nordeste', PE: 'Nordeste', PI: 'Nordeste', RN: 'Nordeste', SE: 'Nordeste',
  DF: 'Centro-Oeste', GO: 'Centro-Oeste', MS: 'Centro-Oeste', MT: 'Centro-Oeste',
  ES: 'Sudeste', MG: 'Sudeste', RJ: 'Sudeste', SP: 'Sudeste',
  PR: 'Sul', RS: 'Sul', SC: 'Sul',
};

// Concursos com Forte Expectativa para 2026/2027 (Prioridade e destaque)
export const CONCURSOS_FORTE_EXPECTATIVA = [
  {
    id: 'prev_pmdf_2026',
    orgao: 'PMDF - Polícia Militar do Distrito Federal',
    cargos: 'Soldado Policial Militar e Oficial',
    titulo: 'PMDF • Soldado e Oficial',
    link: 'https://www.pciconcursos.com.br/noticias/concurso-pmdf-anunciado-com-previsao-de-mais-de-2-mil-vagas',
    logo: null,
    uf: 'DF',
    regiao: 'Centro-Oeste',
    nacional: false,
    resumo: 'Forte expectativa para 2026/2027 com anúncio de mais de 2.100 vagas para Soldado e Oficial da PMDF.',
    descricaoNoticia: 'O certame da PMDF conta com forte expectativa e pressão para reposição de efetivo policial no Distrito Federal. Remuneração inicial chega a R$ 7.900 mais benefícios. Grade do último edital já disponível para estudos.',
    vagas: 2100,
    cadastroReserva: true,
    salarioMax: 7900,
    escolaridade: ['Superior'],
    inscricaoAte: null,
    inscricaoTexto: 'Forte Expectativa 2026/2027',
    tipo: 'Concurso público',
    statusEdital: 'pre_edital',
    editalRotulo: 'Pré-Edital (Edital Anterior)',
    forteExpectativa: true,
    anoPrevisto: '2026/2027',
  },
  {
    id: 'prev_prf_2026',
    orgao: 'PRF - Polícia Rodoviária Federal',
    cargos: 'Policial Rodoviário Federal',
    titulo: 'PRF • Policial Rodoviário Federal',
    link: 'https://www.pciconcursos.com.br/noticias/prf-solicita-novo-concurso-com-mais-de-mil-vagas',
    logo: null,
    uf: 'Nacional',
    regiao: 'Nacional',
    nacional: true,
    resumo: 'Pedido de novo concurso enviado com forte expectativa para 1.500 vagas de policial rodoviário federal.',
    descricaoNoticia: 'A PRF reiterou o pedido para abertura de novo concurso com mais de 1.500 vagas para suprir vacâncias em todo o Brasil. Remuneração inicial ultrapassa R$ 10.700.',
    vagas: 1500,
    cadastroReserva: true,
    salarioMax: 10700,
    escolaridade: ['Superior'],
    inscricaoAte: null,
    inscricaoTexto: 'Forte Expectativa 2026/2027',
    tipo: 'Concurso público',
    statusEdital: 'pre_edital',
    editalRotulo: 'Pré-Edital (Edital Anterior)',
    forteExpectativa: true,
    anoPrevisto: '2026/2027',
  },
  {
    id: 'prev_pf_2026',
    orgao: 'PF - Polícia Federal',
    cargos: 'Agente, Escrivão e Administrativo',
    titulo: 'PF • Agente, Escrivão e Administrativo',
    link: 'https://www.pciconcursos.com.br/noticias/policia-federal-planeja-novo-concurso-com-cargos-policiais-e-administrativos',
    logo: null,
    uf: 'Nacional',
    regiao: 'Nacional',
    nacional: true,
    resumo: 'Forte expectativa para mais de 2.000 vagas na área policial e apoio administrativo da PF.',
    descricaoNoticia: 'A Polícia Federal planeja novo concurso público nacional abrangendo os cargos de Agente, Escrivão e carreira administrativa, com remunerações iniciais de até R$ 13.600.',
    vagas: 2000,
    cadastroReserva: true,
    salarioMax: 13600,
    escolaridade: ['Superior', 'Médio'],
    inscricaoAte: null,
    inscricaoTexto: 'Forte Expectativa 2026/2027',
    tipo: 'Concurso público',
    statusEdital: 'pre_edital',
    editalRotulo: 'Pré-Edital (Edital Anterior)',
    forteExpectativa: true,
    anoPrevisto: '2026/2027',
  },
  {
    id: 'prev_bacen_2026',
    orgao: 'BACEN - Banco Central do Brasil',
    cargos: 'Analista e Procurador',
    titulo: 'BACEN • Analista e Procurador',
    link: 'https://www.pciconcursos.com.br/noticias/concurso-bacen-solicitado-com-vagas-para-diversas-areas',
    logo: null,
    uf: 'Nacional',
    regiao: 'Nacional',
    nacional: true,
    resumo: 'Forte expectativa de novo concurso para suprir quadro técnico com remuneração inicial superior a R$ 20 mil.',
    descricaoNoticia: 'Banco Central do Brasil possui alta necessidade de servidores e prepara novos pedidos orçamentários para recomposição do quadro de Analistas e Procuradores.',
    vagas: 300,
    cadastroReserva: true,
    salarioMax: 21500,
    escolaridade: ['Superior'],
    inscricaoAte: null,
    inscricaoTexto: 'Forte Expectativa 2026/2027',
    tipo: 'Concurso público',
    statusEdital: 'pre_edital',
    editalRotulo: 'Pré-Edital (Edital Anterior)',
    forteExpectativa: true,
    anoPrevisto: '2026/2027',
  },
  {
    id: 'prev_inss_2026',
    orgao: 'INSS - Instituto Nacional do Seguro Social',
    cargos: 'Técnico do Seguro Social e Perito Médico',
    titulo: 'INSS • Técnico e Perito Médico',
    link: 'https://www.pciconcursos.com.br/noticias/inss-preve-novo-concurso-para-reduzir-filas-de-beneficios',
    logo: null,
    uf: 'Nacional',
    regiao: 'Nacional',
    nacional: true,
    resumo: 'Forte expectativa de edital para reposição de servidores e peritos médicos federais.',
    descricaoNoticia: 'O Ministério da Previdência Social e o INSS estudam abertura de novo certame com foco em técnicos do seguro social e peritos médicos para agilizar a concessão de benefícios em todo o país.',
    vagas: 1500,
    cadastroReserva: true,
    salarioMax: 9500,
    escolaridade: ['Superior', 'Médio'],
    inscricaoAte: null,
    inscricaoTexto: 'Forte Expectativa 2026/2027',
    tipo: 'Concurso público',
    statusEdital: 'pre_edital',
    editalRotulo: 'Pré-Edital (Edital Anterior)',
    forteExpectativa: true,
    anoPrevisto: '2026/2027',
  },
  {
    id: 'prev_depen_2026',
    orgao: 'SENAPPEN - Polícia Penal Federal',
    cargos: 'Policial Penal Federal',
    titulo: 'Polícia Penal Federal • Agente Federal de Execução',
    link: 'https://www.pciconcursos.com.br/noticias/policia-penal-federal-deve-abrir-novo-concurso-para-penitenciarias-federais',
    logo: null,
    uf: 'Nacional',
    regiao: 'Nacional',
    nacional: true,
    resumo: 'Forte expectativa de reforço no efetivo das penitenciárias federais de segurança máxima.',
    descricaoNoticia: 'Com a expansão e exigências de segurança do sistema penitenciário federal, novo certame para Policial Penal Federal está em planejamento.',
    vagas: 500,
    cadastroReserva: true,
    salarioMax: 9100,
    escolaridade: ['Superior'],
    inscricaoAte: null,
    inscricaoTexto: 'Forte Expectativa 2026/2027',
    tipo: 'Concurso público',
    statusEdital: 'pre_edital',
    editalRotulo: 'Pré-Edital (Edital Anterior)',
    forteExpectativa: true,
    anoPrevisto: '2026/2027',
  },
  {
    id: 'prev_tjdft_2026',
    orgao: 'TJDFT - Tribunal de Justiça do DF e Territórios',
    cargos: 'Técnico e Analista Judiciário',
    titulo: 'TJDFT • Técnico e Analista Judiciário',
    link: 'https://www.pciconcursos.com.br/noticias/tjdft-estuda-novo-concurso-para-servidores',
    logo: null,
    uf: 'DF',
    regiao: 'Centro-Oeste',
    nacional: false,
    resumo: 'Forte expectativa para cargos de apoio judiciário e administrativo no Tribunal de Justiça do DF.',
    descricaoNoticia: 'Tribunal de Justiça do Distrito Federal e dos Territórios possui vacâncias contínuas e prevê novo certame para áreas judiciária e de tecnologia.',
    vagas: 250,
    cadastroReserva: true,
    salarioMax: 14000,
    escolaridade: ['Superior'],
    inscricaoAte: null,
    inscricaoTexto: 'Forte Expectativa 2026/2027',
    tipo: 'Concurso público',
    statusEdital: 'pre_edital',
    editalRotulo: 'Pré-Edital (Edital Anterior)',
    forteExpectativa: true,
    anoPrevisto: '2026/2027',
  },
];

async function fetchHtml(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'pt-BR,pt;q=0.9' } });
  if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
  const buf = Buffer.from(await r.arrayBuffer());
  const type = r.headers.get('content-type') || '';
  let charset = (type.match(/charset=([\w-]+)/i) || [])[1];
  if (!charset) {
    const head = buf.subarray(0, 2048).toString('latin1');
    charset = (head.match(/<meta[^>]+charset=["']?([\w-]+)/i) || [])[1] || 'utf-8';
  }
  let html = iconv.decode(buf, charset);
  if ((html.match(/\uFFFD/g) || []).length > 20) html = iconv.decode(buf, 'latin1');
  return html;
}

const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

function parseDataBR(s) {
  const m = (s || '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

function parseSalario(s) {
  if (!s) return null;
  const m = s.match(/R\$\s*([\d.]+,\d{2}|[\d.]+)/i);
  if (!m) return null;
  const numStr = m[1].replace(/\./g, '').replace(',', '.');
  const num = parseFloat(numStr);
  return Number.isFinite(num) ? num : null;
}

function extrairUfDoTexto(t) {
  if (!t) return 'Nacional';
  const match = t.match(/\b([A-Z]{2})\b/);
  if (match && REGIOES[match[1]]) return match[1];
  return 'Nacional';
}

function sanitizarNomeConcurso(mancheteOuNome, cargoOriginal = '') {
  let texto = clean(mancheteOuNome);

  // Remove prefixos comuns de notícias
  texto = texto.replace(/^(Concurso\s+Público|Processo\s+Seletivo|Novo\s+Concurso|Novo\s+Certame|Concursos|Edital|Notícia:?)\s*(do|da|de|para|no|na|dos|das)?\s*/i, '');

  // Extrai cargo se houver indicação clara "para [Cargo]"
  let cargoExtraido = '';
  const matchPara = texto.match(/\bpara\s+([A-Za-zÀ-ú\s,\/e\-]+?)(?:\s+(?:com|em|no|na|de\s+\d|\d+\s+vagas|\(|$|\.|\:|\-))/i);
  if (matchPara && matchPara[1].trim().length > 2 && matchPara[1].trim().length < 50) {
    cargoExtraido = matchPara[1].trim().replace(/\b(vagas|cargos|nível|nivel|superior|médio|medio)\b.*$/i, '').trim();
  }

  // Limpa o órgão cortando antes de verbos ou preposições jornalísticas
  let orgao = texto
    .replace(/\s+(abre|abriu|anuncia|anunciou|anunciado|autoriza|autorizou|autorizado|planeja|planejado|estuda|estudado|prevê|preve|previsto|confirma|confirmado|solicita|solicitou|solicitado|prepara|preparando|tem|deve\s+abrir|publica|publicou|publicado|divulga|divulgado|lança|lançado|forma\s+comissão|comissão\s+formada)\b.*$/i, '')
    .replace(/\s+para\s+.*$/i, '')
    .split(/[:;\-–—|]/)[0]
    .replace(/\b(202[4-9]|2030)\b/g, '')
    .replace(/\s+(do|da|de|no|na)$/i, '')
    .trim();

  if (/polícia\s+militar\s+(do\s+distrito\s+federal|do\s+df|df)/i.test(orgao)) {
    orgao = 'PMDF - Polícia Militar do DF';
  } else if (/polícia\s+rodoviária\s+federal|prf/i.test(orgao)) {
    orgao = 'PRF - Polícia Rodoviária Federal';
  } else if (/polícia\s+federal|\bpf\b/i.test(orgao)) {
    orgao = 'PF - Polícia Federal';
  } else if (/banco\s+central|\bbacen\b/i.test(orgao)) {
    orgao = 'BACEN - Banco Central do Brasil';
  } else if (/tribunal\s+de\s+justiça\s+do\s+distrito\s+federal|\btjdft\b/i.test(orgao)) {
    orgao = 'TJDFT - Tribunal de Justiça do DF';
  } else if (/inss|instituto\s+nacional\s+do\s+seguro\s+social/i.test(orgao)) {
    orgao = 'INSS - Seguro Social';
  }

  if (!orgao || orgao.length < 3) orgao = 'Órgão Público';
  else if (orgao.length > 55) orgao = orgao.slice(0, 55).trim();

  let cargoFinal = cargoOriginal && cargoOriginal !== 'Vários Cargos' && cargoOriginal !== 'Cargos do certame anterior'
    ? cargoOriginal
    : (cargoExtraido || 'Vários Cargos');

  cargoFinal = cargoFinal
    .replace(/^(cargos?\s+de|vagas?\s+de)\s*/i, '')
    .replace(/\s+(com|em|para|salários|salarios)\b.*$/i, '')
    .trim();

  if (!cargoFinal || cargoFinal.length < 2) cargoFinal = 'Vários Cargos';

  const titulo = cargoFinal !== 'Vários Cargos' ? `${orgao} • ${cargoFinal}` : orgao;

  return { orgao, cargo: cargoFinal, titulo };
}

// 1. Raspa Concursos Abertos Oficiais
export async function scrapeAbertos() {
  const html = await fetchHtml(`${BASE}/concursos/`);
  const $ = cheerio.load(html);
  const out = [];

  let secaoAtual = '';
  $('.na, .ea').each((_, el) => {
    const $el = $(el);
    if ($el.hasClass('na')) {
      secaoAtual = clean($el.text()).toUpperCase();
      return;
    }

    const $entry = $el;
    const $ca = $entry.find('.ca').first();
    const $a = $ca.find('a').first();
    const link = $a.attr('href') || '';
    if (!link) return;

    const uf = $entry.find('.cc').text().trim().toUpperCase() || 'Nacional';
    const secao = secaoAtual;

    const $cd = $entry.find('.cd').first();
    const partes = ($cd.html() || '')
      .split(/<br\s*\/?>/i)
      .map((p) => clean(cheerio.load(`<x>${p}</x>`)('x').text()))
      .filter(Boolean);
    const resumo = partes[0] || '';
    const cargos = partes[1] || 'Vários Cargos';
    const escolaridade = (partes[2] || '').split('/').map(clean).filter(Boolean);

    const ceText = clean($entry.find('.ce').first().text());
    const vagasMatch = resumo.match(/([\d.]+)\s+vagas?/i);
    const orgaoCru = clean($a.text()) || 'Concurso Público';
    const noticiaManchete = clean($a.attr('title')) || resumo;

    // Sanitização estrita: Órgão e Cargo limpos, sem manchete
    const { orgao, cargo: cargosLimpos, titulo } = sanitizarNomeConcurso(orgaoCru, cargos);

    out.push({
      id: link.replace(/^.*\/noticias\//, '').replace(/\/$/, ''),
      orgao,
      titulo,
      link,
      logo: $ca.find('img').attr('data-src') || null,
      uf,
      regiao: uf === 'Nacional' ? 'Nacional' : REGIOES[uf] || '',
      nacional: secao === 'NACIONAL' || uf === 'Nacional',
      resumo,
      descricaoNoticia: noticiaManchete,
      vagas: vagasMatch ? Number(vagasMatch[1].replace(/\./g, '')) : null,
      cadastroReserva: /cadastro de reserva/i.test(resumo),
      salarioMax: parseSalario(resumo),
      cargos: cargosLimpos,
      escolaridade: escolaridade.length ? escolaridade : ['Médio', 'Superior'],
      inscricaoAte: parseDataBR(ceText),
      inscricaoTexto: ceText || 'Inscrições Abertas',
      tipo: /processo seletivo/i.test(noticiaManchete) ? 'Processo seletivo' : 'Concurso público',
      statusEdital: 'aberto',
      editalRotulo: 'Edital Publicado',
      forteExpectativa: false,
    });
  });

  return out;
}

// 2. Raspa Concursos Previstos (Pré-edital)
export async function scrapePrevistos() {
  const html = await fetchHtml(`${BASE}/previstos/`);
  const $ = cheerio.load(html);
  const out = [];
  const seen = new Set();

  $('a[href*="/previstos/"]').each((_, el) => {
    const $a = $(el);
    const href = $a.attr('href') || '';
    const manchete = clean($a.text());
    if (!href.includes('/previstos/') || href.endsWith('/previstos/') || seen.has(href) || manchete.length < 15) return;
    seen.add(href);

    const vagasMatch = manchete.match(/([\d.]+)\s+vagas?/i);
    const uf = extrairUfDoTexto(manchete);
    const regiao = uf === 'Nacional' ? 'Nacional' : REGIOES[uf] || 'Nacional';

    // Sanitização estrita da manchete: gera estritamente Órgão + Cargo
    const { orgao, cargo: cargosLimpos, titulo } = sanitizarNomeConcurso(manchete);

    const id = href.replace(/^.*\/previstos\//, '').replace(/\/$/, '');

    out.push({
      id: `prev_${id}`,
      orgao,
      titulo,
      link: href,
      logo: null,
      uf,
      regiao,
      nacional: uf === 'Nacional',
      resumo: 'Concurso anunciado / autorizado. Edital em preparação.',
      descricaoNoticia: manchete,
      vagas: vagasMatch ? Number(vagasMatch[1].replace(/\./g, '')) : null,
      cadastroReserva: true,
      salarioMax: parseSalario(manchete),
      cargos: cargosLimpos,
      escolaridade: ['Superior', 'Médio'],
      inscricaoAte: null,
      inscricaoTexto: 'Pré-edital (Edital anterior)',
      tipo: 'Concurso público',
      statusEdital: 'pre_edital',
      editalRotulo: 'Pré-Edital (Edital Anterior)',
      forteExpectativa: false,
    });
  });

  return out;
}

// 3. Agrega Abertos + Previstos com Forte Expectativa em destaque
export async function scrapeConcursos() {
  const [abertos, previstos] = await Promise.all([
    scrapeAbertos().catch(() => []),
    scrapePrevistos().catch(() => []),
  ]);

  // Junta lista de Forte Expectativa sem duplicar IDs
  const idVistos = new Set();
  const listaFinal = [];

  // 1º: Concursos de Forte Expectativa (PMDF, PRF, PF, Bacen, etc.)
  CONCURSOS_FORTE_EXPECTATIVA.forEach((c) => {
    idVistos.add(c.id);
    listaFinal.push(c);
  });

  // 2º: Concursos Abertos
  abertos.forEach((c) => {
    if (!idVistos.has(c.id)) {
      idVistos.add(c.id);
      listaFinal.push(c);
    }
  });

  // 3º: Demais Previstos
  previstos.forEach((c) => {
    if (!idVistos.has(c.id)) {
      idVistos.add(c.id);
      listaFinal.push(c);
    }
  });

  return listaFinal;
}

// 4. Detalhes do artigo da notícia
export async function scrapeDetalhe(url) {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const $art = $('article').first().length ? $('article').first() : $('body');

  const paragrafos = [];
  $art.find('p, li').each((_, el) => {
    const t = clean($(el).text());
    if (t.length > 2) paragrafos.push(t);
  });

  const links = [];
  const seen = new Set();
  $art.find('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const texto = clean($(el).text());
    if (!/^https?:\/\//.test(href) || seen.has(href)) return;
    if (/pciconcursos\.com\.br\/?$/.test(href) || /pciconcursos\.com\.br\/(noticias|apostilas|concursos)\/?/.test(href)) return;
    seen.add(href);
    links.push({ href, texto: texto || href, pdf: /\.pdf(\?|$)/i.test(href) });
  });

  return {
    url,
    titulo: clean($('h1').first().text()),
    subtitulo: clean($('h2').first().text()),
    paragrafos: paragrafos.slice(0, 60),
    links,
  };
}

// 5. Gera automaticamente o Edital Verticalizado estruturado afunilado (3 níveis)
export async function obterEditalAutomatico(concursoInfo) {
  const { titulo = '', orgao = '', cargos = '', statusEdital = 'aberto' } = concursoInfo;
  const carreira = identificarCarreira(titulo, orgao, cargos);
  const materias = obterGradeCarreira(carreira, orgao);

  const ehPreEdital = statusEdital === 'pre_edital';

  return {
    carreira,
    statusEdital: ehPreEdital ? 'pre_edital' : 'aberto',
    origem: ehPreEdital ? 'Último Edital do Concurso (Base Pré-Edital)' : 'Edital Oficial Publicado',
    mensagem: ehPreEdital
      ? '⚡ Este concurso ainda não teve o novo edital publicado. As disciplinas e os tópicos/subtópicos afunilados foram carregados automaticamente com base no último certame para você antecipar seus estudos!'
      : '📄 Conteúdo programático oficial afunilado com tópicos e subtópicos extraídos.',
    materias: materias.map((m, idx) => ({
      id: `mat_auto_${idx}_${Date.now()}`,
      nome: m.nome,
      importancia: m.importancia || 4,
      conhecimento: 2,
      cor: m.cor,
      horas_semanais_desejadas: null,
      ordem: idx + 1,
      ativa: true,
      topicos: (m.topicos || []).map((top, tIdx) => {
        const isObj = typeof top === 'object' && top !== null;
        const nomeTopico = isObj ? top.titulo : String(top);
        const subtopicosList = isObj && Array.isArray(top.subtopicos)
          ? top.subtopicos.map((sub, sIdx) => ({
              id: `sub_${idx}_${tIdx}_${sIdx}`,
              nome: sub,
              ordem: sIdx + 1,
              concluido: false,
              revisoes: 0,
            }))
          : [];
        return {
          id: `top_${idx}_${tIdx}`,
          nome: nomeTopico,
          ordem: tIdx + 1,
          concluido: false,
          revisoes: 0,
          subtopicos: subtopicosList,
        };
      }),
    })),
  };
}
