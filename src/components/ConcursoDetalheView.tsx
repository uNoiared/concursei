import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import {
  FileText,
  Upload,
  Calendar,
  Plus,
  Trash2,
  Play,
  RotateCw,
  Star,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Target,
  ListOrdered,
  History,
  Sliders,
  Flame,
  CheckSquare,
  Award,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { extrairTextoPdf, analisarConteudoEdital, MateriaExtraida } from '../lib/pdfExtractor.ts';
import { calcularPlanejamento, NOMES_DIAS } from '../lib/planner.ts';
import { salvarGradeCompleta } from '../lib/storage.ts';
import { gerarDisciplinasETopicosPadrao } from '../lib/editaisPadrao.ts';
import { OrganizadorEstudosView } from './OrganizadorEstudosView.tsx';

export const ConcursoDetalheView: React.FC = () => {
  const {
    concursoSelecionadoId,
    setTela,
    abaConcurso,
    setAbaConcurso,
    db,
    adicionarMateria,
    atualizarMateria,
    removerMateria,
    adicionarTopico,
    toggleTopicoConcluido,
    incrementarRevisaoTopico,
    removerTopico,
    toggleSubtopicoConcluido,
    incrementarRevisaoSubtopico,
    adicionarSubtopico,
    salvarPlano,
    setTimerVinculo,
    adicionarRegistroQuestoes,
    removerRegistroQuestoes,
  } = useAppStore();

  const concurso = db.concursos.find((c) => c.id === concursoSelecionadoId);

  // Estado do Importador de PDF do Edital
  const [modalPdfAberto, setModalPdfAberto] = useState(false);
  const [carregandoPdf, setCarregandoPdf] = useState(false);
  const [statusPdf, setStatusPdf] = useState<string | null>(null);
  const [materiasDetectadas, setMateriasDetectadas] = useState<MateriaExtraida[]>([]);
  const [urlEdital, setUrlEdital] = useState('');

  // Estado de Nova Matéria Manual
  const [modalNovaMateria, setModalNovaMateria] = useState(false);
  const [novaMateriaNome, setNovaMateriaNome] = useState('');
  const [novaMateriaImportancia, setNovaMateriaImportancia] = useState(3);
  const [novaMateriaConhecimento, setNovaMateriaConhecimento] = useState(2);
  const [novaMateriaHorasDesejadas, setNovaMateriaHorasDesejadas] = useState<string>('');
  const [novaMateriaCor, setNovaMateriaCor] = useState('#14b8a6');

  // Estado do Organizador de Questões
  const [modalQuestoesAberto, setModalQuestoesAberto] = useState(false);
  const [qMateriaId, setQMateriaId] = useState('');
  const [qTopicoId, setQTopicoId] = useState('');
  const [qBanca, setQBanca] = useState('FGV');
  const [qTotal, setQTotal] = useState<number>(20);
  const [qAcertos, setQAcertos] = useState<number>(16);
  const [qErros, setQErros] = useState<number>(4);
  const [qData, setQData] = useState(() => new Date().toISOString().slice(0, 10));
  const [qObs, setQObs] = useState('');
  const [filtroMateriaQuestoes, setFiltroMateriaQuestoes] = useState('todas');

  // Estado de Novo Tópico & Subtópico
  const [materiaAdicionandoTopico, setMateriaAdicionandoTopico] = useState<string | null>(null);
  const [novoTopicoNome, setNovoTopicoNome] = useState('');
  const [topicoAdicionandoSub, setTopicoAdicionandoSub] = useState<string | null>(null);
  const [novoSubtopicoNome, setNovoSubtopicoNome] = useState('');
  const [topicosRecolhidos, setTopicosRecolhidos] = useState<Record<string, boolean>>({});

  const toggleTopicoRecolhido = (topId: string) => {
    setTopicosRecolhidos((prev) => ({ ...prev, [topId]: !prev[topId] }));
  };

  // Estado de Matérias Expandidas no Edital Verticalizado
  const [materiasExpandidas, setMateriasExpandidas] = useState<Record<string, boolean>>({});

  // Dados do Concurso Atual
  const materias = useMemo(() => {
    return db.materias.filter((m) => m.concurso_id === concursoSelecionadoId);
  }, [db.materias, concursoSelecionadoId]);

  const topicos = useMemo(() => {
    return db.topicos.filter((t) => t.concurso_id === concursoSelecionadoId);
  }, [db.topicos, concursoSelecionadoId]);

  // AUTO-FALLBACK: Se o concurso não possuir matérias, gera e salva imediatamente o edital verticalizado completo
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

  const plano = useMemo(() => {
    return (
      db.planos.find((p) => p.concurso_id === concursoSelecionadoId) || {
        id: `plano_${concursoSelecionadoId}`,
        concurso_id: concursoSelecionadoId || '',
        horas_semanais: 20,
        dias: [0, 180, 180, 180, 180, 180, 120],
        duracao_bloco: 60,
      }
    );
  }, [db.planos, concursoSelecionadoId]);

  // Questões deste Concurso
  const questoesDesteConcurso = useMemo(() => {
    return (db.questoes || []).filter((q) => q.concurso_id === concursoSelecionadoId);
  }, [db.questoes, concursoSelecionadoId]);

  const metricasQuestoesConcurso = useMemo(() => {
    const total = questoesDesteConcurso.reduce((acc, q) => acc + q.total, 0);
    const acertos = questoesDesteConcurso.reduce((acc, q) => acc + q.acertos, 0);
    const erros = questoesDesteConcurso.reduce((acc, q) => acc + q.erros, 0);
    const taxaGeral = total > 0 ? Math.round((acertos / total) * 100) : 0;
    return { total, acertos, erros, taxaGeral };
  }, [questoesDesteConcurso]);

  // Cálculo Dinâmico do Planejamento & Ciclo de Estudos
  const resultadoPlanejamento = useMemo(() => {
    return calcularPlanejamento(materias, plano, topicos);
  }, [materias, plano, topicos]);

  if (!concurso) {
    return (
      <div className="content-body" style={{ textAlign: 'center', padding: 60 }}>
        <h3>Estudo não encontrado</h3>
        <button onClick={() => setTela('meus_estudos')} className="btn btn-primary" style={{ marginTop: 14 }}>
          Voltar para Meus Estudos
        </button>
      </div>
    );
  }

  // Alterna expansão de matéria
  const toggleMateria = (id: string) => {
    setMateriasExpandidas((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Processamento do Arquivo PDF do Edital
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCarregandoPdf(true);
    setStatusPdf(`Lendo arquivo PDF "${file.name}"...`);
    try {
      const buffer = await file.arrayBuffer();
      setStatusPdf('Extraindo texto do edital...');
      const texto = await extrairTextoPdf(buffer);

      setStatusPdf('Analisando disciplinas e tópicos programáticos...');
      const detectadas = analisarConteudoEdital(texto);
      setMateriasDetectadas(detectadas);
      setStatusPdf(null);
    } catch (err) {
      alert(`Falha ao ler o PDF: ${(err as Error).message}`);
      setStatusPdf(null);
    } finally {
      setCarregandoPdf(false);
    }
  };

  // Processamento por URL de Edital (usando o proxy da API)
  const handleUrlUpload = async () => {
    if (!urlEdital) return;
    setCarregandoPdf(true);
    setStatusPdf('Baixando PDF do edital via proxy...');
    try {
      const res = await fetch(`/api/edital?url=${encodeURIComponent(urlEdital)}`);
      if (!res.ok) throw new Error('Não foi possível baixar o PDF deste link.');
      const buffer = await res.arrayBuffer();
      setStatusPdf('Extraindo texto do edital...');
      const texto = await extrairTextoPdf(buffer);
      const detectadas = analisarConteudoEdital(texto);
      setMateriasDetectadas(detectadas);
      setStatusPdf(null);
    } catch (err) {
      alert(`Erro: ${(err as Error).message}`);
      setStatusPdf(null);
    } finally {
      setCarregandoPdf(false);
    }
  };

  // Importa as matérias detectadas para o banco
  const handleConfirmarImportacao = () => {
    if (!concursoSelecionadoId) return;

    materiasDetectadas.forEach((mat) => {
      const matId = adicionarMateria(concursoSelecionadoId, {
        nome: mat.nome,
        cor: mat.cor,
        importancia: 3,
        conhecimento: 2,
      });

      mat.topicos.forEach((top) => {
        adicionarTopico(concursoSelecionadoId, matId, top);
      });
    });

    setModalPdfAberto(false);
    setMateriasDetectadas([]);
    alert(`${materiasDetectadas.length} matérias e seus tópicos foram adicionados ao seu edital verticalizado!`);
  };

  // Criação de Matéria Manual
  const handleCriarMateriaManual = () => {
    if (!novaMateriaNome.trim() || !concursoSelecionadoId) return;
    const horasFixas = novaMateriaHorasDesejadas ? Number(novaMateriaHorasDesejadas) : null;

    adicionarMateria(concursoSelecionadoId, {
      nome: novaMateriaNome.trim(),
      importancia: novaMateriaImportancia,
      conhecimento: novaMateriaConhecimento,
      horas_semanais_desejadas: horasFixas,
      cor: novaMateriaCor,
    });

    setNovaMateriaNome('');
    setNovaMateriaHorasDesejadas('');
    setModalNovaMateria(false);
  };

  // Registro de Bateria de Questões no Organizador
  const handleSalvarQuestoesManual = () => {
    if (!concursoSelecionadoId) return;
    const matId = qMateriaId || (materias[0] ? materias[0].id : null);
    if (!matId && materias.length > 0) {
      alert('Selecione uma disciplina para a bateria de questões.');
      return;
    }
    const tot = Math.max(1, Number(qTotal) || 1);
    const ac = Math.max(0, Math.min(tot, Number(qAcertos) || 0));
    const er = Math.max(0, tot - ac);
    const taxa = Math.round((ac / tot) * 100);

    adicionarRegistroQuestoes({
      concurso_id: concursoSelecionadoId,
      materia_id: matId,
      topico_id: qTopicoId || null,
      banca: qBanca || 'Geral',
      total: tot,
      acertos: ac,
      erros: er,
      taxa_acerto: taxa,
      data: qData || new Date().toISOString().slice(0, 10),
      observacao: qObs || null,
    });

    setModalQuestoesAberto(false);
    setQObs('');
  };

  // Criação de Tópico Manual
  const handleCriarTopico = (materiaId: string) => {
    if (!novoTopicoNome.trim() || !concursoSelecionadoId) return;
    adicionarTopico(concursoSelecionadoId, materiaId, novoTopicoNome.trim());
    setNovoTopicoNome('');
    setMateriaAdicionandoTopico(null);
  };

  // Iniciar Cronômetro a partir de um bloco ou tópico
  const handleIniciarEstudo = (materiaId: string, topicoId?: string) => {
    setTimerVinculo(concurso.id, materiaId, topicoId || null);
    setTela('cronometro');
  };

  // Métricas do Edital Afunilado
  const totalTopicos = topicos.length;
  const concluidosTopicos = topicos.filter((t) => t.concluido).length;
  const totalSubtopicos = topicos.reduce((acc, t) => acc + (t.subtopicos?.length || 0), 0);
  const concluidosSubtopicos = topicos.reduce((acc, t) => acc + (t.subtopicos?.filter((s) => s.concluido).length || 0), 0);

  const totalItens = totalSubtopicos > 0 ? totalSubtopicos : totalTopicos;
  const concluidosItens = totalSubtopicos > 0 ? concluidosSubtopicos : concluidosTopicos;
  const pctGeral = totalItens > 0 ? Math.round((concluidosItens / totalItens) * 100) : 0;

  return (
    <div className="content-body">
      {/* Botão Voltar & Cabeçalho do Concurso */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setTela('meus_estudos')} className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
          <ArrowLeft size={14} />
          Voltar aos Meus Estudos
        </button>
        <span className={concurso.tipo === 'faculdade' ? 'badge badge-purple' : 'badge badge-primary'}>
          {concurso.tipo === 'faculdade' ? 'Faculdade' : 'Concurso Público'}
        </span>
        {concurso.forte_expectativa && (
          <span
            className="badge"
            style={{
              background: 'rgba(245, 158, 11, 0.2)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.45)',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <Flame size={13} style={{ marginRight: 4 }} />
            FORTE EXPECTATIVA (2026/2027)
          </span>
        )}
        {concurso.status_edital === 'pre_edital' ? (
          <span
            className="badge"
            style={{
              background: 'rgba(168, 85, 247, 0.2)',
              color: '#c084fc',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              fontWeight: 700,
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
            }}
          >
            🟢 EDITAL PUBLICADO
          </span>
        )}
      </div>

      {/* Banner Principal do Concurso */}
      <div className="card" style={{ padding: 24, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: concurso.cor || 'var(--primary)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>{concurso.nome}</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {concurso.orgao ? `${concurso.orgao} • ` : ''}
              {concurso.cargo ? `${concurso.cargo} • ` : ''}
              {concurso.salario ? `${concurso.salario}` : ''}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => {
                const primeiraMat = materias[0];
                handleIniciarEstudo(primeiraMat ? primeiraMat.id : '');
              }}
              className="btn btn-primary btn-sm"
              style={{ gap: 6 }}
            >
              <Play size={15} />
              Iniciar Estudo Agora
            </button>
          </div>
        </div>

        {/* Notícia e Expectativa do Certame (quando presente) */}
        {concurso.descricao_noticia && (
          <div
            style={{
              marginTop: 14,
              padding: '10px 14px',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              color: 'var(--text-main)',
              lineHeight: 1.45,
            }}
          >
            <strong style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <FileText size={14} />
              Notícia & Expectativa do Certame:
            </strong>
            <span style={{ color: 'var(--text-muted)' }}>{concurso.descricao_noticia}</span>
          </div>
        )}

        {/* Resumo do Edital Verticalizado */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
              Progresso no Edital Verticalizado: {concluidosItens} de {totalItens} itens concluídos
              {totalSubtopicos > 0 && ` (${concluidosSubtopicos} de ${totalSubtopicos} subtópicos em ${totalTopicos} tópicos)`}
            </span>
            <strong style={{ color: 'var(--primary)' }}>{pctGeral}% concluído</strong>
          </div>
          <div style={{ width: '100%', height: 8, background: 'var(--bg-input)', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{
                width: `${pctGeral}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--primary), var(--accent-emerald))',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* NAVEGAÇÃO ENTRE ABAS */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${abaConcurso === 'organizador' ? 'active' : ''}`}
          onClick={() => setAbaConcurso('organizador')}
        >
          <Sliders size={16} />
          Organizador de Estudos (Estilo Estudei)
        </button>

        <button
          className={`tab-btn ${abaConcurso === 'edital' ? 'active' : ''}`}
          onClick={() => setAbaConcurso('edital')}
        >
          <FileText size={16} />
          Edital Verticalizado ({materias.length} matérias)
        </button>

        <button
          className={`tab-btn ${abaConcurso === 'questoes' ? 'active' : ''}`}
          onClick={() => setAbaConcurso('questoes')}
        >
          <CheckSquare size={16} />
          Caderno de Questões ({questoesDesteConcurso.length})
        </button>

        <button
          className={`tab-btn ${abaConcurso === 'planejamento' ? 'active' : ''}`}
          onClick={() => setAbaConcurso('planejamento')}
        >
          <Target size={16} />
          Rotina & Ciclo de Estudos Inteligente
        </button>

        <button
          className={`tab-btn ${abaConcurso === 'sessoes' ? 'active' : ''}`}
          onClick={() => setAbaConcurso('sessoes')}
        >
          <History size={16} />
          Histórico de Sessões
        </button>
      </div>

      {/* ======================================================== */}
      {/* ABA 0: ORGANIZADOR DE ESTUDOS (ESTILO ESTUDEI)           */}
      {/* ======================================================== */}
      {abaConcurso === 'organizador' && (
        <OrganizadorEstudosView
          concurso={concurso}
          onAbrirEditalPdf={() => setModalPdfAberto(true)}
          onAbrirNovaMateria={() => setModalNovaMateria(true)}
        />
      )}

      {/* ======================================================== */}
      {/* ABA 1: EDITAL VERTICALIZADO                               */}
      {/* ======================================================== */}
      {abaConcurso === 'edital' && (
        <div>
          {/* Barra de Ações: Importar PDF ou Adicionar Matéria */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Marque os tópicos concluídos, registre revisões (R1, R2...) e lance o cronômetro diretamente em cada conteúdo.
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setModalPdfAberto(true)}
                className="btn btn-secondary btn-sm"
                style={{ gap: 6, borderColor: 'var(--primary)', color: 'var(--primary)' }}
              >
                <Upload size={14} />
                Importar Edital em PDF
              </button>

              <button
                onClick={() => setModalNovaMateria(true)}
                className="btn btn-primary btn-sm"
                style={{ gap: 6 }}
              >
                <Plus size={15} />
                + Nova Matéria
              </button>
            </div>
          </div>

          {materias.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '50px 20px' }}>
              <FileText size={40} color="var(--primary)" style={{ margin: '0 auto 12px', opacity: 0.8 }} />
              <h3>Nenhuma matéria cadastrada neste estudo</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 450, margin: '8px auto 20px' }}>
                Você pode importar o PDF do edital para extrair o conteúdo programático automaticamente ou adicionar matérias manualmente.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={() => setModalPdfAberto(true)} className="btn btn-primary">
                  <Upload size={16} />
                  Importar Edital em PDF
                </button>
                <button onClick={() => setModalNovaMateria(true)} className="btn btn-secondary">
                  + Adicionar Manualmente
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {materias.map((m) => {
                const topicosDaMateria = topicos.filter((t) => t.materia_id === m.id);
                const concluidosMat = topicosDaMateria.filter((t) => t.concluido).length;
                const totalSubMat = topicosDaMateria.reduce((acc, t) => acc + (t.subtopicos?.length || 0), 0);
                const concluidosSubMat = topicosDaMateria.reduce((acc, t) => acc + (t.subtopicos?.filter((s) => s.concluido).length || 0), 0);
                const itensTotalMat = totalSubMat > 0 ? totalSubMat : topicosDaMateria.length;
                const itensConcluidosMat = totalSubMat > 0 ? concluidosSubMat : concluidosMat;
                const pctMat = itensTotalMat > 0 ? Math.round((itensConcluidosMat / itensTotalMat) * 100) : 0;
                const expandida = materiasExpandidas[m.id] !== false; // aberta por padrão

                return (
                  <div key={m.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Cabeçalho da Matéria (Accordion) */}
                    <div
                      style={{
                        padding: '16px 20px',
                        background: 'var(--bg-card)',
                        borderLeft: `5px solid ${m.cor}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                      onClick={() => toggleMateria(m.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {expandida ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        <div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                            {m.nome}
                            {m.horas_semanais_desejadas && (
                              <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>
                                Fixado: {m.horas_semanais_desejadas}h/sem
                              </span>
                            )}
                          </h3>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {topicosDaMateria.length} tópicos{totalSubMat > 0 ? ` • ${totalSubMat} subtópicos` : ''} ({pctMat}% concluído) • Peso {m.importancia} de 5
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleIniciarEstudo(m.id)}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '6px 12px', fontSize: '0.78rem', gap: 4 }}
                          title="Estudar esta matéria agora"
                        >
                          <Play size={13} />
                          Estudar Matéria
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Remover "${m.nome}" e todos os seus tópicos?`)) {
                              removerMateria(m.id);
                            }
                          }}
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--text-faint)', padding: '6px 8px' }}
                          title="Excluir matéria"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Barra de Progresso da Matéria */}
                    <div style={{ width: '100%', height: 3, background: 'var(--bg-input)' }}>
                      <div style={{ width: `${pctMat}%`, height: '100%', background: m.cor }} />
                    </div>

                    {/* Lista de Tópicos e Subtópicos do Edital */}
                    {expandida && (
                      <div style={{ padding: '16px 20px', background: 'var(--bg-app)' }}>
                        {topicosDaMateria.length === 0 ? (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                            Nenhum tópico adicionado nesta matéria ainda.
                          </p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                            {topicosDaMateria.map((top) => (
                              <div
                                key={top.id}
                                style={{
                                  background: 'var(--bg-card)',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid var(--border)',
                                  overflow: 'hidden',
                                }}
                              >
                                {/* Linha do Tópico Principal (Nível 2) */}
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 14px',
                                    background: top.concluido ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                                    borderBottom: top.subtopicos && top.subtopicos.length > 0 && !topicosRecolhidos[top.id] ? '1px solid var(--border)' : 'none',
                                    flexWrap: 'wrap',
                                    gap: 8,
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
                                    {top.subtopicos && top.subtopicos.length > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => toggleTopicoRecolhido(top.id)}
                                        className="btn btn-ghost btn-sm"
                                        style={{ padding: '2px 4px', color: 'var(--text-muted)' }}
                                        title={topicosRecolhidos[top.id] ? 'Expandir subtópicos' : 'Recolher subtópicos'}
                                      >
                                        {topicosRecolhidos[top.id] ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                                      </button>
                                    )}

                                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1 }}>
                                      <input
                                        type="checkbox"
                                        checked={top.concluido}
                                        onChange={() => toggleTopicoConcluido(top.id)}
                                        style={{ width: 17, height: 17, accentColor: 'var(--primary)', cursor: 'pointer' }}
                                      />
                                      <span
                                        style={{
                                          fontSize: '0.88rem',
                                          fontWeight: 700,
                                          color: top.concluido ? 'var(--text-muted)' : 'var(--text-main)',
                                          textDecoration: top.concluido ? 'line-through' : 'none',
                                        }}
                                      >
                                        {top.nome}
                                      </span>
                                    </label>

                                    {top.subtopicos && top.subtopicos.length > 0 && (
                                      <span
                                        className="badge"
                                        style={{
                                          fontSize: '0.68rem',
                                          background: top.subtopicos.every((s) => s.concluido) ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-input)',
                                          color: top.subtopicos.every((s) => s.concluido) ? '#10b981' : 'var(--text-muted)',
                                          fontWeight: 700,
                                        }}
                                      >
                                        {top.subtopicos.filter((s) => s.concluido).length}/{top.subtopicos.length} subtópicos
                                      </span>
                                    )}
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                    {/* Botão + Subtópico */}
                                    <button
                                      onClick={() => {
                                        if (topicoAdicionandoSub === top.id) {
                                          setTopicoAdicionandoSub(null);
                                        } else {
                                          setTopicoAdicionandoSub(top.id);
                                          setNovoSubtopicoNome('');
                                        }
                                      }}
                                      className="btn btn-ghost btn-sm"
                                      style={{ padding: '3px 8px', fontSize: '0.72rem', gap: 4, color: 'var(--primary)' }}
                                      title="Adicionar subtópico específico dentro deste tópico"
                                    >
                                      <Plus size={12} />
                                      Subtópico
                                    </button>

                                    {/* Botão de Revisão do Tópico */}
                                    <button
                                      onClick={() => incrementarRevisaoTopico(top.id)}
                                      className="btn btn-secondary btn-sm"
                                      style={{
                                        padding: '3px 8px',
                                        fontSize: '0.72rem',
                                        gap: 4,
                                        background: top.revisoes > 0 ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                        color: top.revisoes > 0 ? 'var(--accent-purple)' : 'var(--text-muted)',
                                      }}
                                      title="Clique para somar +1 revisão deste tópico"
                                    >
                                      <RotateCw size={11} />
                                      {top.revisoes > 0 ? `${top.revisoes}x Rev` : '+ Rev'}
                                    </button>

                                    {/* Botão Cronometrar Tópico */}
                                    <button
                                      onClick={() => handleIniciarEstudo(m.id, top.id)}
                                      className="btn btn-ghost btn-sm"
                                      style={{ padding: '4px 8px', color: 'var(--primary)' }}
                                      title="Estudar este tópico agora"
                                    >
                                      <Play size={13} />
                                    </button>

                                    <button
                                      onClick={() => removerTopico(top.id)}
                                      className="btn btn-ghost btn-sm"
                                      style={{ padding: '4px 6px', color: 'var(--text-faint)' }}
                                      title="Excluir tópico"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>

                                {/* Formulário Inline para Adicionar Subtópico */}
                                {topicoAdicionandoSub === top.id && (
                                  <div
                                    style={{
                                      padding: '8px 14px',
                                      background: 'var(--bg-input)',
                                      borderBottom: '1px solid var(--border)',
                                      display: 'flex',
                                      gap: 8,
                                    }}
                                  >
                                    <input
                                      type="text"
                                      autoFocus
                                      placeholder="Nome do subtópico (ex: 1.3 Penalidades de Servidor / PAD)..."
                                      className="input-text"
                                      value={novoSubtopicoNome}
                                      onChange={(e) => setNovoSubtopicoNome(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && novoSubtopicoNome.trim()) {
                                          adicionarSubtopico(top.id, novoSubtopicoNome.trim());
                                          setNovoSubtopicoNome('');
                                          setTopicoAdicionandoSub(null);
                                        }
                                        if (e.key === 'Escape') setTopicoAdicionandoSub(null);
                                      }}
                                      style={{ flex: 1, fontSize: '0.78rem', padding: '5px 10px' }}
                                    />
                                    <button
                                      onClick={() => {
                                        if (novoSubtopicoNome.trim()) {
                                          adicionarSubtopico(top.id, novoSubtopicoNome.trim());
                                          setNovoSubtopicoNome('');
                                          setTopicoAdicionandoSub(null);
                                        }
                                      }}
                                      className="btn btn-primary btn-sm"
                                      style={{ fontSize: '0.72rem' }}
                                    >
                                      Salvar
                                    </button>
                                    <button
                                      onClick={() => setTopicoAdicionandoSub(null)}
                                      className="btn btn-ghost btn-sm"
                                      style={{ fontSize: '0.72rem' }}
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                )}

                                {/* Lista de Subtópicos Afunilados (Nível 3) */}
                                {top.subtopicos && top.subtopicos.length > 0 && !topicosRecolhidos[top.id] && (
                                  <div
                                    style={{
                                      padding: '8px 14px 10px 18px',
                                      background: 'var(--bg-input)',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: 6,
                                      borderLeft: '3px solid var(--primary)',
                                      marginLeft: 14,
                                      marginRight: 14,
                                      marginBottom: 10,
                                      marginTop: 8,
                                      borderRadius: '0 6px 6px 0',
                                    }}
                                  >
                                    {top.subtopicos.map((sub) => (
                                      <div
                                        key={sub.id}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          padding: '5px 10px',
                                          background: 'var(--bg-card)',
                                          borderRadius: 4,
                                          border: '1px solid var(--border)',
                                          gap: 10,
                                        }}
                                      >
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 }}>
                                          <input
                                            type="checkbox"
                                            checked={sub.concluido}
                                            onChange={() => toggleSubtopicoConcluido(top.id, sub.id)}
                                            style={{ width: 15, height: 15, accentColor: 'var(--primary)', cursor: 'pointer' }}
                                          />
                                          <span
                                            style={{
                                              fontSize: '0.8rem',
                                              color: sub.concluido ? 'var(--text-muted)' : 'var(--text-main)',
                                              textDecoration: sub.concluido ? 'line-through' : 'none',
                                            }}
                                          >
                                            {sub.nome}
                                          </span>
                                        </label>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                          <button
                                            onClick={() => incrementarRevisaoSubtopico(top.id, sub.id)}
                                            className="btn btn-secondary btn-sm"
                                            style={{
                                              padding: '2px 7px',
                                              fontSize: '0.68rem',
                                              gap: 4,
                                              background: sub.revisoes > 0 ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                              color: sub.revisoes > 0 ? 'var(--accent-purple)' : 'var(--text-muted)',
                                            }}
                                            title="Somar revisão deste subtópico"
                                          >
                                            <RotateCw size={10} />
                                            {sub.revisoes > 0 ? `${sub.revisoes}x Rev` : '+ Rev'}
                                          </button>

                                          <button
                                            onClick={() => handleIniciarEstudo(m.id, top.id)}
                                            className="btn btn-ghost btn-sm"
                                            style={{ padding: '2px 6px', color: 'var(--primary)' }}
                                            title="Estudar este subtópico agora"
                                          >
                                            <Play size={12} />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Formulário Rápido de Novo Tópico */}
                        {materiaAdicionandoTopico === m.id ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              type="text"
                              autoFocus
                              placeholder="Digite o nome do tópico do edital (ex: 1. Interpretação de Texto)..."
                              className="input-text"
                              value={novoTopicoNome}
                              onChange={(e) => setNovoTopicoNome(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCriarTopico(m.id);
                                if (e.key === 'Escape') setMateriaAdicionandoTopico(null);
                              }}
                            />
                            <button onClick={() => handleCriarTopico(m.id)} className="btn btn-primary btn-sm">
                              Adicionar
                            </button>
                            <button onClick={() => setMateriaAdicionandoTopico(null)} className="btn btn-ghost btn-sm">
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setMateriaAdicionandoTopico(m.id);
                              setNovoTopicoNome('');
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.78rem', gap: 6 }}
                          >
                            <Plus size={13} />
                            Adicionar Tópico do Edital
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 2: PLANEJAMENTO, PESOS & CICLO DE ESTUDOS           */}
      {/* ======================================================== */}
      {abaConcurso === 'planejamento' && (
        <div>
          {/* PAINEL DE CONFIGURAÇÃO DE HORAS SEMANAIS DO ALUNO */}
          <div className="card" style={{ padding: 22, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Target size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                Metas do Aluno: Horas Semanais & Rotina
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {/* Horas Semanais Dispostas */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Quantas horas semanais você deseja dedicar para este estudo?
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                    style={{ flex: 1, accentColor: 'var(--primary)' }}
                  />
                  <span
                    className="timer-digits"
                    style={{
                      fontSize: '1.3rem',
                      fontWeight: 800,
                      color: 'var(--primary)',
                      minWidth: 90,
                      textAlign: 'right',
                    }}
                  >
                    {plano.horas_semanais}h/sem
                  </span>
                </div>

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

                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  Média de {(plano.horas_semanais / 6).toFixed(1)} horas por dia (Segunda a Sábado) • Até 120h semanais
                </p>
              </div>

              {/* Duração do Bloco de Estudo */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Duração recomendada de cada bloco de estudo:
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[30, 45, 50, 60, 90].map((dur) => (
                    <button
                      key={dur}
                      onClick={() => salvarPlano({ ...plano, duracao_bloco: dur })}
                      className="btn btn-sm"
                      style={{
                        flex: 1,
                        background: plano.duracao_bloco === dur ? 'var(--primary)' : 'var(--bg-input)',
                        color: plano.duracao_bloco === dur ? '#042f2e' : 'var(--text-main)',
                        fontWeight: plano.duracao_bloco === dur ? 700 : 500,
                        border: '1px solid var(--border)',
                      }}
                    >
                      {dur} min
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Gera {resultadoPlanejamento.totalBlocosCiclo} blocos de estudo no ciclo rotativo.
                </p>
              </div>
            </div>

            {/* Distribuição por Dia da Semana (Minutos por Dia) */}
            <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                Tempo disponível em cada dia da semana (horas por dia):
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                {NOMES_DIAS.map((dia, idx) => {
                  const minutosDia = plano.dias[idx] || 0;
                  const horasDia = (minutosDia / 60).toFixed(1);

                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 8px',
                        background: 'var(--bg-input)',
                        borderRadius: 'var(--radius-sm)',
                        textAlign: 'center',
                        border: minutosDia > 0 ? '1px solid rgba(20, 184, 166, 0.3)' : '1px solid var(--border)',
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block' }}>
                        {dia.curto}
                      </span>
                      <strong style={{ fontSize: '1rem', color: minutosDia > 0 ? 'var(--primary)' : 'var(--text-faint)' }}>
                        {horasDia}h
                      </strong>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 6 }}>
                        <button
                          onClick={() => {
                            const novosDias = [...plano.dias];
                            novosDias[idx] = Math.max(0, (novosDias[idx] || 0) - 30);
                            salvarPlano({ ...plano, dias: novosDias });
                          }}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                        >
                          -
                        </button>
                        <button
                          onClick={() => {
                            const novosDias = [...plano.dias];
                            novosDias[idx] = (novosDias[idx] || 0) + 30;
                            salvarPlano({ ...plano, dias: novosDias });
                          }}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* TABELA DE RELEVÂNCIA, IMPORTÂNCIA E DIFICULDADE POR MATÉRIA */}
          <div className="card" style={{ padding: 22, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                  Parâmetros de Cálculo por Matéria (Algoritmo Estudei)
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Ajuste o peso e seu conhecimento. O sistema recalcula as horas recomendadas em tempo real.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {resultadoPlanejamento.materiasCalculadas.map((mc) => {
                const m = mc.materia;
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1.5fr 1.5fr 1.5fr 1.2fr',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 18px',
                      background: 'var(--bg-input)',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: `4px solid ${m.cor}`,
                    }}
                  >
                    {/* Nome da Matéria */}
                    <div>
                      <strong style={{ fontSize: '0.95rem', display: 'block' }}>{m.nome}</strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Peso ponderado: {mc.peso} • {mc.qtdBlocos} bloco(s) no ciclo
                      </span>
                    </div>

                    {/* Importância na Prova (1 a 5 estrelas) */}
                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                        Importância / Peso: <strong>{m.importancia}★</strong>
                      </label>
                      <div style={{ display: 'flex', gap: 3 }}>
                        {[1, 2, 3, 4, 5].map((estrela) => (
                          <button
                            key={estrela}
                            onClick={() => atualizarMateria({ ...m, importancia: estrela })}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 2,
                              color: estrela <= m.importancia ? 'var(--accent-amber)' : 'var(--text-faint)',
                            }}
                            title={`Peso ${estrela}`}
                          >
                            <Star size={16} fill={estrela <= m.importancia ? 'currentColor' : 'none'} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Grau de Conhecimento do Aluno (1 a 5) */}
                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                        Domínio Atual: <strong>{m.conhecimento}/5</strong>
                      </label>
                      <div style={{ display: 'flex', gap: 3 }}>
                        {[1, 2, 3, 4, 5].map((nivel) => (
                          <button
                            key={nivel}
                            onClick={() => atualizarMateria({ ...m, conhecimento: nivel })}
                            style={{
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: nivel === m.conhecimento ? 'var(--primary)' : 'var(--bg-card)',
                              color: nivel === m.conhecimento ? '#042f2e' : 'var(--text-muted)',
                              border: '1px solid var(--border)',
                              cursor: 'pointer',
                            }}
                            title={nivel === 1 ? 'Iniciante / Nunca estudei' : nivel === 5 ? 'Avançado / Domino' : `Nível ${nivel}`}
                          >
                            {nivel}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tempo Desejado pelo Aluno (Fixar horas se quiser) */}
                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                        Fixar Horas (Opcional):
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="40"
                        placeholder="Automático"
                        className="input-text"
                        style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                        value={m.horas_semanais_desejadas !== null && m.horas_semanais_desejadas !== undefined ? m.horas_semanais_desejadas : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : Number(e.target.value);
                          atualizarMateria({ ...m, horas_semanais_desejadas: val });
                        }}
                      />
                    </div>

                    {/* Resultado Calculado */}
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Tempo Semanal</span>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>
                        {mc.horasSemanais}h
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                        {mc.percentualTempo}% do tempo
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* VISUALIZAÇÃO DO CICLO DE ESTUDOS ROTATIVO */}
          <div className="card" style={{ padding: 22, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ListOrdered size={20} color="var(--primary)" />
                  Ciclo de Estudos Rotativo (Intercalado)
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  A ordem ideal de estudo para evitar fadiga mental. O ciclo roda continuamente sem se prender a dias da semana.
                </p>
              </div>

              <span className="badge badge-primary">
                {resultadoPlanejamento.ciclo.length} blocos no ciclo ({resultadoPlanejamento.duracaoBlocoMin} min cada)
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 10,
              }}
            >
              {resultadoPlanejamento.ciclo.map((item, idx) => (
                <div
                  key={item.id}
                  className="card card-interactive"
                  style={{
                    padding: 14,
                    borderLeft: `4px solid ${item.cor}`,
                    background: 'var(--bg-input)',
                  }}
                  onClick={() => handleIniciarEstudo(item.materiaId)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      Etapa {idx + 1}
                    </span>
                    <span className="badge" style={{ background: 'var(--bg-card)', fontSize: '0.68rem' }}>
                      {item.duracaoMin} min
                    </span>
                  </div>

                  <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.materiaNome}
                  </strong>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>
                      Bloco {item.blocoAtual}/{item.totalBlocosMateria}
                    </span>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ padding: '3px 8px', fontSize: '0.7rem', gap: 4 }}
                    >
                      <Play size={10} />
                      Iniciar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* VISUALIZAÇÃO DO CRONOGRAMA SEMANAL (SEGUNDA A DOMINGO) */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ marginBottom: 14 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={18} color="var(--primary)" />
                Cronograma Semanal Alocado (Segunda a Domingo)
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Distribuição dos blocos do ciclo de acordo com o limite de horas de cada dia.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
              {[1, 2, 3, 4, 5, 6, 0].map((diaIdx) => {
                const dia = resultadoPlanejamento.cronogramaSemanal[diaIdx];
                return (
                  <div
                    key={diaIdx}
                    style={{
                      background: 'var(--bg-input)',
                      borderRadius: 'var(--radius-sm)',
                      padding: 10,
                      border: '1px solid var(--border)',
                      minHeight: 200,
                    }}
                  >
                    <div style={{ paddingBottom: 8, marginBottom: 8, borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                      <strong style={{ fontSize: '0.85rem', display: 'block' }}>{dia.nomeLongo}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {(dia.minutosAlocados / 60).toFixed(1)}h alocadas
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {dia.blocos.length === 0 ? (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)', textAlign: 'center', display: 'block', padding: '16px 0' }}>
                          Livre / Descanso
                        </span>
                      ) : (
                        dia.blocos.map((bloco) => (
                          <div
                            key={bloco.id}
                            className="card-interactive"
                            style={{
                              padding: 8,
                              borderRadius: 6,
                              background: 'var(--bg-card)',
                              borderLeft: `3px solid ${bloco.cor}`,
                              fontSize: '0.75rem',
                            }}
                            onClick={() => handleIniciarEstudo(bloco.materiaId, bloco.topicoSugerido?.id)}
                            title="Clique para iniciar este bloco no cronômetro"
                          >
                            <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {bloco.materiaNome}
                            </strong>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', display: 'block' }}>
                              {bloco.duracaoMin}m {bloco.topicoSugerido ? `• ${bloco.topicoSugerido.nome.slice(0, 16)}...` : ''}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 2: CADERNO & ORGANIZADOR DE QUESTÕES                 */}
      {/* ======================================================== */}
      {abaConcurso === 'questoes' && (
        <div>
          {/* Topo da Aba de Questões */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                Caderno de Questões & Desempenho
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Registre suas baterias de questões do QConcursos, Tec Concursos ou simulados e acompanhe seu índice de assertividade.
              </p>
            </div>

            <button
              onClick={() => {
                if (materias.length > 0 && !qMateriaId) {
                  setQMateriaId(materias[0].id);
                }
                setModalQuestoesAberto(true);
              }}
              className="btn btn-primary"
              style={{ gap: 8 }}
            >
              <Plus size={16} />
              + Registrar Bateria de Questões
            </button>
          </div>

          {/* Cards de Métricas de Questões */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Resolvido</span>
                <HelpCircle size={16} color="var(--primary)" />
              </div>
              <div className="timer-digits" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
                {metricasQuestoesConcurso.total}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: 4, display: 'block' }}>
                {questoesDesteConcurso.length} registros cadastrados
              </span>
            </div>

            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Acertos</span>
                <CheckCircle2 size={16} color="#10b981" />
              </div>
              <div className="timer-digits" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>
                {metricasQuestoesConcurso.acertos}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: 4, display: 'block' }}>
                {metricasQuestoesConcurso.taxaGeral}% de aproveitamento geral
              </span>
            </div>

            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Erros</span>
                <Trash2 size={16} color="#f43f5e" />
              </div>
              <div className="timer-digits" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f43f5e' }}>
                {metricasQuestoesConcurso.erros}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: 4, display: 'block' }}>
                Oportunidades de revisão
              </span>
            </div>

            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Diagnóstico</span>
                <Award size={16} color="var(--accent-amber)" />
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: metricasQuestoesConcurso.taxaGeral >= 80 ? '#10b981' : metricasQuestoesConcurso.taxaGeral >= 65 ? '#f59e0b' : '#f43f5e', marginTop: 4 }}>
                {metricasQuestoesConcurso.total === 0
                  ? 'Sem registros'
                  : metricasQuestoesConcurso.taxaGeral >= 80
                  ? 'Alto Desempenho'
                  : metricasQuestoesConcurso.taxaGeral >= 65
                  ? 'Regular / Bom'
                  : 'Focar em Revisão'}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: 6, display: 'block' }}>
                Meta recomendada: 80%+
              </span>
            </div>
          </div>

          {/* Lista de Registros e Resumo por Matéria */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
            {/* Tabela de Baterias */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Histórico de Baterias</h4>
                {materias.length > 0 && (
                  <select
                    className="select-box"
                    style={{ width: 'auto', padding: '4px 10px', fontSize: '0.78rem' }}
                    value={filtroMateriaQuestoes}
                    onChange={(e) => setFiltroMateriaQuestoes(e.target.value)}
                  >
                    <option value="todas">Todas as Disciplinas</option>
                    {materias.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {questoesDesteConcurso.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <HelpCircle size={36} color="var(--primary)" style={{ opacity: 0.6, margin: '0 auto 10px' }} />
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Nenhuma questão registrada ainda
                  </p>
                  <p style={{ fontSize: '0.78rem', maxWidth: 360, margin: '6px auto 14px' }}>
                    Cadastre suas resoluções de questões para ver sua taxa de acertos e saber onde precisa focar seus estudos.
                  </p>
                  <button
                    onClick={() => {
                      if (materias.length > 0 && !qMateriaId) setQMateriaId(materias[0].id);
                      setModalQuestoesAberto(true);
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    + Registrar Primeira Bateria
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {questoesDesteConcurso
                    .filter((q) => filtroMateriaQuestoes === 'todas' || q.materia_id === filtroMateriaQuestoes)
                    .sort((a, b) => b.data.localeCompare(a.data))
                    .map((q) => {
                      const mat = materias.find((m) => m.id === q.materia_id);
                      const top = topicos.find((t) => t.id === q.topico_id);
                      const corTaxa = q.taxa_acerto >= 80 ? '#10b981' : q.taxa_acerto >= 65 ? '#f59e0b' : '#f43f5e';

                      return (
                        <div
                          key={q.id}
                          style={{
                            padding: '12px 14px',
                            background: 'var(--bg-input)',
                            borderRadius: 'var(--radius-sm)',
                            borderLeft: `4px solid ${mat?.cor || 'var(--primary)'}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12,
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: '0.88rem' }}>{mat?.nome || 'Disciplina Geral'}</strong>
                              {top && (
                                <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>
                                  {top.nome}
                                </span>
                              )}
                              {q.banca && (
                                <span className="badge" style={{ fontSize: '0.68rem', background: 'var(--bg-card)' }}>
                                  {q.banca}
                                </span>
                              )}
                            </div>
                            {q.observacao && (
                              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                {q.observacao}
                              </p>
                            )}
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: 2, display: 'block' }}>
                              {new Date(q.data).toLocaleDateString('pt-BR')}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: corTaxa, display: 'block' }}>
                                {q.taxa_acerto}% ({q.acertos}/{q.total})
                              </span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                {q.erros} erro{q.erros === 1 ? '' : 's'}
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                if (confirm('Remover este registro de questões?')) {
                                  removerRegistroQuestoes(q.id);
                                }
                              }}
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--text-faint)', padding: '4px 6px' }}
                              title="Remover registro"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Aproveitamento por Matéria */}
            <div className="card" style={{ padding: 20 }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 14 }}>
                Aproveitamento por Disciplina
              </h4>
              {materias.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Nenhuma matéria cadastrada.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {materias.map((m) => {
                    const qMat = questoesDesteConcurso.filter((q) => q.materia_id === m.id);
                    const totMat = qMat.reduce((acc, q) => acc + q.total, 0);
                    const acMat = qMat.reduce((acc, q) => acc + q.acertos, 0);
                    const pctMat = totMat > 0 ? Math.round((acMat / totMat) * 100) : 0;
                    const corPct = pctMat >= 80 ? '#10b981' : pctMat >= 65 ? '#f59e0b' : '#f43f5e';

                    return (
                      <div key={m.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{m.nome}</span>
                          <span style={{ fontWeight: 700, color: totMat > 0 ? corPct : 'var(--text-muted)' }}>
                            {totMat > 0 ? `${pctMat}% (${acMat}/${totMat})` : 'Sem questões'}
                          </span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: 'var(--bg-input)', borderRadius: 3, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${pctMat}%`,
                              height: '100%',
                              background: totMat > 0 ? m.cor : 'transparent',
                              borderRadius: 3,
                              transition: 'width 0.3s ease',
                            }}
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
      )}

      {/* ======================================================== */}
      {/* ABA 3: HISTÓRICO DE SESSÕES                              */}
      {/* ======================================================== */}
      {abaConcurso === 'sessoes' && (
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: 16 }}>Histórico de Estudos Registrados</h3>
          {db.sessoes.filter((s) => s.concurso_id === concurso.id).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Nenhuma sessão de estudo registrada ainda para este concurso. Inicie o cronômetro para começar!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {db.sessoes
                .filter((s) => s.concurso_id === concurso.id)
                .sort((a, b) => b.inicio.localeCompare(a.inicio))
                .map((sessao) => {
                  const mat = db.materias.find((m) => m.id === sessao.materia_id);
                  const top = db.topicos.find((t) => t.id === sessao.topico_id);
                  const min = Math.round(sessao.duracao_seg / 60);

                  return (
                    <div
                      key={sessao.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        background: 'var(--bg-input)',
                        borderRadius: 'var(--radius-sm)',
                        borderLeft: `4px solid ${mat?.cor || 'var(--primary)'}`,
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong>{mat?.nome || 'Matéria Geral'}</strong>
                          {top && <span className="badge badge-purple">{top.nome}</span>}
                          <span className="badge" style={{ fontSize: '0.7rem' }}>{sessao.modo}</span>
                        </div>
                        {sessao.notas && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            {sessao.notas}
                          </p>
                        )}
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>
                          {new Date(sessao.inicio).toLocaleString('pt-BR')}
                        </span>
                      </div>

                      <strong style={{ fontSize: '1.1rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                        {min} min
                      </strong>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: IMPORTAR EDITAL EM PDF                            */}
      {/* ======================================================== */}
      {modalPdfAberto && (
        <div className="modal-overlay" onClick={() => setModalPdfAberto(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 750 }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Upload size={22} color="var(--primary)" />
              Importar Edital em PDF & Extrair Conteúdo
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
              Carregue o arquivo PDF do edital ou informe o link. Nosso extrator inteligente identifica matérias comuns de concurso (Português, RLM, Direitos, Contabilidade...) e separa os tópicos automaticamente.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginBottom: 20 }}>
              {/* Opção 1: Upload de Arquivo do Computador */}
              <div
                style={{
                  border: '2px dashed var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 24,
                  textAlign: 'center',
                  background: 'var(--bg-input)',
                }}
              >
                <Upload size={32} color="var(--primary)" style={{ margin: '0 auto 10px', opacity: 0.8 }} />
                <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: 4 }}>
                  Escolher arquivo PDF do edital
                </strong>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                  Processado localmente no seu navegador (rápido e seguro)
                </p>
                <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
                  Selecionar PDF
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              {/* Opção 2: Link Direto do PDF */}
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 20,
                  background: 'var(--bg-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <strong style={{ fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>
                  Ou informe o link direto do PDF:
                </strong>
                <input
                  type="url"
                  placeholder="https://.../edital.pdf"
                  className="input-text"
                  style={{ marginBottom: 10, fontSize: '0.8rem' }}
                  value={urlEdital}
                  onChange={(e) => setUrlEdital(e.target.value)}
                />
                <button
                  onClick={handleUrlUpload}
                  disabled={carregandoPdf || !urlEdital}
                  className="btn btn-secondary btn-sm"
                >
                  Baixar e Extrair do Link
                </button>
              </div>
            </div>

            {/* Status do processamento */}
            {statusPdf && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <span className="dot-pulse" style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }} />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>{statusPdf}</p>
              </div>
            )}

            {/* Pré-visualização das matérias detectadas */}
            {materiasDetectadas.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 10, color: 'var(--primary)' }}>
                  ✓ {materiasDetectadas.length} Matérias Encontradas no Conteúdo Programático:
                </h4>
                <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 6 }}>
                  {materiasDetectadas.map((mat, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 14px',
                        background: 'var(--bg-input)',
                        borderRadius: 'var(--radius-sm)',
                        borderLeft: `4px solid ${mat.cor}`,
                      }}
                    >
                      <strong style={{ fontSize: '0.9rem', display: 'block' }}>{mat.nome}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {mat.topicos.length} tópicos: {mat.topicos.slice(0, 3).join(', ')}...
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setModalPdfAberto(false)} className="btn btn-ghost">
                Cancelar
              </button>
              {materiasDetectadas.length > 0 && (
                <button onClick={handleConfirmarImportacao} className="btn btn-primary">
                  Confirmar e Adicionar {materiasDetectadas.length} Matérias ao Edital
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: NOVA MATÉRIA MANUAL                               */}
      {/* ======================================================== */}
      {modalNovaMateria && (
        <div className="modal-overlay" onClick={() => setModalNovaMateria(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: 14 }}>+ Adicionar Matéria ao Estudo</h2>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Nome da Matéria / Disciplina
              </label>
              <input
                type="text"
                placeholder="Ex.: Direito Constitucional, Cálculo I, Farmacologia..."
                className="input-text"
                value={novaMateriaNome}
                onChange={(e) => setNovaMateriaNome(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Nível de Importância na Prova (1 a 5)
                </label>
                <select
                  className="select-box"
                  value={novaMateriaImportancia}
                  onChange={(e) => setNovaMateriaImportancia(Number(e.target.value))}
                >
                  <option value={5}>5 estrelas (Altíssima / Muito peso)</option>
                  <option value={4}>4 estrelas (Alta relevância)</option>
                  <option value={3}>3 estrelas (Média relevância)</option>
                  <option value={2}>2 estrelas (Pouco peso)</option>
                  <option value={1}>1 estrela (Baixíssima relevância)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Seu Conhecimento Atual (1 a 5)
                </label>
                <select
                  className="select-box"
                  value={novaMateriaConhecimento}
                  onChange={(e) => setNovaMateriaConhecimento(Number(e.target.value))}
                >
                  <option value={1}>1 - Nunca estudei (Iniciante total)</option>
                  <option value={2}>2 - Conhecimento básico</option>
                  <option value={3}>3 - Conhecimento intermediário</option>
                  <option value={4}>4 - Bom domínio</option>
                  <option value={5}>5 - Domino a matéria (Apenas revisão)</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Horas Semanais Específicas Desejadas (Opcional)
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="Deixe em branco para o algoritmo calcular automaticamente"
                className="input-text"
                value={novaMateriaHorasDesejadas}
                onChange={(e) => setNovaMateriaHorasDesejadas(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Cor de Identificação
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['#14b8a6', '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#3b82f6', '#ef4444'].map((cor) => (
                  <button
                    key={cor}
                    onClick={() => setNovaMateriaCor(cor)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: cor,
                      border: novaMateriaCor === cor ? '3px solid #fff' : 'none',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setModalNovaMateria(false)} className="btn btn-ghost">
                Cancelar
              </button>
              <button onClick={handleCriarMateriaManual} className="btn btn-primary">
                Salvar Matéria
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REGISTRAR BATERIA DE QUESTÕES                     */}
      {/* ======================================================== */}
      {modalQuestoesAberto && (
        <div className="modal-overlay" onClick={() => setModalQuestoesAberto(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckSquare size={20} color="var(--primary)" />
                Registrar Bateria de Questões
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 18 }}>
              Insira o resultado das questões resolvidas para calcular seu aproveitamento e histórico de acertos.
            </p>

            {/* Disciplina e Tópico */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Disciplina *
                </label>
                <select
                  className="select-box"
                  value={qMateriaId || (materias[0] ? materias[0].id : '')}
                  onChange={(e) => {
                    setQMateriaId(e.target.value);
                    setQTopicoId('');
                  }}
                >
                  {materias.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Banca Examinadora
                </label>
                <select
                  className="select-box"
                  value={qBanca}
                  onChange={(e) => setQBanca(e.target.value)}
                >
                  <option value="FGV">FGV</option>
                  <option value="Cebraspe">Cebraspe / CESPE</option>
                  <option value="FCC">FCC</option>
                  <option value="Vunesp">Vunesp</option>
                  <option value="Cesgranrio">Cesgranrio</option>
                  <option value="AOCP">Instituto AOCP</option>
                  <option value="IBFC">IBFC</option>
                  <option value="Geral">Outra / Geral</option>
                </select>
              </div>
            </div>

            {/* Tópico opcional */}
            {topicos.filter((t) => t.materia_id === (qMateriaId || materias[0]?.id)).length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Tópico do Edital (Opcional)
                </label>
                <select
                  className="select-box"
                  value={qTopicoId}
                  onChange={(e) => setQTopicoId(e.target.value)}
                >
                  <option value="">Nenhum tópico específico / Geral da matéria</option>
                  {topicos
                    .filter((t) => t.materia_id === (qMateriaId || materias[0]?.id))
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Volume de Questões: Total, Acertos, Erros */}
            <div
              style={{
                background: 'var(--bg-input)',
                padding: '14px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Total Questões
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input-text"
                    value={qTotal}
                    onChange={(e) => {
                      const tot = Math.max(1, Number(e.target.value));
                      setQTotal(tot);
                      if (qAcertos > tot) setQAcertos(tot);
                      setQErros(Math.max(0, tot - qAcertos));
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Acertos
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={qTotal}
                    className="input-text"
                    style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}
                    value={qAcertos}
                    onChange={(e) => {
                      const ac = Math.max(0, Math.min(qTotal, Number(e.target.value)));
                      setQAcertos(ac);
                      setQErros(Math.max(0, qTotal - ac));
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#f43f5e', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Erros
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={qTotal}
                    className="input-text"
                    style={{ borderColor: 'rgba(244, 63, 94, 0.4)' }}
                    value={qErros}
                    onChange={(e) => {
                      const er = Math.max(0, Math.min(qTotal, Number(e.target.value)));
                      setQErros(er);
                      setQAcertos(Math.max(0, qTotal - er));
                    }}
                  />
                </div>
              </div>

              {/* Botões Rápidos de Quantidade */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Atalhos:</span>
                {[5, 10, 15, 20, 30, 50].map((qtd) => (
                  <button
                    key={qtd}
                    type="button"
                    onClick={() => {
                      setQTotal(qtd);
                      const ac = Math.round(qtd * 0.8);
                      setQAcertos(ac);
                      setQErros(qtd - ac);
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '2px 8px', fontSize: '0.72rem', background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  >
                    {qtd}q
                  </button>
                ))}
              </div>

              {/* Aproveitamento em Tempo Real */}
              <div
                style={{
                  marginTop: 12,
                  paddingTop: 10,
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Aproveitamento Calculado:</span>
                <span
                  className="badge"
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    padding: '4px 10px',
                    background:
                      qTotal > 0 && Math.round((qAcertos / qTotal) * 100) >= 80
                        ? 'rgba(16, 185, 129, 0.15)'
                        : qTotal > 0 && Math.round((qAcertos / qTotal) * 100) >= 65
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(244, 63, 94, 0.15)',
                    color:
                      qTotal > 0 && Math.round((qAcertos / qTotal) * 100) >= 80
                        ? '#10b981'
                        : qTotal > 0 && Math.round((qAcertos / qTotal) * 100) >= 65
                        ? '#f59e0b'
                        : '#f43f5e',
                  }}
                >
                  {qTotal > 0 ? Math.round((qAcertos / qTotal) * 100) : 0}% de acertos
                </span>
              </div>
            </div>

            {/* Data e Observações */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Data da Resolução
              </label>
              <input
                type="date"
                className="input-text"
                value={qData}
                onChange={(e) => setQData(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Anotações / Dificuldades Encontradas (Opcional)
              </label>
              <textarea
                className="textarea-box"
                rows={2}
                placeholder="Ex.: Bateria de fixação no QConcursos. Revisar jurisprudência do STF sobre súmula vinculante..."
                value={qObs}
                onChange={(e) => setQObs(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setModalQuestoesAberto(false)} className="btn btn-ghost">
                Cancelar
              </button>
              <button onClick={handleSalvarQuestoesManual} className="btn btn-primary" style={{ gap: 6 }}>
                <CheckCircle2 size={16} />
                Salvar Registro de Questões
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
