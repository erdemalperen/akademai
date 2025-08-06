import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { getPublishedTrainings } from '../../services/trainingApiService';
import { Training } from '../../types';
import { Clock, Calendar, BookOpen } from 'lucide-react';

const AllTrainingsPage: React.FC = () => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        setLoading(true);
        const data = await getPublishedTrainings();
        setTrainings(data);
        setError(null);
      } catch (err) {
        console.error('Eğitimler yüklenirken hata oluştu:', err);
        setError('Eğitimler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrainings();
  }, []);

  const handleViewTraining = (trainingId: string) => {
    navigate(`/dashboard/trainings/${trainingId}`);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tüm Eğitimler</h1>
        <p className="text-gray-500">Yayınlanmış tüm eğitimleri görüntüleyin</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainings.length > 0 ? (
            trainings.map((training) => (
              <Card key={training.id} className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="line-clamp-2 hover:line-clamp-none">
                    {training.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Badge className="bg-gray-100 text-gray-800">
                      {training.category}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-gray-600 line-clamp-3 hover:line-clamp-none mb-4">
                    {training.description}
                  </p>
                  <div className="flex flex-col space-y-2 text-sm text-gray-500">
                    {training.duration && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{training.duration} dakika</span>
                      </div>
                    )}
                    {training.startDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(training.startDate).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    )}
                    {training.learningOutcomes && training.learningOutcomes.length > 0 && (
                      <div className="flex items-start gap-2 mt-3">
                        <BookOpen className="w-4 h-4 mt-1" />
                        <div>
                          <p className="font-medium text-gray-600">Kazanımlar:</p>
                          <ul className="list-disc list-inside mt-1">
                            {training.learningOutcomes.slice(0, 2).map((outcome, idx) => (
                              <li key={idx} className="line-clamp-1 hover:line-clamp-none">
                                {outcome}
                              </li>
                            ))}
                            {training.learningOutcomes.length > 2 && (
                              <li>ve {training.learningOutcomes.length - 2} daha fazla...</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => handleViewTraining(training.id)} className="w-full">
                    Detayları Görüntüle
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-3 p-6 text-center bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-700">Henüz yayınlanmış eğitim bulunmuyor</h3>
              <p className="text-gray-500 mt-2">Yayınlanan eğitimler burada listelenecektir.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AllTrainingsPage; 