import React, { useEffect, useState } from 'react';
import { authApi } from '../../lib/api/apiClient';
import { User, UserRole } from '../../types';
import DepartmentModal from '../../components/departments/DepartmentModal';
import UserDetailModal from '../../components/users/UserDetailModal';


const Card: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div className="bg-card text-card-foreground shadow-md rounded-lg p-6">{children}</div>
);

const Alert: React.FC<{variant: string, title: string, description: string}> = ({variant, title, description}) => {
  
  let baseClasses = 'p-4 rounded-lg mb-4 border ';
  
  let colorClasses = '';
  if (variant === 'error' || variant === 'destructive') { 
    colorClasses = 'bg-destructive/10 text-destructive border-destructive/50';
  } else {
    
    colorClasses = 'bg-primary/10 text-primary border-primary/50'; 
  }
  
  return (
    <div className={`${baseClasses} ${colorClasses}`}>
      <h5 className="font-medium mb-1">{title}</h5>
      <div className="text-sm">{description}</div>
    </div>
  );
};

const Spinner: React.FC<{size?: string}> = ({size}) => {
  const sizeClass = size === 'lg' ? 'w-8 h-8' : 'w-4 h-4';
  return (
    <div className={`animate-spin rounded-full border-2 border-border border-t-primary ${sizeClass}`}></div> 
  );
};

const Input: React.FC<{type: string, placeholder: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, className?: string}> = 
  ({type, placeholder, value, onChange, className}) => (
    <input 
      type={type} 
      placeholder={placeholder} 
      value={value} 
      onChange={onChange}
      className={`border border-input bg-background text-foreground placeholder:text-muted-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary ${className || ''}`} 
    />
  );

const Badge: React.FC<{color: string, text: string}> = ({color, text}) => {
  
  let variantClasses = '';
  switch (color) {
    case 'red':
    case 'destructive': 
      variantClasses = 'bg-destructive/10 text-destructive border border-destructive/20';
      break;
    case 'orange':
    case 'yellow':
    case 'warning': 
      variantClasses = 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 dark:text-yellow-400'; 
      break;
    case 'green':
    case 'success': 
       variantClasses = 'bg-green-500/10 text-green-700 border border-green-500/20 dark:text-green-400';
       break;
    case 'blue':
    case 'primary': 
      variantClasses = 'bg-primary/10 text-primary border border-primary/20';
      break;
    case 'purple':
      variantClasses = 'bg-purple-500/10 text-purple-700 border border-purple-500/20 dark:text-purple-400';
      break;
    case 'gray':
    case 'secondary': 
    default:
      variantClasses = 'bg-secondary/10 text-secondary-foreground border border-secondary/20';
      break;
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses}`}>
      {text}
    </span>
  );
};

const Button: React.FC<{size?: string, variant?: string, onClick?: () => void, children: React.ReactNode}> = 
  ({size, variant, onClick, children}) => {
    
    const sizeClasses: Record<string, string> = {
      sm: 'h-9 px-3',
      md: 'h-10 px-4 py-2', 
      lg: 'h-11 px-8',
      icon: 'h-10 w-10'
    };
    const variantClasses: Record<string, string> = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline'
    };

    const currentSize = size && sizeClasses[size] ? sizeClasses[size] : sizeClasses.md;
    const currentVariant = variant && variantClasses[variant] ? variantClasses[variant] : variantClasses.default;
    
    return (
      <button 
        onClick={onClick} 
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${currentSize} ${currentVariant}`}
      >
        {children}
      </button>
    );
  };


const Table = {
  Root: ({children}: {children: React.ReactNode}) => <table className="min-w-full divide-y divide-border">{children}</table>,
  Header: ({children}: {children: React.ReactNode}) => <thead className="bg-muted">{children}</thead>,
  Body: ({children}: {children: React.ReactNode}) => <tbody className="divide-y divide-border">{children}</tbody>,
  Row: ({children}: {children: React.ReactNode}) => <tr className="hover:bg-muted/50">{children}</tr>,
  HeaderCell: ({children}: {children: React.ReactNode}) => <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{children}</th>,
  Cell: ({children, colSpan, className}: {children: React.ReactNode, colSpan?: number, className?: string}) => <td className={`px-4 py-3 text-sm text-foreground ${className || ''}`} colSpan={colSpan}>{children}</td>
};


const sanitizeText = (text: string | undefined | null): string => {
  if (!text) return '-';
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};



const getRoleBadgeColor = (role: UserRole): 'red' | 'orange' | 'blue' => {
  switch (role) {
    case UserRole.ADMIN_SENIOR:
      return 'red';
    case UserRole.ADMIN_JUNIOR:
      return 'orange';
    case UserRole.EMPLOYEE:
    default:
      return 'blue';
  }
};





