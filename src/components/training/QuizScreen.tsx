import React, { useState, useEffect } from 'react';
import { Quiz, Question } from '../../types/index';

interface QuizScreenProps {
  quiz: Quiz;
  onComplete: (score: number, passed: boolean, answers: Record<string, string | string[]>) => void;
  onCancel: () => void;
}

const QuizScreen: React.FC<QuizScreenProps> = ({ quiz, onComplete, onCancel }) => {
  
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  const [isCompleted, setIsCompleted] = useState(false);
  
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    quiz.timeLimit ? quiz.timeLimit * 60 : null
  );
  
  const [results, setResults] = useState<{
    score: number;
    totalPoints: number;
    correctAnswers: number;
    totalQuestions: number;
    passed: boolean;
  } | null>(null);

  const totalQuestions = quiz.questions?.length || 0;
  const currentQuestion = quiz.questions?.[currentQuestionIndex] || null;

  
  useEffect(() => {
    if (timeRemaining === null || isCompleted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isCompleted]);

  
  const handleAnswerChange = (questionId: string | number, answer: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  
  const handleMultipleChoiceChange = (questionId: string | number, option: string, isMultiple: boolean) => {
    setAnswers((prev) => {
      const currentAnswer = prev[questionId];

      if (isMultiple) {
        
        const currentArray = Array.isArray(currentAnswer) ? currentAnswer : [];
        if (currentArray.includes(option)) {
          return {
            ...prev,
            [questionId]: currentArray.filter(item => item !== option)
          };
        } else {
          return {
            ...prev,
            [questionId]: [...currentArray, option]
          };
        }
      } else {
        
        return {
          ...prev,
          [questionId]: option
        };
      }
    });
  };

  
  const handleTrueFalseChange = (questionId: string | number, value: 'true' | 'false') => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  
  const calculateResults = () => {
    let correctAnswers = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    quiz.questions?.forEach((question: Question) => {
      totalPoints += question.points || 0;
      const userAnswer = answers[question.id];
      const correctAnswer = question.correctAnswer;

      let isCorrect = false;

      if (Array.isArray(correctAnswer) && Array.isArray(userAnswer)) {
        
        isCorrect = correctAnswer.length === userAnswer.length && 
                    correctAnswer.every(ans => userAnswer.includes(ans));
      } else {
        
        isCorrect = userAnswer === correctAnswer;
      }

      if (isCorrect) {
        correctAnswers += 1;
        earnedPoints += question.points || 0;
      }
    });

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= (quiz.passingScore || 70);

    return {
      score,
      totalPoints,
      correctAnswers,
      totalQuestions,
      passed,
    };
  };

  
  const handleSubmit = () => {
    const calculatedResults = calculateResults();
    setResults(calculatedResults);
    setIsCompleted(true);
    onComplete(calculatedResults.score, calculatedResults.passed, answers);
  };

  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isCompleted && results) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Sınav Sonuçları</h2>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold mb-2">
              Puanınız: {results.score}% {results.passed ? '(Başarılı)' : '(Başarısız)'}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Doğru Cevaplar:</div>
              <div>{results.correctAnswers} / {results.totalQuestions}</div>
              <div>Kazanılan Puan:</div>
              <div>{results.score} / 100</div>
              <div>Geçme Notu:</div>
              <div>{quiz.passingScore || 70}%</div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Çıkış
            </button>
            {!results.passed && (
              <button
                onClick={() => {
                  setAnswers({});
                  setCurrentQuestionIndex(0);
                  setIsCompleted(false);
                  setTimeRemaining(quiz.timeLimit ? quiz.timeLimit * 60 : null);
                  setResults(null);
                }}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
              >
                Tekrar Dene
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Sınavda soru bulunamadı.</h2>
        <button 
          onClick={onCancel}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
        >
          Geri Dön
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{quiz.title}</h2>
        {timeRemaining !== null && (
          <div className={`text-lg font-semibold ${timeRemaining < 60 ? 'text-red-500' : 'text-gray-700'}`}>
            Kalan Süre: {formatTime(timeRemaining)}
          </div>
        )}
      </div>

      {}
      <div className="w-full bg-gray-200 h-2 rounded-full mb-6">
        <div
          className="bg-primary h-2 rounded-full"
          style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
        ></div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between mb-2 text-sm text-gray-600">
          <span>Soru {currentQuestionIndex + 1} / {totalQuestions}</span>
          <span>{currentQuestion.points} Puan</span>
        </div>
        <h3 className="text-lg font-semibold mb-4">{currentQuestion.text}</h3>

        {}
        {currentQuestion.type === 'multiple-choice' && (
          <div className="space-y-2">
            {(currentQuestion.options || []).map((option: string, index: number) => {
              
              const isMultipleAnswer = Array.isArray(currentQuestion.correctAnswer) && 
                                     currentQuestion.correctAnswer.length > 1;
              const userAnswer = answers[currentQuestion.id] || (isMultipleAnswer ? [] : '');
              const isSelected = isMultipleAnswer 
                ? Array.isArray(userAnswer) && userAnswer.includes(option)
                : userAnswer === option;

              return (
                <div 
                  key={index} 
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    isSelected ? 'border-primary bg-primary bg-opacity-10' : 'border-gray-300'
                  }`}
                  onClick={() => handleMultipleChoiceChange(
                    currentQuestion.id, 
                    option, 
                    isMultipleAnswer
                  )}
                >
                  <div className="flex items-center">
                    {isMultipleAnswer ? (
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => {}} 
                        className="mr-2"
                      />
                    ) : (
                      <input 
                        type="radio" 
                        checked={isSelected}
                        onChange={() => {}} 
                        className="mr-2"
                      />
                    )}
                    <span>{option}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {currentQuestion.type === 'true-false' && (
          <div className="space-y-2">
            {['true', 'false'].map((value) => {
              const isSelected = answers[currentQuestion.id] === value;
              const label = value === 'true' ? 'Doğru' : 'Yanlış';
              
              return (
                <div 
                  key={value}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    isSelected ? 'border-primary bg-primary bg-opacity-10' : 'border-gray-300'
                  }`}
                  onClick={() => handleTrueFalseChange(
                    currentQuestion.id, 
                    value as 'true' | 'false'
                  )}
                >
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      checked={isSelected}
                      onChange={() => {}} 
                      className="mr-2"
                    />
                    <span>{label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {currentQuestion.type === 'short-answer' && (
          <div>
            <textarea
              rows={4}
              value={(answers[currentQuestion.id] as string) || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Cevabınızı buraya yazın..."
            />
          </div>
        )}
      </div>

      {}
      <div className="flex justify-between mt-6">
        <button
          onClick={handlePrevQuestion}
          disabled={currentQuestionIndex === 0}
          className={`px-4 py-2 rounded ${
            currentQuestionIndex === 0
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gray-500 text-white hover:bg-gray-600'
          }`}
        >
          Önceki Soru
        </button>

        {currentQuestionIndex < totalQuestions - 1 ? (
          <button
            onClick={handleNextQuestion}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
          >
            Sonraki Soru
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Sınavı Tamamla
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizScreen;
