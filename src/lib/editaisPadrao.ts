// Base de conteúdo programático e matérias padrão por carreira de concursos públicos (Client-Side)
// Estrutura afunilada em 3 níveis: Matéria -> Tópicos -> Subtópicos detalhados
import { Materia, Topico, Subtopico } from './types.ts';

export interface SubtopicoTemplate {
  nome: string;
}

export interface TopicoTemplate {
  titulo: string;
  subtopicos?: string[];
}

export interface MateriaTemplate {
  nome: string;
  importancia: number;
  cor: string;
  topicos: TopicoTemplate[];
}

export function identificarCarreira(titulo?: string | null, orgao?: string | null, cargos?: string | null): string {
  const texto = `${titulo || ''} ${orgao || ''} ${cargos || ''}`.toLowerCase();

  if (/pmdf|pol[ií]cia militar do distrito federal|pm\s*df/i.test(texto)) return 'pmdf';
  if (/inss|previd[eê]ncia/i.test(texto)) return 'administrativa';
  if (/banco central|bacen|banco do brasil|caixa econ|bndes|banrisul|banese|brb|cvm/i.test(texto)) return 'bancaria';
  if (/pol[ií]cia federal|\bpf\b|pol[ií]cia rodovi[aá]ria|\bprf\b|pol[ií]cia civil|\bpc\b|pol[ií]cia militar|\bpm\b|pol[ií]cia penal|depen|perito|delegado|agente de pol|guarda municipal/i.test(texto)) return 'policial';
  if (/receita federal|auditor[- ]fiscal|sefaz|iss\b|tribut[aá]ri|fiscal de rendas/i.test(texto)) return 'fiscal';
  if (/tribunal de contas|tcu\b|tce\b|cgu\b|controladoria|cge\b/i.test(texto)) return 'controle';
  if (/tribunal|trt\b|tre\b|trf\b|\btj\b|mpu\b|dpu\b|defensoria|promotoria|judici[aá]ri/i.test(texto)) return 'tribunais';
  if (/sa[uú]de|m[eé]dic|enferm|hospital|sus\b|farmac|psicol/i.test(texto)) return 'saude';
  if (/educa[cç][aã]o|professor|docente|pedagog|escola/i.test(texto)) return 'educacao';
  if (/c[aâ]mara|deputado|senado|assembleia|legislativ/i.test(texto)) return 'legislativo';

  return 'administrativa';
}

