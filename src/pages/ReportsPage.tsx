import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '../components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { BarChart, FileText, Filter, Search, RefreshCw, User, Building, School } from 'lucide-react';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import { authApi } from '../lib/api/apiClient';
import { getUserTrainingProgressReport, getTrainingProgressByTrainingId, getAllTrainingsProgress, getUserConferenceTrainings } from '../services/statisticsApiService';


enum LogActionType {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  ROLE_CHANGE = 'ROLE_CHANGE',
  TRAINING_CREATE = 'TRAINING_CREATE',
  TRAINING_UPDATE = 'TRAINING_UPDATE',
  TRAINING_DELETE = 'TRAINING_DELETE',
  ENROLLMENT = 'ENROLLMENT',
  ADMIN_ACTION = 'ADMIN_ACTION',
  API_ACCESS = 'API_ACCESS',
  FAILED_LOGIN = 'FAILED_LOGIN'
}


interface Log {
  id: number;
  action: string;
  description?: string;
  userId?: number;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  }
}


interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ReportsPage: React.FC = () => {
  
  const [logs, setLogs] = useState<Log[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    action: '',
    startDate: '',
    endDate: '',
    userId: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  
  const [activeTab, setActiveTab] = useState("logs");
  
  
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [loadingUserProgress, setLoadingUserProgress] = useState(false);
  const [userProgressError, setUserProgressError] = useState<string | null>(null);
  
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<any | null>(null);
  
  
  const [trainings, setTrainings] = useState<any[]>([]);
  const [loadingTrainings, setLoadingTrainings] = useState(false);
  const [trainingsError, setTrainingsError] = useState<string | null>(null);
  
  
  const [selectedTrainingId, setSelectedTrainingId] = useState<string | null>(null);
  const [trainingProgress, setTrainingProgress] = useState<any | null>(null);
  const [loadingTrainingProgress, setLoadingTrainingProgress] = useState(false);

  
  const [userConferenceTrainings, setUserConferenceTrainings] = useState<any[]>([]);

  const fetchUserConferenceTrainings = async (userId: string) => {
    try {
      if (!userId || userId === 'null' || userId === 'undefined') {
        console.error(`[ReportsPage] Geçersiz kullanıcı ID: ${userId}`);
        setUserConferenceTrainings([]);
        return;
      }
      
      console.log(`[ReportsPage] Kullanıcı konferans eğitimleri getiriliyor, userId=${userId}`);
      const data = await getUserConferenceTrainings(userId);
      setUserConferenceTrainings(data || []);
    } catch (err: any) {
      console.error('Kullanıcı konferans eğitimleri alınırken hata:', err);
      setUserConferenceTrainings([]);
    }
  };

  
  const fetchUserDetail = async (userId: string) => {
    try {
      console.log(`[ReportsPage] Kullanıcı detaylarını getiriyorum, userId=${userId}`);
      
      
      await fetchUserProgress();
      
      
      if (!userId || userId === 'null') {
        console.error(`[ReportsPage] Geçersiz kullanıcı ID: ${userId}`);
        return;
      }
      
      
      const user = userProgress.find(u => u.userId && u.userId.toString() === userId);
      if (user) {
        console.log(`[ReportsPage] Kullanıcı detayları bulundu:`, user);
        setUserDetail(user);
        setSelectedUserId(userId);
        fetchUserConferenceTrainings(userId); 
      } else {
        console.error(`[ReportsPage] Kullanıcı detayları bulunamadı, userId=${userId}`);
      }
    } catch (err: any) {
      console.error(`[ReportsPage] Kullanıcı detayları getirilirken hata:`, err);
    }
  };
  
  
  const fetchDepartments = async () => {
    try {
      console.log('[ReportsPage] Departmanlar getiriliyor...');
      const apiResponse = await authApi.makeApiCall('/departments');
      
      
      
      
      if (apiResponse && Array.isArray(apiResponse)) {
        console.log('[ReportsPage] Alınan departmanlar:', apiResponse);
        setDepartments([{ id: "all", name: "Tüm Departmanlar" }, ...apiResponse]);
      } else if (apiResponse && apiResponse.success && Array.isArray(apiResponse.data)) {
        
        console.log('[ReportsPage] Alınan departmanlar (data objesinden):', apiResponse.data);
        setDepartments([{ id: "all", name: "Tüm Departmanlar" }, ...apiResponse.data]);
      } else {
        console.error('[ReportsPage] Departmanlar API yanıtı beklenildiği gibi değil veya veri yok:', apiResponse);
        setDepartments([{ id: "all", name: "Tüm Departmanlar" }]);
      }
    } catch (err: any) {
      console.error('[ReportsPage] Departmanlar alınırken hata:', err);
      setDepartments([{ id: "all", name: "Tüm Departmanlar" }]); 
    }
  };

  
  const fetchTrainingsProgress = async () => {
    try {
      setLoadingTrainings(true);
      setTrainingsError(null);
      
      const data = await getAllTrainingsProgress();
      setTrainings(data);
    } catch (err: any) {
      setTrainingsError(err.message || 'Eğitim ilerleme durumları alınırken bir hata oluştu');
    } finally {
      setLoadingTrainings(false);
    }
  };

  
  const fetchUserProgress = async () => {
    try {
      setLoadingUserProgress(true);
      setUserProgressError(null);
      
      const data = await getUserTrainingProgressReport();
      console.log('[ReportsPage] Fetched user progress data:', data);
      setUserProgress(data);
    } catch (err: any) {
      setUserProgressError(err.message || 'Kullanıcı devam durumları alınırken bir hata oluştu');
      console.error('[ReportsPage] Kullanıcı devam durumları alınırken hata:', err);
      setUserProgress([]);
    } finally {
      setLoadingUserProgress(false);
    }
  };
  
  
  const fetchTrainingProgress = async (trainingId: string) => {
    try {
      setLoadingTrainingProgress(true);
      
      const data = await getTrainingProgressByTrainingId(trainingId);
      setTrainingProgress(data);
    } catch (err: any) {
      console.error('Eğitim bazında devam durumları alınırken hata:', err);
    } finally {
      setLoadingTrainingProgress(false);
    }
  };

  
  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', meta.limit.toString());

      
      if (filters.action) queryParams.append('action', filters.action);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.userId) queryParams.append('userId', filters.userId);

      
      const response = await authApi.makeApiCall(`/logs?${queryParams.toString()}`, {
        method: 'GET'
      });

      if (response.success) {
        setLogs(response.data);
        setMeta(response.meta);
      } else {
        setError(response.error || 'Kayıtlar alınırken bir hata oluştu');
      }
    } catch (err: any) {
      setError(err.message || 'Kayıtlar alınırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    
    fetchDepartments();
    
    
    if (activeTab === 'logs') {
      fetchLogs();
    } else if (activeTab === 'userProgress' || activeTab === 'departmentProgress') {
      fetchUserProgress();
    } else if (activeTab === 'trainingsProgress') {
      fetchTrainingsProgress();
    }
  }, [activeTab]);

  
  useEffect(() => {
    if (selectedUserId) {
      fetchUserDetail(selectedUserId);
    }
  }, [selectedUserId]);

  
  const applyFilters = () => {
    fetchLogs(1); 
  };

  
  const resetFilters = () => {
    setFilters({
      action: '',
      startDate: '',
      endDate: '',
      userId: ''
    });
    
    fetchLogs(1);
  };

  
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= meta.totalPages) {
      fetchLogs(newPage);
    }
  };

  
  const getActionBadge = (action: string) => {
    let variant = 'default';
    
    switch (action) {
      case LogActionType.LOGIN:
        variant = 'success';
        break;
      case LogActionType.LOGOUT:
        variant = 'secondary';
        break;
      case LogActionType.REGISTER:
        variant = 'primary';
        break;
      case LogActionType.FAILED_LOGIN:
        variant = 'destructive';
        break;
      case LogActionType.ADMIN_ACTION:
        variant = 'warning';
        break;
      default:
        variant = 'default';
    }
    
    
    return (
      <Badge variant={variant as "default" | "success" | "warning" | "error" | "info"}>
        {action.replace(/_/g, ' ')}
      </Badge>
    );
  };

  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  
  const formatUserName = (log: Log) => {
    if (!log.user) {
      
      if (log.action === 'SYSTEM') {
        return 'Sistem İşlemi';
      } else if (log.action === 'TRAINING_CREATE' || log.action === 'TRAINING_UPDATE' || log.action === 'TRAINING_DELETE' || log.action === 'TRAINING_UPDATED') {
        return 'Eğitim Sistemi';
      } else if (log.action === 'CREATE_DEPARTMENT') {
        return 'Departman Yöneticisi';
      } else {
        
        const details = typeof log.description === 'string' ? log.description : '';
        if (details.includes('admin') || details.includes('Admin')) {
          return 'Admin İşlemi';
        }
        return 'Sistem İşlemi';
      }
    }
    return `${log.user.firstName} ${log.user.lastName} (${log.user.email})`;
  };
  
  
  const getProgressBadge = (status: string) => {
    let variant = 'default';
    
    switch (status) {
      case 'COMPLETED':
        variant = 'success';
        break;
      case 'IN_PROGRESS':
        variant = 'warning';
        break;
      case 'QUIZZES_PENDING':
        variant = 'info';
        break;
      case 'NOT_STARTED':
        variant = 'secondary';
        break;
      default:
        variant = 'default';
    }
    
    const statusMap: Record<string, string> = {
      'COMPLETED': 'Tamamlandı',
      'IN_PROGRESS': 'Devam Ediyor',
      'QUIZZES_PENDING': 'Sınavlar Bekliyor',
      'NOT_STARTED': 'Başlanmadı'
    };
    
    return (
      <Badge variant={variant as "default" | "success" | "warning" | "error" | "info"}>
        {statusMap[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <BarChart className="mr-2 h-8 w-8" />
            Sistem Raporları
          </h1>
          <p className="text-muted-foreground mt-1">
            Sistem aktiviteleri ve kullanıcı durumlarını görüntüleyin ve analiz edin
          </p>
        </div>
        
        {}
        <div className="flex gap-2 border p-1 rounded-md flex-wrap">
          <Button 
            variant={activeTab === 'logs' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('logs')}
            className="flex items-center"
            size="sm"
          >
            <FileText className="mr-2 h-4 w-4" />
            Sistem Aktiviteleri
          </Button>
          <Button 
            variant={activeTab === 'userProgress' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('userProgress')}
            className="flex items-center"
            size="sm"
          >
            <User className="mr-2 h-4 w-4" />
            Kullanıcı Devam Durumları
          </Button>
          <Button 
            variant={activeTab === 'departmentProgress' ? 'default' : 'ghost'} 
            onClick={() => {
              setActiveTab('departmentProgress');
              setSelectedUserId(null);
              setUserDetail(null);
            }}
            className="flex items-center"
            size="sm"
          >
            <Building className="mr-2 h-4 w-4" />
            Departman Bazlı Kullanıcılar
          </Button>
          <Button 
            variant={activeTab === 'trainingsProgress' ? 'default' : 'ghost'} 
            onClick={() => {
              setActiveTab('trainingsProgress');
              setSelectedTrainingId(null);
              setTrainingProgress(null);
            }}
            className="flex items-center"
            size="sm"
          >
            <School className="mr-2 h-4 w-4" />
            Eğitimler
          </Button>
        </div>
      </div>
      
      {activeTab === 'logs' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center"
            >
              <Filter className="mr-2 h-4 w-4" />
              {showFilters ? 'Filtreleri Gizle' : 'Filtrele'}
            </Button>
            <Button 
              variant="default" 
              onClick={() => fetchLogs(meta.page)}
              className="flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Yenile
            </Button>
          </div>
          
          {showFilters && (
            <Card>
              <CardHeader>
                <CardTitle>Log Filtreleri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Eylem Tipi</label>
                    <select
                      value={filters.action}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({...filters, action: e.target.value})}
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                    >
                      <option value="">Tüm Eylemler</option>
                      {Object.values(LogActionType).map(action => (
                        <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Başlangıç Tarihi</label>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({...filters, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bitiş Tarihi</label>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({...filters, endDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Kullanıcı ID</label>
                    <Input
                      type="number"
                      placeholder="Kullanıcı ID"
                      value={filters.userId}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({...filters, userId: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4 gap-2">
                  <Button variant="outline" onClick={resetFilters}>Sıfırla</Button>
                  <Button onClick={applyFilters}>Filtrele</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle>Sistem Aktiviteleri</CardTitle>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Açıklamada ara..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {error && <Alert variant="error" className="mb-4">{error}</Alert>}
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Kayıt Bulunamadı</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Belirtilen kriterlere uygun kayıt bulunmamaktadır.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHeaderCell>ID</TableHeaderCell>
                          <TableHeaderCell>Tarih</TableHeaderCell>
                          <TableHeaderCell>Eylem</TableHeaderCell>
                          <TableHeaderCell>Kullanıcı</TableHeaderCell>
                          <TableHeaderCell>İşlem</TableHeaderCell>
                          <TableHeaderCell>IP Adresi</TableHeaderCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs
                          .filter(log => 
                            !searchTerm || 
                            (log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (log.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())))
                          )
                          .map(log => (
                            <TableRow key={log.id} className="text-gray-900 dark:text-white">
                              <TableCell className="text-gray-900 dark:text-white">{log.id}</TableCell>
                              <TableCell className="text-gray-900 dark:text-white">{formatDate(log.timestamp)}</TableCell>
                              <TableCell>{getActionBadge(log.action)}</TableCell>
                              <TableCell className="text-gray-900 dark:text-white">{formatUserName(log)}</TableCell>
                              <TableCell className="max-w-xs truncate text-gray-900 dark:text-white">
                                {log.description || 'N/A'}
                              </TableCell>
                              <TableCell className="text-gray-900 dark:text-white">{log.ipAddress || 'N/A'}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {}
                  {meta.totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-sm text-muted-foreground">
                        Toplam {meta.total} kayıt ({meta.page}/{meta.totalPages} sayfa)
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={meta.page === 1}
                          onClick={() => handlePageChange(meta.page - 1)}
                        >
                          Önceki
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={meta.page === meta.totalPages}
                          onClick={() => handlePageChange(meta.page + 1)}
                        >
                          Sonraki
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      {activeTab === 'userProgress' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Button 
              variant="default" 
              onClick={async () => {
                
                await fetchUserProgress();
                
                
                if (selectedUserId) {
                  console.log(`[ReportsPage] Seçili kullanıcı detaylarını da yeniliyorum, userId=${selectedUserId}`);
                  await fetchUserDetail(selectedUserId);
                }
              }}
              className="flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Yenile
            </Button>
          </div>
          
          {loadingUserProgress ? (
            <div className="w-full flex justify-center my-8">
              <Spinner className="w-8 h-8" />
            </div>
          ) : userProgressError ? (
            <Alert variant="error" title="Hata" description={userProgressError} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Kullanıcı Eğitim Devam Durumları</CardTitle>
              </CardHeader>
              <CardContent>
                {userProgress.length === 0 ? (
                  <p className="text-muted-foreground">Henüz kayıtlı kullanıcı eğitim durumu bulunmamaktadır.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell>Kullanıcı</TableHeaderCell>
                        <TableHeaderCell>Toplam Eğitim</TableHeaderCell>
                        <TableHeaderCell>Tamamlanan</TableHeaderCell>
                        <TableHeaderCell>Devam Eden</TableHeaderCell>
                        <TableHeaderCell>Tamamlama Oranı</TableHeaderCell>
                        <TableHeaderCell>Son Aktivite</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userProgress.map((user) => (
                        <TableRow key={user.userId || `unknown-user-${Math.random()}`}>
                          <TableCell className="font-medium">
                            {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.email || 'Kullanıcı Bilgisi Yok')}
                          </TableCell>
                          <TableCell>{user.totalTrainings || 0}</TableCell>
                          <TableCell>{user.completedTrainings || 0}</TableCell>
                          <TableCell>{user.inProgressTrainings || 0}</TableCell>
                          <TableCell>
                            {(user.totalTrainings || 0) > 0 
                              ? `%${Math.round(((user.completedTrainings || 0) / (user.totalTrainings || 1)) * 100)}` 
                              : '-'}
                          </TableCell>
                          <TableCell>{user.lastActivityDate ? formatDate(user.lastActivityDate) : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
          
          {selectedTrainingId && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Eğitim Detayı: {trainingProgress?.title || selectedTrainingId}</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTrainingProgress ? (
                  <div className="w-full flex justify-center my-8">
                    <Spinner className="w-8 h-8" />
                  </div>
                ) : (
                  <div>
                    {trainingProgress && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHeaderCell>Kullanıcı</TableHeaderCell>
                            <TableHeaderCell>İlerleme</TableHeaderCell>
                            <TableHeaderCell>Durum</TableHeaderCell>
                            <TableHeaderCell>Başlangıç</TableHeaderCell>
                            <TableHeaderCell>Tamamlama</TableHeaderCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {trainingProgress.users.map((user: any) => (
                            <TableRow key={user.userId}>
                              <TableCell className="font-medium">{`${user.firstName} ${user.lastName}`}</TableCell>
                              <TableCell>{`%${user.progress}`}</TableCell>
                              <TableCell>{getProgressBadge(user.status)}</TableCell>
                              <TableCell>{user.startedAt ? formatDate(user.startedAt) : '-'}</TableCell>
                              <TableCell>{user.completedAt ? formatDate(user.completedAt) : '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {activeTab === 'departmentProgress' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Button 
              variant="default" 
              onClick={async () => {
                
                await fetchUserProgress();
                
                
                if (selectedUserId) {
                  console.log(`[ReportsPage] Seçili kullanıcı detaylarını da yeniliyorum, userId=${selectedUserId}`);
                  await fetchUserDetail(selectedUserId);
                }
              }}
              className="flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Yenile
            </Button>
            
            {}
            <div className="ml-auto w-64">
              <select 
                value={selectedDepartmentId} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setSelectedDepartmentId(e.target.value);
                  setSelectedUserId(null);
                  setUserDetail(null);
                }}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
              >
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {}
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedDepartmentId === 'all' ? 'Tüm Kullanıcılar' : 
                    `${departments.find(d => d.id.toString() === selectedDepartmentId)?.name || ''} Departmanı Kullanıcıları`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingUserProgress ? (
                  <div className="w-full flex justify-center my-8">
                    <Spinner className="w-8 h-8" />
                  </div>
                ) : userProgressError ? (
                  <Alert variant="error" title="Hata" description={userProgressError} />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell>Kullanıcı</TableHeaderCell>
                        <TableHeaderCell>Departman</TableHeaderCell>
                        <TableHeaderCell>Tamamlanan/Toplam</TableHeaderCell>
                        <TableHeaderCell>Durum</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userProgress
                        .filter(user => 
                          selectedDepartmentId === 'all' || 
                          (user.departmentId && user.departmentId.toString() === selectedDepartmentId)
                        )
                        .map((user) => (
                          <TableRow 
                            key={user.userId || `dept-user-${Math.random()}`}
                            className={`cursor-pointer ${selectedUserId === (user.userId ? user.userId.toString() : '') ? 'bg-primary/10' : ''}`}
                            onClick={() => user.userId ? fetchUserDetail(user.userId.toString()) : console.log('Kullanıcı ID bulunamadı', user)}
                          >
                            <TableCell className="font-medium">
                              {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.email || 'Kullanıcı Bilgisi Yok')}
                            </TableCell>
                            <TableCell>{user.departmentName || 'Belirtilmemiş'}</TableCell>
                            <TableCell>{`${user.completedTrainings || 0}/${user.totalTrainings || 0}`}</TableCell>
                            <TableCell>
                              <Badge variant={(user.completedTrainings || 0) === (user.totalTrainings || 0) && (user.totalTrainings || 0) > 0 ? 'success' : 
                                (user.completedTrainings || 0) > 0 ? 'warning' : 'default'}>
                                {(user.completedTrainings || 0) === (user.totalTrainings || 0) && (user.totalTrainings || 0) > 0 ? 'Tamamlandı' :
                                 (user.completedTrainings || 0) > 0 ? 'Devam Ediyor' : 'Başlanmadı'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            
            {}
            {selectedUserId && userDetail && (
              <Card>
                <CardHeader>
                  <CardTitle>{`${userDetail.firstName} ${userDetail.lastName} Eğitim Durumu`}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Kullanıcı Bilgileri:</p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">E-posta</p>
                        <p className="text-sm">{userDetail.email}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Departman</p>
                        <p className="text-sm">{userDetail.departmentName}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Pozisyon</p>
                        <p className="text-sm">{userDetail.position || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Son Aktivite</p>
                        <p className="text-sm">{userDetail.lastActivityDate ? formatDate(userDetail.lastActivityDate) : '-'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">Eğitim Listesi:</p>
                  {userDetail.trainings && userDetail.trainings.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHeaderCell>Eğitim</TableHeaderCell>
                          <TableHeaderCell>İlerleme</TableHeaderCell>
                          <TableHeaderCell>Durum</TableHeaderCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userDetail.trainings.map((training: any) => (
                          <TableRow key={training.trainingId}>
                            <TableCell className="font-medium">{training.title}</TableCell>
                            <TableCell>{`%${Math.round(training.progressPercentage)}`}</TableCell>
                            <TableCell>{getProgressBadge(training.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">Bu kullanıcıya atanmış eğitim bulunmamaktadır.</p>
                  )}
                  
                  {}
                  <div className="mt-6">
                    <p className="text-sm text-muted-foreground mb-2">Konferans Eğitimleri:</p>
                    {userConferenceTrainings && userConferenceTrainings.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHeaderCell>Konferans</TableHeaderCell>
                            <TableHeaderCell>Konum</TableHeaderCell>
                            <TableHeaderCell>Tarih</TableHeaderCell>
                            <TableHeaderCell>Katılım</TableHeaderCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userConferenceTrainings.map((conference: any) => (
                            <TableRow key={conference.id}>
                              <TableCell className="font-medium">{conference.title}</TableCell>
                              <TableCell>{conference.location}</TableCell>
                              <TableCell>{formatDate(conference.startDate)}</TableCell>
                              <TableCell>
                                <Badge variant={conference.attended ? 'success' : 'default'}>
                                  {conference.attended ? 'Katıldı' : 'Katılmadı'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-muted-foreground">Bu kullanıcı hiçbir konferans eğitimine katılmamıştır.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'trainingsProgress' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Button 
              variant="default" 
              onClick={fetchTrainingsProgress}
              className="flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Yenile
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {}
            <Card>
              <CardHeader>
                <CardTitle>Eğitim Listesi</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTrainings ? (
                  <div className="w-full flex justify-center my-8">
                    <Spinner className="w-8 h-8" />
                  </div>
                ) : trainingsError ? (
                  <Alert variant="error" title="Hata" description={trainingsError} />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell>Eğitim</TableHeaderCell>
                        <TableHeaderCell>Kategori</TableHeaderCell>
                        <TableHeaderCell>Kayıtlı Kullanıcı</TableHeaderCell>
                        <TableHeaderCell>Tamamlayan</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trainings.map((training) => (
                        <TableRow 
                          key={training.id}
                          className={`cursor-pointer ${selectedTrainingId === training.id ? 'bg-primary/10' : ''}`}
                          onClick={() => {
                            setSelectedTrainingId(training.id);
                            fetchTrainingProgress(training.id);
                          }}
                        >
                          <TableCell className="font-medium">{training.title}</TableCell>
                          <TableCell>{training.category}</TableCell>
                          <TableCell>{training.enrolledUserCount}</TableCell>
                          <TableCell>
                            <Badge variant={training.completedUserCount > 0 ? 'success' : 'default'}>
                              {training.completedUserCount}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            
            {}
            {selectedTrainingId && (
              <Card>
                <CardHeader>
                  <CardTitle>Eğitim Detayı: {trainingProgress?.title || selectedTrainingId}</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingTrainingProgress ? (
                    <div className="w-full flex justify-center my-8">
                      <Spinner className="w-8 h-8" />
                    </div>
                  ) : (
                    <div>
                      {trainingProgress && (
                        <>
                          <div className="mb-4">
                            <p className="text-sm text-muted-foreground mb-1">Eğitim Bilgileri:</p>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="space-y-1">
                                <p className="text-sm font-medium">Kategori</p>
                                <p className="text-sm">{trainingProgress.category}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium">Tür</p>
                                <p className="text-sm">{trainingProgress.isMandatory ? 'Zorunlu' : 'İsteğe Bağlı'}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium">İçerik Sayısı</p>
                                <p className="text-sm">{trainingProgress.meta?.contentCount || 0}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium">Quiz Sayısı</p>
                                <p className="text-sm">{trainingProgress.meta?.quizCount || 0}</p>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">Katılımcı Listesi:</p>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHeaderCell>Kullanıcı</TableHeaderCell>
                                <TableHeaderCell>Departman</TableHeaderCell>
                                <TableHeaderCell>İlerleme</TableHeaderCell>
                                <TableHeaderCell>Durum</TableHeaderCell>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {trainingProgress.users.map((user: any) => (
                                <TableRow key={user.userId}>
                                  <TableCell className="font-medium">{`${user.firstName} ${user.lastName}`}</TableCell>
                                  <TableCell>{user.departmentName}</TableCell>
                                  <TableCell>{`%${Math.round(user.progress)}`}</TableCell>
                                  <TableCell>{getProgressBadge(user.status)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
