// Algoritmo inteligente de Ciclo de Estudos e Cronograma Semanal (inspirado na metodologia do Estudei e Ciclos de Estudo)
import { Materia, Plano, Topico } from './types.ts';

export interface MateriaCalculada {
  materia: Materia;
  peso: number; // importancia * (6 - conhecimento)
  horasSemanais: number; // horas sugeridas/fixadas por semana
  minutosSemanais: number;
  qtdBlocos: number; // quantidade de blocos no ciclo
  percentualTempo: number; // % do tempo total de estudo
  horasFixadasPeloAluno: boolean;
}

export interface ItemCiclo {
  id: string;
  ordemCiclo: number; // 1, 2, 3...
  materiaId: string;
  materiaNome: string;
  cor: string;
  duracaoMin: number;
  blocoAtual: number; // ex: 1
  totalBlocosMateria: number; // ex: 3 (Bloco 1 de 3)
}

export interface BlocoCronograma {
  id: string;
  materiaId: string;
  materiaNome: string;
  cor: string;
  duracaoMin: number;
  ordemCiclo: number;
  topicoSugerido?: Topico;
}

export interface DiaCronograma {
  diaSemana: number; // 0 = Domingo, 1 = Segunda, ... 6 = Sábado
  nomeCurto: string; // 'Dom', 'Seg', ...
  nomeLongo: string; // 'Domingo', 'Segunda-feira', ...
  minutosDisponiveis: number;
  minutosAlocados: number;
  blocos: BlocoCronograma[];
}

export interface ResultadoPlanejamento {
  materiasCalculadas: MateriaCalculada[];
  ciclo: ItemCiclo[];
  cronogramaSemanal: DiaCronograma[];
  totalHorasSemanais: number;
  totalMinutosSemanais: number;
  totalBlocosCiclo: number;
  duracaoBlocoMin: number;
}

export const NOMES_DIAS = [
  { curto: 'Dom', longo: 'Domingo' },
  { curto: 'Seg', longo: 'Segunda-feira' },
  { curto: 'Ter', longo: 'Terça-feira' },
  { curto: 'Qua', longo: 'Quarta-feira' },
  { curto: 'Qui', longo: 'Quinta-feira' },
  { curto: 'Sex', longo: 'Sexta-feira' },
  { curto: 'Sáb', longo: 'Sábado' },
];

/**
 * Calcula o ciclo de estudos e a distribuição semanal baseado em:
 * - Horas semanais totais que o aluno dispõe
 * - Nível de importância de cada matéria (1 a 5)
 * - Nível de conhecimento atual do aluno (1 a 5, onde 1 = iniciante precisa de mais tempo)
 * - Horas fixas opcionais dedicadas pelo aluno para matérias específicas
 * - Minutos disponíveis em cada dia da semana (Segunda a Domingo)
 * - Duração do bloco de estudo (ex: 50 min ou 60 min)
 */
