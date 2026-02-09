/**
 * Rotas de autenticação
 * 
 * Endpoints:
 * - GET /api/auth/me - Valida token e retorna informações do usuário
 * - GET /api/auth/login - Inicia processo de autenticação OAuth
 * - GET /api/auth/callback - Callback do OAuth
 */
import express from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';
import { AuthenticationError, ValidationError } from '../utils/errors.js';

const router = express.Router();

const SECRET_KEY = process.env.SECRET_KEY || 'dFMhFt-5eyDrhtbamb09UMR1N4D57QUPLjZ6ZtsZ6bY-dev-secret-key-change-in-production';
const ALGORITHM = process.env.ALGORITHM || 'HS256';
const ACCESS_TOKEN_EXPIRE_MINUTES = parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || '30');

/**
 * GET /api/auth/me
 * Valida token e retorna informações do usuário
 */
router.get('/me', (req, res, next) => {
  try {
    const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AuthenticationError('Token não fornecido');
    }

    // Verificar token
    const decoded = jwt.verify(token, SECRET_KEY);
    
    logger.debug('Token validado com sucesso', { 
      email: decoded.email,
      sub: decoded.sub,
    });
    
    // Retornar informações do usuário (sem dados sensíveis)
    res.json({
      sub: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      is_admin: decoded.is_admin || false
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      logger.warn('Tentativa de autenticação com token inválido', {
        error: error.name,
      });
      return next(new AuthenticationError('Token inválido ou expirado'));
    }
    
    logger.error('Erro ao validar token', error, {
      endpoint: '/api/auth/me',
    });
    
    next(error);
  }
});

/**
 * Valida e retorna a URL do frontend para redirect.
 * Aceita return_origin apenas se for localhost (qualquer porta) ou mesma origem permitida.
 */
function getFrontendRedirectUrl(req, fallback) {
  const fallbackUrl = fallback || process.env.FRONTEND_URL || 'http://localhost:5173';
  const returnOrigin = req.query?.return_origin;
  if (!returnOrigin || typeof returnOrigin !== 'string') return fallbackUrl;
  try {
    const url = new URL(returnOrigin);
    // Permitir apenas localhost em desenvolvimento (qualquer porta)
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return returnOrigin.replace(/\/$/, '');
    // Em produção, poderia validar contra lista de origens permitidas
    return fallbackUrl;
  } catch {
    return fallbackUrl;
  }
}

/**
 * GET /api/auth/login
 * Inicia processo de autenticação OAuth
 * Redireciona para Azure AD ou gera token de desenvolvimento
 * Aceita return_origin para redirecionar de volta à mesma origem (ex.: 5174).
 */
router.get('/login', (req, res) => {
  const tenantId = process.env.AZURE_AD_TENANT_ID;
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const redirectUri = process.env.AZURE_AD_REDIRECT_URI || 'http://localhost:8000/api/auth/callback';
  const isPublicClient = process.env.AZURE_AD_IS_PUBLIC_CLIENT === 'true';
  const returnOrigin = (req.query?.return_origin && typeof req.query.return_origin === 'string')
    ? req.query.return_origin
    : '';

  // Se Azure AD estiver configurado, redirecionar para OAuth
  if (tenantId && clientId && !isPublicClient) {
    const state = returnOrigin ? `login:${encodeURIComponent(returnOrigin)}` : 'login';
    const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_mode=query&` +
      `scope=openid profile email&` +
      `state=${encodeURIComponent(state)}`;
    
    return res.redirect(authUrl);
  }

  // Se for cliente público ou não configurado, redirecionar para callback de desenvolvimento
  const callbackUrl = returnOrigin
    ? `/api/auth/callback?return_origin=${encodeURIComponent(returnOrigin)}`
    : '/api/auth/callback';
  return res.redirect(callbackUrl);
});

/**
 * GET /api/auth/callback
 * Callback do OAuth
 * Processa código OAuth ou gera token de desenvolvimento
 */
router.get('/callback', async (req, res) => {
  try {
    const code = req.query.code;
    const error = req.query.error;
    const state = req.query.state;

    // Origem do frontend: return_origin (query), state OAuth (formato "login:url") ou fallback
    const defaultFrontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    let frontendUrl = getFrontendRedirectUrl(req, defaultFrontend);
    if (frontendUrl === defaultFrontend && state && typeof state === 'string' && state.startsWith('login:')) {
      try {
        const decoded = decodeURIComponent(state.slice(6));
        const url = new URL(decoded);
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') frontendUrl = decoded.replace(/\/$/, '');
      } catch (_) { /* ignore */ }
    }

    // Se houver erro no callback OAuth
    if (error) {
      logger.warn('Erro no callback OAuth', { error });
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error)}`);
    }

    // Se tiver código OAuth, processar autenticação Azure AD
    if (code) {
      // TODO: Implementar troca de código por token Azure AD
      logger.info('Código OAuth recebido (funcionalidade ainda não implementada)');
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Autenticação Azure AD ainda não implementada completamente')}`);
    }

    // Modo desenvolvimento: gerar token diretamente
    const user = {
      sub: 'dev@qualiit.com.br',
      email: 'dev@qualiit.com.br',
      name: 'Usuário de Desenvolvimento',
      is_admin: true
    };

    const token = jwt.sign(user, SECRET_KEY, {
      algorithm: ALGORITHM,
      expiresIn: `${ACCESS_TOKEN_EXPIRE_MINUTES}m`
    });

    return res.redirect(`${frontendUrl}/auth/success?token=${encodeURIComponent(token)}`);
  } catch (err) {
    logger.error('Erro no callback de autenticação', err, {
      endpoint: '/api/auth/callback',
    });
    const frontendUrl = getFrontendRedirectUrl(req, process.env.FRONTEND_URL || 'http://localhost:5173');
    const errorMessage = err.message || 'Erro ao processar autenticação';
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(errorMessage)}`);
  }
});

export default router;
