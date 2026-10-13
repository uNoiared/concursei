// Camada de dados unificada: LocalStorage + Nuvem Supabase + Backup JSON
import { Concurso, DB, emptyDB, Materia, Plano, RegistroQuestoes, Sessao, TABELAS, Tabela, Topico } from './types.ts';
import { getSupabase } from './supabaseClient.ts';
import { sanitizarNomeConcurso } from './sanitizeConcurso.ts';

const STORAGE_KEY = 'concursei_data_v1';

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error(e);
    }
  });
}

export function subscribeData(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Dados iniciais de demonstração (seed) para o aluno experimentar na hora
export function getInitialSeed(): DB {
  const c1Id = 'c1-receita-federal';
  const c2Id = 'c2-direito-faculdade';

  const concursos: Concurso[] = [
    {
      id: c1Id,
      tipo: 'concurso',
      nome: 'Receita Federal — Auditor-Fiscal',
      orgao: 'Receita Federal do Brasil',
      banca: 'FGV',
      cargo: 'Auditor-Fiscal da Receita Federal',
      uf: 'Nacional',
      escolaridade: 'Superior em qualquer área',
      salario: 'R$ 22.921,71',
      vagas: '230 imediatas',
      inscricao_ate: '2026-11-20',
      data_prova: '2026-12-15',
      status: 'estudando',
      cor: '#14b8a6',
      created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    },
    {
      id: c2Id,
      tipo: 'faculdade',
      nome: 'Direito — 4º Semestre (Faculdade)',
      orgao: 'Universidade',
      banca: 'Faculdade',
      cargo: 'Graduação',
      uf: 'SP',
      escolaridade: 'Superior em andamento',
      salario: '',
      vagas: '',
      status: 'estudando',
      cor: '#6366f1',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
  ];

  const materias: Materia[] = [
    // Matérias do Concurso
    {
      id: 'm1-dir-trib',
      concurso_id: c1Id,
      nome: 'Direito Tributário',
      importancia: 5,
      conhecimento: 2,
      horas_semanais_desejadas: null,
      cor: '#14b8a6',
      ordem: 1,
      ativa: true,
    },
    {
      id: 'm2-contab',
      concurso_id: c1Id,
      nome: 'Contabilidade Geral e Avançada',
      importancia: 5,
      conhecimento: 1,
      horas_semanais_desejadas: null,
      cor: '#6366f1',
      ordem: 2,
      ativa: true,
    },
    {
      id: 'm3-port',
      concurso_id: c1Id,
      nome: 'Língua Portuguesa (FGV)',
      importancia: 4,
      conhecimento: 3,
      horas_semanais_desejadas: 3, // Aluno fixou 3h semanais
      cor: '#f59e0b',
      ordem: 3,
      ativa: true,
    },
    {
      id: 'm4-const',
      concurso_id: c1Id,
      nome: 'Direito Constitucional',
      importancia: 4,
      conhecimento: 4,
      horas_semanais_desejadas: null,
      cor: '#10b981',
      ordem: 4,
      ativa: true,
    },
    {
      id: 'm5-rlm',
      concurso_id: c1Id,
      nome: 'Raciocínio Lógico e Estatística',
      importancia: 3,
      conhecimento: 2,
      horas_semanais_desejadas: null,
      cor: '#ec4899',
      ordem: 5,
      ativa: true,
    },

    // Matérias da Faculdade
    {
      id: 'm-fac-1',
      concurso_id: c2Id,
      nome: 'Direito Processual Civil II',
      importancia: 5,
      conhecimento: 3,
      horas_semanais_desejadas: 4,
      cor: '#8b5cf6',
      ordem: 1,
      ativa: true,
    },
    {
      id: 'm-fac-2',
      concurso_id: c2Id,
      nome: 'Direito Penal III (Crimes em Espécie)',
      importancia: 4,
      conhecimento: 2,
      horas_semanais_desejadas: 3,
      cor: '#ef4444',
      ordem: 2,
      ativa: true,
    },
  ];

  const topicos: Topico[] = [
    { id: 't1', concurso_id: c1Id, materia_id: 'm1-dir-trib', nome: '1. Sistema Tributário Nacional e Princípios', ordem: 1, concluido: true, revisoes: 2 },
    { id: 't2', concurso_id: c1Id, materia_id: 'm1-dir-trib', nome: '2. Limitações ao Poder de Tributar e Imunidades', ordem: 2, concluido: true, revisoes: 1 },
    { id: 't3', concurso_id: c1Id, materia_id: 'm1-dir-trib', nome: '3. Competência Tributária e Repartição das Receitas', ordem: 3, concluido: false, revisoes: 0 },
    { id: 't4', concurso_id: c1Id, materia_id: 'm1-dir-trib', nome: '4. Obrigação Tributária e Fato Gerador', ordem: 4, concluido: false, revisoes: 0 },
    { id: 't5', concurso_id: c1Id, materia_id: 'm2-contab', nome: '1. CPC 00 — Estrutura Conceitual Básica', ordem: 1, concluido: true, revisoes: 1 },
    { id: 't6', concurso_id: c1Id, materia_id: 'm2-contab', nome: '2. Balanço Patrimonial e Demonstrações Contábeis', ordem: 2, concluido: false, revisoes: 0 },
    { id: 't7', concurso_id: c1Id, materia_id: 'm3-port', nome: '1. Interpretação de Textos e Coesão Textual (FGV)', ordem: 1, concluido: true, revisoes: 3 },
    { id: 't8', concurso_id: c1Id, materia_id: 'm3-port', nome: '2. Tipologia, Sintaxe e Pontuação', ordem: 2, concluido: false, revisoes: 0 },
  ];

  const planos: Plano[] = [
    {
      id: 'p1',
      concurso_id: c1Id,
      horas_semanais: 24,
      dias: [0, 240, 240, 240, 240, 240, 240], // 4h por dia seg-sab (24h)
      duracao_bloco: 60,
      data_inicio: '2026-10-01',
      atualizado_em: new Date().toISOString(),
    },
    {
      id: 'p2',
      concurso_id: c2Id,
      horas_semanais: 10,
      dias: [0, 120, 120, 120, 120, 120, 0], // 2h por dia seg-sex
      duracao_bloco: 60,
      data_inicio: '2026-08-01',
      atualizado_em: new Date().toISOString(),
    },
  ];

  const sessoes: Sessao[] = [
    {
      id: 's1',
      concurso_id: c1Id,
      materia_id: 'm1-dir-trib',
      topico_id: 't1',
      inicio: new Date(Date.now() - 2 * 86400000 - 3600000).toISOString(),
      duracao_seg: 3600,
      modo: 'cronometro',
      notas: 'Estudado princípios da legalidade e anterioridade. 15 questões resolvidas (13 acertos).',
    },
    {
      id: 's2',
      concurso_id: c1Id,
      materia_id: 'm2-contab',
      topico_id: 't5',
      inicio: new Date(Date.now() - 1 * 86400000 - 4000000).toISOString(),
      duracao_seg: 3000,
      modo: 'pomodoro',
      notas: 'Revisão do CPC 00. Foco em características qualitativas.',
    },
    {
      id: 's3',
      concurso_id: c1Id,
      materia_id: 'm3-port',
      topico_id: 't7',
      inicio: new Date(Date.now() - 3600000).toISOString(),
      duracao_seg: 2700,
      modo: 'temporizador',
      notas: 'Bateria de interpretação FGV.',
    },
  ];

  const questoes: RegistroQuestoes[] = [
    {
      id: 'q1',
      concurso_id: c1Id,
      materia_id: 'm1-dir-trib',
      topico_id: 't1',
      total: 20,
      acertos: 17,
      erros: 3,
      taxa_acerto: 85,
      banca: 'FGV',
      data: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
      observacao: 'Bateria de princípios tributários. Bom domínio de legalidade e anterioridade.',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'q2',
      concurso_id: c1Id,
      materia_id: 'm2-contab',
      topico_id: 't5',
      total: 15,
      acertos: 11,
      erros: 4,
      taxa_acerto: 73,
      banca: 'FGV',
      data: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
      observacao: 'Questões do CPC 00. Revisar conceitos de mensuração.',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'q3',
      concurso_id: c1Id,
      materia_id: 'm3-port',
      topico_id: 't7',
      total: 25,
      acertos: 23,
      erros: 2,
      taxa_acerto: 92,
      banca: 'FGV',
      data: new Date().toISOString().slice(0, 10),
      observacao: 'Interpretação e coesão textual padrão FGV.',
      created_at: new Date().toISOString(),
    },
  ];

  return {
    concursos,
    editais: [],
    materias,
    topicos,
    planos,
    sessoes,
    questoes,
  };
}

export function loadLocalDB(): DB {
  if (typeof window === 'undefined') return emptyDB();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = getInitialSeed();
    saveLocalDB(seed);
    return seed;
  }
  try {
    const parsed = JSON.parse(raw);
    const db = emptyDB();
    TABELAS.forEach((t) => {
      if (Array.isArray(parsed[t])) db[t] = parsed[t];
    });
    if (!Array.isArray(db.questoes)) db.questoes = [];

    // Sanitiza concursos previamente salvos que ainda possuam resquícios de manchetes
    if (Array.isArray(db.concursos)) {
      db.concursos = db.concursos.map((c) => {
        if (c.orgao && (c.orgao.length > 40 || /\b(abre|anuncia|autoriza|planeja|prevê|edital|notícia|noticia)\b/i.test(c.orgao))) {
          const limpo = sanitizarNomeConcurso(c.orgao, c.cargo || '');
          return {
            ...c,
            orgao: limpo.orgao,
            cargo: limpo.cargo,
            nome: limpo.titulo,
          };
        }
        return c;
      });
    }

    return db;
  } catch (err) {
    console.error('[storage] Erro ao carregar dados locais:', err);
    return emptyDB();
  }
}

export function saveLocalDB(db: DB) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  notify();
}

