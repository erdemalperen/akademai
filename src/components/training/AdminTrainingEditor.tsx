import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Save, Trash2, Edit2, Loader2, Check, Trash, PlusCircle, ExternalLink } from 'lucide-react';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import { tokenService } from '../../lib/api/apiClient';
import { getTrainingById, updateTrainingContent } from '../../services/trainingApiService';
import { Alert } from '../ui/Alert';
import axios from 'axios';
import { Training } from '../../types';
import { Quiz, Question } from '../../types/index';
import { ConfirmModal } from '../ui';


const ContentTypeSelector = ({ 
  value, 
  onChange 
}: { 
  value: string, 
  onChange: (value: string) => void 
}) => {
  const options = [
    { value: 'youtube', label: 'YouTube Video' },
    { value: 'microsoft', label: 'Microsoft Stream' },
    { value: 'pdf', label: 'PDF' },
    { value: 'text', label: 'Metin' },
    { value: 'interactive', label: 'İnteraktif' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`px-3 py-1 rounded-md text-sm ${
            value === option.value 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

const AdminTrainingEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id: trainingId } = useParams<{ id: string }>();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [training, setTraining] = useState<Training | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [contentUrlError, setContentUrlError] = useState<string | null>(null);
  
  
  const [activeTab, setActiveTab] = useState<'content' | 'quiz'>('content');
  
  
  const [editingContentIndex, setEditingContentIndex] = useState<number | null>(null);
  const [contentEdits, setContentEdits] = useState<any[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null); 
  const [uploadingPdfIndex, setUploadingPdfIndex] = useState<number | null>(null);
  const [pdfUploadError, setPdfUploadError] = useState<string | null>(null);
  
  
  const [editingQuizIndex, setEditingQuizIndex] = useState<number | null>(null);
  const [quizEdits, setQuizEdits] = useState<Quiz[]>([]);
  
  
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [editingQuestionQuizIndex, setEditingQuestionQuizIndex] = useState<number | null>(null);

  
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>([]);
  const [newOutcome, setNewOutcome] = useState('');

  
  const [isContentDeleteModalOpen, setIsContentDeleteModalOpen] = useState<boolean>(false);
  const [contentToDelete, setContentToDelete] = useState<number | null>(null);
  
  
  const [isQuizDeleteModalOpen, setIsQuizDeleteModalOpen] = useState<boolean>(false);
  const [quizToDelete, setQuizToDelete] = useState<number | null>(null);
  
  
  const [isQuestionDeleteModalOpen, setIsQuestionDeleteModalOpen] = useState<boolean>(false);
  const [questionToDelete, setQuestionToDelete] = useState<{quizIndex: number, questionIndex: number} | null>(null);

  
  useEffect(() => {
    const user = tokenService.getUser();
    if (!user || (user.role !== 'ADMIN_SENIOR' && user.role !== 'ADMIN_JUNIOR')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  
  useEffect(() => {
    const loadTraining = async () => {
      if (!trainingId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const data = await getTrainingById(trainingId);
        
        
        if (!data) {
          setError('Eğitim bulunamadı');
          setLoading(false);
          return;
        }
        
        setTraining(data);
        
        
        if (data && data.content) {
          setContentEdits([...data.content]);
        }
        
        
        if (data && data.quizzes) {
          setQuizEdits([...data.quizzes]);
        }
        
        
        
        const outcomes = (data as any).learningOutcomes || [];
        if (outcomes && outcomes.length > 0) {
          setLearningOutcomes([...outcomes]);
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Eğitim yüklenirken hata:', err);
        setError('Eğitim bilgileri yüklenirken bir hata oluştu.');
        setLoading(false);
      }
    };
    
    loadTraining();
  }, [trainingId]);

  
  const handleSaveTraining = async () => {
    if (!training || !trainingId) return;
    
    try {
      setSaving(true);
      setError(null);
      
      
      const updatedTraining = {
        ...training,
        content: contentEdits,
        quizzes: quizEdits,
        
        learningOutcomes: learningOutcomes
      };
      
      
      await updateTrainingContent(trainingId, updatedTraining);
      
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      setSaving(false);
    } catch (err: any) {
      console.error('Eğitim güncellenirken hata:', err);
      setError('Eğitim güncellenirken bir hata oluştu.');
      setSaving(false);
    }
  };

  
  const handleAddContent = () => {
    const newContent = {
      id: `temp_${Date.now()}`,
      type: 'text',
      title: 'Yeni İçerik',
      content: '',
      duration: 10,
      order: contentEdits.length + 1
    };
    
    setContentEdits([...contentEdits, newContent]);
    setEditingContentIndex(contentEdits.length);
  };

  
  const handleDeleteContent = (index: number) => {
    setContentToDelete(index);
    setIsContentDeleteModalOpen(true);
  };

  
  const confirmDeleteContent = () => {
    if (contentToDelete === null) return;
    
    
    if (editingContentIndex === contentToDelete) {
      setEditingContentIndex(null);
    }

    const newContents = [...contentEdits];
    newContents.splice(contentToDelete, 1);
    setContentEdits(newContents);
    
    
    setContentToDelete(null);
  };

  
  const handleUpdateContent = (index: number, field: string, value: any) => {
    const newContents = [...contentEdits];
    console.log(`[AdminTrainingEditor] Updating content at index ${index}, field: ${field}, value:`, value);
    const updatedItem = { ...newContents[index], [field]: value };
    newContents[index] = updatedItem;
    setContentEdits(newContents);
    console.log('[AdminTrainingEditor] Updated contentEdits state:', newContents);

    
    if (field === 'content' && (updatedItem.type === 'youtube' || updatedItem.type === 'microsoft')) {
      validateContentUrl(updatedItem.type, value);
    } else if (field === 'content') {
      
      setContentUrlError(null);
    } else if (field === 'type') {
      
      const newType = value;
      const contentValue = updatedItem.content;
      if ((newType === 'youtube' || newType === 'microsoft') && typeof contentValue === 'string') {
        validateContentUrl(newType, contentValue);
      } else {
        
        setContentUrlError(null);
      }
    }
  };

  
  const validateContentUrl = (type: string, url: string) => {
    let isValid = true;
    let errorMessage = null;

    if (type === 'youtube' && url && !(url.includes('youtube.com') || url.includes('youtu.be'))) {
      isValid = false;
      errorMessage = 'Geçerli bir YouTube URL formatı girin (youtube.com veya youtu.be içermeli).';
    } else if (type === 'microsoft' && url) {
      
      const microsoftDomains = ['microsoft.com', 'sharepoint.com', 'onedrive.live.com', 'stream.microsoft.com'];
      const urlHostname = tryGetHostname(url);
      if (!urlHostname || !microsoftDomains.some(domain => urlHostname.includes(domain))) {
        isValid = false;
        errorMessage = 'Geçerli bir Microsoft URL formatı girin (microsoft, stream, sharepoint veya onedrive içermeli).';
      }
    }

    setContentUrlError(errorMessage);
    return isValid;
  };

  
  const tryGetHostname = (url: string): string | null => {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return null;
    }
  };

  
  const handleAddQuiz = () => {
    const newQuiz: Quiz = {
      id: `temp_${Date.now()}`,
      title: 'Yeni Sınav',
      description: 'Sınav açıklaması',
      passingScore: 70,
      timeLimit: 30,
      questions: []
    };
    
    setQuizEdits([...quizEdits, newQuiz]);
    setEditingQuizIndex(quizEdits.length);
  };

  
  const handleDeleteQuiz = (index: number) => {
    setQuizToDelete(index);
    setIsQuizDeleteModalOpen(true);
  };

  
  const confirmDeleteQuiz = () => {
    if (quizToDelete === null) return;
    
    
    if (editingQuizIndex === quizToDelete) {
      setEditingQuizIndex(null);
    }

    const newQuizzes = [...quizEdits];
    newQuizzes.splice(quizToDelete, 1);
    setQuizEdits(newQuizzes);
    
    
    setQuizToDelete(null);
  };

  
  const handleUpdateQuiz = (index: number, field: string, value: any) => {
    const newQuizzes = [...quizEdits];
    newQuizzes[index] = {
      ...newQuizzes[index],
      [field]: value
    };
    setQuizEdits(newQuizzes);
  };

  
  const handleAddQuestion = (quizIndex: number) => {
    const newQuestion: Question = {
      
      
      id: `temp_q_${Date.now()}`,
      
      text: '', 
      type: 'multiple-choice', 
      options: ['Seçenek 1', 'Seçenek 2'], 
      correctAnswer: [], 
      points: 10, 
    };

    const newQuizzes = [...quizEdits];
    if (!newQuizzes[quizIndex].questions) {
      newQuizzes[quizIndex].questions = [];
    }
    newQuizzes[quizIndex].questions.push(newQuestion);
    setQuizEdits(newQuizzes);
    setEditingQuestionQuizIndex(quizIndex);
    setEditingQuestionIndex(newQuizzes[quizIndex].questions.length - 1);
  };

  const handleEditQuestion = (quizIndex: number, questionIndex: number) => {
    setEditingQuestionQuizIndex(quizIndex);
    setEditingQuestionIndex(questionIndex);
  };

  const handleCancelEditQuestion = () => {
    setEditingQuestionQuizIndex(null);
    setEditingQuestionIndex(null);
    
    
  };

  const handleUpdateQuestion = (quizIndex: number, questionIndex: number, field: keyof Question | 'correctAnswerBoolean', value: any) => {
    setQuizEdits(prevEdits => {
      const updatedQuizzes = [...(prevEdits || [])];
      const quiz = updatedQuizzes[quizIndex];
      if (!quiz || !quiz.questions) return prevEdits;

      const updatedQuestions = [...quiz.questions];
      const questionToUpdate = { ...updatedQuestions[questionIndex] };

      if (field === 'correctAnswerBoolean') {
        
        questionToUpdate.correctAnswer = value ? 'true' : 'false';
      } else if (field === 'correctAnswer') {
        
        try {
            
            const parsedValue = JSON.parse(value);
            questionToUpdate.correctAnswer = parsedValue;
        } catch (e) {
            
            questionToUpdate.correctAnswer = value;
        }
      } else if (field === 'options') {
          try {
              const parsedOptions = JSON.parse(value);
              if (Array.isArray(parsedOptions)) {
                  questionToUpdate.options = parsedOptions;
              } else {
                  console.error("Parsed options are not an array:", parsedOptions);
                  
              }
          } catch (e) {
              console.error("Failed to parse options JSON string:", value, e);
              
          }
      } else if (field in questionToUpdate) {
        
        (questionToUpdate as any)[field] = value;
      }

      updatedQuestions[questionIndex] = questionToUpdate;
      quiz.questions = updatedQuestions;
      updatedQuizzes[quizIndex] = quiz;

      return updatedQuizzes;
    });
  };

  
  const handleDeleteQuestion = (quizIndex: number, questionIndex: number) => {
    setQuestionToDelete({ quizIndex, questionIndex });
    setIsQuestionDeleteModalOpen(true);
  };

  
  const confirmDeleteQuestion = () => {
    if (!questionToDelete) return;
    
    const { quizIndex, questionIndex } = questionToDelete;
    
    
    if (editingQuizIndex === quizIndex && editingQuestionIndex === questionIndex) {
      setEditingQuestionIndex(null);
    }

    const updatedQuizzes = [...quizEdits];
    updatedQuizzes[quizIndex].questions.splice(questionIndex, 1);
    setQuizEdits(updatedQuizzes);
    
    
    setQuestionToDelete(null);
  };

  
  const handleAddOption = (quizIndex: number, questionIndex: number) => {
    setQuizEdits(prevEdits => {
      const updatedQuizzes = [...(prevEdits || [])];
      const quiz = updatedQuizzes[quizIndex];
      if (!quiz || !quiz.questions) return prevEdits;

      const updatedQuestions = [...quiz.questions];
      const questionToUpdate = { ...updatedQuestions[questionIndex] };

      
      const currentOptions = Array.isArray(questionToUpdate.options) ? [...questionToUpdate.options] : [];

      currentOptions.push(`Seçenek ${currentOptions.length + 1}`);
      questionToUpdate.options = currentOptions; 

      updatedQuestions[questionIndex] = questionToUpdate;
      quiz.questions = updatedQuestions;
      updatedQuizzes[quizIndex] = quiz;

      return updatedQuizzes;
    });
  };

  const handleUpdateOption = (quizIndex: number, questionIndex: number, optionIndex: number, value: string) => {
    setQuizEdits(prevEdits => {
      const updatedQuizzes = [...(prevEdits || [])];
      const quiz = updatedQuizzes[quizIndex];
      if (!quiz || !quiz.questions) return prevEdits;

      const updatedQuestions = [...quiz.questions];
      const questionToUpdate = { ...updatedQuestions[questionIndex] };

      
      const currentOptions = Array.isArray(questionToUpdate.options) ? [...questionToUpdate.options] : [];

      const oldOptionValue = currentOptions[optionIndex];
      currentOptions[optionIndex] = value;
      questionToUpdate.options = currentOptions; 

      
      const currentCorrectAnswers = Array.isArray(questionToUpdate.correctAnswer) ? [...questionToUpdate.correctAnswer] : [];
      const updatedCorrectAnswers = currentCorrectAnswers.map((ans: string) => ans === oldOptionValue ? value : ans);
      questionToUpdate.correctAnswer = updatedCorrectAnswers; 

      updatedQuestions[questionIndex] = questionToUpdate;
      quiz.questions = updatedQuestions;
      updatedQuizzes[quizIndex] = quiz;

      return updatedQuizzes;
    });
  };

  const handleRemoveOption = (quizIndex: number, questionIndex: number, optionIndex: number) => {
    setQuizEdits(prevEdits => {
      const updatedQuizzes = [...(prevEdits || [])];
      const quiz = updatedQuizzes[quizIndex];
      if (!quiz || !quiz.questions) return prevEdits;

      const updatedQuestions = [...quiz.questions];
      const questionToUpdate = { ...updatedQuestions[questionIndex] };

      
      const currentOptions = Array.isArray(questionToUpdate.options) ? [...questionToUpdate.options] : [];

      const removedOption = currentOptions[optionIndex];
      currentOptions.splice(optionIndex, 1);
      questionToUpdate.options = currentOptions; 

      
      const currentCorrectAnswers = Array.isArray(questionToUpdate.correctAnswer) ? [...questionToUpdate.correctAnswer] : [];
      const updatedCorrectAnswers = currentCorrectAnswers.filter((ans: string) => ans !== removedOption);
      questionToUpdate.correctAnswer = updatedCorrectAnswers; 

      updatedQuestions[questionIndex] = questionToUpdate;
      quiz.questions = updatedQuestions;
      updatedQuizzes[quizIndex] = quiz;

      return updatedQuizzes;
    });
  };

  
  const handleAddOutcome = () => {
    if (newOutcome.trim()) {
      setLearningOutcomes([...learningOutcomes, newOutcome.trim()]);
      setNewOutcome('');
    }
  };
  
  
  const handleRemoveOutcome = (index: number) => {
    const updatedOutcomes = [...learningOutcomes];
    updatedOutcomes.splice(index, 1);
    setLearningOutcomes(updatedOutcomes);
  };
  
  
  const openMicrosoftVideo = (url: string) => {
    window.open(url, 'MicrosoftStreamVideo', 'width=800,height=600,resizable=yes');
  };

  
  const handlePdfFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        
        
        
        setPdfFile(file);
        setPdfUploadError(null); 

        
        
        
      } else {
        setPdfUploadError('Lütfen sadece PDF formatında bir dosya seçin.');
        setPdfFile(null);
        event.target.value = ''; 
      }
    }
  };

  
  const handleUploadPdf = async (index: number) => {
    if (!pdfFile) {
      setPdfUploadError('Lütfen önce bir PDF dosyası seçin.');
      return;
    }

    setUploadingPdfIndex(index);
    setPdfUploadError(null);
    const UPLOAD_URL = `${import.meta.env.VITE_REACT_APP_API_URL}/upload/pdf`;

    const formData = new FormData();
    formData.append('pdf', pdfFile); 

    try {
      const response = await axios.post<{ message: string; filePath: string }>(UPLOAD_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          
          
        }
      });

      if (response.data && response.data.filePath) {
        console.log('[AdminTrainingEditor] PDF Upload Success. Response filePath:', response.data.filePath);
        
        handleUpdateContent(index, 'content', response.data.filePath);
        setPdfFile(null); 
      } else {
        throw new Error('API yanıtında dosya yolu bulunamadı.');
      }
    } catch (err: any) { 
      console.error('PDF yükleme hatası:', err);
      const errorMessage = err.response?.data?.message || err.message || 'PDF yüklenirken bir hata oluştu.';
      setPdfUploadError(errorMessage);
      
    } finally {
      setUploadingPdfIndex(null);
    }
  };

  
  const BACKEND_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL?.replace(/\/api$/,'') || '';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !training) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h3 className="text-xl font-medium">Eğitim Bulunamadı</h3>
        <p className="text-muted-foreground mt-2">
          {error || "Bu eğitim bulunamadı veya artık mevcut değil."}
        </p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate('/dashboard/admin/trainings')}
        >
          Eğitim Yönetimine Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{training?.title || 'Eğitim Düzenle'}</h1>
          <p className="text-muted-foreground">Eğitim içeriğini ve sınavları yönetin</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
          >
            İptal
          </Button>
          
          <Button 
            disabled={saving}
            onClick={handleSaveTraining}
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Değişiklikleri Kaydet
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="error">
          <p>{error}</p>
        </Alert>
      )}
      
      {saveSuccess && (
        <Alert variant="success">
          <Check className="h-4 w-4" />
          <p>Değişiklikler başarıyla kaydedildi!</p>
        </Alert>
      )}
      
      {loading ? (
        <div className="w-full py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {}
          <div className="border-b">
            <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab('content')}
                className={`pb-2 px-1 font-medium text-sm ${activeTab === 'content' 
                  ? 'border-b-2 border-primary text-primary' 
                  : 'text-muted-foreground'}`}
              >
                İçerik
              </button>
              <button 
                onClick={() => setActiveTab('quiz')}
                className={`pb-2 px-1 font-medium text-sm ${activeTab === 'quiz' 
                  ? 'border-b-2 border-primary text-primary' 
                  : 'text-muted-foreground'}`}
              >
                Sınavlar
              </button>
            </div>
          </div>
          
          {}
          <div className="bg-card p-4 rounded-md border space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Bu Eğitimden Ne Öğreneceksiniz?</h3>
            </div>
            
            <div className="space-y-3">
              {learningOutcomes.map((outcome, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 p-2 bg-muted rounded-md">
                    {outcome}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveOutcome(index)}
                  >
                    <Trash className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newOutcome}
                  onChange={(e) => setNewOutcome(e.target.value)}
                  className="flex-1 p-2 bg-muted rounded-md border"
                  placeholder="Yeni öğrenme çıktısı..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddOutcome()}
                />
                <Button
                  size="sm"
                  onClick={handleAddOutcome}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {}
          {activeTab === 'content' ? (
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-1"
                  onClick={handleAddContent}
                >
                  <Plus className="h-4 w-4" />
                  Yeni İçerik Ekle
                </Button>
              </div>
              
              {contentEdits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Henüz içerik bulunmuyor. "Yeni İçerik Ekle" butonuna tıklayarak başlayın.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contentEdits.map((content, index) => (
                    <Card key={content.id || index} className="relative">
                      {editingContentIndex === index ? (
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-3">
                              <label className="block text-sm font-medium mb-1">Başlık</label>
                              <input
                                type="text"
                                value={content.title}
                                onChange={(e) => handleUpdateContent(index, 'title', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Süre (dakika)</label>
                              <input
                                type="number"
                                value={content.duration || 0}
                                onChange={(e) => handleUpdateContent(index, 'duration', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                min="1"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-1">İçerik Tipi</label>
                            <ContentTypeSelector
                              value={content.type}
                              onChange={(value) => handleUpdateContent(index, 'type', value)}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-1">İçerik</label>
                            {content.type === 'text' ? (
                              <textarea
                                value={content.content}
                                onChange={(e) => handleUpdateContent(index, 'content', e.target.value)}
                                rows={6}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            ) : content.type === 'pdf' ? (
                              <div>
                                <label className="block text-sm font-medium mb-1">PDF Dosyası</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => handlePdfFileChange(e)}
                                    className="flex-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 disabled:opacity-50 disabled:pointer-events-none"
                                    disabled={uploadingPdfIndex === index}
                                  />
                                  {pdfFile && content.content && (
                                    <Button
                                      onClick={() => handleUploadPdf(index)}
                                      disabled={uploadingPdfIndex === index}
                                      size="sm"
                                      className="flex-shrink-0"
                                    >
                                      {uploadingPdfIndex === index ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yükle'}
                                    </Button>
                                  )}
                                </div>
                                {}
                                {content.content?.startsWith('/uploads') && (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Yüklendi: <a href={`${BACKEND_BASE_URL}${content.content}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{content.content.split('/').pop()}</a>
                                  </p>
                                )}
                                {}
                                {content.content && !content.content.startsWith('/uploads') && !content.content.startsWith('http') && !pdfFile && (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Dosya adı: {content.content} (Henüz yüklenmedi)
                                  </p>
                                )}
                                {}
                                {content.content?.startsWith('http') && (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Harici URL: <a href={content.content} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{content.content}</a>
                                  </p>
                                )}
                                {}
                                {pdfUploadError && index === editingContentIndex && (
                                  <p className="mt-2 text-xs text-red-600">{pdfUploadError}</p>
                                )}
                              </div>
                            ) : (
                              <>
                                <input
                                  type="text"
                                  value={content.content}
                                  onChange={(e) => handleUpdateContent(index, 'content', e.target.value)}
                                  placeholder={
                                    content.type === 'youtube' ? 'YouTube URL (örn: https://www.youtube.com/watch?v=...)' :
                                    content.type === 'microsoft' ? 'Microsoft Stream/OneDrive URL' : 'Diğer URL'
                                  }
                                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${contentUrlError && (content.type === 'youtube' || content.type === 'microsoft') ? 'border-red-500 ring-red-300' : 'focus:ring-primary'}`}
                                />
                                {contentUrlError && (content.type === 'youtube' || content.type === 'microsoft') && (
                                  <p className="mt-1 text-xs text-red-600">{contentUrlError}</p>
                                )}
                                {content.type === 'youtube' && (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    YouTube videoları eğitim sayfasında gösterilecektir.
                                  </p>
                                )}
                                {content.type === 'microsoft' && (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Microsoft videoları yeni pencerede açılacaktır.
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                          
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              onClick={() => setEditingContentIndex(null)}
                            >
                              İptal
                            </Button>
                            <Button
                              variant="primary"
                              onClick={() => setEditingContentIndex(null)}
                            >
                              Tamamla
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center space-x-4">
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
                                {(content.type === 'youtube' || content.type === 'microsoft' || content.type === 'pdf') && content.content && (
                                  <>
                                    <span>•</span>
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="h-auto p-0 text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (content.type === 'microsoft') {
                                          openMicrosoftVideo(content.content);
                                        } else {
                                          window.open(content.content, '_blank');
                                        }
                                      }}
                                    >
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      Önizle
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setEditingContentIndex(index)}
                            >
                              <Edit2 className="h-4 w-4" />
                              <span className="sr-only">Düzenle</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                              onClick={() => handleDeleteContent(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Sil</span>
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-1"
                  onClick={handleAddQuiz}
                >
                  <Plus className="h-4 w-4" />
                  Yeni Sınav Ekle
                </Button>
              </div>
              
              {quizEdits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Henüz sınav bulunmuyor. "Yeni Sınav Ekle" butonuna tıklayarak başlayın.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quizEdits.map((quiz, index) => (
                    <Card key={quiz.id || index} className="relative">
                      {editingQuizIndex === index ? (
                        <div className="p-4 space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">Sınavı Düzenle</h4>
                            <Button size="sm" onClick={() => setEditingQuizIndex(null)}>Düzenlemeyi Bitir</Button>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Başlık</label>
                            <input
                              type="text"
                              value={quiz.title}
                              onChange={(e) => handleUpdateQuiz(index, 'title', e.target.value)}
                              className="w-full px-3 py-2 border rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Açıklama</label>
                            <textarea
                              value={quiz.description}
                              onChange={(e) => handleUpdateQuiz(index, 'description', e.target.value)}
                              className="w-full px-3 py-2 border rounded-md"
                              rows={3}
                            ></textarea>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Geçme Notu (%)</label>
                              <input
                                type="number"
                                value={quiz.passingScore}
                                onChange={(e) => handleUpdateQuiz(index, 'passingScore', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border rounded-md"
                                min="0"
                                max="100"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Süre (dakika)</label>
                              <input
                                type="number"
                                value={quiz.timeLimit || 0} 
                                onChange={(e) => handleUpdateQuiz(index, 'timeLimit', parseInt(e.target.value) || 0)}
                                className="w-full px-3 py-2 border rounded-md"
                                min="0"
                              />
                            </div>
                          </div>
                          
                          {}
                          <div className="border-t pt-4 mt-4">
                            <div className="flex justify-between items-center mb-3">
                              <h5 className="font-medium">Sorular</h5>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleAddQuestion(index)}
                                className="flex items-center gap-1"
                              >
                                <Plus className="h-4 w-4" />
                                Soru Ekle
                              </Button>
                            </div>
                            {}
                            {quiz.questions && quiz.questions.length > 0 ? (
                              <div className="space-y-3">
                                {quiz.questions.map((question: Question, qIndex: number) => (
                                  <div key={question.id || qIndex} className="border p-3 rounded-md bg-muted/50">
                                    {editingQuestionQuizIndex === index && editingQuestionIndex === qIndex ? (
                                      
                                      <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                          <h6 className="font-medium">Soruyu Düzenle</h6>
                                          <Button size="sm" variant="ghost" onClick={handleCancelEditQuestion}>İptal</Button>
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium mb-1">Soru Metni</label>
                                          <textarea
                                            value={question.text}
                                            onChange={(e) => handleUpdateQuestion(index, qIndex, 'text', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md text-sm"
                                            rows={2}
                                          />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <label className="block text-sm font-medium mb-1">Soru Tipi</label>
                                              <select
                                                value={question.type}
                                                onChange={(e) => handleUpdateQuestion(index, qIndex, 'type', e.target.value)}
                                                className="w-full px-3 py-2 border rounded-md text-sm bg-white"
                                              >
                                                <option value="multiple-choice">Çoktan Seçmeli</option>
                                                <option value="true-false">Doğru/Yanlış</option>
                                              </select>
                                            </div>
                                             <div>
                                              <label className="block text-sm font-medium mb-1">Puan</label>
                                              <input
                                                type="number"
                                                value={question.points}
                                                onChange={(e) => handleUpdateQuestion(index, qIndex, 'points', parseInt(e.target.value) || 0)}
                                                className="w-full px-3 py-2 border rounded-md text-sm"
                                                min="0"
                                              />
                                            </div>
                                        </div>
        
                                        {} 
                                        {question.type === 'multiple-choice' ? (
                                          
                                          <div className="space-y-2">
                                            <label className="block text-sm font-medium">Seçenekler ve Doğru Cevap</label>
                                            {(question.options || []).map((option: string, optIndex: number) => (
                                              <div key={optIndex} className="flex items-center gap-2">
                                                <input
                                                  type="checkbox"
                                                  checked={(Array.isArray(question.correctAnswer) ? question.correctAnswer : []).includes(option)}
                                                  onChange={(e) => {
                                                    const currentAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : []; 
                                                     const newAnswers = e.target.checked
                                                       ? [...currentAnswers, option]
                                                       : currentAnswers.filter((ans: string) => ans !== option); 
                                                    handleUpdateQuestion(index, qIndex, 'correctAnswer', newAnswers); 
                                                   }}
                                                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                                />
                                                <input
                                                  type="text" 
                                                  value={option}
                                                  onChange={(e) => handleUpdateOption(index, qIndex, optIndex, e.target.value)}
                                                  className="flex-1 px-2 py-1 border rounded-md text-sm"
                                                  placeholder={`Seçenek ${optIndex + 1}`}
                                                />
                                                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleRemoveOption(index, qIndex, optIndex)}>
                                                  <Trash className="h-3 w-3"/>
                                                </Button>
                                              </div>
                                            ))}
                                            <Button size="sm" variant="outline" onClick={() => handleAddOption(index, qIndex)}>Seçenek Ekle</Button>
                                          </div>
                                        ) : (
                                          
                                          <div className="space-y-2">
                                            <label className="block text-sm font-medium">Doğru Cevap</label>
                                            <div className="flex gap-4">
                                              <label className="flex items-center gap-1">
                                                <input 
                                                  type="radio" 
                                                  name={`correct_answer_${index}_${qIndex}`} 
                                                  value="true" 
                                                  checked={(question.correctAnswer || 'false') === 'true'}
                                                  onChange={(e) => handleUpdateQuestion(index, qIndex, 'correctAnswerBoolean', e.target.value)}
                                                /> Doğru
                                              </label>
                                              <label className="flex items-center gap-1">
                                                <input 
                                                  type="radio" 
                                                  name={`correct_answer_${index}_${qIndex}`} 
                                                  value="false"
                                                  checked={(question.correctAnswer || 'false') === 'false'}
                                                  onChange={(e) => handleUpdateQuestion(index, qIndex, 'correctAnswerBoolean', e.target.value)}
                                                /> Yanlış
                                              </label>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      
                                    ) : (
                                      
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1 mr-4">
                                          <p className="text-sm font-medium">{qIndex + 1}. {question.text || "(Soru metni girilmemiş)"}</p>
                                          <span className="text-xs text-muted-foreground">({question.type === 'true-false' ? 'Doğru/Yanlış' : 'Çoktan Seçmeli'} - {question.points} Puan)</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button size="sm" variant="ghost" onClick={() => handleEditQuestion(index, qIndex)}>
                                              <Edit2 className="h-3 w-3"/>
                                            </Button>
                                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteQuestion(index, qIndex)}>
                                              <Trash2 className="h-3 w-3"/>
                                            </Button>
                                        </div>
                                      </div>
                                      
                                    )}
                                  </div>
                                ))}
                              </div>
                             ) : (
                               <p className="text-sm text-muted-foreground">Henüz soru eklenmemiş.</p>
                             )}
                          </div>
                          {}
                        </div>
                      ) : (
                        <div className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{quiz.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{quiz.description}</p>
                              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Geçme Notu: {quiz.passingScore}%</span>
                                {quiz.timeLimit && <span>Süre: {quiz.timeLimit} dk</span>}
                                <span>Soru Sayısı: {quiz.questions?.length || 0}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => setEditingQuizIndex(index)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                                onClick={() => handleDeleteQuiz(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
      
      {}
      <ConfirmModal 
        isOpen={isContentDeleteModalOpen}
        onClose={() => setIsContentDeleteModalOpen(false)}
        onConfirm={confirmDeleteContent}
        title="İçerik Siliniyor"
        message="Bu içeriği silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Evet, İçeriği Sil"
        danger={true}
      />
      
      {}
      <ConfirmModal 
        isOpen={isQuizDeleteModalOpen}
        onClose={() => setIsQuizDeleteModalOpen(false)}
        onConfirm={confirmDeleteQuiz}
        title="Sınav Siliniyor"
        message="Bu sınavı silmek istediğinizden emin misiniz? Tüm sorular kalıcı olarak silinecektir."
        confirmText="Evet, Sınavı Sil"
        danger={true}
      />
      
      {}
      <ConfirmModal 
        isOpen={isQuestionDeleteModalOpen}
        onClose={() => setIsQuestionDeleteModalOpen(false)}
        onConfirm={confirmDeleteQuestion}
        title="Soru Siliniyor"
        message="Bu soruyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Evet, Soruyu Sil"
        danger={true}
      />
    </div>
  );
};

export default AdminTrainingEditor;