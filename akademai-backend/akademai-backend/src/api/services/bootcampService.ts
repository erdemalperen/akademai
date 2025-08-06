import { pool } from '../../db';
import { Bootcamp, UserBootcampAssignment, BootcampParticipant, AssignedBootcamp, Training, UserTrainingProgress, TrainingProgress, BootcampTraining, BootcampProgress } from '../../types/bootcamp';
import { User } from '../../types/index';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, DatabaseError, ConflictError } from '../../utils/errors';
import { logService } from './logService';
export const bootcampService = {
  async getAllBootcamps(filters?: { category?: string }): Promise<Bootcamp[]> {
    const client = await pool.connect();
    try {
      let query = `
        SELECT 
          id,
          title,
          description,
          category,
          author,
          published,
          duration,
          deadline,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM bootcamps 
      `;
      const queryParams: any[] = [];
      let whereClause = '';
      if (filters?.category) {
        queryParams.push(filters.category);
        whereClause += `WHERE category = $${queryParams.length}`;
      }
      query += whereClause + ' ORDER BY created_at DESC';
      console.log('Executing query:', query, queryParams);
      const result = await client.query(query, queryParams);
      return result.rows || [];
    } catch (error) {
      console.error("Bootcamp'ler getirilirken hata oluştu:", error);
      throw new DatabaseError("Bootcamp'ler getirilemedi."); // Özel hata sınıfı kullan
    } finally {
      client.release();
    }
  },
  async getBootcampById(bootcampId: string, userId: number): Promise<Bootcamp | null> { 
    const client = await pool.connect(); 
    try {
      const bootcampQuery = `
        SELECT 
          b.id, b.title, b.description, b.category, b.author, b.published, 
          b.duration, b.deadline, b.created_at as "createdAt", b.updated_at as "updatedAt"
        FROM bootcamps b
        WHERE b.id = $1
      `;
      const bootcampResult = await client.query(bootcampQuery, [bootcampId]);
      if (bootcampResult.rows.length === 0) {
        client.release();
        return null;
      }
      const bootcamp = bootcampResult.rows[0];
      const trainingsQuery = `
        SELECT 
          bt.id as "bootcampTrainingId", bt.training_id as "trainingId", bt.order_index as "orderIndex", bt.required,
          t.title as "trainingTitle", t.description as "trainingDescription", t.category as "trainingCategory", t.duration as "trainingDuration",
          e.status as "userStatus", 
          COALESCE(e.progress, 
            CASE 
              WHEN e.status = 'COMPLETED' THEN 100
              WHEN e.status = 'IN_PROGRESS' THEN 50
              ELSE 0
            END
          ) as "userProgressPercentage",
          e.completed_at as "userCompletedAt"
        FROM bootcamp_trainings bt
        JOIN trainings t ON bt.training_id = t.id
        LEFT JOIN enrollments e ON bt.training_id = e.training_id AND e.user_id = $2 
        WHERE bt.bootcamp_id = $1
        ORDER BY bt.order_index ASC
      `;
      const trainingsResult = await client.query(trainingsQuery, [bootcampId, userId]); 
      const trainings = trainingsResult.rows.map((row: any) => ({
        id: row.bootcampTrainingId, 
        bootcampId: bootcampId, 
        trainingId: row.trainingId,
        orderIndex: row.orderIndex,
        required: row.required,
        training: { 
          id: row.trainingId,
          title: row.trainingTitle,
          description: row.trainingDescription,
          category: row.trainingCategory,
          duration: row.trainingDuration
        },
        userProgress: { 
          status: row.userStatus, 
          progressPercentage: row.userProgressPercentage, 
          completedAt: row.userCompletedAt
        } 
      }));
      return {
        ...bootcamp,
        trainings 
      };
    } catch (error) {
      console.error(`Bootcamp (ID: ${bootcampId}) ve kullanıcı (ID: ${userId}) ilerlemesi getirilirken hata oluştu:`, error);
      throw new DatabaseError('Bootcamp detayları getirilirken bir veritabanı hatası oluştu.'); 
    } finally {
       if (client) client.release(); 
    }
  },
  async getBootcampWithTrainingsById(bootcampId: string): Promise<Bootcamp | null> {
    try {
      const bootcampQuery = `
        SELECT * FROM bootcamps 
        WHERE id = $1
      `;
      const bootcampResult = await pool.query(bootcampQuery, [bootcampId]);
      if (bootcampResult.rows.length === 0) {
        return null;
      }
      const bootcamp = bootcampResult.rows[0];
      const trainingsQuery = `
        SELECT bt.*, t.title as training_title, t.description as training_description, 
               t.category as training_category, t.duration as training_duration
        FROM bootcamp_trainings bt
        JOIN trainings t ON bt.training_id = t.id
        WHERE bt.bootcamp_id = $1
        ORDER BY bt.order_index ASC
      `;
      const trainingsResult = await pool.query(trainingsQuery, [bootcampId]);
      const trainings = trainingsResult.rows.map((row: any) => ({
        id: row.id,
        bootcampId: row.bootcamp_id,
        trainingId: row.training_id,
        orderIndex: row.order_index,
        required: row.required,
        createdAt: row.created_at,
        training: {
          id: row.training_id,
          title: row.training_title,
          description: row.training_description,
          category: row.training_category,
          duration: row.training_duration
        }
      }));
      return {
        ...bootcamp,
        trainings
      };
    } catch (error) {
      console.error(`Bootcamp (ID: ${bootcampId}) getirilirken hata oluştu:`, error);
      throw error;
    }
  },
  async createBootcamp(bootcampData: Omit<Bootcamp, 'id' | 'createdAt' | 'updatedAt'>, userId: number): Promise<Bootcamp> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const query = `
        INSERT INTO bootcamps (title, description, category, author, published, duration, deadline)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const values = [
        bootcampData.title,
        bootcampData.description || null,
        bootcampData.category || null,
        bootcampData.author || null,
        bootcampData.published || false,
        bootcampData.duration || null,
        bootcampData.deadline || null
      ];
      const result = await client.query(query, values);
      const newBootcamp = result.rows[0];
      await logService.createLog({
        action: 'CREATE_BOOTCAMP',
        description: `"${newBootcamp.title}" başlıklı yeni bootcamp oluşturuldu.`,
        userId
      });
      await client.query('COMMIT');
      return newBootcamp;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Bootcamp oluşturulurken hata:', error);
      throw error;
    } finally {
      client.release();
    }
  },
  async updateBootcamp(bootcampId: string, bootcampData: Partial<Bootcamp>, userId: number): Promise<Bootcamp> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const checkQuery = 'SELECT * FROM bootcamps WHERE id = $1';
      const checkResult = await client.query(checkQuery, [bootcampId]);
      if (checkResult.rows.length === 0) {
        throw new Error('Güncellenecek bootcamp bulunamadı');
      }
      const existingBootcamp = checkResult.rows[0];
      const updates = [];
      const values = [];
      let paramIndex = 1;
      if (bootcampData.title !== undefined) {
        updates.push(`title = $${paramIndex}`);
        values.push(bootcampData.title);
        paramIndex++;
      }
      if (bootcampData.description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        values.push(bootcampData.description);
        paramIndex++;
      }
      if (bootcampData.category !== undefined) {
        updates.push(`category = $${paramIndex}`);
        values.push(bootcampData.category);
        paramIndex++;
      }
      if (bootcampData.author !== undefined) {
        updates.push(`author = $${paramIndex}`);
        values.push(bootcampData.author);
        paramIndex++;
      }
      if (bootcampData.published !== undefined) {
        updates.push(`published = $${paramIndex}`);
        values.push(bootcampData.published);
        paramIndex++;
      }
      if (bootcampData.duration !== undefined) {
        updates.push(`duration = $${paramIndex}`);
        values.push(bootcampData.duration);
        paramIndex++;
      }
      if (bootcampData.deadline !== undefined) {
        updates.push(`deadline = $${paramIndex}`);
        values.push(bootcampData.deadline);
        paramIndex++;
      }
      if (updates.length === 0) {
        return existingBootcamp;
      }
      const updateQuery = `
        UPDATE bootcamps
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      values.push(bootcampId);
      const updateResult = await client.query(updateQuery, values);
      const updatedBootcamp = updateResult.rows[0];
      await logService.createLog({
        action: 'UPDATE_BOOTCAMP',
        description: `"${updatedBootcamp.title}" başlıklı bootcamp güncellendi.`,
        userId
      });
      await client.query('COMMIT');
      return updatedBootcamp;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Bootcamp (ID: ${bootcampId}) güncellenirken hata:`, error);
      throw error;
    } finally {
      client.release();
    }
  },
  async deleteBootcamp(bootcampId: string, userId: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const checkQuery = 'SELECT title FROM bootcamps WHERE id = $1';
      const checkResult = await client.query(checkQuery, [bootcampId]);
      if (checkResult.rows.length === 0) {
        throw new Error('Silinecek bootcamp bulunamadı');
      }
      const bootcampTitle = checkResult.rows[0].title;
      const deleteQuery = 'DELETE FROM bootcamps WHERE id = $1';
      await client.query(deleteQuery, [bootcampId]);
      await logService.createLog({
        action: 'DELETE_BOOTCAMP',
        description: `"${bootcampTitle}" başlıklı bootcamp silindi.`,
        userId
      });
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Bootcamp (ID: ${bootcampId}) silinirken hata:`, error);
      throw error;
    } finally {
      client.release();
    }
  },
  async addTrainingToBootcamp(bootcampId: string, trainingId: string, orderIndex: number, required: boolean = true): Promise<BootcampTraining> {
    try {
      const query = `
        INSERT INTO bootcamp_trainings (bootcamp_id, training_id, order_index, required)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const values = [bootcampId, trainingId, orderIndex, required];
      const result = await pool.query(query, values);
      return {
        id: result.rows[0].id,
        bootcampId: result.rows[0].bootcamp_id,
        trainingId: result.rows[0].training_id,
        orderIndex: result.rows[0].order_index,
        required: result.rows[0].required,
        createdAt: result.rows[0].created_at
      };
    } catch (error) {
      console.error('Bootcamp\'e eğitim eklenirken hata:', error);
      throw error;
    }
  },
  async removeTrainingFromBootcamp(bootcampId: string, trainingId: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const getOrderQuery = `
        SELECT order_index FROM bootcamp_trainings 
        WHERE bootcamp_id = $1 AND training_id = $2
      `;
      const orderResult = await client.query(getOrderQuery, [bootcampId, trainingId]);
      if (orderResult.rows.length === 0) {
        throw new Error('Bootcamp\'te belirtilen eğitim bulunamadı');
      }
      const removedOrderIndex = orderResult.rows[0].order_index;
      const deleteQuery = `
        DELETE FROM bootcamp_trainings 
        WHERE bootcamp_id = $1 AND training_id = $2
      `;
      await client.query(deleteQuery, [bootcampId, trainingId]);
      const updateOrderQuery = `
        UPDATE bootcamp_trainings 
        SET order_index = order_index - 1 
        WHERE bootcamp_id = $1 AND order_index > $2
      `;
      await client.query(updateOrderQuery, [bootcampId, removedOrderIndex]);
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Bootcamp\'ten eğitim çıkarılırken hata:', error);
      throw error;
    } finally {
      client.release();
    }
  },
  async updateTrainingOrder(bootcampId: string, trainingId: string, newOrderIndex: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const getCurrentOrderQuery = `
        SELECT order_index FROM bootcamp_trainings 
        WHERE bootcamp_id = $1 AND training_id = $2
      `;
      const currentOrderResult = await client.query(getCurrentOrderQuery, [bootcampId, trainingId]);
      if (currentOrderResult.rows.length === 0) {
        throw new Error('Bootcamp\'te belirtilen eğitim bulunamadı');
      }
      const currentOrderIndex = currentOrderResult.rows[0].order_index;
      if (currentOrderIndex === newOrderIndex) {
        return true;
      }
      const tempUpdateQuery = `
        UPDATE bootcamp_trainings 
        SET order_index = -1 
        WHERE bootcamp_id = $1 AND training_id = $2
      `;
      await client.query(tempUpdateQuery, [bootcampId, trainingId]);
      if (currentOrderIndex < newOrderIndex) {
        const moveDownQuery = `
          UPDATE bootcamp_trainings 
          SET order_index = order_index - 1 
          WHERE bootcamp_id = $1 AND order_index > $2 AND order_index <= $3
        `;
        await client.query(moveDownQuery, [bootcampId, currentOrderIndex, newOrderIndex]);
      } else {
        const moveUpQuery = `
          UPDATE bootcamp_trainings 
          SET order_index = order_index + 1 
          WHERE bootcamp_id = $1 AND order_index >= $2 AND order_index < $3
        `;
        await client.query(moveUpQuery, [bootcampId, newOrderIndex, currentOrderIndex]);
      }
      const finalUpdateQuery = `
        UPDATE bootcamp_trainings 
        SET order_index = $3 
        WHERE bootcamp_id = $1 AND training_id = $2
      `;
      await client.query(finalUpdateQuery, [bootcampId, trainingId, newOrderIndex]);
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Eğitim sırası güncellenirken hata:', error);
      throw error;
    } finally {
      client.release();
    }
  },
  async assignBootcampToUser(bootcampId: string, userId: number, adminId: number): Promise<UserBootcampAssignment> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const checkBootcampQuery = 'SELECT title FROM bootcamps WHERE id = $1';
      const bootcampResult = await client.query(checkBootcampQuery, [bootcampId]);
      if (bootcampResult.rows.length === 0) {
        throw new Error('Atanacak bootcamp bulunamadı');
      }
      const bootcampTitle = bootcampResult.rows[0].title;
      const checkUserQuery = 'SELECT first_name, last_name FROM users WHERE id = $1';
      const userResult = await client.query(checkUserQuery, [userId]);
      if (userResult.rows.length === 0) {
        throw new Error('Atama yapılacak kullanıcı bulunamadı');
      }
      const userName = `${userResult.rows[0].first_name} ${userResult.rows[0].last_name}`;
      const assignQuery = `
        INSERT INTO user_bootcamp_assignments (user_id, bootcamp_id)
        VALUES ($1, $2)
        RETURNING *
      `;
      const assignResult = await client.query(assignQuery, [userId, bootcampId]);
      const progressQuery = `
        INSERT INTO bootcamp_progress (user_id, bootcamp_id)
        VALUES ($1, $2)
        RETURNING *
      `;
      await client.query(progressQuery, [userId, bootcampId]);
      await logService.createLog({
        action: 'ASSIGN_BOOTCAMP',
        description: `"${bootcampTitle}" bootcamp'i "${userName}" kullanıcısına atandı.`,
        userId: adminId
      });
      await client.query('COMMIT');
      return {
        id: assignResult.rows[0].id,
        userId: assignResult.rows[0].user_id,
        bootcampId: assignResult.rows[0].bootcamp_id,
        assignedAt: assignResult.rows[0].assigned_at,
        completed: assignResult.rows[0].completed,
        completionDate: assignResult.rows[0].completion_date
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Bootcamp kullanıcıya atanırken hata:', error);
      throw error;
    } finally {
      client.release();
    }
  },
  async unassignBootcampFromUser(bootcampId: string, userId: number, adminId: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const getInfoQuery = `
        SELECT b.title, u.first_name, u.last_name 
        FROM bootcamps b, users u 
        WHERE b.id = $1 AND u.id = $2
      `;
      const infoResult = await client.query(getInfoQuery, [bootcampId, userId]);
      if (infoResult.rows.length === 0) {
        throw new Error('Bootcamp veya kullanıcı bulunamadı');
      }
      const bootcampTitle = infoResult.rows[0].title;
      const userName = `${infoResult.rows[0].first_name} ${infoResult.rows[0].last_name}`;
      const trainingsQuery = `
        SELECT training_id FROM bootcamp_trainings WHERE bootcamp_id = $1
      `;
      const trainingsResult = await client.query(trainingsQuery, [bootcampId]);
      const trainingIds = trainingsResult.rows.map(row => row.training_id);
      if (trainingIds.length > 0) {
        const removeTrainingAssignmentsQuery = `
          DELETE FROM user_training_assignments 
          WHERE user_id = $1 AND training_id = ANY($2::uuid[])
        `;
        await client.query(removeTrainingAssignmentsQuery, [userId, trainingIds]);
        const removeTrainingProgressQuery = `
          DELETE FROM user_training_progress 
          WHERE user_id = $1 AND bootcamp_id = $2
        `;
        await client.query(removeTrainingProgressQuery, [userId, bootcampId]);
      }
      const unassignQuery = `
        DELETE FROM user_bootcamp_assignments 
        WHERE user_id = $1 AND bootcamp_id = $2
      `;
      await client.query(unassignQuery, [userId, bootcampId]);
      const deleteProgressQuery = `
        DELETE FROM bootcamp_progress 
        WHERE user_id = $1 AND bootcamp_id = $2
      `;
      await client.query(deleteProgressQuery, [userId, bootcampId]);
      await logService.createLog({
        action: 'UNASSIGN_BOOTCAMP',
        description: `"${bootcampTitle}" bootcamp'i "${userName}" kullanıcısından kaldırıldı.`,
        userId: adminId
      });
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Bootcamp kullanıcıdan kaldırılırken hata:', error);
      throw error;
    } finally {
      client.release();
    }
  },
  async getAssignedBootcampsForUser(userId: number): Promise<Bootcamp[]> {
    try {
      const assignedQuery = `
        SELECT b.* 
        FROM bootcamps b
        JOIN user_bootcamp_assignments uba ON b.id = uba.bootcamp_id
        WHERE uba.user_id = $1
        ORDER BY b.created_at DESC
      `;
      const assignedResult = await pool.query(assignedQuery, [userId]);
      if (assignedResult.rows.length === 0) {
        return [];
      }
      const bootcamps: Bootcamp[] = [];
      for (const bootcamp of assignedResult.rows) {
        const trainingsQuery = `
          SELECT bt.*, t.title as training_title, t.description as training_description, 
                 t.category as training_category, t.duration as training_duration
          FROM bootcamp_trainings bt
          JOIN trainings t ON bt.training_id = t.id
          WHERE bt.bootcamp_id = $1
          ORDER BY bt.order_index ASC
        `;
        const trainingsResult = await pool.query(trainingsQuery, [bootcamp.id]);
        const trainings = trainingsResult.rows.map((row: any) => ({
          id: row.id,
          bootcampId: row.bootcamp_id,
          trainingId: row.training_id,
          orderIndex: row.order_index,
          required: row.required,
          createdAt: row.created_at,
          training: {
            id: row.training_id,
            title: row.training_title,
            description: row.training_description,
            category: row.training_category,
            duration: row.training_duration
          }
        }));
        bootcamps.push({
          ...bootcamp,
          trainings
        });
      }
      return bootcamps;
    } catch (error) {
      console.error(`Kullanıcıya (ID: ${userId}) atanmış bootcamp'ler getirilirken hata:`, error);
      throw error;
    }
  },
  async getAssignedUsersForBootcamp(bootcampId: string): Promise<UserBootcampAssignment[]> {
    try {
      const query = `
        SELECT uba.*, u.first_name, u.last_name, u.email, u.role
        FROM user_bootcamp_assignments uba
        JOIN users u ON uba.user_id = u.id
        WHERE uba.bootcamp_id = $1
        ORDER BY uba.assigned_at DESC
      `;
      const result = await pool.query(query, [bootcampId]);
      return result.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        bootcampId: row.bootcamp_id,
        assignedAt: row.assigned_at,
        completed: row.completed,
        completionDate: row.completion_date,
        user: {
          id: row.user_id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          role: row.role,
          loginType: row.login_type || 'USERNAME_PASSWORD', 
          createdAt: row.user_created_at || new Date(), 
          updatedAt: row.user_updated_at || new Date() 
        }
      }));
    } catch (error) {
      console.error(`Bootcamp'e (ID: ${bootcampId}) atanmış kullanıcılar getirilirken hata:`, error);
      throw error;
    }
  },
  async updateBootcampProgress(userId: number, bootcampId: string, currentTrainingIndex: number, progressPercentage: number): Promise<BootcampProgress> {
    try {
      const query = `
        UPDATE bootcamp_progress
        SET current_training_index = $3, 
            progress_percentage = $4,
            last_activity = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND bootcamp_id = $2
        RETURNING *
      `;
      const result = await pool.query(query, [userId, bootcampId, currentTrainingIndex, progressPercentage]);
      if (result.rows.length === 0) {
        throw new Error('İlerleme kaydı bulunamadı');
      }
      return {
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        bootcampId: result.rows[0].bootcamp_id,
        currentTrainingIndex: result.rows[0].current_training_index,
        progressPercentage: result.rows[0].progress_percentage,
        lastActivity: result.rows[0].last_activity
      };
    } catch (error) {
      console.error('Bootcamp ilerleme durumu güncellenirken hata:', error);
      throw error;
    }
  },
  async completeBootcamp(userId: number, bootcampId: string): Promise<UserBootcampAssignment> {
    try {
      const query = `
        UPDATE user_bootcamp_assignments
        SET completed = true, 
            completion_date = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND bootcamp_id = $2
        RETURNING *
      `;
      const result = await pool.query(query, [userId, bootcampId]);
      if (result.rows.length === 0) {
        throw new Error('Bootcamp ataması bulunamadı');
      }
      await this.updateBootcampProgress(userId, bootcampId, -1, 100);
      await logService.createLog({
        action: 'COMPLETE_BOOTCAMP',
        description: `Bootcamp başarıyla tamamlandı.`,
        userId
      });
      return {
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        bootcampId: result.rows[0].bootcamp_id,
        assignedAt: result.rows[0].assigned_at,
        completed: result.rows[0].completed,
        completionDate: result.rows[0].completion_date
      };
    } catch (error) {
      console.error('Bootcamp tamamlama durumu güncellenirken hata:', error);
      throw error;
    }
  },
  async checkAssignment(userId: number, bootcampId: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT id FROM user_bootcamp_assignments WHERE user_id = $1 AND bootcamp_id = $2',
      [userId, bootcampId]
    );
    return result.rows.length > 0;
  },
  async assignUserToBootcamp(userId: number, bootcampId: string): Promise<UserBootcampAssignment> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const checkResult = await client.query(
        'SELECT * FROM user_bootcamp_assignments WHERE user_id = $1 AND bootcamp_id = $2',
        [userId, bootcampId]
      );
      if (checkResult.rows.length > 0) {
        throw new ConflictError('User is already assigned to this bootcamp.');
      }
      const assignmentId = uuidv4();
      const assignmentResult = await client.query(
        'INSERT INTO user_bootcamp_assignments (id, user_id, bootcamp_id, assigned_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT (user_id, bootcamp_id) DO NOTHING RETURNING *',
        [assignmentId, userId, bootcampId]
      );
      const newAssignment = assignmentResult.rows[0];
      const trainingsResult = await client.query<{ training_id: string }>(
        'SELECT training_id FROM bootcamp_trainings WHERE bootcamp_id = $1',
        [bootcampId]
      );
      const trainingIds = trainingsResult.rows.map((row: { training_id: string }) => row.training_id);
      if (trainingIds.length > 0) {
        for (const trainingId of trainingIds) {
          await client.query(
            'INSERT INTO user_training_assignments (user_id, training_id, assigned_at) VALUES ($1, $2, NOW()) ON CONFLICT (user_id, training_id) DO NOTHING',
            [userId, trainingId]
          );
        }
        const progressInsertQuery = `
          INSERT INTO user_training_progress (user_id, bootcamp_id, training_id, status, progress_percentage, completed_content_items)
          VALUES ${trainingIds.map((_: string, i: number) => `($1, $2, $${i + 3}, 'not_started', 0, '{}')`).join(', ')}
          ON CONFLICT (user_id, training_id) DO NOTHING;
        `;
        const progressInsertValues = [userId, bootcampId, ...trainingIds];
        await client.query(progressInsertQuery, progressInsertValues);
      }
      await client.query('COMMIT');
      return {
        id: newAssignment.id,
        userId: newAssignment.user_id,
        bootcampId: newAssignment.bootcamp_id,
        assignedAt: newAssignment.assigned_at,
        completed: newAssignment.completed,
        completionDate: newAssignment.completion_date,
        progress: newAssignment.progress
      };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof ConflictError) {
        throw error;
      }
      console.error('Error assigning user to bootcamp:', error);
      throw new DatabaseError('Failed to assign user to bootcamp.');
    } finally {
      client.release();
    }
  },
  async getAssignedBootcamps(userId: number): Promise<AssignedBootcamp[]> {
    const result = await pool.query(
      `SELECT
         b.*,
         uba.assigned_at AS "assignedAt", uba.completed, uba.completion_date AS "completionDate"
       FROM bootcamps b
       JOIN user_bootcamp_assignments uba ON b.id = uba.bootcamp_id
       WHERE uba.user_id = $1
       ORDER BY b.start_date DESC`,
      [userId]
    );
    return result.rows;
  },
  async getTrainingProgressForUser(userId: number, bootcampId: string): Promise<TrainingProgress[]> {
    try {
      const result = await pool.query(`
        SELECT
          t.id,
          t.title,
          t.description,
          t.content_type AS "contentType",
          t.content_url AS "contentUrl",
          t.estimated_duration AS "estimatedDuration",
          bt.order_index AS "order",
          utp.status,
          utp.started_at AS "startedAt",
          utp.completed_at AS "completedAt"
        FROM trainings t
        JOIN bootcamp_trainings bt ON t.id = bt.training_id
        LEFT JOIN user_training_progress utp ON t.id = utp.training_id AND utp.user_id = $1 AND utp.bootcamp_id = $2
        WHERE bt.bootcamp_id = $2
        ORDER BY bt.order_index;
      `, [userId, bootcampId]);
      return result.rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        contentType: row.contentType,
        contentUrl: row.contentUrl,
        estimatedDuration: row.estimatedDuration,
        order: row.order,
        status: row.status || 'not_started', 
        started_at: row.startedAt,
        completed_at: row.completedAt
      }));
    } catch (error) {
      console.error('Error fetching training progress for user:', error);
      throw new DatabaseError('Failed to fetch training progress.');
    }
  },
  async removeUserFromBootcamp(userId: number, bootcampId: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const trainingsResult = await client.query<{ training_id: string }>(
        'SELECT training_id FROM bootcamp_trainings WHERE bootcamp_id = $1',
        [bootcampId]
      );
      const trainingIds = trainingsResult.rows.map((row: { training_id: string }) => row.training_id);
      if (trainingIds.length > 0) {
        const removeTrainingAssignmentsQuery = `
          DELETE FROM user_training_assignments 
          WHERE user_id = $1 AND training_id = ANY($2::uuid[])
        `;
        await client.query(removeTrainingAssignmentsQuery, [userId, trainingIds]);
        const removeTrainingProgressQuery = `
          DELETE FROM user_training_progress 
          WHERE user_id = $1 AND training_id = ANY($2::uuid[]) AND bootcamp_id = $3
        `;
        await client.query(removeTrainingProgressQuery, [userId, trainingIds, bootcampId]);
      }
      const result = await client.query(
        'DELETE FROM user_bootcamp_assignments WHERE user_id = $1 AND bootcamp_id = $2 RETURNING *',
        [userId, bootcampId]
      );
      await client.query('COMMIT');
      return !!result.rowCount;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error removing user from bootcamp:', error);
      throw new DatabaseError('Failed to remove user from bootcamp.');
    } finally {
      client.release();
    }
  },
  async getBootcampParticipants(bootcampId: string): Promise<BootcampParticipant[]> {
    try {
      const result = await pool.query(
        `SELECT
           u.id, u.email, u."firstName", u."lastName", u.role,
           uba.assigned_at AS "assignedAt", uba.completed, uba.completion_date AS "completionDate",
           COALESCE(
             (SELECT (COUNT(utp.status) FILTER (WHERE utp.status = 'completed')::float / 
                     NULLIF(COUNT(utp.status), 0)) * 100
              FROM user_training_progress utp 
              WHERE utp.user_id = u.id AND utp.bootcamp_id = $1), 
             0
           ) AS progress
         FROM users u
         JOIN user_bootcamp_assignments uba ON u.id = uba.user_id
         WHERE uba.bootcamp_id = $1
         ORDER BY uba.assigned_at DESC`,
        [bootcampId]
      );
      return result.rows.map((row: any) => ({
        id: row.id,
        email: row.email,
        firstName: row.firstName,
        lastName: row.lastName,
        departmentName: row.departmentName || 'Belirtilmemiş',
        progress: parseFloat(row.progress) || 0,
        assignedAt: row.assignedAt,
        completed: row.completed || false,
        completionDate: row.completionDate
      }));
    } catch (error) {
      console.error('Error fetching bootcamp participants:', error);
      throw new DatabaseError('Failed to fetch bootcamp participants.');
    }
  },
  async getBootcampTrainings(bootcampId: string): Promise<string[]> {
    try {
      const query = `
        SELECT training_id 
        FROM bootcamp_trainings
        WHERE bootcamp_id = $1
        ORDER BY order_index ASC
      `;
      const result = await pool.query(query, [bootcampId]);
      return result.rows.map(row => row.training_id);
    } catch (error) {
      console.error(`Bootcamp eğitimleri getirilirken hata (ID: ${bootcampId}):`, error);
      throw error;
    }
  },
  async updateBootcampTrainings(bootcampId: string, trainingIds: string[]): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const deleteQuery = `
        DELETE FROM bootcamp_trainings
        WHERE bootcamp_id = $1
      `;
      await client.query(deleteQuery, [bootcampId]);
      if (trainingIds.length > 0) {
        const insertValues = trainingIds.map((trainingId, index) => {
          return `('${bootcampId}', '${trainingId}', ${index}, true)`;
        }).join(', ');
        const insertQuery = `
          INSERT INTO bootcamp_trainings (bootcamp_id, training_id, order_index, required)
          VALUES ${insertValues}
        `;
        await client.query(insertQuery);
      }
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Bootcamp eğitimleri güncellenirken hata (ID: ${bootcampId}):`, error);
      throw error;
    } finally {
      client.release();
    }
  }
};
