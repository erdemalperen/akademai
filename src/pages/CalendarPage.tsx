import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Training } from '../types'; 
import { ChevronLeft, ChevronRight } from 'lucide-react'; 
import { Button } from '../components/ui/Button'; 
import { trainingApiInstance } from '../services/trainingApiService'; 


const formatDate = (date: Date | string | null): string => {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  } catch (e) {
    console.error("Geçersiz tarih formatı:", date);
    return '';
  }
};


const dateToYMD = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const CalendarPage: React.FC = () => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date()); 

  
  const handlePrevMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  useEffect(() => {
    const fetchTrainings = async () => {
      setLoading(true);
      setError(null);
      try {
        
        const response = await trainingApiInstance.get('/'); 
        if (response.status !== 200) { 
          throw new Error('Eğitimler yüklenirken bir hata oluştu.');
        }
        let data = response.data;

        
        
        

        setTrainings(data); 
      } catch (err: any) {
        
        const errorMessage = err.response?.data?.message || err.message || 'Bilinmeyen bir hata oluştu.';
        setError(errorMessage);
        console.error("Eğitimler çekilirken hata:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainings();
  }, []); 

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (error) {
    return <div className="text-destructive">Hata: {error}</div>;
  }

  
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); 
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthName = currentDate.toLocaleDateString('tr-TR', { month: 'long' });

  
  const eventsByDate = trainings.reduce((acc, training) => {
    if (training.deadline) {
      try {
        const deadlineDate = new Date(training.deadline);
        const ymd = dateToYMD(deadlineDate);
        if (!acc[ymd]) {
          acc[ymd] = [];
        }
        acc[ymd].push(training);
      } catch (e) {
        console.error("Deadline işlenirken hata:", training.deadline);
      }
    }
    return acc;
  }, {} as Record<string, Training[]>);

  
  const upcomingEvents = trainings
    .filter(t => t.deadline && new Date(t.deadline) >= new Date()) 
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Eğitim Takvimi</h1>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2"> {} 
          <CardTitle>{monthName} {currentYear}</CardTitle> 
          <div className="flex space-x-1"> {} 
            <Button variant="outline" size="sm" onClick={handlePrevMonth}> {} 
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Önceki Ay</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextMonth}> {} 
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Sonraki Ay</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center">
            {} 
            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
              <div key={day} className="text-sm font-medium p-2">{day}</div>
            ))}
            
            {}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const date = new Date(currentYear, currentMonth, day);
              const ymd = dateToYMD(date);
              const todaysEvents = eventsByDate[ymd] || [];
              const hasEvent = todaysEvents.length > 0;
              
              return (
                <div 
                  key={day}
                  className={`p-2 rounded-md relative ${ 
                    hasEvent 
                      ? 'bg-primary/10 text-primary font-medium cursor-pointer hover:bg-primary/20' 
                      : 'hover:bg-muted'
                  }`}
                  title={hasEvent ? todaysEvents.map(t => t.title).join(', ') : undefined} 
                >
                  <div>{day}</div>
                  {hasEvent && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 h-1 w-4 bg-primary rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Yaklaşan Etkinlikler (Son Teslim Tarihleri)</h2>
        
        {upcomingEvents.length === 0 && <p>Yaklaşan eğitim teslim tarihi bulunmamaktadır.</p>}

        <div className="space-y-2">
          {upcomingEvents
              .slice(0, 5) 
              .map(training => (
                <div key={training.id} className="p-4 border rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium">{training.title}</h3>
                    <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-1 rounded">
                      {formatDate(training.deadline)} - Son Teslim
                    </span>
                  </div>
                  {}
                  {}
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;