export function calcularPlanejamento(
  materias: Materia[],
  plano: Partial<Plano> = {},
  topicos: Topico[] = []
): ResultadoPlanejamento {
  const ativas = materias.filter((m) => m.ativa !== false);
  const duracaoBlocoMin = plano.duracao_bloco && plano.duracao_bloco > 0 ? plano.duracao_bloco : 60;
  const horasSemanaisTotal = plano.horas_semanais && plano.horas_semanais > 0 ? Number(plano.horas_semanais) : 20;

  // Minutos por dia padrão (ex: seg-sex 3h, sab 2h, dom 0h = 17h) ou personalizado
  const diasMinutos: number[] = plano.dias && plano.dias.length === 7
    ? plano.dias
    : distribuirHorasNosDias(horasSemanaisTotal);

  if (ativas.length === 0) {
    return {
      materiasCalculadas: [],
      ciclo: [],
      cronogramaSemanal: montarGradeVazia(diasMinutos),
      totalHorasSemanais: horasSemanaisTotal,
      totalMinutosSemanais: horasSemanaisTotal * 60,
      totalBlocosCiclo: 0,
      duracaoBlocoMin,
    };
  }

  // 1. Separa matérias com horas fixadas pelo aluno vs dinâmicas por peso
  let horasFixadasTotal = 0;
  ativas.forEach((m) => {
    if (m.horas_semanais_desejadas && Number(m.horas_semanais_desejadas) > 0) {
      horasFixadasTotal += Number(m.horas_semanais_desejadas);
    }
  });

  const horasDinamicasDisponiveis = Math.max(0, horasSemanaisTotal - horasFixadasTotal);

  // 2. Calcula o peso de cada matéria dinâmica: Importância * (6 - Conhecimento)
  // Se o aluno nunca estudou (conhecimento = 1), fator é 5 (peso máximo).
  // Se domina (conhecimento = 5), fator é 1.
  let somaPesosDinamicos = 0;
  const pesos = ativas.map((m) => {
    const imp = Math.min(5, Math.max(1, m.importancia || 3));
    const con = Math.min(5, Math.max(1, m.conhecimento || 2));
    const peso = imp * (6 - con);
    const temHorasFixas = Boolean(m.horas_semanais_desejadas && Number(m.horas_semanais_desejadas) > 0);
    if (!temHorasFixas) somaPesosDinamicos += peso;
    return { m, peso, temHorasFixas };
  });

  // 3. Distribuição das horas para cada matéria
  const materiasCalculadas: MateriaCalculada[] = pesos.map(({ m, peso, temHorasFixas }) => {
    let horas = 0;
    if (temHorasFixas) {
      horas = Number(m.horas_semanais_desejadas);
    } else if (somaPesosDinamicos > 0) {
      horas = (peso / somaPesosDinamicos) * horasDinamicasDisponiveis;
    } else {
      horas = horasDinamicasDisponiveis / ativas.length;
    }

    // Arredonda para 1 casa decimal e garante no mínimo 0.5h
    horas = Math.max(0.5, Math.round(horas * 10) / 10);
    const minutosSemanais = Math.round(horas * 60);
    const qtdBlocos = Math.max(1, Math.round(minutosSemanais / duracaoBlocoMin));

    return {
      materia: m,
      peso,
      horasSemanais: horas,
      minutosSemanais,
      qtdBlocos,
      percentualTempo: 0, // calculado abaixo
      horasFixadasPeloAluno: temHorasFixas,
    };
  });

  const somaMinutos = materiasCalculadas.reduce((acc, mc) => acc + mc.minutosSemanais, 0);
  materiasCalculadas.forEach((mc) => {
    mc.percentualTempo = somaMinutos > 0 ? Math.round((mc.minutosSemanais / somaMinutos) * 100) : 0;
  });

  // 4. Geração do Ciclo de Estudos (intercalando as matérias para evitar fadiga mental)
  // Algoritmo: cria filas de blocos para cada matéria e consome de forma alternada
  const ciclo = gerarCicloIntercalado(materiasCalculadas, duracaoBlocoMin);

  // 5. Geração do Cronograma Semanal dia a dia (distribui os blocos do ciclo na semana)
  const cronogramaSemanal = gerarCronogramaSemanal(ciclo, diasMinutos, duracaoBlocoMin, topicos);

  return {
    materiasCalculadas,
    ciclo,
    cronogramaSemanal,
    totalHorasSemanais: horasSemanaisTotal,
    totalMinutosSemanais: somaMinutos,
    totalBlocosCiclo: ciclo.length,
    duracaoBlocoMin,
  };
}

/**
 * Intercala os blocos das matérias para que o aluno não estude a mesma matéria repetida consecutivamente
 */
