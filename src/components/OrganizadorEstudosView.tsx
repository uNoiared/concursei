// Organizador de Estudos e Planejamento Dinâmico (Estilo Estudei)
// Layout split: Coluna da esquerda com matérias (importância 1-5, domínio 1-5, tempo de estudo),
// e Coluna da direita fixa com gráfico de rosca reativo (Recharts) que se ajusta em tempo real.

import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import { Concurso } from '../lib/types.ts';
import { calcularPlanejamento } from '../lib/planner.ts';
import { salvarGradeCompleta } from '../lib/storage.ts';
import { gerarDisciplinasETopicosPadrao } from '../lib/editaisPadrao.ts';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Star,
  Clock,
  Play,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  FileText,
  Upload,
  ArrowRight,
  TrendingUp,
  RotateCw,
  BookOpen,
  Flame,
  ChevronDown,
  ChevronRight,
  ListTree,
  Target,
} from 'lucide-react';

interface Props {
  concurso: Concurso;
  onAbrirEditalPdf: () => void;
  onAbrirNovaMateria: () => void;
}

export const OrganizadorEstudosView: React.FC<Props> = ({
  concurso,
  onAbrirEditalPdf,
  onAbrirNovaMateria,
}) => {
  const {
    db,
    atualizarMateria,
    removerMateria,
    salvarPlano,
    setTimerVinculo,
    setTela,
    setAbaConcurso,
    carregarEditalAutomaticoParaConcurso,
  } = useAppStore();

  const [sincronizandoEdital, setSincronizandoEdital] = useState(false);
  const [mensagemSincronizacao, setMensagemSincronizacao] = useState<string | null>(null);

  // Matérias e tópicos deste concurso
  const materias = useMemo(() => {
    return db.materias.filter((m) => m.concurso_id === concurso.id);
  }, [db.materias, concurso.id]);

  const topicos = useMemo(() => {
    return db.topicos.filter((t) => t.concurso_id === concurso.id);
  }, [db.topicos, concurso.id]);

  // Auto-geração imediata para o caso de estudo sem matérias (evita abrir em branco)
  useEffect(() => {
    if (concurso && materias.length === 0) {
      const { materias: mats, topicos: tops } = gerarDisciplinasETopicosPadrao(
        concurso.id,
        concurso.nome,
        concurso.orgao,
        concurso.cargo
      );
      salvarGradeCompleta(concurso.id, mats, tops);
    }
  }, [concurso?.id, materias.length]);

  // Plano do concurso
  const plano = useMemo(() => {
    return (
      db.planos.find((p) => p.concurso_id === concurso.id) || {
        id: `plano_${concurso.id}`,
        concurso_id: concurso.id,
        horas_semanais: 20,
        dias: [0, 180, 180, 180, 180, 180, 120],
        duracao_bloco: 60,
      }
    );
  }, [db.planos, concurso.id]);

  // Cálculo Dinâmico do Planejamento & Ciclo
  const resultadoPlanejamento = useMemo(() => {
    return calcularPlanejamento(materias, plano, topicos);
  }, [materias, plano, topicos]);

  // Dados para o Gráfico de Rosca (Recharts)
  const dadosGrafico = useMemo(() => {
    return resultadoPlanejamento.materiasCalculadas.map((mc) => ({
      name: mc.materia.nome,
      value: mc.horasSemanais,
      horas: mc.horasSemanais,
      percentual: mc.percentualTempo,
      blocos: mc.qtdBlocos,
      color: mc.materia.cor || '#14b8a6',
      fixada: mc.horasFixadasPeloAluno,
    }));
  }, [resultadoPlanejamento.materiasCalculadas]);

  // Total de horas calculadas alocadas
  const totalHorasAlocadas = useMemo(() => {
    return resultadoPlanejamento.materiasCalculadas.reduce(
      (acc, mc) => acc + mc.horasSemanais,
      0
    );
  }, [resultadoPlanejamento.materiasCalculadas]);

  // Sincronizar / Recarregar Edital Automático
  const handleRecarregarEdital = async () => {
    setSincronizandoEdital(true);
    setMensagemSincronizacao(null);
    try {
      await carregarEditalAutomaticoParaConcurso(concurso.id);
      setMensagemSincronizacao('Edital e disciplinas atualizados com sucesso!');
      setTimeout(() => setMensagemSincronizacao(null), 4000);
    } catch {
      setMensagemSincronizacao('Falha ao sincronizar edital automático.');
    } finally {
      setSincronizandoEdital(false);
    }
  };

  // Iniciar Cronômetro a partir de uma matéria
  const handleIniciarEstudo = (materiaId: string) => {
    setTimerVinculo(concurso.id, materiaId, null);
    setTela('cronometro');
  };

  const [topicosExpandidosPorMateria, setTopicosExpandidosPorMateria] = useState<Record<string, boolean>>({});
  const [mostrarNoticiaCompleta, setMostrarNoticiaCompleta] = useState(false);

  const toggleExpandirTopicosMateria = (materiaId: string) => {
    setTopicosExpandidosPorMateria((prev) => ({ ...prev, [materiaId]: !prev[materiaId] }));
  };

  const ehPreEdital = concurso.status_edital === 'pre_edital';
  const ehForteExpectativa = Boolean(concurso.forte_expectativa);

  return (
    <div>
      {/* ======================================================== */}
      {/* BANNER DE STATUS DO EDITAL (ABERTO / PRÉ-EDITAL / QUENTE) */}
      {/* ======================================================== */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: 20,
          background: ehForteExpectativa
            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.14), rgba(217, 119, 6, 0.05))'
            : ehPreEdital
            ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(124, 58, 237, 0.04))'
            : 'linear-gradient(135deg, rgba(104, 187, 122, 0.12), rgba(72, 184, 119, 0.04))',
          border: ehForteExpectativa
            ? '1px solid rgba(222, 179, 93, 0.38)'
            : ehPreEdital
            ? '1px solid rgba(163, 150, 200, 0.3)'
            : '1px solid rgba(104, 187, 122, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 280 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: ehForteExpectativa
                ? 'rgba(245, 158, 11, 0.22)'
                : ehPreEdital
                ? 'rgba(139, 92, 246, 0.2)'
                : 'rgba(20, 184, 166, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {ehForteExpectativa ? (
              <Flame size={23} color="#f59e0b" />
            ) : ehPreEdital ? (
              <Target size={22} color="#c084fc" />
            ) : (
              <CheckCircle2 size={22} color="var(--primary)" />
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
              <span
                className="badge"
                style={{
                  background: ehForteExpectativa
                    ? 'rgba(245, 158, 11, 0.2)'
                    : ehPreEdital
                    ? 'rgba(168, 85, 247, 0.2)'
                    : 'rgba(16, 185, 129, 0.2)',
                  color: ehForteExpectativa
                    ? '#fbbf24'
                    : ehPreEdital
                    ? '#c084fc'
                    : '#34d399',
                  fontWeight: 800,
                  fontSize: '0.74rem',
                  letterSpacing: '0.02em',
                }}
              >
                {ehForteExpectativa
                  ? '🔥 FORTE EXPECTATIVA (2026/2027) • Certame Muito Quente'
                  : ehPreEdital
                  ? '⚡ PRÉ-EDITAL (Baseado no Edital Anterior)'
                  : '🟢 EDITAL OFICIAL PUBLICADO'}
              </span>

              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {materias.length} disciplinas carregadas • {topicos.length} tópicos catalogados
              </span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.4 }}>
              {ehForteExpectativa
                ? 'Concurso de altíssima relevância e probabilidade de autorização/publicação iminente (como a PMDF prevista com até 2.100 vagas). O Concursei estruturou os conteúdos afunilados do edital anterior para você sair na frente.'
                : ehPreEdital
                ? 'Este concurso ainda não teve o edital deste ano publicado. O Concursei carregou o conteúdo do último concurso realizado para você antecipar sua preparação e sair na frente da concorrência.'
                : 'O edital oficial deste concurso está publicado. Ajuste os pesos, domínio e tempo desejado abaixo para calibrar seu cronograma.'}
            </p>

            {concurso.descricao_noticia && (
              <div style={{ marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setMostrarNoticiaCompleta(!mostrarNoticiaCompleta)}
                  className="btn btn-ghost btn-sm"
                  style={{
                    padding: '2px 6px',
                    fontSize: '0.72rem',
                    color: ehForteExpectativa ? '#f59e0b' : 'var(--text-muted)',
                    gap: 4,
                  }}
                >
                  <FileText size={12} />
                  {mostrarNoticiaCompleta ? 'Ocultar detalhes da notícia' : 'Ver notícia e previsão do certame'}
                </button>

                {mostrarNoticiaCompleta && (
                  <div
                    style={{
                      marginTop: 6,
                      padding: '8px 12px',
                      background: 'rgba(0,0,0,0.25)',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      lineHeight: 1.45,
                      border: '1px dashed var(--border)',
                    }}
                  >
                    <strong>Notícia / Tramitação do Concurso:</strong> {concurso.descricao_noticia}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Ações Rápidas do Topo */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleRecarregarEdital}
            disabled={sincronizandoEdital}
            className="btn btn-secondary btn-sm"
            style={{ gap: 6 }}
            title="Recarrega as matérias padrão/edital deste concurso"
          >
            <RefreshCw size={13} className={sincronizandoEdital ? 'dot-pulse' : ''} />
            {sincronizandoEdital ? 'Sincronizando...' : 'Recarregar Edital'}
          </button>

          <button
            onClick={onAbrirEditalPdf}
            className="btn btn-secondary btn-sm"
            style={{ gap: 6 }}
          >
            <Upload size={13} />
            Importar PDF
          </button>

          <button
            onClick={onAbrirNovaMateria}
            className="btn btn-primary btn-sm"
            style={{ gap: 6 }}
          >
            <Plus size={14} />
            + Matéria
          </button>
        </div>
      </div>

      {mensagemSincronizacao && (
        <div
          className="card"
          style={{
            padding: '10px 16px',
            marginBottom: 16,
            background: 'rgba(16, 185, 129, 0.1)',
            borderColor: 'rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCircle2 size={16} />
          {mensagemSincronizacao}
        </div>
      )}

      {/* ======================================================== */}
      {/* LAYOUT PRINCIPAL EM DUAS COLUNAS (ESTILO ESTUDEI)        */}
      {/* ======================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(360px, 1fr)',
          gap: 24,
          alignItems: 'flex-start',
        }}
      >
        {/* ====================================================== */}
        {/* COLUNA ESQUERDA: LISTA INTERATIVA DE MATÉRIAS          */}
        {/* ====================================================== */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                Disciplinas & Configuração de Estudo
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Defina o peso na prova (1-5), seu conhecimento e o tempo dedicado para cada matéria.
              </p>
            </div>

            <span className="badge badge-primary" style={{ fontSize: '0.78rem' }}>
              {materias.length} disciplinas
            </span>
          </div>

          {materias.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '50px 20px' }}>
              <BookOpen size={40} color="var(--primary)" style={{ margin: '0 auto 12px', opacity: 0.8 }} />
              <h3>Nenhuma disciplina encontrada</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 460, margin: '8px auto 20px' }}>
                Clique em "Recarregar Edital" para sincronizar automaticamente as matérias do concurso ou adicione manualmente.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={handleRecarregarEdital} className="btn btn-primary" style={{ gap: 6 }}>
                  <RefreshCw size={15} />
                  Sincronizar Edital Automático
                </button>
                <button onClick={onAbrirNovaMateria} className="btn btn-secondary">
                  + Adicionar Manualmente
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {resultadoPlanejamento.materiasCalculadas.map((mc) => {
                const m = mc.materia;
                const topicosDestaMateria = topicos.filter((t) => t.materia_id === m.id);
                const totalSubtopicos = topicosDestaMateria.reduce((acc, t) => acc + (t.subtopicos?.length || 0), 0);
                const subtopicosConcluidos = topicosDestaMateria.reduce(
                  (acc, t) => acc + (t.subtopicos?.filter((s) => s.concluido).length || 0),
                  0
                );

                return (
                  <div
                    key={m.id}
                    className="card"
                    style={{
                      padding: 18,
                      borderLeft: `5px solid ${m.cor || 'var(--primary)'}`,
                      background: 'var(--bg-card)',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                  >
                    {/* Topo do Card da Matéria */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 14,
                        gap: 10,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              background: m.cor || 'var(--primary)',
                              display: 'inline-block',
                            }}
                          />
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                            {m.nome}
                          </h4>
                          {topicosDestaMateria.length > 0 && (
                            <span
                              className="badge"
                              style={{
                                background: 'var(--bg-input)',
                                color: 'var(--text-muted)',
                                fontSize: '0.68rem',
                              }}
                            >
                              {topicosDestaMateria.length} tópicos{totalSubtopicos > 0 ? ` • ${totalSubtopicos} subtópicos` : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Badges de Resultado Calculado */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(20, 184, 166, 0.15)',
                            color: 'var(--primary)',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            padding: '4px 10px',
                          }}
                        >
                          <Clock size={12} style={{ marginRight: 4 }} />
                          {mc.horasSemanais}h/sem ({mc.percentualTempo}%)
                        </span>

                        <button
                          onClick={() => handleIniciarEstudo(m.id)}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '5px 10px', fontSize: '0.72rem', gap: 4 }}
                          title="Iniciar cronômetro para esta matéria"
                        >
                          <Play size={11} />
                          Estudar
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Remover "${m.nome}" e seus tópicos dos estudos?`)) {
                              removerMateria(m.id);
                            }
                          }}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '5px 7px', color: 'var(--text-faint)' }}
                          title="Remover matéria"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* ==================================================== */}
                    {/* LINHA 1: IMPORTÂNCIA NA PROVA (1-5 ESTRELAS)         */}
                    {/* ==================================================== */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '170px 1fr',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        background: 'var(--bg-input)',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: 10,
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            color: 'var(--text-main)',
                          }}
                        >
                          <Star size={13} color="var(--accent-amber)" />
                          Importância na Prova:
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {m.importancia === 5
                            ? '5★ Peso Máximo / Eliminatória'
                            : m.importancia === 4
                            ? '4★ Alta Relevância'
                            : m.importancia === 3
                            ? '3★ Importância Média'
                            : m.importancia === 2
                            ? '2★ Relevância Regular'
                            : '1★ Pouco Peso'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {[1, 2, 3, 4, 5].map((estrela) => {
                          const ativa = estrela <= (m.importancia || 3);
                          return (
                            <button
                              key={estrela}
                              type="button"
                              onClick={() => atualizarMateria({ ...m, importancia: estrela })}
                              className="btn btn-sm"
                              style={{
                                background: ativa ? 'rgba(245, 158, 11, 0.18)' : 'var(--bg-card)',
                                border: ativa ? '1px solid var(--accent-amber)' : '1px solid var(--border)',
                                color: ativa ? 'var(--accent-amber)' : 'var(--text-faint)',
                                padding: '5px 10px',
                                gap: 4,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              title={`Peso ${estrela} de 5`}
                            >
                              <Star size={14} fill={ativa ? 'currentColor' : 'none'} />
                              <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>{estrela}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ==================================================== */}
                    {/* LINHA 2: NÍVEL DE CONHECIMENTO / DOMÍNIO (1 A 5)     */}
                    {/* ==================================================== */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '170px 1fr',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        background: 'var(--bg-input)',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: 10,
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            color: 'var(--text-main)',
                          }}
                        >
                          <TrendingUp size={13} color="var(--primary)" />
                          Seu Domínio Atual:
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {m.conhecimento === 1
                            ? '1 - Iniciante (Exige mais tempo)'
                            : m.conhecimento === 2
                            ? '2 - Básico'
                            : m.conhecimento === 3
                            ? '3 - Intermediário'
                            : m.conhecimento === 4
                            ? '4 - Bom Domínio'
                            : '5 - Avançado (Apenas revisão)'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {[
                          { nivel: 1, label: '1 - Iniciante' },
                          { nivel: 2, label: '2 - Básico' },
                          { nivel: 3, label: '3 - Médio' },
                          { nivel: 4, label: '4 - Bom' },
                          { nivel: 5, label: '5 - Avançado' },
                        ].map((item) => {
                          const selecionado = (m.conhecimento || 2) === item.nivel;
                          return (
                            <button
                              key={item.nivel}
                              type="button"
                              onClick={() => atualizarMateria({ ...m, conhecimento: item.nivel })}
                              className="btn btn-sm"
                              style={{
                                background: selecionado ? 'var(--primary)' : 'var(--bg-card)',
                                color: selecionado ? '#042f2e' : 'var(--text-muted)',
                                border: selecionado ? 'none' : '1px solid var(--border)',
                                fontWeight: selecionado ? 800 : 500,
                                fontSize: '0.72rem',
                                padding: '5px 9px',
                                cursor: 'pointer',
                              }}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ==================================================== */}
                    {/* LINHA 3: TEMPO DE ESTUDO DA MATÉRIA (AUTO VS FIXO)  */}
                    {/* ==================================================== */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '170px 1fr',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        background: 'var(--bg-input)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            color: 'var(--text-main)',
                          }}
                        >
                          <Clock size={13} color="#60a5fa" />
                          Tempo Semanal:
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {mc.horasFixadasPeloAluno
                            ? `Fixado pelo aluno (${mc.horasSemanais}h)`
                            : `Calculado pelo algoritmo (${mc.horasSemanais}h)`}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        {/* Botão de Modo Automático */}
                        <button
                          type="button"
                          onClick={() => {
                            atualizarMateria({ ...m, horas_semanais_desejadas: null });
                          }}
                          className="btn btn-sm"
                          style={{
                            background: !mc.horasFixadasPeloAluno ? 'var(--primary)' : 'var(--bg-card)',
                            color: !mc.horasFixadasPeloAluno ? '#042f2e' : 'var(--text-muted)',
                            border: !mc.horasFixadasPeloAluno ? 'none' : '1px solid var(--border)',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            padding: '6px 12px',
                          }}
                        >
                          ⚡ Automático ({mc.horasSemanais}h)
                        </button>

                        {/* Campo de Tempo Customizado */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ou Fixar:</span>
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            max="30"
                            placeholder="ex: 4"
                            className="input-text"
                            style={{
                              width: 80,
                              padding: '4px 8px',
                              fontSize: '0.8rem',
                              textAlign: 'center',
                              borderColor: mc.horasFixadasPeloAluno ? 'var(--accent-amber)' : 'var(--border)',
                            }}
                            value={
                              m.horas_semanais_desejadas !== null && m.horas_semanais_desejadas !== undefined
                                ? m.horas_semanais_desejadas
                                : ''
                            }
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : Math.max(0.5, Number(e.target.value));
                              atualizarMateria({ ...m, horas_semanais_desejadas: val });
                            }}
                          />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>horas/sem</span>

                          {/* Botões Rápidos +30m / -30m */}
                          <button
                            type="button"
                            onClick={() => {
                              const atual = m.horas_semanais_desejadas ?? mc.horasSemanais;
                              const novo = Math.max(0.5, Math.round((atual - 0.5) * 10) / 10);
                              atualizarMateria({ ...m, horas_semanais_desejadas: novo });
                            }}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '3px 7px', fontSize: '0.7rem' }}
                            title="Diminuir 30 minutos"
                          >
                            -30m
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const atual = m.horas_semanais_desejadas ?? mc.horasSemanais;
                              const novo = Math.round((atual + 0.5) * 10) / 10;
                              atualizarMateria({ ...m, horas_semanais_desejadas: novo });
                            }}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '3px 7px', fontSize: '0.7rem' }}
                            title="Aumentar 30 minutos"
                          >
                            +30m
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Rodapé Interno da Matéria com Indicador do Ciclo */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 10,
                        paddingTop: 8,
                        borderTop: '1px solid var(--border)',
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span>
                        Score Ponderado: <strong>{mc.peso} pts</strong> (Peso {m.importancia} × Fator {6 - (m.conhecimento || 2)})
                      </span>
                      <span>
                        Gera <strong>{mc.qtdBlocos} bloco(s)</strong> de {plano.duracao_bloco || 60}m no ciclo rotativo
                      </span>
                    </div>

                    {/* Botão e Gaveta de Conteúdo Afunilado do Edital (Tópicos & Subtópicos) */}
                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => toggleExpandirTopicosMateria(m.id)}
                          className="btn btn-ghost btn-sm"
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.74rem',
                            color: 'var(--primary)',
                            gap: 5,
                            background: topicosExpandidosPorMateria[m.id] ? 'rgba(20, 184, 166, 0.12)' : 'transparent',
                          }}
                        >
                          <ListTree size={13} />
                          <span>
                            {topicosExpandidosPorMateria[m.id] ? 'Recolher Conteúdo Afunilado' : 'Ver Conteúdo Afunilado do Edital'}
                            {topicosDestaMateria.length > 0 && ` (${topicosDestaMateria.length} tópicos${totalSubtopicos > 0 ? ` • ${totalSubtopicos} subtópicos` : ''})`}
                          </span>
                          {topicosExpandidosPorMateria[m.id] ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        </button>

                        <button
                          type="button"
                          onClick={() => setAbaConcurso('edital')}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '3px 6px', fontSize: '0.7rem', color: 'var(--text-muted)' }}
                          title="Gerenciar tópicos no edital verticalizado"
                        >
                          Gerenciar no Edital Verticalizado →
                        </button>
                      </div>

                      {topicosExpandidosPorMateria[m.id] && (
                        <div
                          style={{
                            marginTop: 10,
                            padding: '12px 14px',
                            background: 'var(--bg-app)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-main)' }}>
                              Estrutura Hierárquica do Edital:
                            </span>
                            {totalSubtopicos > 0 && (
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                {subtopicosConcluidos} de {totalSubtopicos} subtópicos concluídos
                              </span>
                            )}
                          </div>

                          {topicosDestaMateria.length === 0 ? (
                            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>
                              Nenhum tópico cadastrado nesta disciplina.
                            </p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {topicosDestaMateria.map((top) => (
                                <div
                                  key={top.id}
                                  style={{
                                    padding: '8px 10px',
                                    background: 'var(--bg-card)',
                                    borderRadius: 6,
                                    border: '1px solid var(--border)',
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <strong style={{ fontSize: '0.78rem', color: top.concluido ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: top.concluido ? 'line-through' : 'none' }}>
                                      {top.nome}
                                    </strong>
                                    {top.subtopicos && top.subtopicos.length > 0 && (
                                      <span className="badge" style={{ fontSize: '0.64rem', padding: '1px 6px' }}>
                                        {top.subtopicos.filter((s) => s.concluido).length}/{top.subtopicos.length} subtópicos
                                      </span>
                                    )}
                                  </div>

                                  {top.subtopicos && top.subtopicos.length > 0 && (
                                    <div
                                      style={{
                                        marginTop: 6,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 4,
                                        paddingLeft: 10,
                                        borderLeft: '2px solid rgba(20, 184, 166, 0.35)',
                                      }}
                                    >
                                      {top.subtopicos.map((sub) => (
                                        <div
                                          key={sub.id}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            fontSize: '0.73rem',
                                            color: sub.concluido ? 'var(--text-muted)' : 'var(--text-main)',
                                            textDecoration: sub.concluido ? 'line-through' : 'none',
                                            padding: '2px 0',
                                          }}
                                        >
                                          <span>• {sub.nome}</span>
                                          {sub.revisoes > 0 && (
                                            <span
                                              className="badge"
                                              style={{
                                                fontSize: '0.62rem',
                                                padding: '1px 5px',
                                                background: 'rgba(139, 92, 246, 0.15)',
                                                color: '#c084fc',
                                              }}
                                            >
                                              {sub.revisoes}x rev
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ====================================================== */}
        {/* COLUNA DIREITA: STICKY PAINEL & GRÁFICO REATIVO       */}
        {/* ====================================================== */}
        <div style={{ position: 'sticky', top: 20 }}>
          {/* CARD DO GRÁFICO E BALANÇO */}
          <div
            className="card"
            style={{
              padding: 22,
              marginBottom: 16,
              background: 'var(--bg-card)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                  Visualização do Cronograma
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Gráfico atualizado em tempo real conforme suas alterações
                </p>
              </div>

              <span
                className="badge badge-primary"
                style={{ fontSize: '0.8rem', fontWeight: 800 }}
              >
                {plano.horas_semanais}h semanais
              </span>
            </div>

            {/* CONTROLES DE HORAS SEMANAIS & BLOCO */}
            <div
              style={{
                background: 'var(--bg-input)',
                padding: 14,
                borderRadius: 'var(--radius-sm)',
                marginBottom: 18,
              }}
            >
              {/* Slider de Horas Totais */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Carga Horária Semanal Total:
                  </label>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>
                    {plano.horas_semanais} horas/semana
                  </strong>
                </div>

                <input
                  type="range"
                  min="5"
                  max="120"
                  step="1"
                  value={plano.horas_semanais}
                  onChange={(e) => {
                    salvarPlano({
                      ...plano,
                      horas_semanais: Number(e.target.value),
                    });
                  }}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />

                {/* Atalhos Rápidos de Carga Horária */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  {[15, 25, 40, 60, 80, 120].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => salvarPlano({ ...plano, horas_semanais: h })}
                      className="btn btn-sm"
                      style={{
                        flex: 1,
                        minWidth: 42,
                        padding: '3px 4px',
                        fontSize: '0.72rem',
                        background: plano.horas_semanais === h ? 'var(--primary)' : 'var(--bg-card)',
                        color: plano.horas_semanais === h ? '#042f2e' : 'var(--text-muted)',
                        fontWeight: plano.horas_semanais === h ? 800 : 500,
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {h}h
                    </button>
                  ))}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.68rem',
                    color: 'var(--text-muted)',
                    marginTop: 6,
                  }}
                >
                  <span>5h (Mínimo)</span>
                  <span>Média de {(plano.horas_semanais / 6).toFixed(1)}h/dia</span>
                  <span>120h (Intensivo)</span>
                </div>
              </div>

              {/* Duração do Bloco */}
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  Duração do bloco de estudo:
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[30, 45, 50, 60, 90].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => salvarPlano({ ...plano, duracao_bloco: dur })}
                      className="btn btn-sm"
                      style={{
                        flex: 1,
                        padding: '4px 6px',
                        fontSize: '0.72rem',
                        background: plano.duracao_bloco === dur ? 'var(--primary)' : 'var(--bg-card)',
                        color: plano.duracao_bloco === dur ? '#042f2e' : 'var(--text-muted)',
                        fontWeight: plano.duracao_bloco === dur ? 700 : 500,
                        border: '1px solid var(--border)',
                      }}
                    >
                      {dur}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* GRÁFICO DE ROSCA REATIVO (RECHARTS) */}
            {materias.length === 0 ? (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  Adicione matérias para visualizar o gráfico.
                </p>
              </div>
            ) : (
              <div style={{ position: 'relative', width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosGrafico}
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      animationDuration={600}
                      animationEasing="ease-out"
                    >
                      {dadosGrafico.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div
                              style={{
                                background: 'rgba(15, 23, 42, 0.95)',
                                border: '1px solid var(--border)',
                                padding: '10px 14px',
                                borderRadius: 8,
                                boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                                color: '#fff',
                                fontSize: '0.8rem',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <span
                                  style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    background: data.color,
                                  }}
                                />
                                <strong style={{ fontSize: '0.9rem' }}>{data.name}</strong>
                              </div>
                              <p style={{ margin: '2px 0', color: 'var(--primary)' }}>
                                <strong>{data.horas} horas por semana</strong> ({data.percentual}%)
                              </p>
                              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                                {data.blocos} bloco(s) no ciclo de estudos
                                {data.fixada ? ' • Horas fixadas manualmente' : ''}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Texto Central da Rosca */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <span
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: 'var(--primary)',
                      display: 'block',
                      lineHeight: 1.1,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {totalHorasAlocadas.toFixed(1)}h
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {materias.length} matérias
                  </span>
                </div>
              </div>
            )}

            {/* LEGENDA / LISTA DE PROPORÇÕES */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                maxHeight: 180,
                overflowY: 'auto',
                marginTop: 10,
                paddingRight: 4,
              }}
            >
              {resultadoPlanejamento.materiasCalculadas.map((mc) => (
                <div
                  key={mc.materia.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.74rem',
                    padding: '4px 6px',
                    borderRadius: 4,
                    background: 'var(--bg-input)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: mc.materia.cor,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: 600,
                      }}
                    >
                      {mc.materia.nome}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <strong style={{ color: 'var(--text-main)' }}>{mc.horasSemanais}h</strong>
                    <span style={{ color: 'var(--text-muted)', minWidth: 32, textAlign: 'right' }}>
                      {mc.percentualTempo}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* PRÉ-VISUALIZAÇÃO DO CICLO DE ESTUDOS ROTATIVO */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <strong style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RotateCw size={14} color="var(--primary)" />
                  Ciclo Rotativo Intercalado
                </strong>
                <span className="badge" style={{ fontSize: '0.7rem' }}>
                  {resultadoPlanejamento.ciclo.length} blocos
                </span>
              </div>

              {resultadoPlanejamento.ciclo.length === 0 ? (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Nenhum ciclo gerado.
                </p>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    overflowX: 'auto',
                    paddingBottom: 8,
                    scrollbarWidth: 'thin',
                  }}
                >
                  {resultadoPlanejamento.ciclo.slice(0, 10).map((bloco, bIdx) => (
                    <div
                      key={bloco.id}
                      style={{
                        minWidth: 100,
                        padding: '8px 10px',
                        background: 'var(--bg-input)',
                        borderRadius: 6,
                        borderLeft: `3px solid ${bloco.cor}`,
                        fontSize: '0.7rem',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem', display: 'block' }}>
                        Etapa {bIdx + 1}
                      </span>
                      <strong
                        style={{
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {bloco.materiaNome}
                      </strong>
                      <span style={{ color: 'var(--primary)', fontSize: '0.65rem' }}>
                        {bloco.duracaoMin}m
                      </span>
                    </div>
                  ))}
                  {resultadoPlanejamento.ciclo.length > 10 && (
                    <div
                      style={{
                        minWidth: 70,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--bg-input)',
                        borderRadius: 6,
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      +{resultadoPlanejamento.ciclo.length - 10} blocos
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* BOTÕES DE AÇÃO PRINCIPAL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18 }}>
              <button
                onClick={() => {
                  const primeiraMat = materias[0];
                  if (primeiraMat) {
                    handleIniciarEstudo(primeiraMat.id);
                  }
                }}
                disabled={materias.length === 0}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', gap: 8, fontWeight: 700 }}
              >
                <Play size={16} />
                Iniciar Estudo Agora no Cronômetro
              </button>

              <button
                onClick={() => setAbaConcurso('edital')}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'center', gap: 6 }}
              >
                <FileText size={14} />
                Acessar Edital Verticalizado & Tópicos
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