const UsersPage: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await authApi.getAllDepartments();
        if (response.success && response.data) {
          setDepartments(response.data);
        }
      } catch (err: any) {
        console.error('Departmanlar yüklenemedi:', err);
      }
    };
    fetchDepartments();
  }, []);
  

  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      
      const response = await authApi.getAllUsers();
      
      if (response.success && response.data) {
        
        const sanitizedUsers = response.data.map((user: any) => ({
          ...user,
          firstName: sanitizeText(user.firstName || ''),
          lastName: sanitizeText(user.lastName || ''),
          email: sanitizeText(user.email || ''),
          employee: user.employee ? {
              ...user.employee,
              department: sanitizeText(user.employee.department || ''),
              position: sanitizeText(user.employee.position || ''),
            } : null,
          
          password: undefined
        }));
        
        setUsers(sanitizedUsers);
        setFilteredUsers(sanitizedUsers);
      } else {
        throw new Error(response.message || 'Kullanıcılar yüklenemedi');
      }
    } catch (err: any) {
      console.error('Kullanıcıları yükleme hatası:', err);
      setError(err.message || 'Kullanıcılar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    fetchUsers();
  }, []);

  
  useEffect(() => {
    let filtered = users;
    if (selectedDepartment) {
      filtered = filtered.filter(user => user.employee?.departmentId === selectedDepartment);
    }
    if (searchTerm.trim() !== '') {
      const cleanSearchTerm = sanitizeText(searchTerm).toLowerCase();
      filtered = filtered.filter(user => {
        const firstNameMatch = user.firstName?.toLowerCase().includes(cleanSearchTerm) || false;
        const lastNameMatch = user.lastName?.toLowerCase().includes(cleanSearchTerm) || false;
        const emailMatch = user.email?.toLowerCase().includes(cleanSearchTerm) || false;
        let departmentName = '';
        if (user.employee?.department) {
          departmentName = typeof user.employee.department === 'string'
            ? user.employee.department
            : (user.employee.department as any)?.name || '';
        } else if (user.department) {
          departmentName = typeof user.department === 'string'
            ? user.department
            : (user.department as any)?.name || '';
        }
        const departmentMatch = departmentName.toLowerCase().includes(cleanSearchTerm);
        const positionMatch = user.employee?.position?.toLowerCase().includes(cleanSearchTerm) || (user.position?.toLowerCase().includes(cleanSearchTerm) ?? false);
        return firstNameMatch || lastNameMatch || emailMatch || departmentMatch || positionMatch;
      });
    }
    setFilteredUsers(filtered);
  }, [searchTerm, users, selectedDepartment]);

  
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Geçersiz tarih';
      }
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Tarih formatı hatası:', error);
      return 'Geçersiz tarih';
    }
  };
  
  
  const secureDisplay = (text: string | undefined | null): string => {
    return text ? sanitizeText(text) : '-';
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <h2 className="text-2xl font-bold">Kullanıcı Yönetimi</h2>
          <div className="flex gap-2 items-center">
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsDepartmentModalOpen(true)}
            >
              Departman Yönetimi
            </Button>
            {}
            <div className="w-48">
              <select
                className="border border-input bg-background text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary w-full"
                value={selectedDepartment ?? ''}
                onChange={e => setSelectedDepartment(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Tüm Departmanlar</option>
                {departments.map(dep => (
                  <option key={dep.id} value={dep.id}>{dep.name}</option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-64">
              <Input 
                type="text" 
                placeholder="Ara: İsim, E-posta, Departman..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <Alert variant="error" title="Hata" description={error} />
        ) : (
          <>
            <div className="mb-4">
              <p className="text-gray-600">Toplam {filteredUsers.length} kullanıcı bulundu</p>
            </div>
            <div className="overflow-x-auto">
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>ID</Table.HeaderCell>
                    <Table.HeaderCell>Ad Soyad</Table.HeaderCell>
                    <Table.HeaderCell>E-posta</Table.HeaderCell>
                    <Table.HeaderCell>Rol</Table.HeaderCell>
                    <Table.HeaderCell>Departman</Table.HeaderCell>
                    <Table.HeaderCell>Son Giriş</Table.HeaderCell>
                    <Table.HeaderCell>İşlemler</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filteredUsers.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={8} className="text-center py-4">
                        Kullanıcı bulunamadı
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    filteredUsers.map((user) => (
                      <Table.Row key={user.id}>
                        <Table.Cell>{user.id}</Table.Cell>
                        <Table.Cell>
                          {secureDisplay(user.firstName || user.name?.split(' ')[0])} {secureDisplay(user.lastName || user.name?.split(' ')[1] || '')}
                        </Table.Cell>
                        <Table.Cell>{secureDisplay(user.email)}</Table.Cell>
                        <Table.Cell>
                          <Badge color={getRoleBadgeColor(user.role)} text={String(user.role)} />
                        </Table.Cell>
                        <Table.Cell>{ 
                          
                          departments.find(dep => dep.id === user.employee?.departmentId)?.name || '-' 
                        }</Table.Cell>
                        <Table.Cell>{user.lastLogin ? formatDate(user.lastLogin) : '-'}</Table.Cell>
                        <Table.Cell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsUserDetailModalOpen(true);
                            }}
                          >
                            Detaylar
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))
                  )}
                </Table.Body>
              </Table.Root>
            </div>
          </>
        )}
      </Card>
      <UserDetailModal
        user={selectedUser as User}
        departments={departments}
        isOpen={isUserDetailModalOpen}
        onClose={() => setIsUserDetailModalOpen(false)}
        onDelete={async (userId) => {
          try {
            await authApi.deleteUser(userId);
          } catch (err) {
            alert('Kullanıcı silinirken hata oluştu!');
          }
          setIsUserDetailModalOpen(false);
          setSelectedUser(null);
          fetchUsers();
        }}
        onDepartmentChange={async (userId, departmentId) => {
          try {
            await authApi.updateUserDepartment(userId, departmentId);
            fetchUsers(); 
          } catch (err) {
            alert('Departman güncellenirken hata oluştu!');
          }
          setIsUserDetailModalOpen(false);
          setSelectedUser(null);
        }}
        onUserUpdated={fetchUsers}
      />
      <DepartmentModal
        isOpen={isDepartmentModalOpen}
        onClose={() => setIsDepartmentModalOpen(false)}
        onSave={() => {
          fetchUsers();
        }}
      />
    </div>
  );
};

export default UsersPage;
