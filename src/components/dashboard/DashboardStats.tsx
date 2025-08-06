import React, { useEffect, useState } from 'react';
import { 
  BookOpen, CheckCircle, 
  Clock, Users, Loader2, Trophy, User 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { authApi } from '../../lib/api/apiClient';
import { getAllTrainings } from '../../services/trainingApiService';
import { getMonthlyCompletedTrainingsCount, getTopEmployeesOfMonth } from '../../services/statisticsApiService';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
}

interface TopEmployeeData {
  id: string;
  name: string;
  departmentName: string;
  completedTrainingsCount: number;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  isLoading = false,
  error = null
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        <div className="w-12 h-12 p-2 rounded-full bg-muted/50">{icon}</div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : (
          <div className="text-4xl font-extrabold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
};

const EmployeeOfMonthCard: React.FC = () => {
  const [topEmployees, setTopEmployees] = useState<TopEmployeeData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopEmployees = async () => {
      try {
        setLoading(true);
        setError(null);
        const employees = await getTopEmployeesOfMonth();
        setTopEmployees(employees);
      } catch (err: any) {
        console.error('Ayın çalışanları alınırken hata:', err);
        setError('Veriler alınamadı');
      } finally {
        setLoading(false);
      }
    };

    fetchTopEmployees();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-xl font-bold">Ayın Çalışanı</CardTitle>
        <div className="w-12 h-12 p-2 rounded-full bg-muted/50">
          <Trophy className="w-full h-full text-warning" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : (
          <div className="space-y-4">
            {topEmployees.length > 0 ? (
              <div className="space-y-3">
                {topEmployees.map((employee, index) => (
                  <div key={employee.id} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-300' : 'bg-amber-700'} text-white`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-xs text-muted-foreground">{employee.departmentName}</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold">
                      {employee.completedTrainingsCount} Eğitim
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <User className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                <p>Bu ay tamamlanan eğitim yok</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const DashboardStats: React.FC = () => {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState<boolean>(true);
  const [countError, setCountError] = useState<string | null>(null);
  
  const [trainingCount, setTrainingCount] = useState<number | null>(null);
  const [loadingTrainingCount, setLoadingTrainingCount] = useState<boolean>(true);
  const [trainingCountError, setTrainingCountError] = useState<string | null>(null);

  const [completedTrainingsCount, setCompletedTrainingsCount] = useState<number | null>(null);
  const [loadingCompletedTrainings, setLoadingCompletedTrainings] = useState<boolean>(true);
  const [completedTrainingsError, setCompletedTrainingsError] = useState<string | null>(null);
  
  
  const [currentMonth, setCurrentMonth] = useState<string>('');

  
  useEffect(() => {
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    const now = new Date();
    setCurrentMonth(months[now.getMonth()]);
  }, []);

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        setLoadingCount(true);
        setCountError(null);
        const response = await authApi.getAllUsers();
        if (response.success && Array.isArray(response.data)) {
          setUserCount(response.data.length);
        } else {
          throw new Error(response.message || 'Kullanıcı sayısı alınamadı');
        }
      } catch (err: any) {
        console.error('Kullanıcı sayısı alınırken hata:', err);
        setCountError(err.message || 'Bir hata oluştu.');
      } finally {
        setLoadingCount(false);
      }
    };

    fetchUserCount();
  }, []);
  
  useEffect(() => {
    const fetchTrainingCount = async () => {
      try {
        setLoadingTrainingCount(true);
        setTrainingCountError(null);
        const trainings = await getAllTrainings();
        setTrainingCount(trainings.length);
      } catch (err: any) {
        console.error('Eğitim sayısı alınırken hata:', err);
        setTrainingCountError('Eğitim sayısı alınamadı');
      } finally {
        setLoadingTrainingCount(false);
      }
    };

    fetchTrainingCount();
  }, []);

  useEffect(() => {
    const fetchCompletedTrainingsCount = async () => {
      try {
        setLoadingCompletedTrainings(true);
        setCompletedTrainingsError(null);
        const count = await getMonthlyCompletedTrainingsCount();
        setCompletedTrainingsCount(count);
      } catch (err: any) {
        console.error('Tamamlanan eğitim sayısı alınırken hata:', err);
        setCompletedTrainingsError('Tamamlanan eğitim sayısı alınamadı');
      } finally {
        setLoadingCompletedTrainings(false);
      }
    };

    fetchCompletedTrainingsCount();
  }, []);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <StatsCard
        title={`Tamamlanan Eğitimler (${currentMonth})`}
        value={completedTrainingsCount !== null ? completedTrainingsCount : '-'}
        icon={<CheckCircle className="w-full h-full text-success" />}
        isLoading={loadingCompletedTrainings}
        error={completedTrainingsError}
      />
      <StatsCard
        title="Aktif Kullanıcılar"
        value={userCount !== null ? userCount : '-'}
        icon={<Users className="w-full h-full text-primary" />}
        isLoading={loadingCount}
        error={countError}
      />
      <EmployeeOfMonthCard />
      <StatsCard
        title="Toplam Eğitimler"
        value={trainingCount !== null ? trainingCount : '-'}
        icon={<BookOpen className="w-full h-full text-secondary" />}
        isLoading={loadingTrainingCount}
        error={trainingCountError}
      />
    </div>
  );
};

export default DashboardStats;