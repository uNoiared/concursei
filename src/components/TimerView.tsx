// Cronômetro do Aluno completo: Cronômetro livre, Temporizador regressivo, Pomodoro e Registro Manual
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  Hourglass,
  Flame,
  FileEdit,
  BookOpen,
} from 'lucide-react';
import { ModoTimer } from '../lib/types.ts';

export const TimerView: React.FC = () => {
  const {
    timer,
    setTimerMode,
    setTimerVinculo,
    setCountdownDuration,
    setPomodoroConfig,
    startTimer,
    pauseTimer,
    resetTimer,
    salvarSessao,
    db,
    toggleTopicoConcluido,
    incrementarRevisaoTopico,
  } = useAppStore();

  // Estado do Modal de Conclusão de Sessão
  const [modalConcluirAberto, setModalConcluirAberto] = useState(false);
  const [notas, setNotas] = useState('');
  const [tipoEstudo, setTipoEstudo] = useState<'Teoria' | 'Questões' | 'Revisão' | 'Lei Seca'>('Teoria');
  const [acertos, setAcertos] = useState<number | ''>('');
  const [erros, setErros] = useState<number | ''>('');
  const [marcarTopicoConcluido, setMarcarTopicoConcluido] = useState(false);
  const [incrementarRevisao, setIncrementarRevisao] = useState(false);

  // Estado do Registro Manual
  const [manualData, setManualData] = useState(() => new Date().toISOString().slice(0, 10));
  const [manualHoras, setManualHoras] = useState(1);
  const [manualMinutos, setManualMinutos] = useState(0);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Matérias e Tópicos filtrados pelo concurso selecionado
  const materiasDisponiveis = db.materias.filter((m) =>
    timer.concursoId ? m.concurso_id === timer.concursoId : true
  );
  const topicosDisponiveis = db.topicos.filter((t) =>
    timer.materiaId ? t.materia_id === timer.materiaId : true
  );

  // Atalho de teclado (Espaço para play/pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se estiver digitando em um input ou textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (timer.isRunning) pauseTimer();
        else startTimer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timer.isRunning, startTimer, pauseTimer]);

  // Formatação dos dígitos do relógio
  let displayHoras = '00';
  let displayMinutos = '00';
  let displaySegundos = '00';

  if (timer.mode === 'cronometro') {
    const total = timer.elapsedSeconds;
    displayHoras = Math.floor(total / 3600).toString().padStart(2, '0');
    displayMinutos = Math.floor((total % 3600) / 60).toString().padStart(2, '0');
    displaySegundos = (total % 60).toString().padStart(2, '0');
  } else {
    const total = timer.countdownRemainingSec;
    displayHoras = Math.floor(total / 3600).toString().padStart(2, '0');
    displayMinutos = Math.floor((total % 3600) / 60).toString().padStart(2, '0');
    displaySegundos = (total % 60).toString().padStart(2, '0');
  }

  // Abertura do modal pós-estudo
  const handleAbrirConclusao = () => {
    pauseTimer();
    setModalConcluirAberto(true);
  };

  const handleSalvarSessao = () => {
    try {
      const qAcertos = typeof acertos === 'number' ? acertos : 0;
      const qErros = typeof erros === 'number' ? erros : 0;

      let notasFinais = `[${tipoEstudo}] ${notas}`.trim();
      if (tipoEstudo === 'Questões' || qAcertos > 0 || qErros > 0) {
        notasFinais += ` (${qAcertos} acertos, ${qErros} erros)`;
      }

      salvarSessao({
        notas: notasFinais,
        acertos: qAcertos,
        erros: qErros,
      });

      if (marcarTopicoConcluido && timer.topicoId) {
        toggleTopicoConcluido(timer.topicoId);
      }
      if (incrementarRevisao && timer.topicoId) {
        incrementarRevisaoTopico(timer.topicoId);
      }

      setModalConcluirAberto(false);
      setNotas('');
      setAcertos('');
      setErros('');
      setMensagemSucesso('Sessão registrada com sucesso!');
      setTimeout(() => setMensagemSucesso(null), 4000);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  // Salvar entrada manual
  const handleSalvarManual = () => {
    const duracaoSeg = manualHoras * 3600 + manualMinutos * 60;
    if (duracaoSeg < 60) {
      alert('A duração deve ser de pelo menos 1 minuto.');
      return;
    }
    const qAcertos = typeof acertos === 'number' ? acertos : 0;
    const qErros = typeof erros === 'number' ? erros : 0;
    const notasFinais = `[${tipoEstudo} - Lançamento Manual] ${notas}`.trim();

    salvarSessao({
      notas: notasFinais,
      acertos: qAcertos,
      erros: qErros,
      tempoSegManual: duracaoSeg,
    });

    if (marcarTopicoConcluido && timer.topicoId) {
      toggleTopicoConcluido(timer.topicoId);
    }

    setMensagemSucesso('Estudo manual salvo com sucesso!');
    setTimeout(() => setMensagemSucesso(null), 4000);
  };

  const materiaAtiva = db.materias.find((m) => m.id === timer.materiaId);
  const topicoAtivo = db.topicos.find((t) => t.id === timer.topicoId);

  return (
    <div className="content-body" style={{ maxWidth: 900 }}>
      {mensagemSucesso && (
        <div
          className="badge badge-emerald"
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '0.9rem',
            marginBottom: 20,
            justifyContent: 'center',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <CheckCircle2 size={18} />
          {mensagemSucesso}
        </div>
      )}

      {/* Seletor de Modos do Cronômetro */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10,
          marginBottom: 24,
        }}
      >
        {[
          { id: 'cronometro' as ModoTimer, label: 'Cronômetro Livre', icon: <Clock size={18} />, desc: 'Contagem progressiva de horas líquidas' },
          { id: 'temporizador' as ModoTimer, label: 'Temporizador', icon: <Hourglass size={18} />, desc: 'Contagem regressiva ajustável' },
          { id: 'pomodoro' as ModoTimer, label: 'Pomodoro', icon: <Flame size={18} />, desc: 'Blocos de foco (25m) e pausa (5m)' },
          { id: 'manual' as ModoTimer, label: 'Registro Manual', icon: <FileEdit size={18} />, desc: 'Lançar estudo já realizado' },
        ].map((item) => {
          const ativo = timer.mode === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTimerMode(item.id)}
              className="card card-interactive"
              style={{
                padding: '14px 16px',
                textAlign: 'left',
                border: ativo ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: ativo ? 'var(--primary-light)' : 'var(--bg-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, color: ativo ? 'var(--primary)' : 'var(--text-main)', fontWeight: 700 }}>
                {item.icon}
                <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Vínculo de Estudo: Concurso, Matéria e Tópico */}
      <div className="card" style={{ marginBottom: 24, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <BookOpen size={16} color="var(--primary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            O que você vai estudar agora?
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 12 }}>
          {/* Concurso / Faculdade */}
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Concurso / Faculdade
            </label>
            <select
              className="select-box"
              value={timer.concursoId || ''}
              onChange={(e) => {
                const cid = e.target.value || null;
                setTimerVinculo(cid, null, null);
              }}
            >
              <option value="">Geral / Sem vínculo específico</option>
              {db.concursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} {c.tipo === 'faculdade' ? '(Faculdade)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Matéria */}
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Matéria / Disciplina
            </label>
            <select
              className="select-box"
              value={timer.materiaId || ''}
              onChange={(e) => {
                const mid = e.target.value || null;
                setTimerVinculo(timer.concursoId, mid, null);
              }}
            >
              <option value="">Selecione uma matéria...</option>
              {materiasDisponiveis.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Tópico do Edital */}
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Tópico do Edital (Opcional)
            </label>
            <select
              className="select-box"
              value={timer.topicoId || ''}
              onChange={(e) => {
                const tid = e.target.value || null;
                setTimerVinculo(timer.concursoId, timer.materiaId, tid);
              }}
            >
              <option value="">Tópico livre ou geral da matéria</option>
              {topicosDisponiveis.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.concluido ? '✓ ' : ''}{t.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags de Contexto Ativo */}
        {(materiaAtiva || topicoAtivo) && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
            {materiaAtiva && (
              <span
                className="badge"
                style={{
                  background: `${materiaAtiva.cor}22`,
                  color: materiaAtiva.cor,
                  border: `1px solid ${materiaAtiva.cor}66`,
                }}
              >
                ● {materiaAtiva.nome} (Peso {materiaAtiva.importancia})
              </span>
            )}
            {topicoAtivo && (
              <span className="badge badge-purple">
                Tópico: {topicoAtivo.nome}
              </span>
            )}
          </div>
        )}
      </div>

      {/* TELA DE REGISTRO MANUAL */}
      {timer.mode === 'manual' ? (
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileEdit size={20} color="var(--primary)" />
            Lançar Tempo de Estudo Manual
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Data do Estudo
              </label>
              <input
                type="date"
                className="input-text"
                value={manualData}
                onChange={(e) => setManualData(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Horas Estudadas
              </label>
              <input
                type="number"
                min="0"
                max="24"
                className="input-text"
                value={manualHoras}
                onChange={(e) => setManualHoras(Math.max(0, Number(e.target.value)))}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Minutos
              </label>
              <input
                type="number"
                min="0"
                max="59"
                className="input-text"
                value={manualMinutos}
                onChange={(e) => setManualMinutos(Math.max(0, Math.min(59, Number(e.target.value))))}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Tipo de Atividade
              </label>
              <select
                className="select-box"
                value={tipoEstudo}
                onChange={(e) => setTipoEstudo(e.target.value as 'Teoria' | 'Questões' | 'Revisão' | 'Lei Seca')}
              >
                <option value="Teoria">Teoria / Videoaula / PDF</option>
                <option value="Questões">Resolução de Questões</option>
                <option value="Revisão">Revisão Espaçada / Flashcards</option>
                <option value="Lei Seca">Leitura de Lei Seca</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Questões Acertos
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="input-text"
                    style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}
                    value={acertos}
                    onChange={(e) => setAcertos(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    {[1, 5, 10].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setAcertos((prev) => (typeof prev === 'number' ? prev + s : s))}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '1px 5px', fontSize: '0.68rem', border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                      >
                        +{s}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: '#f43f5e', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Questões Erros
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="input-text"
                    style={{ borderColor: 'rgba(244, 63, 94, 0.4)' }}
                    value={erros}
                    onChange={(e) => setErros(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    {[1, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setErros((prev) => (typeof prev === 'number' ? prev + s : s))}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '1px 5px', fontSize: '0.68rem', border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                      >
                        +{s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {((Number(acertos) || 0) + (Number(erros) || 0) > 0) && (
                <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Total: {(Number(acertos) || 0) + (Number(erros) || 0)} questões
                  </span>
                  <span
                    className="badge"
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background:
                        Math.round(((Number(acertos) || 0) / ((Number(acertos) || 0) + (Number(erros) || 0))) * 100) >= 80
                          ? 'rgba(16, 185, 129, 0.15)'
                          : Math.round(((Number(acertos) || 0) / ((Number(acertos) || 0) + (Number(erros) || 0))) * 100) >= 65
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(244, 63, 94, 0.15)',
                      color:
                        Math.round(((Number(acertos) || 0) / ((Number(acertos) || 0) + (Number(erros) || 0))) * 100) >= 80
                          ? '#10b981'
                          : Math.round(((Number(acertos) || 0) / ((Number(acertos) || 0) + (Number(erros) || 0))) * 100) >= 65
                          ? '#f59e0b'
                          : '#f43f5e',
                    }}
                  >
                    {Math.round(((Number(acertos) || 0) / ((Number(acertos) || 0) + (Number(erros) || 0))) * 100)}% aproveitamento
                  </span>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Anotações / Resumo da Sessão
            </label>
            <textarea
              className="textarea-box"
              rows={3}
              placeholder="Ex.: Resolução de 20 questões sobre atos administrativos discricionários e vinculados..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>

          {timer.topicoId && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 20 }}>
              <input
                type="checkbox"
                checked={marcarTopicoConcluido}
                onChange={(e) => setMarcarTopicoConcluido(e.target.checked)}
              />
              <span style={{ fontSize: '0.85rem' }}>Marcar tópico do edital como concluído</span>
            </label>
          )}

          <button onClick={handleSalvarManual} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            <CheckCircle2 size={18} />
            Salvar Estudo no Histórico
          </button>
        </div>
      ) : (
        /* DISPLAY DO CRONÔMETRO / TEMPORIZADOR / POMODORO */
        <div
          className="card"
          style={{
            padding: 40,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            border: timer.isRunning ? '2px solid var(--primary)' : '1px solid var(--border)',
            boxShadow: timer.isRunning ? '0 0 40px var(--primary-glow)' : 'var(--shadow-md)',
            position: 'relative',
          }}
        >
          {/* Indicador de Pomodoro */}
          {timer.mode === 'pomodoro' && (
            <div style={{ marginBottom: 16 }}>
              <span
                className="badge"
                style={{
                  background: timer.pomodoroFase === 'foco' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: timer.pomodoroFase === 'foco' ? '#ef4444' : '#10b981',
                  fontSize: '0.85rem',
                  padding: '6px 14px',
                }}
              >
                {timer.pomodoroFase === 'foco' ? '🔥 Foco Total' : '☕ Pausa e Descanso'}
              </span>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
                Ciclos Concluídos: {timer.pomodoroCiclos}
              </p>
            </div>
          )}

          {/* Presets Rápidos do Temporizador */}
          {timer.mode === 'temporizador' && !timer.isRunning && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[25, 30, 45, 50, 60, 90, 120].map((min) => (
                <button
                  key={min}
                  onClick={() => setCountdownDuration(min)}
                  className="btn btn-secondary btn-sm"
                  style={{
                    background: timer.countdownDurationSec === min * 60 ? 'var(--primary)' : 'var(--bg-input)',
                    color: timer.countdownDurationSec === min * 60 ? 'var(--primary-text)' : 'var(--text-main)',
                    fontWeight: 700,
                  }}
                >
                  {min} min
                </button>
              ))}
            </div>
          )}

          {/* Zen Circular Focus Ring / Aura */}
          <div
            className={timer.isRunning ? 'zen-breathe' : ''}
            style={{
              position: 'relative',
              width: 290,
              height: 290,
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '12px 0 20px',
              background: timer.isRunning
                ? 'radial-gradient(circle, rgba(104, 187, 122, 0.14) 0%, rgba(21, 34, 26, 0.5) 70%, transparent 100%)'
                : 'var(--bg-input)',
              border: `2px solid ${timer.isRunning ? 'rgba(104, 187, 122, 0.5)' : 'var(--border)'}`,
              boxShadow: timer.isRunning
                ? '0 0 36px var(--primary-glow), inset 0 0 25px rgba(104, 187, 122, 0.1)'
                : 'var(--shadow-sm)',
              transition: 'all 0.4s ease',
            }}
          >
            {/* DÍGITOS DO TEMPO */}
            <div
              className="timer-digits"
              style={{
                fontSize: '4.2rem',
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: '-0.03em',
                color: timer.isRunning ? 'var(--primary)' : 'var(--text-main)',
                textShadow: timer.isRunning ? '0 0 24px rgba(104, 187, 122, 0.35)' : 'none',
              }}
            >
              {Number(displayHoras) > 0 ? `${displayHoras}:` : ''}
              {displayMinutos}:{displaySegundos}
            </div>

            <span
              style={{
                fontSize: '0.72rem',
                color: timer.isRunning ? 'var(--primary)' : 'var(--text-muted)',
                marginTop: 8,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              {timer.isRunning ? '● Foco Fluido' : 'Pausa Relaxante'}
            </span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 28 }}>
            {timer.isRunning ? 'Mente serena e foco absoluto. Pressione [Espaço] para pausar.' : 'Inspire calma, expire ansiedade • Pressione Iniciar ou [Espaço]'}
          </p>

          {/* CONTROLES PRINCIPAIS */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <button
              onClick={resetTimer}
              className="btn btn-secondary btn-lg"
              style={{ width: 56, height: 56, borderRadius: '50%', padding: 0 }}
              title="Reiniciar (Zerar)"
            >
              <RotateCcw size={20} />
            </button>

            <button
              onClick={timer.isRunning ? pauseTimer : startTimer}
              className="btn btn-primary btn-lg"
              style={{
                padding: '16px 36px',
                fontSize: '1.15rem',
                borderRadius: 'var(--radius-full)',
                gap: 12,
                boxShadow: '0 4px 20px var(--primary-glow)',
              }}
            >
              {timer.isRunning ? <Pause size={24} /> : <Play size={24} />}
              <span>{timer.isRunning ? 'Pausar Estudo' : 'Iniciar Estudo'}</span>
            </button>

            {/* Botão Concluir & Salvar */}
            {(timer.elapsedSeconds > 10 || (timer.mode !== 'cronometro' && timer.countdownRemainingSec < timer.countdownDurationSec - 10)) && (
              <button
                onClick={handleAbrirConclusao}
                className="btn btn-secondary btn-lg"
                style={{
                  borderColor: 'var(--accent-emerald)',
                  color: 'var(--accent-emerald)',
                  gap: 8,
                }}
              >
                <CheckCircle2 size={20} />
                Concluir & Salvar
              </button>
            )}
          </div>

          {/* Ajuste de Pomodoro se estiver nesse modo */}
          {timer.mode === 'pomodoro' && !timer.isRunning && (
            <div style={{ marginTop: 28, display: 'flex', gap: 12, alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Duração do Foco:</span>
              {[25, 45, 50].map((f) => (
                <button
                  key={f}
                  onClick={() => setPomodoroConfig(f, timer.pomodoroPausaMin)}
                  className="btn btn-secondary btn-sm"
                  style={{
                    background: timer.pomodoroFocoMin === f ? 'var(--primary)' : 'transparent',
                    color: timer.pomodoroFocoMin === f ? '#042f2e' : 'inherit',
                  }}
                >
                  {f}m
                </button>
              ))}
              <span style={{ marginLeft: 8 }}>Pausa:</span>
              {[5, 10, 15].map((p) => (
                <button
                  key={p}
                  onClick={() => setPomodoroConfig(timer.pomodoroFocoMin, p)}
                  className="btn btn-secondary btn-sm"
                  style={{
                    background: timer.pomodoroPausaMin === p ? 'var(--primary)' : 'transparent',
                    color: timer.pomodoroPausaMin === p ? '#042f2e' : 'inherit',
                  }}
                >
                  {p}m
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL DE CONCLUSÃO E FEEDBACK DA SESSÃO */}
      {modalConcluirAberto && (
        <div className="modal-overlay" onClick={() => setModalConcluirAberto(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={22} color="var(--primary)" />
              Como foi sua sessão de estudo?
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
              Parabéns pelo foco! Registre o aproveitamento de questões e anotações para o seu histórico.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Tipo de Estudo
                </label>
                <select
                  className="select-box"
                  value={tipoEstudo}
                  onChange={(e) => setTipoEstudo(e.target.value as 'Teoria' | 'Questões' | 'Revisão' | 'Lei Seca')}
                >
                  <option value="Teoria">Teoria / Videoaula / PDF</option>
                  <option value="Questões">Resolução de Questões</option>
                  <option value="Revisão">Revisão Espaçada / Flashcards</option>
                  <option value="Lei Seca">Leitura de Lei Seca</option>
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      Questões Acertos
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      className="input-text"
                      style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}
                      value={acertos}
                      onChange={(e) => setAcertos(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      {[1, 5, 10].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setAcertos((prev) => (typeof prev === 'number' ? prev + s : s))}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '1px 5px', fontSize: '0.68rem', border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                        >
                          +{s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: '#f43f5e', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      Questões Erros
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      className="input-text"
                      style={{ borderColor: 'rgba(244, 63, 94, 0.4)' }}
                      value={erros}
                      onChange={(e) => setErros(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      {[1, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setErros((prev) => (typeof prev === 'number' ? prev + s : s))}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '1px 5px', fontSize: '0.68rem', border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                        >
                          +{s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {((Number(acertos) || 0) + (Number(erros) || 0) > 0) && (
                  <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Total: {(Number(acertos) || 0) + (Number(erros) || 0)}q
                    </span>
                    <span
                      className="badge"
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background:
                          Math.round(((Number(acertos) || 0) / ((Number(acertos) || 0) + (Number(erros) || 0))) * 100) >= 80
                            ? 'rgba(16, 185, 129, 0.15)'
                            : Math.round(((Number(acertos) || 0) / ((Number(acertos) || 0) + (Number(erros) || 0))) * 100) >= 65
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(244, 63, 94, 0.15)',
                        color:
                          Math.round(((Number(acertos) || 0) / ((Number(acertos) || 0) + (Number(erros) || 0))) * 100) >= 80
                            ? '#10b981'
                            : Math.round(((Number(acertos) || 0) / ((Number(acertos) || 0) + (Number(erros) || 0))) * 100) >= 65
                            ? '#f59e0b'
                            : '#f43f5e',
                      }}
                    >
                      {Math.round(((Number(acertos) || 0) / ((Number(acertos) || 0) + (Number(erros) || 0))) * 100)}% acertos
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Anotações da Sessão
              </label>
              <textarea
                className="textarea-box"
                rows={3}
                placeholder="Ex.: Dificuldade na questão sobre súmula vinculante, revisar o artigo 103-A da CF..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              />
            </div>

            {timer.topicoId && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={marcarTopicoConcluido}
                    onChange={(e) => setMarcarTopicoConcluido(e.target.checked)}
                  />
                  <span style={{ fontSize: '0.85rem' }}>Marcar tópico "{topicoAtivo?.nome}" como concluído no edital</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={incrementarRevisao}
                    onChange={(e) => setIncrementarRevisao(e.target.checked)}
                  />
                  <span style={{ fontSize: '0.85rem' }}>Contabilizar 1 revisão para este tópico (+1 R)</span>
                </label>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setModalConcluirAberto(false)} className="btn btn-ghost">
                Voltar ao Cronômetro
              </button>
              <button onClick={handleSalvarSessao} className="btn btn-primary">
                Salvar Sessão e Histórico
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
