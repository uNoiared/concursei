// Painel de Estatísticas e Desempenho inspirado no Aprovado e Estudei, com filtro por semana e limpeza de histórico
import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Clock,
  TrendingUp,
  Target,
  CheckCircle2,
  Calendar,
  PieChart as PieIcon,
  CheckSquare,
  Trash2,
} from 'lucide-react';

export type FiltroPeriodoDesempenho = 'esta_semana' | 'semana_passada' | 'ultimas_2_semanas' | 'este_mes' | 'tudo';

export const EstatisticasView: React.FC = () => {
  const { db, limparHistoricoDesempenho } = useAppStore();

  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodoDesempenho>('esta_semana');
  const [modalLimparAberto, setModalLimparAberto] = useState(false);
  const [toastLimpeza, setToastLimpeza] = useState(false);

  const agora = useMemo(() => new Date(), []);

  // 1. Definição do intervalo de datas do filtro
  const { inicioFiltro, fimFiltro, rotuloPeriodo, modoSemanal }: {
    inicioFiltro: Date | null;
    fimFiltro: Date | null;
    rotuloPeriodo: string;
    modoSemanal: 'esta_semana' | 'semana_passada' | '14_dias' | 'mes' | 'tudo';
  } = useMemo(() => {
    const diaSemana = agora.getDay(); // 0 = Dom, 1 = Seg ... 6 = Sáb
    const diffSeg = diaSemana === 0 ? -6 : 1 - diaSemana;
    const segEstaSemana = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + diffSeg, 0, 0, 0, 0);
    const domEstaSemana = new Date(segEstaSemana.getTime() + 7 * 86400000 - 1);

    if (filtroPeriodo === 'esta_semana') {
      return {
        inicioFiltro: segEstaSemana,
        fimFiltro: domEstaSemana,
        rotuloPeriodo: 'Esta Semana (Seg - Dom)',
        modoSemanal: 'esta_semana' as const,
      };
    }
    if (filtroPeriodo === 'semana_passada') {
      const segPassada = new Date(segEstaSemana.getTime() - 7 * 86400000);
      const domPassada = new Date(segEstaSemana.getTime() - 1);
      return {
        inicioFiltro: segPassada,
        fimFiltro: domPassada,
        rotuloPeriodo: 'Semana Anterior',
        modoSemanal: 'semana_passada' as const,
      };
    }
    if (filtroPeriodo === 'ultimas_2_semanas') {
      const duasSemanasAtras = new Date(agora.getTime() - 14 * 86400000);
      return {
        inicioFiltro: duasSemanasAtras,
        fimFiltro: agora,
        rotuloPeriodo: 'Últimas 2 Semanas (14 Dias)',
        modoSemanal: '14_dias' as const,
      };
    }
    if (filtroPeriodo === 'este_mes') {
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1, 0, 0, 0, 0);
      return {
        inicioFiltro: inicioMes,
        fimFiltro: agora,
        rotuloPeriodo: 'Este Mês',
        modoSemanal: 'mes' as const,
      };
    }
    return {
      inicioFiltro: null as Date | null,
      fimFiltro: null as Date | null,
      rotuloPeriodo: 'Todo o Período',
      modoSemanal: 'tudo' as const,
    };
  }, [filtroPeriodo, agora]);

  // 2. Filtra sessões e questões conforme o período
  const sessoesFiltradas = useMemo(() => {
    if (!inicioFiltro) return db.sessoes;
    const start = inicioFiltro;
    const end = fimFiltro;
    return db.sessoes.filter((s) => {
      const d = new Date(s.inicio);
      if (end) return d >= start && d <= end;
      return d >= start;
    });
  }, [db.sessoes, inicioFiltro, fimFiltro]);

  const questoesFiltradas = useMemo(() => {
    if (!inicioFiltro) return db.questoes || [];
    const start = inicioFiltro;
    const end = fimFiltro;
    return (db.questoes || []).filter((q) => {
      const dataStr = q.data ? `${q.data}T12:00:00` : (q.created_at || new Date().toISOString());
      const d = new Date(dataStr);
      if (end) return d >= start && d <= end;
      return d >= start;
    });
  }, [db.questoes, inicioFiltro, fimFiltro]);

  // 3. Cálculos de Horas Líquidas no período selecionado
  const totalSegundos = useMemo(() => {
    return sessoesFiltradas.reduce((acc, s) => acc + s.duracao_seg, 0);
  }, [sessoesFiltradas]);

  const totalHoras = Math.floor(totalSegundos / 3600);
  const totalMin = Math.floor((totalSegundos % 3600) / 60);

  // Meta semanal somada de todos os concursos ativos
  const metaSemanalTotal = useMemo(() => {
    return db.planos.reduce((acc, p) => acc + (Number(p.horas_semanais) || 0), 0) || 20;
  }, [db.planos]);

  const horasLiquidasDecimal = (totalSegundos / 3600).toFixed(1);
  const pctMetaSemanal = Math.min(100, Math.round((Number(horasLiquidasDecimal) / metaSemanalTotal) * 100));

  // 4. Questões Resolvidas e Aproveitamento Geral no Período
  const metricasQuestoes = useMemo(() => {
    let acertos = 0;
    let erros = 0;
    let totalQ = 0;

    questoesFiltradas.forEach((q) => {
      acertos += q.acertos;
      erros += q.erros;
      totalQ += q.total;
    });

    // Se ainda não houver no banco de questões específico, busca das notas das sessões filtradas
    if (totalQ === 0) {
      sessoesFiltradas.forEach((s) => {
        if (s.questoes_total) {
          totalQ += s.questoes_total;
          acertos += s.questoes_acertos || 0;
          erros += s.questoes_erros || 0;
        } else {
          const match = (s.notas || '').match(/(\d+)\s+acertos[^\d]*(\d+)\s+erros/i);
          if (match) {
            acertos += Number(match[1]);
            erros += Number(match[2]);
          }
        }
      });
      if (totalQ === 0) totalQ = acertos + erros;
    }

    const taxa = totalQ > 0 ? Math.round((acertos / totalQ) * 100) : 0;
    return { acertos, erros, totalQ, taxa };
  }, [questoesFiltradas, sessoesFiltradas]);

  // 5. Desempenho de Questões por Matéria (Acertos vs Erros)
  const dadosGraficoQuestoesPorMateria = useMemo(() => {
    const mapa = new Map<string, { nome: string; cor: string; acertos: number; erros: number; total: number; taxa: number }>();

    questoesFiltradas.forEach((q) => {
      const m = db.materias.find((item) => item.id === q.materia_id);
      const nome = m ? m.nome : 'Disciplina Geral';
      const cor = m ? m.cor : '#14b8a6';
      const atual = mapa.get(nome) || { nome, cor, acertos: 0, erros: 0, total: 0, taxa: 0 };
      atual.acertos += q.acertos;
      atual.erros += q.erros;
      atual.total += q.total;
      mapa.set(nome, atual);
    });

    return Array.from(mapa.values())
      .filter((item) => item.total > 0)
      .map((item) => ({
        ...item,
        taxa: Math.round((item.acertos / item.total) * 100),
      }));
  }, [questoesFiltradas, db.materias]);

  // 6. Desempenho de Questões por Banca Examinadora
  const dadosBancas = useMemo(() => {
    const mapa = new Map<string, { banca: string; acertos: number; total: number }>();
    questoesFiltradas.forEach((q) => {
      const b = q.banca || 'Geral';
      const atual = mapa.get(b) || { banca: b, acertos: 0, total: 0 };
      atual.acertos += q.acertos;
      atual.total += q.total;
      mapa.set(b, atual);
    });
    return Array.from(mapa.values())
      .filter((b) => b.total > 0)
      .map((b) => ({
        ...b,
        taxa: Math.round((b.acertos / b.total) * 100),
      }));
  }, [questoesFiltradas]);

  // 7. Dados para o Gráfico Diário de Horas
  const dadosGraficoDiario = useMemo(() => {
    const dias: { data: string; dia: string; horas: number }[] = [];
    const nomesSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    if (modoSemanal === 'esta_semana' || modoSemanal === 'semana_passada') {
      // Exibe os 7 dias completos da semana selecionada (Segunda a Domingo)
      const baseSeg = inicioFiltro || agora;
      for (let i = 0; i < 7; i++) {
        const d = new Date(baseSeg.getTime() + i * 86400000);
        const isoData = d.toISOString().slice(0, 10);
        const diaSemana = nomesSemana[d.getDay()];

        const segDia = sessoesFiltradas
          .filter((s) => s.inicio.startsWith(isoData))
          .reduce((acc, s) => acc + s.duracao_seg, 0);

        dias.push({
          data: isoData,
          dia: diaSemana,
          horas: Math.round((segDia / 3600) * 10) / 10,
        });
      }
    } else {
      // Exibe os últimos 7 ou 14 dias
      const totalDias = modoSemanal === '14_dias' ? 14 : 7;
      for (let i = totalDias - 1; i >= 0; i--) {
        const d = new Date(agora.getTime() - i * 86400000);
        const isoData = d.toISOString().slice(0, 10);
        const diaSemana = nomesSemana[d.getDay()];

        const segDia = sessoesFiltradas
          .filter((s) => s.inicio.startsWith(isoData))
          .reduce((acc, s) => acc + s.duracao_seg, 0);

        dias.push({
          data: isoData,
          dia: diaSemana,
          horas: Math.round((segDia / 3600) * 10) / 10,
        });
      }
    }
    return dias;
  }, [sessoesFiltradas, modoSemanal, inicioFiltro, agora]);

  // 8. Dados para o Gráfico de Rosca: Tempo por Matéria
  const dadosGraficoMaterias = useMemo(() => {
    const mapa = new Map<string, { nome: string; cor: string; segundos: number }>();

    sessoesFiltradas.forEach((s) => {
      const m = db.materias.find((item) => item.id === s.materia_id);
      const nome = m ? m.nome : 'Geral';
      const cor = m ? m.cor : '#64748b';
      const atual = mapa.get(nome) || { nome, cor, segundos: 0 };
      atual.segundos += s.duracao_seg;
      mapa.set(nome, atual);
    });

    return Array.from(mapa.values())
      .filter((item) => item.segundos > 0)
      .map((item) => ({
        name: item.nome,
        color: item.cor,
        value: Math.round((item.segundos / 3600) * 10) / 10,
      }));
  }, [sessoesFiltradas, db.materias]);

  return (
    <div className="content-body">
      {/* CABEÇALHO DO PAINEL COM FILTRO POR SEMANA E BOTÃO LIMPAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800 }}>Desempenho & Estatísticas</h2>
            <span
              className="badge"
              style={{
                background: 'rgba(163, 230, 53, 0.12)',
                color: 'var(--primary)',
                border: '1px solid rgba(163, 230, 53, 0.25)',
                fontSize: '0.7rem',
                fontWeight: 700,
              }}
            >
              ● {rotuloPeriodo}
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Acompanhe seu tempo líquido de estudo, aproveitamento de questões e cumprimento de metas.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Seletor Segmentado de Período Semanal */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-input)',
              padding: 3,
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border)',
              gap: 3,
            }}
          >
            {(
              [
                { id: 'esta_semana', label: 'Esta Semana' },
                { id: 'semana_passada', label: 'Semana Anterior' },
                { id: 'ultimas_2_semanas', label: '14 Dias' },
                { id: 'este_mes', label: 'Este Mês' },
                { id: 'tudo', label: 'Todo o Período' },
              ] as const
            ).map((opt) => {
              const ativo = filtroPeriodo === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setFiltroPeriodo(opt.id)}
                  style={{
                    padding: '5px 12px',
                    fontSize: '0.74rem',
                    fontWeight: ativo ? 700 : 500,
                    borderRadius: 'var(--radius-full)',
                    background: ativo ? 'var(--primary)' : 'transparent',
                    color: ativo ? 'var(--primary-text)' : 'var(--text-muted)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Botão Limpar Informações */}
          <button
            onClick={() => setModalLimparAberto(true)}
            className="btn btn-secondary btn-sm"
            style={{
              gap: 6,
              color: '#ef4444',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.08)',
              fontWeight: 600,
            }}
            title="Limpar histórico de sessões e questões"
          >
            <Trash2 size={14} />
            Limpar Informações
          </button>
        </div>
      </div>

      {/* CARDS DE RESUMO RÁPIDO DO PERÍODO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {/* Card 1: Horas no Período */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tempo no Período</span>
            <Clock size={16} color="var(--primary)" />
          </div>
          <div className="timer-digits" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
            {totalHoras}h {totalMin}m
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: 4, display: 'block' }}>
            {sessoesFiltradas.length} sessões registradas
          </span>
        </div>

        {/* Card 2: Meta Semanal */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Meta Semanal</span>
            <TrendingUp size={16} color="var(--accent-purple)" />
          </div>
          <div className="timer-digits" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-purple)' }}>
            {horasLiquidasDecimal}h
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: 4, display: 'block' }}>
            Meta: {metaSemanalTotal}h ({pctMetaSemanal}%)
          </span>
        </div>

        {/* Card 3: Aproveitamento em Questões */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Aproveitamento</span>
            <Target size={16} color="var(--accent-emerald)" />
          </div>
          <div className="timer-digits" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
            {metricasQuestoes.totalQ > 0 ? `${metricasQuestoes.taxa}%` : '—'}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: 4, display: 'block' }}>
            {metricasQuestoes.acertos} acertos / {metricasQuestoes.erros} erros ({metricasQuestoes.totalQ}q)
          </span>
        </div>

        {/* Card 4: Tópicos Concluídos */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tópicos do Edital</span>
            <CheckCircle2 size={16} color="var(--accent-amber)" />
          </div>
          <div className="timer-digits" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
            {db.topicos.filter((t) => t.concluido).length}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: 4, display: 'block' }}>
            de {db.topicos.length} tópicos cadastrados
          </span>
        </div>
      </div>

      {/* GRÁFICOS DE TEMPO */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.2fr', gap: 20, marginBottom: 24 }}>
        {/* Gráfico 1: Horas Diárias */}
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} color="var(--primary)" />
            Horas Líquidas por Dia ({rotuloPeriodo})
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 20 }}>
            Constância e ritmo diário de estudos
          </p>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={dadosGraficoDiario}>
                <XAxis dataKey="dia" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} unit="h" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                  }}
                  formatter={(val) => [`${val} horas`, 'Estudo Líquido']}
                />
                <Bar dataKey="horas" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Distribuição por Matéria */}
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <PieIcon size={18} color="var(--accent-purple)" />
            Tempo por Disciplina (Horas)
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 20 }}>
            Divisão proporcional das disciplinas estudadas
          </p>

          {dadosGraficoMaterias.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Nenhum estudo registrado neste período.
            </div>
          ) : (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={dadosGraficoMaterias}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {dadosGraficoMaterias.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: '0.8rem',
                    }}
                    formatter={(val) => [`${val}h`, 'Horas']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* SEÇÃO: DESEMPENHO EM RESOLUÇÃO DE QUESTÕES */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckSquare size={19} color="#10b981" />
              Desempenho em Resolução de Questões
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Comparativo de acertos vs erros por disciplina no período e meta de assertividade de 80%.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {dadosBancas.map((b) => (
              <span
                key={b.banca}
                className="badge"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                }}
              >
                <strong>{b.banca}:</strong> {b.taxa}% ({b.acertos}/{b.total}q)
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr', gap: 20 }}>
          {/* Gráfico 1: Acertos vs Erros por Matéria */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Acertos vs Erros por Disciplina</h4>
              <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981', display: 'inline-block' }} />
                  Acertos
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#f43f5e', display: 'inline-block' }} />
                  Erros
                </span>
              </div>
            </div>

            {dadosGraficoQuestoesPorMateria.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Nenhuma questão registrada neste período. Registre no Caderno de Questões ou ao concluir uma sessão de estudos.
              </div>
            ) : (
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={dadosGraficoQuestoesPorMateria} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <XAxis
                      dataKey="nome"
                      stroke="var(--text-muted)"
                      fontSize={11}
                      tickLine={false}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        fontSize: '0.8rem',
                      }}
                      formatter={(val, name) => [
                        `${val} questões`,
                        name === 'acertos' ? 'Acertos' : 'Erros',
                      ]}
                    />
                    <Bar dataKey="acertos" name="acertos" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="erros" name="erros" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Gráfico 2: Taxa de Assertividade (%) com Meta de 80% */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Taxa de Assertividade (%)</h4>
              <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                Meta: 80%+
              </span>
            </div>

            {dadosGraficoQuestoesPorMateria.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Nenhum dado de aproveitamento disponível para este período.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {dadosGraficoQuestoesPorMateria.map((item) => {
                  const corTaxa = item.taxa >= 80 ? '#10b981' : item.taxa >= 65 ? '#f59e0b' : '#f43f5e';
                  return (
                    <div key={item.nome}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{item.nome}</span>
                        <span style={{ fontWeight: 800, color: corTaxa }}>
                          {item.taxa}% ({item.acertos}/{item.total})
                        </span>
                      </div>
                      <div style={{ width: '100%', height: 8, background: 'var(--bg-input)', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${item.taxa}%`,
                            height: '100%',
                            background: corTaxa,
                            borderRadius: 4,
                            transition: 'width 0.4s ease',
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            left: '80%',
                            top: 0,
                            bottom: 0,
                            width: 2,
                            background: 'rgba(255, 255, 255, 0.4)',
                          }}
                          title="Meta de Aprovação: 80%"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HISTÓRICO DE SESSÕES DO PERÍODO */}
      <div className="card" style={{ padding: 22 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 14 }}>
          Sessões Realizadas ({rotuloPeriodo})
        </h3>
        {sessoesFiltradas.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nenhum estudo registrado neste período.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sessoesFiltradas
              .slice(-10)
              .reverse()
              .map((sessao) => {
                const mat = db.materias.find((m) => m.id === sessao.materia_id);
                const conc = db.concursos.find((c) => c.id === sessao.concurso_id);
                const min = Math.round(sessao.duracao_seg / 60);

                return (
                  <div
                    key={sessao.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: 'var(--bg-input)',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: `4px solid ${mat?.cor || 'var(--primary)'}`,
                      fontSize: '0.85rem',
                    }}
                  >
                    <div>
                      <strong>{mat?.nome || conc?.nome || 'Geral'}</strong>
                      {sessao.notas && (
                        <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: '0.78rem' }}>
                          — {sessao.notas}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                        {new Date(sessao.inicio).toLocaleDateString('pt-BR')}
                      </span>
                      <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                        {min} min
                      </strong>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* MODAL DE CONFIRMAÇÃO PARA LIMPAR HISTÓRICO DE DESEMPENHO */}
      {modalLimparAberto && (
        <div className="modal-overlay" onClick={() => setModalLimparAberto(false)}>
          <div className="modal-content" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                }}
              >
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Limpar Histórico de Desempenho?</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 20 }}>
              Você tem certeza de que deseja apagar <strong>todas as {db.sessoes.length} sessões de estudo</strong> e os registros de questões resolvidas?
              <br /><br />
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                ✓ Seus concursos cadastrados, matérias e cronogramas de estudo NÃO serão alterados.
              </span>
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                className="btn btn-secondary"
                onClick={() => setModalLimparAberto(false)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  limparHistoricoDesempenho();
                  setModalLimparAberto(false);
                  setToastLimpeza(true);
                  setTimeout(() => setToastLimpeza(false), 3500);
                }}
                style={{ gap: 6 }}
              >
                <Trash2 size={15} />
                Sim, Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST DE FEEDBACK DE LIMPEZA */}
      {toastLimpeza && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'var(--bg-card)',
            border: '1px solid var(--accent-emerald)',
            color: 'var(--accent-emerald)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} />
          Histórico de desempenho e questões limpo com sucesso!
        </div>
      )}
    </div>
  );
};
