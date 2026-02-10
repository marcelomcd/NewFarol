/**
 * Utilitários de autenticação
 * Convertido do Python para Node.js
 */
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY || 'dFMhFt-5eyDrhtbamb09UMR1N4D57QUPLjZ6ZtsZ6bY-dev-secret-key-change-in-production';
const ALGORITHM = process.env.ALGORITHM || 'HS256';

/**
 * Verifica token JWT e retorna payload
 */
export function verifyToken(token) {
  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, SECRET_KEY, { algorithms: [ALGORITHM] });
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Extrai o email do usuário do token JWT
 */
export function getUserEmailFromToken(token) {
  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  return payload.email || payload.sub || null;
}

/**
 * Apenas Quali IT (@qualiit.com.br) tem visão total dos dados (sem filtro por cliente).
 * Combio e demais clientes veem apenas dados do seu cliente.
 */
function isQualiItAdmin(email) {
  if (!email) return false;
  return email.toLowerCase().endsWith('@qualiit.com.br');
}

export function getUserClientFromEmail(email) {
  if (!email) {
    return null;
  }

  if (isQualiItAdmin(email)) {
    return null; // null = sem filtro (só Quali IT)
  }

  // Extrair domínio do email
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
    return null;
  }

  // Mapeamento de domínio para cliente (mesmo do normalization.js)
  const DOMINIO_PARA_CLIENTE = {
    "ale.com.br": "Ale",
    "arteb.com.br": "Arteb",
    "aurora.com.br": "Aurora",
    "belliz.com.br": "Belliz",
    "berlan.com.br": "Berlan",
    "blanver.com.br": "Blanver",
    "brinks.com.br": "Brinks",
    "brmania.com.br": "Brmania",
    "camil.com.br": "Camil",
    "casagiacomo.com.br": "Casa Giacomo",
    "combio.com.br": "Combio",
    "consigaz.com.br": "Consigaz",
    "copagaz.com.br": "Copagaz",
    "delivoro.com.br": "Delivoro",
    "diebold.com.br": "Diebold",
    "dislub.com.br": "Dislub",
    "ecopistas.com.br": "Ecopistas",
    "forzamaquina.com.br": "Forza Maquina",
    "fuchs.com": "Fuchs",
    "gpa.com.br": "Gpa",
    "iberia.com.br": "Iberia",
    "integrada.coop.br": "Integrada",
    "liotecnica.com.br": "Liotecnica",
    "lorenzetti.com.br": "Lorenzetti",
    "moinhopaulista.com.br": "Moinho Paulista",
    "nttdata.com.br": "NTT Data Business",
    "petronac.com.br": "Petronac",
    "plascar.com.br": "Plascar",
    "procurementcompass.com.br": "Procurement Compass",
    "qualiit.com.br": "Quali IT",
    "santacolomba.com.br": "Santa Colomba",
    "supergasbras.com.br": "Supergasbras",
    "tulipa.com.br": "Tulipa",
    "utc.com.br": "Utc",
  };

  const cliente = DOMINIO_PARA_CLIENTE[domain];
  if (cliente) {
    // Formatar nome do cliente (Title Case)
    return cliente
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  return null;
}

/**
 * Obtém o filtro de cliente baseado no token JWT
 */
export function getUserClientFilter(token) {
  const email = getUserEmailFromToken(token);
  if (!email) {
    return null;
  }

  return getUserClientFromEmail(email);
}

/**
 * Verifica se deve filtrar por cliente (não é admin)
 */
export function shouldFilterByClient(token) {
  const email = getUserEmailFromToken(token);
  if (!email) {
    return false;
  }

  return !isQualiItAdmin(email);
}
