import React, { useEffect } from 'react';
import TrainingGrid from '../components/training/TrainingGrid';
import { useNavigate } from 'react-router-dom';
import { tokenService } from '../lib/api/apiClient'; 
import { UserRole } from '../types'; 

const TrainingsPage: React.FC = () => {
  const navigate = useNavigate();
  const user = tokenService.getUser();

  useEffect(() => {
    
    if (user && (user.role === UserRole.ADMIN_JUNIOR || user.role === UserRole.ADMIN_SENIOR)) {
      console.log('Admin kullanıcısı /trainings adresine geldi, /admin/trainings adresine yönlendiriliyor.');
      navigate('/dashboard/admin/trainings', { replace: true });
    }
  }, [user, navigate]);

  
  
  
  if (!user || (user.role !== UserRole.ADMIN_JUNIOR && user.role !== UserRole.ADMIN_SENIOR)) {
    return <TrainingGrid />;
  }

  
  return null; 
};

export default TrainingsPage;