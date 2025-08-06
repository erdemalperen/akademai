import { Request, Response } from 'express';
import { bootcampService } from '../services/bootcampService';
import { Bootcamp } from '../../types/bootcamp';
export const getAllBootcampsHandler = async (req: Request, res: Response) => {
  try {
    const bootcamps = await bootcampService.getAllBootcamps();
    res.status(200).json(bootcamps);
  } catch (error: any) {
    console.error('Bootcamp\'ler getirilirken hata:', error);
    res.status(500).json({ message: 'Bootcamp\'ler getirilirken bir sunucu hatası oluştu.' });
  }
};
export const getBootcampByIdHandler = async (req: Request, res: Response) => {
  const { bootcampId } = req.params;
  const userId = req.user?.id !== undefined ? Number(req.user.id) : undefined; 
  console.log('[getBootcampByIdHandler] İstek alındı:', { 
    bootcampId, 
    userId,
    authHeader: req.headers.authorization ? 'Token var' : 'Token yok',
    user: req.user 
  });
  if (!bootcampId) {
    return res.status(400).json({ message: 'Bootcamp ID\'si gereklidir.' });
  }
  if (userId === undefined) { 
    console.error('[getBootcampByIdHandler] Kullanıcı ID\'si authenticate middleware\'inden alınamadı veya tanımsız.', { user: req.user });
    return res.status(401).json({ message: 'Bu işlem için giriş yapmanız gerekmektedir.' });
  }
  try {
    const bootcamp = await bootcampService.getBootcampById(bootcampId, userId);
    console.log('[getBootcampByIdHandler] Bootcamp verileri alındı:', { 
      bootcampId,
      hasData: !!bootcamp,
      trainingsCount: bootcamp ? (bootcamp as any).trainings?.length || 0 : 0
    });
    if (!bootcamp) {
      return res.status(404).json({ message: 'Bootcamp bulunamadı.' });
    }
    res.status(200).json(bootcamp);
  } catch (error: any) {
    console.error(`Bootcamp (ID: ${bootcampId}) getirilirken hata:`, error);
    res.status(500).json({ message: 'Bootcamp getirilirken bir sunucu hatası oluştu.' });
  }
};
export const createBootcampHandler = async (req: Request, res: Response) => {
  const rawBootcampData = req.body;
  const userId = req.user?.id ? Number(req.user.id) : undefined;
  if (!userId) {
    return res.status(401).json({ message: 'Yetkisiz erişim.' });
  }
  if (!rawBootcampData.title) {
    return res.status(400).json({ message: 'Bootcamp başlığı gereklidir.' });
  }
  const bootcampData = {
    title: rawBootcampData.title,
    description: rawBootcampData.description || undefined,
    category: rawBootcampData.category || undefined,
    author: rawBootcampData.author || undefined,
    published: rawBootcampData.published || false,
    duration: rawBootcampData.duration ? parseInt(String(rawBootcampData.duration), 10) : undefined,
    deadline: rawBootcampData.deadline ? new Date(rawBootcampData.deadline) : undefined
  };
  if (bootcampData.duration && isNaN(bootcampData.duration)) {
    return res.status(400).json({ message: 'Geçersiz süre (duration) formatı.' });
  }
  if (bootcampData.deadline && isNaN(bootcampData.deadline.getTime())) {
    return res.status(400).json({ message: 'Geçersiz son teslim tarihi (deadline) formatı.' });
  }
  try {
    const newBootcamp = await bootcampService.createBootcamp(bootcampData, userId);
    res.status(201).json(newBootcamp);
  } catch (error: any) {
    console.error('Bootcamp oluşturulurken hata:', error);
    res.status(500).json({ message: 'Bootcamp oluşturulurken bir sunucu hatası oluştu.' });
  }
};
export const updateBootcampHandler = async (req: Request, res: Response) => {
  console.log('[updateBootcampHandler] İstek başlangıcı', { params: req.params, user: req.user });
  const { bootcampId } = req.params;
  const rawBootcampData = req.body;
  if (!req.user || !req.user.role) {
    console.error('[updateBootcampHandler] Kullanıcı veya rol bilgisi bulunamadı', { user: req.user });
    return res.status(401).json({ message: 'Yetkisiz erişim. Kullanıcı bilgisi alınamadı.' });
  }
  const userId = req.user.id !== undefined ? Number(req.user.id) : 0;
  console.log('[updateBootcampHandler] userId:', userId);
  if (!bootcampId) {
    return res.status(400).json({ message: 'Bootcamp ID\'si gereklidir.' });
  }
  const bootcampData: Partial<Bootcamp> = {
    ...rawBootcampData,
    duration: rawBootcampData.duration !== undefined ? parseInt(String(rawBootcampData.duration), 10) : undefined,
    deadline: rawBootcampData.deadline !== undefined ? new Date(rawBootcampData.deadline) : undefined,
  };
  if (bootcampData.duration !== undefined && isNaN(bootcampData.duration)) {
    return res.status(400).json({ message: 'Geçersiz süre (duration) formatı.' });
  }
  if (bootcampData.deadline !== undefined && isNaN(bootcampData.deadline.getTime())) {
    return res.status(400).json({ message: 'Geçersiz son teslim tarihi (deadline) formatı.' });
  }
  try {
    const updatedBootcamp = await bootcampService.updateBootcamp(bootcampId, bootcampData, userId);
    res.status(200).json(updatedBootcamp);
  } catch (error: any) {
    console.error(`Bootcamp (ID: ${bootcampId}) güncellenirken hata:`, error);
    if (error.message === 'Güncellenecek bootcamp bulunamadı') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Bootcamp güncellenirken bir sunucu hatası oluştu.' });
  }
};
export const deleteBootcampHandler = async (req: Request, res: Response) => {
  const { bootcampId } = req.params;
  const userId = req.user?.id ? Number(req.user.id) : undefined;
  if (!userId) {
    return res.status(401).json({ message: 'Yetkisiz erişim.' });
  }
  if (!bootcampId) {
    return res.status(400).json({ message: 'Bootcamp ID\'si gereklidir.' });
  }
  try {
    await bootcampService.deleteBootcamp(bootcampId, userId);
    res.status(200).json({ message: 'Bootcamp başarıyla silindi.' });
  } catch (error: any) {
    console.error(`Bootcamp (ID: ${bootcampId}) silinirken hata:`, error);
    if (error.message === 'Silinecek bootcamp bulunamadı') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Bootcamp silinirken bir sunucu hatası oluştu.' });
  }
};
export const addTrainingToBootcampHandler = async (req: Request, res: Response) => {
  const { bootcampId } = req.params;
  const { trainingId, orderIndex, required } = req.body;
  if (!bootcampId) {
    return res.status(400).json({ message: 'Bootcamp ID\'si gereklidir.' });
  }
  if (!trainingId) {
    return res.status(400).json({ message: 'Eğitim ID\'si gereklidir.' });
  }
  if (orderIndex === undefined) {
    return res.status(400).json({ message: 'Sıra numarası gereklidir.' });
  }
  try {
    const bootcampTraining = await bootcampService.addTrainingToBootcamp(
      bootcampId,
      trainingId,
      orderIndex,
      required !== undefined ? required : true
    );
    res.status(201).json(bootcampTraining);
  } catch (error: any) {
    console.error('Bootcamp\'e eğitim eklenirken hata:', error);
    res.status(500).json({ message: 'Bootcamp\'e eğitim eklenirken bir sunucu hatası oluştu.' });
  }
};
export const removeTrainingFromBootcampHandler = async (req: Request, res: Response) => {
  const { bootcampId, trainingId } = req.params;
  if (!bootcampId) {
    return res.status(400).json({ message: 'Bootcamp ID\'si gereklidir.' });
  }
  if (!trainingId) {
    return res.status(400).json({ message: 'Eğitim ID\'si gereklidir.' });
  }
  try {
    await bootcampService.removeTrainingFromBootcamp(bootcampId, trainingId);
    res.status(200).json({ message: 'Eğitim bootcamp\'ten başarıyla çıkarıldı.' });
  } catch (error: any) {
    console.error('Bootcamp\'ten eğitim çıkarılırken hata:', error);
    if (error.message === 'Bootcamp\'te belirtilen eğitim bulunamadı') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Bootcamp\'ten eğitim çıkarılırken bir sunucu hatası oluştu.' });
  }
};
export const updateTrainingOrderHandler = async (req: Request, res: Response) => {
  const { bootcampId, trainingId } = req.params;
  const { newOrderIndex } = req.body;
  if (!bootcampId) {
    return res.status(400).json({ message: 'Bootcamp ID\'si gereklidir.' });
  }
  if (!trainingId) {
    return res.status(400).json({ message: 'Eğitim ID\'si gereklidir.' });
  }
  if (newOrderIndex === undefined) {
    return res.status(400).json({ message: 'Yeni sıra numarası gereklidir.' });
  }
  try {
    await bootcampService.updateTrainingOrder(bootcampId, trainingId, newOrderIndex);
    res.status(200).json({ message: 'Eğitim sırası başarıyla güncellendi.' });
  } catch (error: any) {
    console.error('Eğitim sırası güncellenirken hata:', error);
    if (error.message === 'Bootcamp\'te belirtilen eğitim bulunamadı') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Eğitim sırası güncellenirken bir sunucu hatası oluştu.' });
  }
};
export const assignBootcampToUserHandler = async (req: Request, res: Response) => {
  const { bootcampId } = req.params;
  const userIdToAssign = req.body.userId ? Number(req.body.userId) : undefined;
  const adminId = req.user?.id ? Number(req.user.id) : undefined;
  if (!adminId) {
    return res.status(401).json({ message: 'Yetkisiz erişim.' });
  }
  if (!bootcampId) {
    return res.status(400).json({ message: 'Bootcamp ID\'si gereklidir.' });
  }
  if (!userIdToAssign) {
    return res.status(400).json({ message: 'Kullanıcı ID\'si gereklidir.' });
  }
  try {
    const assignment = await bootcampService.assignBootcampToUser(bootcampId, userIdToAssign, adminId);
    res.status(201).json(assignment);
  } catch (error: any) {
    console.error(`Kullanıcı (ID: ${userIdToAssign}) için bootcamp (ID: ${bootcampId}) atanırken hata:`, error);
    if (error.message.includes('bulunamadı')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Bootcamp kullanıcıya atanırken bir sunucu hatası oluştu.' });
  }
};
export const unassignBootcampFromUserHandler = async (req: Request, res: Response) => {
  const { bootcampId } = req.params;
  const userIdToUnassign = req.params.userId ? Number(req.params.userId) : undefined;
  const adminId = req.user?.id ? Number(req.user.id) : undefined;
  if (!adminId) {
    return res.status(401).json({ message: 'Yetkisiz erişim.' });
  }
  if (!bootcampId) {
    return res.status(400).json({ message: 'Bootcamp ID\'si gereklidir.' });
  }
  if (!userIdToUnassign) {
    return res.status(400).json({ message: 'Kullanıcı ID\'si gereklidir.' });
  }
  try {
    await bootcampService.unassignBootcampFromUser(bootcampId, userIdToUnassign, adminId);
    res.status(200).json({ message: 'Bootcamp ataması başarıyla kaldırıldı.' });
  } catch (error: any) {
    console.error(`Kullanıcı (ID: ${userIdToUnassign}) için bootcamp (ID: ${bootcampId}) ataması kaldırılırken hata:`, error);
    if (error.message.includes('bulunamadı')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Bootcamp kullanıcıdan kaldırılırken bir sunucu hatası oluştu.' });
  }
};
export const getAssignedBootcampsForUserHandler = async (req: Request, res: Response) => {
  const userId = req.user?.id ? Number(req.user.id) : undefined;
  if (!userId) {
    return res.status(401).json({ message: 'Yetkisiz erişim.' });
  }
  try {
    const bootcamps = await bootcampService.getAssignedBootcampsForUser(userId);
    res.status(200).json(bootcamps);
  } catch (error: any) {
    console.error(`Kullanıcıya (ID: ${userId}) atanmış bootcamp'ler getirilirken hata:`, error);
    res.status(500).json({ message: 'Atanmış bootcamp\'ler getirilirken bir sunucu hatası oluştu.' });
  }
};
export const getAssignedUsersForBootcampHandler = async (req: Request, res: Response) => {
  const { bootcampId } = req.params;
  if (!bootcampId) {
    return res.status(400).json({ message: 'Bootcamp ID\'si gereklidir.' });
  }
  try {
    const users = await bootcampService.getAssignedUsersForBootcamp(bootcampId);
    res.status(200).json(users);
  } catch (error: any) {
    console.error(`Bootcamp'e (ID: ${bootcampId}) atanmış kullanıcılar getirilirken hata:`, error);
    res.status(500).json({ message: 'Atanmış kullanıcılar getirilirken bir sunucu hatası oluştu.' });
  }
};
export const updateBootcampProgressHandler = async (req: Request, res: Response) => {
  const { bootcampId } = req.params;
  const { currentTrainingIndex, progressPercentage } = req.body;
  const userId = req.user?.id ? Number(req.user.id) : undefined;
  if (!userId) {
    return res.status(401).json({ message: 'Yetkisiz erişim.' });
  }
  if (!bootcampId) {
    return res.status(400).json({ message: 'Bootcamp ID\'si gereklidir.' });
  }
  if (currentTrainingIndex === undefined) {
    return res.status(400).json({ message: 'Mevcut eğitim indeksi gereklidir.' });
  }
  if (progressPercentage === undefined) {
    return res.status(400).json({ message: 'İlerleme yüzdesi gereklidir.' });
  }
  try {
    const progress = await bootcampService.updateBootcampProgress(
      userId,
      bootcampId,
      currentTrainingIndex,
      progressPercentage
    );
    res.status(200).json(progress);
  } catch (error: any) {
    console.error('Bootcamp ilerleme durumu güncellenirken hata:', error);
    if (error.message === 'İlerleme kaydı bulunamadı') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Bootcamp ilerleme durumu güncellenirken bir sunucu hatası oluştu.' });
  }
};
export const completeBootcampHandler = async (req: Request, res: Response) => {
  const { bootcampId } = req.params;
  const userId = req.user?.id ? Number(req.user.id) : undefined;
  if (!userId) {
    return res.status(401).json({ message: 'Yetkisiz erişim.' });
  }
  if (!bootcampId) {
    return res.status(400).json({ message: 'Bootcamp ID\'si gereklidir.' });
  }
  try {
    const completedBootcamp = await bootcampService.completeBootcamp(userId, bootcampId);
    res.status(200).json(completedBootcamp);
  } catch (error: any) {
    console.error('Bootcamp tamamlama durumu güncellenirken hata:', error);
    if (error.message === 'Bootcamp ataması bulunamadı') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Bootcamp tamamlama durumu güncellenirken bir sunucu hatası oluştu.' });
  }
};
export const assignUserToBootcampHandler = async (req: Request, res: Response) => {
  const { bootcampId } = req.params;
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ message: 'Kullanıcı ID si gereklidir.' });
  }
  try {
    const existingAssignment = await bootcampService.checkAssignment(userId, bootcampId);
    if (existingAssignment) {
      return res.status(409).json({ message: 'Kullanıcı zaten bu bootcamp e atanmış.' });
    }
    const result = await bootcampService.assignUserToBootcamp(parseInt(userId, 10), bootcampId);
    res.status(201).json({ message: 'Kullanıcı başarıyla bootcamp e atandı.', assignment: result });
  } catch (error: any) {
    console.error('Bootcamp e kullanıcı atama hatası:', error);
    if (error.code === '23503') {
      if (error.constraint === 'user_bootcamp_assignments_user_id_fkey') {
        return res.status(404).json({ message: 'Atanmak istenen kullanıcı bulunamadı.' });
      } else if (error.constraint === 'user_bootcamp_assignments_bootcamp_id_fkey') {
        return res.status(404).json({ message: 'Bootcamp bulunamadı.' });
      }
    }
    res.status(500).json({ message: 'Kullanıcı atanırken bir sunucu hatası oluştu.', error: error.message });
  }
};
export const removeUserFromBootcampHandler = async (req: Request, res: Response) => {
  const { bootcampId, userId: userIdParam } = req.params;
  const userId = parseInt(userIdParam, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ message: 'Geçersiz Kullanıcı ID.' });
  }
  try {
    const result = await bootcampService.removeUserFromBootcamp(userId, bootcampId);
    if (!result) {
      return res.status(404).json({ message: 'Belirtilen kullanıcı bu bootcamp e atanmamış.' });
    }
    res.status(200).json({ message: 'Kullanıcı başarıyla bootcamp ten kaldırıldı.' });
  } catch (error: any) {
    console.error('Bootcamp ten kullanıcı kaldırma hatası:', error);
    res.status(500).json({ message: 'Kullanıcı kaldırılırken bir sunucu hatası oluştu.', error: error.message });
  }
};
export const getBootcampParticipantsHandler = async (req: Request, res: Response) => {
  const { bootcampId } = req.params;
  try {
    const result = await bootcampService.getBootcampParticipants(bootcampId);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Bootcamp katılımcılarını getirme hatası:', error);
    res.status(500).json({ message: 'Katılımcılar getirilirken bir sunucu hatası oluştu.', error: error.message });
  }
};
export const getAssignedBootcampsHandler = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Yetkilendirme hatası: Kullanıcı ID bulunamadı.' });
  }
  try {
    const result = await bootcampService.getAssignedBootcamps(userId);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Atanmış bootcamp leri getirme hatası:', error);
    res.status(500).json({ message: 'Atanmış bootcamp ler getirilirken bir sunucu hatası oluştu.', error: error.message });
  }
};
