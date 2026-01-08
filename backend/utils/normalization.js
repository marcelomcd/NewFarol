/**
 * Funções de normalização de dados do Azure DevOps
 * Convertido do Python para Node.js
 */

// Mapeamento de status do farol
const FAROL_STATUS_MAP = {
  "sem problema": "Sem Problema",
  "green": "Sem Problema",
  "com problema": "Com Problema",
  "yellow": "Com Problema",
  "problema crítico": "Problema Crítico",
  "problema critico": "Problema Crítico",
  "red": "Problema Crítico",
};

/**
 * Normaliza o status do farol para valores padronizados
 */
export function normalizeFarolStatus(status) {
  if (!status) {
    return "Indefinido";
  }

  const statusLower = String(status).toLowerCase().trim();

  for (const [key, value] of Object.entries(FAROL_STATUS_MAP)) {
    if (statusLower.includes(key)) {
      return value;
    }
  }

  return "Indefinido";
}

/**
 * Remove tags HTML e limpa o texto
 */
export function cleanHtml(rawHtml, preserveNewlines = false) {
  if (!rawHtml) {
    return "";
  }

  if (!rawHtml.includes("<") && !rawHtml.includes(">")) {
    return String(rawHtml).trim();
  }

  let text = String(rawHtml);

  if (preserveNewlines) {
    // Para comentários: preservar quebras de linha
    text = text.replace(/<\/?(?:p|div|li)\b[^>]*>/gi, "\n");
    text = text.replace(/<br\s*\/?>/gi, "\n");
    text = text.replace(/<ul[^>]*>/gi, "\n");
    text = text.replace(/<\/ul>/gi, "\n");
    text = text.replace(/<ol[^>]*>/gi, "\n");
    text = text.replace(/<\/ol>/gi, "\n");
    // Remove outras tags
    text = text.replace(/<[^<]+?>/g, "");
    // Normaliza múltiplas quebras de linha
    text = text.replace(/\n{3,}/g, "\n\n");
    // Remove espaços extras mas preserva quebras
    text = text.replace(/[ \t]+/g, " ");
  } else {
    // Para outros campos: substitui tags por espaço
    text = text.replace(/<\/?(?:p|div)\b[^>]*>/gi, " ");
    text = text.replace(/<br\s*\/?>/gi, " ");
    text = text.replace(/<[^<]+?>/g, "");
    text = text.replace(/\s{2,}/g, " ");
  }

  return text.trim();
}

/**
 * Formata data do Azure DevOps para formato brasileiro
 */
export function formatDatetime(dtStr, includeTime = false) {
  if (!dtStr || String(dtStr).toLowerCase() in ["none", "null", ""]) {
    return includeTime ? "--/--/---- às --:--" : "--/--/----";
  }

  try {
    // Remove timezone e formata
    let dtStrClean = String(dtStr).split("+")[0].split("Z")[0].trim();

    const formats = [
      "%Y-%m-%dT%H:%M:%S.%f",
      "%Y-%m-%dT%H:%M:%S",
      "%Y-%m-%d %H:%M:%S",
      "%Y-%m-%d",
    ];

    for (const fmt of formats) {
      try {
        // Converter formato Python para JavaScript
        let dt;
        if (fmt.includes("%f")) {
          // Com microsegundos
          const match = dtStrClean.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\.(\d+)$/);
          if (match) {
            dt = new Date(match[1] + "." + match[2].substring(0, 3) + "Z");
          } else {
            dt = new Date(dtStrClean + "Z");
          }
        } else if (fmt.includes("T")) {
          dt = new Date(dtStrClean + "Z");
        } else {
          dt = new Date(dtStrClean);
        }

        if (isNaN(dt.getTime())) {
          continue;
        }

        // Ajuste de fuso horário GMT-3
        dt = new Date(dt.getTime() - 3 * 60 * 60 * 1000);

        if (includeTime) {
          return dt.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        } else {
          return dt.toLocaleDateString("pt-BR");
        }
      } catch (e) {
        continue;
      }
    }

    return dtStrClean;
  } catch (e) {
    return String(dtStr);
  }
}

