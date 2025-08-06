import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  throw new Error('FATAL ERROR: DATABASE_URL environment variable is not set in production environment.');
}
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123@localhost:5433/egitimportal',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 5,
  idleTimeoutMillis: 300000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 0,
});
pool.on('connect', (client) => {
  console.log('📡 Yeni PostgreSQL bağlantısı kuruldu');
});
pool.on('remove', (client) => {
  console.log('🔌 PostgreSQL bağlantısı kaldırıldı');
});
pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool hatası:', err.message);
});
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();
    console.log('✅ PostgreSQL veritabanı bağlantısı başarılı');
    console.log('✅ Veritabanı bağlantısı başarılı. Sunucu zamanı:', result.rows[0].current_time);
  } catch (err) {
    console.error('❌ Veritabanına bağlanırken hata oluştu:', (err as Error).message);
  }
}
testConnection();