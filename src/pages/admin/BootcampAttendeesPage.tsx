import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Button, Space, Typography, Modal, Spin, Alert, message, Select, Tag, Form } from 'antd';
import { PlusOutlined, DeleteOutlined, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import * as bootcampApiService from '../../services/bootcampApiService';
import * as employeeApiService from '../../services/employeeApiService';

import * as departmentApiService from '../../services/departmentApiService';
import { Bootcamp, User, Department } from '../../types';
import dayjs from 'dayjs';
import { tokenService } from '../../lib/api/apiClient';
import { ConfirmModal } from '../../components/ui';

const { Title, Text } = Typography;
const { Option } = Select;

const BootcampAttendeesPage: React.FC = () => {
  const { bootcampId } = useParams<{ bootcampId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [bootcamp, setBootcamp] = useState<Bootcamp | null>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const [isAttendeesLoading, setAttendeesLoading] = useState<boolean>(false);

  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState<boolean>(false);
  const [attendeeToRemove, setAttendeeToRemove] = useState<number | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('jwt_token') || 
                    localStorage.getItem('token') || 
                    localStorage.getItem('auth_token') || 
                    tokenService.getToken();
                    
      if (!token) {
        setError('Oturum bilgileriniz eksik. Lütfen tekrar giriş yapın.');
        setLoading(false);
        message.error('Yetki hatası. Lütfen tekrar giriş yapın.');
        
        navigate('/login');
        return false;
      }
      
      console.log('[BootcampAttendeesPage] Token bulundu:', token.substring(0, 15) + '...');
      return true;
    };
    
    const fetchData = async () => {
      if (!bootcampId) {
        setError('Bootcamp ID bulunamadı.');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        
        const token = tokenService.getToken() || 
                      localStorage.getItem('token') || 
                      localStorage.getItem('jwt_token') || 
                      localStorage.getItem('auth_token');

        if (!token) {
          setError('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
          setLoading(false);
          return;
        }

        console.log('Bootcamp bilgisi getiriliyor, ID:', bootcampId);
        
        
        try {
          const bootcampData = await bootcampApiService.getBootcampById(bootcampId);
          setBootcamp(bootcampData);
          console.log('Bootcamp başarıyla getirildi:', bootcampData);
          
          
          try {
            const attendeesData = await bootcampApiService.getBootcampParticipants(bootcampId);
            setAttendees(attendeesData || []);
            console.log('Katılımcılar başarıyla getirildi:', attendeesData?.length || 0);
          } catch (attendeesError) {
            console.error('Katılımcılar getirilirken hata:', attendeesError);
            message.warning('Katılımcı bilgileri yüklenemedi. Sayfa yenilendiğinde tekrar denenecek.');
          }
          
          
          try {
            const [allEmployees, allDepartments] = await Promise.all([
              employeeApiService.getAllEmployees(),
              departmentApiService.getAllDepartments()
            ]);
            
            
            setEmployees(allEmployees.filter((u: User) => u.role === 'EMPLOYEE'));
            setDepartments(allDepartments);
          } catch (employeesError) {
            console.error('Çalışanlar veya departmanlar getirilirken hata:', employeesError);
            message.warning('Çalışan veya departman bilgileri yüklenemedi. Katılımcı ekleme işlevi sınırlı olabilir.');
          }
          
          setError(null);
        } catch (bootcampError: any) {
          console.error('Bootcamp bilgisi getirilirken hata:', bootcampError);
          setError(`Bootcamp bilgisi yüklenemedi: ${bootcampError.message || 'Bilinmeyen hata'}`);
        }
      } catch (err: any) {
        console.error('Veri yüklenirken hata:', err);
        setError(err.message || 'Bootcamp bilgileri veya çalışanlar/departmanlar yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    
    if (checkAuth()) {
      fetchData();
    }
  }, [bootcampId, navigate]);

  const handleAddAttendee = async () => {
    if (selectedUsers.length === 0 || !bootcampId) {
      message.error('Lütfen en az bir kullanıcı seçin!');
      return;
    }

    setAttendeesLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const userId of selectedUsers) {
        try {
          
          await bootcampApiService.assignBootcampToUser(bootcampId, userId);
          successCount++;
        } catch (singleError: any) {
          console.error(`Kullanıcı ${userId} eklenirken hata:`, singleError);
          errorCount++;
          const failedUser = employees.find(emp => emp.id === userId);
          message.error(`${failedUser?.firstName || 'Bilinmeyen'} ${failedUser?.lastName || 'kullanıcı'} eklenemedi: ${singleError.response?.data?.message || singleError.message}`, 5);
        }
      }

      message.success(`${successCount} katılımcı başarıyla eklendi.`);
      if (errorCount > 0) {
        message.warning(`${errorCount} katılımcı eklenirken hata oluştu. Lütfen konsolu kontrol edin.`);
      }

      
      const attendees = await bootcampApiService.getBootcampParticipants(bootcampId);
      setAttendees(attendees || []);

      setAddModalVisible(false);
      setSelectedUsers([]);
      setSelectedDepartment(null);
    } catch (err: any) {
      console.error('Katılımcılar eklenirken hata:', err);
      message.error('Katılımcılar eklenirken bir hata oluştu.');
    } finally {
      setAttendeesLoading(false);
    }
  };

  const handleRemoveAttendee = async (userId: number) => {
    setAttendeeToRemove(userId);
    setIsRemoveModalOpen(true);
  };

  const confirmRemoveAttendee = async () => {
    if (!bootcampId || !attendeeToRemove) return;

    try {
      await bootcampApiService.removeUserFromBootcamp(bootcampId, attendeeToRemove);
      message.success('Katılımcı başarıyla çıkarıldı.');
      
      
      const attendees = await bootcampApiService.getBootcampParticipants(bootcampId);
      setAttendees(attendees || []);
    } catch (err: any) {
      console.error('Katılımcı çıkarılırken hata:', err);
      message.error('Katılımcı çıkarılırken bir hata oluştu.');
    }
    
    
    setAttendeeToRemove(null);
  };

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value);
    
    
    if (!value) {
      setSelectedUsers([]);
      return;
    }
    
    
    let filteredUsers = employees;
    
    
    if (value !== 'all') {
      
      filteredUsers = employees.filter(emp => emp.employee?.departmentId?.toString() === value);
    }
    
    
    filteredUsers = filteredUsers.filter(emp => !attendees.some(att => att.id === emp.id));
    
    
    setSelectedUsers(filteredUsers.map(emp => emp.id));
  };

  const columns = [
    {
      title: 'Ad',
      dataIndex: 'firstName',
      key: 'firstName',
    },
    {
      title: 'Soyad',
      dataIndex: 'lastName',
      key: 'lastName',
    },
    {
      title: 'E-posta',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Departman',
      dataIndex: 'departmentName',
      key: 'departmentName',
      render: (text: string) => text || 'Belirtilmemiş',
    },
    {
      title: 'İlerleme',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => {
        if (progress === 100) {
          return <Tag color="success" icon={<CheckCircleOutlined />}>Tamamlandı</Tag>;
        } else if (progress > 0) {
          return <Tag color="processing">{`%${progress} Tamamlandı`}</Tag>;
        } else {
          return <Tag color="default">Başlanmadı</Tag>;
        }
      },
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_: unknown, record: any) => (
        <Space size="small">
          <Button 
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleRemoveAttendee(record.id)}
          >
            Çıkar
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', margin: '50px 0' }}>
        <Spin size="large" />
        <p>Bootcamp bilgileri yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Hata"
        description={error}
        type="error"
        showIcon
        action={
          <Button type="primary" onClick={() => navigate(-1)}>
            Geri Dön
          </Button>
        }
      />
    );
  }

  return (
    <div className="conference-attendees-container" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)}
          >
            Geri Dön
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            {bootcamp?.title || 'Bootcamp'} Katılımcıları
          </Title>
        </Space>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setAddModalVisible(true)}
        >
          Katılımcı Ekle
        </Button>
      </div>

      {bootcamp && (
        <div style={{ marginBottom: '20px' }}>
          <Text strong>Bootcamp:</Text> {bootcamp.title}
          <br />
          <Text strong>Açıklama:</Text> {bootcamp.description || 'Açıklama bulunmuyor'}
          <br />
          <Text strong>Kategori:</Text> {bootcamp.category || 'Belirtilmemiş'}
          <br />
          <Text strong>Süre:</Text> {bootcamp.duration ? `${bootcamp.duration} gün` : 'Belirtilmemiş'}
          <br />
          {bootcamp.deadline && (
            <>
              <Text strong>Son Tarih:</Text> {dayjs(bootcamp.deadline).format('DD.MM.YYYY')}
              <br />
            </>
          )}
          <Text strong>Yazar:</Text> {bootcamp.author || 'Belirtilmemiş'}
        </div>
      )}

      <Table 
        dataSource={attendees.map((a: any) => ({ ...a, key: a.id }))} 
        columns={columns} 
        rowKey="id"
        pagination={{ pageSize: 10 }}
        bordered
      />

      {}
      <Modal
        title="Bootcamp'e Katılımcı Ekle"
        open={isAddModalVisible}
        onCancel={() => {
          setAddModalVisible(false);
          setSelectedUsers([]);
          setSelectedDepartment(null);
        }}
        footer={[
          <Button 
            key="back" 
            onClick={() => {
              setAddModalVisible(false);
              setSelectedUsers([]);
              setSelectedDepartment(null);
            }}
          >
            İptal
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={isAttendeesLoading}
            onClick={handleAddAttendee}
          >
            Ekle
          </Button>,
        ]}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Departmana Göre Filtrele">
            <Select
              placeholder="Bir departman seçin"
              style={{ width: '100%' }}
              allowClear
              onChange={handleDepartmentChange}
              value={selectedDepartment}
            >
              <Option key="all" value="all">Tüm Departmanlar</Option>
              {departments.map(dept => (
                <Option key={dept.id} value={dept.id.toString()}>{dept.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Katılımcılar">
            <Select
              mode="multiple"
              placeholder="Katılımcı seçin"
              value={selectedUsers}
              onChange={setSelectedUsers}
              style={{ width: '100%' }}
              optionFilterProp="children"
              showSearch
              filterOption={(input, option) => 
                (option?.children as unknown as string).toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {employees
                .filter(emp => !attendees.some(att => att.id === emp.id)) 
                .filter(emp => selectedDepartment === 'all' || !selectedDepartment || emp.employee?.departmentId?.toString() === selectedDepartment) 
                .map(emp => (
                  <Option key={emp.id} value={emp.id}>
                    {`${emp.firstName} ${emp.lastName} (${emp.email})`}
                  </Option>
                ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {}
      <ConfirmModal 
        isOpen={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
        onConfirm={confirmRemoveAttendee}
        title="Katılımcı Çıkarılıyor"
        message="Bu katılımcıyı bootcamp'ten çıkarmak istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Evet, Katılımcıyı Çıkar"
        danger={true}
      />
    </div>
  );
};

export default BootcampAttendeesPage;