export function obterGradeCarreira(carreira: string, orgaoNome = ''): MateriaTemplate[] {
  // 1. CARREIRA PMDF
  if (carreira === 'pmdf' || /pmdf/i.test(orgaoNome)) {
    return [
      {
        nome: 'Língua Portuguesa',
        importancia: 5,
        cor: '#14b8a6',
        topicos: [
          {
            titulo: 'Compreensão e Interpretação de Textos',
            subtopicos: [
              'Leitura, compreensão e inferência de sentidos em textos verbais e não-verbais',
              'Tipologia textual: narração, descrição, dissertação e injunção',
              'Coesão e coerência textual: operadores argumentativos, anáfora e catáfora',
            ],
          },
          {
            titulo: 'Morfossintaxe e Estrutura da Oração',
            subtopicos: [
              'Classes de palavras: emprego do substantivo, adjetivo, pronome e verbo',
              'Termos essenciais, integrantes e acessórios da oração',
              'Período composto por coordenação e subordinação',
            ],
          },
          {
            titulo: 'Concordância, Regência e Pontuação',
            subtopicos: [
              'Concordância nominal e verbal (casos especiais e regras gerais)',
              'Regência verbal e nominal e Emprego do sinal indicativo de crase',
              'Emprego dos sinais de pontuação e valor estilístico',
            ],
          },
        ],
      },
      {
        nome: 'Direito Administrativo',
        importancia: 5,
        cor: '#3b82f6',
        topicos: [
          {
            titulo: 'Administração Pública e Princípios',
            subtopicos: [
              'Conceito de Administração Pública em sentido amplo e estrito',
              'Princípios expressos (LIMPE: Legalidade, Impessoalidade, Moralidade, Publicidade, Eficiência)',
              'Princípios implícitos (Supremacia do Interesse Público, Razoabilidade e Autotutela)',
              'Administração Direta e Indireta (Autarquias, Fundações, Empresas Públicas e SEM)',
            ],
          },
          {
            titulo: 'Agentes Públicos e Regime Disciplinar',
            subtopicos: [
              'Classificação dos agentes públicos e normas constitucionais (Art. 37 CF/88)',
              'Cargo, emprego e função pública: investidura e estabilidade',
              'Regime disciplinar: infrações funcionais e penalidades de servidor (Advertência, Suspensão e Demissão)',
              'Processo Administrativo Disciplinar (PAD) e ampla defesa',
            ],
          },
          {
            titulo: 'Poderes Administrativos e Poder de Polícia',
            subtopicos: [
              'Poder vinculado, poder discricionário, poder hierárquico e poder disciplinar',
              'Poder de polícia: atributos (autoexecutoriedade, coercibilidade e discricionariedade) e limites',
              'Abuso de poder: excesso de poder e desvio de finalidade',
            ],
          },
          {
            titulo: 'Atos Administrativos',
            subtopicos: [
              'Requisitos de validade: Competência, Finalidade, Forma, Motivo e Objeto',
              'Atributos do ato: Presunção de legitimidade, Autoexecutoriedade e Imperatividade',
              'Extinção dos atos: revogação e anulação',
            ],
          },
        ],
      },
      {
        nome: 'Direito Constitucional',
        importancia: 5,
        cor: '#8b5cf6',
        topicos: [
          {
            titulo: 'Direitos e Deveres Individuais e Coletivos (Art. 5º da CF/88)',
            subtopicos: [
              'Direito à vida, à liberdade, à igualdade, à segurança e à propriedade',
              'Remédios constitucionais: Habeas Corpus, Mandado de Segurança, Habeas Data e Ação Popular',
              'Inviolabilidade de domicílio, sigilo de correspondência e de comunicações',
            ],
          },
          {
            titulo: 'Segurança Pública e Forças Policiais (Art. 144 da CF/88)',
            subtopicos: [
              'Órgãos de segurança pública e suas atribuições constitucionais',
              'Polícias Militares e Corpos de Bombeiros Militares: subordinação e destinação',
            ],
          },
        ],
      },
      {
        nome: 'Direito Penal e Processual Penal',
        importancia: 5,
        cor: '#ef4444',
        topicos: [
          {
            titulo: 'Teoria do Crime e Aplicação da Lei Penal',
            subtopicos: [
              'Princípio da legalidade e anterioridade penal',
              'Fato típico, antijuridicidade e culpabilidade',
              'Crimes dolosos, culposos e preterdolosos',
            ],
          },
          {
            titulo: 'Crimes Contra a Vida e o Patrimônio',
            subtopicos: [
              'Homicídio simples, qualificado e culposo',
              'Furto, roubo, extorsão e estelionato',
            ],
          },
          {
            titulo: 'Inquérito Policial e Prisão em Flagrante',
            subtopicos: [
              'Inquérito policial: conceito, características e valor probatório',
              'Espécies de flagrante: próprio, impróprio e presumido',
            ],
          },
        ],
      },
      {
        nome: 'Direito Penal Militar & Legislação da PMDF',
        importancia: 5,
        cor: '#d97706',
        topicos: [
          {
            titulo: 'Estatuto dos Policiais Militares do DF (Lei nº 7.289/1984)',
            subtopicos: [
              'Hierarquia e disciplina militar: postos e graduações',
              'Deveres, direitos e prerrogativas dos policiais militares',
              'Regime disciplinar militar e penalidades específicas',
            ],
          },
          {
            titulo: 'Crimes Militares em Tempo de Paz (Código Penal Militar)',
            subtopicos: [
              'Motim, revolta e insubordinação',
              'Desrespeito a superior e recusa de obediência',
            ],
          },
        ],
      },
      {
        nome: 'Raciocínio Lógico-Matemático',
        importancia: 4,
        cor: '#10b981',
        topicos: [
          {
            titulo: 'Lógica Proposicional',
            subtopicos: [
              'Proposições simples e compostas, conectivos e tabelas-verdade',
              'Equivalências lógicas (Leis de De Morgan)',
            ],
          },
          {
            titulo: 'Conjuntos e Análise Combinatória',
            subtopicos: [
              'Diagramas de Venn e operações entre conjuntos',
              'Princípio fundamental da contagem, arranjos e combinações',
            ],
          },
        ],
      },
    ];
  }

  // 2. CARREIRA POLICIAL (PF, PRF, PC, PM, DEPEN)
  if (carreira === 'policial') {
    return [
      {
        nome: 'Língua Portuguesa',
        importancia: 5,
        cor: '#14b8a6',
        topicos: [
          {
            titulo: 'Compreensão e Interpretação de Textos',
            subtopicos: [
              'Inferência textual e argumentação',
              'Tipologia textual e coesão referencial',
            ],
          },
          {
            titulo: 'Gramática e Sintaxe Aplicada',
            subtopicos: [
              'Concordância verbal e nominal',
              'Regência e crase',
              'Pontuação e termos da oração',
            ],
          },
        ],
      },
      {
        nome: 'Direito Administrativo',
        importancia: 5,
        cor: '#3b82f6',
        topicos: [
          {
            titulo: 'Administração Pública e Princípios',
            subtopicos: [
              'Princípios LIMPE e regime jurídico administrativo',
              'Administração direta e indireta',
            ],
          },
          {
            titulo: 'Agentes Públicos e Poderes',
            subtopicos: [
              'Poder de polícia e atributos',
              'Regime disciplinar e penalidades funcionais de servidores',
              'Processo Administrativo Disciplinar (PAD)',
            ],
          },
        ],
      },
      {
        nome: 'Direito Constitucional',
        importancia: 5,
        cor: '#8b5cf6',
        topicos: [
          {
            titulo: 'Artigo 5º da CF/88 e Direitos Fundamentais',
            subtopicos: [
              'Garantias constitucionais e remédios judiciais',
              'Inviolabilidade de domicílio e liberdades públicas',
            ],
          },
          {
            titulo: 'Segurança Pública (Art. 144 CF/88)',
            subtopicos: [
              'Competências constitucionais das forças policiais',
            ],
          },
        ],
      },
      {
        nome: 'Direito Penal e Processual Penal',
        importancia: 5,
        cor: '#ef4444',
        topicos: [
          {
            titulo: 'Teoria Geral do Crime',
            subtopicos: [
              'Tipicidade, ilicitude e culpabilidade',
              'Tentativa, consumação e concurso de crimes',
            ],
          },
          {
            titulo: 'Inquérito Policial, Flagrante e Prisões',
            subtopicos: [
              'Instauração e conclusão do Inquérito Policial',
              'Prisão em flagrante, preventiva e temporária',
            ],
          },
        ],
      },
      {
        nome: 'Raciocínio Lógico e Informática',
        importancia: 4,
        cor: '#10b8a6',
        topicos: [
          {
            titulo: 'Lógica Proposicional e Argumentação',
            subtopicos: ['Proposições, negações e equivalências lógicas'],
          },
          {
            titulo: 'Segurança da Informação e Redes',
            subtopicos: ['Malwares, phishing e autenticação em dois fatores'],
          },
        ],
      },
    ];
  }

  // 3. TRIBUNAIS (TJ, TRT, TRE, TRF)
  if (carreira === 'tribunais') {
    return [
      {
        nome: 'Língua Portuguesa',
        importancia: 5,
        cor: '#14b8a6',
        topicos: [
          {
            titulo: 'Interpretação Textual e Gramática',
            subtopicos: [
              'Interpretação e coesão textual',
              'Sintaxe da oração e do período',
              'Regência, crase e pontuação',
            ],
          },
        ],
      },
      {
        nome: 'Direito Constitucional',
        importancia: 5,
        cor: '#8b5cf6',
        topicos: [
          {
            titulo: 'Direitos Fundamentais (Art. 5º da CF/88)',
            subtopicos: [
              'Garantias processuais e direitos fundamentais',
              'Ações constitucionais',
            ],
          },
          {
            titulo: 'Poder Judiciário e Funções Essenciais à Justiça',
            subtopicos: [
              'Estrutura e órgãos do Poder Judiciário (Art. 92 ao 126 CF/88)',
              'Ministério Público e Defensoria Pública',
            ],
          },
        ],
      },
      {
        nome: 'Direito Administrativo',
        importancia: 5,
        cor: '#3b82f6',
        topicos: [
          {
            titulo: 'Princípios e Atos Administrativos',
            subtopicos: [
              'Princípios da legalidade, moralidade e impessoalidade',
              'Elementos e requisitos dos atos administrativos',
            ],
          },
          {
            titulo: 'Servidores Públicos e Processo Disciplinar',
            subtopicos: [
              'Regime jurídico e penalidades de servidores',
              'Sindicância e Processo Administrativo Disciplinar (PAD)',
            ],
          },
        ],
      },
      {
        nome: 'Direito Processual Civil',
        importancia: 4,
        cor: '#ec4899',
        topicos: [
          {
            titulo: 'Princípios Processuais e Competência',
            subtopicos: [
              'Normas fundamentais do CPC/2015',
              'Competência absoluta e relativa',
            ],
          },
          {
            titulo: 'Atos Processuais, Prazos e Recursos',
            subtopicos: [
              'Contagem de prazos processuais em dias úteis',
              'Teoria geral dos recursos e apelação',
            ],
          },
        ],
      },
      {
        nome: 'Raciocínio Lógico e Noções de Informática',
        importancia: 3,
        cor: '#10b981',
        topicos: [
          {
            titulo: 'Lógica e Tecnologia dos Tribunais',
            subtopicos: [
              'Lógica sentencial e diagramas',
              'Processo Judicial Eletrônico (PJe) e segurança digital',
            ],
          },
        ],
      },
    ];
  }

  // 4. FISCAL & CONTROLE (Receita Federal, Sefaz, ISS, TCU, TCE)
  if (carreira === 'fiscal' || carreira === 'controle') {
    return [
      {
        nome: 'Direito Tributário',
        importancia: 5,
        cor: '#14b8a6',
        topicos: [
          {
            titulo: 'Sistema Tributário Nacional e Princípios',
            subtopicos: [
              'Legalidade, anterioridade, irretroatividade e isonomia tributária',
              'Limitações constitucionais ao poder de tributar',
            ],
          },
          {
            titulo: 'Competência e Imunidades Tributárias',
            subtopicos: [
              'Imunidade recíproca, religiosa e de livros/periódicos',
              'Impostos da União, Estados e Municípios',
            ],
          },
        ],
      },
      {
        nome: 'Contabilidade Geral e Avançada',
        importancia: 5,
        cor: '#6366f1',
        topicos: [
          {
            titulo: 'Estrutura Conceitual e Balanço Patrimonial',
            subtopicos: [
              'Ativo, Passivo e Patrimônio Líquido',
              'Plano de contas e lançamentos contábeis',
            ],
          },
          {
            titulo: 'Demonstrações Contábeis e DRE',
            subtopicos: [
              'Demonstração do Resultado do Exercício (DRE)',
              'Demonstração dos Fluxos de Caixa (DFC)',
            ],
          },
        ],
      },
      {
        nome: 'Direito Administrativo e Constitucional',
        importancia: 4,
        cor: '#3b82f6',
        topicos: [
          {
            titulo: 'Direito Administrativo e Servidores',
            subtopicos: [
              'Atos administrativos e poder de polícia',
              'Regime de servidores e processo disciplinar',
            ],
          },
        ],
      },
      {
        nome: 'Língua Portuguesa',
        importancia: 4,
        cor: '#f59e0b',
        topicos: [
          {
            titulo: 'Compreensão Textual e Morfossintaxe',
            subtopicos: [
              'Interpretação e coesão textual',
              'Concordância, regência e pontuação',
            ],
          },
        ],
      },
      {
        nome: 'Auditoria e Matemática Financeira',
        importancia: 4,
        cor: '#10b981',
        topicos: [
          {
            titulo: 'Normas de Auditoria e Testes',
            subtopicos: [
              'Evidências e papéis de trabalho',
              'Testes de observância e substantivos',
            ],
          },
        ],
      },
    ];
  }

  // 5. CARREIRA BANCÁRIA (Bacen, BB, Caixa, CVM)
  if (carreira === 'bancaria') {
    return [
      {
        nome: 'Conhecimentos Bancários',
        importancia: 5,
        cor: '#14b8a6',
        topicos: [
          {
            titulo: 'Sistema Financeiro Nacional (SFN)',
            subtopicos: [
              'Conselho Monetário Nacional (CMN) e Banco Central do Brasil (Bacen)',
              'Comissão de Valores Mobiliários (CVM) e instituições financeiras',
            ],
          },
          {
            titulo: 'Produtos e Serviços Financeiros',
            subtopicos: [
              'Depósitos à vista e a prazo (CDB/RDB)',
              'Fundos de investimento e mercado de ações',
              'Crédito bancário, PIX e Open Finance',
            ],
          },
        ],
      },
      {
        nome: 'Língua Portuguesa',
        importancia: 4,
        cor: '#3b82f6',
        topicos: [
          {
            titulo: 'Compreensão e Interpretação',
            subtopicos: ['Interpretação de textos, coesão e concordância'],
          },
        ],
      },
      {
        nome: 'Matemática Financeira',
        importancia: 4,
        cor: '#f59e0b',
        topicos: [
          {
            titulo: 'Juros Simples e Compostos',
            subtopicos: ['Taxas proporcionais, equivalentes e fluxos de caixa'],
          },
        ],
      },
      {
        nome: 'Atendimento e Vendas no Setor Bancário',
        importancia: 4,
        cor: '#8b5cf6',
        topicos: [
          {
            titulo: 'Técnicas de Vendas e Ética',
            subtopicos: ['Código de Defesa do Consumidor e sigilo bancário (LC 105/2001)'],
          },
        ],
      },
    ];
  }

  // 6. CARREIRA ADMINISTRATIVA GERAL (Padrão para prefeituras e órgãos gerais)
  return [
    {
      nome: 'Língua Portuguesa',
      importancia: 5,
      cor: '#14b8a6',
      topicos: [
        {
          titulo: 'Compreensão e Interpretação de Textos',
          subtopicos: [
            'Leitura, inferência e interpretação textual',
            'Coesão, coerência e tipologia textual',
          ],
        },
        {
          titulo: 'Gramática e Sintaxe',
          subtopicos: [
            'Concordância nominal e verbal',
            'Regência, crase e pontuação',
          ],
        },
      ],
    },
    {
      nome: 'Direito Administrativo',
      importancia: 4,
      cor: '#3b82f6',
      topicos: [
        {
          titulo: 'Administração Pública e Princípios',
          subtopicos: [
            'Princípios expressos (LIMPE) e regime jurídico',
            'Administração Direta e Indireta',
          ],
        },
        {
          titulo: 'Agentes Públicos e Processo Disciplinar',
          subtopicos: [
            'Classificação dos agentes públicos (Art. 37 CF/88)',
            'Regime disciplinar: penalidades de servidor e PAD',
          ],
        },
      ],
    },
    {
      nome: 'Direito Constitucional',
      importancia: 4,
      cor: '#8b5cf6',
      topicos: [
        {
          titulo: 'Direitos e Garantias Fundamentais (Art. 5º da CF/88)',
          subtopicos: [
            'Direitos individuais e coletivos',
            'Remédios constitucionais',
          ],
        },
        {
          titulo: 'Organização do Estado e da Administração',
          subtopicos: [
            'Competências federativas e normas da administração pública',
          ],
        },
      ],
    },
    {
      nome: 'Raciocínio Lógico-Matemático',
      importancia: 3,
      cor: '#f59e0b',
      topicos: [
        {
          titulo: 'Lógica Proposicional e Conjuntos',
          subtopicos: [
            'Tabelas-verdade, negações e equivalências',
            'Operações com conjuntos e porcentagem básica',
          ],
        },
      ],
    },
    {
      nome: 'Noções de Informática',
      importancia: 3,
      cor: '#10b981',
      topicos: [
        {
          titulo: 'Sistemas Operacionais e Aplicativos de Escritório',
          subtopicos: [
            'Windows, editor de texto e planilhas eletrônicas',
            'Navegadores, nuvem e segurança da informação',
          ],
        },
      ],
    },
  ];
}

