import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Select, message, Tag, Spin } from 'antd';
import { authApi } from '../../lib/api/apiClient';
import { KeyOutlined, StopOutlined } from '@ant-design/icons';

const { Option } = Select;

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface Admin extends User {
  permissionLevel: string;
  grantedAt: string;
  grantedByFirstName: string;
  grantedByLastName: string;
}

const AdminManagementPage: React.FC = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [adminLoading, setAdminLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPermission, setSelectedPermission] = useState<string>('ADMIN_JUNIOR');

  useEffect(() => {
    console.log("[AdminManagementPage] Sayfa yüklendi, veri çekme işlemleri başlıyor.");
    fetchEmployees();
    fetchAdmins();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await authApi.getAllUsers();
      
      if (response && Array.isArray(response.data)) {
        const employeeUsers = response.data.filter((user: User) => user.role === 'EMPLOYEE');
        console.log('Çalışanlar yüklendi:', employeeUsers.length);
        setEmployees(employeeUsers);
      } else if (response && typeof response === 'object' && Array.isArray(response)) {
        const employeeUsers = response.filter((user: User) => user.role === 'EMPLOYEE');
        console.log('Çalışanlar alternatif formatta yüklendi:', employeeUsers.length);
        setEmployees(employeeUsers);
      } else {
        console.warn('getAllUsers API beklenmeyen formatta veri döndürdü:', response);
        message.error('Çalışan verileri alınırken bir sorun oluştu.');
        setEmployees([]);
      }
    } catch (error) {
      console.error('Çalışanlar getirilirken hata:', error);
      message.error('Çalışanlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    setAdminLoading(true);
    try {
      const response = await authApi.getAllAdmins();
      
      if (response && response.success && Array.isArray(response.data)) {
        console.log('Yöneticiler başarıyla yüklendi:', response.data.length);
        setAdmins(response.data);
      } else if (response && Array.isArray(response)) {
        console.log('Yöneticiler alternatif formatta yüklendi:', response.length);
        setAdmins(response);
      } else if (response && typeof response === 'object' && 'admins' in response) {
        const adminsData = response.admins;
        if (Array.isArray(adminsData)) {
          console.log('Yöneticiler "admins" özelliğinde bulundu:', adminsData.length);
          setAdmins(adminsData);
        }
      } else {
        console.warn('getAllAdmins API beklenmeyen formatta veri döndürdü:', response);
        message.error('Yönetici verileri alınırken bir sorun oluştu.');
        setAdmins([]);
      }
    } catch (error) {
      console.error('Yöneticiler getirilirken hata:', error);
      message.error('Yöneticiler yüklenirken bir hata oluştu');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleGrantPermission = (user: User) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  const handleConfirmGrant = async () => {
    if (!selectedUser) return;
    try {
      const response = await authApi.grantAdminPermission(selectedUser.id, {
        permissionLevel: selectedPermission
      });
      
      if (response && response.success) {
        message.success(`${selectedUser.firstName} ${selectedUser.lastName} kullanıcısına yönetici yetkisi verildi`);
        fetchEmployees();
        fetchAdmins();
        setModalVisible(false);
        setSelectedUser(null);
      } else {
        message.error(response?.message || 'Yetki verilirken bir hata oluştu');
      }
    } catch (error: any) {
      console.error('Yetki verme hatası:', error);
      message.error(error?.message || 'Yetki verirken bir hata oluştu');
    }
  };

  const handleRevokePermission = async (userId: number) => {
    try {
      const response = await authApi.revokeAdminPermission(userId);
      
      if (response && response.success) {
        message.success('Yönetici yetkisi başarıyla kaldırıldı');
        fetchEmployees();
        fetchAdmins();
      } else {
        message.error(response?.message || 'Yetki kaldırılırken bir hata oluştu');
      }
    } catch (error: any) {
      console.error('Yetki kaldırma hatası:', error);
      message.error(error?.message || 'Yetki kaldırılırken bir hata oluştu');
    }
  };

  const employeeColumns = [
    { title: 'Ad', dataIndex: 'firstName', key: 'firstName' },
    { title: 'Soyad', dataIndex: 'lastName', key: 'lastName' },
    { title: 'E-posta', dataIndex: 'email', key: 'email' },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_: any, record: User) => (
        <Button 
          type="primary" 
          icon={<KeyOutlined />} 
          onClick={() => handleGrantPermission(record)}
        >
          Yetki Ver
        </Button>
      ),
    }
  ];

  const adminColumns = [
    { title: 'Ad', dataIndex: 'firstName', key: 'firstName' },
    { title: 'Soyad', dataIndex: 'lastName', key: 'lastName' },
    { title: 'E-posta', dataIndex: 'email', key: 'email' },
    {
      title: 'Yetki Seviyesi',
      dataIndex: 'permissionLevel',
      key: 'permissionLevel',
      render: (text: string) => (
        <Tag color={text === 'ADMIN_SENIOR' ? 'volcano' : 'blue'}>
          {text === 'ADMIN_SENIOR' ? 'Üst Düzey Yönetici' : 'Alt Düzey Yönetici'}
        </Tag>
      )
    },
    {
      title: 'Yetki Veren',
      key: 'grantedBy',
      render: (_: any, record: Admin) => `${record.grantedByFirstName} ${record.grantedByLastName}`
    },
    {
      title: 'Yetki Tarihi',
      dataIndex: 'grantedAt',
      key: 'grantedAt',
      render: (text: string) => new Date(text).toLocaleDateString('tr-TR')
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_: any, record: Admin) => (
        <Button 
          danger
          icon={<StopOutlined />} 
          onClick={() => handleRevokePermission(record.id)}
        >
          Yetkiyi Kaldır
        </Button>
      ),
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Yönetim Paneli (Test Modu)</h1>
      
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Mevcut Yöneticiler</h2>
        {adminLoading ? <Spin /> : <Table columns={adminColumns} dataSource={admins} rowKey="id" />}
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Çalışanlar (Yetki Verilebilir)</h2>
        {loading ? <Spin /> : <Table columns={employeeColumns} dataSource={employees} rowKey="id" />}
      </div>
      
      <Modal
        title="Yönetici Yetkisi Ver"
        open={modalVisible}
        onOk={handleConfirmGrant}
        onCancel={() => {
          setModalVisible(false);
          setSelectedUser(null);
        }}
        okText="Yetkiyi Ver"
        cancelText="İptal"
        confirmLoading={loading}
      >
        {selectedUser && (
          <p>
            <strong>{selectedUser.firstName} {selectedUser.lastName}</strong> ({selectedUser.email}) kullanıcısına yönetici yetkisi vermek istediğinize emin misiniz?
          </p>
        )}
        <div className="mt-4">
          <p className="mb-2">Yetki Seviyesi:</p>
          <Select<string>
            value={selectedPermission}
            onChange={(value) => setSelectedPermission(value)}
            style={{ width: '100%' }}
          >
            <Option value="ADMIN_JUNIOR">Alt Düzey Yönetici (ADMIN_JUNIOR)</Option>
            <Option value="ADMIN_SENIOR">Üst Düzey Yönetici (ADMIN_SENIOR)</Option>
          </Select>
        </div>
      </Modal>
    </div>
  );
};

export default AdminManagementPage;