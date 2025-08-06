import { Request, Response } from 'express';
import { aiAssistantService } from '../services/aiAssistantService';
export const getAIRecommendation = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const userId = (req as any).user?.id;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Mesaj gereklidir'
      });
    }
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama gerekli'
      });
    }
    console.log(`[AI Assistant] Kullanıcı ${userId} sorusu: ${message}`);
    const recommendation = await aiAssistantService.generateLearningRecommendation(message, userId);
    await aiAssistantService.saveChatHistory(userId, message, recommendation);
    console.log(`[AI Assistant] Yanıt oluşturuldu: ${recommendation.substring(0, 100)}...`);
    res.status(200).json({
      success: true,
      data: {
        message: recommendation,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('[AI Assistant] Hata:', error);
    res.status(500).json({
      success: false,
      message: 'AI önerisi oluşturulurken bir hata oluştu',
      error: error.message
    });
  }
};
export const getQuickReplies = async (req: Request, res: Response) => {
  try {
    const quickReplies = aiAssistantService.getQuickReplies();
    res.status(200).json({
      success: true,
      data: quickReplies
    });
  } catch (error: any) {
    console.error('[AI Assistant] Quick replies hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Hazır sorular yüklenirken hata oluştu',
      error: error.message
    });
  }
};
export const getAvailableTrainings = async (req: Request, res: Response) => {
  try {
    const trainings = await aiAssistantService.getAvailableTrainings();
    res.status(200).json({
      success: true,
      data: trainings
    });
  } catch (error: any) {
    console.error('[AI Assistant] Eğitimler alınırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Eğitimler yüklenirken hata oluştu',
      error: error.message
    });
  }
};