// Gera disciplinas, tópicos e subtópicos prontos para inserção imediata no banco local
export function gerarDisciplinasETopicosPadrao(
  concursoId: string,
  titulo?: string | null,
  orgao?: string | null,
  cargos?: string | null
): { materias: Materia[]; topicos: Topico[] } {
  const carreira = identificarCarreira(titulo, orgao, cargos);
  const grade = obterGradeCarreira(carreira, orgao || '');

  const materias: Materia[] = [];
  const topicos: Topico[] = [];

  grade.forEach((matTemplate, mIdx) => {
    const matId = `mat_${concursoId}_${mIdx + 1}`;
    const novaMat: Materia = {
      id: matId,
      concurso_id: concursoId,
      nome: matTemplate.nome,
      importancia: matTemplate.importancia,
      conhecimento: 2,
      horas_semanais_desejadas: null,
      cor: matTemplate.cor,
      ordem: mIdx + 1,
      ativa: true,
      created_at: new Date().toISOString(),
    };
    materias.push(novaMat);

    matTemplate.topicos.forEach((topTemplate, tIdx) => {
      const topId = `top_${matId}_${tIdx + 1}`;
      const subtopicosList: Subtopico[] = (topTemplate.subtopicos || []).map((subNome, sIdx) => ({
        id: `sub_${topId}_${sIdx + 1}`,
        nome: subNome,
        ordem: sIdx + 1,
        concluido: false,
        revisoes: 0,
      }));

      const novoTop: Topico = {
        id: topId,
        concurso_id: concursoId,
        materia_id: matId,
        nome: topTemplate.titulo,
        ordem: tIdx + 1,
        concluido: false,
        revisoes: 0,
        subtopicos: subtopicosList,
        created_at: new Date().toISOString(),
      };
      topicos.push(novoTop);
    });
  });

  return { materias, topicos };
}
