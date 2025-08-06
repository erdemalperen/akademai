import { Request, Response, NextFunction } from 'express';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
const window = new JSDOM('').window;
const purify = DOMPurify(window);
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  const config = {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 
                  'strong', 'em', 'code', 'pre', 'blockquote', 'a', 'img', 
                  'br', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 
                  'td', 'hr'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'style', 'width', 'height'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    SANITIZE_DOM: true
  };
  return purify.sanitize(html, config);
};
export const sanitizeContentMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    if (req.body.content) {
      if (req.body.type === 'html' || req.body.type === 'text') {
        req.body.content = sanitizeHtml(req.body.content);
      }
    }
    if (Array.isArray(req.body.content)) {
      req.body.content = req.body.content.map((item: any) => {
        if (item && (item.type === 'html' || item.type === 'text') && item.content) {
          return { ...item, content: sanitizeHtml(item.content) };
        }
        return item;
      });
    }
    if (req.body.description) {
      req.body.description = sanitizeHtml(req.body.description);
    }
  }
  next();
};
export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  const isPdfRoute = req.path.includes('/uploads/pdfs/');
  if (!isPdfRoute) {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  }
  const isPdfIframeRoute = req.path.includes('/uploads/pdfs/');
  if (!isPdfIframeRoute) {
    res.setHeader('Content-Security-Policy', `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://ajax.googleapis.com;
      style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com;
      img-src 'self' data: https:;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' https://api.example.com;
      media-src 'self' https://www.youtube.com https://player.vimeo.com;
      frame-src 'self' https://www.youtube.com https://player.vimeo.com;
    `.replace(/\s+/g, ' ').trim());
  }
  next();
};
export const isUrlSafe = (url: string): boolean => {
  if (!url) return false;
  const allowedDomains = [
    'youtube.com', 'www.youtube.com', 'youtu.be',
    'vimeo.com', 'www.vimeo.com',
    'localhost'
  ];
  try {
    const urlObj = new URL(url);
    return allowedDomains.some(domain => 
      urlObj.hostname === domain || 
      urlObj.hostname.endsWith(`.${domain}`)
    );
  } catch (e) {
    return false;
  }
};
export const urlSecurityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    if (req.body.videoUrl && typeof req.body.videoUrl === 'string') {
      const contentType = req.body.type;
      if ((contentType === 'youtube' || contentType === 'vimeo') && 
          !isUrlSafe(req.body.videoUrl)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Güvenlik nedeniyle verilen URL kabul edilemez.' 
        });
      }
    }
    if (Array.isArray(req.body.content)) {
      for (const item of req.body.content) {
        if (item && (item.type === 'youtube' || item.type === 'vimeo') && 
            typeof item.videoUrl === 'string' && !isUrlSafe(item.videoUrl)) {
          return res.status(400).json({ 
            success: false, 
            message: 'Güvenlik nedeniyle verilen URL kabul edilemez.' 
          });
        }
      }
    }
  }
  next();
};
export const apiAccessMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const publicRoutes = [
    '/api/auth/login',
    '/api/users/login',
    '/api/users/login/admin',
    '/api/users/register',
    '/api/users/register/admin',
    '/api/users/verify',
    '/api/users/password/forgot',
    '/api/users/password/reset',
    '/api/users/logout',
    '/api/',
    '/'
  ];
  const healthRoutes = [
    '/api/health',
    '/health'
  ];
  if (req.path.startsWith('/uploads/')) {
    return next();
  }
  if (healthRoutes.includes(req.path)) {
    return next();
  }
  for (const route of publicRoutes) {
    if (req.path === route || (route.endsWith('/') && req.path.startsWith(route))) {
      return next();
    }
  }
  if (req.method === 'OPTIONS') {
    return next();
  }
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn(`API erişim reddedildi: ${req.method} ${req.path} - Kaynak: ${req.ip}, User-Agent: ${req.headers['user-agent']}`);
    return res.status(401).json({
      success: false,
      message: 'Bu API kaynağına erişim için kimlik doğrulama gereklidir.'
    });
  }
  next();
}; 