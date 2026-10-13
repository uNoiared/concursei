// Modal de Configurações, Nuvem Supabase e Backup JSON
import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import {
  Cloud,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Database,
  ExternalLink,
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  getSupabase,
} from '../lib/supabaseClient.ts';
import {
  exportarBackupJSON,
  importarBackupJSON,
  getInitialSeed,
  saveLocalDB,
  syncWithSupabase,
} from '../lib/storage.ts';

interface ConfigModalProps {
  aberto: boolean;
  onClose: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ aberto, onClose }) => {
  const { recarregarDb } = useAppStore();

  const [url, setUrl] = useState(() => getSupabaseConfig().url);
  const [anonKey, setAnonKey] = useState(() => getSupabaseConfig().anonKey);
  const [statusMsg, setStatusMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [sincronizando, setSincronizando] = useState(false);

  if (!aberto) return null;

  const handleSalvarSupabase = async () => {
    saveSupabaseConfig({ url: url.trim(), anonKey: anonKey.trim() });
    if (!url.trim() && !anonKey.trim()) {
      setStatusMsg({ tipo: 'ok', texto: 'Configuração de nuvem desativada. Operando 100% em modo local.' });
      return;
    }

    const sb = getSupabase();
    if (!sb) {
      setStatusMsg({ tipo: 'erro', texto: 'URL ou chave anônima inválida.' });
      return;
    }

    setStatusMsg({ tipo: 'ok', texto: 'Chaves do Supabase salvas com sucesso!' });
  };

  const handleSincronizarNuvem = async () => {
    setSincronizando(true);
    setStatusMsg(null);
    const res = await syncWithSupabase();
    setSincronizando(false);
    setStatusMsg({
      tipo: res.success ? 'ok' : 'erro',
      texto: res.message,
    });
    if (res.success) recarregarDb();
  };

  const handleDownloadBackup = () => {
    const json = exportarBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `concursei_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(href);
  };

  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && importarBackupJSON(content)) {
        recarregarDb();
        setStatusMsg({ tipo: 'ok', texto: 'Backup restaurado com sucesso!' });
      } else {
        setStatusMsg({ tipo: 'erro', texto: 'Arquivo de backup inválido.' });
      }
    };
    reader.readAsText(file);
  };

  const handleResetarDemonstracao = () => {
    if (confirm('Deseja recarregar os dados de exemplo (demonstração)? Seus dados atuais serão substituídos pelo modelo inicial.')) {
      saveLocalDB(getInitialSeed());
      recarregarDb();
      setStatusMsg({ tipo: 'ok', texto: 'Dados de demonstração recarregados!' });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
        <h2 style={{ fontSize: '1.35rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Database size={22} color="var(--primary)" />
          Sincronização & Armazenamento de Dados
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 20 }}>
          O Concursei salva tudo no seu navegador sem precisar de login. Para sincronizar entre computador e celular, conecte com seu projeto Supabase.
        </p>

        {statusMsg && (
          <div
            className={`badge ${statusMsg.tipo === 'ok' ? 'badge-emerald' : 'badge-rose'}`}
            style={{ width: '100%', padding: '10px 14px', fontSize: '0.85rem', marginBottom: 16, justifyContent: 'center' }}
          >
            {statusMsg.tipo === 'ok' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {statusMsg.texto}
          </div>
        )}

        {/* SEÇÃO SUPABASE */}
        <div className="card" style={{ padding: 18, marginBottom: 20, background: 'var(--bg-input)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <strong style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)' }}>
              <Cloud size={18} />
              Sincronização em Nuvem (Supabase)
            </strong>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.72rem', gap: 4 }}
            >
              Criar Projeto Grátis
              <ExternalLink size={12} />
            </a>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Supabase Project URL
            </label>
            <input
              type="text"
              placeholder="https://seu-projeto.supabase.co"
              className="input-text"
              style={{ fontSize: '0.82rem' }}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Supabase Anon Key
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="input-text"
              style={{ fontSize: '0.82rem' }}
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSalvarSupabase} className="btn btn-primary btn-sm">
              Salvar Chaves
            </button>
            <button
              onClick={handleSincronizarNuvem}
              disabled={sincronizando}
              className="btn btn-secondary btn-sm"
            >
              {sincronizando ? 'Sincronizando...' : 'Sincronizar Agora'}
            </button>
          </div>
        </div>

        {/* SEÇÃO BACKUP ARQUIVO JSON */}
        <div className="card" style={{ padding: 18, marginBottom: 20 }}>
          <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: 4 }}>
            Backup Completo em Arquivo (JSON)
          </strong>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14 }}>
            Baixe seus editais, matérias, cronogramas e sessões de estudo em um arquivo seguro no seu computador.
          </p>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleDownloadBackup} className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
              <Download size={14} />
              Exportar Backup JSON
            </button>

            <label className="btn btn-secondary btn-sm" style={{ gap: 6, cursor: 'pointer' }}>
              <Upload size={14} />
              Restaurar Backup JSON
              <input
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={handleUploadBackup}
              />
            </label>
          </div>
        </div>

        {/* SEÇÃO RESET DEMONSTRAÇÃO */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleResetarDemonstracao}
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--text-faint)', gap: 6 }}
          >
            <RotateCcw size={13} />
            Recarregar Dados de Exemplo
          </button>

          <button onClick={onClose} className="btn btn-primary btn-sm">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
