import { Request, Response } from 'express';
import * as userService from '../services/userService';
import { UserRole, LoginType } from '../../types';
import { generateToken } from '../utils/jwt';
import dotenv from 'dotenv';
dotenv.config();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers();
    return res.status(200).json({
      success: true,
      message: 'Tüm kullanıcılar başarıyla getirildi',
      data: users
    });
  } catch (error: any) {
    console.error('Tüm kullanıcıları getirme sırasında hata:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Kullanıcıları getirirken bir hata oluştu'
    });
  }
};
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Geçersiz kullanıcı ID' });
    }
    await userService.deleteUser(userId);
    return res.status(200).json({ success: true, message: 'Kullanıcı silindi' });
  } catch (error: any) {
    console.error('Kullanıcı silinirken hata:', error);
    return res.status(400).json({ success: false, message: error.message || 'Kullanıcı silinemedi' });
  }
};
export const updateUserDepartment = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const { departmentId } = req.body;
    if (!userId || !departmentId) {
      return res.status(400).json({ success: false, message: 'Geçersiz kullanıcı veya departman ID' });
    }
    await userService.updateUserDepartment(userId, departmentId);
    return res.status(200).json({ success: true, message: 'Departman güncellendi' });
  } catch (error: any) {
    console.error('Departman güncellenirken hata:', error);
    return res.status(400).json({ success: false, message: error.message || 'Departman güncellenemedi' });
  }
};
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Oturum açmanız gerekiyor' 
      });
    }
    const user = await userService.getUserById(userId);
    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error: any) {
    console.error('Profil bilgileri alınırken hata:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Kullanıcı profili alınamadı'
    });
  }
};
export const getAssignedBootcamps = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Kimlik doğrulanmadı veya kullanıcı ID bulunamadı' });
    }
    const bootcamps = await userService.getAssignedBootcampsByUserId(userId);
    return res.status(200).json({
      success: true,
      message: 'Atanmış bootcamp\ler başarıyla getirildi',
      data: bootcamps
    });
  } catch (error: any) {
    console.error('Atanmış bootcamp\leri getirme sırasında hata:', error);
    if (error.name === 'NotFoundError') {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Atanmış bootcamp\leri getirirken bir sunucu hatası oluştu'
    });
  }
};
export const loginAdmin = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Kullanıcı adı ve şifre gereklidir' });
  }
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const payload = { id: 0, email: process.env.ADMIN_EMAIL || '', role: UserRole.ADMIN_SENIOR };
    const token = generateToken(payload);
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
    });
    return res.status(200).json({ success: true, data: { user: payload, token } });
  } else {
    return res.status(401).json({ success: false, message: 'Geçersiz kimlik bilgileri.' });
  }
};
export const logout = async (req: Request, res: Response) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
  return res.status(200).json({ success: true, message: 'Başarıyla çıkış yapıldı.' });
};
export const grantAdminPermission = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { permissionLevel } = req.body;
  const adminId = req.user?.id;
  if (!req.user || typeof adminId !== 'number') { 
    return res.status(401).json({ message: 'Yetkilendirme hatası: Geçerli admin ID bulunamadı.' });
  }
  if (req.user.role !== 'ADMIN_SENIOR') {
    return res.status(403).json({ message: 'Bu işlem için ADMIN_SENIOR yetkisine sahip olmalısınız.' });
  }
  try {
    const result = await userService.grantAdminPermission(
      Number(userId), 
      adminId,
      permissionLevel || 'ADMIN_JUNIOR'
    );
    res.status(200).json({
      success: true,
      message: 'Yönetici yetkisi başarıyla verildi.',
      data: result
    });
  } catch (error: any) {
    console.error('Yönetici yetkisi verme hatası:', error);
    res.status(500).json({ 
      message: 'Yönetici yetkisi verilirken bir hata oluştu.',
      error: error.message 
    });
  }
};
export const revokeAdminPermission = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const adminId = req.user?.id;
  if (!req.user || typeof adminId !== 'number') {
    return res.status(401).json({ message: 'Yetkilendirme hatası: Geçerli admin ID bulunamadı.' });
  }
  if (req.user.role !== 'ADMIN_SENIOR') {
    return res.status(403).json({ message: 'Bu işlem için ADMIN_SENIOR yetkisine sahip olmalısınız.' });
  }
  try {
    const result = await userService.revokeAdminPermission(
      Number(userId), 
      adminId
    );
    res.status(200).json({
      success: true,
      message: 'Yönetici yetkisi başarıyla kaldırıldı.',
      data: result
    });
  } catch (error: any) {
    console.error('Yönetici yetkisi kaldırma hatası:', error);
    res.status(500).json({ 
      message: 'Yönetici yetkisi kaldırılırken bir hata oluştu.',
      error: error.message 
    });
  }
};
export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, departmentId, role = 'EMPLOYEE' } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Tüm alanlar zorunludur'
      });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz email formatı'
      });
    }
    const result = await userService.createUser({
      firstName,
      lastName,
      email,
      password,
      role: role as UserRole,
      loginType: LoginType.USERNAME_PASSWORD,
      departmentId: departmentId ? Number(departmentId) : undefined
    });
    const token = generateToken({
      id: result.user.id,
      email: result.user.email,
      role: result.user.role
    });
    res.status(201).json({
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu',
      token,
      user: result.user
    });
  } catch (error: any) {
    console.error('Kayıt hatası:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Kayıt sırasında bir hata oluştu'
    });
  }
};
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email ve şifre gereklidir'
      });
    }
    const result = await userService.authenticateUser(email, password);
    const token = generateToken({
      id: result.id,
      email: result.email,
      role: result.role
    });
    res.status(200).json({
      success: true,
      message: 'Giriş başarılı',
      token,
      user: result
    });
  } catch (error: any) {
    console.error('Giriş hatası:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Giriş başarısız'
    });
  }
};
export const getAllAdmins = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== 'ADMIN_SENIOR') {
    return res.status(403).json({ message: 'Bu işlem için ADMIN_SENIOR yetkisine sahip olmalısınız.' });
  }
  try {
    const admins = await userService.getAllAdmins();
    res.status(200).json({
      success: true,
      data: admins
    });
  } catch (error: any) {
    console.error('Yöneticileri getirme hatası:', error);
    res.status(500).json({ 
      message: 'Yöneticiler getirilirken bir hata oluştu.',
      error: error.message 
    });
  }
};
