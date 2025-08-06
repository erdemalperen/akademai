import React from 'react';
import { CheckCircle, Clock, Award, FileText } from 'lucide-react';
import Button from '../ui/Button';
import QuizScreen from './QuizScreen';

interface QuizTabContentProps {
  training: any;
  activeQuiz: any;
  isQuizActive: boolean;
  quizResults: Record<string, { score: number, passed: boolean, date: Date }>;
  onStartQuiz: (quiz: any) => void;
  onCompleteQuiz: (score: number, passed: boolean, answers: Record<string, string | string[]>) => void;
  onCancelQuiz: () => void;
  isContentCompleted: boolean;
}

const QuizTabContent: React.FC<QuizTabContentProps> = ({
  training,
  activeQuiz,
  isQuizActive,
  quizResults,
  onStartQuiz,
  onCompleteQuiz,
  onCancelQuiz,
  isContentCompleted
}) => {
  if (isQuizActive && activeQuiz) {
    return (
      <QuizScreen 
        quiz={activeQuiz} 
        onComplete={onCompleteQuiz} 
        onCancel={onCancelQuiz} 
      />
    );
  }
  
  if (!isContentCompleted) {
    return (
      <div className="p-6 text-center">
        <FileText size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Sınavlara Erişilemiyor</h3>
        <p className="text-gray-600">
          Sınavları çözebilmek için lütfen öncelikle tüm eğitim içeriğini tamamlayın.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-xl font-semibold mb-4">Sınavlar</h3>
      
      {training?.quizzes && training.quizzes.length > 0 ? (
        <div className="space-y-6">
          {training.quizzes.map((quiz: any) => {
            
            const result = quizResults[quiz.id];
            return (
              <div key={quiz.id} className="border rounded-lg p-4">
                <h4 className="font-medium text-lg mb-2">{quiz.title}</h4>
                <p className="text-sm text-gray-500 mb-3">{quiz.description}</p>
                
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className="inline-flex items-center text-sm bg-gray-100 px-2 py-1 rounded">
                    <Clock size={14} className="mr-1" /> {quiz.timeLimit ? `${quiz.timeLimit} dakika` : 'Süre sınırı yok'}
                  </span>
                  <span className="inline-flex items-center text-sm bg-gray-100 px-2 py-1 rounded">
                    <Award size={14} className="mr-1" /> Geçme Notu: %{quiz.passingScore}
                  </span>
                  <span className="inline-flex items-center text-sm bg-gray-100 px-2 py-1 rounded">
                    <FileText size={14} className="mr-1" /> {quiz.questions?.length || 0} Soru
                  </span>
                </div>
                
                {}
                {result && (
                  <div className={`mb-4 p-3 rounded flex items-center ${result.passed ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {result.passed ? (
                      <CheckCircle size={18} className="mr-2" />
                    ) : (
                      <Clock size={18} className="mr-2" />
                    )}
                    <div>
                      <p className="font-medium">
                        {result.passed ? 'Başarıyla tamamlandı!' : 'Başarısız olundu'}
                      </p>
                      <p className="text-sm">
                        Puan: %{result.score} | Tarih: {new Date(result.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <Button 
                    onClick={() => onStartQuiz(quiz)} 
                    variant={result?.passed ? "outline" : "default"} 
                    size="sm"
                    disabled={!isContentCompleted}
                  >
                    {!result ? 'Sınavı Başlat' : result.passed ? 'Tekrar Çöz' : 'Yeniden Dene'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500">Bu eğitim için sınav bulunamadı.</p>
      )}
    </div>
  );
};

export default QuizTabContent;
