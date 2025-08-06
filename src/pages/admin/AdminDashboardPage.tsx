import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Statistic, Spin, message } from 'antd';
import { 
  UserOutlined, 
  BookOutlined, 
  TeamOutlined,
  ScheduleOutlined
} from '@ant-design/icons';
import { authApi, tokenService } from '../../lib/api/apiClient';

const AdminDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrainings: 0,
    totalBootcamps: 0,
    totalDepartments: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        
        
        
        
        setTimeout(() => {
          setStats({
            totalUsers: 48,
            totalTrainings: 25,
            totalBootcamps: 5,
            totalDepartments: 8
          });
          setLoading(false);
        }, 1000);
        
        
        
        
        
        
      } catch (error) {
        console.error('İstatistikler yüklenirken hata oluştu:', error);
        message.error('İstatistikler yüklenirken bir hata oluştu');
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  
  const user = tokenService.getUser();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Yönetim Paneli</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-4">Hoş Geldiniz, {user?.firstName} {user?.lastName}</h2>
        <p className="text-gray-600">
          Buradan sistem genelindeki tüm verileri yönetebilir ve istatistikleri görüntüleyebilirsiniz.
        </p>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" tip="Yükleniyor..." />
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]} className="mb-8">
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Toplam Kullanıcı"
                  value={stats.totalUsers}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Toplam Eğitim"
                  value={stats.totalTrainings}
                  prefix={<BookOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Toplam Bootcamp"
                  value={stats.totalBootcamps}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Toplam Departman"
                  value={stats.totalDepartments}
                  prefix={<ScheduleOutlined />}
                />
              </Card>
            </Col>
          </Row>
          
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="Son Aktiviteler" className="h-full">
                <p>Burada son aktiviteler listelenecek</p>
                <ul className="mt-4">
                  <li className="py-2 border-b">Yeni bir kullanıcı kaydoldu: Ahmet Yılmaz</li>
                  <li className="py-2 border-b">Yazılım Geliştirme eğitimi eklendi</li>
                  <li className="py-2 border-b">Frontend Bootcamp güncellendi</li>
                  <li className="py-2">İnsan Kaynakları departmanı eklendi</li>
                </ul>
              </Card>
            </Col>
            
            <Col xs={24} md={12}>
              <Card title="Hızlı Erişim" className="h-full">
                <p>Sık kullanılan sayfalar:</p>
                <ul className="mt-4">
                  <li className="py-2 border-b"><a href="/dashboard/admin/trainings">Eğitim Yönetimi</a></li>
                  <li className="py-2 border-b"><a href="/dashboard/admin/bootcamps">Bootcamp Yönetimi</a></li>
                  <li className="py-2 border-b"><a href="/dashboard/admin/employees">Çalışan Yönetimi</a></li>
                  <li className="py-2"><a href="/dashboard/admin/system-settings">Sistem Ayarları</a></li>
                </ul>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage; 