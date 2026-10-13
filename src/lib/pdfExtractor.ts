// Extrator inteligente de edital em PDF no navegador (usando pdfjs-dist)
// Detecta seções de matérias comuns em concursos (Português, RLM, Direito...) e quebra em tópicos numerados.
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface MateriaExtraida {
  nome: string;
  cor: string;
  topicos: string[];
}

export interface ResultadoExtracao {
  textoCompleto: string;
  paginas: number;
  materias: MateriaExtraida[];
}

const CORES_PALETA = [
  '#14b8a6', // Teal
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

// Padrões de matérias frequentes em concursos públicos
const MATERIAS_CONHECIDAS = [
  'LÍNGUA PORTUGUESA',
  'PORTUGUÊS',
  'LÍNGUA INGLESA',
  'LÍNGUA ESPANHOLA',
  'RACIOCÍNIO LÓGICO',
  'RACIOCÍNIO LÓGICO-MATEMÁTICO',
  'MATEMÁTICA',
  'MATEMÁTICA FINANCEIRA',
  'ESTATÍSTICA',
  'INFORMÁTICA',
  'NOÇÕES DE INFORMÁTICA',
  'DIREITO CONSTITUCIONAL',
  'DIREITO ADMINISTRATIVO',
  'DIREITO PENAL',
  'DIREITO PROCESSUAL PENAL',
  'DIREITO CIVIL',
  'DIREITO PROCESSUAL CIVIL',
  'DIREITO TRIBUTÁRIO',
  'DIREITO PREVIDENCIÁRIO',
  'DIREITO DO TRABALHO',
  'DIREITO PROCESSUAL DO TRABALHO',
  'DIREITO EMPRESARIAL',
  'DIREITO AMBIENTAL',
  'DIREITO ELEITORAL',
  'DIREITOS HUMANOS',
  'LEGISLAÇÃO ESPECÍFICA',
  'LEGISLAÇÃO APLICADA',
  'LEGISLAÇÃO DO SUS',
  'ÉTICA NO SERVIÇO PÚBLICO',
  'ADMINISTRAÇÃO PÚBLICA',
  'ADMINISTRAÇÃO GERAL',
  'ADMINISTRAÇÃO FINANCEIRA E ORÇAMENTÁRIA',
  'AFO',
  'CONTABILIDADE GERAL',
  'CONTABILIDADE PÚBLICA',
  'AUDITORIA',
  'ARQUIVOLOGIA',
  'ATUALIDADES',
  'CONHECIMENTOS GERAIS',
  'CONHECIMENTOS ESPECÍFICOS',
  'CONHECIMENTOS BÁSICOS',
];

export async function extrairTextoPdf(fonte: ArrayBuffer | Uint8Array): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({ data: fonte });
  const pdf = await loadingTask.promise;
  const textos: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      // @ts-expect-error item tem propriedade str
      .map((item) => item.str || '')
      .join(' ');
    textos.push(pageText);
  }

  return textos.join('\n\n');
}

/**
 * Analisa o texto bruto do edital e extrai matérias e tópicos estruturados
 */
export function analisarConteudoEdital(texto: string): MateriaExtraida[] {
  const linhas = texto
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const materias: { nome: string; linhas: string[] }[] = [];
  let materiaAtual: { nome: string; linhas: string[] } | null = null;

  // Expressão para identificar títulos de matérias
  const regexTituloMateria = new RegExp(
    `^(?:CONTEÚDO PROGRAMÁTICO|CONHECIMENTOS (?:BÁSICOS|ESPECÍFICOS)|DISCIPLINA:?|MATÉRIA:?)?\\s*(${MATERIAS_CONHECIDAS.join(
      '|'
    )})(?:\\s*[-:–].*)?$`,
    'i'
  );

  linhas.forEach((linha) => {
    // Checa se a linha é um título de matéria conhecida
    const match = linha.match(regexTituloMateria);
    const ehCaixaAltaCurta =
      linha.length >= 4 &&
      linha.length <= 50 &&
      linha === linha.toUpperCase() &&
      !/^\d+[\.\)]/.test(linha) &&
      !/(EDITAL|CONCURSO|PREFEITURA|PROVA|CARGO|INSCRIÇÃO|ANEXO)/i.test(linha);

    if (match) {
      const nomeFormatado = padronizarNome(match[1]);
      if (materiaAtual) materias.push(materiaAtual);
      materiaAtual = { nome: nomeFormatado, linhas: [] };
    } else if (ehCaixaAltaCurta && MATERIAS_CONHECIDAS.some((k) => linha.includes(k))) {
      const nomeFormatado = padronizarNome(linha);
      if (materiaAtual) materias.push(materiaAtual);
      materiaAtual = { nome: nomeFormatado, linhas: [] };
    } else if (materiaAtual) {
      materiaAtual.linhas.push(linha);
    }
  });

  if (materiaAtual) materias.push(materiaAtual);

  // Se o parser estrito não achou matérias estruturadas, tenta quebrar por blocos
  if (materias.length === 0) {
    return extrairGenerico(texto);
  }

  // Agora extrai os tópicos de cada matéria
  return materias.map((m, idx) => {
    const topicos = extrairTopicosDeLinhas(m.linhas);
    return {
      nome: m.nome,
      cor: CORES_PALETA[idx % CORES_PALETA.length],
      topicos: topicos.length > 0 ? topicos : ['Conteúdo programático geral'],
    };
  });
}

