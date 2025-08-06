import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Play, RotateCcw, Volume2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { geminiApiService } from '../../services/geminiApiService';

type Language = 'english' | 'german';
type GameMode = 'chat' | 'word-game' | 'reverse-word-game';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface WordGame {
  word: string;
  correctAnswer: string;
  userAnswer: string;
  isCorrect?: boolean;
}

export default function LanguageLearningAssistant() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('english');
  const [gameMode, setGameMode] = useState<GameMode>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentWordGame, setCurrentWordGame] = useState<WordGame | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  

  const languageConfig = {
    english: {
      name: 'İngilizce',
      flag: '🇺🇸',
      welcomeMessage: 'Merhaba! İngilizce öğrenmenize yardımcı olmak için buradayım. Size nasıl yardımcı olabilirim?'
    },
    german: {
      name: 'Almanca',
      flag: '🇩🇪',
      welcomeMessage: 'Merhaba! Almanca öğrenmenize yardımcı olmak için buradayım. Size nasıl yardımcı olabilirim?'
    }
  };

  const addMessage = (text: string, isUser: boolean = false) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleLanguageChange = (language: Language) => {
    setSelectedLanguage(language);
    setMessages([]);
    setGameMode('chat');
    setCurrentWordGame(null);
    
    setTimeout(() => {
      addMessage(languageConfig[language].welcomeMessage);
    }, 500);
  };

  const generateWordGameQuestion = () => {
    const wordPairs = {
      english: [
        { word: 'apple', answer: 'elma' },
        { word: 'book', answer: 'kitap' },
        { word: 'water', answer: 'su' },
        { word: 'house', answer: 'ev' },
        { word: 'car', answer: 'araba' },
        { word: 'friend', answer: 'arkadaş' },
        { word: 'school', answer: 'okul' },
        { word: 'family', answer: 'aile' },
        { word: 'time', answer: 'zaman' },
        { word: 'love', answer: 'aşk' }
      ],
      german: [
        { word: 'Hund', answer: 'köpek' },
        { word: 'Katze', answer: 'kedi' },
        { word: 'Wasser', answer: 'su' },
        { word: 'Haus', answer: 'ev' },
        { word: 'Auto', answer: 'araba' },
        { word: 'Freund', answer: 'arkadaş' },
        { word: 'Schule', answer: 'okul' },
        { word: 'Familie', answer: 'aile' },
        { word: 'Zeit', answer: 'zaman' },
        { word: 'Liebe', answer: 'aşk' }
      ]
    };

    const pairs = wordPairs[selectedLanguage];
    const randomPair = pairs[Math.floor(Math.random() * pairs.length)];
    
    setCurrentWordGame({
      word: randomPair.word,
      correctAnswer: randomPair.answer,
      userAnswer: ''
    });

    addMessage(`Kelime oyunu başladı! Bu kelimenin Türkçe karşılığı nedir?\n\n**${randomPair.word}**`);
  };

  const generateReverseWordGameQuestion = () => {
    const wordPairs = {
      english: [
        { turkish: 'elma', answer: 'apple' },
        { turkish: 'kitap', answer: 'book' },
        { turkish: 'su', answer: 'water' },
        { turkish: 'ev', answer: 'house' },
        { turkish: 'araba', answer: 'car' },
        { turkish: 'arkadaş', answer: 'friend' },
        { turkish: 'okul', answer: 'school' },
        { turkish: 'aile', answer: 'family' },
        { turkish: 'zaman', answer: 'time' },
        { turkish: 'aşk', answer: 'love' }
      ],
      german: [
        { turkish: 'köpek', answer: 'Hund' },
        { turkish: 'kedi', answer: 'Katze' },
        { turkish: 'su', answer: 'Wasser' },
        { turkish: 'ev', answer: 'Haus' },
        { turkish: 'araba', answer: 'Auto' },
        { turkish: 'arkadaş', answer: 'Freund' },
        { turkish: 'okul', answer: 'Schule' },
        { turkish: 'aile', answer: 'Familie' },
        { turkish: 'zaman', answer: 'Zeit' },
        { turkish: 'aşk', answer: 'Liebe' }
      ]
    };

    const pairs = wordPairs[selectedLanguage];
    const randomPair = pairs[Math.floor(Math.random() * pairs.length)];
    
    setCurrentWordGame({
      word: randomPair.turkish,
      correctAnswer: randomPair.answer,
      userAnswer: ''
    });

    const languageName = languageConfig[selectedLanguage].name;
    addMessage(`Ters kelime oyunu başladı! Bu kelimenin ${languageName} karşılığı nedir?\n\n**${randomPair.turkish}**`);
  };

  const checkWordGameAnswer = (userAnswer: string) => {
    if (!currentWordGame) return;

    const isCorrect = userAnswer.toLowerCase().trim() === currentWordGame.correctAnswer.toLowerCase().trim();
    
    if (isCorrect) {
      addMessage(`🎉 Doğru! "${currentWordGame.word}" kelimesinin anlamı "${currentWordGame.correctAnswer}"`);
      setTimeout(() => {
        if (gameMode === 'word-game') {
          generateWordGameQuestion();
        } else {
          generateReverseWordGameQuestion();
        }
      }, 1500);
    } else {
      addMessage(`❌ Yanlış! "${currentWordGame.word}" kelimesinin doğru anlamı "${currentWordGame.correctAnswer}". Tekrar deneyelim!`);
      setTimeout(() => {
        if (gameMode === 'word-game') {
          generateWordGameQuestion();
        } else {
          generateReverseWordGameQuestion();
        }
      }, 2000);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    addMessage(userMessage, true);

    if (gameMode === 'word-game' || gameMode === 'reverse-word-game') {
      checkWordGameAnswer(userMessage);
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await geminiApiService.generateLanguageLearningResponse(
        userMessage, 
        selectedLanguage, 
        'chat'
      );
      addMessage(response);
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('API Error Details:', error);
      const fallbackResponse = `API bağlantısında sorun var: ${error.message || 'Bilinmeyen hata'}`;
      addMessage(fallbackResponse);
    } finally {
      setIsLoading(false);
    }
  };

  const startWordGame = () => {
    setGameMode('word-game');
    setMessages([]);
    generateWordGameQuestion();
  };

  const startReverseWordGame = () => {
    setGameMode('reverse-word-game');
    setMessages([]);
    generateReverseWordGameQuestion();
  };

  const backToChat = () => {
    setGameMode('chat');
    setCurrentWordGame(null);
    setMessages([]);
    addMessage(languageConfig[selectedLanguage].welcomeMessage);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <MessageCircle className="h-6 w-6" />
          Dil Öğrenme Asistanı
        </h2>
        
        <div className="flex gap-4 mb-4">
          {Object.entries(languageConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => handleLanguageChange(key as Language)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                selectedLanguage === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <span className="text-lg">{config.flag}</span>
              {config.name}
            </button>
          ))}
        </div>

        {}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={backToChat}
            variant={gameMode === 'chat' ? 'default' : 'outline'}
            size="sm"
          >
            💬 Sohbet
          </Button>
          <Button
            onClick={startWordGame}
            variant={gameMode === 'word-game' ? 'default' : 'outline'}
            size="sm"
          >
            🎮 Kelime Oyunu
          </Button>
          <Button
            onClick={startReverseWordGame}
            variant={gameMode === 'reverse-word-game' ? 'default' : 'outline'}
            size="sm"
          >
            🔄 Ters Kelime Oyunu
          </Button>
        </div>
      </div>

      {}
      <div className="h-96 overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            {languageConfig[selectedLanguage].flag} {languageConfig[selectedLanguage].name} öğrenmeye başlamak için bir mesaj yazın veya oyun seçin!
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${message.isUser ? 'text-right' : 'text-left'}`}
          >
            <div
              className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg whitespace-pre-wrap ${
                message.isUser
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700'
              }`}
            >
              {message.text}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {message.timestamp.toLocaleTimeString('tr-TR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="text-left mb-4">
            <div className="inline-block bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Yazıyor...
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={
            gameMode === 'chat' 
              ? `${languageConfig[selectedLanguage].name} hakkında bir şey sorun...`
              : currentWordGame
              ? 'Cevabınızı yazın...'
              : 'Mesajınızı yazın...'
          }
          disabled={isLoading}
          className="flex-1"
        />
        <Button
          onClick={handleSendMessage}
          disabled={isLoading || !inputValue.trim()}
          className="px-4"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}