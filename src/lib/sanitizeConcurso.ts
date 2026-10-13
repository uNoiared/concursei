// Sanitização padronizada de nomes de concursos: estritamente Órgão + Cargo
// Remove manchetes de notícias, clickbaits e verbos jornalísticos

export interface ConcursoIdentificado {
  orgao: string;
  cargo: string;
  titulo: string;
}

export function sanitizarNomeConcurso(
  mancheteOuNome: string,
  cargoOriginal = ''
): ConcursoIdentificado {
  let texto = (mancheteOuNome || '').replace(/\s+/g, ' ').trim();

  // 1. Remove prefixos comuns de notícias
  texto = texto.replace(
    /^(Concurso\s+Público|Processo\s+Seletivo|Novo\s+Concurso|Novo\s+Certame|Concursos|Edital|Notícia:?)\s*(do|da|de|para|no|na|dos|das)?\s*/i,
    ''
  );

  // 2. Extrai cargo se houver indicação clara "para [Cargo]"
  let cargoExtraido = '';
  const matchPara = texto.match(
    /\bpara\s+([A-Za-zÀ-ú\s,\/e\-]+?)(?:\s+(?:com|em|no|na|de\s+\d|\d+\s+vagas|\(|$|\.|\:|\-))/i
  );
  if (matchPara && matchPara[1].trim().length > 2 && matchPara[1].trim().length < 50) {
    cargoExtraido = matchPara[1]
      .trim()
      .replace(/\b(vagas|cargos|nível|nivel|superior|médio|medio)\b.*$/i, '')
      .trim();
  }

  // 3. Limpa o órgão cortando antes de verbos ou preposições jornalísticas
  let orgao = texto
    .replace(
      /\s+(abre|abriu|anuncia|anunciou|anunciado|autoriza|autorizou|autorizado|planeja|planejado|estuda|estudado|prevê|preve|previsto|confirma|confirmado|solicita|solicitou|solicitado|prepara|preparando|tem|deve\s+abrir|publica|publicou|publicado|divulga|divulgado|lança|lançado|forma\s+comissão|comissão\s+formada)\b.*$/i,
      ''
    )
    .replace(/\s+para\s+.*$/i, '')
    .split(/[:;\-–—|]/)[0]
    .replace(/\b(202[4-9]|2030)\b/g, '') // remove ano solto no nome do órgão
    .replace(/\s+(do|da|de|no|na)$/i, '')
    .trim();

  // Mapeamentos conhecidos para siglas de prestígio
  if (/polícia\s+militar\s+(do\s+distrito\s+federal|do\s+df|df)/i.test(orgao)) {
    orgao = 'PMDF - Polícia Militar do DF';
  } else if (/polícia\s+rodoviária\s+federal|prf/i.test(orgao)) {
    orgao = 'PRF - Polícia Rodoviária Federal';
  } else if (/polícia\s+federal|\bpf\b/i.test(orgao)) {
    orgao = 'PF - Polícia Federal';
  } else if (/banco\s+central|\bbacen\b/i.test(orgao)) {
    orgao = 'BACEN - Banco Central do Brasil';
  } else if (/tribunal\s+de\s+justiça\s+do\s+distrito\s+federal|\btjdft\b/i.test(orgao)) {
    orgao = 'TJDFT - Tribunal de Justiça do DF';
  } else if (/inss|instituto\s+nacional\s+do\s+seguro\s+social/i.test(orgao)) {
    orgao = 'INSS - Seguro Social';
  }

  if (!orgao || orgao.length < 3) {
    orgao = 'Órgão Público';
  } else if (orgao.length > 55) {
    orgao = orgao.slice(0, 55).trim();
  }

  // 4. Determina cargo final
  let cargoFinal =
    cargoOriginal &&
    cargoOriginal !== 'Vários Cargos' &&
    cargoOriginal !== 'Cargos do certame anterior'
      ? cargoOriginal
      : cargoExtraido || 'Vários Cargos';

  // Limpa ruídos do cargo
  cargoFinal = cargoFinal
    .replace(/^(cargos?\s+de|vagas?\s+de)\s*/i, '')
    .replace(/\s+(com|em|para|salários|salarios)\b.*$/i, '')
    .trim();

  if (!cargoFinal || cargoFinal.length < 2) cargoFinal = 'Vários Cargos';

  // 5. Formata título estrito: Órgão • Cargo
  const titulo =
    cargoFinal !== 'Vários Cargos'
      ? `${orgao} • ${cargoFinal}`
      : orgao;

  return {
    orgao,
    cargo: cargoFinal,
    titulo,
  };
}
