import dayjs from 'dayjs';
import { pool } from '../../db';
export const statisticsService = {
  async getMonthlyCompletedTrainingsCount(): Promise<number> {
    const now = dayjs();
    const startDate = now.subtract(30, 'day').toDate();
    const endDate = now.toDate();
    console.log(`[StatisticsService] Tamamlanan eğitimleri alıyorum, tarih aralığı: ${startDate.toISOString()} - ${endDate.toISOString()}`);
    console.log(`[StatisticsService] Şu anki tarih: ${new Date().toISOString()}`);
    try {
      const checkQuery = `
        SELECT COUNT(*) as total_completed
        FROM user_training_progress 
        WHERE status = 'COMPLETED'
      `;
      const checkResult = await pool.query(checkQuery);
      console.log(`[StatisticsService] Toplam tamamlanmış eğitim sayısı (tarih sınırı olmadan): ${checkResult.rows[0].total_completed}`);
      const allCompletedQuery = `
        SELECT user_id, training_id, status, completed_at  
        FROM user_training_progress 
        WHERE status = 'COMPLETED'
        LIMIT 10
      `;
      const allCompletedResult = await pool.query(allCompletedQuery);
      console.log(`[StatisticsService] Tamamlanmış eğitimler (ilk 10):`, 
        allCompletedResult.rows.map(row => ({
          user_id: row.user_id,
          training_id: row.training_id, 
          status: row.status,
          completed_at: row.completed_at
        }))
      );
      const query = `
        WITH combined_completions AS (
          -- Enrollments tablosundan tamamlanmış eğitimler
          SELECT user_id, training_id, completed_at 
          FROM enrollments 
          WHERE status = 'COMPLETED' 
          AND completed_at >= $1 
          AND completed_at <= $2
          UNION
          -- User_training_progress tablosundan tamamlanmış eğitimler
          SELECT user_id, training_id, completed_at 
          FROM user_training_progress 
          WHERE status = 'COMPLETED' 
          AND (completed_at IS NOT NULL)
          AND (
            completed_at >= $1 
            AND completed_at <= $2
          )
        )
        -- Benzersiz (user_id, training_id) kombinasyonlarını say
        SELECT COUNT(DISTINCT (user_id, training_id)) as count 
        FROM combined_completions
      `;
      const result = await pool.query(query, [startDate, endDate]);
      const count = parseInt(result.rows[0].count, 10);
      console.log(`[StatisticsService] Belirtilen tarih aralığında tamamlanan benzersiz eğitim sayısı: ${count}`);
      const debugQuery = `
        WITH combined_completions AS (
          -- Enrollments tablosundan tamamlanmış eğitimler
          SELECT 'enrollments' as source, e.user_id, e.training_id, e.completed_at, u.email, t.title as training_title
          FROM enrollments e
          JOIN users u ON e.user_id = u.id
          JOIN trainings t ON e.training_id = t.id
          WHERE e.status = 'COMPLETED' 
          AND e.completed_at >= $1 
          AND e.completed_at <= $2
          UNION ALL
          -- User_training_progress tablosundan tamamlanmış eğitimler
          SELECT 'user_training_progress' as source, utp.user_id, utp.training_id, utp.completed_at, u.email, t.title as training_title
          FROM user_training_progress utp
          JOIN users u ON utp.user_id = u.id
          JOIN trainings t ON utp.training_id = t.id
          WHERE utp.status = 'COMPLETED' 
          AND utp.completed_at IS NOT NULL
          AND utp.completed_at >= $1 
          AND utp.completed_at <= $2
        )
        SELECT * FROM combined_completions
        ORDER BY completed_at DESC
        LIMIT 20
      `;
      const debugResult = await pool.query(debugQuery, [startDate, endDate]);
      console.log(`[StatisticsService] Son tamamlanan eğitimler (en fazla 20 kayıt):`, 
        debugResult.rows.map(row => ({
          source: row.source,
          user_email: row.email,
          training_title: row.training_title,
          completed_at: row.completed_at
        }))
      );
      return count;
    } catch (error) {
      console.error('[StatisticsService] Aylık tamamlanan eğitim sayısı alınırken hata:', error);
      throw new Error('Aylık tamamlanan eğitim sayısı alınırken bir veritabanı hatası oluştu.');
    }
  },
  async getAllCompletedTrainings() {
    try {
      console.log('[StatisticsService] Tüm tamamlanmış eğitimleri getiriyorum');
      const now = dayjs();
      const startOfMonth = now.startOf('month').toDate();
      const endOfMonth = now.endOf('month').toDate();
      const query = `
        WITH combined_completions AS (
          -- Enrollments tablosundan tamamlanmış eğitimler
          SELECT 
            'enrollments' as source,
            e.id::TEXT as record_id,  -- Tip dönüşümü burada yapıldı
            e.user_id, 
            e.training_id, 
            e.status, 
            e.completed_at,
            e.progress,
            e.created_at,
            u."firstName" as first_name,
            u."lastName" as last_name, 
            u.email,
            t.title as training_title,
            d.name as department_name
          FROM enrollments e
          JOIN users u ON e.user_id = u.id
          JOIN trainings t ON e.training_id = t.id
          LEFT JOIN employees emp ON u.id = emp."userId"
          LEFT JOIN departments d ON emp."departmentId" = d.id
          WHERE e.status = 'COMPLETED'
          UNION ALL
          -- User_training_progress tablosundan tamamlanmış eğitimler
          SELECT 
            'user_training_progress' as source,
            CONCAT(utp.user_id, '-', utp.training_id) as record_id,
            utp.user_id, 
            utp.training_id, 
            utp.status, 
            utp.completed_at,
            utp.progress_percentage as progress,
            utp.started_at as created_at,
            u."firstName" as first_name,
            u."lastName" as last_name, 
            u.email,
            t.title as training_title,
            d.name as department_name
          FROM user_training_progress utp
          JOIN users u ON utp.user_id = u.id
          JOIN trainings t ON utp.training_id = t.id
          LEFT JOIN employees emp ON u.id = emp."userId"
          LEFT JOIN departments d ON emp."departmentId" = d.id
          WHERE utp.status = 'COMPLETED'
        ),
        -- Eğer aynı (user_id, training_id) için iki kayıt varsa, 
        -- en son tamamlananı veya user_training_progress kaynağını tercih et
        ranked_completions AS (
          SELECT 
            *, 
            ROW_NUMBER() OVER (
              PARTITION BY (user_id, training_id) 
              ORDER BY 
                CASE WHEN source = 'user_training_progress' THEN 0 ELSE 1 END ASC,
                completed_at DESC
            ) as row_num
          FROM combined_completions
        )
        SELECT * FROM ranked_completions
        WHERE row_num = 1
        ORDER BY completed_at DESC
      `;
      const result = await pool.query(query);
      const completedTrainings = result.rows.map(row => ({
        ...row,
        is_current_month: row.completed_at >= startOfMonth && row.completed_at <= endOfMonth
      }));
      console.log(`[StatisticsService] Toplam ${completedTrainings.length} tamamlanmış eğitim bulundu.`);
      return {
        all_completed: completedTrainings,
        current_month_completed: completedTrainings.filter(item => item.is_current_month)
      };
    } catch (error) {
      console.error('[StatisticsService] Tamamlanan eğitimler alınırken hata:', error);
      throw new Error('Tamamlanan eğitimler alınırken bir veritabanı hatası oluştu.');
    }
  },
  async getUserTrainingProgressReport(): Promise<any> {
    try {
      console.log('[StatisticsService] Kullanıcı eğitim devam durumlarını getiriyorum');
      const query = `
        WITH all_users AS (
          -- Tüm kullanıcılar (admin olmayanlar)
          SELECT 
            u.id as user_id, 
            u.email, 
            u."firstName" as first_name,
            u."lastName" as last_name,
            e."departmentId" as employee_department_id, -- employees tablosundaki departmentId
            e.position,
            d.id as department_id, -- departments tablosundan gelen departmentId
            d.name as department_name
          FROM users u
          LEFT JOIN employees e ON u.id = e."userId"
          LEFT JOIN departments d ON e."departmentId" = d.id
          WHERE u.role NOT IN ('ADMIN_SENIOR', 'ADMIN_JUNIOR')
        ),
        active_user_trainings AS (
          -- Kullanıcı-eğitim atamaları - sadece user_training_assignments tablosundan
          SELECT 
            uta.user_id,
            t.id as training_id,
            t.title as training_title,
            t.category,
            t.is_mandatory,
            t.deadline
          FROM user_training_assignments uta
          INNER JOIN trainings t ON uta.training_id = t.id
        ),
        user_progress_details AS (
          -- Kullanıcıların eğitim ilerleme durumları (user_training_progress)
          SELECT 
            utp.user_id,
            utp.training_id,
            utp.status,
            utp.progress_percentage,
            utp.started_at,
            utp.completed_at,
            utp.completion_duration_seconds
          FROM user_training_progress utp
        ),
        enrollments_details AS (
          -- Kayıt bilgileri (enrollments)
          SELECT 
            e.user_id,
            e.training_id,
            e.status as enrollment_status,
            e.start_date,
            e.completed_at as enrollment_completed_at,
            e.last_accessed_at
          FROM enrollments e
        ),
        quiz_attempts_summary AS (
          -- Kullanıcıların sınav denemeleri özeti
          SELECT
            uqa.user_id,
            uqa.training_id,
            COUNT(DISTINCT uqa.quiz_id) as attempted_quizzes,
            SUM(CASE WHEN uqa.passed = true THEN 1 ELSE 0 END) as passed_quizzes
          FROM user_quiz_attempts uqa
          GROUP BY uqa.user_id, uqa.training_id
        ),
        training_quiz_counts AS (
          -- Eğitimlerdeki toplam sınav sayısı
          SELECT 
            training_id,
            COUNT(*) as total_quizzes
          FROM quizzes
          GROUP BY training_id
        )
        -- Sonuçları birleştir: Önce tüm kullanıcıları al, sonra aktif eğitimlerini ve ilerlemelerini ekle
        SELECT 
          au.user_id,
          au.email,
          au.first_name,
          au.last_name,
          au.department_id, -- Doğrudan departments tablosundan gelen ID
          au.department_name, -- Doğrudan departments tablosundan gelen isim
          au.position,
          -- Aktif eğitimler ve detayları
          aut.training_id,
          aut.training_title,
          aut.category,
          aut.is_mandatory,
          aut.deadline,
          -- İlerleme ve kayıt detayları (eğer varsa)
          COALESCE(upd.status, ed.enrollment_status, 'NOT_STARTED') as status,
          COALESCE(upd.progress_percentage, 0) as progress_percentage,
          upd.started_at,
          COALESCE(upd.completed_at, ed.enrollment_completed_at) as completed_at,
          upd.completion_duration_seconds,
          ed.enrollment_status,
          ed.start_date as enrolled_date,
          ed.last_accessed_at,
          COALESCE(tqc.total_quizzes, 0) as total_quizzes,
          COALESCE(qas.attempted_quizzes, 0) as attempted_quizzes,
          COALESCE(qas.passed_quizzes, 0) as passed_quizzes,
          CASE 
            WHEN COALESCE(upd.status, ed.enrollment_status) = 'COMPLETED' THEN 'Tamamlandı'
            WHEN COALESCE(upd.status, ed.enrollment_status) = 'QUIZZES_PENDING' AND COALESCE(qas.passed_quizzes, 0) >= COALESCE(tqc.total_quizzes, 0) AND COALESCE(tqc.total_quizzes, 0) > 0 THEN 'Tamamlandı'
            WHEN COALESCE(upd.status, ed.enrollment_status) = 'QUIZZES_PENDING' THEN 'İçerik Tamamlandı, Sınavlar Bekliyor'
            WHEN COALESCE(upd.status, ed.enrollment_status) = 'IN_PROGRESS' THEN 'Devam Ediyor'
            ELSE 'Başlanmadı'
          END as progress_status,
          CASE 
            WHEN COALESCE(tqc.total_quizzes, 0) > 0 THEN
              (COALESCE(upd.progress_percentage, 0) * 0.7 + (COALESCE(qas.passed_quizzes, 0)::float / GREATEST(COALESCE(tqc.total_quizzes, 1), 1)) * 100 * 0.3)
            ELSE
              COALESCE(upd.progress_percentage, 0)
          END as overall_progress
        FROM all_users au
        LEFT JOIN active_user_trainings aut ON au.user_id = aut.user_id
        LEFT JOIN user_progress_details upd ON aut.user_id = upd.user_id AND aut.training_id = upd.training_id
        LEFT JOIN enrollments_details ed ON aut.user_id = ed.user_id AND aut.training_id = ed.training_id
        LEFT JOIN quiz_attempts_summary qas ON aut.user_id = qas.user_id AND aut.training_id = qas.training_id
        LEFT JOIN training_quiz_counts tqc ON aut.training_id = tqc.training_id
      `;
      const result = await pool.query(query);
      console.log(`[StatisticsService] getUserTrainingProgressReport sorgu sonucu satır sayısı: ${result.rows?.length || 0}`);
      if (result.rows && result.rows.length > 0) {
        console.log('[StatisticsService] İlk satır örneği:', result.rows[0]);
      } else {
        console.error('[StatisticsService] Sorgu sonuç döndürmedi veya boş bir sonuç döndü!');
        console.log('[StatisticsService] Sorun tespiti için ana tabloları kontrol ediyorum...');
        const usersCheck = await pool.query('SELECT COUNT(*) as count FROM users WHERE role != \'ADMIN_SENIOR\' AND role != \'ADMIN_JUNIOR\'');
        console.log(`[StatisticsService] Normal kullanıcı sayısı: ${usersCheck.rows[0].count}`);
        const trainingsCheck = await pool.query('SELECT COUNT(*) as count FROM trainings');
        console.log(`[StatisticsService] Eğitim sayısı: ${trainingsCheck.rows[0].count}`);
        const progressCheck = await pool.query('SELECT COUNT(*) as count FROM user_training_progress');
        console.log(`[StatisticsService] İlerleme kaydı sayısı: ${progressCheck.rows[0].count}`);
        const departmentsCheck = await pool.query('SELECT COUNT(*) as count FROM departments');
        console.log(`[StatisticsService] Departman sayısı: ${departmentsCheck.rows[0].count}`);
        const employeesCheck = await pool.query('SELECT COUNT(*) as count FROM employees');
        console.log(`[StatisticsService] Çalışan sayısı: ${employeesCheck.rows[0].count}`);
        const sampleUser = await pool.query('SELECT id, email, "firstName", "lastName", role FROM users LIMIT 1');
        if (sampleUser.rows.length > 0) {
          console.log('[StatisticsService] Örnek kullanıcı:', sampleUser.rows[0]);
        }
      }
      if (result.rows.length === 0) {
        console.log('[StatisticsService] Hiç kullanıcı eğitim durumu bulunamadı, boş dizi döndürülüyor');
        return [];
      }
      const usersMap = new Map();
      result.rows.forEach(row => {
        if (!usersMap.has(row.user_id)) {
          usersMap.set(row.user_id, {
            userId: row.user_id,
            email: row.email,
            firstName: row.first_name,
            lastName: row.last_name,
            fullName: `${row.first_name} ${row.last_name}`,
            departmentId: row.department_id,
            departmentName: row.department_name || "Departman Atanmamış",
            position: row.position || "",
            totalTrainings: 0,
            completedTrainings: 0,
            inProgressTrainings: 0,
            notStartedTrainings: 0,
            lastActivityDate: null,
            trainings: []
          });
        }
        if (row.training_id) {
          const userRecord = usersMap.get(row.user_id);
          userRecord.totalTrainings++;
          const quizCompleted = row.status === 'QUIZZES_PENDING' && 
                              row.passed_quizzes >= row.total_quizzes && 
                              row.total_quizzes > 0;
          if (row.status === 'COMPLETED' || row.enrollment_status === 'COMPLETED' || quizCompleted) {
            userRecord.completedTrainings++;
          } else if (row.status === 'IN_PROGRESS' || row.enrollment_status === 'IN_PROGRESS' || 
                    (row.status === 'QUIZZES_PENDING' && !quizCompleted)) {
            userRecord.inProgressTrainings++;
          } else {
            userRecord.notStartedTrainings++;
          }
          const activityDates = [
            row.started_at,
            row.completed_at,
            row.last_accessed_at
          ].filter(Boolean);
          if (activityDates.length > 0) {
            const latestDate = new Date(Math.max(...activityDates.map(d => new Date(d).getTime())));
            if (!userRecord.lastActivityDate || new Date(userRecord.lastActivityDate) < latestDate) {
              userRecord.lastActivityDate = latestDate.toISOString();
            }
          }
          userRecord.trainings.push({
            trainingId: row.training_id,
            title: row.training_title,
            category: row.category,
            isMandatory: row.is_mandatory,
            deadline: row.deadline,
            status: row.status,
            progressPercentage: parseFloat(row.progress_percentage) || 0,
            startedAt: row.started_at,
            completedAt: row.completed_at,
            completionDurationSeconds: row.completion_duration_seconds,
            enrollmentStatus: row.enrollment_status,
            enrolledDate: row.enrolled_date,
            enrollmentCompletedAt: row.enrollment_completed_at,
            lastAccessedAt: row.last_accessed_at,
            totalQuizzes: row.total_quizzes,
            attemptedQuizzes: row.attempted_quizzes,
            passedQuizzes: row.passed_quizzes,
            progressStatus: row.progress_status,
            overallProgress: parseFloat(row.overall_progress ? row.overall_progress.toFixed(2) : "0") || 0
          });
        }
      });
      const usersList = Array.from(usersMap.values());
      console.log('[StatisticsService] usersMap içeriği (diziye çevrilmeden önce):', usersMap);
      console.log(`[StatisticsService] Kullanıcı eğitim devam raporu oluşturuldu: ${usersList.length} kullanıcı`);
      return usersList;
    } catch (error) {
      console.error('[StatisticsService] Kullanıcı eğitim devam durumları getirilirken hata:', error);
      return [];
    }
  },
  async getTrainingProgressByTrainingId(trainingId: string): Promise<any> {
    try {
      console.log(`[StatisticsService] Eğitim ID ${trainingId} için kullanıcı devam durumlarını getiriyorum`);
      const trainingQuery = `
        SELECT 
          id, title, description, category, is_mandatory, 
          deadline, duration, published, "createdAt" AS "trainings_createdAt" 
        FROM trainings 
        WHERE id = $1
      `;
      const trainingResult = await pool.query(trainingQuery, [trainingId]);
      if (trainingResult.rows.length === 0) {
        throw new Error('Belirtilen ID ile eğitim bulunamadı.');
      }
      const trainingInfo = trainingResult.rows[0];
      const progressQuery = `
        WITH active_assignments AS (
          -- Sadece aktif olarak atanmış kullanıcılar
          SELECT DISTINCT user_id
          FROM user_training_assignments
          WHERE training_id = $1
        ),
        user_progress AS (
          SELECT 
            u.id as user_id,
            u.email,
            u."firstName" as first_name,
            u."lastName" as last_name,
            e."departmentId" as department_id,
            e.position,
            d.name as department_name,
            utp.status,
            utp.progress_percentage,
            utp.started_at,
            utp.completed_at,
            utp.completion_duration_seconds,
            COALESCE(e2.status, 'NOT_ENROLLED') as enrollment_status,
            e2.start_date as enrolled_date,
            e2.last_accessed_at
          FROM users u
          INNER JOIN active_assignments aa ON u.id = aa.user_id -- Sadece aktif atanmış kullanıcılar
          LEFT JOIN employees e ON u.id = e."userId"
          LEFT JOIN departments d ON e."departmentId" = d.id
          LEFT JOIN user_training_progress utp ON u.id = utp.user_id AND utp.training_id = $1
          LEFT JOIN enrollments e2 ON u.id = e2.user_id AND e2.training_id = $1
          WHERE u.role NOT IN ('ADMIN_SENIOR', 'ADMIN_JUNIOR')
        ),
        quiz_summary AS (
          SELECT 
            uqa.user_id,
            COUNT(DISTINCT uqa.quiz_id) as attempted_quizzes,
            SUM(CASE WHEN uqa.passed = true THEN 1 ELSE 0 END) as passed_quizzes,
            MAX(score) as best_score
          FROM user_quiz_attempts uqa
          WHERE uqa.training_id = $1
          GROUP BY uqa.user_id
        )
        SELECT 
          up.user_id,
          up.email,
          up.first_name,
          up.last_name,
          COALESCE(up.status, 'NOT_STARTED') as status,
          COALESCE(up.progress_percentage, 0) as progress_percentage,
          up.started_at,
          up.completed_at,
          up.completion_duration_seconds,
          up.enrollment_status,
          up.enrolled_date,
          up.last_accessed_at,
          COALESCE(qs.attempted_quizzes, 0) as attempted_quizzes,
          COALESCE(qs.passed_quizzes, 0) as passed_quizzes,
          qs.best_score,
          -- Durumu özetleyen metin
          CASE 
            WHEN up.status = 'COMPLETED' OR up.enrollment_status = 'COMPLETED' THEN 'Tamamlandı'
            -- QUIZZES_PENDING durumundaki bir kullanıcı tüm sınavları geçtiyse "Tamamlandı" olarak işaretle
            WHEN up.status = 'QUIZZES_PENDING' AND COALESCE(qs.passed_quizzes, 0) >= (SELECT COUNT(*) FROM quizzes WHERE training_id = $1) AND (SELECT COUNT(*) FROM quizzes WHERE training_id = $1) > 0 THEN 'Tamamlandı'
            -- QUIZZES_PENDING ama sınavları tamamlanmamış
            WHEN up.status = 'QUIZZES_PENDING' THEN 'İçerik Tamamlandı, Sınavlar Bekliyor'
            WHEN up.status = 'IN_PROGRESS' OR up.enrollment_status = 'IN_PROGRESS' THEN 'Devam Ediyor'
            WHEN up.enrollment_status = 'NOT_ENROLLED' THEN 'Kaydolmadı'
            ELSE 'Başlanmadı'
          END as progress_status,
          -- Tamamlanma süresi (gün olarak)
          CASE 
            WHEN up.completion_duration_seconds IS NOT NULL THEN 
              (up.completion_duration_seconds / (60*60*24))::numeric(10,2)
            ELSE NULL
          END as completion_days
        FROM user_progress up
        LEFT JOIN quiz_summary qs ON up.user_id = qs.user_id
        ORDER BY up.last_name, up.first_name
      `;
      const progressResult = await pool.query(progressQuery, [trainingId]);
      const contentCountQuery = `
        SELECT 
          (SELECT COUNT(*) FROM quizzes WHERE training_id = $1) as quiz_count,
          (SELECT COUNT(*) FROM training_content WHERE training_id = $1) as content_count
      `;
      const contentCountResult = await pool.query(contentCountQuery, [trainingId]);
      const statsQuery = `
        SELECT 
          COUNT(DISTINCT u.id) as total_eligible_users,
          COUNT(DISTINCT CASE WHEN utp.status IS NOT NULL OR e.id IS NOT NULL THEN u.id ELSE NULL END) as engaged_users,
          COUNT(DISTINCT CASE WHEN utp.status = 'COMPLETED' OR e.status = 'COMPLETED' THEN u.id ELSE NULL END) as completed_users,
          AVG(CASE WHEN utp.status = 'COMPLETED' THEN utp.completion_duration_seconds ELSE NULL END) / 86400 as avg_completion_days
        FROM users u
        LEFT JOIN user_training_progress utp ON u.id = utp.user_id AND utp.training_id = $1
        LEFT JOIN enrollments e ON u.id = e.user_id AND e.training_id = $1
        WHERE u.role NOT IN ('ADMIN_SENIOR', 'ADMIN_JUNIOR')
      `;
      const statsResult = await pool.query(statsQuery, [trainingId]);
      const reportData = {
        id: trainingInfo.id,
        title: trainingInfo.title,
        description: trainingInfo.description,
        category: trainingInfo.category,
        isMandatory: trainingInfo.is_mandatory,
        deadline: trainingInfo.deadline,
        duration: trainingInfo.duration,
        published: trainingInfo.published,
        createdAt: trainingInfo.trainings_createdAt,
        meta: {
          quizCount: parseInt(contentCountResult.rows[0].quiz_count) || 0,
          contentCount: parseInt(contentCountResult.rows[0].content_count) || 0
        },
        statistics: {
          totalEligibleUsers: statsResult.rows[0].total_eligible_users,
          engagedUsers: statsResult.rows[0].engaged_users,
          completedUsers: statsResult.rows[0].completed_users,
          avgCompletionDays: statsResult.rows[0].avg_completion_days ? 
                            parseFloat(statsResult.rows[0].avg_completion_days).toFixed(1) : null,
          completionRate: statsResult.rows[0].total_eligible_users > 0 ? 
                        (statsResult.rows[0].completed_users / statsResult.rows[0].total_eligible_users * 100).toFixed(1) : "0"
        },
        users: progressResult.rows.map(row => ({
          userId: row.user_id,
          email: row.email,
          firstName: row.first_name,
          lastName: row.last_name,
          departmentId: row.department_id,
          departmentName: row.department_name || "Departman Atanmamış",
          position: row.position || "",
          status: row.status,
          progress: parseFloat(row.progress_percentage) || 0,
          startedAt: row.started_at,
          completedAt: row.completed_at,
          completionDays: row.completion_days,
          enrollmentStatus: row.enrollment_status,
          enrolledDate: row.enrolled_date,
          lastAccessedAt: row.last_accessed_at,
          attemptedQuizzes: row.attempted_quizzes,
          passedQuizzes: row.passed_quizzes,
          bestScore: row.best_score ? parseFloat(row.best_score) : null,
          progressStatus: row.progress_status
        }))
      };
      console.log(`[StatisticsService] Eğitim ${trainingId} için devam raporu oluşturuldu: ${reportData.users.length} kullanıcı`);
      return reportData;
    } catch (error) {
      console.error(`[StatisticsService] Eğitim ID ${trainingId} için kullanıcı devam durumları getirilirken hata:`, error);
      return {
        id: trainingId,
        title: "Bulunamadı", 
        users: []
      };
    }
  },
  async getAllTrainingsProgress(): Promise<any> {
    try {
      console.log('[statisticsService] Tüm eğitimlerin ilerleme durumları alınıyor');
      const query = `
        WITH training_details AS (
          SELECT
            t.id AS training_id,
            t.title AS training_title,
            t.category AS training_category,
            t."createdAt" AS training_created_at,
            t.is_mandatory AS training_is_mandatory
          FROM trainings t
        ),
        enrolled_users_count AS (
          -- Her bir eğitime user_training_assignments üzerinden aktif olarak atanmış kullanıcı sayısı
          SELECT
            training_id,
            COUNT(DISTINCT user_id) AS enrolled_user_count
          FROM user_training_assignments
          GROUP BY training_id
        ),
        completed_users_count AS (
          -- Her bir eğitimi tamamlamış kullanıcı sayısı (user_training_progress tablosundan)
          SELECT
            training_id,
            COUNT(DISTINCT user_id) AS completed_user_count
          FROM user_training_progress
          WHERE status = 'COMPLETED'
          GROUP BY training_id
        )
        SELECT
          td.training_id AS id,
          td.training_title AS title,
          td.training_category AS category,
          td.training_created_at AS "createdAt",
          td.training_is_mandatory AS "isMandatory",
          COALESCE(euc.enrolled_user_count, 0) AS "enrolledUserCount",
          COALESCE(cuc.completed_user_count, 0) AS "completedUserCount"
        FROM training_details td
        LEFT JOIN enrolled_users_count euc ON td.training_id = euc.training_id
        LEFT JOIN completed_users_count cuc ON td.training_id = cuc.training_id
        ORDER BY td.training_created_at DESC;
      `;
      const result = await pool.query(query);
      console.log('[statisticsService] Tüm eğitimlerin ilerleme durumları başarıyla alındı:', result.rows.length);
      return result.rows;
    } catch (error) {
      console.error('[statisticsService] Tüm eğitimlerin ilerleme durumları alınırken hata:', error);
      throw new Error('Tüm eğitimlerin ilerleme durumları alınamadı');
    }
  },
  async getUserConferenceTrainings(userId: number): Promise<any> {
    try {
      console.log(`[StatisticsService] Kullanıcı ID:${userId} için konferans eğitimleri getiriliyor`);
      const query = `
        SELECT 
          ct.id,
          ct.title,
          ct.description,
          ct.category,
          ct.location,
          ct.start_date as "startDate",
          ct.end_date as "endDate",
          ca.registered_at as "registeredAt",
          ca.attended,
          ca.attendance_time as "attendanceTime"
        FROM conference_attendees ca
        JOIN conference_trainings ct ON ca.conference_id = ct.id
        WHERE ca.user_id = $1
        ORDER BY ct.start_date DESC
      `;
      const result = await pool.query(query, [userId]);
      console.log(`[StatisticsService] Kullanıcı ID:${userId} için ${result.rows.length} konferans eğitimi bulundu`);
      return result.rows;
    } catch (error) {
      console.error(`[StatisticsService] Kullanıcı konferans eğitimleri alınırken hata:`, error);
      throw new Error('Kullanıcı konferans eğitimleri alınırken bir veritabanı hatası oluştu.');
    }
  }
};
interface AverageCompletionTime {
  average_days: number | null;
  total_completed_trainings: number;
}
export const getAverageTrainingCompletionTime = async (): Promise<AverageCompletionTime> => {
  const client = await pool.connect();
  try {
    console.log('[statisticsService] Ortalama eğitim tamamlama süresi hesaplanıyor.');
    const result = await client.query(`
      SELECT 
        AVG(completion_duration_seconds) as average_seconds,
        COUNT(*) as total_completed
      FROM user_training_progress
      WHERE status = 'COMPLETED' AND completion_duration_seconds IS NOT NULL AND completion_duration_seconds >= 0;
    `);
    if (result.rows.length === 0 || result.rows[0].total_completed === '0' || result.rows[0].average_seconds === null) {
      console.log('[statisticsService] Ortalama hesaplamak için yeterli veri bulunamadı.');
      return {
        average_days: null,
        total_completed_trainings: 0
      };
    }
    const averageSeconds = parseFloat(result.rows[0].average_seconds);
    const totalCompletedTrainings = parseInt(result.rows[0].total_completed, 10);
    const averageDays = averageSeconds / (24 * 60 * 60);
    console.log(`[statisticsService] Ortalama tamamlama süresi: ${averageDays.toFixed(1)} gün, Toplam tamamlanmış eğitim: ${totalCompletedTrainings}`);
    return {
      average_days: parseFloat(averageDays.toFixed(1)),
      total_completed_trainings: totalCompletedTrainings
    };
  } catch (error) {
    console.error('[statisticsService] Ortalama tamamlama süresi hesaplanırken hata:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}; 