/**
 * Formata horas no formato HH:MM
 */
export function formatHours(value) {
  try {
    if (typeof value === "string" && /^\d{1,2}:\d{2}$/.test(value)) {
      return value;
    }

    // Converte para float e depois para minutos
    const totalMinutos = Math.floor(parseFloat(value) * 60);
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
  } catch (e) {
    return "00:00";
  }
}

/**
 * Normaliza valores de campos do Azure DevOps
 */
export function normalizeValue(label, value) {
  if (value === null || value === undefined) {
    return "";
  }

  // Se for dict com displayName (usuários)
  if (typeof value === "object" && value !== null && "displayName" in value) {
    return value.displayName;
  }

  // Se for string com HTML
  if (typeof value === "string" && value.startsWith("<div")) {
    return cleanHtml(value);
  }

  // Se for string com quebras de linha
  if (typeof value === "string" && value.includes("\n")) {
    return value.trim();
  }

  // Campos de data
  if (label && ["data", "date"].some((keyword) => label.toLowerCase().includes(keyword))) {
    return formatDatetime(String(value));
  }

  // Campos de horas
  if (label && (label.toLowerCase().startsWith("horas") || label.toLowerCase().startsWith("saldo"))) {
    return formatHours(value);
  }

  return String(value);
}

// Mapeamento de domínio para cliente
const DOMINIO_PARA_CLIENTE = {
  "ale.com.br": "ale",
  "arteb.com.br": "arteb",
  "aurora.com.br": "aurora",
  "belliz.com.br": "belliz",
  "berlan.com.br": "berlan",
  "blanver.com.br": "blanver",
  "brinks.com.br": "brinks",
  "brmania.com.br": "brmania",
  "camil.com.br": "camil",
  "casagiacomo.com.br": "casa giacomo",
  "combio.com.br": "combio",
  "consigaz.com.br": "consigaz",
  "copagaz.com.br": "copagaz",
  "delivoro.com.br": "delivoro",
  "diebold.com.br": "diebold",
  "dislub.com.br": "dislub",
  "ecopistas.com.br": "ecopistas",
  "forzamaquina.com.br": "forza maquina",
  "fuchs.com": "fuchs",
  "gpa.com.br": "gpa",
  "iberia.com.br": "iberia",
  "integrada.coop.br": "integrada",
  "liotecnica.com.br": "liotecnica",
  "lorenzetti.com.br": "lorenzetti",
  "moinhopaulista.com.br": "moinho paulista",
  "nttdata.com.br": "ntt data business",
  "petronac.com.br": "petronac",
  "plascar.com.br": "plascar",
  "procurementcompass.com.br": "procurement compass",
  "qualiit.com.br": "quali it",
  "santacolomba.com.br": "santa colomba",
  "supergasbras.com.br": "supergasbras",
  "tulipa.com.br": "tulipa",
  "utc.com.br": "utc",
};

/**
 * Extrai nome do cliente de AreaPath, IterationPath ou email
 */
