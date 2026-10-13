// Estado global da aplicação com persistência do cronômetro e reatividade
import { create } from 'zustand';
import { Concurso, ConcursoAberto, DB, Materia, ModoTimer, Plano, RegistroQuestoes, Sessao, Topico } from '../lib/types.ts';
import { deleteRow, loadLocalDB, salvarGradeCompleta, subscribeData, upsertRow, limparDesempenhoStorage } from '../lib/storage.ts';
import { gerarDisciplinasETopicosPadrao } from '../lib/editaisPadrao.ts';
import { sanitizarNomeConcurso } from '../lib/sanitizeConcurso.ts';
import { sounds } from '../lib/audio.ts';

export type Tela = 'concursos_abertos' | 'meus_estudos' | 'concurso_detalhe' | 'cronometro' | 'estatisticas';

interface TimerState {
  isRunning: boolean;
  mode: ModoTimer;
  elapsedSeconds: number; // para cronômetro
  countdownDurationSec: number; // para temporizador (ex: 50 * 60)
  countdownRemainingSec: number;
  pomodoroFocoMin: number;
  pomodoroPausaMin: number;
  pomodoroFase: 'foco' | 'pausa';
  pomodoroCiclos: number;
  concursoId: string | null;
  materiaId: string | null;
  topicoId: string | null;
  inicioIso: string | null;
  inicioTimestamp: number | null;
  baseElapsedSeconds: number;
  baseRemainingSec: number;
}

interface AppStore {
  // Navegação
  tela: Tela;
  setTela: (t: Tela) => void;
  concursoSelecionadoId: string | null;
  setConcursoSelecionadoId: (id: string | null) => void;
  abaConcurso: 'organizador' | 'edital' | 'questoes' | 'planejamento' | 'sessoes';
  setAbaConcurso: (aba: 'organizador' | 'edital' | 'questoes' | 'planejamento' | 'sessoes') => void;

  // Tema
  tema: 'dark' | 'light';
  toggleTema: () => void;

  // Banco de Dados Local / Nuvem
  db: DB;
  recarregarDb: () => void;

  // Concursos Abertos (API PCI)
  concursosAbertos: ConcursoAberto[];
  carregandoConcursos: boolean;
  erroConcursos: string | null;
  carregarConcursosAbertos: (force?: boolean) => Promise<void>;

  // Filtros da busca de concursos
  filtroBusca: string;
  setFiltroBusca: (v: string) => void;
  filtroUf: string;
  setFiltroUf: (v: string) => void;
  filtroRegiao: string;
  setFiltroRegiao: (v: string) => void;
  filtroStatusEdital: 'todos' | 'aberto' | 'pre_edital' | 'forte_expectativa';
  setFiltroStatusEdital: (v: 'todos' | 'aberto' | 'pre_edital' | 'forte_expectativa') => void;
  filtroForteExpectativa: boolean;
  setFiltroForteExpectativa: (v: boolean) => void;
  filtroEscolaridade: string;
  setFiltroEscolaridade: (v: string) => void;
  filtroSalarioMin: number;
  setFiltroSalarioMin: (v: number) => void;
  filtroOrdenacao: 'prazo' | 'salario' | 'vagas' | 'recente';
  setFiltroOrdenacao: (v: 'prazo' | 'salario' | 'vagas' | 'recente') => void;
  carregarEditalAutomaticoParaConcurso: (concursoId: string) => Promise<void>;

  // Cronômetro
  timer: TimerState;
  setTimerMode: (mode: ModoTimer) => void;
  setTimerVinculo: (concursoId: string | null, materiaId: string | null, topicoId: string | null) => void;
  setCountdownDuration: (minutos: number) => void;
  setPomodoroConfig: (focoMin: number, pausaMin: number) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;
  salvarSessao: (dados: { notas?: string; acertos?: number; erros?: number; tempoSegManual?: number }) => Sessao;

  // Limpeza de Desempenho
  limparHistoricoDesempenho: () => void;

