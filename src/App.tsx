// Aplicação Principal Concursei
import React, { useState, useEffect } from 'react';
import { useAppStore } from './store/useAppStore.ts';
import { Sidebar } from './components/Sidebar.tsx';
import { TopBar } from './components/TopBar.tsx';
import { ConcursosAbertosView } from './components/ConcursosAbertosView.tsx';
import { MeusEstudosView } from './components/MeusEstudosView.tsx';
import { ConcursoDetalheView } from './components/ConcursoDetalheView.tsx';
import { TimerView } from './components/TimerView.tsx';
import { EstatisticasView } from './components/EstatisticasView.tsx';
import { NovoConcursoModal } from './components/NovoConcursoModal.tsx';
import { ConfigModal } from './components/ConfigModal.tsx';
import { ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const { tela, tema, carregarConcursosAbertos, concursosAbertos, timer, tickTimer, db } = useAppStore();

  const [modalNovoConcurso, setModalNovoConcurso] = useState(false);
  const [modalConfig, setModalConfig] = useState(false);

  // Batimento cardíaco do cronômetro: NUNCA é interrompido ao trocar de tela no app
  useEffect(() => {
    if (!timer.isRunning) return;
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [timer.isRunning, tickTimer]);

  // Aplica o tema 'dark' ou 'light' no elemento HTML raiz
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
  }, [tema]);

  // Carrega concursos abertos na inicialização se ainda não carregados
  useEffect(() => {
    if (concursosAbertos.length === 0) {
      carregarConcursosAbertos().catch(() => {});
    }
  }, [carregarConcursosAbertos, concursosAbertos.length]);

  const materiaAtiva = db.materias.find((m) => m.id === timer.materiaId);
  const concursoAtivo = db.concursos.find((c) => c.id === timer.concursoId);

  return (
    <div className="app-container">
      {/* Barra Lateral Zen */}
      <Sidebar
        onOpenConfig={() => setModalConfig(true)}
        onNovoConcurso={() => setModalNovoConcurso(true)}
      />

      {/* Área Principal de Conteúdo */}
      <div className="main-content">
        <TopBar
          onNovoConcurso={() => setModalNovoConcurso(true)}
          onOpenConfig={() => setModalConfig(true)}
        />

        <main style={{ flex: 1, paddingBottom: 50 }}>
          {tela === 'concursos_abertos' && <ConcursosAbertosView />}
          {tela === 'meus_estudos' && (
            <MeusEstudosView onNovoConcurso={() => setModalNovoConcurso(true)} />
          )}
          {tela === 'concurso_detalhe' && <ConcursoDetalheView />}
          {tela === 'cronometro' && <TimerView />}
          {tela === 'estatisticas' && <EstatisticasView />}
        </main>

        {/* Studio Bottom Status Bar (Inspirada no Forma 3D Assistant) */}
        <footer className="studio-footer-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center' }}>
              <ShieldCheck size={13} style={{ marginRight: 4 }} />
              =..
            </span>
            <span>Ambiente de estudo sereno • Dados locais protegidos e sincronizados</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {timer.isRunning ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--primary)' }}>
                <span className="dot-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }} />
                <span>Em foco: {materiaAtiva ? materiaAtiva.nome : concursoAtivo ? concursoAtivo.nome : 'Estudo Geral'}</span>
              </span>
            ) : (
              <span style={{ color: 'var(--text-faint)' }}>
                ● Modo Tranquilidade • Mente relaxada
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ opacity: 0.85 }}>Concursei</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Foco & Disciplina</span>
          </div>
        </footer>
      </div>

      {/* Modais Globais */}
      <NovoConcursoModal
        aberto={modalNovoConcurso}
        onClose={() => setModalNovoConcurso(false)}
      />

      <ConfigModal
        aberto={modalConfig}
        onClose={() => setModalConfig(false)}
      />
    </div>
  );
};

export default App;
