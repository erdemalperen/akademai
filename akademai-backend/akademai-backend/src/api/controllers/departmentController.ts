import { Request, Response } from 'express';
import * as departmentService from '../services/departmentService';
export const getAllDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await departmentService.getAllDepartments();
    return res.status(200).json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error('Departman listesi alınırken hata:', error);
    return res.status(500).json({
      success: false,
      message: 'Departman listesi alınırken bir hata oluştu'
    });
  }
};
export const getDepartmentById = async (req: Request, res: Response) => {
  try {
    const departmentId = parseInt(req.params.id);
    if (isNaN(departmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz departman kimliği'
      });
    }
    const department = await departmentService.getDepartmentById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Departman bulunamadı'
      });
    }
    return res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Departman detayı alınırken hata:', error);
    return res.status(500).json({
      success: false,
      message: 'Departman detayı alınırken bir hata oluştu'
    });
  }
};
export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Departman adı gereklidir'
      });
    }
    const sanitizedName = name.trim();
    const newDepartment = await departmentService.createDepartment({
      name: sanitizedName
    });
    return res.status(201).json({
      success: true,
      data: newDepartment,
      message: 'Departman başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Departman oluşturulurken hata:', error);
    if (error instanceof Error && error.message === 'Bu isimde bir departman zaten mevcut') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Departman oluşturulurken bir hata oluştu'
    });
  }
};
export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const departmentId = parseInt(req.params.id);
    const { name } = req.body;
    if (isNaN(departmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz departman kimliği'
      });
    }
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Departman adı gereklidir'
      });
    }
    const sanitizedName = name.trim();
    const updatedDepartment = await departmentService.updateDepartment(departmentId, {
      name: sanitizedName
    });
    return res.status(200).json({
      success: true,
      data: updatedDepartment,
      message: 'Departman başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Departman güncellenirken hata:', error);
    if (error instanceof Error) {
      if (error.message === 'Departman bulunamadı') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      if (error.message === 'Bu isimde bir departman zaten mevcut') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
    }
    return res.status(500).json({
      success: false,
      message: 'Departman güncellenirken bir hata oluştu'
    });
  }
};
export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const departmentId = parseInt(req.params.id);
    if (isNaN(departmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz departman kimliği'
      });
    }
    await departmentService.deleteDepartment(departmentId);
    return res.status(200).json({
      success: true,
      message: 'Departman başarıyla silindi'
    });
  } catch (error) {
    console.error('Departman silinirken hata:', error);
    if (error instanceof Error && error.message === 'Departman bulunamadı') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Departman silinirken bir hata oluştu'
    });
  }
};
