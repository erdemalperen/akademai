import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { UserRole } from '../../types';
interface AuthenticatedUser {
  id: number;
  email: string;
  role: UserRole;
}
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      cookies: {
        [key: string]: string;
      };
    }
  }
}
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  let token: string | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } 
  if (!token && req.cookies && req.cookies.auth_token) {
    token = req.cookies.auth_token;
    console.log('Auth Middleware: Token çerezden alındı');
  }
  if (!token) {
    console.log('Auth Middleware: Token bulunamadı');
    return res.status(401).json({ message: 'Kimlik doğrulama belirteci gereklidir.' });
  }
  console.log(`Auth Middleware: Token uzunluğu: ${token.length}`);
  try {
    const jwtDecoded = verifyToken(token);
    if (jwtDecoded) {
      console.log('Auth Middleware: JWT token doğrulandı');
      req.user = {
        id: jwtDecoded.id,
        email: jwtDecoded.email,
        role: jwtDecoded.role
      };
      console.log(`Auth Middleware: JWT Kullanıcı ${jwtDecoded.email} (${jwtDecoded.role})`);
      return next();
    } else {
      console.log('Auth Middleware: JWT token doğrulama başarısız');
      return res.status(401).json({ message: 'Geçersiz kimlik doğrulama belirteci.' });
    }
  } catch (jwtError) {
    console.error('Auth Middleware: JWT doğrulama hatası:', jwtError);
    return res.status(401).json({ message: 'Geçersiz kimlik doğrulama belirteci.' });
  }
};
export const authorize = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Kimlik doğrulama gerekli.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Bu işlem için yeterli yetkiniz yok.' });
    }
    next();
  };
};
export const authenticateToken = authenticate;
