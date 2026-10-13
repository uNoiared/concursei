# Concursei — Planejamento Inteligente de Estudos & Concursos

O **Concursei** é uma plataforma moderna e completa para estudantes de **concursos públicos** e de **faculdade**, inspirada nas melhores práticas das referências nacionais [Estudei](https://app.estudei.com.br) e [Aprovado](https://aprovadoapp.com).

---

## 🚀 Como Executar o Programa

O programa já está compilado e com o servidor pronto.

### Executar em Produção (Frontend + API em uma única porta):
```powershell
# Na pasta do projeto:
npm start
```
Abra o navegador em: **`http://localhost:3001`**

### Modo Desenvolvimento (Hot-reload Vite + Node watch):
```powershell
npm run dev
# Vite em http://localhost:5173 (com proxy automático para a API na porta 3001)
```

---

## 🌟 Principais Recursos Implementados

### 1. ⏱️ Cronômetro Multimodal de Estudos
- **4 Modos Completos:**
  1. **Cronômetro Livre (Stopwatch):** Contagem progressiva contínua de horas líquidas.
  2. **Temporizador Regressivo (Countdown):** Tempo ajustável pelo aluno com presets rápidos (25, 30, 45, 50, 60, 90, 120 min) e alarmes sonoros com Web Audio API.
  3. **Pomodoro Integrado:** Foco (25 min padrão) e pausas (5/10/15 min) com contagem visual de ciclos completados.
  4. **Lançamento Manual:** Para registrar estudos feitos offline, na biblioteca ou em livros físicos com data, hora e duração.
- **Floating Mini-Dock (Inspirado no Estudei):** Pílula minimizada no topo da tela com display de tempo e botões de play/pause, permitindo navegar pelo edital verticalizado ou concursos abertos sem perder a contagem de vista.
- **Ticker Dinâmico na Aba do Navegador (Inspirado no Aprovado):** O título da aba (`document.title`) se atualiza a cada segundo (`⏱️ 24:12 (Direito Constitucional) — Concursei`).
- **Modal de Pós-Sessão:** Registro de anotações, tipo de estudo (Teoria, Questões, Revisão, Lei Seca), contagem de questões (acertos e erros com cálculo automático de taxa de acerto %) e incremento de revisões espaçadas (+1 R).

### 2. 🏛️ Busca & Separação de Concursos Públicos Abertos
- **Fonte Pública em Tempo Real:** Conectado à lista de concursos com inscrições abertas em todo o Brasil (mais de 470 oportunidades ativas).
- **Filtros Avançados:**
  - Por Estado (UF): botões rápidos com contadores para SP, RJ, MG, DF, PR, SC, RS, etc., e Nacional.
  - Por Região: Sudeste, Sul, Nordeste, Centro-Oeste, Norte.
  - Por Nível de Escolaridade: Superior, Médio, Técnico, Fundamental.
  - Por Faixa Salarial e Ordenação (Urgência de Inscrição, Maior Salário, Mais Vagas).
- **Cartões Informativos:** Exibem órgão, cargos, vagas, remuneração em destaque e badge de urgência do prazo de inscrição com contagem regressiva (ex.: *"Faltam 3 dias"*).
- **Adicionar com 1 Clique:** Cria o concurso imediatamente no perfil do estudante com plano de estudos inicial.

### 3. 📄 Edital Verticalizado & Importação de PDF
- **Extrator Inteligente no Navegador (`pdfjs-dist`):** Permite fazer upload do arquivo PDF do edital ou colar a URL direta. O parser analisa o texto, detecta disciplinas comuns de concursos (Português, RLM, Direitos, Contabilidade, AFO...) e separa automaticamente os tópicos numerados.
- **Gestão Hierárquica:**
  - Checkboxes de conclusão de tópicos.
  - Contador de revisões espaçadas (`R1`, `R2`, `R3`...).
  - Botão de play direto em cada tópico para cronometrar aquele assunto específico.
  - Adição e exclusão manual de matérias e tópicos.

### 4. 🎯 Algoritmo de Planejamento & Ciclo de Estudos
- **Entradas do Aluno:**
  - Quantidade de horas semanais dispostas para a rotina (ex.: 20h, 30h).
  - Duração recomendada do bloco de estudo (30, 45, 50, 60 ou 90 min).
  - Distribuição diária de minutos (Segunda a Domingo).
  - Nível de **Importância na Prova** de cada matéria (1 a 5 estrelas).
  - Nível de **Conhecimento Atual** do aluno (1 = Iniciante/Nunca vi até 5 = Domino a matéria).
  - Opção de **Horas Fixadas pelo Aluno** para disciplinas prioritárias.
- **Cálculo da Relevância (Fórmula Estudei & Alexandre Meirelles):**
  $$\text{Fator de Peso} = \text{Importância} \times (6 - \text{Conhecimento})$$
- **Ciclo de Estudos Rotativo Intercalado:** Gera a fila ordenada de blocos alternando matérias diferentes para evitar saturação mental.
- **Grade Semanal Alocada:** Distribui os blocos pelos dias úteis e finais de semana com sugestão automática dos tópicos pendentes do edital.

### 5. 📊 Painel de Desempenho & Estatísticas
- Gráficos interativos com **Recharts**:
  - Horas líquidas diárias nos últimos 7 dias.
  - Divisão percentual do tempo estudado por matéria (gráfico de rosca).
  - Aproveitamento em questões (total de resolvidas, acertos, erros e taxa %).
  - Percentual de conclusão do edital verticalizado.

### 6. 🎓 Apoio Completo a Faculdade / Graduação
- Aba dedicada para cadastrar matérias do semestre acadêmico, trabalhos e provas de faculdade com metas próprias.

### 7. ☁️ Arquitetura Híbrida: Local + Nuvem (Supabase) + Backup JSON
- **100% Funcional Offline / Localmente:** Salva no navegador do aluno sem necessidade obrigatória de criar conta.
- **Nuvem Opcional com Supabase:** Permite configurar chaves no `.env` ou pela interface para sincronizar com PostgreSQL e Row Level Security (RLS).
- **Exportação e Importação de Backup:** Download de arquivo `.json` a qualquer momento para garantir a segurança dos dados.

---

## 📁 Estrutura do Projeto

```
Concursei/
├── public/                 # Ícones PWA e assets estáticos
├── server/
│   ├── index.js            # Servidor Express (API + Proxy de PDF + Host estático)
│   └── pci.js              # Raspador e parser dos concursos abertos
├── src/
│   ├── components/
│   │   ├── ConcursoDetalheView.tsx   # Edital Verticalizado + Ciclo de Estudos
│   │   ├── ConcursosAbertosView.tsx  # Catálogo e busca de concursos
│   │   ├── ConfigModal.tsx           # Configuração de Nuvem e Backup
│   │   ├── EstatisticasView.tsx      # Gráficos e métricas de desempenho
│   │   ├── MeusEstudosView.tsx       # Gestão de concursos e faculdade
│   │   ├── NovoConcursoModal.tsx     # Cadastro manual de estudos
│   │   ├── Sidebar.tsx               # Barra de navegação lateral
│   │   ├── TimerView.tsx             # Cronômetro, Temporizador e Pomodoro
│   │   └── TopBar.tsx                # Barra superior com dock flutuante
│   ├── lib/
│   │   ├── audio.ts                  # Sintetizador sonoro Web Audio API
│   │   ├── pdfExtractor.ts           # Extrator de edital em PDF no navegador
│   │   ├── planner.ts                # Algoritmo matemático do Ciclo de Estudos
│   │   ├── storage.ts                # Camada de dados (Local + Supabase + Backup)
│   │   ├── supabaseClient.ts         # Cliente Supabase
│   │   └── types.ts                  # Interfaces e modelos TypeScript
│   ├── store/
│   │   └── useAppStore.ts            # Estado global com persistência do timer
│   ├── styles/
│   │   └── index.css                 # Design System (tokens Estudei & Aprovado)
│   ├── App.tsx                       # Componente raiz
│   └── main.tsx                      # Bootstrap React
├── supabase/
│   └── schema.sql                    # Script SQL completo com RLS para o banco
├── package.json
└── vite.config.ts
```
