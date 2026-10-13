// Painel dos Meus Estudos: lista de concursos e cursos de faculdade acompanhados pelo aluno
import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import {
  GraduationCap,
  Calendar,
  CheckCircle2,
  Play,
  Plus,
  Trash2,
  Building,
  Target,
  Sliders,
} from 'lucide-react';
import { Concurso, Tipo } from '../lib/types.ts';

interface MeusEstudosViewProps {
  onNovoConcurso: () => void;
}

export const MeusEstudosView: React.FC<MeusEstudosViewProps> = ({ onNovoConcurso }) => {
  const {
    db,
    setTela,
    setConcursoSelecionadoId,
    setTimerVinculo,
    setAbaConcurso,
    removerConcurso,
  } = useAppStore();

  const [filtroTipo, setFiltroTipo] = useState<'todos' | Tipo>('todos');

  const concursosFiltrados = db.concursos.filter((c) => {
    if (filtroTipo === 'todos') return true;
    return c.tipo === filtroTipo;
  });

  // Dias até a prova
  const calcularDiasAteProva = (dataProva?: string | null) => {
    if (!dataProva) return null;
    const prova = new Date(`${dataProva}T00:00:00`);
    const hoje = new Date();
    const diff = Math.ceil((prova.getTime() - hoje.getTime()) / 86400000);
    return diff;
  };

  const handleAbrirConcurso = (c: Concurso, aba: 'organizador' | 'edital' | 'planejamento' = 'organizador') => {
    setConcursoSelecionadoId(c.id);
    setAbaConcurso(aba);
    setTela('concurso_detalhe');
  };

  const handleEstudarAgora = (c: Concurso) => {
    // Acha a primeira matéria ativa deste concurso
    const primeiraMat = db.materias.find((m) => m.concurso_id === c.id && m.ativa);
    setTimerVinculo(c.id, primeiraMat ? primeiraMat.id : null, null);
    setTela('cronometro');
  };

  return (
    <div className="content-body">
      {/* Topo do Painel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Meus Estudos & Metas</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Gerencie seus editais verticalizados, ciclos rotativos e cronogramas de estudo.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {/* Filtros por Categoria */}
          <div style={{ display: 'flex', background: 'var(--bg-input)', padding: 3, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            {(['todos', 'concurso', 'faculdade'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFiltroTipo(t)}
                className="btn btn-sm"
                style={{
                  background: filtroTipo === t ? 'var(--primary)' : 'transparent',
                  color: filtroTipo === t ? '#042f2e' : 'var(--text-muted)',
                  fontWeight: filtroTipo === t ? 700 : 500,
                  borderRadius: 6,
                  padding: '4px 12px',
                }}
              >
                {t === 'todos' ? 'Todos' : t === 'concurso' ? 'Concursos' : 'Faculdade'}
              </button>
            ))}
          </div>

          <button onClick={onNovoConcurso} className="btn btn-primary btn-sm" style={{ gap: 6 }}>
            <Plus size={16} />
            + Adicionar Estudo
          </button>
        </div>
      </div>

      {concursosFiltrados.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <GraduationCap size={48} color="var(--primary)" style={{ margin: '0 auto 16px', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: 6 }}>Você ainda não cadastrou nenhum estudo</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 450, margin: '0 auto 20px' }}>
            Explore os concursos públicos abertos para adicionar com 1 clique ou cadastre suas matérias de faculdade manualmente.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => setTela('concursos_abertos')} className="btn btn-secondary">
              Buscar Concursos Abertos
            </button>
            <button onClick={onNovoConcurso} className="btn btn-primary">
              + Cadastrar Manualmente
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: 20,
          }}
        >
          {concursosFiltrados.map((c) => {
            const materiasConcurso = db.materias.filter((m) => m.concurso_id === c.id);
            const topicosConcurso = db.topicos.filter((t) => t.concurso_id === c.id);
            const topicosConcluidos = topicosConcurso.filter((t) => t.concluido).length;
            const pctEdital = topicosConcurso.length > 0
              ? Math.round((topicosConcluidos / topicosConcurso.length) * 100)
              : 0;

            const planoConcurso = db.planos.find((p) => p.concurso_id === c.id);

            // Horas estudadas neste concurso
            const segundosEstudados = db.sessoes
              .filter((s) => s.concurso_id === c.id)
              .reduce((acc, s) => acc + s.duracao_seg, 0);
            const horasEstudadas = Math.floor(segundosEstudados / 3600);
            const minEstudados = Math.floor((segundosEstudados % 3600) / 60);

            const diasAteProva = calcularDiasAteProva(c.data_prova);

            return (
              <div
                key={c.id}
                className="card card-interactive"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: 22,
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onClick={() => handleAbrirConcurso(c)}
              >
                {/* Faixa decorativa superior */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: c.cor || 'var(--primary)',
                  }}
                />

                <div>
                  {/* Badges de Tipo, Status do Edital e Prova */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={c.tipo === 'faculdade' ? 'badge badge-purple' : 'badge badge-primary'}>
                        {c.tipo === 'faculdade' ? '🎓 Faculdade' : '🏛️ Concurso'}
                      </span>
                      {c.status_edital === 'pre_edital' ? (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(168, 85, 247, 0.2)',
                            color: '#c084fc',
                            border: '1px solid rgba(168, 85, 247, 0.4)',
                            fontWeight: 700,
                            fontSize: '0.68rem',
                          }}
                        >
                          ⚡ PRÉ-EDITAL
                        </span>
                      ) : (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            fontWeight: 700,
                            fontSize: '0.68rem',
                          }}
                        >
                          🟢 EDITAL PUBLICADO
                        </span>
                      )}
                    </div>

                    {diasAteProva !== null && (
                      <span
                        className="badge"
                        style={{
                          background: diasAteProva <= 15 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: diasAteProva <= 15 ? '#ef4444' : '#f59e0b',
                        }}
                      >
                        <Calendar size={12} />
                        {diasAteProva < 0 ? 'Prova realizada' : diasAteProva === 0 ? 'Prova hoje!' : `Prova em ${diasAteProva} dias`}
                      </span>
                    )}
                  </div>

                  {/* Nome do Estudo */}
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 4, color: 'var(--text-main)', lineHeight: 1.3 }}>
                    {c.nome}
                  </h3>

                  {c.orgao && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                      <Building size={13} />
                      {c.orgao} {c.banca ? `• Banca ${c.banca}` : ''}
                    </p>
                  )}

                  {/* Barra de Progresso do Edital Verticalizado */}
                  <div style={{ margin: '14px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 6 }}>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={13} color="var(--primary)" />
                        Edital Verticalizado
                      </span>
                      <strong style={{ color: 'var(--primary)' }}>
                        {topicosConcluidos} de {topicosConcurso.length} tópicos ({pctEdital}%)
                      </strong>
                    </div>

                    <div style={{ width: '100%', height: 7, background: 'var(--bg-input)', borderRadius: 4, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pctEdital}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--primary), var(--accent-emerald))',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>

                  {/* Grid de Métricas do Concurso */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 8,
                      padding: 12,
                      background: 'var(--bg-input)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Matérias</span>
                      <strong style={{ fontSize: '0.92rem' }}>{materiasConcurso.length}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Tempo Líquido</span>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--primary)' }}>
                        {horasEstudadas}h {minEstudados}m
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Meta Semanal</span>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--accent-purple)' }}>
                        {planoConcurso?.horas_semanais || 20}h/sem
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Ações do Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEstudarAgora(c);
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ gap: 6 }}
                    title="Iniciar cronômetro para este concurso"
                  >
                    <Play size={14} />
                    Estudar Agora
                  </button>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAbrirConcurso(c, 'organizador');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: 4 }}
                      title="Abrir Organizador de Estudos (Estilo Estudei)"
                    >
                      <Sliders size={14} />
                      Organizar
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAbrirConcurso(c, 'planejamento');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: 4 }}
                      title="Abrir Ciclo e Cronograma"
                    >
                      <Target size={14} />
                      Ciclo
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Deseja remover "${c.nome}" e todos os seus tópicos?`)) {
                          removerConcurso(c.id);
                        }
                      }}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--text-faint)', padding: '6px 8px' }}
                      title="Excluir estudo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
