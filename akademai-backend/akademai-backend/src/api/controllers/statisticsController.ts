import { Request, Response } from 'express';
import { statisticsService } from '../services/statisticsService';
export const statisticsController = {
  async getMonthlyCompletedTrainings(req: Request, res: Response) {
    try {
      const count = await statisticsService.getMonthlyCompletedTrainingsCount();
      res.status(200).json(count);
    } catch (error: any) {
      console.error('[StatisticsController] Error in getMonthlyCompletedTrainings:', error);
      res.status(500).json({ message: error.message || 'İstatistikler alınırken bir sunucu hatası oluştu.' });
    }
  },
  async getAllCompletedTrainings(req: Request, res: Response) {
    try {
      const completedTrainings = await statisticsService.getAllCompletedTrainings();
      res.status(200).json(completedTrainings);
    } catch (error: any) {
      console.error('[StatisticsController] Error in getAllCompletedTrainings:', error);
      res.status(500).json({ message: error.message || 'Tamamlanan eğitimler alınırken bir sunucu hatası oluştu.' });
    }
  },
  async getUserTrainingProgressReport(req: Request, res: Response) {
    try {
      console.log('[StatisticsController] getUserTrainingProgressReport çağrıldı');
      const report = await statisticsService.getUserTrainingProgressReport();
      res.status(200).json(report);
    } catch (error: any) {
      console.error('[StatisticsController] Error in getUserTrainingProgressReport:', error);
      res.status(500).json({ 
        message: error.message || 'Kullanıcı eğitim devam durumları raporlanırken bir sunucu hatası oluştu.'
      });
    }
  },
  async getTrainingProgressByTrainingId(req: Request, res: Response) {
    try {
      const { trainingId } = req.params;
      if (!trainingId) {
        return res.status(400).json({ message: 'Eğitim ID parametresi gereklidir.' });
      }
      console.log(`[StatisticsController] getTrainingProgressByTrainingId çağrıldı, trainingId=${trainingId}`);
      const report = await statisticsService.getTrainingProgressByTrainingId(trainingId);
      res.status(200).json(report);
    } catch (error: any) {
      console.error('[StatisticsController] Error in getTrainingProgressByTrainingId:', error);
      res.status(500).json({ 
        message: error.message || 'Eğitim bazında devam durumları raporlanırken bir sunucu hatası oluştu.'
      });
    }
  },
  async getAllTrainingsProgress(req: Request, res: Response) {
    try {
      console.log('[StatisticsController] getAllTrainingsProgress çağrıldı');
      const report = await statisticsService.getAllTrainingsProgress();
      res.status(200).json(report);
    } catch (error: any) {
      console.error('[StatisticsController] Error in getAllTrainingsProgress:', error);
      res.status(500).json({ 
        message: error.message || 'Eğitimlerin ilerleme durumları raporlanırken bir sunucu hatası oluştu.'
      });
    }
  },
  async getUserConferenceTrainings(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ message: 'Kullanıcı ID parametresi gereklidir.' });
      }
      console.log(`[StatisticsController] getUserConferenceTrainings çağrıldı, userId=${userId}`);
      const conferenceTrainings = await statisticsService.getUserConferenceTrainings(parseInt(userId, 10));
      res.status(200).json(conferenceTrainings);
    } catch (error: any) {
      console.error('[StatisticsController] Error in getUserConferenceTrainings:', error);
      res.status(500).json({ 
        message: error.message || 'Kullanıcı konferans eğitimleri getirilirken bir sunucu hatası oluştu.'
      });
    }
  }
}; 