// Busca, filtros avançados e separação de concursos públicos abertos em todo o Brasil
import React, { useEffect, useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import {
  Search,
  RefreshCw,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { ConcursoAberto } from '../lib/types.ts';
import { sanitizarNomeConcurso } from '../lib/sanitizeConcurso.ts';

const UFS_LISTA = [
  'TODOS',
  'Nacional',
  'SP', 'RJ', 'MG', 'ES',
  'PR', 'RS', 'SC',
  'DF', 'GO', 'MT', 'MS',
  'BA', 'CE', 'PE', 'MA', 'PB', 'RN', 'AL', 'SE', 'PI',
  'AM', 'PA', 'RO', 'AC', 'AP', 'RR', 'TO',
];

const REGIOES_LISTA = ['TODAS', 'Nacional', 'Sudeste', 'Sul', 'Centro-Oeste', 'Nordeste', 'Norte'];

export const ConcursosAbertosView: React.FC = () => {
  const {
    concursosAbertos,
    carregandoConcursos,
    erroConcursos,
    carregarConcursosAbertos,
    filtroBusca,
    setFiltroBusca,
    filtroUf,
    setFiltroUf,
    filtroRegiao,
    setFiltroRegiao,
    filtroStatusEdital,
    setFiltroStatusEdital,
    filtroEscolaridade,
    setFiltroEscolaridade,
    filtroSalarioMin,
    filtroOrdenacao,
    setFiltroOrdenacao,
    adicionarConcursoDeAberto,
    setTela,
    setConcursoSelecionadoId,
    setAbaConcurso,
    db,
  } = useAppStore();

  const [modalDetalhe, setModalDetalhe] = useState<ConcursoAberto | null>(null);
  const [detalheCarregando, setDetalheCarregando] = useState(false);
  const [detalhesNoticia, setDetalhesNoticia] = useState<{ paragrafos: string[]; links: { href: string; texto: string; pdf: boolean }[] } | null>(null);

  // Carrega na montagem se ainda não tiver
  useEffect(() => {
    if (concursosAbertos.length === 0 && !carregandoConcursos) {
      carregarConcursosAbertos();
    }
  }, [concursosAbertos.length, carregandoConcursos, carregarConcursosAbertos]);

  // Carrega detalhes da notícia ao abrir o modal
  const abrirDetalhes = async (c: ConcursoAberto) => {
    setModalDetalhe(c);
    setDetalheCarregando(true);
    setDetalhesNoticia(null);
    try {
      const res = await fetch(`/api/concursos/detalhe?url=${encodeURIComponent(c.link)}`);
      if (res.ok) {
        const data = await res.json();
        setDetalhesNoticia(data);
      } else {
        setDetalhesNoticia({
          paragrafos: [
            c.descricaoNoticia || c.resumo || 'Informações e edital em preparação.',
            `Órgão: ${c.orgao} • Cargo(s): ${c.cargos}`,
            c.vagas ? `Vagas previstas: ${c.vagas}` : 'Vagas: a consultar / cadastro de reserva',
            c.salarioMax ? `Remuneração: até R$ ${c.salarioMax.toLocaleString('pt-BR')}` : '',
          ].filter(Boolean),
          links: c.link ? [{ href: c.link, texto: 'Ver publicação na fonte oficial', pdf: false }] : [],
        });
      }
    } catch {
      setDetalhesNoticia({
        paragrafos: [
          c.descricaoNoticia || c.resumo || 'Informações e edital em preparação.',
          `Órgão: ${c.orgao} • Cargo(s): ${c.cargos}`,
        ].filter(Boolean),
        links: c.link ? [{ href: c.link, texto: 'Ver publicação na fonte oficial', pdf: false }] : [],
      });
    }
    setDetalheCarregando(false);
  };

  // Filtragem e ordenação inteligente
  const concursosFiltrados = useMemo(() => {
    return concursosAbertos.filter((c) => {
      // Filtro Status do Edital (Aberto vs Pré-edital vs Forte Expectativa)
      if (filtroStatusEdital === 'forte_expectativa') {
        if (!c.forteExpectativa) return false;
      } else if (filtroStatusEdital !== 'todos') {
        const status = c.statusEdital || 'aberto';
        if (status !== filtroStatusEdital) return false;
      }

      // Busca textual
      if (filtroBusca) {
        const q = filtroBusca.toLowerCase();
        const bateu =
          c.orgao.toLowerCase().includes(q) ||
          c.titulo.toLowerCase().includes(q) ||
          c.cargos.toLowerCase().includes(q) ||
          c.resumo.toLowerCase().includes(q);
        if (!bateu) return false;
      }

      // Filtro UF
      if (filtroUf !== 'TODOS') {
        if (filtroUf === 'Nacional') {
          if (!c.nacional && c.uf !== 'Nacional') return false;
        } else if (c.uf !== filtroUf) {
          return false;
        }
      }

      // Filtro Região
      if (filtroRegiao !== 'TODAS') {
        if (filtroRegiao === 'Nacional') {
          if (!c.nacional && c.regiao !== 'Nacional' && c.uf !== 'Nacional') return false;
        } else if (c.regiao !== filtroRegiao) {
          return false;
        }
      }

      // Filtro Escolaridade
      if (filtroEscolaridade !== 'TODAS') {
        const tem = c.escolaridade.some((e) => e.toLowerCase().includes(filtroEscolaridade.toLowerCase()));
        if (!tem) return false;
      }

      // Filtro Salário Mínimo
      if (filtroSalarioMin > 0) {
        if (!c.salarioMax || c.salarioMax < filtroSalarioMin) return false;
      }

      return true;
    }).sort((a, b) => {
      if (filtroOrdenacao === 'prazo') {
        if (!a.inscricaoAte) return 1;
        if (!b.inscricaoAte) return -1;
        return a.inscricaoAte.localeCompare(b.inscricaoAte);
      }
      if (filtroOrdenacao === 'salario') {
        return (b.salarioMax || 0) - (a.salarioMax || 0);
      }
      if (filtroOrdenacao === 'vagas') {
        return (b.vagas || 0) - (a.vagas || 0);
      }
      return 0; // recente (ordem original da fonte)
    });
  }, [concursosAbertos, filtroStatusEdital, filtroBusca, filtroUf, filtroRegiao, filtroEscolaridade, filtroSalarioMin, filtroOrdenacao]);

  // Ação de abrir planejamento do concurso diretamente (sem tela embaçada)
  const handleAbrirPlanejamento = (c: ConcursoAberto) => {
    // 1. Procura se já está cadastrado em db.concursos
    const existente = db.concursos.find(
      (item) => item.fonte_id === c.id || item.id === `conc_${c.id}` || item.id === c.id
    );
    if (existente) {
      setConcursoSelecionadoId(existente.id);
      setAbaConcurso('organizador');
      setTela('concurso_detalhe');
      return;
    }

    // 2. Se for novo concurso, sanitiza e adiciona aos estudos
    const info = sanitizarNomeConcurso(c.orgao, c.cargos);
    const concursoSanitizado: ConcursoAberto = {
      ...c,
      orgao: info.orgao,
      cargos: info.cargo,
      titulo: info.titulo,
    };
    const novoId = adicionarConcursoDeAberto(concursoSanitizado);
    setConcursoSelecionadoId(novoId);
    setAbaConcurso('organizador');
    setTela('concurso_detalhe');
  };

  // IDs já adicionados
  const idsJaAdicionados = useMemo(() => {
    return new Set(db.concursos.map((c) => c.fonte_id).filter(Boolean));
  }, [db.concursos]);

  // Contagem de dias restantes até o encerramento da inscrição
  const calcularDiasRestantes = (dataIso: string | null, textoInscricao?: string): { dias: number | null; texto: string; urgente: boolean } => {
    if (!dataIso) return { dias: null, texto: 'Inscrições abertas', urgente: false };
    const fim = new Date(`${dataIso}T23:59:59`);
    const agora = new Date();
    const diffMs = fim.getTime() - agora.getTime();
    const dias = Math.ceil(diffMs / 86400000);
    if (dias < 0) return { dias, texto: 'Inscrições encerradas', urgente: true };
    if (dias === 0) return { dias, texto: 'Encerra hoje!', urgente: true };
    if (dias === 1) return { dias, texto: 'Encerra amanhã!', urgente: true };
    if (dias <= 5) return { dias, texto: `Faltam ${dias} dias`, urgente: true };
    return { dias, texto: `Até ${textoInscricao || dataIso}`, urgente: false };
  };

  return (
    <div className="content-body">
      {/* Header com métricas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Oportunidades em Aberto</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {concursosAbertos.length > 0 ? (
              <>
                Mostrando <strong>{concursosFiltrados.length}</strong> de <strong>{concursosAbertos.length}</strong> concursos públicos com inscrições abertas
              </>
            ) : (
              'Buscando concursos públicos abertos...'
            )}
          </p>
        </div>

        <button
          onClick={() => carregarConcursosAbertos(true)}
          disabled={carregandoConcursos}
          className="btn btn-secondary btn-sm"
          style={{ gap: 6 }}
        >
          <RefreshCw size={14} className={carregandoConcursos ? 'dot-pulse' : ''} />
          {carregandoConcursos ? 'Atualizando...' : 'Atualizar Fonte'}
        </button>
      </div>

      {erroConcursos && (
        <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.05)', marginBottom: 20 }}>
          <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>
            ⚠️ Não foi possível carregar os concursos automaticamente no momento ({erroConcursos}).
            Você pode cadastrar seus concursos manualmente ou tentar novamente.
          </p>
        </div>
      )}

      {/* BARRA DE BUSCA E FILTROS */}
      <div className="card" style={{ padding: 18, marginBottom: 24 }}>
        {/* Abas de Seleção: Todos, Forte Expectativa, Abertos ou Pré-Edital */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 14, flexWrap: 'wrap' }}>
          {[
            { id: 'todos', label: 'Todos os Concursos' },
            { id: 'forte_expectativa', label: '🔥 Forte Expectativa (PMDF, PRF, PF...)' },
            { id: 'aberto', label: '🟢 Editais Abertos (Oficial)' },
            { id: 'pre_edital', label: '⚡ Pré-Edital (Edital Anterior / Previstos)' },
          ].map((tab) => {
            const ativa = filtroStatusEdital === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFiltroStatusEdital(tab.id as any)}
                className="btn btn-sm"
                style={{
                  background: ativa
                    ? (tab.id === 'forte_expectativa' ? 'var(--accent-amber)' : tab.id === 'pre_edital' ? 'var(--accent-purple)' : 'var(--primary)')
                    : 'var(--bg-input)',
                  color: ativa ? (tab.id === 'forte_expectativa' ? '#451a03' : '#fff') : 'var(--text-muted)',
                  fontWeight: ativa ? 800 : 500,
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 16px',
                  border: ativa ? 'none' : '1px solid var(--border)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
          {/* Busca Textual */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-faint)' }} />
            <input
              type="text"
              placeholder="Buscar por órgão, prefeitura, tribunal, cargo ou palavra-chave..."
              className="input-text"
              style={{ paddingLeft: 36 }}
              value={filtroBusca}
              onChange={(e) => setFiltroBusca(e.target.value)}
            />
          </div>

          {/* Escolaridade */}
          <div>
            <select
              className="select-box"
              value={filtroEscolaridade}
              onChange={(e) => setFiltroEscolaridade(e.target.value)}
            >
              <option value="TODAS">Todas as Escolaridades</option>
              <option value="Superior">Nível Superior</option>
              <option value="Médio">Nível Médio</option>
              <option value="Técnico">Nível Técnico</option>
              <option value="Fundamental">Nível Fundamental</option>
            </select>
          </div>

          {/* Ordenação */}
          <div>
            <select
              className="select-box"
              value={filtroOrdenacao}
              onChange={(e) => setFiltroOrdenacao(e.target.value as 'prazo' | 'salario' | 'vagas' | 'recente')}
            >
              <option value="prazo">Prazo (Inscrições mais próximas)</option>
              <option value="salario">Maior Salário</option>
              <option value="vagas">Mais Vagas</option>
              <option value="recente">Mais Recentes</option>
            </select>
          </div>
        </div>

        {/* Filtros em Pílulas: Região & UFs mais frequentes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: 4 }}>
              Região:
            </span>
            {REGIOES_LISTA.map((r) => {
              const ativa = filtroRegiao === r;
              return (
                <button
                  key={r}
                  onClick={() => {
                    setFiltroRegiao(r);
                    if (r !== 'TODAS') setFiltroUf('TODOS');
                  }}
                  className="btn btn-sm"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    borderRadius: 'var(--radius-full)',
                    background: ativa ? 'var(--primary)' : 'var(--bg-input)',
                    color: ativa ? 'var(--primary-text)' : 'var(--text-muted)',
                    fontWeight: ativa ? 700 : 500,
                  }}
                >
                  {r}
                </button>
              );
            })}
          </div>

          {/* UFs Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', overflowX: 'auto', paddingBottom: 4 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: 4 }}>
              Estado (UF):
            </span>
            {UFS_LISTA.map((uf) => {
              const ativa = filtroUf === uf;
              return (
                <button
                  key={uf}
                  onClick={() => setFiltroUf(uf)}
                  className="btn btn-sm"
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    borderRadius: 6,
                    background: ativa ? 'var(--primary)' : 'transparent',
                    color: ativa ? 'var(--primary-text)' : 'var(--text-muted)',
                    border: ativa ? 'none' : '1px solid var(--border)',
                    fontWeight: ativa ? 700 : 500,
                  }}
                >
                  {uf}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* GRID DE CARDS DOS CONCURSOS */}
      {carregandoConcursos && concursosAbertos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="dot-pulse" style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--primary)', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Carregando concursos públicos com inscrições abertas...</p>
        </div>
      ) : concursosFiltrados.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 50 }}>
          <Filter size={36} color="var(--text-faint)" style={{ margin: '0 auto 12px' }} />
          <h3>Nenhum concurso encontrado para os filtros selecionados</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
            Tente remover a busca ou selecionar "Todas as Regiões".
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 16,
          }}
        >
          {concursosFiltrados.map((c) => {
            const jaAdicionado = idsJaAdicionados.has(c.id);
            const prazoInfo = calcularDiasRestantes(c.inscricaoAte, c.inscricaoTexto);
            const infoConcurso = sanitizarNomeConcurso(c.orgao, c.cargos);

            return (
              <div
                key={c.id}
                className="card card-interactive"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: 20,
                  cursor: 'pointer',
                  borderLeft: `4px solid ${c.salarioMax && c.salarioMax >= 8000 ? 'var(--accent-emerald)' : 'var(--primary)'}`,
                }}
                onClick={() => handleAbrirPlanejamento(c)}
              >
                <div>
                  {/* Topo do Card: UF + Status Edital + Prazo */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span className="badge badge-purple">
                        <MapPin size={11} />
                        {c.uf} {c.regiao ? `• ${c.regiao}` : ''}
                      </span>
                      {c.forteExpectativa ? (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(245, 158, 11, 0.2)',
                            color: '#f59e0b',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            fontWeight: 800,
                            fontSize: '0.68rem',
                          }}
                        >
                          🔥 FORTE EXPECTATIVA ({c.anoPrevisto || '2026/2027'})
                        </span>
                      ) : c.statusEdital === 'pre_edital' ? (
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
                          ⚡ PRÉ-EDITAL (Edital Anterior)
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
                          🟢 EDITAL ABERTO
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        className="badge"
                        style={{
                          background: c.forteExpectativa ? 'rgba(245, 158, 11, 0.12)' : (c.statusEdital === 'pre_edital' ? 'rgba(168, 85, 247, 0.12)' : (prazoInfo.urgente ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)')),
                          color: c.forteExpectativa ? '#f59e0b' : (c.statusEdital === 'pre_edital' ? '#c084fc' : (prazoInfo.urgente ? '#ef4444' : '#f59e0b')),
                          border: `1px solid ${c.forteExpectativa ? 'rgba(245, 158, 11, 0.3)' : (c.statusEdital === 'pre_edital' ? 'rgba(168, 85, 247, 0.25)' : (prazoInfo.urgente ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'))}`,
                        }}
                      >
                        <Calendar size={11} />
                        {c.forteExpectativa ? 'Previsto 2026/2027' : (c.statusEdital === 'pre_edital' ? 'Previsto' : prazoInfo.texto)}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirDetalhes(c);
                        }}
                        className="btn btn-ghost"
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                          padding: '3px 7px',
                          height: 'auto',
                          borderRadius: 6,
                          gap: 3,
                        }}
                        title="Ver notícia e informações da banca"
                      >
                        <FileText size={11} />
                        Notícia ↗
                      </button>
                    </div>
                  </div>

                  {/* Nome do Órgão (Título Principal Limpo) */}
                  <h3
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      marginBottom: 4,
                      lineHeight: 1.3,
                      color: 'var(--text-main)',
                    }}
                  >
                    {infoConcurso.orgao}
                  </h3>

                  {/* Cargo do Concurso */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 12 }}>
                    <Briefcase size={14} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {infoConcurso.cargo}
                    </span>
                  </div>

                  {/* Vagas e Escolaridade Chips */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                    <span className="badge badge-primary">
                      {c.vagas ? `${c.vagas} vagas` : c.cadastroReserva ? 'Cadastro Reserva' : 'Vagas sob edital'}
                    </span>
                    {c.escolaridade.map((esc) => (
                      <span key={esc} className="badge" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                        {esc}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Rodapé do Card: Salário e Ação */}
                <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Remuneração</span>
                    <span
                      style={{
                        fontSize: '1rem',
                        fontWeight: 800,
                        color: c.salarioMax ? 'var(--accent-emerald)' : 'var(--text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      <DollarSign size={14} />
                      {c.salarioMax ? `Até R$ ${c.salarioMax.toLocaleString('pt-BR')}` : c.resumo || 'A consultar'}
                    </span>
                  </div>

                  {jaAdicionado ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAbrirPlanejamento(c);
                      }}
                      className="btn btn-sm btn-secondary"
                      style={{
                        gap: 6,
                        borderColor: 'var(--accent-emerald)',
                        color: 'var(--accent-emerald)',
                        fontWeight: 700,
                      }}
                    >
                      <CheckCircle size={14} />
                      Acessar Planejamento
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAbrirPlanejamento(c);
                      }}
                      className="btn btn-sm"
                      style={{
                        gap: 6,
                        background: c.forteExpectativa ? 'var(--accent-amber)' : (c.statusEdital === 'pre_edital' ? 'var(--accent-purple)' : 'var(--primary)'),
                        color: c.forteExpectativa ? '#451a03' : '#fff',
                        fontWeight: 800,
                      }}
                    >
                      <Sparkles size={14} />
                      {c.forteExpectativa ? '🔥 Planejar Pré-Edital' : (c.statusEdital === 'pre_edital' ? '⚡ Planejar Pré-Edital' : '🟢 Abrir Planejamento')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DETALHES DO CONCURSO & LINKS DE EDITAL */}
      {modalDetalhe && (
        <div className="modal-overlay" onClick={() => setModalDetalhe(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span className="badge badge-purple">
                    {modalDetalhe.uf} • {modalDetalhe.tipo}
                  </span>
                  {modalDetalhe.forteExpectativa ? (
                    <span
                      className="badge"
                      style={{
                        background: 'rgba(245, 158, 11, 0.2)',
                        color: '#f59e0b',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        fontWeight: 800,
                        fontSize: '0.72rem',
                      }}
                    >
                      🔥 FORTE EXPECTATIVA ({modalDetalhe.anoPrevisto || '2026/2027'})
                    </span>
                  ) : modalDetalhe.statusEdital === 'pre_edital' ? (
                    <span
                      className="badge"
                      style={{
                        background: 'rgba(168, 85, 247, 0.2)',
                        color: '#c084fc',
                        border: '1px solid rgba(168, 85, 247, 0.4)',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                      }}
                    >
                      ⚡ PRÉ-EDITAL (Edital Anterior / Previsto)
                    </span>
                  ) : (
                    <span
                      className="badge"
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#34d399',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                      }}
                    >
                      🟢 EDITAL OFICIAL PUBLICADO
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>
                  {sanitizarNomeConcurso(modalDetalhe.orgao, modalDetalhe.cargos).orgao}
                </h2>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary)', marginTop: 4, marginBottom: 0 }}>
                  {sanitizarNomeConcurso(modalDetalhe.orgao, modalDetalhe.cargos).cargo}
                </p>
              </div>
            </div>

            {/* Descrição / Notícia da banca */}
            {modalDetalhe.descricaoNoticia && (
              <div
                style={{
                  padding: 12,
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  margin: '12px 0',
                  borderLeft: '4px solid var(--accent-amber)',
                }}
              >
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                  Notícia & Expectativa do Certame:
                </span>
                <p style={{ fontSize: '0.84rem', margin: 0, color: 'var(--text-main)', lineHeight: 1.5 }}>
                  {modalDetalhe.descricaoNoticia}
                </p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, margin: '16px 0', padding: 14, background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Inscrições até</span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--accent-amber)' }}>{modalDetalhe.inscricaoTexto || 'Ver edital'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Remuneração</span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--accent-emerald)' }}>
                  {modalDetalhe.salarioMax ? `Até R$ ${modalDetalhe.salarioMax.toLocaleString('pt-BR')}` : modalDetalhe.resumo}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Vagas</span>
                <strong style={{ fontSize: '0.9rem' }}>{modalDetalhe.vagas ? `${modalDetalhe.vagas} vagas` : 'Cadastro Reserva'}</strong>
              </div>
            </div>

            {/* Conteúdo / Resumo da Notícia */}
            <div style={{ maxHeight: 280, overflowY: 'auto', margin: '16px 0', paddingRight: 8 }}>
              {detalheCarregando ? (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <span className="dot-pulse" style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }} />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>Buscando edital e detalhes da banca...</p>
                </div>
              ) : detalhesNoticia ? (
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8, color: 'var(--primary)' }}>
                    Resumo do Concurso
                  </h4>
                  {detalhesNoticia.paragrafos.slice(0, 5).map((p, i) => (
                    <p key={i} style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginBottom: 8, lineHeight: 1.5 }}>
                      {p}
                    </p>
                  ))}

                  {/* Links Externos e Editais */}
                  {detalhesNoticia.links.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8, color: 'var(--primary)' }}>
                        Links Oficiais / Banca / Editais
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {detalhesNoticia.links.map((link, i) => (
                          <a
                            key={i}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ justifyContent: 'space-between', textDecoration: 'none' }}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {link.pdf ? '📄 [PDF] ' : '🌐 '}{link.texto}
                            </span>
                            <ExternalLink size={13} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Acesse a página completa do concurso para obter o documento oficial do edital.
                </p>
              )}
            </div>

            {/* Ações do Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <a
                href={modalDetalhe.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ gap: 6 }}
              >
                Ver notícia no PCI Concursos
                <ExternalLink size={14} />
              </a>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setModalDetalhe(null)} className="btn btn-ghost">
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleAbrirPlanejamento(modalDetalhe);
                    setModalDetalhe(null);
                  }}
                  className="btn"
                  style={{
                    gap: 6,
                    background: modalDetalhe.forteExpectativa ? 'var(--accent-amber)' : (modalDetalhe.statusEdital === 'pre_edital' ? 'var(--accent-purple)' : 'var(--primary)'),
                    color: modalDetalhe.forteExpectativa ? '#451a03' : '#fff',
                    fontWeight: 800,
                  }}
                >
                  <Sparkles size={16} />
                  {modalDetalhe.forteExpectativa ? '🔥 Iniciar Preparação Pré-Edital' : (modalDetalhe.statusEdital === 'pre_edital' ? '⚡ Organizar Pré-Edital' : '🟢 Abrir Planejamento de Estudos')}
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
