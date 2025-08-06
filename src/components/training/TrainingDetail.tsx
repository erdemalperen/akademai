import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Award, Calendar, CheckCircle, Clock, Play, User, Edit, ExternalLink, Loader2, UserPlus, X, Search, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useNavigate } from 'react-router-dom';
import { tokenService } from '../../lib/api/apiClient';
import { getTrainingById, assignTrainingToUser, getTrainingAssignments, unassignTraining, trainingApiInstance, submitQuizAttempt, getQuizStatusForTraining } from '../../services/trainingApiService';
import { getAllEmployees } from '../../services/employeeApiService';
import QuizTabContent from './QuizTabContent';
import * as departmentApiService from '../../services/departmentApiService';
import { sanitizeHtml, sanitizeUrl, getYoutubeEmbedUrl } from '../../utils/security';
import { toast } from 'react-hot-toast';

interface TrainingDetailProps {
  trainingId: string;
}


const getTrainingProgress = async (trainingId: string, userId: number): Promise<any> => {
  try {
    console.log(`Progress istenecek - trainingId: ${trainingId}, userId: ${userId}`);
    
    
    if (!trainingId || !userId) {
      console.warn("Geçersiz ID değerleri, varsayılan progress döndürülüyor");
      return { 
        progress: 0, 
        completed: false, 
        completedItems: [], 
        quizResults: [], 
        status: 'INVALID_PARAMS' 
      };
    }
    
    
    const response = await trainingApiInstance.get(`/${trainingId}/progress/${userId}`);
    console.log("Progress API yanıtı:", response.status);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching training progress:', error);
    
    
    const defaultProgress = { 
      progress: 0, 
      completed: false, 
      completedItems: [], 
      quizResults: [], 
      status: 'ERROR' 
    };
    
    
    if (error.response) {
      
      console.warn(`Server responded with error status: ${error.response.status}`);
      return defaultProgress;
    } else if (error.request) {
      
      console.warn('No response received from server');
      return defaultProgress;
    } else {
      
      console.warn('Request failed:', error.message);
      return defaultProgress;
    }
  }
};


