import { Pool } from 'pg';
import { Training, Question, Quiz } from '../../types/commonTypes';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123@localhost:5433/egitimportal',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
export const getAllTrainings = async (): Promise<Training[]> => {
  const client = await pool.connect();
  try {
    console.log('[trainingService] Tüm eğitimler getiriliyor');
    const result = await client.query('SELECT id, title, description, category, duration, author, published, deadline, is_mandatory, "createdAt", "updatedAt" FROM trainings ORDER BY "createdAt" DESC');
    return result.rows.map(row => ({
      ...row,
      isMandatory: row.is_mandatory
    })) as Training[]; 
  } catch (error) {
    console.error('[trainingService] Eğitimler getirilirken hata:', error);
    throw error;
  } finally {
    client.release();
  }
};
export const getTrainingById = async (id: string): Promise<Training | null> => {
  const client = await pool.connect();
  try {
    console.log(`[trainingService] ID ${id} olan eğitim getiriliyor`);
    const result = await client.query('SELECT *, deadline, is_mandatory FROM trainings WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return null;
    }
    const row = result.rows[0];
    const learningOutcomes = row.learning_outcomes ? [...row.learning_outcomes] : [];
    const training: Training = {
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      duration: row.duration,
      author: row.author,
      published: row.published,
      isMandatory: row.is_mandatory,
      tags: row.tags,
      certificateTemplate: row.certificateTemplate,
      deadline: row.deadline,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      content: [],
      quizzes: []
    };
    if (row.learning_outcomes) {
      (training as any).learningOutcomes = row.learning_outcomes;
    }
    const contentResult = await client.query(
      'SELECT id, training_id, title, content_type, content_value, order_index, "createdAt", "updatedAt" FROM training_content WHERE training_id = $1 ORDER BY order_index',
      [id]
    );
    training.content = contentResult.rows.map((r: any) => ({
      id: r.id,
      trainingId: r.training_id,
      type: r.content_type,
      title: r.title,
      content: r.content_value,
      order: r.order_index,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }));
    const quizzesResult = await client.query(
      'SELECT id, training_id, title, description, pass_threshold, "createdAt", "updatedAt" FROM quizzes WHERE training_id = $1',
      [id]
    );
    const quizzes = quizzesResult.rows.map((r: any) => ({
      id: r.id,
      trainingId: r.training_id,
      title: r.title,
      description: r.description,
      passingScore: parseFloat(r.pass_threshold),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      questions: [] as Question[]
    }));
    training.quizzes = quizzes;
    if (quizzes.length > 0) {
      for (const quiz of quizzes) {
        console.log(`[trainingService] Quiz ${quiz.id} için soruları getiriliyor`);
        try {
          const questionsResult = await client.query(
            'SELECT id, quiz_id, question_text, question_type, options, correct_answer, points, order_index, "createdAt", "updatedAt" FROM questions WHERE quiz_id = $1 ORDER BY order_index',
            [quiz.id]
          );
          const questions = questionsResult.rows.map((q: any) => {
            try {
              let options = [];
              let correctAnswer: string | string[] = '';
              try {
                if (q.options) {
                  options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
                }
              } catch (e) {
                console.error(`[trainingService] Options parse edilirken hata:`, e);
                options = [];
              }
              try {
                if (q.correct_answer) {
                  correctAnswer = typeof q.correct_answer === 'string' ? JSON.parse(q.correct_answer) : q.correct_answer;
                }
              } catch (e) {
                console.error(`[trainingService] CorrectAnswer parse edilirken hata:`, e);
                correctAnswer = q.correct_answer || '';
              }
              return {
                id: q.id,
                quizId: q.quiz_id,
                text: q.question_text,
                type: q.question_type,
                options: options,
                correctAnswer: correctAnswer,
                points: q.points,
                order: q.order_index,
                createdAt: q.createdAt,
                updatedAt: q.updatedAt
              } as Question;
            } catch (error) {
              console.error(`[trainingService] Soru işlenirken hata:`, error);
              return {
                id: q.id,
                quizId: q.quiz_id,
                text: q.question_text || '',
                type: q.question_type || 'text',
                options: [],
                correctAnswer: '',
                points: q.points || 0,
                order: q.order_index || 0,
                createdAt: q.createdAt,
                updatedAt: q.updatedAt
              } as Question;
            }
          });
          quiz.questions = questions as Question[];
          console.log(`[trainingService] Quiz ${quiz.id} için ${questions.length} soru getirildi`);
        } catch (error) {
          console.error(`[trainingService] Quiz ${quiz.id} için sorular getirilirken hata:`, error);
          quiz.questions = [] as Question[];
        }
      }
    }
    return training;
  } catch (error) {
    console.error(`[trainingService] ID ${id} olan eğitim getirilirken hata:`, error);
    throw error;
  } finally {
    client.release();
  }
};
export const createTraining = async (
  trainingData: Omit<Training, 'id' | 'createdAt' | 'updatedAt' | 'quizzes' | 'certificateTemplate'> & { content?: any[], deadline?: string | null, isMandatory?: boolean }
): Promise<Training> => {
  const client = await pool.connect();
  const { title, description, category, duration, author, published, content, deadline, isMandatory } = trainingData;
  try {
    console.log('[trainingService] Yeni eğitim oluşturuluyor:', title);
    const result = await client.query(`
      INSERT INTO trainings (title, description, category, duration, author, published, deadline, is_mandatory)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *, deadline, is_mandatory
    `, [title, description, category, duration, author, published, deadline, isMandatory ?? false]); // isMandatory için varsayılan false
    const newTraining = result.rows[0];
    if (content && content.length > 0) {
    }
    const fullTraining = await getTrainingById(newTraining.id);
    if (!fullTraining) throw new Error('Oluşturulan eğitim bulunamadı');
    return fullTraining;
  } catch (error) {
    console.error('[trainingService] Eğitim oluşturulurken hata:', error);
    throw error;
  } finally {
    client.release();
  }
};
export const updateTraining = async (
  id: string, 
  trainingData: Partial<Omit<Training, 'id' | 'createdAt' | 'updatedAt' | 'content' | 'quizzes' | 'certificateTemplate'>> & { deadline?: string | null, isMandatory?: boolean }
): Promise<Training | null> => {
  const client = await pool.connect();
  const { title, description, category, duration, author, published, deadline, isMandatory, tags } = trainingData;
  const fieldsToUpdate: string[] = [];
  const values: any[] = [];
  let queryIndex = 1;
  if (title !== undefined) { fieldsToUpdate.push(`title = $${queryIndex++}`); values.push(title); }
  if (description !== undefined) { fieldsToUpdate.push(`description = $${queryIndex++}`); values.push(description); }
  if (category !== undefined) { fieldsToUpdate.push(`category = $${queryIndex++}`); values.push(category); }
  if (duration !== undefined) { fieldsToUpdate.push(`duration = $${queryIndex++}`); values.push(duration); }
  if (author !== undefined) { fieldsToUpdate.push(`author = $${queryIndex++}`); values.push(author); }
  if (published !== undefined) { fieldsToUpdate.push(`published = $${queryIndex++}`); values.push(published); }
  if (deadline !== undefined) { fieldsToUpdate.push(`deadline = $${queryIndex++}`); values.push(deadline); }
  if (isMandatory !== undefined) { fieldsToUpdate.push(`is_mandatory = $${queryIndex++}`); values.push(isMandatory); }
  if (tags !== undefined) { fieldsToUpdate.push(`tags = $${queryIndex++}`); values.push(tags); }
  if (fieldsToUpdate.length === 0) {
    console.log('[trainingService] Güncellenecek alan bulunamadı.');
    return getTrainingById(id);
  }
  fieldsToUpdate.push(`"updatedAt" = CURRENT_TIMESTAMP`);
  values.push(id);
  const updateQuery = `
    UPDATE trainings
    SET ${fieldsToUpdate.join(', ')}
    WHERE id = $${queryIndex}
    RETURNING *
  `;
  try {
    console.log(`[trainingService] ID ${id} olan eğitim güncelleniyor`);
    console.log(`[trainingService] Çalıştırılan SQL sorgusu:`, updateQuery);
    console.log(`[trainingService] SQL sorgusu parametreleri:`, values);
    const result = await client.query(updateQuery, values);
    if (result.rows.length === 0) {
      return null;
    }
    return getTrainingById(id);
  } catch (error) {
    console.error(`[trainingService] ID ${id} olan eğitim güncellenirken hata:`, error);
    throw error;
  } finally {
    client.release();
  }
};
export const deleteTraining = async (id: string): Promise<boolean> => {
  const client = await pool.connect();
  try {
    console.log(`[trainingService] ID ${id} olan eğitim siliniyor`);
    await client.query('BEGIN');
    await client.query('DELETE FROM user_training_assignments WHERE training_id = $1', [id]);
    await client.query('DELETE FROM training_content WHERE training_id = $1', [id]);
    await client.query('DELETE FROM questions WHERE quiz_id IN (SELECT id FROM quizzes WHERE training_id = $1)', [id]);
    await client.query('DELETE FROM quizzes WHERE training_id = $1', [id]);
    const result = await client.query('DELETE FROM trainings WHERE id = $1', [id]);
    await client.query('COMMIT');
    if (result.rowCount ?? 0 > 0) {
      console.log(`[trainingService] ID ${id} olan eğitim başarıyla silindi.`);
      return true;
    } else {
      console.log(`[trainingService] ID ${id} olan eğitim bulunamadı veya silinemedi.`);
      return false;
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`[trainingService] ID ${id} olan eğitim silinirken hata:`, error);
    throw error;
  } finally {
    client.release();
  }
};
export const updateTrainingContent = async (id: string, data: { content?: any[], quizzes?: any[], learningOutcomes?: string[] }): Promise<Training | null> => {
  const client = await pool.connect();
  let transactionError: Error | null = null;
  try {
    console.log(`[trainingService] ID ${id} olan eğitimin içeriği güncelleniyor`);
    const checkResult = await client.query('SELECT id FROM trainings WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return null;
    }
    await client.query('BEGIN');
    if (Array.isArray(data.learningOutcomes)) {
      await client.query(
        'UPDATE trainings SET learning_outcomes = $1, "updatedAt" = NOW() WHERE id = $2',
        [data.learningOutcomes, id]
      );
    }
    if (Array.isArray(data.content)) {
      await client.query('DELETE FROM training_content WHERE training_id = $1', [id]);
      for (const item of data.content) {
        const contentType = item.type || 'text';
        await client.query(
          'INSERT INTO training_content (training_id, title, content_type, content_value, order_index, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
          [id, item.title, contentType, item.content, item.order]
        );
      }
    }
    if (Array.isArray(data.quizzes)) {
      await client.query('DELETE FROM quizzes WHERE training_id = $1', [id]);
      for (const quiz of data.quizzes) {
        const quizResult = await client.query(
          'INSERT INTO quizzes (training_id, title, description, pass_threshold, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id',
          [id, quiz.title, quiz.description, quiz.passingScore]
        );
        const quizId = quizResult.rows[0].id;
        if (Array.isArray(quiz.questions)) {
          let questionOrderIndex = 0;
          for (const question of quiz.questions) {
            try {
              console.log('[trainingService] Soru ekleniyor:', {
                quizId,
                questionText: question.text,
                questionType: question.type,
                options: typeof question.options === 'object' ? JSON.stringify(question.options) : question.options,
                correctAnswer: typeof question.correctAnswer === 'object' ? JSON.stringify(question.correctAnswer) : question.correctAnswer,
                points: question.points,
                orderIndex: questionOrderIndex
              });
              const optionsValue = Array.isArray(question.options) ? question.options : [];
              let correctAnswerValue;
              if (Array.isArray(question.correctAnswer)) {
                correctAnswerValue = question.correctAnswer;
              } else if (question.correctAnswer) {
                correctAnswerValue = [question.correctAnswer];
              } else {
                correctAnswerValue = [];
              }
              const optionsJson = JSON.stringify(optionsValue);
              const correctAnswerJson = JSON.stringify(correctAnswerValue);
              console.log('[trainingService] JSON formatına dönüştürülen veriler:', {
                options: optionsJson,
                correctAnswer: correctAnswerJson
              });
              await client.query(
                'INSERT INTO questions (quiz_id, question_text, question_type, options, correct_answer, points, order_index) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [
                  quizId, 
                  question.text || '',
                  question.type || 'text',
                  optionsJson,
                  correctAnswerJson,
                  question.points || 0,
                  questionOrderIndex
                ]
              );
              questionOrderIndex++;
              console.log('[trainingService] Soru başarıyla eklendi!');
            } catch (error) {
              console.error('[trainingService] Soru eklenirken hata:', error);
              throw error;
            }
          }
        }
      }
    }
    try {
      const logQuery = 'INSERT INTO logs (user_id, action_type, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)';
      const logParams = [
        null,
        'TRAINING_UPDATED',
        JSON.stringify({ trainingId: id, action: 'update' }),
        'SYSTEM',
        'SYSTEM'
      ];
      console.log('[trainingService] Log Query:', logQuery);
      console.log('[trainingService] Log Params:', logParams);
      await client.query(logQuery, logParams);
    } catch (logError) {
      console.error('[trainingService] Loglama hatası (işlem devam edecek):', logError);
    }
    await client.query('COMMIT');
    return getTrainingById(id);
  } catch (error: any) {
    transactionError = error;
    try {
        console.log('[trainingService] Attempting ROLLBACK due to error...');
        await client.query('ROLLBACK');
        console.log('[trainingService] ROLLBACK successful.');
    } catch (rollbackError: any) {
        console.error('[trainingService] ROLLBACK failed:', rollbackError);
    }
    console.error(`[trainingService] ID ${id} olan eğitimin içeriği güncellenirken hata:`, transactionError);
    throw transactionError;
  } finally {
    client.release(transactionError ? transactionError : undefined);
    console.log(`[trainingService] Client released. Error passed to release: ${!!transactionError}`);
  }
};
export const getTrainingProgress = async (trainingId: string, userId: string): Promise<any | null> => {
  const userIdInt = parseInt(userId, 10);
  if (isNaN(userIdInt)) {
    console.error('Geçersiz kullanıcı ID formatı:', userId);
    return { 
      progress: 0, 
      completed: false, 
      completedItems: [], 
      quizResults: [], 
      status: 'INVALID_USER_ID' 
    }; 
  }
  let client;
  try {
    client = await pool.connect();
    console.log(`[trainingService] Kullanıcı ${userIdInt}, Eğitim ${trainingId} için progress getiriliyor`);
    const progressResult = await client.query(
      'SELECT status, progress_percentage, completed_content_items, completed_at, started_at, "updatedAt", bootcamp_id FROM user_training_progress WHERE training_id = $1 AND user_id = $2',
      [trainingId, userIdInt]
    );
    if (progressResult.rows.length > 0) {
      const progressRecord = progressResult.rows[0];
      console.log(`[trainingService] user_training_progress tablosunda kayıt bulundu:`, progressRecord);
      return { 
        progress: parseFloat(progressRecord.progress_percentage) || 0,
        progress_percentage: parseFloat(progressRecord.progress_percentage) || 0,
        completed: progressRecord.status === 'COMPLETED', 
        status: progressRecord.status,
        completedAt: progressRecord.completed_at,
        started_at: progressRecord.started_at,
        completed_content_items: progressRecord.completed_content_items || [],
        completedItems: progressRecord.completed_content_items || [],
        bootcamp_id: progressRecord.bootcamp_id,
        updatedAt: progressRecord.updatedAt,
        quizResults: [], 
      };
    }
    const enrollmentResult = await client.query(
      'SELECT progress, status, completed_at, completed_items, start_date, updated_at, score FROM enrollments WHERE training_id = $1 AND user_id = $2',
      [trainingId, userIdInt]
    );
    if (enrollmentResult.rows.length > 0) {
      const enrollment = enrollmentResult.rows[0];
      console.log(`[trainingService] enrollments tablosunda kayıt bulundu:`, enrollment);
    return {
        progress: enrollment.progress || 0,
        progress_percentage: enrollment.progress || 0,
        completed: enrollment.status === 'COMPLETED', 
        status: enrollment.status,
        completedAt: enrollment.completed_at,
        started_at: enrollment.start_date,
        completedItems: enrollment.completed_items || [],
        completed_content_items: enrollment.completed_items || [],
        score: enrollment.score,
        updatedAt: enrollment.updated_at,
        quizResults: [],
      };
    }
    console.log(`[trainingService] Hiçbir tabloda kayıt bulunamadı - trainingId=${trainingId}, userId=${userIdInt}`);
    return { 
      progress: 0, 
      completed: false, 
        completedItems: [], 
        quizResults: [],
      status: 'NOT_ENROLLED' 
      };
  } catch (error) {
    console.error('Progress alınırken hata:', error);
    return { 
      progress: 0, 
      completed: false, 
      completedItems: [], 
      quizResults: [], 
      status: 'ERROR' 
    };
  } finally {
    if (client) {
      client.release();
    }
  }
};
export const updateTrainingProgress = async (
  trainingId: string,
  userId: string,
  data: { 
    contentId?: string; 
    progress?: number; 
    status?: string; 
    completedItems?: string[];
    bootcampId?: string | null;
    completed?: boolean;
  }
): Promise<any | null> => {
  const userIdInt = parseInt(userId, 10);
  if (isNaN(userIdInt)) {
    console.error('[trainingService] Geçersiz kullanıcı ID formatı:', userId);
    throw new Error('Geçersiz kullanıcı ID formatı');
  }
  let client;
  try {
    client = await pool.connect();
    console.log(`[trainingService] Kullanıcı ${userIdInt}, Eğitim ${trainingId} için ilerleme güncelleniyor. data:`, data);
    await client.query('BEGIN');
    const currentStateResult = await client.query(
      'SELECT status, progress_percentage, completed_content_items, completed_at, completion_duration_seconds, bootcamp_id, started_at FROM user_training_progress WHERE user_id = $1 AND training_id = $2',
      [userIdInt, trainingId]
    );
    const contentCountResult = await client.query(
      'SELECT COUNT(*) as total FROM training_content WHERE training_id = $1',
      [trainingId]
    );
    const totalContentCount = parseInt(contentCountResult.rows[0].total, 10) || 1;
    const currentValues = {
      status: currentStateResult.rows.length > 0 ? currentStateResult.rows[0].status : 'NOT_STARTED',
      progressPercentage: currentStateResult.rows.length > 0 ? parseFloat(currentStateResult.rows[0].progress_percentage) || 0 : 0,
      completedItems: currentStateResult.rows.length > 0 ? currentStateResult.rows[0].completed_content_items || [] : [],
      completedAt: currentStateResult.rows.length > 0 ? currentStateResult.rows[0].completed_at : null,
      completionDurationSeconds: currentStateResult.rows.length > 0 ? currentStateResult.rows[0].completion_duration_seconds : null,
      bootcampId: currentStateResult.rows.length > 0 ? currentStateResult.rows[0].bootcamp_id : null,
      startedAt: currentStateResult.rows.length > 0 ? currentStateResult.rows[0].started_at : null
    };
    console.log('[trainingService] Mevcut değerler:', currentValues);
    let newCompletedItems = Array.isArray(currentValues.completedItems) ? [...currentValues.completedItems] : [];
    if (data.contentId && !newCompletedItems.includes(data.contentId)) {
      newCompletedItems.push(data.contentId);
    }
    if (data.completedItems) {
      newCompletedItems = data.completedItems;
    }
    let newProgressPercentage = data.progress !== undefined 
      ? data.progress 
      : Math.round((newCompletedItems.length / totalContentCount) * 100);
    newProgressPercentage = Math.min(100, Math.max(0, newProgressPercentage));
    let newStatus = data.status || currentValues.status;
    if (!data.status) {
      if (newProgressPercentage >= 100 && newStatus !== 'COMPLETED' && newStatus !== 'QUIZZES_PENDING') {
        newStatus = 'CONTENT_COMPLETED';
      } else if (newProgressPercentage > 0 && newStatus === 'NOT_STARTED') {
        newStatus = 'IN_PROGRESS';
      }
    }
    if (data.completed === true && newStatus !== 'COMPLETED') {
      console.log(`[trainingService] Manuel completed=true geldi, sınav durumu kontrol ediliyor (önceki status: ${newStatus})`);
      const quizCountResult = await client.query(
        'SELECT COUNT(*) as quiz_count FROM quizzes WHERE training_id = $1',
        [trainingId]
      );
      const totalQuizCount = parseInt(quizCountResult.rows[0].quiz_count, 10) || 0;
      const passedQuizzesResult = await client.query(
        'SELECT COUNT(*) as passed_count FROM user_quiz_attempts WHERE user_id = $1 AND training_id = $2 AND passed = true',
        [userIdInt, trainingId]
      );
      const passedQuizCount = parseInt(passedQuizzesResult.rows[0].passed_count, 10) || 0;
      console.log(`[trainingService] Quiz durumu: Toplam Quiz: ${totalQuizCount}, Geçilen Quiz: ${passedQuizCount}`);
      if (totalQuizCount > 0 && passedQuizCount < totalQuizCount) {
        console.log(`[trainingService] Eğitimde çözülmemiş sınavlar var, durum QUIZZES_PENDING olarak ayarlanıyor`);
        newStatus = 'QUIZZES_PENDING';
      } else {
        console.log(`[trainingService] Eğitimde sınav yok ya da tüm sınavlar geçilmiş, durum COMPLETED olarak ayarlanıyor`);
        newStatus = 'COMPLETED';
      }
    }
    let newCompletedAt = currentValues.completedAt;
    const isFreshCompletion = newStatus === 'COMPLETED' && currentValues.status !== 'COMPLETED';
    if (isFreshCompletion) {
      console.log('[trainingService] Eğitim ilk kez tamamlanıyor, completed_at şu anda ayarlanıyor');
      newCompletedAt = new Date();
    }
    let newBootcampId = data.bootcampId !== undefined ? data.bootcampId : currentValues.bootcampId;
    let newStartedAt = currentValues.startedAt;
    if (!newStartedAt) {
      newStartedAt = new Date();
    }
    let newCompletionDurationSeconds = currentValues.completionDurationSeconds;
    if (isFreshCompletion && newStartedAt) {
      try {
        const now = new Date();
        const startDate = new Date(newStartedAt);
        newCompletionDurationSeconds = Math.floor((now.getTime() - startDate.getTime()) / 1000);
        console.log(`[trainingService] Tamamlanma süresi hesaplandı: ${newCompletionDurationSeconds} saniye`);
      } catch (e) {
        console.error('[trainingService] Tamamlanma süresi hesaplanırken hata:', e);
      }
    }
    const completedItemsJson = newCompletedItems ? JSON.stringify(newCompletedItems) : null;
    console.log(`[trainingService] UPSERT için veriler hazırlanıyor:
      status = ${newStatus}
      progress_percentage = ${newProgressPercentage}
      completed_at = ${isFreshCompletion ? 'NOW()' : 'null ya da mevcut değer'}
      started_at = ${newStartedAt ? newStartedAt.toISOString() : 'null'}
      bootcamp_id = ${newBootcampId || 'null'}
      completion_duration_seconds = ${newCompletionDurationSeconds || 'null'}
    `);
    const upsertQuery = `
      INSERT INTO user_training_progress
        (user_id, training_id, bootcamp_id, status, 
         progress_percentage, completed_content_items, 
         started_at, completed_at, completion_duration_seconds, "updatedAt")
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7,
         ${newStatus === 'COMPLETED' ? 'NOW()' : 'NULL'}, 
         $8, NOW())
      ON CONFLICT (user_id, training_id) 
      DO UPDATE SET
        bootcamp_id = COALESCE($3, user_training_progress.bootcamp_id),
        status = $4,
        progress_percentage = $5,
        completed_content_items = $6,
        started_at = COALESCE(user_training_progress.started_at, $7),
        completed_at = ${newStatus === 'COMPLETED' ? 'NOW()' : 'CASE WHEN user_training_progress.status != \'COMPLETED\' AND $4 = \'COMPLETED\' THEN NOW() ELSE user_training_progress.completed_at END'},
        completion_duration_seconds = COALESCE($8, user_training_progress.completion_duration_seconds),
        "updatedAt" = NOW()
      RETURNING *
    `;
    const upsertParams = [
      userIdInt,
      trainingId,
      newBootcampId,
      newStatus,
      newProgressPercentage,
      completedItemsJson,
      newStartedAt,
      newCompletionDurationSeconds
    ];
    console.log('[trainingService] UPSERT sorgusu yürütülüyor:');
    const result = await client.query(upsertQuery, upsertParams);
    console.log('[trainingService] UPSERT sonucu:', result.rows[0]);
    const enrollmentCheck = await client.query(
      'SELECT id, status, progress, completed_items, completed_at FROM enrollments WHERE user_id = $1 AND training_id = $2',
      [userIdInt, trainingId]
    );
    let enrollmentStatus = newStatus;
    if (newStatus === 'CONTENT_COMPLETED' || newStatus === 'QUIZZES_PENDING') {
      enrollmentStatus = 'IN_PROGRESS';
    }
    if (!['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].includes(enrollmentStatus)) {
      console.warn(`[trainingService] Bilinmeyen status değeri: "${enrollmentStatus}", varsayılan "IN_PROGRESS" kullanılıyor`);
      enrollmentStatus = 'IN_PROGRESS';
    }
    console.log(`[trainingService] enrollment status dönüşümü: ${newStatus} -> ${enrollmentStatus}`);
    if (enrollmentCheck.rows.length === 0) {
      const insertEnrollmentQuery = `
        INSERT INTO enrollments (
          user_id, training_id, status, progress, completed_items,
          completed_at, start_date, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      `;
      const insertParams = [
        userIdInt, 
        trainingId, 
        enrollmentStatus,
        newProgressPercentage,
        completedItemsJson,
        isFreshCompletion ? new Date() : null,
        newStartedAt
      ];
      console.log('[trainingService] Enrollment ekleme sorgusu:', {
        query: insertEnrollmentQuery,
        params: insertParams
      });
      await client.query(insertEnrollmentQuery, insertParams);
      console.log('[trainingService] Enrollment kaydı oluşturuldu');
    } else {
      const updateEnrollmentQuery = `
        UPDATE enrollments 
        SET status = $1, 
            progress = $2, 
            completed_items = $3,
            completed_at = ${isFreshCompletion ? 'NOW()' : 'CASE WHEN status = \'COMPLETED\' THEN completed_at ELSE NULL END'},
            updated_at = NOW()
        WHERE user_id = $4 AND training_id = $5
      `;
      const updateParams = [
        enrollmentStatus,
        newProgressPercentage,
        completedItemsJson,
        userIdInt,
        trainingId
      ];
      console.log('[trainingService] Enrollment güncelleme sorgusu:', {
        query: updateEnrollmentQuery,
        params: updateParams,
        enrollment_current_status: enrollmentCheck.rows[0].status,
        isFreshCompletion
      });
      await client.query(updateEnrollmentQuery, updateParams);
      console.log('[trainingService] Enrollment kaydı güncellendi');
    }
    await client.query('COMMIT');
    console.log('[trainingService] Transaction başarıyla commit edildi');
    return {
      training_id: trainingId,
      user_id: userIdInt,
      status: newStatus,
      progress: newProgressPercentage,
      progress_percentage: newProgressPercentage,
      completed: newStatus === 'COMPLETED',
      completed_content_items: newCompletedItems,
      completedItems: newCompletedItems,
      started_at: newStartedAt,
      completed_at: newCompletedAt,
      completion_duration_seconds: newCompletionDurationSeconds,
      updatedAt: new Date(),
      bootcamp_id: newBootcampId
    };
  } catch (error) {
    console.error('[trainingService] İlerleme güncellenirken hata:', error);
    if (client) {
      try {
        await client.query('ROLLBACK');
        console.log('[trainingService] Hata oluştuğu için işlem geri alındı (ROLLBACK)');
      } catch (rollbackError) {
        console.error('[trainingService] ROLLBACK hatası:', rollbackError);
      }
    }
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
};
export const assignTrainingToUser = async (
  userId: number, 
  trainingId: string
): Promise<{ assignmentId: number } | { error: string; errorCode?: string }> => {
  const client = await pool.connect();
  try {
    console.log(`[trainingService] Kullanıcı ${userId} için eğitim ${trainingId} atanıyor.`);
    const result = await client.query(
      'INSERT INTO public.user_training_assignments (user_id, training_id) VALUES ($1, $2) RETURNING assignment_id',
      [userId, trainingId]
    );
    const assignmentId = result.rows[0].assignment_id;
    console.log(`[trainingService] Eğitim atama başarılı. Atama ID: ${assignmentId}`);
    return { assignmentId };
  } catch (error: any) {
    console.error(`[trainingService] Eğitim ${trainingId} kullanıcı ${userId}'ye atanırken hata:`, error);
    if (error.code === '23505') {
      console.warn(`[trainingService] Eğitim ${trainingId} zaten kullanıcı ${userId}'ye atanmış.`);
      return { error: 'Bu eğitim bu kullanıcıya zaten atanmış.', errorCode: 'already_assigned' };
    } else if (error.code === '23503') {
      console.error(`[trainingService] Atama için geçersiz Kullanıcı ID (${userId}) veya Eğitim ID (${trainingId}).`);
      return { error: 'Atama için geçersiz kullanıcı veya eğitim IDsi.', errorCode: 'invalid_ids' };
    } else {
      return { error: 'Eğitim atanırken bir veritabanı hatası oluştu.', errorCode: 'db_error' };
    }
  } finally {
    client.release();
  }
};
export const getTrainingAssignmentsByTrainingId = async (trainingId: string): Promise<number[]> => {
  const client = await pool.connect();
  try {
    console.log(`[trainingService] Training ID ${trainingId} için atamalar getiriliyor`);
    const result = await client.query(
      'SELECT user_id FROM user_training_assignments WHERE training_id = $1',
      [trainingId]
    );
    return result.rows.map(row => row.user_id);
  } catch (error) {
    console.error(`[trainingService] Training ID ${trainingId} için atamalar getirilirken hata:`, error);
    throw error;
  } finally {
    client.release();
  }
};
export const unassignTrainingFromUser = async (userId: number, trainingId: string): Promise<{ success: boolean; message?: string }> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log(`[trainingService] Kullanıcı ${userId} için eğitim ${trainingId} ataması kaldırılıyor`);
    const bootcampCheckQuery = `
      SELECT bt.bootcamp_id, b.title 
      FROM bootcamp_trainings bt
      JOIN bootcamps b ON b.id = bt.bootcamp_id
      JOIN user_bootcamp_assignments uba ON uba.bootcamp_id = bt.bootcamp_id
      WHERE bt.training_id = $1 AND uba.user_id = $2
    `;
    const bootcampResult = await client.query(bootcampCheckQuery, [trainingId, userId]);
    if (bootcampResult.rows.length > 0) {
      const bootcampInfo = bootcampResult.rows[0];
      console.log(`[trainingService] Eğitim ${trainingId}, "${bootcampInfo.title}" bootcamp'inin bir parçası olduğu için kaldırılamıyor.`);
      await client.query('ROLLBACK');
      return { 
        success: false, 
        message: `Bu eğitim "${bootcampInfo.title}" bootcamp'inin bir parçasıdır ve kaldırılamaz. Eğitimi kaldırmak için önce bootcamp'i kaldırmalısınız.` 
      };
    }
    const deleteResult = await client.query(
      'DELETE FROM user_training_assignments WHERE user_id = $1 AND training_id = $2',
      [userId, trainingId]
    );
    if (deleteResult.rowCount === 0) {
      console.log(`[trainingService] Kullanıcı ${userId} için eğitim ${trainingId} ataması bulunamadı veya zaten kaldırılmış.`);
      await client.query('ROLLBACK');
      return { success: false, message: 'Atama bulunamadı veya zaten kaldırılmış.' };
    } else {
       const logQuery = 'INSERT INTO logs (user_id, action_type, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)';
       const logParams = [
         userId,
         'TRAINING_UNASSIGNED',
         JSON.stringify({ trainingId: trainingId, userId: userId, action: 'unassign' }),
         'SYSTEM',
         'SYSTEM'
       ];
       console.log('[trainingService] Log Query:', logQuery);
       console.log('[trainingService] Log Params:', logParams);
       await client.query(logQuery, logParams);
       await client.query('COMMIT');
      console.log(`[trainingService] Eğitim ${trainingId} ataması kullanıcı ${userId}'den başarıyla kaldırıldı.`);
      return { success: true };
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`[trainingService] Kullanıcı ${userId} için eğitim ${trainingId} ataması kaldırılırken hata:`, error);
    return { success: false, message: 'Eğitim ataması kaldırılırken bir sunucu hatası oluştu.' };
  } finally {
    client.release();
  }
};
export const getAssignedTrainingsForUser = async (userId: number): Promise<Training[]> => {
  const client = await pool.connect();
  try {
    console.log(`[trainingService] Kullanıcı ${userId} için atanmış eğitimler getiriliyor.`);
    const query = `
      SELECT 
        t.id, t.title, t.description, t.category, t.duration, 
        t.author, t.published, t.deadline, t.is_mandatory, t."createdAt", t."updatedAt",
        uta.assigned_at
      FROM public.trainings t
      JOIN public.user_training_assignments uta ON t.id = uta.training_id
      WHERE uta.user_id = $1
      ORDER BY uta.assigned_at DESC; -- veya t.title
    `;
    const result = await client.query(query, [userId]);
    console.log(`[trainingService] Kullanıcı ${userId} için ${result.rows.length} atanmış eğitim bulundu.`);
    return result.rows.map(row => ({
        ...row, 
        content: [],
        quizzes: []
    })) as Training[];
  } catch (error) {
    console.error(`[trainingService] Kullanıcı ${userId} için atanmış eğitimler getirilirken hata:`, error);
    throw error;
  } finally {
    client.release();
  }
};
export const getAllRelevantTrainingsForUser = async (userId: number): Promise<Training[]> => {
  const client = await pool.connect();
  try {
    console.log(`[trainingService] Kullanıcı ${userId} için ilgili tüm eğitimler getiriliyor.`);
    const assignedQuery = `
      SELECT 
        t.id, t.title, t.description, t.category, t.duration, 
        t.author, t.published, t.deadline, t.is_mandatory, t."createdAt", t."updatedAt"
      FROM public.trainings t
      JOIN public.user_training_assignments uta ON t.id = uta.training_id
      WHERE uta.user_id = $1;
    `;
    const assignedResult = await client.query(assignedQuery, [userId]);
    const assignedTrainings = assignedResult.rows;
    console.log(`[trainingService] Kullanıcı ${userId} için ${assignedTrainings.length} atanmış eğitim bulundu.`);
    const publishedQuery = `
      SELECT 
        id, title, description, category, duration, 
        author, published, deadline, is_mandatory, "createdAt", "updatedAt"
      FROM public.trainings
      WHERE published = true;
    `;
    const publishedResult = await client.query(publishedQuery);
    const publishedTrainings = publishedResult.rows;
    console.log(`[trainingService] ${publishedTrainings.length} yayınlanmış eğitim bulundu.`);
    const allRelevantMap = new Map<string, Training>();
    assignedTrainings.forEach(training => {
      allRelevantMap.set(training.id, {
        ...training,
        content: [],
        quizzes: []
      } as Training);
    });
    publishedTrainings.forEach(training => {
      if (!allRelevantMap.has(training.id)) {
        allRelevantMap.set(training.id, {
          ...training,
          content: [],
          quizzes: []
        } as Training);
      }
    });
    const uniqueRelevantTrainings = Array.from(allRelevantMap.values());
    console.log(`[trainingService] Kullanıcı ${userId} için toplam ${uniqueRelevantTrainings.length} ilgili eğitim bulundu.`);
    return uniqueRelevantTrainings;
  } catch (error) {
    console.error(`[trainingService] Kullanıcı ${userId} için ilgili eğitimler getirilirken hata:`, error);
    throw error;
  } finally {
    client.release();
  }
};
export const getAssignedTrainings = async (userId: number): Promise<Training[]> => {
  try {
    console.log(`Servis: Kullanıcı ${userId} için atanmış eğitimler getiriliyor.`);
    const result = await pool.query(
      `SELECT t.* 
       FROM trainings t
       JOIN user_training_assignments uta ON t.id = uta.training_id
       WHERE uta.user_id = $1`,
      [userId]
    );
    const assignedTrainings: Training[] = result.rows;
    console.log(`Servis: Kullanıcı ${userId} için ${assignedTrainings.length} adet atanmış eğitim bulundu.`);
    return assignedTrainings;
  } catch (error) {
    console.error(`Kullanıcı ${userId} için atanmış eğitimleri getirirken hata:`, error);
    throw new Error('Atanmış eğitimler getirilemedi.');
  }
};
export const getPublishedTrainings = async (): Promise<Training[]> => {
  const client = await pool.connect();
  try {
    console.log(`[trainingService] Yayınlanmış tüm eğitimler getiriliyor.`);
    const query = `
      SELECT 
        id, title, description, category, duration, 
        author, published, deadline, is_mandatory, "createdAt", "updatedAt"
      FROM public.trainings
      WHERE published = true;
    `;
    const result = await client.query(query);
    console.log(`[trainingService] ${result.rows.length} yayınlanmış eğitim bulundu.`);
    return result.rows.map(row => ({
        ...row, 
        content: [],
        quizzes: []
    })) as Training[];
  } catch (error) {
    console.error(`[trainingService] Yayınlanmış eğitimler getirilirken hata:`, error);
    throw error;
  } finally {
    client.release();
  }
};
export const isUserAssignedToTraining = async (userId: number, trainingId: string): Promise<boolean> => {
  const client = await pool.connect();
  try {
    console.log(`[trainingService] Kullanıcı ${userId} için Eğitim ${trainingId} atama kontrolü yapılıyor.`);
    const query = `
      SELECT 1 FROM public.user_training_assignments
      WHERE user_id = $1 AND training_id = $2
      LIMIT 1
    `;
    const result = await client.query(query, [userId, trainingId]);
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error(`[trainingService] Atama kontrolü sırasında hata: userId=${userId}, trainingId=${trainingId}`, error);
    return false;
  } finally {
    client.release();
  }
};