function gerarCicloIntercalado(materias: MateriaCalculada[], duracaoBlocoMin: number): ItemCiclo[] {
  // Ordena matérias por quantidade de blocos decrescente
  const filas = materias.map((mc) => ({
    mc,
    restantes: mc.qtdBlocos,
    total: mc.qtdBlocos,
    consumidos: 0,
  }));

  const totalBlocos = filas.reduce((acc, f) => acc + f.restantes, 0);
  const ciclo: ItemCiclo[] = [];
  let ultimaMateriaId: string | null = null;

  for (let step = 0; step < totalBlocos; step++) {
    // Escolhe a matéria com mais blocos restantes que NÃO seja a mesma da anterior (se houver alternativa)
    const disponiveis = filas.filter((f) => f.restantes > 0);
    if (disponiveis.length === 0) break;

    let escolhida = disponiveis.find((f) => f.mc.materia.id !== ultimaMateriaId);
    if (!escolhida) {
      // Se só restou a mesma matéria, não há como intercalar
      escolhida = disponiveis[0];
    } else {
      // Dentre as diferentes da anterior, pega a que tem maior proporção de blocos restantes
      escolhida = disponiveis
        .filter((f) => f.mc.materia.id !== ultimaMateriaId)
        .sort((a, b) => b.restantes - a.restantes)[0] || escolhida;
    }

    escolhida.consumidos += 1;
    escolhida.restantes -= 1;
    ultimaMateriaId = escolhida.mc.materia.id;

    ciclo.push({
      id: `bloco_${step + 1}_${escolhida.mc.materia.id}`,
      ordemCiclo: step + 1,
      materiaId: escolhida.mc.materia.id,
      materiaNome: escolhida.mc.materia.nome,
      cor: escolhida.mc.materia.cor,
      duracaoMin: duracaoBlocoMin,
      blocoAtual: escolhida.consumidos,
      totalBlocosMateria: escolhida.total,
    });
  }

  return ciclo;
}

/**
 * Preenche a grade semanal de Segunda a Domingo com os blocos do ciclo
 */
function gerarCronogramaSemanal(
  ciclo: ItemCiclo[],
  diasMinutos: number[],
  duracaoBlocoMin: number,
  topicos: Topico[]
): DiaCronograma[] {
  const grade: DiaCronograma[] = NOMES_DIAS.map((d, idx) => ({
    diaSemana: idx,
    nomeCurto: d.curto,
    nomeLongo: d.longo,
    minutosDisponiveis: diasMinutos[idx] || 0,
    minutosAlocados: 0,
    blocos: [],
  }));

  if (ciclo.length === 0) return grade;

  let cicloPtr = 0;

  // Percorre os dias da semana na ordem: Seg (1), Ter (2), Qua (3), Qui (4), Sex (5), Sáb (6), Dom (0)
  const ordemDias = [1, 2, 3, 4, 5, 6, 0];

  ordemDias.forEach((diaIdx) => {
    const dia = grade[diaIdx];
    const limiteMinutos = dia.minutosDisponiveis;
    let minutosUsados = 0;

    // Aloca blocos enquanto houver tempo disponível no dia
    while (minutosUsados + duracaoBlocoMin <= limiteMinutos && cicloPtr < ciclo.length * 2) {
      const itemCiclo = ciclo[cicloPtr % ciclo.length];
      cicloPtr += 1;

      // Sugere o primeiro tópico pendente da matéria
      const topicoSugerido = topicos.find(
        (t) => t.materia_id === itemCiclo.materiaId && !t.concluido
      );

      dia.blocos.push({
        id: `sched_${diaIdx}_${dia.blocos.length}_${itemCiclo.materiaId}`,
        materiaId: itemCiclo.materiaId,
        materiaNome: itemCiclo.materiaNome,
        cor: itemCiclo.cor,
        duracaoMin: duracaoBlocoMin,
        ordemCiclo: itemCiclo.ordemCiclo,
        topicoSugerido,
      });

      minutosUsados += duracaoBlocoMin;
    }

    dia.minutosAlocados = minutosUsados;
  });

  return grade;
}

/**
 * Distribui as horas semanais igualmente entre dias úteis se não informado
 */
export function distribuirHorasNosDias(horasSemanais: number): number[] {
  // Padrão: Seg a Sex com tempo igual, Sáb com metade, Dom livre
  const totalMin = Math.round(horasSemanais * 60);
  const pesos = [0, 2, 2, 2, 2, 2, 1]; // Dom=0, Seg..Sex=2, Sab=1 (total peso = 11)
  const somaPesos = 11;
  return pesos.map((p) => Math.round((p / somaPesos) * totalMin));
}

function montarGradeVazia(diasMinutos: number[]): DiaCronograma[] {
  return NOMES_DIAS.map((d, idx) => ({
    diaSemana: idx,
    nomeCurto: d.curto,
    nomeLongo: d.longo,
    minutosDisponiveis: diasMinutos[idx] || 0,
    minutosAlocados: 0,
    blocos: [],
  }));
}
