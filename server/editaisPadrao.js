// Base de conteúdo programático e matérias padrão por carreira de concursos públicos
// Estrutura afunilada em 3 níveis: Matéria -> Tópicos -> Subtópicos detalhados

export function identificarCarreira(titulo, orgao, cargos) {
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

export function obterGradeCarreira(carreira, orgaoNome = '') {
  // 1. CARREIRA POLICIAL PMDF (Especialmente afunilada para o certame da PMDF)
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
              'Gêneros textuais jornalísticos, normativos e oficiais',
              'Coesão e coerência textual: operadores argumentativos, anáfora e catáfora',
            ],
          },
          {
            titulo: 'Morfossintaxe e Estrutura da Oração',
            subtopicos: [
              'Classes de palavras: emprego do substantivo, adjetivo, pronome e verbo',
              'Emprego e correlação de tempos e modos verbais',
              'Termos essenciais, integrantes e acessórios da oração',
              'Período composto por coordenação e subordinação',
            ],
          },
          {
            titulo: 'Concordância, Regência e Pontuação',
            subtopicos: [
              'Concordância nominal e verbal (casos especiais e regras gerais)',
              'Regência verbal e nominal com verbos de alta incidência (assistir, visar, aspirar...)',
              'Emprego do sinal indicativo de crase (casos obrigatórios, proibidos e facultativos)',
              'Emprego da pontuação: vírgula, ponto e vírgula, dois-pontos e travessão',
            ],
          },
          {
            titulo: 'Redação Oficial',
            subtopicos: [
              'Manual de Redação da Presidência da República (3ª edição)',
              'Pronomes de tratamento adequados para autoridades',
              'Estrutura do padrão ofício e correio eletrônico institucional',
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
              'Princípios implícitos (Supremacia do Interesse Público, Razoabilidade, Proporcionalidade e Autotutela)',
              'Administração Direta e Indireta (Autarquias, Fundações, Empresas Públicas e Sociedades de Economia Mista)',
            ],
          },
          {
            titulo: 'Agentes Públicos e Regime Disciplinar',
            subtopicos: [
              'Classificação dos agentes públicos e normas constitucionais (Art. 37 da CF/88)',
              'Cargo, emprego e função pública: requisitos de investidura e estabilidade',
              'Deveres e direitos dos servidores públicos',
              'Regime disciplinar: infrações funcionais e penalidades de servidor (Advertência, Suspensão e Demissão)',
              'Processo Administrativo Disciplinar (PAD) e garantia do contraditório e ampla defesa',
            ],
          },
          {
            titulo: 'Poderes Administrativos e Poder de Polícia',
            subtopicos: [
              'Poder vinculado e poder discricionário',
              'Poder hierárquico e poder disciplinar',
              'Poder de polícia: conceito, atributos (discricionariedade, autoexecutoriedade e coercibilidade) e limites',
              'Uso e abuso de poder: excesso de poder e desvio de finalidade',
            ],
          },
          {
            titulo: 'Atos Administrativos',
            subtopicos: [
              'Requisitos de validade: Competência, Finalidade, Forma, Motivo e Objeto',
              'Atributos do ato administrativo: Presunção de legitimidade, Autoexecutoriedade, Tipicidade e Imperatividade',
              'Extinção dos atos: revogação, anulação, cassação e caducidade',
            ],
          },
          {
            titulo: 'Responsabilidade Civil do Estado',
            subtopicos: [
              'Responsabilidade extracontratual objetiva na teoria do risco administrativo (Art. 37, § 6º da CF/88)',
              'Dano causado por omissão estatal (Teoria da culpa anônima / falta do serviço)',
              'Causas excludentes da responsabilidade (caso fortuito, força maior e culpa exclusiva da vítima)',
              'Direito de regresso contra o agente público com dolo ou culpa',
            ],
          },
        ],
      },
      {
        nome: 'Direito Constitucional',
        importancia: 5,
        cor: '#10b981',
        topicos: [
          {
            titulo: 'Direitos e Garantias Fundamentais (Art. 5º)',
            subtopicos: [
              'Direito à vida, liberdade, igualdade, segurança e propriedade',
              'Inviolabilidade de domicílio, correspondência e comunicações telegráficas/telefônicas',
              'Garantias constitucionais do processo penal: presunção de inocência, juiz natural e contraditório',
              'Remédios constitucionais: Habeas Corpus, Mandado de Segurança, Habeas Data e Ação Popular',
            ],
          },
          {
            titulo: 'Segurança Pública (Art. 144 da CF/88)',
            subtopicos: [
              'Estrutura e competências dos órgãos de segurança pública',
              'Polícias Militares e Corpos de Bombeiros Militares: atribuições de polícia ostensiva e preservação da ordem',
              'Condição de forças auxiliares e reserva do Exército Brasileiro',
              'Segurança pública no Distrito Federal e vínculo constitucional',
            ],
          },
          {
            titulo: 'Organização do Estado e do Distrito Federal',
            subtopicos: [
              'Competências privativas e concorrentes da União',
              'Competências do Distrito Federal (Art. 32 da CF/88)',
              'Organização e manutenção da PMDF, CBMDF e PCDF pela União (Art. 21, XIV da CF/88)',
            ],
          },
        ],
      },
      {
        nome: 'Direito Penal',
        importancia: 5,
        cor: '#ef4444',
        topicos: [
          {
            titulo: 'Princípios e Aplicação da Lei Penal',
            subtopicos: [
              'Princípio da legalidade, anterioridade, intervenção mínima e presunção de não culpabilidade',
              'A lei penal no tempo: retroatividade da lei benéfica e abolitio criminis',
              'A lei penal no espaço: lugar do crime, territorialidade e extraterritorialidade',
            ],
          },
          {
            titulo: 'Teoria do Crime',
            subtopicos: [
              'Conceito analítico de crime: fato típico, ilicitude e culpabilidade',
              'Fato típico: conduta (dolo e culpa), resultado, nexo causal e tipicidade',
              'Excludentes de ilicitude: legítima defesa, estado de necessidade, estrito cumprimento do dever legal e exercício regular de direito',
              'Culpabilidade: imputabilidade, potencial consciência da ilicitude e exigibilidade de conduta diversa',
            ],
          },
          {
            titulo: 'Crimes em Espécie Relevantes para a PMDF',
            subtopicos: [
              'Crimes contra a pessoa: homicídio simples, qualificado e culposo; lesão corporal',
              'Crimes contra o patrimônio: furto, roubo (com arma de fogo), extorsão e receptação',
              'Crimes contra a dignidade sexual: estupro e importunação sexual',
              'Crimes contra a Administração Pública praticados por funcionários públicos (peculato, concussão, corrupção passiva e prevaricação)',
              'Crimes contra a Administração Pública praticados por particulares (desacato, desobediência, resistência e corrupção ativa)',
            ],
          },
        ],
      },
      {
        nome: 'Direito Processual Penal',
        importancia: 4,
        cor: '#f97316',
        topicos: [
          {
            titulo: 'Inquérito Policial',
            subtopicos: [
              'Conceito, características (inquisitivo, escrito, sigiloso, oficial e indisponível)',
              'Instauração, prazos de conclusão para réu preso e solto',
              'Atuação da autoridade policial e preservação do local do crime',
            ],
          },
          {
            titulo: 'Prisões Cautelares e em Flagrante',
            subtopicos: [
              'Prisão em flagrante: espécies (próprio, impróprio, ficto, esperado e preparado)',
              'Sujeitos da prisão em flagrante: quem pode prender (qualquer do povo e dever policial)',
              'Procedimento do auto de prisão em flagrante e comunicação ao juiz/família',
              'Prisão preventiva e prisão temporária (Lei nº 7.960/1989)',
              'Audiência de custódia e medidas cautelares diversas da prisão',
            ],
          },
          {
            titulo: 'Da Prova no Processo Penal',
            subtopicos: [
              'Teoria geral da prova: licitude, inadmissibilidade de provas ilícitas e teoria dos frutos da árvore envenenada',
              'Corpo de delito, perícias e interrogatório',
              'Busca e apreensão domiciliar e pessoal (fundadas suspeitas)',
            ],
          },
        ],
      },
      {
        nome: 'Direito Penal Militar e Processual Penal Militar',
        importancia: 5,
        cor: '#dc2626',
        topicos: [
          {
            titulo: 'Direito Penal Militar (Código Penal Militar - CPM)',
            subtopicos: [
              'Crime militar em tempo de paz (Art. 9º do CPM com redação da Lei 13.491/2017)',
              'Crimes propriamente e impropriamente militares',
              'Crimes contra a autoridade e disciplina militar: motim, revolta, desrespeito a superior e recusa de obediência',
              'Crimes contra o dever militar: deserção e abandono de posto',
            ],
          },
          {
            titulo: 'Processo Penal Militar e Polícia Judiciária Militar',
            subtopicos: [
              'Inquérito Policial Militar (IPM): finalidade, instauração e prazos',
              'Competência da Justiça Militar Estadual / do DF (Art. 125, § 4º da CF/88)',
              'Auto de Prisão em Flagrante Delito Militar',
            ],
          },
        ],
      },
      {
        nome: 'Legislação Aplicável à PMDF e Específica',
        importancia: 5,
        cor: '#8b5cf6',
        topicos: [
          {
            titulo: 'Estatuto dos Policiais Militares da PMDF (Lei nº 7.289/1984)',
            subtopicos: [
              'Ingresso na PMDF, hierarquia e disciplina policial militar',
              'Cargos e funções policiais militares',
              'Obrigações, ética e deveres do policial militar do DF',
              'Violação das obrigações, processo disciplinar e conselhos de disciplina',
              'Direitos, prerrogativas e estabilidade',
            ],
          },
          {
            titulo: 'Organização Básica da PMDF (Lei nº 6.450/1977 e Decreto nº 10.443/2020)',
            subtopicos: [
              'Estrutura organizacional, órgãos de direção, apoio e execução da PMDF',
              'Atribuições dos Comandos Regionais e Batalhões Especializados (BOPE, ROTAM, BPCHOQUE, BPRV)',
            ],
          },
          {
            titulo: 'Legislação Penal Extravagante',
            subtopicos: [
              'Lei de Abuso de Autoridade (Lei nº 13.869/2019) e condutas tipificadas',
              'Estatuto do Desarmamento (Lei nº 10.826/2003): posse, porte, disparo e comércio ilegal',
              'Lei de Drogas (Lei nº 11.343/2006): tráfico de drogas vs porte para consumo pessoal',
              'Lei Maria da Penha (Lei nº 11.340/2006): medidas protetivas de urgência e atuação policial',
              'Lei de Crimes Hediondos (Lei nº 8.072/1990) e Lei de Tortura (Lei nº 9.455/1997)',
            ],
          },
        ],
      },
      {
        nome: 'Raciocínio Lógico-Matemático',
        importancia: 4,
        cor: '#ec4899',
        topicos: [
          {
            titulo: 'Lógica Proposicional',
            subtopicos: [
              'Proposições simples e compostas, conectivos lógicos (e, ou, se... então, se e somente se)',
              'Tabela-verdade: tautologia, contradição e contingência',
              'Equivalências lógicas (Leis de Morgan e equivalência da condicional)',
              'Negação de proposições simples e compostas',
            ],
          },
          {
            titulo: 'Argumentação Lógica e Quantificadores',
            subtopicos: [
              'Validade de argumentos: premissas e conclusão',
              'Quantificadores universais e existenciais (todo, nenhum, algum)',
              'Diagramas lógicos e conjuntos',
            ],
          },
          {
            titulo: 'Matemática Básica e Probabilidade',
            subtopicos: [
              'Razão, proporção, regra de três simples e porcentagem',
              'Princípio Fundamental da Contagem, arranjos, combinações e permutações',
              'Probabilidade simples e condicional em problemas práticos',
            ],
          },
        ],
      },
      {
        nome: 'Noções de Informática e Crimes Cibernéticos',
        importancia: 3,
        cor: '#06b6d4',
        topicos: [
          {
            titulo: 'Sistemas Operacionais e Aplicativos',
            subtopicos: [
              'Windows 10/11 e conceitos de Linux para segurança',
              'Edição de textos e planilhas (Word e Excel) para relatórios policiais',
            ],
          },
          {
            titulo: 'Redes, Internet e Segurança da Informação',
            subtopicos: [
              'Conceitos de internet, intranet, protocolos (TCP/IP, HTTP, HTTPS) e DNS',
              'Malwares (vírus, worms, trojans, ransomware e spywares)',
              'Ataques cibernéticos e engenharia social (phishing, spoofing)',
              'Autenticação de dois fatores, criptografia e preservação de evidências digitais',
            ],
          },
        ],
      },
    ];
  }

  // 2. CARREIRA POLICIAL GERAL (PF, PRF, PC, PM, PP)
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
              'Compreensão e inferência de texto de gêneros variados',
              'Reconhecimento de tipos e gêneros textuais',
              'Domínio dos mecanismos de coesão textual',
            ],
          },
          {
            titulo: 'Gramática e Sintaxe',
            subtopicos: [
              'Morfologia e emprego das classes gramaticais',
              'Sintaxe da oração e do período',
              'Concordância nominal e verbal',
              'Regência e emprego do sinal de crase',
              'Pontuação e efeitos de sentido',
            ],
          },
        ],
      },
      {
        nome: 'Direito Penal',
        importancia: 5,
        cor: '#ef4444',
        topicos: [
          {
            titulo: 'Parte Geral do Código Penal',
            subtopicos: [
              'Princípios fundamentais do Direito Penal',
              'Aplicação da lei penal no tempo e no espaço',
              'Teoria do crime: fato típico, ilicitude e culpabilidade',
              'Concurso de pessoas e concurso de crimes',
            ],
          },
          {
            titulo: 'Parte Especial do Código Penal',
            subtopicos: [
              'Crimes contra a pessoa (homicídio, lesão corporal)',
              'Crimes contra o patrimônio (furto, roubo, extorsão, estelionato)',
              'Crimes contra a fé pública e falsidades',
              'Crimes contra a Administração Pública (peculato, concussão, corrupção, desacato)',
            ],
          },
        ],
      },
      {
        nome: 'Direito Processual Penal',
        importancia: 4,
        cor: '#f97316',
        topicos: [
          {
            titulo: 'Inquérito Policial e Ação Penal',
            subtopicos: [
              'Inquérito policial: características, instauração e prazos',
              'Ação penal pública incondicionada, condicionada e privada',
            ],
          },
          {
            titulo: 'Provas e Prisões Cautelares',
            subtopicos: [
              'Exame de corpo de delito, interrogatório e busca e apreensão',
              'Prisão em flagrante delito e espécies',
              'Prisão preventiva e prisão temporária',
              'Audiência de custódia e medidas cautelares',
            ],
          },
        ],
      },
      {
        nome: 'Direito Constitucional',
        importancia: 4,
        cor: '#10b981',
        topicos: [
          {
            titulo: 'Direitos e Garantias Fundamentais',
            subtopicos: [
              'Direitos e deveres individuais e coletivos (Art. 5º da CF/88)',
              'Direitos sociais, nacionalidade e direitos políticos',
              'Garantias constitucionais do preso e devido processo legal',
            ],
          },
          {
            titulo: 'Segurança Pública e Organização dos Poderes',
            subtopicos: [
              'Segurança Pública (Art. 144 da CF/88) e atribuições dos órgãos policiais',
              'Poder Judiciário e Ministério Público',
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
              'Princípios da Administração Pública (LIMPE e implícitos)',
              'Administração direta e indireta',
            ],
          },
          {
            titulo: 'Agentes Públicos e Penalidades',
            subtopicos: [
              'Regime jurídico dos servidores públicos e estabilidade',
              'Deveres e proibições dos agentes públicos',
              'Regime disciplinar e penalidades funcionais (PAD e penalidades de servidor)',
            ],
          },
          {
            titulo: 'Poderes, Atos e Responsabilidade Civil',
            subtopicos: [
              'Poderes da administração: vinculado, discricionário, disciplinar e poder de polícia',
              'Atos administrativos: requisitos, atributos e extinção',
              'Responsabilidade civil do Estado',
            ],
          },
        ],
      },
      {
        nome: 'Legislação Penal Especial',
        importancia: 5,
        cor: '#8b5cf6',
        topicos: [
          {
            titulo: 'Leis Penais Extravagantes Fundamentais',
            subtopicos: [
              'Lei de Drogas (Lei nº 11.343/2006)',
              'Estatuto do Desarmamento (Lei nº 10.826/2003)',
              'Lei de Abuso de Autoridade (Lei nº 13.869/2019)',
              'Lei de Organizações Criminosas (Lei nº 12.850/2013)',
              'Lei Maria da Penha (Lei nº 11.340/2006)',
              'Lei de Crimes Hediondos (Lei nº 8.072/1990)',
            ],
          },
        ],
      },
      {
        nome: 'Raciocínio Lógico-Matemático',
        importancia: 3,
        cor: '#ec4899',
        topicos: [
          {
            titulo: 'Lógica Proposicional e Argumentação',
            subtopicos: [
              'Proposições, conectivos, tabela-verdade e equivalências lógicas',
              'Negação de proposições e diagramas lógicos',
              'Probabilidade e contagem',
            ],
          },
        ],
      },
      {
        nome: 'Informática e Segurança da Informação',
        importancia: 4,
        cor: '#06b6d4',
        topicos: [
          {
            titulo: 'Redes, Navegação e Segurança',
            subtopicos: [
              'Redes de computadores, internet e protocolos de comunicação',
              'Segurança da informação: vírus, ransomware, phishing e backup',
              'Sistemas operacionais Windows e Linux',
              'Computação em nuvem e armazenamento',
            ],
          },
        ],
      },
    ];
  }

  // 3. CARREIRA BANCÁRIA (BACEN, BB, CAIXA, BNDES)
  if (carreira === 'bancaria') {
    return [
      {
        nome: 'Conhecimentos Bancários e SFN',
        importancia: 5,
        cor: '#14b8a6',
        topicos: [
          {
            titulo: 'Estrutura do Sistema Financeiro Nacional (SFN)',
            subtopicos: [
              'Conselho Monetário Nacional (CMN): composição e atribuições regulatórias',
              'Banco Central do Brasil (BACEN): papel, independência e atribuições',
              'Comissão de Valores Mobiliários (CVM), SUSEP e PREVIC',
              'Instituições financeiras monetárias e não monetárias',
            ],
          },
          {
            titulo: 'Produtos e Serviços Financeiros',
            subtopicos: [
              'Depósitos à vista e a prazo (CDB, RDB, LCI, LCA)',
              'Operações de crédito: crédito pessoal, consignado e rotativo',
              'Serviços de pagamento: PIX, TED, cartões de crédito e débito',
              'Sistema de Pagamentos Brasileiro (SPB)',
            ],
          },
          {
            titulo: 'Política Monetária e Mercado Cambial',
            subtopicos: [
              'Instrumentos de política monetária (Taxa Selic, depósito compulsório, redesconto)',
              'Regime de metas para a inflação e índice IPCA',
              'Mercado de câmbio: taxas de câmbio, operações spot e hedge cambial',
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
            titulo: 'Interpretação e Gramática',
            subtopicos: [
              'Compreensão e tipologia de textos econômicos e normativos',
              'Sintaxe da oração e do período',
              'Concordância, regência e emprego da crase',
              'Manual de Redação Oficial',
            ],
          },
        ],
      },
      {
        nome: 'Economia e Finanças Públicas',
        importancia: 5,
        cor: '#f59e0b',
        topicos: [
          {
            titulo: 'Microeconomia e Macroeconomia',
            subtopicos: [
              'Demanda, oferta e equilíbrio de mercado',
              'Contas nacionais e produto interno bruto (PIB)',
              'Inflação, desemprego e curvas de oferta agregada',
              'Políticas fiscal, monetária e cambial',
            ],
          },
        ],
      },
      {
        nome: 'Direito Administrativo e Constitucional',
        importancia: 4,
        cor: '#8b5cf6',
        topicos: [
          {
            titulo: 'Administração Pública e Servidor',
            subtopicos: [
              'Princípios constitucionais e organização administrativa',
              'Regime disciplinar e penalidades de servidores públicos federais (Lei 8.112/90)',
              'Processo Administrativo Federal (Lei nº 9.784/1999)',
              'Lei de Acesso à Informação (Lei nº 12.527/2011)',
            ],
          },
        ],
      },
      {
        nome: 'Raciocínio Lógico-Matemático e Estatística',
        importancia: 4,
        cor: '#ec4899',
        topicos: [
          {
            titulo: 'Matemática Financeira e Estatística',
            subtopicos: [
              'Juros simples e compostos, taxas nominais e efetivas',
              'Sistemas de amortização (SAC e Price)',
              'Estatística descritiva, média, variância e desvio-padrão',
            ],
          },
        ],
      },
    ];
  }

  // 4. CARREIRA FISCAL (RECEITA FEDERAL, SEFAZ, ISS)
  if (carreira === 'fiscal') {
    return [
      {
        nome: 'Direito Tributário',
        importancia: 5,
        cor: '#ef4444',
        topicos: [
          {
            titulo: 'Sistema Tributário Nacional e CTN',
            subtopicos: [
              'Conceito e espécies de tributos (impostos, taxas, contribuições de melhoria e empréstimos compulsórios)',
              'Princípios e limitações constitucionais ao poder de tributar',
              'Competência tributária e imunidades',
              'Obrigação tributária, fato gerador e sujeito ativo/passivo',
              'Crédito tributário: constituição, suspensão, extinção e exclusão',
            ],
          },
        ],
      },
      {
        nome: 'Contabilidade Geral e Avançada',
        importancia: 5,
        cor: '#10b981',
        topicos: [
          {
            titulo: 'Demonstrações Contábeis e Pronunciamentos CPC',
            subtopicos: [
              'Patrimônio líquido, ativos, passivos e equação patrimonial',
              'Lançamentos contábeis e escrituração no método das partidas dobradas',
              'Balanço Patrimonial e Demonstração do Resultado do Exercício (DRE)',
              'Demonstração dos Fluxos de Caixa (DFC) e DVA',
            ],
          },
        ],
      },
      {
        nome: 'Direito Administrativo e Penalidades',
        importancia: 4,
        cor: '#3b82f6',
        topicos: [
          {
            titulo: 'Organização, Agentes e Penalidades',
            subtopicos: [
              'Princípios da administração pública e atos administrativos',
              'Regime jurídico e penalidades de servidores públicos federais/estaduais',
              'Licitações e Contratos Administrativos (Lei 14.133/2021)',
              'Processo administrativo tributário',
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
            titulo: 'Constituição e Finanças Públicas',
            subtopicos: [
              'Direitos fundamentais e organização do Estado',
              'Finanças públicas e orçamento na CF/88',
              'Ordem econômica e financeira',
            ],
          },
        ],
      },
      {
        nome: 'Auditoria Fiscal',
        importancia: 5,
        cor: '#f59e0b',
        topicos: [
          {
            titulo: 'Técnicas e Procedimentos de Auditoria',
            subtopicos: [
              'Normas de auditoria, papéis de trabalho e evidências',
              'Testes substantivos e de observância',
              'Relatório e parecer de auditoria',
            ],
          },
        ],
      },
      {
        nome: 'Língua Portuguesa',
        importancia: 4,
        cor: '#14b8a6',
        topicos: [
          {
            titulo: 'Interpretação e Gramática',
            subtopicos: [
              'Interpretação e compreensão textual',
              'Sintaxe da oração, concordância, regência e pontuação',
            ],
          },
        ],
      },
    ];
  }

  // 5. CARREIRA TRIBUNAIS (TJ, TRT, TRE, TRF, MPU)
  if (carreira === 'tribunais') {
    return [
      {
        nome: 'Direito Constitucional',
        importancia: 5,
        cor: '#10b981',
        topicos: [
          {
            titulo: 'Poder Judiciário e Funções Essenciais à Justiça',
            subtopicos: [
              'Direitos e garantias fundamentais (Art. 5º)',
              'Organização e competência dos Tribunais (STF, STJ, TJs, TRFs, TRTs)',
              'Ministério Público, Advocacia Pública e Defensoria Pública',
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
            titulo: 'Princípios, Agentes e Penalidades de Servidor',
            subtopicos: [
              'Princípios da administração e poderes administrativos',
              'Atos administrativos e responsabilidade civil estatal',
              'Regime jurídico e penalidades disciplinares de servidor do Judiciário',
              'Nova Lei de Licitações (Lei nº 14.133/2021)',
            ],
          },
        ],
      },
      {
        nome: 'Direito Processual Civil',
        importancia: 5,
        cor: '#8b5cf6',
        topicos: [
          {
            titulo: 'Processo de Conhecimento e Execução (CPC/2015)',
            subtopicos: [
              'Princípios fundamentais do processo civil',
              'Jurisdição, competência, partes e procuradores',
              'Prazos processuais, intimações e citações',
              'Tutelas provisórias de urgência e evidência',
              'Procedimento comum e sistema recursal',
            ],
          },
        ],
      },
      {
        nome: 'Língua Portuguesa',
        importancia: 5,
        cor: '#14b8a6',
        topicos: [
          {
            titulo: 'Compreensão de Texto e Redação Oficial',
            subtopicos: [
              'Compreensão e interpretação de textos jurídicos e gerais',
              'Sintaxe, pontuação, regência e crase',
              'Manual de Redação Oficial',
            ],
          },
        ],
      },
      {
        nome: 'Raciocínio Lógico e Noções de Informática',
        importancia: 3,
        cor: '#ec4899',
        topicos: [
          {
            titulo: 'Lógica e Ferramentas Digitais',
            subtopicos: [
              'Lógica de argumentação e diagramas',
              'Processo Judicial Eletrônico (PJe) e segurança da informação',
            ],
          },
        ],
      },
    ];
  }

  // 6. CARREIRA ADMINISTRATIVA PADRÃO (Prefeituras, Autarquias, Ministérios)
  return [
    {
      nome: 'Língua Portuguesa',
      importancia: 5,
      cor: '#14b8a6',
      topicos: [
        {
          titulo: 'Compreensão e Interpretação de Textos',
          subtopicos: [
            'Interpretação e inferência em textos informativos e normativos',
            'Coesão e coerência textual',
            'Variação linguística e adequação de registro',
          ],
        },
        {
          titulo: 'Gramática Normativa e Redação Oficial',
          subtopicos: [
            'Ortografia oficial e acentuação gráfica',
            'Classes de palavras e flexão verbal',
            'Sintaxe de regência, concordância e emprego da crase',
            'Pontuação e efeitos expressivos',
            'Redação de expedientes oficiais (ofício, memorando, ata)',
          ],
        },
      ],
    },
    {
      nome: 'Direito Administrativo e Legislação',
      importancia: 5,
      cor: '#3b82f6',
      topicos: [
        {
          titulo: 'Administração Pública e Princípios',
          subtopicos: [
            'Princípios expressos no art. 37 da CF/88 (LIMPE)',
            'Organização da Administração Direta e Indireta',
          ],
        },
        {
          titulo: 'Agentes Públicos e Penalidades de Servidor',
          subtopicos: [
            'Cargo, emprego e função pública: investidura e estágio probatório',
            'Deveres, direitos e proibições do servidor público',
            'Regime disciplinar: advertência, suspensão, demissão e cassação de aposentadoria',
            'Processo Administrativo Disciplinar (PAD) e direito de defesa',
          ],
        },
        {
          titulo: 'Atos Administrativos e Licitações',
          subtopicos: [
            'Atributos e requisitos de validade dos atos administrativos',
            'Noções da Nova Lei de Licitações (Lei nº 14.133/2021)',
            'Lei de Improbidade Administrativa (Lei nº 8.429/1992)',
          ],
        },
      ],
    },
    {
      nome: 'Noções de Direito Constitucional',
      importancia: 4,
      cor: '#10b981',
      topicos: [
        {
          titulo: 'Direitos Fundamentais e Administração',
          subtopicos: [
            'Direitos e deveres individuais e coletivos (Art. 5º da CF/88)',
            'Disposições gerais da administração pública (Arts. 37 a 41)',
          ],
        },
      ],
    },
    {
      nome: 'Noções de Administração Geral e Pública',
      importancia: 4,
      cor: '#f59e0b',
      topicos: [
        {
          titulo: 'Rotinas Administrativas e Atendimento',
          subtopicos: [
            'Gestão de documentos e técnicas de arquivologia',
            'Qualidade no atendimento ao público e cidadão',
            'Gestão de materiais e patrimônio público',
            'Comunicação interpessoal e trabalho em equipe',
          ],
        },
      ],
    },
    {
      nome: 'Raciocínio Lógico e Informática',
      importancia: 3,
      cor: '#ec4899',
      topicos: [
        {
          titulo: 'Lógica e Tecnologia do Trabalho',
          subtopicos: [
            'Estruturas lógicas simples e problemas aritméticos',
            'Edição de textos e planilhas no ambiente de trabalho',
            'Uso seguro da internet, correio eletrônico e nuvem',
          ],
        },
      ],
    },
  ];
}
