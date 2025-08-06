import { Request, Response } from 'express';
import * as trainingService from '../services/trainingService';
import * as userService from '../services/userService';
import * as quizService from '../services/quizService';
import { Training, UserRole } from '../../types';
export const getAllTrainingsHandler = async (_req: Request, res: Response) => {
  try {
    const trainings = await trainingService.getAllTrainings();
    res.json(trainings);
  } catch (error) {
    console.error('Eğitimler getirilirken hata:', error);
    res.status(500).json({ message: 'Eğitimler getirilirken bir hata oluştu.' });
  }
};
export const getTrainingByIdHandler = async (req: Request, res: Response) => {
  const trainingId = req.params.trainingId;
  if (!trainingId) {
    return res.status(400).json({ message: 'Geçersiz Eğitim IDsi.' });
  }
  try {
    const training = await trainingService.getTrainingById(trainingId);
    if (!training) {
      return res.status(404).json({ message: 'Eğitim bulunamadı.' });
    }
    res.json(training);
  } catch (error) {
    console.error(`ID ${trainingId} olan eğitim getirilirken hata:`, error);
    res.status(500).json({ message: 'Eğitim getirilirken bir hata oluştu.' });
  }
};
export const createTrainingHandler = async (req: Request, res: Response) => {
  try {
    const { 
      title, 
      description, 
      category, 
      duration, 
      author, 
      published, 
      isMandatory, 
      certificateTemplate,
      content,
      deadline
    } = req.body;
    if (!title || !author) {
      return res.status(400).json({ 
        success: false, 
        message: 'Başlık ve yazar alanları zorunludur.' 
      });
    }
    let parsedDuration = null;
    if (duration) {
      const durationNum = parseInt(String(duration));
      if (!isNaN(durationNum) && durationNum > 0) {
        parsedDuration = durationNum;
      }
    }
    const parsedPublished = published !== undefined ? Boolean(published) : false;
    const parsedIsMandatory = isMandatory !== undefined ? Boolean(isMandatory) : false;
    let parsedDeadline: string | null = null;
    if (deadline) {
      if (typeof deadline === 'string' && /\d{4}-\d{2}-\d{2}/.test(deadline)) {
        parsedDeadline = deadline;
      } else {
        console.warn('[trainingController] Geçersiz deadline formatı:', deadline);
      }
    }
    const sanitizeText = (text: string | null | undefined): string | null => {
      if (!text) return null;
      return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };
    const trainingData = {
      title: sanitizeText(title) || '',
      description: sanitizeText(description),
      category: sanitizeText(category),
      duration: parsedDuration,
      author: sanitizeText(author) || '',
      published: parsedPublished,
      isMandatory: parsedIsMandatory,
      certificateTemplate: sanitizeText(certificateTemplate),
      content,
      deadline: parsedDeadline
    } as any;
    console.log('[trainingController] İşlenmiş eğitim verisi:', trainingData);
    const newTraining = await trainingService.createTraining(trainingData);
    res.status(201).json({
      success: true,
      message: 'Eğitim başarıyla oluşturuldu.',
      data: newTraining
    });
  } catch (error: any) {
    console.error('[trainingController] Eğitim oluşturulurken hata:', error);
    const errorMessage = error.message || 'Eğitim oluşturulurken bir sunucu hatası oluştu.';
    res.status(500).json({ 
      success: false, 
      message: 'Eğitim oluşturulurken bir hata oluştu. ' + (error?.message || ''),
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
};
export const updateTrainingHandler = async (req: Request, res: Response) => {
  try {
    const trainingId = req.params.trainingId;
    console.log(`\n[NEW trainingController] updateTrainingHandler - ID: ${trainingId}`);
    console.log(`[NEW trainingController] updateTrainingHandler - İstek gövdesi:`, JSON.stringify(req.body));
    if (!trainingId) {
      return res.status(400).json({ 
        success: false,
        message: 'Eğitim ID parametresi eksik veya geçersiz.' 
      });
    }
    const {
      title,
      description,
      category,
      duration,
      author,
      published,
      isMandatory,
      deadline,
    } = req.body;
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (duration !== undefined) updateData.duration = duration;
    if (author !== undefined) updateData.author = author;
    if (published !== undefined) updateData.published = published;
    if (isMandatory !== undefined) updateData.isMandatory = Boolean(isMandatory);
    if (deadline !== undefined) {
      if (deadline === null) {
        updateData.deadline = null;
      } else if (typeof deadline === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
        updateData.deadline = deadline;
      } else {
        return res.status(400).json({ 
          success: false,
          message: 'Deadline formatı geçersiz. YYYY-MM-DD formatında olmalı.'
        });
      }
    }
    console.log(`[NEW trainingController] Güncelleme için hazırlanan veri:`, updateData);
    const updatedTraining = await trainingService.updateTraining(trainingId, updateData);
    if (!updatedTraining) {
      return res.status(404).json({ 
        success: false,
        message: `ID: ${trainingId} olan eğitim bulunamadı.` 
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Eğitim başarıyla güncellendi.',
      data: updatedTraining
    });
  } catch (error: any) {
    console.error(`[NEW trainingController] Eğitim güncelleme hatası:`, error);
    return res.status(500).json({
      success: false,
      message: 'Eğitim güncellenirken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
};
export const deleteTrainingHandler = async (req: Request, res: Response) => {
  const id = req.params.trainingId;
  if (!id) {
    return res.status(400).json({ message: 'Geçersiz Eğitim IDsi.' });
  }
  try {
    console.log(`[deleteTrainingHandler] Eğitim silme talebi alındı, ID: ${id}`);
    const result = await trainingService.deleteTraining(id);
    if (!result) {
      console.log(`[deleteTrainingHandler] Silinecek eğitim bulunamadı, ID: ${id}`);
      return res.status(404).json({ message: 'Eğitim bulunamadı.' });
    }
    console.log(`[deleteTrainingHandler] Eğitim başarıyla silindi, ID: ${id}`);
    res.status(204).send();
  } catch (error) {
    console.error(`ID ${id} olan eğitim silinirken hata:`, error);
    res.status(500).json({ message: 'Eğitim silinirken bir hata oluştu.' });
  }
};
export const updateTrainingContentHandler = async (req: Request, res: Response) => {
  try {
    const trainingId = req.params.trainingId;
    console.log(`\n[updateTrainingContentHandler] - Eğitim ID: ${trainingId}`);
    console.log(`[updateTrainingContentHandler] - İstek gövdesi:`, JSON.stringify(req.body));
    if (!trainingId) {
      return res.status(400).json({ 
        success: false,
        message: 'Eğitim ID parametresi eksik veya geçersiz.' 
      });
    }
    const contentData = req.body;
    console.log(`[updateTrainingContentHandler] - Eğitim içeriği güncelleniyor, ID: ${trainingId}`);
    const updatedTraining = await trainingService.updateTrainingContent(trainingId, contentData);
    if (!updatedTraining) {
      console.log(`[updateTrainingContentHandler] - Eğitim bulunamadı, ID: ${trainingId}`);
      return res.status(404).json({ 
        success: false,
        message: `ID: ${trainingId} olan eğitim bulunamadı.` 
      });
    }
    console.log(`[updateTrainingContentHandler] - Eğitim içeriği başarıyla güncellendi, ID: ${trainingId}`);
    return res.status(200).json({
      success: true,
      message: 'Eğitim içeriği başarıyla güncellendi.',
      data: updatedTraining
    });
  } catch (error: any) {
    const trainingId = req.params.trainingId || 'bilinmiyor';
    console.error(`[updateTrainingContentHandler] - Eğitim içeriği güncelleme hatası, ID: ${trainingId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Eğitim içeriği güncellenirken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
};
export const getTrainingProgressHandler = async (req: Request, res: Response) => {
  const trainingId = req.params.trainingId;
  const userId = req.params.userId;
  if (!trainingId || !userId) {
    return res.status(400).json({ message: 'Eğitim ID veya Kullanıcı ID eksik.' });
  }
  try {
    const progress = await trainingService.getTrainingProgress(trainingId, userId);
    if (!progress) {
      return res.status(200).json({ 
          progress: 0, 
          completed: false, 
          completedItems: [], 
          quizResults: [], 
          status: 'NOT_ENROLLED'
      }); 
    }
    res.json(progress);
  } catch (error) {
    console.error(`Kullanıcı ${userId}, Eğitim ${trainingId} progress getirilirken hata:`, error);
    res.status(500).json({ message: 'Eğitim ilerlemesi getirilirken bir hata oluştu.' });
  }
};
export const updateTrainingProgressHandler = async (req: Request, res: Response) => {
  const { trainingId, userId } = req.params;
  const updateData = req.body;
  if (!trainingId || !userId) {
    return res.status(400).json({ message: 'Eğitim ID ve Kullanıcı ID gereklidir' });
  }
  console.log(`[trainingController] Eğitim ilerleme güncellemesi: trainingId=${trainingId}, userId=${userId}, data:`, updateData);
  const validUpdateData: { 
    contentId?: string; 
    progress?: number; 
    status?: string; 
    completedItems?: string[];
    completed?: boolean; 
    bootcampId?: string | null; 
  } = {};
  if (updateData.contentId !== undefined && typeof updateData.contentId === 'string') {
    validUpdateData.contentId = updateData.contentId;
  }
  if (updateData.status !== undefined && typeof updateData.status === 'string') {
    validUpdateData.status = updateData.status;
    console.log(`[trainingController] Status update: ${updateData.status}`);
    if (updateData.status === 'COMPLETED') {
      validUpdateData.completed = true;
      console.log(`[trainingController] Manuel olarak status=COMPLETED atandı, eğitimi tamamlanmış olarak işaretliyorum`);
    }
  }
  if (updateData.progress !== undefined) {
    const progress = Number(updateData.progress);
    if (!isNaN(progress) && progress >= 0 && progress <= 100) {
      validUpdateData.progress = progress;
    }
  }
  if (Array.isArray(updateData.completedItems)) {
    validUpdateData.completedItems = updateData.completedItems.filter((item: unknown) => typeof item === 'string');
  }
  if (updateData.completed !== undefined) {
    validUpdateData.completed = Boolean(updateData.completed);
    console.log(`[trainingController] Manuel completed değeri: ${validUpdateData.completed}`);
    if (validUpdateData.completed === true && validUpdateData.status === undefined) {
      validUpdateData.status = 'COMPLETED';
      console.log(`[trainingController] Manuel completed=true atandı, status=COMPLETED olarak da ayarlandı`);
    }
  }
  if (updateData.bootcampId !== undefined) {
    if (typeof updateData.bootcampId === 'string' && updateData.bootcampId.trim() !== '') {
      validUpdateData.bootcampId = updateData.bootcampId;
    } else if (updateData.bootcampId === null) {
      validUpdateData.bootcampId = null;
    }
  }
  try {
    console.log(`[trainingController] trainingService.updateTrainingProgress çağrılıyor: validUpdateData=`, validUpdateData);
    const updatedProgress = await trainingService.updateTrainingProgress(trainingId, userId, validUpdateData);
    if (!updatedProgress) {
      return res.status(404).json({ message: 'Eğitim ilerleme kaydı bulunamadı veya güncellenemedi' });
    }
    res.json(updatedProgress);
  } catch (error: any) {
    console.error('Eğitim ilerleme güncelleme hatası:', error);
    res.status(500).json({ 
      message: 'Eğitim ilerleme durumu güncellenirken bir hata oluştu.', 
      error: error.message 
    });
  }
};
export const getQuizzesForTrainingHandler = async (req: Request, res: Response) => {
  try {
    const { trainingId } = req.params;
    if (!trainingId) {
      return res.status(400).json({ success: false, message: 'Eğitim ID gereklidir' });
    }
    const quizzes = await quizService.getQuizzesForTraining(trainingId);
    return res.status(200).json({
      success: true,
      data: quizzes
    });
  } catch (error) {
    console.error('[trainingController] Eğitim sınavları getirme hatası:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Eğitim sınavları getirilirken bir hata oluştu.' 
    });
  }
};
export const submitQuizAttemptHandler = async (req: Request, res: Response) => {
  try {
    const { trainingId, quizId } = req.params;
    const { answers } = req.body;
    const userId = req.user?.id;
    if (!trainingId || !quizId) {
      return res.status(400).json({ success: false, message: 'Eğitim ID ve Quiz ID gereklidir' });
    }
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Oturum açmanız gerekiyor' });
    }
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ success: false, message: 'Geçerli cevaplar göndermeniz gerekiyor' });
    }
    const result = await quizService.submitQuizAttempt(userId, quizId, trainingId, answers);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[trainingController] Sınav denemesi gönderme hatası:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Sınav denemesi kaydedilirken bir hata oluştu.' 
    });
  }
};
export const getQuizAttemptsForUserHandler = async (req: Request, res: Response) => {
  try {
    const { trainingId, quizId } = req.params;
    const userId = req.user?.id;
    if (!trainingId || !quizId) {
      return res.status(400).json({ success: false, message: 'Eğitim ID ve Quiz ID gereklidir' });
    }
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Oturum açmanız gerekiyor' });
    }
    const attempts = await quizService.getQuizAttemptsForUser(userId, quizId);
    return res.status(200).json({
      success: true,
      data: attempts
    });
  } catch (error) {
    console.error('[trainingController] Sınav denemeleri getirme hatası:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Sınav denemeleri getirilirken bir hata oluştu.' 
    });
  }
};
export const getQuizStatusForTrainingHandler = async (req: Request, res: Response) => {
  console.log('[getQuizStatusForTrainingHandler] Handler başladı. req.user:', req.user);
  try {
    const { trainingId } = req.params;
    const userId = req.user?.id !== undefined && req.user?.id !== null ? Number(req.user.id) : undefined;
    if (!trainingId) {
      console.warn('[getQuizStatusForTrainingHandler] Hata: Eğitim ID (trainingId) eksik.');
      return res.status(400).json({ success: false, message: 'Eğitim ID gereklidir' });
    }
    if (userId === undefined) { 
      console.error('[getQuizStatusForTrainingHandler] Hata: Kullanıcı ID bulunamadı (req.user.id tanımsız veya null).');
      return res.status(401).json({ success: false, message: 'Oturum açmanız gerekiyor veya token geçersiz.' });
    }
    console.log(`[getQuizStatusForTrainingHandler] Service çağrılıyor: userId=${userId} (tip: ${typeof userId}), trainingId=${trainingId}`);
    const quizStatus = await quizService.getUserQuizStatusForTraining(userId, trainingId);
    return res.status(200).json({
      success: true,
      data: quizStatus
    });
  } catch (error: any) {
    console.error('[getQuizStatusForTrainingHandler] Sınav durumu getirme sırasında genel hata:', error.message, error.stack);
    if (error.message && error.message.includes('Kullanıcı ID veya Eğitim ID eksik')) {
        return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Sınav durumu getirilirken bir sunucu hatası oluştu.' 
    });
  }
};
export const addTrainingContentHandler = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not Implemented: addTrainingContentHandler' });
};
export const getTrainingContentHandler = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not Implemented: getTrainingContentHandler' });
};
export const getMyEnrollmentsHandler = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not Implemented: getMyEnrollmentsHandler' });
};
export const assignTrainingHandler = async (req: Request, res: Response) => {
  const { userId } = req.body;
  const { trainingId } = req.params;
  if (!userId || !trainingId) {
    return res.status(400).json({ message: 'userId ve trainingId gereklidir.' });
  }
  const parsedUserId = parseInt(String(userId));
  if (isNaN(parsedUserId)) {
    return res.status(400).json({ message: 'Geçersiz kullanıcı IDsi. Sayı olmalıdır.' });
  }
  if (typeof trainingId !== 'string' || trainingId.trim() === '') {
    return res.status(400).json({ message: 'Geçersiz eğitim IDsi.' });
  }
  try {
    console.log(`[trainingController] Eğitim atama isteği: Kullanıcı ${parsedUserId}, Eğitim ${trainingId}`);
    const result = await trainingService.assignTrainingToUser(parsedUserId, trainingId);
    if ('assignmentId' in result) {
      return res.status(201).json({ 
        success: true, 
        message: 'Eğitim başarıyla kullanıcıya atandı.', 
        assignmentId: result.assignmentId 
      });
    } else {
      console.warn(`[trainingController] Eğitim atama hatası: ${result.error} (Kod: ${result.errorCode})`);
      let statusCode = 500;
      if (result.errorCode === 'already_assigned') {
        statusCode = 409;
      } else if (result.errorCode === 'invalid_ids') {
        statusCode = 400;
      }
      return res.status(statusCode).json({ 
        success: false, 
        message: result.error 
      });
    }
  } catch (error) {
    console.error('[trainingController] assignTrainingHandler genel hata:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Eğitim atanırken beklenmedik bir sunucu hatası oluştu.' 
    });
  }
};
export const getAssignmentsForTrainingHandler = async (req: Request, res: Response) => {
  try {
    const trainingId = req.params.trainingId;
    if (req.user && req.user.role === UserRole.EMPLOYEE) {
      const userIdNum = Number(req.user.id);
      const isAssigned = await trainingService.isUserAssignedToTraining(userIdNum, trainingId);
      return res.json({
        success: true,
        data: isAssigned ? [userIdNum] : []
      });
    } else {
      const assignments = await trainingService.getTrainingAssignmentsByTrainingId(trainingId);
      return res.json({ success: true, data: assignments });
    }
  } catch (error) {
    console.error(`Error fetching assignments for training ${req.params.trainingId}:`, error);
    return res.status(500).json({ success: false, message: 'Atamalar getirilirken bir hata oluştu.' });
  }
};
export const unassignTrainingHandler = async (req: Request, res: Response) => {
  const { trainingId, userId } = req.params;
  if (!trainingId || !userId) {
    return res.status(400).json({ success: false, message: 'Eğitim IDsi ve Kullanıcı IDsi gereklidir.' });
  }
  const numericUserId = parseInt(userId, 10);
  if (isNaN(numericUserId)) {
    return res.status(400).json({ success: false, message: 'Geçersiz Kullanıcı IDsi formatı.' });
  }
  try {
    const result = await trainingService.unassignTrainingFromUser(numericUserId, trainingId);
    if (result.success) {
      return res.status(200).json({ 
        success: true, 
        message: 'Eğitim ataması başarıyla kaldırıldı.' 
      });
    } else {
      let statusCode = 500;
      if (result.message?.includes('bootcamp')) {
        statusCode = 400;
      } else if (result.message?.includes('bulunamadı')) {
        statusCode = 404;
      }
      return res.status(statusCode).json({ 
        success: false, 
        message: result.message || 'Eğitim ataması kaldırılırken bir hata oluştu.' 
      });
    }
  } catch (error: any) {
    console.error(`[trainingController] Kullanıcı ${userId} için eğitim ${trainingId} ataması kaldırılırken hata:`, error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Eğitim ataması kaldırılırken bir sunucu hatası oluştu.' 
    });
  }
};
export const getAssignedTrainingsForUserHandler = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    console.error('[trainingController] Kullanıcı kimliği token içinde bulunamadı veya authenticate middleware çalışmadı.');
    return res.status(401).json({ message: 'Yetkisiz erişim veya geçersiz token.' });
  }
  try {
    console.log(`[trainingController] Kullanıcı ${userId} için atanmış eğitimler getiriliyor.`);
    const assignedTrainings = await trainingService.getAssignedTrainings(userId);
    res.status(200).json(assignedTrainings);
  } catch (error) {
    console.error(`[trainingController] Kullanıcı ${userId} için atanmış eğitimler getirilirken hata:`, error);
    res.status(500).json({ message: 'Atanmış eğitimler getirilirken bir sunucu hatası oluştu.' });
  }
}; 
export const getAllRelevantTrainingsForUserHandler = async (req: Request, res: Response) => {
  const userIdParam = req.params.userId;
  if (!userIdParam) {
    return res.status(400).json({ message: 'Kullanıcı IDsi gereklidir.' });
  }
  const parsedUserId = parseInt(userIdParam, 10);
  if (isNaN(parsedUserId)) {
    return res.status(400).json({ message: 'Geçersiz Kullanıcı IDsi formatı.' });
  }
  try {
    console.log(`[trainingController] Kullanıcı ${parsedUserId} için ilgili tüm eğitimler getiriliyor.`);
    const relevantTrainings = await trainingService.getAllRelevantTrainingsForUser(parsedUserId);
    res.status(200).json(relevantTrainings);
  } catch (error) {
    console.error(`[trainingController] Kullanıcı ${parsedUserId} için ilgili eğitimler getirilirken hata:`, error);
    res.status(500).json({ message: 'İlgili eğitimler getirilirken bir sunucu hatası oluştu.' });
  }
};
export const getAssignedTrainingsHandler = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Kimlik doğrulanmadı veya kullanıcı ID bulunamadı.' });
  }
  try {
    console.log(`Controller: Kullanıcı ${userId} için atanmış eğitim isteği alındı.`);
    const trainings = await trainingService.getAssignedTrainings(userId);
    console.log(`Controller: Kullanıcı ${userId} için ${trainings.length} adet eğitim başarıyla getirildi.`);
    res.status(200).json({ success: true, data: trainings });
  } catch (error) {
    console.error(`Controller: Kullanıcı ${userId} için atanmış eğitimleri getirirken hata:`, error);
    const message = error instanceof Error ? error.message : 'Atanmış eğitimler alınırken bir sunucu hatası oluştu.';
    res.status(500).json({ success: false, message });
  }
};
export const getPublishedTrainingsHandler = async (req: Request, res: Response) => {
  try {
    const trainings = await trainingService.getPublishedTrainings();
    return res.status(200).json(trainings);
  } catch (error) {
    console.error('Error fetching published trainings:', error);
    return res.status(500).json({ message: 'Eğitimler getirilirken bir hata oluştu.' });
  }
};
