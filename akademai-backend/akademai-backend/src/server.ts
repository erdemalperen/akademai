import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http'; 
import cookieParser from 'cookie-parser';
dotenv.config();
console.log('🔍 DATABASE_URL Debug:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@');
  console.log('🔍 DATABASE_URL Format:', dbUrl);
}
import authRoutes from './api/routes/authRoutes';
import userRoutes from './api/routes/userRoutes';
import departmentRoutes from './api/routes/departmentRoutes';
import logRoutes from './api/routes/logRoutes';
import trainingRoutes from './api/routes/trainingRoutes';
import uploadRoutes from './api/routes/uploadRoutes';
import bootcampRoutes from './api/routes/bootcampRoutes';
import conferenceRoutes from './api/routes/conferenceRoutes';
import statisticsRoutes from './api/routes/statisticsRoutes';
import aiAssistantRoutes from './api/routes/aiAssistantRoutes';
import { pool } from './db'; 
import { authenticateToken } from './api/middleware/authMiddleware';
import { 
  securityHeadersMiddleware, 
  urlSecurityMiddleware,
  apiAccessMiddleware 
} from './api/middleware/securityMiddleware';
const app = express();
const PORT = parseInt(process.env.PORT || '5001', 10);
app.set('trust proxy', 1);
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'https://akademaiegitimportali.netlify.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development',
  message: { success: false, message: 'Çok fazla istek yapıldı, lütfen daha sonra tekrar deneyin.' }
});
app.use(securityHeadersMiddleware);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://ajax.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://api.example.com", "http://localhost:*", "http://127.0.0.1:*"],
      mediaSrc: ["'self'", "https://www.youtube.com", "https://player.vimeo.com"],
      frameSrc: ["'self'", "https://www.youtube.com", "https://player.vimeo.com"]
    }
  },
  crossOriginEmbedderPolicy: false,
  frameguard: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  xssFilter: true,
  noSniff: true,
}));
app.use(urlSecurityMiddleware);
app.use(cookieParser());
app.use(apiAccessMiddleware);
app.use(apiLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
const backendUploadsDir = path.join(__dirname, '../../uploads'); 
console.log(`Serving static files from backend: ${backendUploadsDir}`);
app.use('/uploads', express.static(backendUploadsDir));
const projectUploadsDir = path.join(__dirname, '../../../uploads');
console.log(`Serving static files from project root: ${projectUploadsDir}`);
app.use('/uploads', express.static(projectUploadsDir));
app.get('/uploads/pdfs/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename;
  let filePath = path.join(backendUploadsDir, 'pdfs', filename);
  if (!require('fs').existsSync(filePath)) {
    filePath = path.join(projectUploadsDir, 'pdfs', filename);
  }
  console.log(`Serving PDF file: ${filePath}`);
  res.setHeader('Content-Type', 'application/pdf');
  res.removeHeader('X-Frame-Options');
  res.sendFile(filePath);
});
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/logs', logRoutes); 
app.use('/api/trainings', trainingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/bootcamps', bootcampRoutes);
app.use('/api/conferences', conferenceRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/ai-assistant', aiAssistantRoutes);
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global hata middleware:');
  console.error('HTTP Metodu:', req.method);
  console.error('URL:', req.originalUrl);
  const masked = { ...req.body };
  if (masked.password) masked.password = '******';
  console.error('Body:', JSON.stringify(masked, null, 2));
  console.error('Hata:', err);
  if (err.name === 'SyntaxError') {
    return res.status(400).json({
      message: 'JSON formatında sözdizimi hatası',
      error: err.message,
      body: req.body
    });
  }
  res.status(err.status || 500).json({
    message: err.message || 'Sunucu hatası',
    error: process.env.NODE_ENV === 'development' ? err.toString() : undefined
  });
});
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Eğitim Portal API',
    version: '1.0.0'
  });
});
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Sayfa bulunamadı'
  });
});
const server: http.Server = app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
  console.log(`API adresi: http://localhost:${PORT}/api`);
});
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} sinyali alındı. Sunucu kapatılıyor...`);
  server.close(async () => {
    console.log('HTTP sunucusu kapatıldı.');
    try {
      await pool.end();
      console.log('Veritabanı bağlantı havuzu kapatıldı.');
      process.exit(0);
    } catch (err) {
      console.error('Veritabanı havuzu kapatılırken hata:', err);
      process.exit(1);
    }
  });
  setTimeout(() => {
    console.error('Sunucu zamanında kapatılamadı, çıkmaya zorlanıyor...');
    process.exit(1);
  }, 10000);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
