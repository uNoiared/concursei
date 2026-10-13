import React, { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import {
  Play,
  Pause,
  Square,
  Sparkles,
  Cloud,
  Database,
  Compass,
  BookOpen,
  Timer,
  BarChart3,
} from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient.ts';

interface TopBarProps {
  onNovoConcurso: () => void;
  onOpenConfig: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onNovoConcurso, onOpenConfig }) => {
  const {
    tela,
    setTela,
    timer,
    startTimer,
    pauseTimer,
    resetTimer,
    db,
    concursoSelecionadoId,
  } = useAppStore();

  useEffect(() => {
    if (timer.isRunning) {
      let tempoStr = '';
      if (timer.mode === 'cronometro') {
        const h = Math.floor(timer.elapsedSeconds / 3600);
        const m = Math.floor((timer.elapsedSeconds % 3600) / 60);
        const s = timer.elapsedSeconds % 60;
        tempoStr = `${h > 0 ? `${h}h ` : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      } else {
        const m = Math.floor(timer.countdownRemainingSec / 60);
        const s = timer.countdownRemainingSec % 60;
        tempoStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      }

      const mat = db.materias.find((m) => m.id === timer.materiaId);
      const matNome = mat ? ` (${mat.nome})` : '';
      document.title = `⏱️ ${tempoStr}${matNome} — Concursei`;
    } else {
      document.title = 'Concursei — Planejamento de Estudos';
    }
  }, [timer.isRunning, timer.elapsedSeconds, timer.countdownRemainingSec, timer.mode, timer.materiaId, db.materias]);

  const materiaAtiva = db.materias.find((m) => m.id === timer.materiaId);
  const concursoAtivo = db.concursos.find((c) => c.id === timer.concursoId);

  let displayDigits = '00:00:00';
  if (timer.mode === 'cronometro') {
    const h = Math.floor(timer.elapsedSeconds / 3600);
    const m = Math.floor((timer.elapsedSeconds % 3600) / 60);
    const s = timer.elapsedSeconds % 60;
    displayDigits = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  } else {
    const m = Math.floor(timer.countdownRemainingSec / 60);
    const s = timer.countdownRemainingSec % 60;
    displayDigits = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  const getSubtitulo = () => {
    switch (tela) {
      case 'concursos_abertos':
        return 'Editais oficiais e pré-editais em tempo real';
      case 'meus_estudos':
        return 'Acompanhamento de editais, metas e planejamento';
      case 'cronometro':
        return 'Tempo líquido, modo pomodoro e questões';
      case 'estatisticas':
        return 'Métricas analíticas, constância e aproveitamento';
      case 'concurso_detalhe': {
        const c = db.concursos.find((item) => item.id === concursoSelecionadoId);
        return c?.orgao ? `${c.orgao} • ${c.tipo === 'concurso' ? 'Concurso Público' : 'Faculdade'}` : 'Edital e Planejamento';
      }
    }
  };

  const temSupabase = Boolean(getSupabase());

  return (
    <header
      className="top-bar"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: '12px 28px',
        gap: 16,
      }}
    >
      {/* Esquerda: Traffic Dots & Subtítulo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div className="traffic-dots" title="Concursei">
          <span className="traffic-dot red" />
          <span className="traffic-dot yellow" />
          <span className="traffic-dot green" />
        </div>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          {getSubtitulo()}
        </span>
      </div>

      {/* Centro: Nome do Site CONCURSEI Centralizado + Pílulas de Navegação */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <h1
          onClick={() => setTela('concursos_abertos')}
          style={{
            fontSize: '1.45rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: 0,
            color: 'var(--primary)',
            cursor: 'pointer',
            userSelect: 'none',
            lineHeight: 1.1,
          }}
          title="Concursei"
        >
          Concursei
        </h1>

        <nav className="studio-pill-nav">
          <button
            onClick={() => setTela('concursos_abertos')}
            className={`studio-pill-btn ${tela === 'concursos_abertos' ? 'active' : ''}`}
          >
            <Compass size={14} />
            <span>Concursos</span>
          </button>

          <button
            onClick={() => setTela('meus_estudos')}
            className={`studio-pill-btn ${tela === 'meus_estudos' || tela === 'concurso_detalhe' ? 'active' : ''}`}
          >
            <BookOpen size={14} />
            <span>Meus Estudos</span>
          </button>

          <button
            onClick={() => setTela('cronometro')}
            className={`studio-pill-btn ${tela === 'cronometro' ? 'active' : ''}`}
          >
            <Timer size={14} />
            <span>Cronômetro</span>
            {timer.isRunning && (
              <span
                className="dot-pulse"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  display: 'inline-block',
                  marginLeft: 2,
                }}
              />
            )}
          </button>

          <button
            onClick={() => setTela('estatisticas')}
            className={`studio-pill-btn ${tela === 'estatisticas' ? 'active' : ''}`}
          >
            <BarChart3 size={14} />
            <span>Desempenho</span>
          </button>
        </nav>
      </div>

      {/* Direita: Mini-Timer + Conexão Nuvem + Criar Estudo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
        {(timer.isRunning || timer.elapsedSeconds > 0 || timer.countdownRemainingSec < timer.countdownDurationSec) && (
          <div
            className={`mini-timer-pill ${timer.isRunning ? 'running' : ''}`}
            onClick={() => setTela('cronometro')}
            title="Clique para expandir o cronômetro"
          >
            <span
              className={timer.isRunning ? 'dot-pulse' : ''}
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: timer.isRunning ? 'var(--primary)' : 'var(--text-faint)',
                display: 'inline-block',
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="timer-digits" style={{ fontSize: '0.92rem', color: timer.isRunning ? 'var(--primary)' : 'var(--text-main)', lineHeight: 1.1 }}>
                {displayDigits}
              </span>
              <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', maxWidth: 110, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {materiaAtiva ? materiaAtiva.nome : concursoAtivo ? concursoAtivo.nome : 'Estudo Geral'}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (timer.isRunning) pauseTimer();
                else startTimer();
              }}
              className="btn btn-ghost"
              style={{ padding: 4, width: 26, height: 26, borderRadius: '50%' }}
              title={timer.isRunning ? 'Pausar' : 'Iniciar'}
            >
              {timer.isRunning ? <Pause size={13} /> : <Play size={13} />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                resetTimer();
              }}
              className="btn btn-ghost"
              style={{ padding: 4, width: 26, height: 26, borderRadius: '50%' }}
              title="Zerar cronômetro"
            >
              <Square size={12} />
            </button>
          </div>
        )}

        <button
          onClick={onOpenConfig}
          className="btn btn-secondary btn-sm"
          style={{ gap: 6, fontSize: '0.74rem', padding: '6px 12px', borderRadius: 'var(--radius-full)' }}
          title={temSupabase ? 'Sincronizado na Nuvem Supabase' : 'Modo Offline / Local (clique para conectar)'}
        >
          {temSupabase ? <Cloud size={13} color="var(--primary)" /> : <Database size={13} color="var(--accent-amber)" />}
          <span>{temSupabase ? 'Nuvem' : 'Local'}</span>
        </button>

        <button
          onClick={onNovoConcurso}
          className="btn btn-primary btn-sm"
          style={{
            gap: 6,
            borderRadius: 'var(--radius-full)',
            padding: '7px 16px',
            fontSize: '0.8rem',
            fontWeight: 800,
          }}
        >
          <Sparkles size={14} />
          + Criar Estudo
        </button>
      </div>
    </header>
  );
};
export default TopBar;
