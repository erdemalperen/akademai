interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
  error?: {
    message: string;
  };
}

class GeminiApiService {
  private apiKey: string;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Gemini API key is not set. Please add VITE_GEMINI_API_KEY to your .env file');
    }
  }

  async generateLanguageLearningResponse(
    message: string, 
    selectedLanguage: 'english' | 'german',
    context: 'chat' | 'word-game' | 'reverse-word-game' = 'chat'
  ): Promise<string> {
    if (!this.apiKey) {
      return this.getFallbackResponse(message, selectedLanguage);
    }

    const languageMap = {
      english: 'İngilizce',
      german: 'Almanca'
    };

    const systemPrompt = this.buildSystemPrompt(selectedLanguage, languageMap[selectedLanguage], context);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nKullanıcı mesajı: ${message}`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 200,
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 503 || response.status >= 500) {
          return this.getFallbackResponse(message, selectedLanguage);
        }
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();
      
      if (data.error) {
        return this.getFallbackResponse(message, selectedLanguage);
      }

      if (!data.candidates || data.candidates.length === 0) {
        return this.getFallbackResponse(message, selectedLanguage);
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('API request timeout - using fallback');
      } else {
        console.error('Gemini API Error:', error);
      }
      return this.getFallbackResponse(message, selectedLanguage);
    }
  }

  private getFallbackResponse(message: string, selectedLanguage: 'english' | 'german'): string {
    const languageName = selectedLanguage === 'english' ? 'İngilizce' : 'Almanca';
    
    const translations = {
      english: {
        'merhaba': 'Hello',
        'hello': 'Merhaba',
        'teşekkürler': 'Thank you',
        'thank you': 'Teşekkürler',
        'evet': 'Yes',
        'yes': 'Evet',
        'hayır': 'No',
        'no': 'Hayır',
        'nasılsın': 'How are you?',
        'how are you': 'Nasılsın?'
      },
      german: {
        'merhaba': 'Hallo',
        'hallo': 'Merhaba',
        'teşekkürler': 'Danke',
        'danke': 'Teşekkürler',
        'evet': 'Ja',
        'ja': 'Evet',
        'hayır': 'Nein',
        'nein': 'Hayır',
        'nasılsın': 'Wie geht es dir?',
        'wie geht es dir': 'Nasılsın?'
      }
    };

    const lowerMessage = message.toLowerCase().trim();
    const langTranslations = translations[selectedLanguage];
    
    for (const [turkish, foreign] of Object.entries(langTranslations)) {
      if (lowerMessage.includes(turkish) || lowerMessage.includes(foreign)) {
        return `"${turkish}" ${languageName}'de "${foreign}" demektir.`;
      }
    }

    if (lowerMessage.includes('italyanca') || lowerMessage.includes('fransızca') || 
        lowerMessage.includes('ispanyolca') || lowerMessage.includes('japonca')) {
      return `Ben sadece ${languageName} öğretmeni asistanıyım. Başka dillerde yardım edemem.`;
    }

    return `${languageName} hakkında daha spesifik bir soru sorar mısınız? Örneğin kelime anlamları veya çeviri konusunda yardım edebilirim.`;
  }

  private buildSystemPrompt(selectedLanguage: 'english' | 'german', languageName: string, context: string): string {
    const basePrompt = `Sen sadece ${languageName} öğretmeni asistanısın. SADECE ${languageName} ile ilgili sorulara cevap verirsin.

SADECE ŞU KONULARDA YARDIM ET:
- ${languageName} kelimelerin Türkçe anlamları
- ${languageName} gramer kuralları
- ${languageName} cümle yapıları
- ${languageName} çeviri
- ${languageName} örnekleri

YAPMA:
- Başka dillere çeviri yapma (sadece ${languageName})
- ${languageName} dışındaki dillerle ilgili cevap verme
- Genel sorulara cevap verme

KURALLARIN:
- Sadece Türkçe cevap ver
- Kısa ve net ol (maksimum 2-3 cümle)
- ${languageName} dışındaki dillerle ilgili sorulara "Ben sadece ${languageName} öğretmeni asistanıyım" de
- Sadece ${languageName} öğretimine odaklan`;

    if (context === 'word-game') {
      return basePrompt + `\n\nŞu anda kelime oyunu modundasın. ${languageName} kelimelerinin Türkçe anlamlarını kontrol ediyorsun.`;
    }

    if (context === 'reverse-word-game') {
      return basePrompt + `\n\nŞu anda ters kelime oyunu modundasın. Türkçe kelimelerin ${languageName} karşılıklarını kontrol ediyorsun.`;
    }

    return basePrompt;
  }

  async generateWordExplanation(
    word: string, 
    userAnswer: string, 
    correctAnswer: string, 
    selectedLanguage: 'english' | 'german'
  ): Promise<string> {
    const languageName = selectedLanguage === 'english' ? 'İngilizce' : 'Almanca';
    
    const prompt = `"${word}" kelimesinin anlamı "${correctAnswer}". Kullanıcı "${userAnswer}" cevabını verdi. 
    Bu kelime hakkında kısa bir açıklama yap ve doğru cevabı hatırlatıcı bir ipucu ver. 
    Cevabın 2-3 cümleyi geçmesin.`;

    try {
      return await this.generateLanguageLearningResponse(prompt, selectedLanguage, 'word-game');
    } catch (error) {
      return `"${word}" kelimesinin doğru anlamı "${correctAnswer}". Bu kelimeyi hatırlamak için örnek cümleler kurabilirsin!`;
    }
  }
}

export const geminiApiService = new GeminiApiService();