import { UserRole, LoginType, convertPrismaUserRole, convertPrismaLoginType } from '../../types';
import { Pool } from 'pg';
import { generateToken } from '../utils/jwt';
import bcrypt from 'bcryptjs';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123@localhost:5433/egitimportal',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
const testDbConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('PostgreSQL veritabanı bağlantısı başarılı');
    client.release();
    return true;
  } catch (error) {
    console.error('PostgreSQL veritabanı bağlantı hatası:', error);
    return false;
  }
};
testDbConnection();
export const registerUser = async (
  email: string,
  firstName: string,
  lastName: string,
  role: UserRole = UserRole.EMPLOYEE,
  loginType: LoginType = LoginType.USERNAME_PASSWORD
) => {
  const client = await pool.connect();
  try {
    console.log('[registerUser] Kayıt başlatılıyor:', { email, firstName, lastName, role, loginType });
    const emailCheckResult = await client.query(
      'SELECT * FROM users WHERE email = $1', 
      [email]
    );
    if (emailCheckResult.rows.length > 0) {
      console.log('[registerUser] Email zaten kullanımda:', email);
      throw new Error('Bu e-posta adresi zaten kullanılıyor');
    }
    await client.query('BEGIN');
    try {
      console.log('[registerUser] User tablosuna kayıt yapılıyor...');
      const userInsertResult = await client.query(
        'INSERT INTO users (email, "firstName", "lastName", role, "loginType", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id',
        [email, firstName, lastName, role, loginType]
      );
      const userId = userInsertResult.rows[0].id;
      console.log('[registerUser] User tablosuna kayıt başarılı, ID:', userId);
      if (role === UserRole.EMPLOYEE) {
        console.log('[registerUser] Çalışan tablosuna kayıt yapılıyor...');
        await client.query(
          'INSERT INTO employees ("userId", "createdAt", "updatedAt") VALUES ($1, NOW(), NOW())',
          [userId]
        );
        console.log('[registerUser] Çalışan tablosuna kayıt başarılı');
      }
      if (role === UserRole.ADMIN_JUNIOR || role === UserRole.ADMIN_SENIOR) {
        const adminLevel = role === UserRole.ADMIN_SENIOR ? 'SENIOR' : 'JUNIOR';
        console.log('[registerUser] Admin tablosuna kayıt yapılıyor...');
        await client.query(
          'INSERT INTO admins ("adminLevel", "userId", "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW())',
          [adminLevel, userId]
        );
        console.log('[registerUser] Admin tablosuna kayıt başarılı');
      }
      console.log('[registerUser] Kayıt log tablosuna yazdırılıyor...');
      await client.query(
        'INSERT INTO logs (action_type, details, user_id, ip_address, user_agent, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
        ['REGISTER', JSON.stringify({ message: `Kullanıcı kaydı yapıldı: ${email}` }), userId, 'SYSTEM', 'SYSTEM']
      );
      console.log('[registerUser] Log kaydı başarılı');
      await client.query('COMMIT');
      console.log('[registerUser] Kullanıcı kaydı tamamlandı, ID:', userId);
      return { userId, email, role };
    } catch (transactionError) {
      await client.query('ROLLBACK');
      console.error('[registerUser] Transaction hatası:', transactionError);
      throw transactionError;
    }
  } catch (error: any) {
    console.error('[registerUser] Hata oluştu:', error);
    if (error.code) {
      console.error('[registerUser] PostgreSQL hata kodu:', error.code);
      if (error.code === '23505') {
        throw new Error('Bu bilgiler zaten sistemde kayıtlı. Benzersiz değerler giriniz.');
      }
    }
    throw error;
  } finally {
    client.release();
  }
};
export const getAllUsers = async () => {
  const client = await pool.connect();
  try {
    console.log('[getAllUsers] Tüm kullanıcıları getirme işlemi başlatılıyor');
    const rawUsersResult = await client.query(`
      SELECT 
        u.id, u.email, u."firstName", u."lastName", 
        u.role, u."loginType", u."createdAt", u."updatedAt", 
        e.id as "employeeId", e."departmentId", e.position, 
        a.id as "adminId", a."adminLevel", 
        (
          SELECT MAX(created_at) 
          FROM logs 
          WHERE user_id = u.id AND action_type = 'LOGIN'
        ) as "lastLogin"
      FROM users u
      LEFT JOIN employees e ON u.id = e."userId" 
      LEFT JOIN admins a ON u.id = a."userId" 
      ORDER BY u.id
    `);
    const users = rawUsersResult.rows.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: convertPrismaUserRole(user.role),
      loginType: convertPrismaLoginType(user.loginType),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
      employee: user.employeeId ? {
        id: user.employeeId,
        departmentId: user.departmentId,
        position: user.position
      } : null,
      admin: user.adminId ? {
        id: user.adminId,
        adminLevel: user.adminLevel
      } : null
    }));
    return users;
  } catch (error) {
    console.error('[getAllUsers] Hata oluştu:', error);
    throw error;
  } finally {
    client.release();
  }
};
export const deleteUser = async (userId: number) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    await client.query(
      'INSERT INTO logs (action_type, details, user_id) VALUES ($1, $2, $3)',
      ['DELETE_USER', JSON.stringify({ message: 'Kullanıcı silindi' }), userId]
    );
    await client.query('COMMIT');
    return { success: true };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('[deleteUser] Hata oluştu:', error);
    throw error;
  } finally {
    client.release();
  }
};
export const updateUserDepartment = async (userId: number, departmentId: number) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const depCheck = await client.query('SELECT id FROM departments WHERE id = $1', [departmentId]);
    if (depCheck.rowCount === 0) {
      throw new Error('Departman bulunamadı');
    }
    await client.query(
      'UPDATE employees SET "departmentId" = $1 WHERE "userId" = $2',
      [departmentId, userId]
    );
    await client.query(
      'INSERT INTO logs (action_type, details, user_id) VALUES ($1, $2, $3)',
      ['UPDATE_DEPARTMENT', JSON.stringify({ message: 'Kullanıcı departmanı değiştirildi' }), userId]
    );
    await client.query('COMMIT');
    return { success: true };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('[updateUserDepartment] Hata oluştu:', error);
    throw error;
  } finally {
    client.release();
  }
};
export const getUserById = async (userId: number) => {
  const client = await pool.connect();
  try {
    console.log('[getUserById] Kullanıcı bilgileri getiriliyor, ID:', userId);
    const userResult = await client.query(
      `SELECT u.*, e.id as "employeeId", e."departmentId", e.position,
              a.id as "adminId", a."adminLevel"
       FROM users u
       LEFT JOIN employees e ON u.id = e."userId"
       LEFT JOIN admins a ON u.id = a."userId"
       WHERE u.id = $1`,
      [userId]
    );
    if (userResult.rows.length === 0) {
      throw new Error('Kullanıcı bulunamadı');
    }
    const userData = userResult.rows[0];
    const user = {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      role: convertPrismaUserRole(userData.role),
      loginType: convertPrismaLoginType(userData.loginType),
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      employee: userData.employeeId ? {
        id: userData.employeeId,
        departmentId: userData.departmentId,
        position: userData.position
      } : null,
      admin: userData.adminId ? {
        id: userData.adminId,
        adminLevel: userData.adminLevel
      } : null
    };
    return user;
  } catch (error: any) { 
    console.error('[getUserById] Hata oluştu:', error);
    throw error;
  } finally {
    client.release();
  }
};
export const getAssignedBootcampsByUserId = async (userId: number): Promise<any[]> => { 
  const client = await pool.connect();
  try {
    console.log(`[getAssignedBootcampsByUserId] Kullanıcı ${userId} için atanmış bootcamp'ler getiriliyor.`);
    const result = await client.query(
      `
      SELECT 
        b.id,
        b.title,
        b.description,
        b.category,
        b.author,
        b.published,
        b.duration,
        b.deadline,
        b.created_at as "createdAt",
        b.updated_at as "updatedAt",
        uba.assigned_at as "assignedAt",
        uba.id as "assignmentId"
      FROM bootcamps b
      JOIN user_bootcamp_assignments uba ON b.id = uba.bootcamp_id
      WHERE uba.user_id = $1
      ORDER BY uba.assigned_at DESC
      `,
      [userId]
    );
    console.log(`[getAssignedBootcampsByUserId] Kullanıcı ${userId} için ${result.rows.length} bootcamp bulundu.`);
    return result.rows;
  } catch (error) {
    console.error(`[getAssignedBootcampsByUserId] Kullanıcı ${userId} için bootcamp'leri getirirken hata:`, error);
    throw new Error('Atanmış bootcamp bilgileri getirilirken bir veritabanı hatası oluştu.');
  } finally {
    client.release();
  }
};
export const grantAdminPermission = async (userId: number, adminId: number, permissionLevel: string): Promise<any> => {
  const client = await pool.connect();
  try {
    console.log(`[grantAdminPermission] Kullanıcı ID ${userId} için ${permissionLevel} yetkisi veriliyor, admin ID: ${adminId}`);
    await client.query('BEGIN');
    const userResult = await client.query('SELECT role, "firstName", "lastName" FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      throw new Error('Yetki verilecek kullanıcı bulunamadı');
    }
    const currentUser = userResult.rows[0];
    const currentRole = currentUser.role;
    if (currentRole === UserRole.ADMIN_SENIOR && permissionLevel !== UserRole.ADMIN_SENIOR) { 
        throw new Error('ADMIN_SENIOR rolü sadece aynı role güncellenebilir veya hiç değiştirilemez.');
    }
    if (currentRole === permissionLevel) {
         throw new Error(`Kullanıcı zaten ${permissionLevel} rolüne sahip.`);
    }
    const updatedUserResult = await client.query(
      'UPDATE users SET role = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING id, email, "firstName", "lastName", role;',
      [permissionLevel, userId]
    );
    if (updatedUserResult.rows.length === 0) {
      throw new Error('Kullanıcı rolü güncellenemedi');
    }
    const updatedUser = updatedUserResult.rows[0];
    const adminLevel = permissionLevel === UserRole.ADMIN_SENIOR ? 'SENIOR' : 'JUNIOR';
    await client.query('DELETE FROM admins WHERE "userId" = $1', [userId]);
    if (permissionLevel === UserRole.ADMIN_JUNIOR || permissionLevel === UserRole.ADMIN_SENIOR) {
        await client.query(
            'INSERT INTO admins ("userId", "adminLevel", "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW())',
            [userId, adminLevel]
        );
    }
    await client.query(
      'INSERT INTO logs (action_type, details, user_id, ip_address, user_agent, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [
        'GRANT_ADMIN_PERMISSION',
        JSON.stringify({
          targetUserId: userId,
          newRole: permissionLevel,
          grantedBy: adminId,
          userDetails: `${updatedUser.firstName} ${updatedUser.lastName}`
        }),
        userId, 
        'SYSTEM', 
        'SYSTEM_UserService',
      ]
    );
    await client.query('COMMIT');
    console.log(`[grantAdminPermission] Kullanıcı ID ${userId} için ${permissionLevel} yetkisi başarıyla verildi.`);
    return {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: convertPrismaUserRole(updatedUser.role),
    };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error(`[grantAdminPermission] Kullanıcı ID ${userId} için yetki verme hatası:`, error);
    throw new Error(error.message || 'Yönetici yetkisi verilirken bir hata oluştu.');
  } finally {
    client.release();
  }
};
export const revokeAdminPermission = async (userId: number, adminId: number): Promise<any> => {
  const client = await pool.connect();
  try {
    console.log(`[revokeAdminPermission] Kullanıcı ID ${userId} için yetki kaldırılıyor, admin ID: ${adminId}`);
    await client.query('BEGIN');
    const userResult = await client.query('SELECT role, "firstName", "lastName" FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      throw new Error('Yetkisi alınacak kullanıcı bulunamadı');
    }
    const currentUser = userResult.rows[0];
    const currentRole = currentUser.role;
    if (currentRole === UserRole.EMPLOYEE) {
      throw new Error('Kullanıcı zaten bir çalışan, daha fazla yetki alınamaz.');
    }
     if (currentRole === UserRole.ADMIN_SENIOR) {
      throw new Error('ADMIN_SENIOR rolü bu fonksiyonla alınamaz.');
    }
    const newRole = UserRole.EMPLOYEE;
    const updatedUserResult = await client.query(
      'UPDATE users SET role = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING id, email, "firstName", "lastName", role;',
      [newRole, userId]
    );
    if (updatedUserResult.rows.length === 0) {
      throw new Error('Kullanıcı rolü güncellenemedi (yetki alınırken)');
    }
    const updatedUser = updatedUserResult.rows[0];
    await client.query('DELETE FROM admins WHERE "userId" = $1', [userId]);
    await client.query(
      'INSERT INTO logs (action_type, details, user_id, ip_address, user_agent, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [
        'REVOKE_ADMIN_PERMISSION',
        JSON.stringify({
          targetUserId: userId,
          previousRole: currentRole, 
          newRole: newRole,
          revokedBy: adminId,
          userDetails: `${updatedUser.firstName} ${updatedUser.lastName}`
        }),
        userId,
        'SYSTEM',
        'SYSTEM_UserService',
      ]
    );
    await client.query('COMMIT');
    console.log(`[revokeAdminPermission] Kullanıcı ID ${userId} için yetki başarıyla alındı.`);
    return {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: convertPrismaUserRole(updatedUser.role),
    };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error(`[revokeAdminPermission] Kullanıcı ID ${userId} için yetki alma hatası:`, error);
    throw new Error(error.message || 'Yönetici yetkisi alınırken bir hata oluştu.');
  } finally {
    client.release();
  }
};
export const getAllAdmins = async (): Promise<any[]> => {
  const client = await pool.connect();
  try {
    const queryText = `
      SELECT u.id, u.email, u.first_name as "firstName", u.last_name as "lastName",
             u.role, ap.granted_at as "grantedAt", ap.permission_level as "permissionLevel",
             a.first_name as "grantedByFirstName", a.last_name as "grantedByLastName"
      FROM users u
      JOIN admin_permissions ap ON u.id = ap.user_id
      JOIN users a ON ap.granted_by = a.id
      WHERE ap.is_active = TRUE AND u.role LIKE 'ADMIN_%'
      ORDER BY ap.granted_at DESC
    `;
    const result = await client.query(queryText);
    return result.rows;
  } catch (error) {
    console.error('Yöneticileri getirme hatası:', error);
    throw error;
  } finally {
    client.release();
  }
};
export const createUser = async (userData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  loginType: LoginType;
  departmentId?: number;
}) => {
  const client = await pool.connect();
  try {
    console.log('[createUser] Kullanıcı oluşturma başlatılıyor:', { email: userData.email, role: userData.role });
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const emailCheckResult = await client.query(
      'SELECT * FROM users WHERE email = $1', 
      [userData.email]
    );
    if (emailCheckResult.rows.length > 0) {
      throw new Error('Bu e-posta adresi zaten kullanılıyor');
    }
    await client.query('BEGIN');
    const userInsertResult = await client.query(
      'INSERT INTO users (email, password, "firstName", "lastName", role, "loginType", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *',
      [userData.email, hashedPassword, userData.firstName, userData.lastName, userData.role, userData.loginType]
    );
    const user = userInsertResult.rows[0];
    if (userData.role === UserRole.EMPLOYEE) {
      await client.query(
        'INSERT INTO employees ("userId", "departmentId", "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW())',
        [user.id, userData.departmentId || null]
      );
    }
    if (userData.role === UserRole.ADMIN_JUNIOR || userData.role === UserRole.ADMIN_SENIOR) {
      const adminLevel = userData.role === UserRole.ADMIN_SENIOR ? 'SENIOR' : 'JUNIOR';
      await client.query(
        'INSERT INTO admins ("adminLevel", "userId", "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW())',
        [adminLevel, user.id]
      );
    }
    await client.query('COMMIT');
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: convertPrismaUserRole(user.role),
        loginType: convertPrismaLoginType(user.loginType),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('[createUser] Hata oluştu:', error);
    throw error;
  } finally {
    client.release();
  }
};
export const authenticateUser = async (email: string, password: string) => {
  const client = await pool.connect();
  try {
    console.log('[authenticateUser] Kimlik doğrulama başlatılıyor:', { email });
    const userResult = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    console.log('[authenticateUser] Kullanıcı sorgu sonucu:', userResult.rows.length, 'kayıt bulundu');
    if (userResult.rows.length === 0) {
      console.log('[authenticateUser] Kullanıcı bulunamadı:', email);
      throw new Error('Geçersiz email veya şifre');
    }
    const user = userResult.rows[0];
    console.log('[authenticateUser] Bulunan kullanıcı:', { 
      id: user.id, 
      email: user.email, 
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0
    });
    if (!user.password) {
      console.log('[authenticateUser] Şifre ayarlanmamış');
      throw new Error('Bu hesap için şifre ayarlanmamış');
    }
    console.log('[authenticateUser] Şifre kontrolü yapılıyor...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('[authenticateUser] Şifre geçerli mi:', isPasswordValid);
    if (!isPasswordValid) {
      console.log('[authenticateUser] Şifre eşleşmedi');
      throw new Error('Geçersiz email veya şifre');
    }
    await client.query(
      'INSERT INTO logs (action_type, details, user_id, ip_address, user_agent, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      ['LOGIN', JSON.stringify({ message: `Kullanıcı giriş yaptı: ${email}` }), user.id, 'SYSTEM', 'SYSTEM']
    );
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: convertPrismaUserRole(user.role),
      loginType: convertPrismaLoginType(user.loginType),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  } catch (error: any) {
    console.error('[authenticateUser] Hata oluştu:', error);
    throw error;
  } finally {
    client.release();
  }
};