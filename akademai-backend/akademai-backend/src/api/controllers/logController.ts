import { Request, Response } from 'express';
import { logService, LogActionType } from '../services/logService';
import { UserRole } from '../../types';
export const logController = {
  async getLogs(req: Request, res: Response) {
    try {
      if (!req.user || (req.user.role !== UserRole.ADMIN_SENIOR && req.user.role !== UserRole.ADMIN_JUNIOR)) {
        await logService.createLog({
          action: LogActionType.API_ACCESS,
          description: 'Log kayıtlarına yetkisiz erişim girişimi',
          userId: req.user?.id,
          ...logService.extractRequestInfo(req)
        });
        return res.status(403).json({ 
          success: false, 
          error: 'Bu işlem için yetkiniz bulunmamaktadır.' 
        });
      }
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const action = req.query.action as string;
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
      }
      const result = await logService.getLogs({
        page,
        limit,
        userId,
        action,
        startDate,
        endDate
      });
      return res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      console.error('Log kayıtları getirme hatası:', error);
      return res.status(500).json({
        success: false,
        error: 'Log kayıtları alınırken bir hata oluştu.'
      });
    }
  },
  async getLogDetails(req: Request, res: Response) {
    try {
      const logId = parseInt(req.params.id);
      if (isNaN(logId)) {
        return res.status(400).json({
          success: false,
          error: 'Geçersiz log ID'
        });
      }
      if (!req.user || (req.user.role !== UserRole.ADMIN_SENIOR && req.user.role !== UserRole.ADMIN_JUNIOR)) {
        return res.status(403).json({ 
          success: false, 
          error: 'Bu işlem için yetkiniz bulunmamaktadır.' 
        });
      }
      const result = await logService.getLogs({
        page: 1,
        limit: 1,
      });
      const log = result.data.find((l: any) => l.id === logId);
      if (!log) {
        return res.status(404).json({
          success: false,
          error: 'Log kaydı bulunamadı'
        });
      }
      return res.json({
        success: true,
        data: log
      });
    } catch (error: any) {
      console.error('Log detayı getirme hatası:', error);
      return res.status(500).json({
        success: false,
        error: 'Log detayı alınırken bir hata oluştu'
      });
    }
  }
};