const updateTrainingProgress = async (trainingId: string, userId: number, data: { contentId?: string, completed?: boolean, progress?: number, status?: string }): Promise<any> => {
  try {
    console.log(`İlerleme güncellenecek - trainingId: ${trainingId}, userId: ${userId}`, data);
    
    
    if (!trainingId || !userId) {
      console.warn("Geçersiz ID değerleri, güncelleme yapılamadı");
      throw new Error("Geçersiz ID değerleri");
    }
    
    
    console.log('API İsteği Detayları:', { 
      url: `${trainingApiInstance.defaults.baseURL}/${trainingId}/progress/${userId}`,
      method: 'PUT',
      headers: trainingApiInstance.defaults.headers,
      data
    });
    
    
    const response = await trainingApiInstance.put(`/${trainingId}/progress/${userId}`, data);
    console.log("Progress güncelleme yanıtı:", response.status, response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error updating training progress:', error);
    
    
    if (error.response) {
      console.warn(`Server responded with error status: ${error.response.status}`);
      console.warn('Response data:', error.response.data);
      console.warn('Response headers:', error.response.headers);
      throw new Error(`İlerleme güncellenirken hata oluştu: ${error.response.statusText} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.warn('No response received from server');
      console.warn('Request details:', error.request);
      throw new Error('İlerleme güncellenirken sunucudan yanıt alınamadı');
    } else {
      console.warn('Request failed:', error.message);
      throw new Error(`İlerleme güncellenirken hata: ${error.message}`);
    }
  }
};

const TrainingDetail: React.FC<TrainingDetailProps> = ({ trainingId }) => {
  const navigate = useNavigate();
  const goBack = () => navigate(-1);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'quiz'>('overview');
  const [training, setTraining] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedTrainings, setRelatedTrainings] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeContent, setActiveContent] = useState<any>(null);
  
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [quizResults, setQuizResults] = useState<{ [key: string]: { score: number, passed: boolean, date: Date } }>({});
  const [_quizStatus, setQuizStatus] = useState<any>(null);
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [assignedSet, setAssignedSet] = useState<Set<number>>(new Set()); 
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  
  const [activeStreamPopup, setActiveStreamPopup] = useState<{ contentId: string; windowRef: Window | null; title: string } | null>(null);

  const [isEffectivelyCompleted, setIsEffectivelyCompleted] = useState(false);
  const [showQuizWarning, setShowQuizWarning] = useState(false);
  const [isTrainingAssigned, setIsTrainingAssigned] = useState(false);

  
  const userId = useMemo(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id;
      } catch (e) {
        console.error('User ID parse hatası:', e);
        return null;
      }
    }
    return null;
  }, []);

  useEffect(() => {
    const checkAssignment = async () => {
      if (userId && trainingId) {
        try {
          const assignments = await getTrainingAssignments(trainingId);
          
          setIsTrainingAssigned(assignments.includes(Number(userId)));
        } catch (err) {
          console.error('Eğitim atama kontrolü sırasında hata:', err);
          
          setIsTrainingAssigned(false);
        }
      }
    };
    
    checkAssignment();
  }, [trainingId, userId]);

  const loadTrainingDetails = async () => {
    try {
      setLoading(true);
      setError(null); 
      
      
      const trainingData = await getTrainingById(trainingId);
      
      if (!trainingData) {
        setError('Eğitim bulunamadı');
        setLoading(false);
        return;
      }
      
      setTraining(trainingData);
      
      const currentUser = tokenService.getUser();
      
      
      if (currentUser && currentUser.id) {
        try {
          console.log(`Progress API istek yapılıyor - user: ${currentUser.id}, training: ${trainingId}`);
          const progressData = await getTrainingProgress(trainingId, currentUser.id);
          console.log('Progress API yanıtı:', progressData);
          
          
          const normalizedProgress = {
            progress: progressData.progress_percentage !== undefined ? progressData.progress_percentage : progressData.progress || 0,
            status: progressData.status || 'NOT_STARTED',
            completedItems: progressData.completed_content_items || progressData.completedItems || [],
            completed: progressData.status === 'COMPLETED' || progressData.completed === true,
            quizResults: progressData.quizResults || [],
            startedAt: progressData.startedAt || progressData.started_at || null
          };
          
          console.log('Normalize edilmiş progress:', normalizedProgress);
          
          
          if (normalizedProgress.status === 'QUIZZES_PENDING') {
            setIsEffectivelyCompleted(false); 
            setShowQuizWarning(true); 
          }
          
          
          if (normalizedProgress.status === 'IN_PROGRESS') {
            console.log('Status IN_PROGRESS, hasStarted kontrolü:');
            const hasStartedCheck = 
              normalizedProgress.status === 'started' || 
              normalizedProgress.status === 'IN_PROGRESS' || 
              normalizedProgress.status === 'inprogress' ||
              normalizedProgress.status === 'COMPLETED' || 
              normalizedProgress.status === 'completed' || 
              (normalizedProgress.progress !== undefined && normalizedProgress.progress > 0);
            console.log(`hasStarted hesaplaması: ${hasStartedCheck}`);
          }
          
          setProgress(normalizedProgress);
        } catch (progressError) {
          
          console.error('API progress verisi alınamadı:', progressError);
          
          setProgress({
            progress: 0,
            completed: false,
            completedItems: [],
            quizResults: [],
            status: 'ERROR' 
          });
        }
      } else {
         
          setProgress({
            progress: 0,
            completed: false,
            completedItems: [],
            quizResults: [],
            status: 'NO_USER' 
          });
      }
      
      
      
      try {
       setRelatedTrainings([]); 
      } catch (relatedError) {
        console.error('İlgili eğitimler getirilemedi:', relatedError);
        setRelatedTrainings([]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Eğitim detayları yüklenirken hata oluştu:', err);
      setError('Eğitim bilgileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = tokenService.getUser();
    if (user && user.role) {
      setUserRole(user.role);
    }
    
    loadTrainingDetails();
  }, [trainingId]);
  
  useEffect(() => {
    const fetchQuizStatus = async () => {
      if (!trainingId) return;
      try {
        const status = await getQuizStatusForTraining(trainingId);
        setQuizStatus(status);
        
        const updatedResults: { [key: string]: { score: number, passed: boolean, date: Date } } = {};
        if (status && status.quizStatuses) {
          status.quizStatuses.forEach((q: any) => {
            if (q.attempted) {
              updatedResults[q.quizId] = {
                score: q.lastScore || 0,
                passed: q.passed,
                date: new Date() 
              };
            }
          });
        }
        setQuizResults(updatedResults);

        
        if (progress && status) {
          
          
          setIsEffectivelyCompleted(
            progress.status === 'COMPLETED' || 
            (progressPercentage >= 100 && 
              (status.allPassed === true || status.totalQuizzes === 0)
            )
          );
          
          
          
          setShowQuizWarning(
            progressPercentage >= 100 && 
            status.totalQuizzes > 0 && 
            !status.allPassed && 
            !isEffectivelyCompleted
          );
        }

      } catch (error) {
        console.error('Quiz durumu alınırken hata oluştu:', error);
        if ((error as any).response?.status === 403) {
            setError("Sınav durumunuza erişim yetkiniz bulunmamaktadır. Lütfen sistem yöneticisi ile iletişime geçin.");
        }
      }
    };
    
    if (trainingId && !loading && tokenService.getToken()) { 
      fetchQuizStatus();
    }
  }, [trainingId, loading, progress]); 

  useEffect(() => {
    const savedResults = localStorage.getItem(`quiz_results_${trainingId}`);
    if (savedResults) {
      try {
        setQuizResults(JSON.parse(savedResults));
      } catch (e) {
        console.error('Sınav sonuçları parse edilemedi:', e);
      }
    }
  }, [trainingId]);

  
  useEffect(() => {
    if (!activeStreamPopup || !activeStreamPopup.windowRef) {
      return;
    }

    const timer = setInterval(() => {
      if (activeStreamPopup.windowRef && activeStreamPopup.windowRef.closed) {
        clearInterval(timer);
        console.log(`Stream video popup for '${activeStreamPopup.title}' (ID: ${activeStreamPopup.contentId}) closed by user.`);
        
        
        
        setActiveStreamPopup(null); 
      }
    }, 1000); 

    return () => clearInterval(timer);
  }, [activeStreamPopup]);
  
  const handleStartQuiz = (quiz: any) => {
    setActiveQuiz(quiz);
    setIsQuizActive(true);
    
    setActiveTab('quiz');
  };

  const handleCompleteQuiz = async (score: number, passed: boolean, submittedAnswers: Record<string, string | string[]>) => {
    if (!activeQuiz?.id) return;
    const currentUser = tokenService.getUser();
    if (!currentUser || !currentUser.id || !trainingId) {
        console.error("Kullanıcı bilgisi veya eğitim ID eksik, sınav sonucu gönderilemiyor.");
        return;
    }
    
    try {
      setIsQuizActive(false); 
      setActiveQuiz(null);

      await submitQuizAttempt(trainingId, activeQuiz.id, submittedAnswers);
      
      const status = await getQuizStatusForTraining(trainingId);
      setQuizStatus(status);
      
      const updatedResults: { [key: string]: { score: number, passed: boolean, date: Date } } = { ...quizResults };
      if (status && status.quizStatuses) {
        status.quizStatuses.forEach((q: any) => {
          if (q.quizId === activeQuiz.id && q.attempted) {
            updatedResults[q.quizId] = {
              score: q.lastScore !== null ? q.lastScore : score,
              passed: q.passed !== null ? q.passed : passed,
              date: new Date()
            };
          }
        });
      }
      setQuizResults(updatedResults);

      
      const latestProgress = await getTrainingProgress(trainingId, currentUser.id);
      
      
      if (status && status.allPassed) {
        await updateTrainingProgress(trainingId, currentUser.id, {
          completed: true,
          status: 'COMPLETED',
          progress: 100
        });
        
        
        const finalProgress = await getTrainingProgress(trainingId, currentUser.id);
        setProgress(finalProgress);
        setIsEffectivelyCompleted(true);
        setShowQuizWarning(false);
        
        toast.success('Tebrikler! Eğitimi başarıyla tamamladınız.');
      } else {
        setProgress(latestProgress);
        
        if (latestProgress.status === 'QUIZZES_PENDING') {
          setShowQuizWarning(true);
          setIsEffectivelyCompleted(false);
        }
      }

    } catch (error) {
      console.error('Sınav sonucu gönderilirken hata oluştu:', error);
      setQuizResults(prev => ({
        ...prev,
        [activeQuiz.id]: { score, passed, date: new Date() }
      }));
      if ((error as any).response?.status === 400) {
        alert("Sınav cevapları gönderilirken bir sorun oluştu. Lütfen cevaplarınızı kontrol edin.");
      } else {
        alert("Sınav sonucu gönderilirken bir hata oluştu.");
      }
    } 
  };

  const handleCancelQuiz = () => {
    setIsQuizActive(false);
    setActiveQuiz(null);
    
    setActiveTab('content');
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        
        const departmentsData = await departmentApiService.getAllDepartments();
        setDepartments(departmentsData);
      } catch (error) {
        console.error('Departman bilgileri alınırken hata oluştu:', error);
      }
    };

    
    if (isAssignModalOpen) {
      fetchDepartments();
    }
  }, [isAssignModalOpen]);

  useEffect(() => {
    if (employees.length > 0) {
      setFilteredEmployees(
        employees.filter(employee => 
          employee.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [employees, searchTerm]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Eğitim bilgileri yükleniyor...</p>
      </div>
    );
  }
  
  if (error || !training) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-muted-foreground">
          {error || 'Eğitim bilgileri yüklenirken bir hata oluştu'}
        </p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={goBack}
        >
          Geri Dön
        </Button>
      </div>
    );
  }
  
  const hasStarted = 
    progress?.status === 'started' || 
    progress?.status === 'IN_PROGRESS' || 
    progress?.status === 'inprogress' ||
    progress?.status === 'COMPLETED' || 
    progress?.status === 'completed' || 
    (progress?.progress !== undefined && progress.progress > 0);
  const progressPercentage = progress?.progress_percentage || progress?.progress || 0;
  
  const isAdmin = userRole === 'ADMIN_SENIOR' || userRole === 'ADMIN_JUNIOR';

  
  const isContentCompleted = progressPercentage >= 100;

  const handleEditContent = () => {
    navigate(`/dashboard/admin/trainings/edit/${trainingId}`);
  };
  
  const handleOpenAssignModal = async () => {
    setAssignmentError(null);
    setProcessingIds(new Set());
    setSearchTerm('');
    
    try {
      setLoadingEmployees(true);
      
      
      const assignedUsers = await getTrainingAssignments(trainingId);
      setAssignedSet(new Set(assignedUsers));
      
      
      const allEmployeesData = await getAllEmployees(); 
      setEmployees(allEmployeesData.filter((user: any) => user.role === 'EMPLOYEE'));
      
      
      setFilteredEmployees(allEmployeesData.filter((user: any) => user.role === 'EMPLOYEE'));
      
      
      const departmentsData = await departmentApiService.getAllDepartments();
      setDepartments(departmentsData);
      
      setIsAssignModalOpen(true);
    } catch (err: any) {
      console.error('Çalışan bilgileri alınırken hata:', err);
      setAssignmentError('Çalışan bilgileri yüklenirken bir hata oluştu.');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleToggleAssignment = async (id: number) => {
    if (processingIds.has(id)) return;
    setAssignmentError(null);
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      if (assignedSet.has(id)) {
        const result = await unassignTraining(trainingId, id);
        if (result && result.success) {
          setAssignedSet(prev => { const s = new Set(prev); s.delete(id); return s; });
        } else if (result && result.message && result.message.includes('bootcamp')) {
          
          toast.error(result.message || 'Bu eğitim bir bootcamp içinde olduğu için çıkarılamıyor.');
          setAssignmentError(result.message || 'Bu eğitim bir bootcamp içinde olduğu için çıkarılamıyor.');
        } else {
          throw new Error(result.message || 'Atama işlemi sırasında hata oluştu.');
        }
      } else {
        await assignTrainingToUser(trainingId, id);
        setAssignedSet(prev => { const s = new Set(prev); s.add(id); return s; });
      }
    } catch (err) {
      console.error('Atama güncelleme hatası:', err);
      setAssignmentError('Atama işlemi sırasında hata oluştu.');
    } finally {
      setProcessingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  
  const handleOpenMicrosoftStream = (contentItem: any) => {
    
    
    
    const validDomains = [
      'microsoft.com', 
      'microsoftstream.com', 
      'office.com',
      'onedrive.live.com',
      'sharepoint.com',
      '1drv.ms'
    ];
    
    
    if (!contentItem.content || !validDomains.some(domain => contentItem.content.includes(domain))) {
      console.error('Geçersiz Microsoft Stream/OneDrive URL');
      toast.error('Microsoft Stream videosu veya OneDrive dosyası yüklenirken bir hata oluştu.');
      return;
    }
    
    const streamUrl = sanitizeUrl(contentItem.content);
    
    try {
      
      const windowRef = window.open(streamUrl, '_blank', 'width=1200,height=800');
      if (windowRef) {
        setActiveStreamPopup({
          contentId: contentItem.id,
          windowRef,
          title: contentItem.title
        });
      } else {
        toast.error('Tarayıcınız pop-up penceresi açmayı engelledi');
      }
    } catch (error) {
      console.error('Microsoft Stream/OneDrive pop-up açılırken hata:', error);
      toast.error('İçerik açılırken bir hata oluştu');
    }
  };

  const ContentItem = ({ content }: { content: any }) => {
    if (content.type === 'youtube') {
      const safeYoutubeUrl = sanitizeUrl(getYoutubeEmbedUrl(content.videoUrl || content.content || ''));
      if (!safeYoutubeUrl) {
        return <div className="p-4 text-red-500">Güvenlik nedeniyle bu video görüntülenemiyor.</div>;
      }
      
      return (
        <div className="relative aspect-video">
          <iframe
            src={safeYoutubeUrl}
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            allowFullScreen
            title={content.title || "YouTube video"}
            sandbox="allow-same-origin allow-scripts allow-forms"
            loading="lazy"
          ></iframe>
        </div>
      );
    } else if (content.type === 'pdf') {
      const safePdfUrl = sanitizeUrl(content.fileUrl || content.content || '');
      if (!safePdfUrl) {
        return <div className="p-4 text-red-500">Güvenlik nedeniyle bu PDF görüntülenemiyor.</div>;
      }
      
      return (
        <div className="relative w-full" style={{ height: '70vh' }}>
          {}
          <iframe
            src={safePdfUrl}
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            title={content.title || "PDF Dokümanı"}
            sandbox="allow-same-origin allow-scripts"
            loading="lazy"
          ></iframe>
        </div>
      );
    } else if (content.type === 'html' || content.type === 'text') {
      
      const sanitizedHtml = sanitizeHtml(content.content || '');
      
      return (
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizedHtml }}></div>
      );
    } else if (content.type === 'image') {
      const safeImageUrl = sanitizeUrl(content.fileUrl || '');
      if (!safeImageUrl) {
        return <div className="p-4 text-red-500">Güvenlik nedeniyle bu resim görüntülenemiyor.</div>;
      }
      
      return (
        <div className="flex flex-col items-center justify-center p-4 gap-4">
          <img 
            src={safeImageUrl} 
            alt={content.title || "Eğitim İçeriği"} 
            className="max-w-full h-auto rounded-lg"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = '/placeholder-image.jpg';
              e.currentTarget.alt = 'Resim yüklenemedi';
            }}
          />
          {content.title && <p className="text-center">{content.title}</p>}
        </div>
      );
    } else if (content.type === 'microsoft') {
       
       const isOneDrive = content.content && (
         content.content.includes('onedrive') || 
         content.content.includes('sharepoint') || 
         content.content.includes('1drv.ms')
       );
       
       const contentType = isOneDrive ? "OneDrive dosyası" : "Microsoft Stream videosu";
       
       return (
        <div className="p-6 text-center text-muted-foreground">
          <div className="flex justify-center mb-4">
            <ExternalLink className="h-16 w-16 text-blue-500" />
          </div>
          <h3 className="text-lg font-medium mb-2">{content.title}</h3>
          <p className="mb-4">Bu {contentType} yeni bir pencerede açılacaktır.</p>
          <Button 
            onClick={() => handleOpenMicrosoftStream(content)}
            className="mx-auto"
          >
            {isOneDrive ? "Dosyayı Görüntüle" : "Videoyu İzle"}
          </Button>
        </div>
       );
    } else {
      return (
        <div className="p-4">
          <p>{content.title}</p>
          <p className="text-sm text-gray-500">Bu içerik tipini görüntülemek için uygun bileşen bulunamadı.</p>
        </div>
      );
    }
  };
  
  const handleContentItemClick = (contentItem: any) => {
    
    if (contentItem.type === 'microsoft') {
      
      handleOpenMicrosoftStream(contentItem);
    } else {
      setActiveStreamPopup(null); 
      setActiveContent(contentItem);
      setActiveTab('content'); 
    }
  };
  
  const handleStartTraining = async () => {
    const currentUser = tokenService.getUser();
    if (!currentUser || !currentUser.id || !trainingId) return;
    
    console.log("Eğitim başlatılıyor...");
    
    try {
      
      const updatedProgressData = await updateTrainingProgress(
        trainingId,
        currentUser.id,
        { 
          progress: 0, 
          status: 'IN_PROGRESS',
        }
      );
      
      console.log("Eğitim başlatıldı, API yanıtı:", updatedProgressData);
      
      
      if (updatedProgressData) {
        
        const normalizedProgress = {
          progress: updatedProgressData.progress_percentage !== undefined ? updatedProgressData.progress_percentage : updatedProgressData.progress || 0,
          status: updatedProgressData.status || 'IN_PROGRESS',
          completedItems: updatedProgressData.completed_content_items || updatedProgressData.completedItems || [],
          completed: updatedProgressData.status === 'COMPLETED' || updatedProgressData.completed === true,
          quizResults: updatedProgressData.quizResults || [],
          startedAt: updatedProgressData.startedAt || updatedProgressData.started_at || new Date()
        };
        
        console.log("State için normalize edilmiş progress verisi:", normalizedProgress);
        setProgress(normalizedProgress);
        
        
        if (training?.content && training.content.length > 0) {
          setActiveTab('content');
          const firstNonStreamContent = training.content.find((c:any) => c.type !== 'microsoft');
          if (firstNonStreamContent) {
            setActiveContent(firstNonStreamContent);
          } else if (training.content[0]?.type === 'microsoft') {
            
            handleOpenMicrosoftStream(training.content[0]);
          }
        }
        
        
        toast.success("Eğitim başarıyla başlatıldı! İçerikleri keşfetmeye başlayabilirsiniz.");
      } else {
        console.warn("API'den ilerleme verisi alındı, ancak veri boş veya eksik.");
        toast.error("Eğitim başlatıldı, ancak ilerleme bilgisi güncellenemedi. Sayfayı yenileyebilirsiniz.");
      }
    } catch (error) {
      console.error("Eğitim başlatılırken hata:", error);
      
      
      let errorMessage = "Eğitim başlatılırken bir hata oluştu";
      if ((error as any)?.response?.status === 500) {
        errorMessage += ": Sunucu hatası";
      }
      
      toast.error(errorMessage);
    }
  };
  
  const handleQuizTabClick = () => {
    if (!training.quizzes || training.quizzes.length === 0) {
      toast.error('Bu eğitimde sınav bulunmuyor.');
      return;
    }
    
    if (!isTrainingAssigned) {
      toast.error('Bu eğitim size atanmadığı için sınavı çözemezsiniz.');
      setShowQuizWarning(true);
      return;
    }
    
    setActiveTab('quiz');
    
    if (training.quizzes && training.quizzes.length > 0) {
      setActiveQuiz(training.quizzes[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 w-9 p-0" 
          onClick={goBack}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Geri</span>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{training.title}</h1>
      </div>

      {}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Eğitime Katılımcı Ekle</h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => setIsAssignModalOpen(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Kapat</span>
              </Button>
            </div>
            
            <div className="p-4 border-b">
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="İsim, soyisim veya e-posta ile ara..."
                    className="w-full py-2 pl-10 pr-4 border rounded-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Departmana Göre Filtrele</label>
                  <select 
                    className="w-full py-2 px-3 border rounded-md"
                    onChange={(e) => {
                      const departmentId = e.target.value;
                      
                      if (departmentId) {
                        
                        const filteredEmps = employees.filter(emp => 
                          emp.department?.id === Number(departmentId) ||
                          emp.employee?.departmentId === Number(departmentId)
                        );
                        setFilteredEmployees(filteredEmps);
                      } else {
                        
                        setFilteredEmployees(employees.filter(employee => 
                          employee.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          employee.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
                        ));
                      }
                    }}
                  >
                    <option value="">Tüm Departmanlar</option>
                    {(departments || []).map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  
                  <div className="mt-2">
                    <Button 
                      className="w-full flex items-center justify-center gap-2"
                      variant="outline"
                      onClick={async () => {
                        
                        setLoadingEmployees(true);
                        
                        try {
                          const processingPromises = [];
                          
                          for (const employee of filteredEmployees) {
                            
                            if (!processingIds.has(employee.id)) {
                              
                              setProcessingIds(prev => new Set(prev).add(employee.id));
                              
                              
                              
                              
                              const anyAssigned = filteredEmployees.some(emp => assignedSet.has(emp.id));
                              
                              if (anyAssigned) {
                                
                                if (assignedSet.has(employee.id)) {
                                  processingPromises.push(
                                    unassignTraining(trainingId, employee.id)
                                      .then(() => {
                                        setAssignedSet(prev => {
                                          const newSet = new Set(prev);
                                          newSet.delete(employee.id);
                                          return newSet;
                                        });
                                      })
                                  );
                                }
                              } else {
                                
                                if (!assignedSet.has(employee.id)) {
                                  processingPromises.push(
                                    assignTrainingToUser(trainingId, employee.id)
                                      .then(() => {
                                        setAssignedSet(prev => {
                                          const newSet = new Set(prev);
                                          newSet.add(employee.id);
                                          return newSet;
                                        });
                                      })
                                  );
                                }
                              }
                            }
                          }
                          
                          
                          await Promise.all(processingPromises);
                          
                        } catch (err) {
                          console.error('Toplu atama hatası:', err);
                          setAssignmentError('Departmandaki çalışanlar atanırken bir hata oluştu.');
                        } finally {
                          
                          setProcessingIds(new Set());
                          setLoadingEmployees(false);
                        }
                      }}
                    >
                      <UserPlus className="h-4 w-4" />
                      Departmandaki Tüm Çalışanları Seç
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-grow overflow-auto p-4">
              {loadingEmployees ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredEmployees.length > 0 ? (
                <div className="space-y-2">
                  {filteredEmployees.map(employee => (
                    <div 
                      key={employee.id} 
                      className={`p-3 border rounded-md flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors ${
                        assignedSet.has(employee.id) ? 'bg-primary/10 border-primary/30' : ''
                      }`}
                      onClick={() => handleToggleAssignment(employee.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                          {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-medium">{employee.firstName} {employee.lastName}</h4>
                          <p className="text-sm text-muted-foreground">{employee.email}</p>
                          {employee.department && (
                            <p className="text-xs text-muted-foreground">
                              {employee.department.name}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="w-6 h-6 rounded-md border flex items-center justify-center">
                        {processingIds.has(employee.id) ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : assignedSet.has(employee.id) ? (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  {searchTerm ? 'Arama kriterlerine uygun çalışan bulunamadı.' : 'Henüz çalışan bulunmuyor.'}
                </div>
              )}
            </div>
            
            {assignmentError && (
              <div className="p-4 border-t bg-red-100 text-red-800 rounded-md">
                {assignmentError}
              </div>
            )}
            <div className="p-4 border-t flex justify-end">
              <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
                Kapat
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {}
          {}
          {activeTab === 'content' && activeStreamPopup && (
            <Card>
              <CardContent className="p-6 text-center">
                <ExternalLink className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Dış Kaynak Açık</h3>
                {}
                {activeStreamPopup.title && (
                  <p className="text-muted-foreground mt-2">
                    "{activeStreamPopup.title}" başlıklı içerik yeni bir pencerede açıldı.
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  İçeriği incelemeyi tamamladıktan sonra aşağıdaki butonu kullanarak veya içerik listesinden bu içeriği "Tamamlandı" olarak işaretleyebilirsiniz.
                </p>
                <Button
                  variant="primary"
                  className="mt-4"
                  onClick={async () => {
                    const user = tokenService.getUser();
                    if (user && user.id && activeStreamPopup.contentId) {
                      try {
                        const updatedProgressData = await updateTrainingProgress(
                          trainingId,
                          user.id,
                          { contentId: activeStreamPopup.contentId }
                        );
                        setProgress(updatedProgressData);
                        activeStreamPopup.windowRef?.close(); 
                        setActiveStreamPopup(null); 
                      } catch (err) {
                        console.error("Error marking content as completed:", err);
                        alert("İçerik tamamlandı olarak işaretlenirken bir hata oluştu.");
                      }
                    }
                  }}
                  disabled={progress?.completedItems?.includes(activeStreamPopup.contentId)}
                >
                  {progress?.completedItems?.includes(activeStreamPopup.contentId) ? 
                    <><CheckCircle className="h-4 w-4 mr-2" />Tamamlandı</> : 
                    'Bu İçeriği Tamamlandı Olarak İşaretle'
                  }
                </Button>
                <Button variant="outline" className="mt-2 ml-2" onClick={() => {
                    activeStreamPopup.windowRef?.focus(); 
                }}>
                    İçeriğe Git
                </Button>
                <Button variant="ghost" className="mt-2 ml-2" onClick={() => {
                    activeStreamPopup.windowRef?.close(); 
                }}>
                    Bildirimi Kapat
                </Button>
              </CardContent>
            </Card>
          )}

          {}
          {!(activeTab === 'content' && activeStreamPopup) && (
            <Card>
              {activeTab === 'content' && activeContent && (
                <div className="p-6 border-b">
                  <ContentItem content={activeContent} />
                  <div className="flex justify-between items-center pt-4 mt-4 border-t">
                     <Button variant="outline" onClick={() => setActiveContent(null)}>Listeye Dön</Button>
                     {activeContent && activeContent.type !== 'microsoft' && ( 
                       <Button 
                         variant="primary"
                         className="flex items-center gap-2"
                         disabled={progress?.completedItems?.includes(activeContent.id)}
                         onClick={async () => {
                           try {
                             const user = tokenService.getUser();
                             if (!user || !user.id) {
                               console.error('Kullanıcı bilgisi bulunamadı');
                               return;
                             }
                             const updatedProgressData = await updateTrainingProgress(
                               trainingId,
                               user.id,
                               { contentId: activeContent.id }
                             );
                             setProgress(updatedProgressData);
                           } catch (error) {
                             console.error('Error marking content as completed:', error);
                             console.log('Hata detayları:', { 
                               trainingId, 
                               contentId: activeContent.id,
                               error: error instanceof Error ? error.stack : error 
                             });
                           }
                         }}
                       >
                         {progress?.completedItems?.includes(activeContent.id) ? (
                           <><CheckCircle className="h-4 w-4" /> Tamamlandı</>
                         ) : (
                           <><CheckCircle className="h-4 w-4" /> Tamamlandı Olarak İşaretle</>
                         )}
                       </Button>
                     )}
                  </div>
                </div>
              )}
              
              <div className="border-b">
                 <div className="flex overflow-x-auto">
                   <button
                     className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                       activeTab === 'overview'
                         ? 'border-primary text-foreground'
                         : 'border-transparent text-muted-foreground hover:text-foreground'
                     }`}
                     onClick={() => { setActiveTab('overview'); setActiveContent(null); setActiveStreamPopup(null); }}
                   >
                     Genel Bakış
                   </button>
                   <button
                     className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                       activeTab === 'content'
                         ? 'border-primary text-foreground'
                         : 'border-transparent text-muted-foreground hover:text-foreground'
                     }`}
                     onClick={() => { setActiveTab('content'); setActiveContent(null); setActiveStreamPopup(null); }}
                   >
                     İçerik ({training.content?.length || 0})
                   </button>
                   <button
                     className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                       activeTab === 'quiz'
                         ? 'border-primary text-foreground'
                         : 'border-transparent text-muted-foreground hover:text-foreground'
                     }`}
                     onClick={handleQuizTabClick}
                     disabled={!isTrainingAssigned}
                   >
                     Sınavlar ({training.quizzes?.length || 0})
                   </button>
                 </div>
               </div>
              
              {((activeTab === 'content' && !activeContent && !activeStreamPopup) || activeTab !== 'content') && (
                <CardContent className="p-6">
                  {activeTab === 'overview' && (
                    <div className="space-y-4">
                    <p className="text-muted-foreground">{training.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{training.duration} dakika</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{training.author}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(training.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      {training.certificateTemplate && (
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Sertifika mevcut</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">Bu Eğitimden Ne Öğreneceksiniz?</h3>
                        {isAdmin && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 gap-1"
                            onClick={handleEditContent}
                          >
                            <Edit className="h-4 w-4" />
                            <span>Düzenle</span>
                          </Button>
                        )}
                      </div>
                      <ul className="space-y-2">
                        {training.learningOutcomes && training.learningOutcomes.length > 0 ? (
                          training.learningOutcomes.map((outcome: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                              <span>{outcome}</span>
                            </li>
                          ))
                        ) : (
                          <>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                              <span>Konunun temel prensipleri ve uygulamaları</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                              <span>Gerçek dünya örnekleri ve pratik uygulamalar</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                              <span>Doğrudan işinizde kullanabileceğiniz teknikler</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                  )}
                  
                  {activeTab === 'content' && (
                    <div className="space-y-4">
                      {training.content && training.content.length > 0 ? (
                        training.content.map((content: any, index: number) => (
                          <div 
                            key={content.id} 
                            className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => handleContentItemClick(content)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="font-medium">{content.title}</h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="capitalize">
                                    {content.type === 'youtube' ? 'YouTube Video' : 
                                    content.type === 'microsoft' ? 'Microsoft Stream' : 
                                    content.type}
                                  </span>
                                  {content.duration && (
                                    <>
                                      <span>•</span>
                                      <span>{content.duration} dakika</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {progress?.completedItems?.some((p: string) => p === content.id) ? (
                              <CheckCircle className="h-5 w-5 text-success" />
                            ) : (
                              
                              <Play className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <p>Bu eğitim için henüz içerik bulunmuyor.</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {activeTab === 'quiz' && (
                    <QuizTabContent 
                      training={training} 
                      activeQuiz={activeQuiz}
                      isQuizActive={isQuizActive}
                      quizResults={quizResults}
                      onStartQuiz={handleStartQuiz}
                      onCompleteQuiz={handleCompleteQuiz}
                      onCancelQuiz={handleCancelQuiz}
                      isContentCompleted={isContentCompleted}
                    />
                  )}
                </CardContent>
              )}
            </Card>
          )}
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Eğitim Durumu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEffectivelyCompleted ? (
                <div className="flex flex-col items-center text-center p-4">
                  <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-3">
                    <CheckCircle className="h-8 w-8 text-success" />
                  </div>
                  <h3 className="font-semibold text-lg">Eğitim Tamamlandı!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Bu eğitimi başarıyla tamamladınız.
                  </p>
                  
                  {training.certificateTemplate && (
                    <Button 
                      className="mt-4 w-full"
                      onClick={() => navigate(`/certificates?training=${training.id}`)}
                    >
                      Sertifikayı Görüntüle
                    </Button>
                  )}
                </div>
              ) : showQuizWarning ? (
                <div className="flex flex-col items-center text-center p-4">
                  <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center mb-3">
                    <AlertCircle className="h-8 w-8 text-warning" />
                  </div>
                  <h3 className="font-semibold text-lg">Sınavları tamamlayın!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {progress?.status === 'QUIZZES_PENDING' 
                      ? 'Eğitim içeriğini tamamladınız, ancak eğitimi bitirebilmek için sınavları çözmeniz gerekiyor. Lütfen önce bu eğitime atanmanızı sağlayın.'
                      : 'Eğitim içeriğini tamamladınız, ancak eğitimin bitirilmesi için sınavları da geçmeniz gerekiyor.'}
                  </p>
                  {isTrainingAssigned ? (
                    <Button 
                      className="mt-4 w-full"
                      onClick={() => setActiveTab('quiz')}
                    >
                      Sınavlara Git
                    </Button>
                  ) : (
                    <p className="text-xs text-red-500 mt-2">
                      Sınavları çözebilmek için, bu eğitimin size atanmış olması gerekiyor.
                      Lütfen yöneticinizle iletişime geçin.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block text-primary">
                          İlerleme
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-primary">
                          %{progressPercentage}
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary/20">
                      <div 
                        style={{ width: `${progressPercentage}%` }} 
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500"
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={() => {
                        if (hasStarted) {
                          
                          if (training.content && training.content.length > 0) {
                            setActiveTab('content');
                            
                            const firstContent = training.content[0];
                            if (firstContent) {
                                if (firstContent.type === 'microsoft') {
                                    handleOpenMicrosoftStream(firstContent);
                                } else {
                                    setActiveContent(firstContent);
                                }
                            }
                          }
                        } else {
                          handleStartTraining();
                        }
                      }}
                    >
                      {hasStarted ? 'Eğitime Devam Et' : 'Eğitime Başla'}
                    </Button>
                    
                    {}
                    {isAdmin && (
                      <Button 
                        variant="outline"
                        className="w-full mt-2 flex items-center justify-center gap-2"
                        onClick={handleOpenAssignModal}
                      >
                        <UserPlus className="h-4 w-4" />
                        Eğitime Katılımcı Ekle
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Benzer Eğitimler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {relatedTrainings && relatedTrainings.length > 0 ? (
                relatedTrainings.map((relatedTraining: any) => (
                  <div
                    key={relatedTraining.id}
                    className="flex items-start space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/dashboard/trainings/${relatedTraining.id}`)}
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-sm line-clamp-1">{relatedTraining.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{relatedTraining.duration} dakika</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>Benzer eğitim bulunamadı.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TrainingDetail;