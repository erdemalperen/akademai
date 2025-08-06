import { pool } from '../../db';
import { Quiz, Question } from '../../types/commonTypes';
export const getQuizById = async (quizId: string): Promise<Quiz | null> => {
  const client = await pool.connect();
  try {
    console.log(`[quizService] Quiz ID: ${quizId} bilgileri getiriliyor`);
    const quizResult = await client.query(
      'SELECT id, training_id, title, description, pass_threshold, "createdAt", "updatedAt" FROM quizzes WHERE id = $1',
      [quizId]
    );
    if (quizResult.rows.length === 0) {
      return null;
    }
    const quiz: Quiz = {
      id: quizResult.rows[0].id,
      title: quizResult.rows[0].title,
      description: quizResult.rows[0].description,
      passingScore: quizResult.rows[0].pass_threshold,
      questions: [] as Question[],
      timeLimit: undefined
    };
    const questionResult = await client.query(
      'SELECT id, question_text, question_type, options, correct_answer, points, order_index FROM questions WHERE quiz_id = $1 ORDER BY order_index',
      [quizId]
    );
    const questions: Question[] = questionResult.rows.map(q => {
      let parsedOptions: string[] = [];
      let parsedCorrectAnswer: string | string[] = q.correct_answer;
      if (q.options) {
        try {
          parsedOptions = Array.isArray(q.options) ? q.options : JSON.parse(q.options);
        } catch (e) {
          console.error(`[quizService] Seçenekler parse edilirken hata:`, e);
          parsedOptions = [];
        }
      }
      if (typeof q.correct_answer === 'string' && q.correct_answer.startsWith('[')) {
        try {
          parsedCorrectAnswer = JSON.parse(q.correct_answer);
        } catch (e) {
          console.error(`[quizService] Doğru cevap parse edilirken hata:`, e);
          parsedCorrectAnswer = q.correct_answer;
        }
      }
      return {
        id: q.id,
        text: q.question_text,
        type: q.question_type as 'multiple-choice' | 'true-false' | 'short-answer',
        options: parsedOptions,
        correctAnswer: parsedCorrectAnswer,
        points: q.points
      };
    });
    quiz.questions = questions;
    return quiz;
  } catch (error) {
    console.error(`[quizService] Quiz getirme hatası:`, error);
    throw error;
  } finally {
    client.release();
  }
};
export const getQuizzesForTraining = async (trainingId: string): Promise<Quiz[]> => {
  const client = await pool.connect();
  try {
    const quizzesResult = await client.query(
      'SELECT id, title, description, pass_threshold FROM quizzes WHERE training_id = $1',
      [trainingId]
    );
    const quizzes: Quiz[] = [];
    for (const quizRow of quizzesResult.rows) {
      const quiz = await getQuizById(quizRow.id);
      if (quiz) {
        quizzes.push(quiz);
      }
    }
    return quizzes;
  } catch (error) {
    console.error(`[quizService] Eğitim sınavları getirme hatası:`, error);
    throw error;
  } finally {
    client.release();
  }
};
export const submitQuizAttempt = async (
  userId: number,
  quizId: string,
  trainingId: string,
  answers: Record<string, string | string[]>
): Promise<{
  attemptId: number;
  score: number;
  passed: boolean;
  submittedAt: Date;
}> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log(`[quizService] Sınav denemesi gönderiliyor: userId=${userId}, quizId=${quizId}, trainingId=${trainingId}`);
    if (!answers || Object.keys(answers).length === 0) {
        console.warn('[quizService] submitQuizAttempt: Cevaplar (answers) boş veya tanımsız.');
        throw new Error('Cevaplar gönderilmedi.');
    }
    const quiz = await getQuizById(quizId);
    if (!quiz) {
      console.error(`[quizService] submitQuizAttempt: Quiz ID ${quizId} bulunamadı.`);
      throw new Error(`Sınav bulunamadı.`);
    }
    const attemptCountResult = await client.query(
      'SELECT COUNT(*) as count FROM user_quiz_attempts WHERE user_id = $1 AND quiz_id = $2',
      [userId, quizId]
    );
    const attemptNumber = parseInt(attemptCountResult.rows[0].count) + 1;
    let totalPoints = 0;
    let earnedPoints = 0;
    quiz.questions.forEach(question => {
      const userAnswer = answers[question.id];
      if (userAnswer === undefined) {
        console.log(`[submitQuizAttempt] Soru ID: ${question.id} için kullanıcı cevabı bulunamadı (userAnswer tanımsız).`);
        return;
      }
      totalPoints += question.points;
      let isCorrect = false;
      const correctAnswer = question.correctAnswer;
      const typeOfCorrectAnswer = typeof correctAnswer;
      const typeOfUserAnswer = typeof userAnswer;
      console.log(`[submitQuizAttempt] Soru ID: ${question.id}, Soru Tipi: ${question.type}`);
      console.log(`[submitQuizAttempt]   Beklenen Doğru Cevap (correctAnswer):`, correctAnswer, `(tip: ${typeOfCorrectAnswer}, array mi: ${Array.isArray(correctAnswer)})`);
      console.log(`[submitQuizAttempt]   Kullanıcı Cevabı (userAnswer):`, userAnswer, `(tip: ${typeOfUserAnswer}, array mi: ${Array.isArray(userAnswer)})`);
      if (Array.isArray(correctAnswer)) { 
        if ( question.type === 'multiple-choice' && Array.isArray(userAnswer) ) {
          isCorrect = correctAnswer.length === userAnswer.length &&
                        correctAnswer.every(ca => userAnswer.includes(ca as string)) && 
                        userAnswer.every(ua => correctAnswer.includes(ua as string));
          if (!isCorrect) {
            console.log(`[submitQuizAttempt] Çoktan seçmeli (dizi vs dizi) Karşılaştırma sonucu YANLIŞ. Soru ID: ${question.id}. Beklenen: ${JSON.stringify(correctAnswer)}, Verilen: ${JSON.stringify(userAnswer)}`);
          }
        } else if (!Array.isArray(userAnswer) && correctAnswer.length === 1) {
          isCorrect = correctAnswer[0] === userAnswer;
          if (!isCorrect) {
            console.log(`[submitQuizAttempt] Tek seçim (dizi[0] vs string) Karşılaştırma sonucu YANLIŞ. Soru ID: ${question.id}. Beklenen: ${correctAnswer[0]}, Verilen: ${userAnswer}`);
          }
        } else if (Array.isArray(userAnswer) && correctAnswer.length === 1 && userAnswer.length === 1 && question.type === 'multiple-choice') {
           isCorrect = correctAnswer[0] === userAnswer[0];
           if (!isCorrect) {
            console.log(`[submitQuizAttempt] Tek seçim (dizi[0] vs dizi[0]) Karşılaştırma sonucu YANLIŞ. Soru ID: ${question.id}. Beklenen: ${correctAnswer[0]}, Verilen: ${userAnswer[0]}`);
          }
        } else {
          console.warn(`[submitQuizAttempt] Beklenmedik cevap/doğru cevap formatı eşleşmesi. Soru ID: ${question.id}, Soru Tipi: ${question.type}. Array.isArray(correctAnswer): ${Array.isArray(correctAnswer)}, Array.isArray(userAnswer): ${Array.isArray(userAnswer)}, correctAnswer.length: ${Array.isArray(correctAnswer) ? correctAnswer.length : 'N/A'}`);
          isCorrect = false;
        }
      } else if (typeof correctAnswer === 'string' && !Array.isArray(userAnswer)) {
          isCorrect = userAnswer === correctAnswer;
          if (!isCorrect) {
            console.log(`[submitQuizAttempt] Düz string karşılaştırma sonucu YANLIŞ. Beklenen: ${correctAnswer}, Verilen: ${userAnswer}`);
          }
      } else {
        console.error(`[submitQuizAttempt] Kapsanmayan durum! correctAnswer tipi: ${typeOfCorrectAnswer}, userAnswer tipi: ${typeOfUserAnswer}. Soru ID: ${question.id}`);
        isCorrect = false;
      }
      if (isCorrect) {
        earnedPoints += question.points;
        console.log(`[submitQuizAttempt] Soru ID: ${question.id} için cevap DOĞRU olarak değerlendirildi.`);
      } else {
        console.log(`[submitQuizAttempt] Soru ID: ${question.id} için cevap YANLIŞ olarak değerlendirildi (son durum).`);
      }
    });
    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= quiz.passingScore;
    const now = new Date();
    const insertResult = await client.query(
      `INSERT INTO user_quiz_attempts 
       (user_id, quiz_id, training_id, attempt_number, score, passed, submitted_at, answers) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, submitted_at`,
      [userId, quizId, trainingId, attemptNumber, score, passed, now, JSON.stringify(answers)]
    );
    const attemptId = insertResult.rows[0].id;
    const submittedAt = insertResult.rows[0].submitted_at;
    const actionType = passed ? 'QUIZ_PASSED' : 'QUIZ_FAILED';
    await client.query(
      `INSERT INTO logs (action_type, user_id, details, created_at, user_agent, ip_address)
       VALUES ($1, $2, $3, NOW(), $4, $5)`,
      [actionType, userId, JSON.stringify({
        quizId,
        trainingId,
        score,
        passed,
        attemptNumber
      }), 'SYSTEM', 'SYSTEM']
    );
    await updateTrainingProgressAfterQuiz(userId, trainingId);
    await client.query('COMMIT');
    return {
      attemptId,
      score,
      passed,
      submittedAt
    };
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
        console.log('[quizService] ROLLBACK başarılı');
      } catch (rollbackError) {
        console.error('[quizService] ROLLBACK hatası:', rollbackError);
      }
    }
    console.error(`[quizService] Sınav denemesi kaydetme hatası:`, error);
    if (error instanceof Error) {
      if (error.message.includes('user_quiz_attempts_pkey') || error.message.includes('duplicate key')) {
        console.error('[quizService] Muhtemelen aynı sınav denemesi zaten kaydedilmiş.');
        throw new Error('Bu sınav denemesi zaten kaydedilmiş. Lütfen sayfayı yenileyiniz.');
      } else if (error.message.includes('violates foreign key constraint')) {
        if (error.message.includes('quiz_id')) {
          console.error('[quizService] Sınav bulunamadı (FK hatası).');
          throw new Error('Belirtilen sınav bulunamadı.');
        } else if (error.message.includes('user_id')) {
          console.error('[quizService] Kullanıcı bulunamadı (FK hatası).');
          throw new Error('Belirtilen kullanıcı bulunamadı.');
        } else if (error.message.includes('training_id')) {
          console.error('[quizService] Eğitim bulunamadı (FK hatası).');
          throw new Error('Belirtilen eğitim bulunamadı.');
        }
      } else if (error.message.includes('logs') && (error.message.includes('user_agent') || error.message.includes('ip_address'))) {
        console.error('[quizService] Loglama sorunu (muhtemelen user_agent/ip_address eksik).');
        throw new Error('Sınav denemesi kaydedilirken bir loglama hatası oluştu.');
      }
    }
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
};
export const checkAllQuizzesPassed = async (userId: number, trainingId: string): Promise<boolean> => {
  const client = await pool.connect();
  try {
    const quizzesResult = await client.query(
      'SELECT id FROM quizzes WHERE training_id = $1',
      [trainingId]
    );
    if (quizzesResult.rows.length === 0) {
      return true;
    }
    for (const quizRow of quizzesResult.rows) {
      const quizId = quizRow.id;
      const passedResult = await client.query(
        `SELECT EXISTS (
          SELECT 1 FROM user_quiz_attempts 
          WHERE user_id = $1 AND quiz_id = $2 AND passed = true
        ) as passed`,
        [userId, quizId]
      );
      if (!passedResult.rows[0].passed) {
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error(`[quizService] Sınav kontrolü hatası:`, error);
    throw error;
  } finally {
    client.release();
  }
};
export const getUserQuizStatusForTraining = async (userId: number, trainingId: string): Promise<{
  totalQuizzes: number;
  attemptedQuizzes: number;
  passedQuizzes: number;
  allPassed: boolean;
  quizStatuses: {
    quizId: string;
    title: string;
    attempted: boolean;
    passed: boolean;
    lastScore: number | null;
    attempts: number;
  }[];
}> => {
  const client = await pool.connect();
  try {
    console.log(`[quizService] Kullanıcı ${userId} için Eğitim ${trainingId} sınav durumu getiriliyor.`);
    if ((userId === undefined || userId === null) || !trainingId) {
        console.error('[quizService] getUserQuizStatusForTraining: userId tanımsız/null veya trainingId eksik.');
        throw new Error('Kullanıcı ID tanımsız/null veya Eğitim ID eksik.'); 
    }
    const quizzesResult = await client.query(
      'SELECT id, title FROM quizzes WHERE training_id = $1',
      [trainingId]
    );
    const quizzes = quizzesResult.rows;
    const totalQuizzes = quizzes.length;
    if (totalQuizzes === 0) {
      return {
        totalQuizzes: 0,
        attemptedQuizzes: 0,
        passedQuizzes: 0,
        allPassed: true,
        quizStatuses: []
      };
    }
    let attemptedQuizzes = 0;
    let passedQuizzes = 0;
    const quizStatuses = [];
    for (const quiz of quizzes) {
      const quizId = quiz.id;
      const attemptsResult = await client.query(
        `SELECT 
          COUNT(*) as attempts, 
          MAX(score) as best_score,
          EXISTS (SELECT 1 FROM user_quiz_attempts WHERE user_id = $1 AND quiz_id = $2 AND passed = true) as passed
        FROM user_quiz_attempts 
        WHERE user_id = $1 AND quiz_id = $2`,
        [userId, quizId]
      );
      const attemptData = attemptsResult.rows[0];
      const attempts = parseInt(attemptData.attempts);
      const passed = attemptData.passed;
      const lastScoreResult = await client.query(
        `SELECT score FROM user_quiz_attempts 
        WHERE user_id = $1 AND quiz_id = $2 
        ORDER BY attempt_number DESC LIMIT 1`,
        [userId, quizId]
      );
      const lastScore = lastScoreResult.rows.length ? parseFloat(lastScoreResult.rows[0].score) : null;
      if (attempts > 0) attemptedQuizzes++;
      if (passed) passedQuizzes++;
      quizStatuses.push({
        quizId,
        title: quiz.title,
        attempted: attempts > 0,
        passed,
        lastScore,
        attempts
      });
    }
    const allPassed = passedQuizzes === totalQuizzes;
    return {
      totalQuizzes,
      attemptedQuizzes,
      passedQuizzes,
      allPassed,
      quizStatuses
    };
  } catch (error) {
    console.error(`[quizService] Sınav durumu getirme hatası:`, error);
    throw error;
  } finally {
    client.release();
  }
};
export const getQuizAttemptsForUser = async (
  userId: number,
  quizId: string
): Promise<{
  attemptId: number;
  attemptNumber: number;
  score: number;
  passed: boolean;
  submittedAt: Date;
}[]> => {
  const client = await pool.connect();
  try {
    const attemptsResult = await client.query(
      `SELECT id, attempt_number, score, passed, submitted_at 
       FROM user_quiz_attempts 
       WHERE user_id = $1 AND quiz_id = $2 
       ORDER BY attempt_number DESC`,
      [userId, quizId]
    );
    return attemptsResult.rows.map(row => ({
      attemptId: row.id,
      attemptNumber: row.attempt_number,
      score: parseFloat(row.score),
      passed: row.passed,
      submittedAt: row.submitted_at
    }));
  } catch (error) {
    console.error(`[quizService] Kullanıcı denemeleri getirme hatası:`, error);
    throw error;
  } finally {
    client.release();
  }
};
export const updateTrainingProgressAfterQuiz = async (
  userId: number, 
  trainingId: string
): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const progressResult = await client.query(
      `SELECT status, progress_percentage, completed_content_items, completed_at
       FROM user_training_progress 
       WHERE user_id = $1 AND training_id = $2`,
      [userId, trainingId]
    );
    if (progressResult.rows.length === 0) {
      await client.query('ROLLBACK');
      console.log(`[quizService] user_training_progress kaydı bulunamadı: user_id=${userId}, training_id=${trainingId}`);
      return;
    }
    const currentProgress = progressResult.rows[0];
    const allQuizzesPassed = await checkAllQuizzesPassed(userId, trainingId);
    console.log(`[quizService] Tüm sınavlar geçildi mi kontrol edildi: ${allQuizzesPassed}`);
    const quizzesResult = await client.query(
      'SELECT id FROM quizzes WHERE training_id = $1',
      [trainingId]
    );
    console.log(`[quizService] Eğitim ${trainingId} için ${quizzesResult.rows.length} adet sınav var`);
    for (const quizRow of quizzesResult.rows) {
      const quizId = quizRow.id;
      const passedCheck = await client.query(
        `SELECT EXISTS (
          SELECT 1 FROM user_quiz_attempts 
          WHERE user_id = $1 AND quiz_id = $2 AND passed = true
        ) as passed`,
        [userId, quizId]
      );
      console.log(`[quizService] Quiz ID: ${quizId} geçildi mi: ${passedCheck.rows[0].passed}`);
    }
    let newStatus = currentProgress.status;
    if (parseFloat(currentProgress.progress_percentage) >= 100) {
      if (allQuizzesPassed) {
        console.log(`[quizService] İçerik %100 tamamlanmış ve tüm sınavlar geçilmiş, durumu COMPLETED olarak ayarlıyorum`);
        newStatus = 'COMPLETED';
      } else {
        console.log(`[quizService] İçerik %100 tamamlanmış ama tüm sınavlar geçilmemiş, durumu QUIZZES_PENDING olarak ayarlıyorum`);
        newStatus = 'QUIZZES_PENDING';
      }
    } else {
      console.log(`[quizService] İçerik %100 tamamlanmamış, ilerleme: ${currentProgress.progress_percentage}%, mevcut durum korunuyor: ${newStatus}`);
    }
    console.log(`[quizService] Yeni durum: ${newStatus}, önceki durum: ${currentProgress.status}`);
    if (allQuizzesPassed && parseFloat(currentProgress.progress_percentage) >= 100) {
      console.log(`[quizService] ÖNEMLİ KONTROL: Tüm koşullar sağlanıyor. allQuizzesPassed=${allQuizzesPassed}, progress=${currentProgress.progress_percentage}`);
      newStatus = 'COMPLETED';
      console.log(`[quizService] Zorunlu durum değişikliği: ${newStatus}`);
    }
    const isBeingCompleted = (newStatus === 'COMPLETED' && currentProgress.status !== 'COMPLETED');
    console.log(`[quizService] user_training_progress tablosunu güncelliyorum - status: ${newStatus}, isBeingCompleted: ${isBeingCompleted}`);
    const completedAtClause = newStatus === 'COMPLETED' ? 'NOW()' : 'CASE WHEN status != \'COMPLETED\' THEN NULL ELSE completed_at END';
    const updateProgressResult = await client.query(
      `UPDATE user_training_progress
       SET status = $1::VARCHAR, 
           "updatedAt" = NOW(), 
           completed_at = ${completedAtClause}
       WHERE user_id = $2 AND training_id = $3
       RETURNING status, completed_at`,
      [newStatus, userId, trainingId]
    );
    console.log(`[quizService] user_training_progress tablosu güncellendi, sonuç:`, updateProgressResult.rows[0]);
    const enrollmentCheck = await client.query(
      `SELECT id, status, progress, completed_items FROM enrollments 
       WHERE user_id = $1 AND training_id = $2`,
      [userId, trainingId]
    );
    let enrollmentStatus = newStatus;
    if (newStatus === 'CONTENT_COMPLETED' || newStatus === 'QUIZZES_PENDING') {
      enrollmentStatus = 'IN_PROGRESS';
    } else if (newStatus === 'COMPLETED') {
      enrollmentStatus = 'COMPLETED';
    }
    console.log(`[quizService] Enrollments için status dönüşümü: ${newStatus} -> ${enrollmentStatus}`);
    if (enrollmentCheck.rows.length > 0) {
      console.log(`[quizService] Enrollments kaydı mevcut, güncelleniyor: id=${enrollmentCheck.rows[0].id}`);
      const enrollmentCompletedAtClause = enrollmentStatus === 'COMPLETED' ? 'NOW()' : 'CASE WHEN status != \'COMPLETED\' THEN NULL ELSE completed_at END';
      const updateEnrollmentResult = await client.query(
        `UPDATE enrollments
         SET status = $1::VARCHAR, 
             progress = $2, 
             updated_at = NOW(),
             completed_at = ${enrollmentCompletedAtClause}
         WHERE user_id = $3 AND training_id = $4
         RETURNING status, completed_at`,
        [enrollmentStatus, parseFloat(currentProgress.progress_percentage), userId, trainingId]
      );
      console.log(`[quizService] Enrollments tablosu güncellendi: user_id=${userId}, training_id=${trainingId}, status=${enrollmentStatus}, sonuç:`, updateEnrollmentResult.rows[0]);
    } else {
      const completedItemsJson = JSON.stringify(currentProgress.completed_content_items || []);
      console.log(`[quizService] Enrollments kaydı yok, yeni kayıt oluşturuluyor`);
      const insertEnrollmentResult = await client.query(
        `INSERT INTO enrollments (
          user_id, training_id, status, progress, completed_items,
          completed_at, start_date, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, 
          ${enrollmentStatus === 'COMPLETED' ? 'NOW()' : 'NULL'}, 
          COALESCE((SELECT started_at FROM user_training_progress WHERE user_id=$1 AND training_id=$2), NOW()), 
          NOW(), NOW())
        RETURNING status, completed_at`,
        [userId, trainingId, enrollmentStatus, parseFloat(currentProgress.progress_percentage), completedItemsJson]
      );
      console.log(`[quizService] Enrollments tablosuna yeni kayıt eklendi, sonuç:`, insertEnrollmentResult.rows[0]);
    }
    await client.query('COMMIT');
    console.log(`[quizService] Transaction başarıyla commit edildi`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`[quizService] Sınav sonrası eğitim durumu güncellenirken hata:`, error);
    throw error;
  } finally {
    client.release();
  }
}; 