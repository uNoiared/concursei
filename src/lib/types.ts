// Tipos de dados do Concursei. Os nomes dos campos seguem as colunas do banco (Supabase).

export type Tipo = 'concurso' | 'faculdade';
export type StatusConcurso = 'interesse' | 'estudando' | 'concluido' | 'arquivado';

export interface Concurso {
  id: string;
  user_id?: string;
  tipo: Tipo;
  nome: string; // ex.: "TRT 2ª Região — Analista Judiciário" ou "Engenharia — 3º semestre"
  orgao?: string | null;
  banca?: string | null;
  cargo?: string | null;
  uf?: string | null;
  escolaridade?: string | null;
  salario?: string | null;
  vagas?: string | null;
  inscricao_ate?: string | null; // yyyy-mm-dd
  data_prova?: string | null; // yyyy-mm-dd
  link?: string | null;
  fonte?: string | null; // 'pci' | 'manual'
  fonte_id?: string | null;
  status: StatusConcurso;
  status_edital?: 'aberto' | 'pre_edital';
  edital_rotulo?: string;
  edital_origem?: string;
  forte_expectativa?: boolean;
  ano_previsto?: string | null;
  descricao_noticia?: string | null;
  cor?: string | null;
  created_at?: string;
}

export interface Edital {
  id: string;
  user_id?: string;
  concurso_id: string;
  arquivo_nome?: string | null;
  arquivo_path?: string | null; // caminho no Supabase Storage
  texto?: string | null;
  created_at?: string;
}

export interface Materia {
  id: string;
  user_id?: string;
  concurso_id: string;
  nome: string;
  importancia: number; // 1-5 (peso na prova)
  conhecimento: number; // 1-5 (1 = nunca estudei, 5 = domino)
  horas_semanais_desejadas?: number | null; // se definido, fixa o tempo semanal da matéria
  horas_totais_meta?: number | null; // meta total de horas até a prova
  cor: string;
  ordem: number;
  ativa: boolean;
  created_at?: string;
}

export interface Subtopico {
  id: string;
  nome: string;
  ordem?: number;
  concluido: boolean;
  concluido_em?: string | null;
  revisoes: number;
}

export interface Topico {
  id: string;
  user_id?: string;
  concurso_id: string;
  materia_id: string;
  nome: string;
  ordem: number;
  concluido: boolean;
  concluido_em?: string | null;
  revisoes: number;
  subtopicos?: Subtopico[];
  created_at?: string;
}

export interface Plano {
  id: string;
  user_id?: string;
  concurso_id: string;
  horas_semanais: number;
  dias: number[]; // minutos disponíveis por dia da semana, índice 0 = domingo
  duracao_bloco: number; // minutos por sessão de estudo
  data_inicio?: string | null;
  atualizado_em?: string;
}

export type ModoTimer = 'cronometro' | 'temporizador' | 'pomodoro' | 'manual';

export interface Sessao {
  id: string;
  user_id?: string;
  concurso_id?: string | null;
  materia_id?: string | null;
  topico_id?: string | null;
  inicio: string; // ISO
  duracao_seg: number;
  modo: ModoTimer;
  questoes_total?: number;
  questoes_acertos?: number;
  questoes_erros?: number;
  notas?: string | null;
  created_at?: string;
}

export interface RegistroQuestoes {
  id: string;
  user_id?: string;
  concurso_id?: string | null;
  materia_id?: string | null;
  topico_id?: string | null;
  total: number;
  acertos: number;
  erros: number;
  taxa_acerto: number; // 0 - 100%
  banca?: string | null;
  data: string; // ISO ou yyyy-mm-dd
  observacao?: string | null;
  created_at?: string;
}

export interface DB {
  concursos: Concurso[];
  editais: Edital[];
  materias: Materia[];
  topicos: Topico[];
  planos: Plano[];
  sessoes: Sessao[];
  questoes: RegistroQuestoes[];
}

export type Tabela = keyof DB;

export const TABELAS: Tabela[] = ['concursos', 'editais', 'materias', 'topicos', 'planos', 'sessoes', 'questoes'];

export const emptyDB = (): DB => ({ concursos: [], editais: [], materias: [], topicos: [], planos: [], sessoes: [], questoes: [] });

// Concurso vindo da busca (API /api/concursos)
export interface ConcursoAberto {
  id: string;
  orgao: string;
  titulo: string;
  link: string;
  logo: string | null;
  uf: string;
  regiao: string;
  nacional: boolean;
  resumo: string;
  vagas: number | null;
  cadastroReserva: boolean;
  salarioMax: number | null;
  cargos: string;
  escolaridade: string[];
  inscricaoAte: string | null;
  inscricaoTexto: string;
  tipo: string;
  statusEdital?: 'aberto' | 'pre_edital';
  editalRotulo?: string;
  forteExpectativa?: boolean;
  anoPrevisto?: string | null;
  descricaoNoticia?: string | null;
}
