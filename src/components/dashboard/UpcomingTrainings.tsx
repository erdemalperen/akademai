import React, { useState, useEffect } from 'react';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useNavigate } from 'react-router-dom';
import * as trainingApiService from '../../services/trainingApiService';
import { Training } from '../../types';

const UpcomingTrainings: React.FC = () => {
  const navigate = useNavigate();
  const [upcomingTrainings, setUpcomingTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  
  useEffect(() => {
    const loadTrainings = async () => {
      try {
        setLoading(true);
        
        const trainings = await trainingApiService.getAllTrainings();
        
        const latestTrainings = trainings.slice(0, 3);
        
        setUpcomingTrainings(latestTrainings);
        setLoading(false);
      } catch (err) {
        console.error('Eğitimler yüklenirken hata oluştu:', err);
        setError('Eğitimler yüklenirken bir hata oluştu.');
        setLoading(false);
      }
    };
    
    loadTrainings();
  }, []);
  
  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return <Badge variant="success">Başlangıç</Badge>;
      case 'intermediate':
        return <Badge variant="warning">Orta</Badge>;
      case 'advanced':
        return <Badge variant="error">İleri</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">Yaklaşan Eğitimler</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8"
          onClick={() => navigate('/trainings')}
        >
          Tümünü Gör
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-3 text-sm text-red-600">{error}</div>
        ) : upcomingTrainings.length === 0 ? (
          <div className="p-3 text-center text-muted-foreground">
            Yaklaşan eğitim bulunamadı.
          </div>
        ) : (
        <div className="space-y-4">
          {upcomingTrainings.map((training: any) => (
            <div
              key={training.id}
              className="flex flex-col space-y-3 rounded-md border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/dashboard/trainings/${training.id}`)}
            >
              <div className="flex items-start justify-between">
                <h4 className="font-medium line-clamp-1">{training.title}</h4>
                {getDifficultyBadge(training.difficulty)}
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2">
                {training.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex space-x-3 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {training.duration} dakika
                  </div>
                  <div className="flex items-center">
                    <Badge className="h-5">{training.category}</Badge>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/dashboard/trainings/${training.id}`);
                  }}
                >
                  <span className="sr-only">Eğitime Git</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {upcomingTrainings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">Eğitim Bulunamadı</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Şu anda planlanmış eğitim bulunmamaktadır.
              </p>
            </div>
          )}
        </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingTrainings;