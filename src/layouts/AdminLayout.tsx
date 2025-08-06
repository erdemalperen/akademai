import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Layout, Menu, Typography, Avatar, Dropdown, Space, message } from 'antd';
import {
  DashboardOutlined,
  BookOutlined,
  TeamOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  SolutionOutlined,
  UserSwitchOutlined
} from '@ant-design/icons';
import { tokenService, authApi } from '../lib/api/apiClient';


const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const user = tokenService.getUser(); 

  const handleLogout = async () => {
    try {
      await authApi.logout(); 
      message.success('Başarıyla çıkış yapıldı');
      navigate('/login'); 
    } catch (error) {
      message.error('Çıkış yapılırken bir hata oluştu');
      console.error('Logout error:', error);
    }
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        <Link to="/dashboard/admin/profile">Profil</Link>
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        <Link to="/dashboard/admin/settings">Ayarlar</Link>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Çıkış Yap
      </Menu.Item>
    </Menu>
  );

  const getMenuItems = () => {
    const items = [
      { key: 'dashboard', icon: <DashboardOutlined />, label: <Link to="/dashboard/admin/dashboard">Gösterge Paneli</Link> },
      { key: 'trainings', icon: <BookOutlined />, label: <Link to="/dashboard/admin/trainings">Eğitim Yönetimi</Link> },
      { key: 'bootcamps', icon: <SolutionOutlined />, label: <Link to="/dashboard/admin/bootcamps">Bootcamp Yönetimi</Link> },
      { key: 'employees', icon: <TeamOutlined />, label: <Link to="/dashboard/admin/employees">Çalışan Yönetimi</Link> },
    ];

    if (user?.role === 'ADMIN_SENIOR') {
      items.push({
        key: 'management',
        icon: <UserSwitchOutlined />,
        label: <Link to="/dashboard/admin/management">Yetki Yönetimi</Link>,
      });
    }
    
    items.push({
      key: 'system-settings',
      icon: <SettingOutlined />,
      label: <Link to="/dashboard/admin/system-settings">Sistem Ayarları</Link>,
    });

    return items;
  };

  if (!user) {
    
    
    
    React.useEffect(() => {
        if (!tokenService.isLoggedIn()) { 
            navigate('/login/admin');
        }
    }, [navigate]);
    
    
    return <div>Yükleniyor...</div>; 
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={250} theme="dark">
        <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Title level={3} style={{ color: 'white', margin: 0 }}>Admin Paneli</Title>
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['dashboard']} items={getMenuItems()} />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Dropdown overlay={userMenu} trigger={['click']}>
            <a onClick={(e) => e.preventDefault()} style={{ display: 'flex', alignItems: 'center' }}>
              <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
              <Space>
                {user.firstName || 'Admin'} {user.lastName || ''}
              </Space>
            </a>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout; 