function padronizarNome(nome: string): string {
  const limpo = nome.replace(/^(CONTEÚDO PROGRAMÁTICO|DISCIPLINA|MATÉRIA)[:\s-]*/i, '').trim();
  // Capitaliza mantendo preposições minúsculas
  return limpo
    .toLowerCase()
    .split(' ')
    .map((palavra, idx) => {
      if (idx > 0 && ['de', 'da', 'do', 'das', 'dos', 'e', 'em'].includes(palavra)) {
        return palavra;
      }
      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    })
    .join(' ');
}

function extrairTopicosDeLinhas(linhas: string[]): string[] {
  const textoUnido = linhas.join(' ');
  // Procura padrões de enumeração como "1.", "1.1.", "1 -", "•", ou separação por ponto e vírgula
  const itensNumerados = textoUnido.split(/(?=\b\d+[\.\)]\s+)/g).map((s) => s.trim()).filter(Boolean);

  if (itensNumerados.length >= 2) {
    return itensNumerados
      .map((item) => item.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter((item) => item.length >= 3 && item.length <= 250);
  }

  // Tenta quebrar por ponto e vírgula
  const porPontoVirgula = textoUnido
    .split(';')
    .map((s) => s.trim().replace(/^[-•*]\s*/, ''))
    .filter((s) => s.length >= 3 && s.length <= 250);

  if (porPontoVirgula.length >= 2) {
    return porPontoVirgula;
  }

  // Se não houver separador clássico, divide por sentenças
  return linhas
    .filter((l) => l.length >= 10 && l.length <= 200)
    .slice(0, 30);
}

function extrairGenerico(texto: string): MateriaExtraida[] {
  // Procura ocorrências das matérias no texto livre
  const encontradas: { nome: string; pos: number }[] = [];
  MATERIAS_CONHECIDAS.forEach((m) => {
    const idx = texto.toUpperCase().indexOf(m);
    if (idx !== -1) encontradas.push({ nome: padronizarNome(m), pos: idx });
  });

  encontradas.sort((a, b) => a.pos - b.pos);

  if (encontradas.length > 0) {
    return encontradas.slice(0, 10).map((item, idx) => ({
      nome: item.nome,
      cor: CORES_PALETA[idx % CORES_PALETA.length],
      topicos: [
        'Introdução e conceitos fundamentais',
        'Legislação e tópicos prioritários',
        'Resolução de questões de bancas',
      ],
    }));
  }

  // Fallback padrão amigável para o aluno
  return [
    {
      nome: 'Língua Portuguesa',
      cor: CORES_PALETA[0],
      topicos: ['Interpretação de Textos', 'Ortografia e Acentuação', 'Sintaxe e Pontuação', 'Crase e Regência'],
    },
    {
      nome: 'Direito Constitucional',
      cor: CORES_PALETA[1],
      topicos: ['Direitos e Garantias Fundamentais', 'Organização do Estado', 'Poder Executivo e Legislativo'],
    },
    {
      nome: 'Direito Administrativo',
      cor: CORES_PALETA[2],
      topicos: ['Princípios da Administração Pública', 'Atos Administrativos', 'Licitações e Contratos', 'Agentes Públicos'],
    },
    {
      nome: 'Raciocínio Lógico',
      cor: CORES_PALETA[3],
      topicos: ['Proposições e Conectivos', 'Tabela-Verdade', 'Equivalências e Negações', 'Probabilidade e Análise Combinatória'],
    },
  ];
}
