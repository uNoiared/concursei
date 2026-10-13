// Modal para criação manual de novo Concurso ou Disciplinas de Faculdade
import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import { GraduationCap, Building2, Sparkles } from 'lucide-react';
import { Tipo } from '../lib/types.ts';

interface NovoConcursoModalProps {
  aberto: boolean;
  onClose: () => void;
}

export const NovoConcursoModal: React.FC<NovoConcursoModalProps> = ({ aberto, onClose }) => {
  const { criarConcurso, setConcursoSelecionadoId, setTela } = useAppStore();

  const [tipo, setTipo] = useState<Tipo>('concurso');
  const [nome, setNome] = useState('');
  const [orgao, setOrgao] = useState('');
  const [cargo, setCargo] = useState('');
  const [banca, setBanca] = useState('');
  const [uf, setUf] = useState('Nacional');
  const [dataProva, setDataProva] = useState('');
  const [cor, setCor] = useState('#14b8a6');

  if (!aberto) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    const novoId = criarConcurso({
      tipo,
      nome: nome.trim(),
      orgao: orgao.trim() || (tipo === 'faculdade' ? 'Universidade' : null),
      cargo: cargo.trim() || null,
      banca: banca.trim() || null,
      uf,
      data_prova: dataProva || null,
      cor,
    });

    setConcursoSelecionadoId(novoId);
    setTela('concurso_detalhe');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <h2 style={{ fontSize: '1.35rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={22} color="var(--primary)" />
          Cadastrar Novo Estudo
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 20 }}>
          Defina se este estudo é para um concurso público específico ou para disciplinas de faculdade/graduação.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Seletor de Tipo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
            <button
              type="button"
              onClick={() => setTipo('concurso')}
              className="card card-interactive"
              style={{
                padding: '12px 14px',
                textAlign: 'left',
                border: tipo === 'concurso' ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: tipo === 'concurso' ? 'var(--primary-light)' : 'var(--bg-input)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: tipo === 'concurso' ? 'var(--primary)' : 'inherit', fontWeight: 700 }}>
                <Building2 size={18} />
                <span>Concurso Público</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Editais, cargos, bancas e provas
              </p>
            </button>

            <button
              type="button"
              onClick={() => setTipo('faculdade')}
              className="card card-interactive"
              style={{
                padding: '12px 14px',
                textAlign: 'left',
                border: tipo === 'faculdade' ? '2px solid var(--accent-purple)' : '1px solid var(--border)',
                background: tipo === 'faculdade' ? 'rgba(139, 92, 246, 0.15)' : 'var(--bg-input)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: tipo === 'faculdade' ? 'var(--accent-purple)' : 'inherit', fontWeight: 700 }}>
                <GraduationCap size={18} />
                <span>Faculdade / Curso</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Semestres, provas acadêmicas e TCC
              </p>
            </button>
          </div>

          {/* Nome */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              {tipo === 'concurso' ? 'Nome do Concurso / Órgão' : 'Nome do Curso / Semestre'} *
            </label>
            <input
              type="text"
              required
              placeholder={tipo === 'concurso' ? 'Ex.: PF — Agente da Polícia Federal' : 'Ex.: Engenharia de Software — 5º Semestre'}
              className="input-text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            {/* Órgão ou Universidade */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                {tipo === 'concurso' ? 'Órgão / Instituição' : 'Universidade / Faculdade'}
              </label>
              <input
                type="text"
                placeholder={tipo === 'concurso' ? 'Ex.: Polícia Federal, TRF, INSS' : 'Ex.: USP, PUC, Estácio'}
                className="input-text"
                value={orgao}
                onChange={(e) => setOrgao(e.target.value)}
              />
            </div>

            {/* Cargo ou Semestre */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                {tipo === 'concurso' ? 'Cargo Pretendido' : 'Curso / Período'}
              </label>
              <input
                type="text"
                placeholder={tipo === 'concurso' ? 'Ex.: Analista Judiciário' : 'Ex.: Bacharelado'}
                className="input-text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            {/* Banca (se concurso) */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Banca Examinadora
              </label>
              <input
                type="text"
                placeholder="Ex.: Cebraspe, FGV, FCC"
                className="input-text"
                value={banca}
                onChange={(e) => setBanca(e.target.value)}
              />
            </div>

            {/* UF */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Estado (UF)
              </label>
              <select className="select-box" value={uf} onChange={(e) => setUf(e.target.value)}>
                <option value="Nacional">Nacional (Brasil)</option>
                {['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'DF', 'BA', 'PE', 'CE', 'GO', 'ES', 'MT', 'MS'].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* Data da Prova */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Data da Prova
              </label>
              <input
                type="date"
                className="input-text"
                value={dataProva}
                onChange={(e) => setDataProva(e.target.value)}
              />
            </div>
          </div>

          {/* Cor */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Cor do Estudo
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['#14b8a6', '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#3b82f6'].map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCor(c)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: c,
                    border: cor === c ? '3px solid #fff' : 'none',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Criar Estudo & Abrir Edital
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
