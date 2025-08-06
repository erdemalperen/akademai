import React, { useEffect, useState } from 'react';
import { 
  BarChart, BookOpen, Calendar, Home, Users, X, Bot, Sparkles, Languages
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onAIAssistantOpen: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen, onAIAssistantOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      
      const role = localStorage.getItem('user_role');
      if (role) {
        console.log('Sidebar için kullanıcı rolü:', role);
        setUserRole(role);
        return;
      }

      
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user && user.role) {
            console.log('User nesnesinden rol bulundu:', user.role);
            setUserRole(user.role);
            
            localStorage.setItem('user_role', user.role);
          }
        } catch (error) {
          console.error('User parse hatası:', error);
        }
      }
    } catch (error) {
      console.error('Rol yükleme hatası:', error);
    }
  }, []);
  
  
  const isActive = (path: string) => {
    
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/dashboard/';
    }
    
    
    
    
    const dashboardPath = path.replace(/^\//, '/dashboard/');
    return location.pathname === path || 
           location.pathname === dashboardPath ||
           location.pathname.startsWith(`${path}/`) ||
           location.pathname.startsWith(`${dashboardPath}/`);
  };
  
  const menuItems = [
    { 
      path: '/dashboard', 
      label: 'Anasayfa', 
      icon: <Home className="w-5 h-5" />,
      roles: ['employee', 'instructor', 'admin']
    },
    { 
      path: '/dashboard/ai-assistant', 
      label: 'Akıllı Asistanım', 
      icon: <Sparkles className="w-5 h-5" />,
      roles: ['employee', 'instructor', 'admin'],
      isAI: true
    },
    { 
      path: '/dashboard/trainings', 
      label: 'Eğitimler', 
      icon: <BookOpen className="w-5 h-5" />,
      roles: ['employee', 'instructor', 'admin'],
      submenu: [
        
        {
          path: '/dashboard/admin/trainings',
          label: 'Eğitim Yönetimi',
          roles: ['admin'] 
        },
        {
          path: '/dashboard/admin/bootcamps',
          label: 'Bootcamp Yönetimi',
          roles: ['admin'] 
        },
        {
          path: '/dashboard/admin/conferences',
          label: 'Konferans Yönetimi',
          roles: ['admin'] 
        },
        
        {
          path: '/dashboard/trainings', 
          label: 'Eğitimlerim',
          roles: ['employee']
        },
        {
          path: '/dashboard/trainings/all', 
          label: 'Tüm Eğitimler',
          roles: ['employee']
        },
        {
          path: '/dashboard/bootcamps',
          label: 'Bootcamp',
          roles: ['employee']
        },
        {
          path: '/dashboard/conferences',
          label: 'Konferans Eğitimleri',
          roles: ['employee']
        }
      ]
    },
    { 
      path: '/dashboard/calendar', 
      label: 'Takvim', 
      icon: <Calendar className="w-5 h-5" />,
      roles: ['employee', 'instructor', 'admin']
    },
    { 
      path: '/dashboard/language-learning', 
      label: 'Dil Öğrenme', 
      icon: <Languages className="w-5 h-5" />,
      roles: ['employee', 'instructor', 'admin']
    },
    { 
      path: '/dashboard/reports', 
      label: 'Raporlar', 
      icon: <BarChart className="w-5 h-5" />,
      roles: ['admin']
    },
    { 
      path: '/dashboard/users', 
      label: 'Kullanıcılar', 
      icon: <Users className="w-5 h-5" />,
      roles: ['admin']
    },
  ];
  
  
  const filteredMenu = menuItems.filter(item => {
    
    if (userRole === 'EMPLOYEE') return item.roles.includes('employee');
    
    
    if (userRole === 'ADMIN_JUNIOR') {
      return item.roles.includes('instructor') || item.roles.includes('admin');
    }
    
    
    if (userRole === 'ADMIN_SENIOR') {
      return item.roles.includes('admin');
    }
    
    
    return false;
  });
  
  return (
    <aside className={`
      fixed top-0 left-0 z-30 h-screen w-64 border-r bg-white dark:bg-gray-800 pt-16 transition-transform duration-300 ease-in-out transform
      ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="lg:hidden absolute right-4 top-4">
        <button
          onClick={() => setOpen(false)}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 py-4 overflow-auto px-2">
        <nav className="grid gap-1 px-2">
          {}
          {filteredMenu.map((item) => (
            <React.Fragment key={item.path}>
              <button
                onClick={() => {
                  if ((item as any).isAI) {
                    onAIAssistantOpen();
                  } else {
                    navigate(item.path);
                  }
                }}
                className={`
                  flex items-center gap-3 rounded-lg px-4 py-3 text-lg font-semibold transition-colors
                  ${(item as any).isAI 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                    : isActive(item.path) 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'}
                `}
              >
                {item.icon}
                {item.label}
              </button>
              
              {}
              {item.submenu && item.roles.some(role => 
                (role === 'employee' && userRole === 'EMPLOYEE') ||
                (role === 'admin' && (userRole === 'ADMIN_SENIOR' || userRole === 'ADMIN_JUNIOR')) ||
                (role === 'instructor' && userRole === 'INSTRUCTOR') 
              ) && (
                <div className="ml-6 pl-2 border-l-2 border-gray-200 mt-1 mb-2">
                  {item.submenu
                    .filter((subItem: any) => {
                      
                      if (!userRole) return false;
                      if (userRole === 'EMPLOYEE') return subItem.roles.includes('employee');
                      if (userRole === 'ADMIN_SENIOR' || userRole === 'ADMIN_JUNIOR') return subItem.roles.includes('admin');
                      if (userRole === 'INSTRUCTOR') return subItem.roles.includes('instructor'); 
                      return false;
                    })
                    .map((subItem: any) => (
                    <button
                      key={subItem.path}
                      onClick={() => navigate(subItem.path)}
                      className={`
                        flex items-center gap-2 rounded-lg px-3 py-2 text-md font-medium transition-colors w-full text-left
                        ${isActive(subItem.path) 
                          ? 'bg-gray-100 text-primary' 
                          : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900'}
                      `}
                    >
                      {subItem.label}
                    </button>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>
      
    </aside>
  );
};

export default Sidebar;