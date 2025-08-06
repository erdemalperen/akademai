import express, { Request, Response, NextFunction } from 'express';
import { upload, copyToProjectRoot } from '../middleware/upload';
const router = express.Router();
router.post('/pdf', (req: Request, res: Response, next: NextFunction) => {
  const singleUpload = upload.single('pdf');
  singleUpload(req, res, async (err: any) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ message: err.message || 'Dosya yüklenemedi.' });
    }
    if (!req.file) {
      console.error('File not found after upload middleware');
      return res.status(400).json({ message: 'PDF dosyası yüklenemedi veya bulunamadı.' });
    }
    const backendFilePath = `/uploads/pdfs/${req.file.filename}`;
    console.log(`File uploaded successfully to backend: ${backendFilePath}`);
    copyToProjectRoot(req.file);
    res.status(200).json({
      message: 'PDF başarıyla yüklendi.',
      filePath: backendFilePath
    });
  });
});
export default router;