// Limpa histórico de desempenho (sessões e caderno de questões)
export function limparDesempenhoStorage() {
  const db = loadLocalDB();
  db.sessoes = [];
  db.questoes = [];
  saveLocalDB(db);

  const sb = getSupabase();
  if (sb) {
    sb.auth.getUser().then(({ data }) => {
      if (data?.user) {
        Promise.all([
          sb.from('sessoes').delete().eq('user_id', data.user.id),
          sb.from('questoes').delete().eq('user_id', data.user.id),
        ]).catch(() => {});
      }
    });
  }
}

// Sincronização em nuvem se o Supabase estiver configurado
export async function syncWithSupabase(): Promise<{ success: boolean; message: string }> {
  const sb = getSupabase();
  if (!sb) return { success: false, message: 'Supabase não configurado.' };

  const { data: userData } = await sb.auth.getUser();
  if (!userData?.user) {
    return { success: false, message: 'Faça login para sincronizar com a nuvem.' };
  }

  const userId = userData.user.id;
  const db = loadLocalDB();

  try {
    // 1. Puxa dados da nuvem
    for (const t of TABELAS) {
      const { data, error } = await sb.from(t).select('*').eq('user_id', userId);
      if (error) {
        console.warn(`[sync] Erro ao baixar tabela ${t}:`, error.message);
        continue;
      }
      if (data && data.length > 0) {
        db[t] = mergePorId(db[t] as Array<{ id: string }>, data as Array<{ id: string }>) as never;
      }
    }

    // 2. Salva itens locais na nuvem que ainda não têm user_id
    for (const t of TABELAS) {
      const rows = (db[t] as Array<{ id: string; user_id?: string }>).map((item) => ({
        ...item,
        user_id: userId,
      }));
      if (rows.length > 0) {
        await sb.from(t).upsert(rows);
      }
    }

    saveLocalDB(db);
    return { success: true, message: 'Dados sincronizados com sucesso!' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Erro ao sincronizar: ${msg}` };
  }
}

function mergePorId<T extends { id: string }>(locais: T[], remotos: T[]): T[] {
  const map = new Map<string, T>();
  locais.forEach((item) => map.set(item.id, item));
  remotos.forEach((item) => map.set(item.id, item));
  return Array.from(map.values());
}

// CRUD Genérico Local com salvamento automático
export function getTable<K extends Tabela>(tabela: K): DB[K] {
  return loadLocalDB()[tabela];
}

export function upsertRow<K extends Tabela>(tabela: K, row: DB[K][number]) {
  const db = loadLocalDB();
  const list = db[tabela] as Array<{ id: string }>;
  const idx = list.findIndex((item) => item.id === (row as { id: string }).id);
  if (idx >= 0) {
    list[idx] = row;
  } else {
    list.push(row);
  }
  saveLocalDB(db);

  // Sincroniza em background se houver Supabase logado
  const sb = getSupabase();
  if (sb) {
    sb.auth.getUser().then(({ data }) => {
      if (data?.user) {
        Promise.resolve(sb.from(tabela).upsert({ ...row, user_id: data.user.id })).catch(() => {});
      }
    });
  }
}

export function deleteRow<K extends Tabela>(tabela: K, id: string) {
  const db = loadLocalDB();
  const list = db[tabela] as Array<{ id: string }>;
  db[tabela] = list.filter((item) => item.id !== id) as unknown as DB[K];
  saveLocalDB(db);

  const sb = getSupabase();
  if (sb) {
    Promise.resolve(sb.from(tabela).delete().eq('id', id)).catch(() => {});
  }
}

// Salva em lote todas as matérias e tópicos de um concurso em uma única gravação atômica
export function salvarGradeCompleta(
  concursoId: string,
  novasMaterias: Materia[],
  novosTopicos: Topico[]
) {
  const db = loadLocalDB();
  db.materias = [
    ...db.materias.filter((m) => m.concurso_id !== concursoId),
    ...novasMaterias,
  ];
  db.topicos = [
    ...db.topicos.filter((t) => t.concurso_id !== concursoId),
    ...novosTopicos,
  ];
  saveLocalDB(db);

  // Sincroniza em segundo plano se Supabase estiver ativo
  const sb = getSupabase();
  if (sb) {
    sb.auth.getUser().then(({ data }) => {
      if (data?.user) {
        const uId = data.user.id;
        const mats = novasMaterias.map((m) => ({ ...m, user_id: uId }));
        const tops = novosTopicos.map((t) => ({ ...t, user_id: uId }));
        if (mats.length > 0) sb.from('materias').upsert(mats).then(() => {});
        if (tops.length > 0) sb.from('topicos').upsert(tops).then(() => {});
      }
    });
  }
}

// Backup em arquivo JSON para o aluno
export function exportarBackupJSON(): string {
  const db = loadLocalDB();
  return JSON.stringify(db, null, 2);
}

export function importarBackupJSON(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    const db = emptyDB();
    TABELAS.forEach((t) => {
      if (Array.isArray(parsed[t])) db[t] = parsed[t];
    });
    saveLocalDB(db);
    return true;
  } catch (err) {
    console.error('[storage] Falha ao importar backup:', err);
    return false;
  }
}

