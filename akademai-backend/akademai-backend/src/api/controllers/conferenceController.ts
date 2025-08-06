import { Request, Response } from 'express';
import { pool } from '../../db';
import { UserRole } from '../../types';
export const getAllConferencesHandler = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT * FROM conference_trainings
      ORDER BY start_date DESC
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Konferans eğitimleri getirilirken hata:', error);
    res.status(500).json({ message: 'Konferans eğitimleri getirilirken bir hata oluştu' });
  }
};
export const getConferenceByIdHandler = async (req: Request, res: Response) => {
  const conferenceId = req.params.conferenceId;
  console.log(`[${new Date().toISOString()}] getConferenceByIdHandler çağrıldı, ID: ${conferenceId}`);
  try {
    console.log(`[${new Date().toISOString()}] Konferans detayları getiriliyor...`);
    const conferenceResult = await pool.query(`
      SELECT * FROM conference_trainings WHERE id = $1
    `, [conferenceId]);
    if (conferenceResult.rows.length === 0) {
      console.log(`[${new Date().toISOString()}] Konferans bulunamadı.`);
      return res.status(404).json({ message: 'Konferans bulunamadı' });
    }
    const conference = conferenceResult.rows[0];
    console.log(`[${new Date().toISOString()}] Konferans detayları başarıyla getirildi:`, JSON.stringify(conference, null, 2));
    let attendees = [];
    let materials = [];
    try {
      console.log(`[${new Date().toISOString()}] Konferans katılımcıları getiriliyor...`);
      const attendeesResult = await pool.query(`
        SELECT
          ca.user_id,
          u."firstName",
          u."lastName",
          u.email,
          ca.registered_at,
          ca.attended,
          ca.attendance_time,
          ca.notes
        FROM conference_attendees ca
        JOIN users u ON ca.user_id = u.id
        WHERE ca.conference_id = $1
        ORDER BY u."lastName", u."firstName";
      `, [conferenceId]);
      attendees = attendeesResult.rows;
      console.log(`[${new Date().toISOString()}] ${attendees.length} katılımcı bulundu. Veri:`, JSON.stringify(attendees, null, 2));
      console.log(`[${new Date().toISOString()}] Konferans materyalleri getiriliyor...`);
      const materialsResult = await pool.query(`
        SELECT * FROM conference_materials
        WHERE conference_id = $1
        ORDER BY created_at;
      `, [conferenceId]);
      materials = materialsResult.rows;
      console.log(`[${new Date().toISOString()}] ${materials.length} materyal bulundu. Veri:`, JSON.stringify(materials, null, 2));
      console.log(`[${new Date().toISOString()}] Yanıt hazırlanıyor...`);
      const responsePayload = {
        ...conference,
        attendees: attendees,
        materials: materials
      };
      console.log(`[${new Date().toISOString()}] Yanıt içeriği:`, JSON.stringify(responsePayload, null, 2));
      res.status(200).json(responsePayload);
      console.log(`[${new Date().toISOString()}] Konferans verisi başarıyla döndürüldü.`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Konferans katılımcıları veya materyalleri getirilirken/işlenirken hata:`, error);
      res.status(500).json({ message: 'Konferans katılımcıları veya materyalleri getirilirken bir hata oluştu' });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Konferans detayları getirilirken hata:`, error);
    res.status(500).json({ message: 'Konferans detayları getirilirken bir hata oluştu' });
  }
};
export const createConferenceHandler = async (req: Request, res: Response) => {
  const { 
    title, 
    description, 
    category, 
    location, 
    startDate, 
    endDate, 
    capacity, 
    author, 
    published 
  } = req.body;
  if (!title || !location || !startDate || !endDate) {
    return res.status(400).json({ message: 'Başlık, konum, başlangıç ve bitiş tarihleri zorunludur' });
  }
  try {
    const insertResult = await pool.query(`
      INSERT INTO conference_trainings (
        id, title, description, category, location, 
        start_date, end_date, capacity, author, published
      ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      title, 
      description || '', 
      category || '', 
      location,
      startDate, 
      endDate, 
      capacity || 0, 
      author || '', 
      published || false
    ]);
    const conferenceId = insertResult.rows[0].id;
    const result = await pool.query('SELECT * FROM conference_trainings WHERE id = $1', [conferenceId]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Konferans oluşturulurken hata:', error);
    res.status(500).json({ message: 'Konferans eğitimi oluşturulurken bir hata oluştu' });
  }
};
export const updateConferenceHandler = async (req: Request, res: Response) => {
  const { conferenceId } = req.params;
  const { 
    title, 
    description, 
    category, 
    location, 
    startDate, 
    endDate, 
    capacity, 
    author, 
    published 
  } = req.body;
  try {
    const checkResult = await pool.query('SELECT * FROM conference_trainings WHERE id = $1', [conferenceId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Güncellenecek konferans bulunamadı' });
    }
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (location !== undefined) updates.location = location;
    if (startDate !== undefined) updates.start_date = startDate;
    if (endDate !== undefined) updates.end_date = endDate;
    if (capacity !== undefined) updates.capacity = capacity;
    if (author !== undefined) updates.author = author;
    if (published !== undefined) updates.published = published;
    if (Object.keys(updates).length > 0) {
      const setClauses = Object.keys(updates).map((key, i) => `${key.includes('_') ? key : key.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${i + 1}`);
      const values = Object.values(updates);
      const updateQuery = `
        UPDATE conference_trainings
        SET ${setClauses.join(', ')}
        WHERE id = $${values.length + 1}
        RETURNING *
      `;
      const result = await pool.query(updateQuery, [...values, conferenceId]);
      res.status(200).json(result.rows[0]);
    } else {
      res.status(200).json(checkResult.rows[0]);
    }
  } catch (error) {
    console.error(`Konferans güncellenirken hata (ID: ${conferenceId}):`, error);
    res.status(500).json({ message: 'Konferans eğitimi güncellenirken bir hata oluştu' });
  }
};
export const deleteConferenceHandler = async (req: Request, res: Response) => {
  const conferenceId = req.params.conferenceId;
  try {
    console.log(`[deleteConferenceHandler] Konferans silme talebi alındı, ID: ${conferenceId}`);
    const checkResult = await pool.query('SELECT * FROM conference_trainings WHERE id = $1', [conferenceId]);
    if (checkResult.rows.length === 0) {
      console.log(`[deleteConferenceHandler] Silinecek konferans bulunamadı, ID: ${conferenceId}`);
      return res.status(404).json({ message: 'Silinecek konferans bulunamadı' });
    }
    await pool.query('DELETE FROM conference_trainings WHERE id = $1', [conferenceId]);
    console.log(`[deleteConferenceHandler] Konferans başarıyla silindi, ID: ${conferenceId}`);
    res.status(200).json({ message: 'Konferans başarıyla silindi' });
  } catch (error) {
    console.error(`Konferans silinirken hata (ID: ${conferenceId}):`, error);
    res.status(500).json({ message: 'Konferans eğitimi silinirken bir hata oluştu' });
  }
};
export const addAttendeeHandler = async (req: Request, res: Response) => {
  const conferenceId = req.params.conferenceId;
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ message: 'Kullanıcı ID zorunludur' });
  }
  try {
    const conferenceResult = await pool.query('SELECT * FROM conference_trainings WHERE id = $1', [conferenceId]);
    if (conferenceResult.rows.length === 0) {
      return res.status(404).json({ message: 'Konferans bulunamadı' });
    }
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    const checkResult = await pool.query(
      'SELECT * FROM conference_attendees WHERE conference_id = $1 AND user_id = $2',
      [conferenceId, userId]
    );
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ message: 'Bu kullanıcı zaten konferansa eklenmiş' });
    }
    const conference = conferenceResult.rows[0];
    if (conference.capacity > 0) {
      const countResult = await pool.query(
        'SELECT COUNT(*) FROM conference_attendees WHERE conference_id = $1',
        [conferenceId]
      );
      const currentAttendees = parseInt(countResult.rows[0].count);
      if (currentAttendees >= conference.capacity) {
        return res.status(400).json({ message: 'Konferans katılımcı kapasitesi dolu' });
      }
    }
    const insertAttendeeResult = await pool.query(`
      INSERT INTO conference_attendees (id, conference_id, user_id, attended)
      VALUES (gen_random_uuid(), $1, $2, true)
      RETURNING id
    `, [conferenceId, userId]);
    const attendeeId = insertAttendeeResult.rows[0].id;
    const result = await pool.query(`
      SELECT ca.*, u."firstName", u."lastName", u.email FROM conference_attendees ca
      JOIN users u ON ca.user_id = u.id
      WHERE ca.id = $1
    `, [attendeeId]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(`Konferansa katılımcı eklenirken hata (Konferans ID: ${conferenceId}, Kullanıcı ID: ${userId}):`, error);
    res.status(500).json({ message: 'Konferansa katılımcı eklenirken bir hata oluştu' });
  }
};
export const removeAttendeeHandler = async (req: Request, res: Response) => {
  const { conferenceId, userId } = req.params;
  try {
    const checkResult = await pool.query(
      'SELECT * FROM conference_attendees WHERE conference_id = $1 AND user_id = $2',
      [conferenceId, userId]
    );
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Katılımcı kaydı bulunamadı' });
    }
    await pool.query(
      'DELETE FROM conference_attendees WHERE conference_id = $1 AND user_id = $2',
      [conferenceId, userId]
    );
    res.status(200).json({ message: 'Katılımcı başarıyla çıkarıldı' });
  } catch (error) {
    console.error(`Konferanstan katılımcı çıkarılırken hata (Konferans ID: ${conferenceId}, Kullanıcı ID: ${userId}):`, error);
    res.status(500).json({ message: 'Konferanstan katılımcı çıkarılırken bir hata oluştu' });
  }
};
export const markAttendanceHandler = async (req: Request, res: Response) => {
  const { conferenceId, userId } = req.params;
  const { attended, notes } = req.body;
  try {
    const checkResult = await pool.query(
      'SELECT * FROM conference_attendees WHERE conference_id = $1 AND user_id = $2',
      [conferenceId, userId]
    );
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Katılımcı kaydı bulunamadı' });
    }
    await pool.query(`
      UPDATE conference_attendees
      SET attended = $1, attendance_time = $2, notes = $3
      WHERE conference_id = $4 AND user_id = $5
    `, [
      attended !== undefined ? attended : checkResult.rows[0].attended,
      attended ? new Date() : checkResult.rows[0].attendance_time,
      notes !== undefined ? notes : checkResult.rows[0].notes,
      conferenceId,
      userId
    ]);
    const result = await pool.query(`
      SELECT ca.*, u."firstName", u."lastName", u.email FROM conference_attendees ca
      JOIN users u ON ca.user_id = u.id
      WHERE ca.conference_id = $1 AND ca.user_id = $2
    `, [conferenceId, userId]);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(`Konferans katılımı işaretlenirken hata (Konferans ID: ${conferenceId}, Kullanıcı ID: ${userId}):`, error);
    res.status(500).json({ message: 'Konferans katılımı işaretlenirken bir hata oluştu' });
  }
};
export const getConferenceStatsHandler = async (req: Request, res: Response) => {
  const conferenceId = req.params.id;
  try {
    const conferenceResult = await pool.query('SELECT * FROM conference_trainings WHERE id = $1', [conferenceId]);
    if (conferenceResult.rows.length === 0) {
      return res.status(404).json({ message: 'Konferans bulunamadı' });
    }
    const statsResult = await pool.query('SELECT * FROM conference_statistics WHERE id = $1', [conferenceId]);
    if (statsResult.rows.length === 0) {
      const attendeesResult = await pool.query(
        'SELECT COUNT(*) as total, SUM(CASE WHEN attended THEN 1 ELSE 0 END) as attended FROM conference_attendees WHERE conference_id = $1',
        [conferenceId]
      );
      const conference = conferenceResult.rows[0];
      const stats = {
        id: conference.id,
        title: conference.title,
        start_date: conference.start_date,
        end_date: conference.end_date,
        capacity: conference.capacity,
        total_registrations: parseInt(attendeesResult.rows[0].total) || 0,
        total_attendees: parseInt(attendeesResult.rows[0].attended) || 0,
        registration_percentage: conference.capacity > 0 
          ? (parseInt(attendeesResult.rows[0].total) / conference.capacity) * 100 
          : 0,
        attendance_rate: parseInt(attendeesResult.rows[0].total) > 0 
          ? (parseInt(attendeesResult.rows[0].attended) / parseInt(attendeesResult.rows[0].total)) * 100 
          : 0
      };
      return res.status(200).json(stats);
    }
    res.status(200).json(statsResult.rows[0]);
  } catch (error) {
    console.error(`Konferans istatistikleri getirilirken hata (ID: ${conferenceId}):`, error);
    res.status(500).json({ message: 'Konferans istatistikleri getirilirken bir hata oluştu' });
  }
};
export const getUserConferencesHandler = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Yetkilendirme hatası' });
  }
  try {
    const result = await pool.query(`
      SELECT ct.*, ca.registered_at, ca.attended, ca.attendance_time, ca.notes
      FROM conference_trainings ct
      JOIN conference_attendees ca ON ct.id = ca.conference_id
      WHERE ca.user_id = $1
      ORDER BY ct.start_date DESC
    `, [userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(`Kullanıcının konferansları getirilirken hata (ID: ${userId}):`, error);
    res.status(500).json({ message: 'Kullanıcının konferansları getirilirken bir hata oluştu' });
  }
};
export const addConferenceMaterialHandler = async (req: Request, res: Response) => {
  const conferenceId = req.params.id;
  const { title, description, filePath, link } = req.body;
  if (!title || (!filePath && !link)) {
    return res.status(400).json({ message: 'Başlık ve dosya yolu veya link zorunludur' });
  }
  try {
    const conferenceResult = await pool.query('SELECT * FROM conference_trainings WHERE id = $1', [conferenceId]);
    if (conferenceResult.rows.length === 0) {
      return res.status(404).json({ message: 'Konferans bulunamadı' });
    }
    const insertMaterialResult = await pool.query(`
      INSERT INTO conference_materials (id, conference_id, title, description, file_path, link)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
      RETURNING id
    `, [conferenceId, title, description || '', filePath || null, link || null]);
    const materialId = insertMaterialResult.rows[0].id;
    const result = await pool.query('SELECT * FROM conference_materials WHERE id = $1', [materialId]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(`Konferans materyali eklenirken hata (Konferans ID: ${conferenceId}):`, error);
    res.status(500).json({ message: 'Konferans materyali eklenirken bir hata oluştu' });
  }
};
export const removeConferenceMaterialHandler = async (req: Request, res: Response) => {
  const { conferenceId, materialId } = req.params;
  try {
    const checkResult = await pool.query(
      'SELECT * FROM conference_materials WHERE id = $1 AND conference_id = $2',
      [materialId, conferenceId]
    );
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Materyal bulunamadı' });
    }
    await pool.query('DELETE FROM conference_materials WHERE id = $1', [materialId]);
    res.status(200).json({ message: 'Materyal başarıyla kaldırıldı' });
  } catch (error) {
    console.error(`Konferans materyali kaldırılırken hata (ID: ${materialId}):`, error);
    res.status(500).json({ message: 'Konferans materyali kaldırılırken bir hata oluştu' });
  }
};
