import React, { useState, useEffect } from 'react';
import { User, Department, UserRole } from '../../types';
import Button from '../ui/Button';
import { ConfirmModal } from '../ui';
import axios from 'axios';
import { message } from 'antd';
import { authApi, tokenService } from '../../lib/api/apiClient';

interface UserDetailModalProps {
  user: User | null;
  departments: Department[];
  isOpen: boolean;
  onClose: () => void;
  onDelete: (userId: number) => void;
  onDepartmentChange: (userId: number, departmentId: number) => void;
  onUserUpdated?: () => void; 
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ 
  user, 
  departments, 
  isOpen, 
  onClose, 
  onDelete, 
  onDepartmentChange,
  onUserUpdated 
}) => {
  const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>(user?.departmentId);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const loggedInUser = tokenService.getUser();
    if (loggedInUser && loggedInUser.role) {
      setCurrentUserRole(loggedInUser.role as UserRole);
    }
  }, [isOpen]); 

  const handleAdminPermissionToggle = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const isAdmin = user.role === UserRole.ADMIN_JUNIOR || user.role === UserRole.ADMIN_SENIOR;
      
      let response;
      if (isAdmin) {
        response = await authApi.revokeAdminPermission(user.id);
      } else {
        response = await authApi.grantAdminPermission(user.id, { permissionLevel: UserRole.ADMIN_JUNIOR } as any);
      }
      
      if (response && response.success) {
        message.success(isAdmin 
          ? 'Yönetici yetkisi başarıyla kaldırıldı' 
          : 'Kullanıcı başarıyla yönetici yapıldı');
        
        if (onUserUpdated) {
          onUserUpdated();
        }
        onClose();
      } else {
        message.error(response?.message || 'İşlem sırasında bir hata oluştu');
      }
    } catch (error: any) {
      console.error('Yetki değişimi sırasında hata:', error);
      message.error(error?.message || 'Yetki değişimi sırasında bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !user) return null;
  
  const isTargetUserAdmin = user.role === UserRole.ADMIN_JUNIOR || user.role === UserRole.ADMIN_SENIOR;
  const canManagePermissions = currentUserRole === UserRole.ADMIN_SENIOR;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Kullanıcı Detayı</h2>
        <div className="mb-4">
          <div><b>Ad Soyad:</b> {user.name}</div>
          <div><b>E-posta:</b> {user.email}</div>
          <div><b>Rol:</b> {user.role === UserRole.EMPLOYEE ? 'Çalışan' : 
                            user.role === UserRole.ADMIN_JUNIOR ? 'Ara Yönetici' : 
                            user.role === UserRole.ADMIN_SENIOR ? 'Ana Yönetici' : user.role}
          </div>
          <div><b>Departman:</b>
            <select
              className="border rounded px-2 py-1 mt-1"
              value={selectedDepartment ?? user.departmentId ?? ''}
              onChange={e => setSelectedDepartment(Number(e.target.value))}
            >
              <option value="">Seçiniz</option>
              {departments.map(dep => (
                <option key={dep.id} value={dep.id}>{dep.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-between items-center flex-wrap gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Sil
          </Button>
          
          {}
          {canManagePermissions && user.role !== UserRole.ADMIN_SENIOR && (
            <Button
              variant={isTargetUserAdmin ? "outline" : "outline"}
              size="sm"
              onClick={handleAdminPermissionToggle}
              disabled={isLoading}
              className={isTargetUserAdmin ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}
            >
              {isLoading ? "İşleniyor..." : isTargetUserAdmin ? "Yetkiyi Al" : "Yönetici Yap (Junior)"}
            </Button>
          )}
          
          <Button
            variant="primary"
            onClick={() => {
              if (selectedDepartment && selectedDepartment !== user.departmentId) {
                onDepartmentChange(user.id, selectedDepartment);
              }
              onClose();
            }}
          >
            Kaydet
          </Button>
          <Button variant="outline" onClick={onClose}>Kapat</Button>
        </div>
      </div>
      
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => onDelete(user.id)}
        title="Kullanıcı Siliniyor"
        message="Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Evet, Kullanıcıyı Sil"
        danger={true}
      />
    </div>
  );
};

export default UserDetailModal;
