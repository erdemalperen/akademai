import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pool } from 'pg';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.nxnzvkmhisrddjnbhihi:akademai2024@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
export class AIAssistantService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  async getAvailableTrainings(): Promise<any[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT id, title, description, category, duration, tags, learning_outcomes
        FROM trainings 
        WHERE published = true
        ORDER BY category, title
      `);
      return result.rows;
    } catch (error) {
      console.error('Eğitimler alınırken hata:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  async generateLearningRecommendation(userMessage: string, userId: number): Promise<string> {
    try {
      const trainings = await this.getAvailableTrainings();
      const trainingsSummary = trainings.map(training => ({
        title: training.title,
        category: training.category,
        description: training.description,
        duration: training.duration,
        tags: training.tags,
        learning_outcomes: training.learning_outcomes
      }));
      const prompt = `
Sen Akademai platformunun akıllı öğrenme asistanısın. Kullanıcılara sadece mevcut eğitimler üzerinden kişiselleştirilmiş öğrenme tavsiyelerinde bulunuyorsun.
MEVCUt EĞİTİMLER:
${JSON.stringify(trainingsSummary, null, 2)}
KULLANICI MESAJI: "${userMessage}"
KURALLAR:
1. Sadece yukarıdaki mevcut eğitimler üzerinden önerilerde bulun
2. Kısa ve öz bir paragraf olarak yanıt ver (maksimum 150 kelime)
3. Kullanıcının isteğine en uygun 2-3 eğitimi öner
4. Öğrenme yol haritası şeklinde sırala
5. Mevcut eğitimler dışında öneride bulunma
6. Sadece eğitim ve kariyer gelişimi konularında yardım et
7. Türkçe yanıt ver
8. Samimi ve yardımsever bir ton kullan
Eğer kullanıcı mevcut eğitimlerle ilgili olmayan bir konu soruyorsa, "Bu konuda şu anda eğitimim bulunmuyor, ancak mevcut eğitimlerden şunları önerebilirim..." şeklinde yanıt ver.
      `;
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('AI önerisi oluşturulurken hata:', error);
      return 'Şu anda önerilerde bulunurken bir sorun yaşıyorum. Lütfen daha sonra tekrar deneyin.';
    }
  }
  async saveChatHistory(userId: number, userMessage: string, aiResponse: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO logs (action_type, user_id, details, created_at) 
        VALUES ('AI_CHAT', $1, $2, NOW())
      `, [userId, JSON.stringify({ userMessage, aiResponse })]);
    } catch (error) {
      console.error('Chat geçmişi kaydedilirken hata:', error);
    } finally {
      client.release();
    }
  }
  getQuickReplies(): string[] {
    return [
      "Frontend developer olmak istiyorum",
      "Backend geliştirme öğrenmek istiyorum", 
      "Data Science alanında kendimi geliştirmek istiyorum",
      "AI ve makine öğrenmesi öğrenmek istiyorum",
      "DevOps alanında uzmanlaşmak istiyorum",
      "İnsan kaynakları alanında gelişmek istiyorum"
    ];
  }
}
export const aiAssistantService = new AIAssistantService();