  // Ações de Concurso / Matéria / Tópico / Subtópico
  adicionarConcursoDeAberto: (aberto: ConcursoAberto) => string;
  criarConcurso: (dados: Partial<Concurso>) => string;
  salvarPlano: (plano: Partial<Plano> & { concurso_id: string }) => void;
  adicionarMateria: (concursoId: string, dados: Partial<Materia>) => string;
  atualizarMateria: (materia: Materia) => void;
  removerMateria: (id: string) => void;
  adicionarTopico: (concursoId: string, materiaId: string, nome: string) => string;
  toggleTopicoConcluido: (topicoId: string) => void;
  incrementarRevisaoTopico: (topicoId: string) => void;
  toggleSubtopicoConcluido: (topicoId: string, subtopicoId: string) => void;
  incrementarRevisaoSubtopico: (topicoId: string, subtopicoId: string) => void;
  adicionarSubtopico: (topicoId: string, nome: string) => void;
  removerTopico: (id: string) => void;
  removerConcurso: (id: string) => void;

  // Organizador de Questões
  adicionarRegistroQuestoes: (dados: Omit<RegistroQuestoes, 'id' | 'created_at'>) => string;
  removerRegistroQuestoes: (id: string) => void;
}

const TIMER_STORAGE_KEY = 'concursei_timer_active_v1';

function carregarTimerInicial(): TimerState {
  const padrao: TimerState = {
    isRunning: false,
    mode: 'cronometro',
    elapsedSeconds: 0,
    countdownDurationSec: 50 * 60,
    countdownRemainingSec: 50 * 60,
    pomodoroFocoMin: 25,
    pomodoroPausaMin: 5,
    pomodoroFase: 'foco',
    pomodoroCiclos: 0,
    concursoId: null,
    materiaId: null,
    topicoId: null,
    inicioIso: null,
    inicioTimestamp: null,
    baseElapsedSeconds: 0,
    baseRemainingSec: 50 * 60,
  };

  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const agora = Date.now();
        // O cronômetro NÃO deve parar quando o aluno navega ou recarrega a página
        if (parsed.isRunning && parsed.inicioTimestamp) {
          const deltaSeg = Math.max(0, Math.floor((agora - parsed.inicioTimestamp) / 1000));
          if (parsed.mode === 'cronometro') {
            const novoElapsed = (parsed.baseElapsedSeconds || 0) + deltaSeg;
            return {
              ...padrao,
              ...parsed,
              isRunning: true,
              elapsedSeconds: novoElapsed,
            };
          } else {
            const baseRem = parsed.baseRemainingSec ?? parsed.countdownRemainingSec;
            const novoRem = Math.max(0, baseRem - deltaSeg);
            return {
              ...padrao,
              ...parsed,
              isRunning: novoRem > 0,
              countdownRemainingSec: novoRem,
            };
          }
        }
        return { ...padrao, ...parsed };
      } catch {}
    }
  }
  return padrao;
}

function salvarTimerStorage(state: TimerState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
}

