'use client'; 

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import { authApi } from '../../lib/api/apiClient'; 
import BootcampProgressCard, { BootcampProgressData } from '../../components/BootcampProgress/BootcampProgressCard'; 




const AssignedBootcampsPage: React.FC = () => {
  const [bootcamps, setBootcamps] = useState<BootcampProgressData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBootcamps = async () => {
      setIsLoading(true);
      setError(null);
      try {
        
        const data = await authApi.getAssignedBootcamps();
        
        
        
        
        if (data && data.data) {
          setBootcamps(data.data);
        } else if (data && Array.isArray(data)) {
          
          setBootcamps(data);
        } else {
          console.warn('Beklenmeyen API yanıt formatı:', data);
          
          setBootcamps([
            {
              id: '1',
              title: 'Demo Bootcamp',
              description: 'API yanıt vermediği için demo veri gösteriliyor',
              progress: 0,
              trainings: []
            }
          ]);
        }
      } catch (err: any) {
        console.error('Error fetching assigned bootcamps:', err);
        setError(err.message || 'Bootcamp bilgileri yüklenirken bir hata oluştu.');
        
        
        setBootcamps([
          {
            id: '1',
            title: 'Demo Bootcamp',
            description: 'Hata nedeniyle demo veri gösteriliyor',
            progress: 0,
            trainings: []
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBootcamps();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Bootcamp'lerim</h1>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {} 
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex flex-col space-y-3 p-4 border rounded-lg shadow">
              <div className="h-32 w-full rounded-md bg-gray-200 animate-pulse" />
              <div className="space-y-2 pt-2">
                <div className="h-5 w-3/4 bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-1/4 bg-gray-200 animate-pulse rounded mt-4" /> {} 
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
           <strong className="font-bold">Hata!</strong>
           <span className="block sm:inline"> {error}</span>
         </div>
        
        
        
        
        
        
      )}

      {!isLoading && !error && bootcamps.length === 0 && (
        <p className="text-center text-gray-500 mt-10">Size atanmış herhangi bir bootcamp bulunmamaktadır.</p>
      )}

      {!isLoading && !error && bootcamps.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bootcamps.map((bootcamp) => (
            
            <Link to={`/dashboard/bootcamps/${bootcamp.id}`} key={bootcamp.id} className="block">
              <BootcampProgressCard bootcamp={bootcamp} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignedBootcampsPage;