export function extractClientName(areaPath, iterationPath = null, createdByEmail = null) {
  // Primeiro, tenta extrair do email (mais confiável)
  if (createdByEmail) {
    try {
      const domain = createdByEmail.includes("@") ? createdByEmail.split("@")[1].toLowerCase() : null;
      if (domain && domain in DOMINIO_PARA_CLIENTE) {
        return DOMINIO_PARA_CLIENTE[domain]
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      }
    } catch (e) {
      // Ignora erro
    }
  }

  // Mapeamento de nomes conhecidos
  const CLIENT_NAME_MAP = {
    qualiit: "Quali IT",
    "quali it": "Quali IT",
    qualit: "Quali IT",
    "quali it - inovação e tecnologia": "Quali IT",
    "qualit - inovação e tecnologia": "Quali IT",
  };

  function formatClientName(name) {
    if (!name || !name.trim()) {
      return null;
    }

    const nomeLimpo = name.trim();
    const nomeLower = nomeLimpo.toLowerCase();

    // Verifica casos especiais primeiro
    if (nomeLower in CLIENT_NAME_MAP) {
      return CLIENT_NAME_MAP[nomeLower];
    }

    // Normalização: primeira letra de cada palavra em maiúscula
    const palavras = nomeLimpo.split(/\s+/);
    const nomeFormatado = palavras.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ");

    // Verifica novamente após capitalização
    const nomeFormatadoLower = nomeFormatado.toLowerCase();
    if (nomeFormatadoLower in CLIENT_NAME_MAP) {
      return CLIENT_NAME_MAP[nomeFormatadoLower];
    }

    return nomeFormatado;
  }

  function cleanClientName(name) {
    if (!name) {
      return name;
    }

    const knownCompoundNames = {
      "camil alimentos": "Camil Alimentos",
      "casa giacomo": "Casa Giacomo",
      "forza maquina": "Forza Maquina",
      "moinho paulista": "Moinho Paulista",
      "ntt data business": "NTT Data Business",
      "procurement compass": "Procurement Compass",
      "santa colomba": "Santa Colomba",
      supergasbras: "Supergasbras",
      "tulipa combustíveis": "Tulipa Combustíveis",
      "ibéria combustíveis": "Ibéria Combustíveis",
      "ale combustíveis": "Ale Combustíveis",
    };

    const nameLower = name.toLowerCase().trim();

    // Verifica se é um nome composto conhecido completo
    for (const [key, value] of Object.entries(knownCompoundNames)) {
      if (nameLower.startsWith(key)) {
        const parts = name.split(" - ");
        if (parts.length > 1) {
          const baseName = parts[0].trim();
          const baseLower = baseName.toLowerCase();
          for (const [k, v] of Object.entries(knownCompoundNames)) {
            if (baseLower === k) {
              return v;
            }
          }
          return formatClientName(baseName);
        } else {
          return formatClientName(name);
        }
      }
    }

    // Remove sufixos de projeto
    if (name.includes(" - ")) {
      const parts = name.split(" - ", 1);
      const baseName = parts[0].trim().replace(/-/g, " ").trim();
      return formatClientName(baseName);
    }

    if (name.includes("-")) {
      name = name.replace(/-/g, " ").trim();
    }

    return formatClientName(name);
  }

  function processPath(path) {
    if (!path) {
      return null;
    }

    // Normaliza barras
    let pathNormalizado = path.replace(/\//g, "\\");

    // Remove barras no final
    pathNormalizado = pathNormalizado.replace(/\\+$/, "");

    // Separa por barras invertidas
    const partes = pathNormalizado.split("\\");

    if (!partes || partes.length === 0) {
      return null;
    }

    // SEMPRE pega o último segmento
    const nome = partes[partes.length - 1].trim();

    if (!nome) {
      return null;
    }

    // Remove sufixos de projeto e formata o nome
    const nomeLimpo = cleanClientName(nome);
    const nomeFormatado = nomeLimpo !== nome ? formatClientName(nomeLimpo) : formatClientName(nome);

    // Se for Quali IT (projeto nosso), retorna null
    const nomeFormatadoLower = nomeFormatado ? nomeFormatado.toLowerCase() : "";
    if (nomeFormatadoLower in ["quali it", "qualit", "qualiit"]) {
      return null;
    }

    // Normalizar duplicatas conhecidas
    if (nomeFormatadoLower === "aurora") {
      return "Aurora";
    } else if (nomeFormatadoLower in ["qualiit", "quali it"]) {
      return "Quali IT";
    }

    return nomeFormatado;
  }

  // Tenta primeiro AreaPath
  let cliente = processPath(areaPath);
  if (cliente) {
    return cliente;
  }

  // Se não encontrou, tenta IterationPath
  if (iterationPath) {
    cliente = processPath(iterationPath);
    if (cliente) {
      return cliente;
    }
  }

  return null;
}

/**
 * Extrai nome do PMO do campo AssignedTo
 */
export function extractPmoName(assignedTo) {
  if (!assignedTo) {
    return null;
  }

  if (typeof assignedTo === "object" && assignedTo !== null) {
    return assignedTo.displayName || null;
  }

  if (typeof assignedTo === "string") {
    return assignedTo;
  }

  return null;
}
