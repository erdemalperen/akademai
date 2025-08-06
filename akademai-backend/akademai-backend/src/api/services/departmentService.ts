import { Pool } from 'pg';
import { Department, CreateDepartmentDTO, UpdateDepartmentDTO } from '../../types';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123@localhost:5433/egitimportal',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
export const getAllDepartments = async (): Promise<Department[]> => {
  const client = await pool.connect();
  try {
    console.log('[getAllDepartments] Tüm departmanlar getiriliyor');
    const result = await client.query(
      'SELECT * FROM departments ORDER BY name ASC'
    );
    return result.rows;
  } catch (error: any) {
    console.error('[getAllDepartments] Hata oluştu:', error);
    throw new Error('Departmanlar alınırken bir hata oluştu: ' + (error.message || error));
  } finally {
    client.release();
  }
};
export const getDepartmentById = async (id: number): Promise<Department | null> => {
  const client = await pool.connect();
  try {
    console.log('[getDepartmentById] Departman getiriliyor, ID:', id);
    const result = await client.query(
      'SELECT * FROM departments WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  } catch (error: any) {
    console.error(`[getDepartmentById] Departman ${id} getirilirken hata:`, error);
    throw new Error('Departman alınırken bir hata oluştu: ' + (error.message || error));
  } finally {
    client.release();
  }
};
export const createDepartment = async (data: CreateDepartmentDTO): Promise<Department> => {
  const client = await pool.connect();
  try {
    console.log('[createDepartment] Yeni departman oluşturuluyor:', data.name);
    await client.query('BEGIN');
    const existingResult = await client.query(
      'SELECT * FROM departments WHERE name = $1',
      [data.name]
    );
    if (existingResult.rows.length > 0) {
      console.log('[createDepartment] Bu isimde bir departman zaten mevcut:', data.name);
      throw new Error('Bu isimde bir departman zaten mevcut');
    }
    const result = await client.query(
      `INSERT INTO departments (name, description, "createdAt", "updatedAt") 
       VALUES ($1, $2, NOW(), NOW()) 
       RETURNING *`,
      [data.name, data.description]
    );
    await client.query(
      'INSERT INTO logs (action, description, "ipAddress", "userAgent", "createdAt") VALUES ($1, $2, $3, $4, NOW())',
      ['CREATE_DEPARTMENT', `Departman oluşturuldu: ${data.name}`, 'SYSTEM', 'SYSTEM']
    );
    await client.query('COMMIT');
    console.log('[createDepartment] Departman başarıyla oluşturuldu, ID:', result.rows[0].id);
    return result.rows[0];
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('[createDepartment] Hata oluştu:', error);
    throw new Error('Departman oluşturulurken bir hata oluştu: ' + (error.message || error));
  } finally {
    client.release();
  }
};
export const updateDepartment = async (id: number, data: UpdateDepartmentDTO): Promise<Department> => {
  const client = await pool.connect();
  try {
    console.log('[updateDepartment] Departman güncelleniyor, ID:', id);
    await client.query('BEGIN');
    const departmentResult = await client.query(
      'SELECT * FROM departments WHERE id = $1',
      [id]
    );
    if (departmentResult.rows.length === 0) {
      console.log('[updateDepartment] Departman bulunamadı, ID:', id);
      throw new Error('Departman bulunamadı');
    }
    const department = departmentResult.rows[0];
    if (data.name !== department.name) {
      const existingResult = await client.query(
        'SELECT * FROM departments WHERE name = $1 AND id != $2',
        [data.name, id]
      );
      if (existingResult.rows.length > 0) {
        console.log('[updateDepartment] Bu isimde başka bir departman zaten mevcut:', data.name);
        throw new Error('Bu isimde bir departman zaten mevcut');
      }
    }
    const result = await client.query(
      `UPDATE departments 
       SET name = $1, description = $2, "updatedAt" = NOW() 
       WHERE id = $3 
       RETURNING *`,
      [data.name, data.description, id]
    );
    await client.query(
      'INSERT INTO logs (action, description, "ipAddress", "userAgent", "createdAt") VALUES ($1, $2, $3, $4, NOW())',
      ['UPDATE_DEPARTMENT', `Departman güncellendi: ID=${id}, Name=${data.name}`, 'SYSTEM', 'SYSTEM']
    );
    await client.query('COMMIT');
    console.log('[updateDepartment] Departman başarıyla güncellendi, ID:', id);
    return result.rows[0];
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error(`[updateDepartment] Hata oluştu:`, error);
    throw new Error('Departman güncellenirken bir hata oluştu: ' + (error.message || error));
  } finally {
    client.release();
  }
};
export const deleteDepartment = async (id: number): Promise<Department> => {
  const client = await pool.connect();
  try {
    console.log('[deleteDepartment] Departman siliniyor, ID:', id);
    await client.query('BEGIN');
    const departmentResult = await client.query(
      'SELECT * FROM departments WHERE id = $1',
      [id]
    );
    if (departmentResult.rows.length === 0) {
      console.log('[deleteDepartment] Departman bulunamadı, ID:', id);
      throw new Error('Departman bulunamadı');
    }
    const employeesResult = await client.query(
      'SELECT COUNT(*) as count FROM employees WHERE "departmentId" = $1',
      [id]
    );
    const employeesCount = parseInt(employeesResult.rows[0].count);
    if (employeesCount > 0) {
      console.log(`[deleteDepartment] ${employeesCount} çalışanın departman bağlantısı kaldırılıyor`);
      await client.query(
        'UPDATE employees SET "departmentId" = NULL WHERE "departmentId" = $1',
        [id]
      );
    }
    await client.query(
      'INSERT INTO logs (action, description, "ipAddress", "userAgent", "createdAt") VALUES ($1, $2, $3, $4, NOW())',
      ['DELETE_DEPARTMENT', `Departman silindi: ID=${id}, Name=${departmentResult.rows[0].name}`, 'SYSTEM', 'SYSTEM']
    );
    const deleteResult = await client.query(
      'DELETE FROM departments WHERE id = $1 RETURNING *',
      [id]
    );
    await client.query('COMMIT');
    console.log('[deleteDepartment] Departman başarıyla silindi, ID:', id);
    return deleteResult.rows[0];
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error(`[deleteDepartment] Hata oluştu:`, error);
    throw new Error('Departman silinirken bir hata oluştu: ' + (error.message || error));
  } finally {
    client.release();
  }
};
