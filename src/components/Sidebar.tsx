// Barra lateral de navegação com resumo rápido de estudos
import React from 'react';
import { useAppStore, Tela } from '../store/useAppStore.ts';
import {
  Timer,
  Compass,
  BookOpen,
  BarChart3,
  Moon,
  Sun,
  GraduationCap,
  Plus,
} from 'lucide-react';

interface SidebarProps {
  onOpenConfig: () => void;
  onNovoConcurso: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenConfig, onNovoConcurso }) => {
  const {
    tela,
    setTela,
    tema,
    toggleTema,
    concursosAbertos,
    db,
    timer,
  } = useAppStore();

  const navItems: { id: Tela; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    {
      id: 'concursos_abertos',
      label: 'Concursos Abertos',
      icon: <Compass size={19} />,
      badge: concursosAbertos.length > 0 ? concursosAbertos.length : undefined,
    },
    {
      id: 'meus_estudos',
      label: 'Meus Estudos',
      icon: <BookOpen size={19} />,
      badge: db.concursos.length,
    },
    {
      id: 'cronometro',
      label: 'Cronômetro',
      icon: <Timer size={19} />,
      badge: timer.isRunning ? 'Ativo' : undefined,
    },
    {
      id: 'estatisticas',
      label: 'Desempenho',
      icon: <BarChart3 size={19} />,
    },
  ];

  // Calcula horas estudadas hoje
  const hojeStr = new Date().toISOString().slice(0, 10);
  const segundosHoje = db.sessoes
    .filter((s) => s.inicio.startsWith(hojeStr))
    .reduce((acc, s) => acc + s.duracao_seg, 0);
  const horasHoje = Math.floor(segundosHoje / 3600);
  const minHoje = Math.floor((segundosHoje % 3600) / 60);

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '0 8px' }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #68bb7a, #357f49)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#08170c',
            boxShadow: '0 4px 14px rgba(104, 187, 122, 0.25)',
          }}
        >
          <GraduationCap size={22} strokeWidth={2.5} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
            Concursei
            <span
              className="hotto-tag"
              style={{
                fontSize: '0.62rem',
                padding: '2px 8px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                border: '1px solid var(--border)',
              }}
            >
              PRO
            </span>
          </h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>Concursos & Faculdade</p>
        </div>
      </div>

      {/* Status Pill do Aluno */}
      <div
        style={{
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-input)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
          fontSize: '0.72rem',
        }}
      >
        <span
          className={timer.isRunning ? 'dot-pulse' : ''}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: timer.isRunning ? 'var(--primary)' : 'var(--accent-emerald)',
          }}
        />
        <span style={{ color: 'var(--text-muted)' }}>
          {timer.isRunning ? 'Estudo em andamento' : 'Pronto para estudar'}
        </span>
      </div>

      {/* Botão Ação Rápida */}
      <button
        className="btn btn-primary"
        style={{ width: '100%', marginBottom: 18, gap: 8, borderRadius: 'var(--radius-full)' }}
        onClick={onNovoConcurso}
      >
        <Plus size={16} />
        + Novo Estudo
      </button>

      {/* Menu Principal */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {navItems.map((item) => {
          const ativo = tela === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTela(item.id)}
              className="btn"
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                padding: '12px 14px',
                background: ativo ? 'var(--primary-light)' : 'transparent',
                color: ativo ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: ativo ? 700 : 500,
                border: 'none',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {item.icon}
              <span style={{ flex: 1, textAlign: 'left', marginLeft: 8 }}>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className="badge"
                  style={{
                    background: item.badge === 'Ativo' ? 'var(--primary)' : 'var(--bg-input)',
                    color: item.badge === 'Ativo' ? 'var(--primary-text)' : 'var(--text-muted)',
                    fontSize: '0.7rem',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Card Resumo do Dia */}
      <div
        className="card"
        style={{
          padding: 14,
          marginBottom: 16,
          background: 'rgba(104, 187, 122, 0.06)',
          borderColor: 'rgba(104, 187, 122, 0.22)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Estudo Hoje</span>
          {timer.isRunning && <span className="dot-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />}
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
          {horasHoje}h {minHoje}m
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: 2 }}>
          {db.sessoes.filter((s) => s.inicio.startsWith(hojeStr)).length} sessões concluídas
        </p>
      </div>

      {/* Rodapé: Tema & Configurações */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
        <button
          onClick={toggleTema}
          className="btn btn-secondary btn-sm"
          style={{ flex: 1, gap: 6 }}
          title="Alternar Modo Escuro / Claro"
        >
          {tema === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          <span>{tema === 'dark' ? 'Claro' : 'Escuro'}</span>
        </button>

        <button
          onClick={onOpenConfig}
          className="btn btn-secondary btn-sm"
          style={{ padding: '8px 12px' }}
          title="Nuvem, Supabase e Backup"
        >
          ⚙️
        </button>
      </div>
    </aside>
  );
};
