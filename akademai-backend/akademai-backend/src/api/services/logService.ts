import { Pool } from 'pg';
import { Request } from 'express';
import { Log } from '../../types';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123@localhost:5433/egitimportal',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
export enum LogActionType {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  ROLE_CHANGE = 'ROLE_CHANGE',
  TRAINING_CREATE = 'TRAINING_CREATE',
  TRAINING_UPDATE = 'TRAINING_UPDATE',
  TRAINING_DELETE = 'TRAINING_DELETE',
  ENROLLMENT = 'ENROLLMENT',
  ADMIN_ACTION = 'ADMIN_ACTION',
  API_ACCESS = 'API_ACCESS',
  FAILED_LOGIN = 'FAILED_LOGIN'
}
interface LogData {
  action: string;
  description?: string;
  userId?: number;
  ipAddress?: string;
  userAgent?: string;
  additionalData?: any;
}
class LogService {
  async createLog(logData: LogData): Promise<Log | null> {
    const client = await pool.connect();
    try {
      const { additionalData, ...safeLogData } = logData;
      let sanitizedDescription = logData.description || '';
      if (additionalData && typeof additionalData === 'object') {
        try {
          const safeData = this.sanitizeData(additionalData);
          const jsonStr = JSON.stringify(safeData);
          if (jsonStr && jsonStr.length + sanitizedDescription.length <= 1000) {
            sanitizedDescription += ` ${jsonStr}`;
          } else {
            sanitizedDescription += ` [Ek veri çok büyük veya uyumsuz format]`;
          }
        } catch (error) {
          console.error('Log için JSON dönüşüm hatası:', error);
          sanitizedDescription += ' [JSON dönüşüm hatası]';
        }
      }
      await client.query('BEGIN');
      const insertRes = await client.query(
        `INSERT INTO logs (action_type, details, user_id, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          safeLogData.action,
          sanitizedDescription,
          safeLogData.userId ? Number(safeLogData.userId) : null,
          safeLogData.ipAddress || null,
          safeLogData.userAgent || null
        ]
      );
      await client.query('COMMIT');
      return insertRes.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Log oluşturma hatası:', error);
      return null;
    } finally {
      client.release();
    }
  }
  extractRequestInfo(req: Request): { ipAddress: string; userAgent: string } {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || 
                      req.socket.remoteAddress || 
                      'bilinmiyor';
    const userAgent = req.headers['user-agent'] || 'bilinmiyor';
    return { 
      ipAddress: typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : 'bilinmiyor',
      userAgent: typeof userAgent === 'string' ? userAgent : 'bilinmiyor'
    };
  }
  async getLogs(options: {
    page?: number;
    limit?: number;
    userId?: number;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      startDate,
      endDate
    } = options;
    const client = await pool.connect();
    try {
      const filters: string[] = [];
      const values: any[] = [];
      let idx = 1;
      if (userId) { filters.push(`l.user_id = $${idx++}`); values.push(userId); }
      if (action) { filters.push(`action_type = $${idx++}`); values.push(action); }
      if (startDate) { filters.push(`created_at >= $${idx++}`); values.push(startDate); }
      if (endDate) { filters.push(`created_at <= $${idx++}`); values.push(endDate); }
      const whereClause = filters.length ? 'WHERE ' + filters.join(' AND ') : '';
      const totalRes = await client.query(`SELECT COUNT(*) FROM logs ${whereClause}`, values);
      const total = parseInt(totalRes.rows[0].count, 10);
      const logsRes = await client.query(
        `SELECT l.*, u.id as "user.id", u.email as "user.email", u."firstName" as "user.firstName", u."lastName" as "user.lastName", u.role as "user.role"
         FROM logs l
         LEFT JOIN users u ON l.user_id = u.id
         ${whereClause}
         ORDER BY l.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, limit, (page - 1) * limit]
      );
      const logs = logsRes.rows.map(row => {
        const user = row['user.id'] ? {
          id: row['user.id'],
          email: row['user.email'],
          firstName: row['user.firstName'],
          lastName: row['user.lastName'],
          role: row['user.role']
        } : undefined;
        return {
          id: row.id,
          action: row.action_type,
          description: row.description,
          userId: row.user_id,
          ipAddress: row.ip_address,
          userAgent: row.user_agent,
          createdAt: row.created_at,
          timestamp: row.created_at,
          user
        };
      });
      return {
        data: logs,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Log kayıtları getirme hatası:', error);
      throw new Error('Log kayıtları alınırken bir hata oluştu.');
    } finally {
      client.release();
    }
  }
  private sanitizeData(data: any): any {
    if (!data) return null;
    const sanitized = { ...data };
    const sensitiveFields = [
      'password', 'şifre', 'passphrase', 'secret', 'token', 'apiKey', 
      'creditCard', 'cc', 'krediKartı', 'cvv', 'ssn', 'tcKimlik'
    ];
    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[GİZLENDİ]';
        continue;
      }
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }
    return sanitized;
  }
}
export const logService = new LogService();
