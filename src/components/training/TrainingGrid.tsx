import React, { useState, useEffect } from 'react';
import { Clock, Filter, Search, User } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useNavigate } from 'react-router-dom';
import { getAssignedTrainings } from '../../services/trainingApiService';
import { Training, UserRole } from '../../types';
import { tokenService } from '../../lib/api/apiClient';

const TrainingGrid: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
  const user = tokenService.getUser();
  const isAdmin = user && (user.role === UserRole.ADMIN_JUNIOR || user.role === UserRole.ADMIN_SENIOR);

  
  useEffect(() => {
    const loadTrainings = async () => {
      try {
        setLoading(true);
        setError(null); 
        
        const response = await getAssignedTrainings();

        
        if (Array.isArray(response)) {
          setTrainings(response);

          
          if (response.length > 0) {
            const uniqueCategories = Array.from(new Set(response.map((t: Training) => t.category).filter(Boolean))) as string[];
            setCategories(uniqueCategories);
          }
        } else {
          
          
          console.error('API yanıtı beklenen dizi formatında değil:', response);
          setTrainings([]);
          setError('Veri formatı hatası. Yöneticinize bildirin.');
        }

        setLoading(false);
      } catch (err: any) { 
        console.error('Eğitimler yüklenirken hata oluştu:', err);
        setError(err.message || 'Eğitimler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        setLoading(false);
        setTrainings([]); 
      }
    };

    loadTrainings();
  }, []);

  
  const filteredTrainings = trainings ? trainings.filter(training => {
    const matchesSearch = searchTerm === '' || 
      training.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = selectedCategory === null || training.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  }) : [];

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      ) : (
      <>
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Eğitimler</h1>
          {}
          {isAdmin && (
            <Button 
              onClick={() => navigate('/dashboard/admin/trainings')} 
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Eğitim Ekle
            </Button>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Eğitim ara..."
              className="h-10 w-full rounded-md border border-input bg-background px-9 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                &times;
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrainings.map((training) => (
          <div 
            key={training.id}
            className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer animate-slide-up"
            onClick={() => navigate(`/dashboard/trainings/${training.id}`)}
          >
            <Card>
            <div className="h-40 bg-primary/10 relative">
            </div>
            
            <CardHeader className="pb-1">
              <div className="mb-2">
                <Badge variant="default" className="mb-2">
                  {training.category}
                </Badge>
              </div>
              <h3 className="text-lg font-semibold line-clamp-1">{training.title}</h3>
            </CardHeader>
            
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {training.description}
              </p>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {training.duration} dakika
                </div>
                
                <div className="flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  {training.author}
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="border-t pt-4">
              <Button className="w-full">Eğitime Git</Button>
            </CardFooter>
            </Card>
          </div>
        ))}
        
        {filteredTrainings.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <Filter className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium">Eğitim Bulunamadı</h3>
            <p className="text-muted-foreground mt-2">
              Arama kriterlerinize uygun eğitim bulunamadı.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory(null);
              }}
            >
              Filtreleri Temizle
            </Button>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
};

export default TrainingGrid;