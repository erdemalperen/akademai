import React from 'react';


export interface BootcampProgressData {
  id: string;
  title: string;
  description: string;
  category: string;
  progress?: number; 
  
}

interface BootcampProgressCardProps {
  bootcamp: BootcampProgressData;
}

const BootcampProgressCard: React.FC<BootcampProgressCardProps> = ({ bootcamp }) => {
  return (
    <div className="w-full max-w-sm border rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-bold">{bootcamp.title}</h3>
        <p className="text-sm text-gray-500">{bootcamp.category}</p>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{bootcamp.description}</p>
        {bootcamp.progress !== undefined && bootcamp.progress !== null && (
          <div className="mt-auto pt-4 border-t">
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm font-medium">İlerleme</p>
              <p className="text-sm font-semibold">{bootcamp.progress}%</p>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
              <div 
                className="h-full bg-blue-500" 
                style={{ width: `${bootcamp.progress}%` }}
                aria-label={`${bootcamp.title} ilerleme ${bootcamp.progress}%`}
              />
            </div>
          </div>
        )}
        {}
      </div>
    </div>
  );
};

export default BootcampProgressCard;
