import React, { useState, useEffect } from 'react';
import { Table, Button, Spin, Alert, Space, Typography, Modal, Form, Input, Select, InputNumber, Switch, message, DatePicker, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, TeamOutlined } from '@ant-design/icons';
import * as conferenceApiService from '../../services/conferenceApiService';
import { ConferenceTraining, UserRole } from '../../types';
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import { ConfirmModal } from '../../components/ui';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;


const categoryOptions = [
  'Yazılım Geliştirme',
  'Ağ Güvenliği',
  'Veri Analizi',
  'Proje Yönetimi',
  'Müşteri İlişkileri',
  'İş Süreçleri',
  'Kişisel Gelişim',
  'Takım Çalışması',
  'Liderlik',
  'İletişim Becerileri'
];

interface ConferenceFormValues {
  title: string;
  description: string;
  category: string;
  location: string;
  dateRange: [Dayjs, Dayjs]; 
  capacity: number;
  author: string;
  published: boolean;
}

interface AdminConferencesPageProps {
  
}

const AdminConferencesPage: React.FC<AdminConferencesPageProps> = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [conferences, setConferences] = useState<ConferenceTraining[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>('Yeni Konferans Eğitimi Ekle');
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [editingConference, setEditingConference] = useState<ConferenceTraining | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [conferenceToDelete, setConferenceToDelete] = useState<string | null>(null);
  
  
  const [form] = Form.useForm<ConferenceFormValues>();
  
  
  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const userData = JSON.parse(userJson);
        setUser(userData);
      } catch (err) {
        console.error('User verisi ayrıştırılamadı:', err);
      }
    } else {
      console.warn('Oturum açan kullanıcı bulunamadı.');
    }
  }, []);

  
  const fetchConferences = async () => {
    if (!user) {
      if (loading) setLoading(false);
      setError('Kullanıcı bilgisi yüklenemedi.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let data: ConferenceTraining[] = [];
      if (user.role === UserRole.EMPLOYEE) {
        console.log('Çalışan için atanmış konferanslar getiriliyor...');
        data = await conferenceApiService.getUserConferences();
      } else if (user.role === UserRole.ADMIN_SENIOR || user.role === UserRole.ADMIN_JUNIOR) {
        console.log('Admin için konferans eğitimleri getiriliyor...');
        data = await conferenceApiService.getAllConferences();
      } else {
        console.warn('Tanımsız kullanıcı rolü:', user.role);
        setError('Konferans eğitimlerini getirmek için yetkiniz yok.');
      }
      setConferences(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Konferans eğitimleri yüklenirken hata:', err);
      setError(err.message || 'Konferans eğitimleri yüklenirken bir hata oluştu.');
      setConferences([]);
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    if (user) {
      fetchConferences();
    }
  }, [user]);

  
  const handleDelete = async (id: string) => {
    setConferenceToDelete(id);
    setIsDeleteModalOpen(true);
  };

  
  const confirmDelete = async () => {
    if (!conferenceToDelete) return;
    
    try {
      await conferenceApiService.deleteConference(conferenceToDelete);
      fetchConferences();
      message.success('Konferans eğitimi başarıyla silindi.');
    } catch (error) {
      console.error(`Konferans silinirken hata (ID: ${conferenceToDelete}):`, error);
      message.error('Konferans eğitimi silinirken bir hata oluştu.');
    }
    
    
    setConferenceToDelete(null);
  };

  
  const handleCancel = () => {
    form.resetFields();
    setModalVisible(false);
    setEditingConference(null);
  };

  
  const handleAdd = () => {
    setModalTitle('Yeni Konferans Eğitimi Ekle');
    setEditingConference(null);
    form.resetFields();
    form.setFieldsValue({ published: false });
    setModalVisible(true);
  };

  
  const handleEdit = (record: ConferenceTraining) => {
    setModalTitle('Konferans Eğitimini Düzenle');
    setEditingConference(record);
    
    
    const startDate = record.startDate ? dayjs(record.startDate) : null;
    const endDate = record.endDate ? dayjs(record.endDate) : null;
    
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      category: record.category,
      location: record.location,
      dateRange: startDate && endDate ? [startDate, endDate] : undefined,
      capacity: record.capacity,
      author: record.author,
      published: record.published
    });
    
    setModalVisible(true);
  };

  
  const handleViewConference = () => {
    
    message.info('Konferans detay sayfası henüz eklenmedi.');
  };

  
  const handleManageAttendees = (record: ConferenceTraining) => {
    navigate(`/dashboard/admin/conferences/${record.id}/attendees`);
  };

  
  const handleFormSubmit = async (values: ConferenceFormValues) => {
    setModalLoading(true);
    try {
      
      const startDate = values.dateRange?.[0].format('YYYY-MM-DDTHH:mm:ss');
      const endDate = values.dateRange?.[1].format('YYYY-MM-DDTHH:mm:ss');
      
      
      const payload = {
        title: values.title,
        description: values.description,
        category: values.category,
        location: values.location,
        startDate,
        endDate,
        capacity: values.capacity,
        author: values.author,
        published: values.published
      };

      if (editingConference) {
        
        await conferenceApiService.updateConference(editingConference.id.toString(), payload);
        message.success('Konferans eğitimi başarıyla güncellendi.');
      } else {
        
        await conferenceApiService.createConference(payload as any);
        message.success('Yeni konferans eğitimi başarıyla eklendi.');
      }
      
      
      handleCancel();
      fetchConferences();
    } catch (err: any) {
      console.error('Konferans kaydedilirken hata:', err);
      message.error(err.message || 'Konferans eğitimi kaydedilirken bir hata oluştu.');
    } finally {
      setModalLoading(false);
    }
  };

  
  const isAdmin = user?.role === UserRole.ADMIN_SENIOR || user?.role === UserRole.ADMIN_JUNIOR;

  const columns = [
    { title: 'Başlık', dataIndex: 'title', key: 'title', sorter: (a: ConferenceTraining, b: ConferenceTraining) => a.title.localeCompare(b.title) },
    { title: 'Kategori', dataIndex: 'category', key: 'category', sorter: (a: ConferenceTraining, b: ConferenceTraining) => a.category.localeCompare(b.category) },
    { title: 'Konum', dataIndex: 'location', key: 'location', sorter: (a: ConferenceTraining, b: ConferenceTraining) => a.location.localeCompare(b.location) },
    { 
      title: 'Başlangıç', 
      dataIndex: 'startDate', 
      key: 'startDate', 
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
      sorter: (a: ConferenceTraining, b: ConferenceTraining) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf()
    },
    { 
      title: 'Bitiş', 
      dataIndex: 'endDate', 
      key: 'endDate', 
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
      sorter: (a: ConferenceTraining, b: ConferenceTraining) => dayjs(a.endDate).valueOf() - dayjs(b.endDate).valueOf() 
    },
    { 
      title: 'Kapasite', 
      dataIndex: 'capacity', 
      key: 'capacity',
      render: (capacity: number) => capacity === 0 ? 'Sınırsız' : capacity,
      sorter: (a: ConferenceTraining, b: ConferenceTraining) => a.capacity - b.capacity 
    },
    
    ...(isAdmin ? [
      { title: 'Yazar', dataIndex: 'author', key: 'author' },
      { 
        title: 'Yayınlandı mı?', 
        dataIndex: 'published', 
        key: 'published', 
        render: (published: boolean) => published ? 
          <Tag color="green">Evet</Tag> : 
          <Tag color="orange">Hayır</Tag> 
      },
    ] : []),
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_: any, record: ConferenceTraining) => (
        <Space size="middle">
          {} 
          {isAdmin && (
            <>
              <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                Düzenle
              </Button>
              <Button icon={<TeamOutlined />} onClick={() => handleManageAttendees(record)}>
                Katılımcılar
              </Button>
              <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id.toString())}>
                Sil
              </Button>
            </>
          )}
          {} 
          <Button icon={<EyeOutlined />} onClick={() => handleViewConference()}>
            Detay
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Konferans Eğitimleri Yönetimi</Title>
      <Space>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAdd} 
          style={{ marginBottom: 16 }}
        >
          Yeni Konferans Ekle
        </Button>
      </Space>
      
      {} 
      {user?.role === UserRole.EMPLOYEE && (
        <Title level={3}>Kayıtlı Olduğunuz Konferans Eğitimleri</Title>
      )}

      {}
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      
      {}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" tip="Yükleniyor..." />
        </div>
      ) : (
        
        <Table
          dataSource={conferences}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
        />
      )}
      
      {}
      <Modal
        title={modalTitle}
        visible={modalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            İptal
          </Button>,
          <Button key="submit" type="primary" loading={modalLoading} onClick={() => form.submit()}>
            Kaydet
          </Button>,
        ]}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{ published: false, capacity: 0 }}
        >
          <Form.Item
            name="title"
            label="Başlık"
            rules={[{ required: true, message: 'Lütfen başlığı girin!' }]}
          >
            <Input placeholder="Konferans Başlığı" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Açıklama"
            rules={[{ required: true, message: 'Lütfen açıklama girin!' }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="category"
            label="Kategori"
            rules={[{ required: true, message: 'Lütfen bir kategori seçin!' }]}
          >
            <Select placeholder="Kategori seçin">
              {categoryOptions.map(option => (
                <Option key={option} value={option}>{option}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="location"
            label="Konum"
            rules={[{ required: true, message: 'Lütfen konferans konumunu girin!' }]}
          >
            <Input placeholder="Örn: Ana Toplantı Salonu, Zoom Meeting, vb." />
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Başlangıç ve Bitiş Tarihi"
            rules={[{ required: true, message: 'Lütfen tarih aralığını belirtin!' }]}
          >
            <RangePicker showTime format="DD.MM.YYYY HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="capacity"
            label="Kapasite (0 = Sınırsız)"
            rules={[{ type: 'number', min: 0, message: 'Kapasite 0 veya daha büyük olmalıdır!' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Maksimum katılımcı sayısı" />
          </Form.Item>

          <Form.Item
            name="author"
            label="Konuşmacı / Eğitmen"
            rules={[{ required: true, message: 'Lütfen konuşmacı/eğitmen adını girin!' }]}
          >
            <Input placeholder="Konuşmacı Adı" />
          </Form.Item>

          <Form.Item
            name="published"
            label="Yayın Durumu"
            valuePropName="checked"
          >
            <Switch checkedChildren="Yayınlandı" unCheckedChildren="Taslak" />
          </Form.Item>
        </Form>
      </Modal>

      {}
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Konferans Siliniyor"
        message="Bu konferans eğitimini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Evet, Konferansı Sil"
        danger={true}
      />
    </div>
  );
};

export default AdminConferencesPage;
