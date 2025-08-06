'use client';

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authApi } from '../../lib/api/apiClient';
import { Alert } from '@/components/ui/Alert';
import { Terminal, CheckCircle, Clock, PlayCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';



type BootcampDetail = {
  id: number | string;
  title: string;
  description?: string;
  category?: string;
  author?: string;
  published?: boolean;
  duration?: number;
  deadline?: string;
  createdAt?: string;
  updatedAt?: string;
  trainings: Array<{
    id: number | string; 
    bootcampId?: string;
    trainingId: number | string;
    orderIndex: number;
    required: boolean;
    training: { 
      id: number | string;
      title: string;
      description?: string;
      category?: string;
      duration?: number;
    };
    userProgress?: { 
      status?: string; 
      progressPercentage?: number;
      completedAt?: string | null;
    };
  }>;
};

const BootcampDetailPage: React.FC = () => {
  
  const { bootcampId } = useParams<{ bootcampId: string }>(); 

  const [bootcamp, setBootcamp] = useState<BootcampDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBootcampDetails = async () => {
      if (!bootcampId) {
        setIsLoading(false);
        setError('Geçersiz Bootcamp ID.');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log(`Fetching details for bootcamp: ${bootcampId}`);
        const response = await authApi.getBootcampById(bootcampId);
        
        
        if (response && typeof response === 'object') {
          if (response.success === true && response.data) {
            setBootcamp(response.data);
            console.log('Bootcamp details fetched:', response.data);
          } else if (response.success === false) {
            
            const errorMessage = (response as any).message || 'Bootcamp verisi alınamadı (success:false).';
            console.warn('API success:false döndürdü:', response);
            throw new Error(errorMessage);
          } else {
            
            console.warn('Bootcamp API beklenmeyen veri formatı döndürdü (success veya data eksik):', response);
            setBootcamp({
              id: bootcampId,
              title: "Demo Bootcamp (Format Hatası)",
              description: "API beklenmeyen veri formatı döndürdü, demo veri gösteriliyor",
              trainings: []
            });
          }
        } else {
          
          console.warn('Bootcamp API yanıtı obje değil veya tanımsız:', response);
          throw new Error('API yanıtı alınamadı veya geçersiz formatta.');
        }
      } catch (err: any) {
        console.error(`Error fetching bootcamp details for ID ${bootcampId}:`, err);
        
        if (err.response?.status === 404) {
          setError('Belirtilen ID ile bootcamp bulunamadı.');
        } else if (err.response?.status === 401 || err.response?.status === 403) {
          setError('Bu bootcamp detaylarını görüntüleme yetkiniz yok.');
        } else {
          setError(err.message || 'Bootcamp detayları yüklenirken bir hata oluştu.');
        }
        
        
        setBootcamp({
          id: bootcampId,
          title: "Demo Bootcamp",
          description: "Hata nedeniyle demo veri gösteriliyor",
          trainings: []
        });
      } finally {
        setIsLoading(false);
      }
    };

    
    if (bootcampId) { 
      fetchBootcampDetails();
    }
  }, [bootcampId]); 

  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="h-6 bg-gray-300 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert title="Hata" description={error}>
          <Terminal className="h-4 w-4" />
        </Alert>
      </div>
    );
  }

  
  if (!bootcamp) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Bootcamp bulunamadı.</p>
      </div>
    );
  }

  
  const getStatusIcon = (status: string | undefined) => {
    switch(status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <PlayCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  
  const getStatusText = (status: string | undefined) => {
    switch(status) {
      case 'completed':
        return 'Tamamlandı';
      case 'in_progress':
        return 'Devam Ediyor';
      default:
        return 'Başlanmadı';
    }
  };

  
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{bootcamp.title}</CardTitle>
          {bootcamp.description && <CardDescription className="text-gray-600">{bootcamp.description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <h2 className="text-2xl font-semibold mb-4">Eğitimler</h2>
          
          {bootcamp.trainings && bootcamp.trainings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bootcamp.trainings.map((trainingItem) => (
                <Link 
                  to={`/dashboard/trainings/${trainingItem.training.id}`} 
                  key={trainingItem.id} 
                  className="block hover:no-underline"
                >
                  <Card className="h-full hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold">
                        {trainingItem.orderIndex + 1}. {trainingItem.training.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {}
                      <div className="flex flex-col items-center justify-center mb-4">
                        <div className="relative h-24 w-24">
                          <svg className="h-24 w-24" viewBox="0 0 100 100">
                            {}
                            <circle 
                              className="text-gray-200" 
                              strokeWidth="8" 
                              stroke="currentColor" 
                              fill="transparent" 
                              r="40" 
                              cx="50" 
                              cy="50" 
                            />
                            {}
                            <circle 
                              className={`${
                                trainingItem.userProgress?.status === 'completed' 
                                  ? 'text-green-500' 
                                  : trainingItem.userProgress?.status === 'in_progress' 
                                    ? 'text-yellow-500' 
                                    : 'text-blue-500'
                              }`}
                              strokeWidth="8" 
                              strokeLinecap="round" 
                              stroke="currentColor" 
                              fill="transparent" 
                              r="40" 
                              cx="50" 
                              cy="50" 
                              strokeDasharray={`${2 * Math.PI * 40}`}
                              strokeDashoffset={`${2 * Math.PI * 40 * (1 - (trainingItem.userProgress?.progressPercentage || 0) / 100)}`}
                              transform="rotate(-90 50 50)" 
                            />
                          </svg>
                          {}
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg font-bold">{trainingItem.userProgress?.progressPercentage || 0}%</span>
                            <div className="mt-1">
                              {getStatusIcon(trainingItem.userProgress?.status)}
                            </div>
                          </div>
                        </div>
                        <div className="text-center mt-2">
                          <span className="text-sm font-medium">
                            {getStatusText(trainingItem.userProgress?.status)}
                          </span>
                          {trainingItem.userProgress?.completedAt && (
                            <div className="text-xs text-gray-500">
                              {new Date(trainingItem.userProgress.completedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {}
                      {trainingItem.training.description && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                          {trainingItem.training.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <p>Bu bootcamp için henüz eğitim eklenmemiş.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BootcampDetailPage;