export const useAppStore = create<AppStore>((set, get) => {
  // Inicializa dados e registra listener de mudanças
  const dbInicial = loadLocalDB();
  subscribeData(() => {
    set({ db: loadLocalDB() });
  });

  return {
    tela: 'concursos_abertos',
    setTela: (tela) => set({ tela }),
    concursoSelecionadoId: null,
    setConcursoSelecionadoId: (id) => set({ concursoSelecionadoId: id }),
    abaConcurso: 'organizador',
    setAbaConcurso: (abaConcurso) => set({ abaConcurso }),

    tema: 'dark',
    toggleTema: () => set((s) => ({ tema: s.tema === 'dark' ? 'light' : 'dark' })),

    db: dbInicial,
    recarregarDb: () => set({ db: loadLocalDB() }),

    concursosAbertos: [],
    carregandoConcursos: false,
    erroConcursos: null,
    carregarConcursosAbertos: async (force = false) => {
      set({ carregandoConcursos: true, erroConcursos: null });
      try {
        const res = await fetch(`/api/concursos${force ? '?refresh=1' : ''}`);
        if (!res.ok) throw new Error(`Falha na resposta do servidor: HTTP ${res.status}`);
        const data = await res.json();
        set({ concursosAbertos: data.concursos || [], carregandoConcursos: false });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        set({ erroConcursos: msg, carregandoConcursos: false });
      }
    },

    filtroBusca: '',
    setFiltroBusca: (filtroBusca) => set({ filtroBusca }),
    filtroUf: 'TODOS',
    setFiltroUf: (filtroUf) => set({ filtroUf }),
    filtroRegiao: 'TODAS',
    setFiltroRegiao: (filtroRegiao) => set({ filtroRegiao }),
    filtroStatusEdital: 'todos',
    setFiltroStatusEdital: (filtroStatusEdital) => set({ filtroStatusEdital }),
    filtroForteExpectativa: false,
    setFiltroForteExpectativa: (filtroForteExpectativa) => set({ filtroForteExpectativa }),
    filtroEscolaridade: 'TODAS',
    setFiltroEscolaridade: (filtroEscolaridade) => set({ filtroEscolaridade }),
    filtroSalarioMin: 0,
    setFiltroSalarioMin: (filtroSalarioMin) => set({ filtroSalarioMin }),
    filtroOrdenacao: 'prazo',
    setFiltroOrdenacao: (filtroOrdenacao) => set({ filtroOrdenacao }),

    timer: carregarTimerInicial(),

    setTimerMode: (mode) => {
      set((s) => {
        const next: TimerState = {
          ...s.timer,
          mode,
          isRunning: false,
          elapsedSeconds: 0,
          countdownRemainingSec: s.timer.countdownDurationSec,
          pomodoroFase: 'foco',
        };
        salvarTimerStorage(next);
        return { timer: next };
      });
    },

    setTimerVinculo: (concursoId, materiaId, topicoId) => {
      set((s) => {
        const next: TimerState = { ...s.timer, concursoId, materiaId, topicoId };
        salvarTimerStorage(next);
        return { timer: next };
      });
    },

    setCountdownDuration: (minutos) => {
      const seg = Math.max(60, minutos * 60);
      set((s) => {
        const next: TimerState = {
          ...s.timer,
          countdownDurationSec: seg,
          countdownRemainingSec: seg,
          isRunning: false,
        };
        salvarTimerStorage(next);
        return { timer: next };
      });
    },

    setPomodoroConfig: (focoMin, pausaMin) => {
      set((s) => {
        const next: TimerState = {
          ...s.timer,
          pomodoroFocoMin: focoMin,
          pomodoroPausaMin: pausaMin,
          countdownRemainingSec: (s.timer.pomodoroFase === 'foco' ? focoMin : pausaMin) * 60,
        };
        salvarTimerStorage(next);
        return { timer: next };
      });
    },

    startTimer: () => {
      sounds.playStart();
      const agora = Date.now();
      set((s) => {
        const next: TimerState = {
          ...s.timer,
          isRunning: true,
          inicioIso: s.timer.inicioIso || new Date().toISOString(),
          inicioTimestamp: agora,
          baseElapsedSeconds: s.timer.elapsedSeconds,
          baseRemainingSec: s.timer.countdownRemainingSec,
        };
        salvarTimerStorage(next);
        return { timer: next };
      });
    },

    pauseTimer: () => {
      sounds.playPause();
      const agora = Date.now();
      set((s) => {
        let finalElapsed = s.timer.elapsedSeconds;
        let finalRemaining = s.timer.countdownRemainingSec;
        if (s.timer.inicioTimestamp) {
          const delta = Math.max(0, Math.floor((agora - s.timer.inicioTimestamp) / 1000));
          if (s.timer.mode === 'cronometro') {
            finalElapsed = (s.timer.baseElapsedSeconds || 0) + delta;
          } else {
            finalRemaining = Math.max(0, (s.timer.baseRemainingSec ?? s.timer.countdownRemainingSec) - delta);
          }
        }
        const next: TimerState = {
          ...s.timer,
          isRunning: false,
          inicioTimestamp: null,
          elapsedSeconds: finalElapsed,
          countdownRemainingSec: finalRemaining,
          baseElapsedSeconds: finalElapsed,
          baseRemainingSec: finalRemaining,
        };
        salvarTimerStorage(next);
        return { timer: next };
      });
    },

    resetTimer: () => {
      set((s) => {
        const resetRem =
          s.timer.mode === 'pomodoro'
            ? (s.timer.pomodoroFase === 'foco' ? s.timer.pomodoroFocoMin : s.timer.pomodoroPausaMin) * 60
            : s.timer.countdownDurationSec;
        const next: TimerState = {
          ...s.timer,
          isRunning: false,
          elapsedSeconds: 0,
          baseElapsedSeconds: 0,
          countdownRemainingSec: resetRem,
          baseRemainingSec: resetRem,
          inicioTimestamp: null,
          inicioIso: null,
        };
        salvarTimerStorage(next);
        return { timer: next };
      });
    },

    tickTimer: () => {
      const { timer } = get();
      if (!timer.isRunning) return;
      const agora = Date.now();
      const inicio = timer.inicioTimestamp || agora;
      const delta = Math.max(0, Math.floor((agora - inicio) / 1000));

      if (timer.mode === 'cronometro') {
        const novoElapsed = (timer.baseElapsedSeconds || 0) + delta;
        const next: TimerState = { ...timer, elapsedSeconds: novoElapsed };
        salvarTimerStorage(next);
        set({ timer: next });
      } else if (timer.mode === 'temporizador') {
        const rem = Math.max(0, (timer.baseRemainingSec ?? timer.countdownRemainingSec) - delta);
        if (rem <= 0) {
          sounds.playAlarm();
          const next: TimerState = {
            ...timer,
            isRunning: false,
            inicioTimestamp: null,
            countdownRemainingSec: 0,
            baseRemainingSec: 0,
          };
          salvarTimerStorage(next);
          set({ timer: next });
        } else {
          const next: TimerState = { ...timer, countdownRemainingSec: rem };
          salvarTimerStorage(next);
          set({ timer: next });
        }
      } else if (timer.mode === 'pomodoro') {
        const rem = Math.max(0, (timer.baseRemainingSec ?? timer.countdownRemainingSec) - delta);
        if (rem <= 0) {
          sounds.playAlarm();
          const novaFase = timer.pomodoroFase === 'foco' ? 'pausa' : 'foco';
          const novosCiclos = novaFase === 'foco' ? timer.pomodoroCiclos + 1 : timer.pomodoroCiclos;
          const proximaDuracaoSec =
            (novaFase === 'foco' ? timer.pomodoroFocoMin : timer.pomodoroPausaMin) * 60;
          const next: TimerState = {
            ...timer,
            pomodoroFase: novaFase,
            pomodoroCiclos: novosCiclos,
            countdownRemainingSec: proximaDuracaoSec,
            baseRemainingSec: proximaDuracaoSec,
            inicioTimestamp: null,
            isRunning: false,
          };
          salvarTimerStorage(next);
          set({ timer: next });
        } else {
          const next: TimerState = { ...timer, countdownRemainingSec: rem };
          salvarTimerStorage(next);
          set({ timer: next });
        }
      }
    },

    salvarSessao: ({ notas, acertos, erros, tempoSegManual }) => {
      const { timer } = get();
      let duracaoSeg = 0;

      if (tempoSegManual && tempoSegManual > 0) {
        duracaoSeg = tempoSegManual;
      } else if (timer.mode === 'cronometro') {
        duracaoSeg = timer.elapsedSeconds;
      } else if (timer.mode === 'temporizador') {
        duracaoSeg = Math.max(0, timer.countdownDurationSec - timer.countdownRemainingSec);
      } else if (timer.mode === 'pomodoro') {
        duracaoSeg = Math.max(0, timer.pomodoroFocoMin * 60 - timer.countdownRemainingSec);
      }

      if (duracaoSeg < 10 && !tempoSegManual) {
        throw new Error('Sessões com menos de 10 segundos não são salvas.');
      }

      let notasFormatadas = notas || '';
      const qTotal = (acertos || 0) + (erros || 0);
      if (acertos !== undefined || erros !== undefined) {
        const taxa = qTotal > 0 ? Math.round(((acertos || 0) / qTotal) * 100) : 0;
        const qStr = `Questões: ${acertos || 0} acertos / ${erros || 0} erros (${taxa}% de aproveitamento).`;
        notasFormatadas = notasFormatadas ? `${notasFormatadas} | ${qStr}` : qStr;
      }

      const novaSessao: Sessao = {
        id: `sessao_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        concurso_id: timer.concursoId,
        materia_id: timer.materiaId,
        topico_id: timer.topicoId,
        inicio: timer.inicioIso || new Date().toISOString(),
        duracao_seg: duracaoSeg,
        modo: timer.mode,
        questoes_total: qTotal,
        questoes_acertos: acertos || 0,
        questoes_erros: erros || 0,
        notas: notasFormatadas || null,
        created_at: new Date().toISOString(),
      };

      upsertRow('sessoes', novaSessao);

      // Grava no organizador de questões caso tenha resolvido exercícios nesta sessão
      if (qTotal > 0) {
        const taxa = Math.round(((acertos || 0) / qTotal) * 100);
        const novoRegQuestoes: RegistroQuestoes = {
          id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          concurso_id: timer.concursoId,
          materia_id: timer.materiaId,
          topico_id: timer.topicoId,
          total: qTotal,
          acertos: acertos || 0,
          erros: erros || 0,
          taxa_acerto: taxa,
          banca: 'Geral',
          data: new Date().toISOString().slice(0, 10),
          observacao: notasFormatadas,
          created_at: new Date().toISOString(),
        };
        upsertRow('questoes', novoRegQuestoes);
      }

      // Reseta o timer
      const nextTimer: TimerState = {
        ...timer,
        isRunning: false,
        elapsedSeconds: 0,
        baseElapsedSeconds: 0,
        countdownRemainingSec:
          timer.mode === 'pomodoro'
            ? timer.pomodoroFocoMin * 60
            : timer.countdownDurationSec,
        baseRemainingSec:
          timer.mode === 'pomodoro'
            ? timer.pomodoroFocoMin * 60
            : timer.countdownDurationSec,
        inicioTimestamp: null,
        inicioIso: null,
      };
      salvarTimerStorage(nextTimer);
      set({ timer: nextTimer });

      return novaSessao;
    },

    limparHistoricoDesempenho: () => {
      limparDesempenhoStorage();
      set({ db: loadLocalDB() });
    },

    adicionarConcursoDeAberto: (aberto) => {
      const id = `conc_${aberto.id || Date.now()}`;
      const ehPreEdital = aberto.statusEdital === 'pre_edital';
      const ehForteExpectativa = Boolean(aberto.forteExpectativa);

      // O título deve ser rigorosamente Órgão • Cargo, sem resquícios de manchete
      const limpo = sanitizarNomeConcurso(aberto.orgao, aberto.cargos);

      const novo: Concurso = {
        id,
        tipo: 'concurso',
        nome: limpo.titulo,
        orgao: limpo.orgao,
        cargo: limpo.cargo,
        uf: aberto.uf,
        escolaridade: aberto.escolaridade.join(' / '),
        salario: aberto.salarioMax ? `Até R$ ${aberto.salarioMax.toLocaleString('pt-BR')}` : aberto.resumo,
        vagas: aberto.vagas ? `${aberto.vagas} vagas` : aberto.cadastroReserva ? 'Cadastro de Reserva' : null,
        inscricao_ate: aberto.inscricaoAte,
        link: aberto.link,
        fonte: 'pci',
        fonte_id: aberto.id,
        status: 'estudando',
        status_edital: ehPreEdital ? 'pre_edital' : 'aberto',
        edital_rotulo: ehPreEdital ? 'Pré-Edital (Edital Anterior)' : 'Edital Publicado',
        edital_origem: ehPreEdital ? 'Último certame do concurso' : 'Edital oficial publicado',
        forte_expectativa: ehForteExpectativa,
        ano_previsto: aberto.anoPrevisto || (ehForteExpectativa ? '2026/2027' : null),
        descricao_noticia: aberto.descricaoNoticia || aberto.resumo,
        cor: ehForteExpectativa ? '#f59e0b' : (ehPreEdital ? '#8b5cf6' : '#14b8a6'),
        created_at: new Date().toISOString(),
      };
      upsertRow('concursos', novo);

      // Cria plano padrão de 20h
      const plano: Plano = {
        id: `plano_${id}`,
        concurso_id: id,
        horas_semanais: 20,
        dias: [0, 180, 180, 180, 180, 180, 120],
        duracao_bloco: 60,
        atualizado_em: new Date().toISOString(),
      };
      upsertRow('planos', plano);

      // Gera IMEDIATAMENTE e de forma síncrona a grade do edital verticalizado com subtópicos
      const { materias: mats, topicos: tops } = gerarDisciplinasETopicosPadrao(
        id,
        aberto.titulo,
        aberto.orgao,
        aberto.cargos
      );
      salvarGradeCompleta(id, mats, tops);

      // Define a aba ativa como organizador
      set({ abaConcurso: 'organizador' });

      // Opcional: tenta enriquecer com scraping de fundo caso haja edital parseado
      get().carregarEditalAutomaticoParaConcurso(id);

      return id;
    },

    carregarEditalAutomaticoParaConcurso: async (concursoId) => {
      const c = get().db.concursos.find((item) => item.id === concursoId);
      if (!c) return;

      try {
        const query = new URLSearchParams({
          titulo: c.nome || '',
          orgao: c.orgao || '',
          cargos: c.cargo || '',
          statusEdital: c.status_edital || 'aberto',
        });
        const res = await fetch(`/api/concursos/auto-edital?${query.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.materias && Array.isArray(data.materias) && data.materias.length > 0) {
          const novasMaterias: Materia[] = [];
          const novosTopicos: Topico[] = [];

          data.materias.forEach((mat: any, idx: number) => {
            const matId = `mat_${concursoId}_${idx}`;
            const novaMat: Materia = {
              id: matId,
              concurso_id: concursoId,
              nome: mat.nome,
              importancia: mat.importancia || 4,
              conhecimento: mat.conhecimento || 2,
              horas_semanais_desejadas: null,
              cor: mat.cor || '#14b8a6',
              ordem: idx + 1,
              ativa: true,
              created_at: new Date().toISOString(),
            };
            novasMaterias.push(novaMat);

            if (mat.topicos && Array.isArray(mat.topicos)) {
              mat.topicos.forEach((topItem: any, topIdx: number) => {
                const isObj = typeof topItem === 'object' && topItem !== null;
                const nomeTop = isObj ? (topItem.nome || topItem.titulo) : String(topItem);
                const subtopicosList = isObj && Array.isArray(topItem.subtopicos)
                  ? topItem.subtopicos.map((sub: any, sIdx: number) => {
                      const isSubObj = typeof sub === 'object' && sub !== null;
                      return {
                        id: (isSubObj && sub.id) ? sub.id : `sub_${matId}_${topIdx}_${sIdx}`,
                        nome: isSubObj ? sub.nome : String(sub),
                        ordem: sIdx + 1,
                        concluido: false,
                        revisoes: 0,
                      };
                    })
                  : [];

                const novoTop: Topico = {
                  id: `top_${matId}_${topIdx}`,
                  concurso_id: concursoId,
                  materia_id: matId,
                  nome: nomeTop,
                  ordem: topIdx + 1,
                  concluido: false,
                  revisoes: 0,
                  subtopicos: subtopicosList,
                  created_at: new Date().toISOString(),
                };
                novosTopicos.push(novoTop);
              });
            }
          });

          // Gravação atômica única
          salvarGradeCompleta(concursoId, novasMaterias, novosTopicos);
        }
      } catch (err) {
        console.warn('[auto-edital] Falha ao carregar edital automático:', err);
      }
    },

    criarConcurso: (dados) => {
      const id = dados.id || `conc_${Date.now()}`;
      const limpo = dados.nome ? sanitizarNomeConcurso(dados.orgao || dados.nome, dados.cargo || '') : null;
      const nomeFinal = limpo ? limpo.titulo : (dados.nome || 'Novo Concurso');
      const orgaoFinal = limpo ? limpo.orgao : (dados.orgao || null);
      const cargoFinal = limpo ? limpo.cargo : (dados.cargo || null);

      const novo: Concurso = {
        id,
        tipo: dados.tipo || 'concurso',
        nome: nomeFinal,
        orgao: orgaoFinal,
        banca: dados.banca || null,
        cargo: cargoFinal,
        uf: dados.uf || 'Nacional',
        escolaridade: dados.escolaridade || null,
        salario: dados.salario || null,
        vagas: dados.vagas || null,
        inscricao_ate: dados.inscricao_ate || null,
        data_prova: dados.data_prova || null,
        link: dados.link || null,
        fonte: 'manual',
        status: dados.status || 'estudando',
        cor: dados.cor || '#14b8a6',
        created_at: new Date().toISOString(),
      };
      upsertRow('concursos', novo);

      const plano: Plano = {
        id: `plano_${id}`,
        concurso_id: id,
        horas_semanais: 20,
        dias: [0, 180, 180, 180, 180, 180, 120],
        duracao_bloco: 60,
        atualizado_em: new Date().toISOString(),
      };
      upsertRow('planos', plano);

      // Popula instantaneamente o edital verticalizado para nunca abrir vazio
      const { materias: mats, topicos: tops } = gerarDisciplinasETopicosPadrao(
        id,
        dados.nome || '',
        dados.orgao || '',
        dados.cargo || ''
      );
      salvarGradeCompleta(id, mats, tops);

      return id;
    },

    salvarPlano: (planoDados) => {
      const id = planoDados.id || `plano_${planoDados.concurso_id}`;
      const completo: Plano = {
        id,
        concurso_id: planoDados.concurso_id,
        horas_semanais: Number(planoDados.horas_semanais || 20),
        dias: planoDados.dias || [0, 180, 180, 180, 180, 180, 120],
        duracao_bloco: Number(planoDados.duracao_bloco || 60),
        data_inicio: planoDados.data_inicio || null,
        atualizado_em: new Date().toISOString(),
      };
      upsertRow('planos', completo);
    },

    adicionarMateria: (concursoId, dados) => {
      const id = `mat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const nova: Materia = {
        id,
        concurso_id: concursoId,
        nome: dados.nome || 'Nova Matéria',
        importancia: dados.importancia || 3,
        conhecimento: dados.conhecimento || 2,
        horas_semanais_desejadas: dados.horas_semanais_desejadas ?? null,
        cor: dados.cor || '#14b8a6',
        ordem: dados.ordem || 99,
        ativa: dados.ativa ?? true,
        created_at: new Date().toISOString(),
      };
      upsertRow('materias', nova);
      return id;
    },

    atualizarMateria: (materia) => {
      upsertRow('materias', materia);
    },

    removerMateria: (id) => {
      deleteRow('materias', id);
      // Remove tópicos vinculados
      const topicos = loadLocalDB().topicos.filter((t) => t.materia_id === id);
      topicos.forEach((t) => deleteRow('topicos', t.id));
    },

    adicionarTopico: (concursoId, materiaId, nome) => {
      const id = `top_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const novo: Topico = {
        id,
        concurso_id: concursoId,
        materia_id: materiaId,
        nome,
        ordem: 99,
        concluido: false,
        revisoes: 0,
        created_at: new Date().toISOString(),
      };
      upsertRow('topicos', novo);
      return id;
    },

    toggleTopicoConcluido: (topicoId) => {
      const db = loadLocalDB();
      const topico = db.topicos.find((t) => t.id === topicoId);
      if (!topico) return;
      const concluido = !topico.concluido;
      const novosSub = topico.subtopicos
        ? topico.subtopicos.map((s) => ({
            ...s,
            concluido,
            concluido_em: concluido ? new Date().toISOString() : null,
          }))
        : [];
      upsertRow('topicos', {
        ...topico,
        concluido,
        concluido_em: concluido ? new Date().toISOString() : null,
        subtopicos: novosSub,
      });
    },

    toggleSubtopicoConcluido: (topicoId, subtopicoId) => {
      const db = loadLocalDB();
      const topico = db.topicos.find((t) => t.id === topicoId);
      if (!topico || !topico.subtopicos) return;

      const novosSub = topico.subtopicos.map((s) => {
        if (s.id === subtopicoId) {
          const novoConcluido = !s.concluido;
          return {
            ...s,
            concluido: novoConcluido,
            concluido_em: novoConcluido ? new Date().toISOString() : null,
          };
        }
        return s;
      });

      const todosConcluidos = novosSub.length > 0 && novosSub.every((s) => s.concluido);

      upsertRow('topicos', {
        ...topico,
        subtopicos: novosSub,
        concluido: todosConcluidos,
        concluido_em: todosConcluidos ? new Date().toISOString() : null,
      });
    },

    incrementarRevisaoSubtopico: (topicoId, subtopicoId) => {
      const db = loadLocalDB();
      const topico = db.topicos.find((t) => t.id === topicoId);
      if (!topico || !topico.subtopicos) return;

      const novosSub = topico.subtopicos.map((s) => {
        if (s.id === subtopicoId) {
          return { ...s, revisoes: (s.revisoes || 0) + 1 };
        }
        return s;
      });

      upsertRow('topicos', {
        ...topico,
        subtopicos: novosSub,
        revisoes: (topico.revisoes || 0) + 1,
      });
    },

    adicionarSubtopico: (topicoId, nome) => {
      const db = loadLocalDB();
      const topico = db.topicos.find((t) => t.id === topicoId);
      if (!topico) return;

      const subId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const listaAtual = topico.subtopicos || [];
      const novoSub = {
        id: subId,
        nome,
        ordem: listaAtual.length + 1,
        concluido: false,
        revisoes: 0,
      };

      upsertRow('topicos', {
        ...topico,
        subtopicos: [...listaAtual, novoSub],
      });
    },

    incrementarRevisaoTopico: (topicoId) => {
      const db = loadLocalDB();
      const topico = db.topicos.find((t) => t.id === topicoId);
      if (!topico) return;
      upsertRow('topicos', {
        ...topico,
        revisoes: (topico.revisoes || 0) + 1,
      });
    },

    removerTopico: (id) => {
      deleteRow('topicos', id);
    },

    removerConcurso: (id) => {
      deleteRow('concursos', id);
      const db = loadLocalDB();
      db.materias.filter((m) => m.concurso_id === id).forEach((m) => deleteRow('materias', m.id));
      db.topicos.filter((t) => t.concurso_id === id).forEach((t) => deleteRow('topicos', t.id));
      db.planos.filter((p) => p.concurso_id === id).forEach((p) => deleteRow('planos', p.id));
    },

    adicionarRegistroQuestoes: (dados) => {
      const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const novo: RegistroQuestoes = {
        id,
        ...dados,
        created_at: new Date().toISOString(),
      };
      upsertRow('questoes', novo);
      return id;
    },

    removerRegistroQuestoes: (id) => {
      deleteRow('questoes', id);
    },
  };
});
