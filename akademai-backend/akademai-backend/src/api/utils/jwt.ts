import jwt from 'jsonwebtoken';
import type { Secret, SignOptions } from 'jsonwebtoken';
import { UserRole, TokenUser } from '../../types';
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
if (!JWT_SECRET) {
  console.error('JWT_SECRET çevresel değişkeni tanımlanmamış! Uygulama başlatılamıyor.');
  setTimeout(() => {
    throw new Error('JWT_SECRET tanımlanmamış');
  }, 100);
}
interface JwtPayload {
  id: number;
  email: string;
  role: UserRole;
}
export const generateToken = (user: TokenUser): string => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET tanımlanmamış');
  }
  const payload = { 
    id: user.id, 
    email: user.email, 
    role: user.role 
  };
  const options: SignOptions = { 
    expiresIn: JWT_EXPIRES_IN as any
  };
  const secret: Secret = Buffer.from(JWT_SECRET as string, 'utf8');
  return jwt.sign(payload, secret, options);
};
export const verifyToken = (token: string): TokenUser | null => {
  try {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET tanımlanmamış');
    }
    const secret: Secret = Buffer.from(JWT_SECRET as string, 'utf8');
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    return null;
  }
};
export const hasRole = (token: string, requiredRole: UserRole): boolean => {
  const decoded = verifyToken(token);
  if (!decoded) return false;
  if (decoded.role === UserRole.ADMIN_SENIOR) return true;
  if (decoded.role === UserRole.ADMIN_JUNIOR && requiredRole === UserRole.EMPLOYEE) return true;
  return decoded.role === requiredRole;
};
