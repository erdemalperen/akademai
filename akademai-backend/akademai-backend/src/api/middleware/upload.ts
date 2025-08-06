import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
const backendRoot = path.resolve(__dirname, '../../../..');
const backendUploadsDir = path.join(backendRoot, 'uploads');
const backendPdfsDir = path.join(backendUploadsDir, 'pdfs');
const backendVideosDir = path.join(backendUploadsDir, 'videos');
const projectRoot = path.resolve(__dirname, '../../../../../');
const projectUploadsDir = path.join(projectRoot, 'uploads');
const projectPdfsDir = path.join(projectUploadsDir, 'pdfs');
const projectVideosDir = path.join(projectUploadsDir, 'videos');
function ensureDirectoryExists(directory: string) {
  try {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
      console.log(`Created directory: ${directory}`);
    }
  } catch (err) {
    console.error(`Error creating directory ${directory}:`, err);
  }
}
try {
  ensureDirectoryExists(backendUploadsDir);
  ensureDirectoryExists(backendPdfsDir);
  ensureDirectoryExists(backendVideosDir);
  ensureDirectoryExists(projectUploadsDir);
  ensureDirectoryExists(projectPdfsDir);
  ensureDirectoryExists(projectVideosDir);
} catch (err) {
  console.error("Error creating upload directories:", err);
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir = backendUploadsDir;
    if (file.fieldname === 'video' || file.mimetype.startsWith('video/')) {
        uploadDir = backendVideosDir;
    } else if (file.fieldname === 'pdf' || file.mimetype === 'application/pdf') {
        uploadDir = backendPdfsDir;
    }
    ensureDirectoryExists(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const originalName = file.originalname;
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const cleanFileName = originalName.replace(/[^a-zA-Z0-9.]/g, '_');
    const safeFileName = `${timestamp}-${random}-${cleanFileName}`;
    cb(null, safeFileName);
  }
});
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm', 'video/ogg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Sadece izin verilen video formatları (MP4, MPEG, MOV, WEBM, OGG) veya PDF dosyaları yüklenebilir!'));
    }
};
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 }
});
export function copyToProjectRoot(file: Express.Multer.File) {
    if (!file) return;
    try {
        let sourceDir = backendUploadsDir;
        let destDir = projectUploadsDir;
        if (file.fieldname === 'video' || file.mimetype.startsWith('video/')) {
            sourceDir = backendVideosDir;
            destDir = projectVideosDir;
        } else if (file.fieldname === 'pdf' || file.mimetype === 'application/pdf') {
            sourceDir = backendPdfsDir;
            destDir = projectPdfsDir;
        }
        const sourceFile = path.join(sourceDir, file.filename);
        const destinationFile = path.join(destDir, file.filename);
        ensureDirectoryExists(destDir);
        fs.copyFileSync(sourceFile, destinationFile);
        console.log(`File also copied to project root: ${destinationFile}`);
    } catch (copyErr) {
        console.error('Error copying file to project root:', copyErr);
    }
}
