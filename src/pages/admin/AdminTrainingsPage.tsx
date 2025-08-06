import React, { useState, useEffect } from 'react';
import { Table, Button, Spin, Alert, Space, Typography, Modal, Form, Input, Select, InputNumber, Switch, message, DatePicker, Checkbox, List, Empty, Divider, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, FormOutlined } from '@ant-design/icons';
import * as trainingApiService from '../../services/trainingApiService';
import { Training as AppTraining, UserRole } from '../../types'; 
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs'; 
import { tokenService } from '../../lib/api/apiClient'; 
import { ConfirmModal } from '../../components/ui';

const { Title } = Typography; 
const { TextArea } = Input; 
const { Option } = Select; 


const categoryOptions = [
  'Yazılım Geliştirme',
  'Ağ Güvenliği',
  'Veri Analizi',
  'Proje Yönetimi',
  'Müşteri İlişkileri',
  'İş Süreçleri',
  'Kişisel Gelişim'
];


interface LocalTraining {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  author: string;
  published: boolean;
  isMandatory?: boolean;
  deadline?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  content?: any[];
  quizzes?: any[];
  [key: string]: any; 
}

interface TrainingFormValues {
  title: string;
  description: string;
  category: string;
  duration: number;
  author: string;
  published: boolean;
  isMandatory: boolean;
  deadline: Dayjs | null;
}

interface AdminTrainingsPageProps {
  isBootcampMode?: boolean;
}

const AdminTrainingsPage: React.FC<AdminTrainingsPageProps> = ({ isBootcampMode = false }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null); 
  const [trainings, setTrainings] = useState<LocalTraining[]>([]);
  const [availableTrainings, setAvailableTrainings] = useState<LocalTraining[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>(isBootcampMode ? 'Yeni Bootcamp Ekle' : 'Yeni Eğitim Ekle');
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [editingTraining, setEditingTraining] = useState<LocalTraining | null>(null);
  
  
  const [form] = Form.useForm<TrainingFormValues>();
  const [bootcampForm] = Form.useForm<TrainingFormValues>();
  
  
  const [bootcampModalVisible, setBootcampModalVisible] = useState<boolean>(false);
  const [bootcampModalLoading, setBootcampModalLoading] = useState<boolean>(false);
  const [selectedTrainings, setSelectedTrainings] = useState<string[]>([]);
  const [availableTrainingsLoading, setAvailableTrainingsLoading] = useState<boolean>(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [trainingToDelete, setTrainingToDelete] = useState<string | null>(null);

  useEffect(() => {
    
    const currentUser = tokenService.getUser();
    setUser(currentUser);
  }, []);

  
  const convertToLocalTraining = (apiTraining: AppTraining): LocalTraining => {
    
    const result: LocalTraining = {
      id: apiTraining.id,
      title: apiTraining.title,
      description: apiTraining.description,
      category: apiTraining.category,
      duration: apiTraining.duration ?? 0,
      author: apiTraining.author ?? '',
      published: apiTraining.published ?? false
    };
    
    
    if ((apiTraining as any).isMandatory !== undefined) {
      result.isMandatory = (apiTraining as any).isMandatory;
    }
    
    if (apiTraining.deadline !== undefined) {
      result.deadline = apiTraining.deadline;
    }
    
    if (apiTraining.createdAt) {
      result.createdAt = new Date(apiTraining.createdAt);
    }
    
    if (apiTraining.updatedAt) {
      result.updatedAt = new Date(apiTraining.updatedAt);
    }
    
    if (apiTraining.content) {
      result.content = apiTraining.content;
    }
    
    if (apiTraining.quizzes) {
      result.quizzes = apiTraining.quizzes;
    }
    
    return result;
  };

  
  const fetchTrainings = async () => {
    if (!user) {
      
      
      if (loading) setLoading(false); 
      setError('Kullanıcı bilgisi yüklenemedi.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let apiData: AppTraining[] = [];
      
      if (user.role === UserRole.EMPLOYEE) {
        console.log('Çalışan için atanmış eğitimler getiriliyor...');
        apiData = await trainingApiService.getAssignedTrainings(); 
      } else if (user.role === UserRole.ADMIN_SENIOR || user.role === UserRole.ADMIN_JUNIOR) {
        console.log(`Admin için ${isBootcampMode ? 'bootcampler' : 'eğitimler'} getiriliyor...`);
        
        if (isBootcampMode) {
          
          try {
            apiData = await trainingApiService.getAllBootcamps();
          } catch (bootcampErr) {
            console.error('Bootcamp verileri alınırken hata:', bootcampErr);
            apiData = [];
          }
        } else {
          
          apiData = await trainingApiService.getAllTrainings();
        }
      } else {
        console.warn('Tanımsız kullanıcı rolü:', user.role);
        setError('Eğitimleri getirmek için yetkiniz yok.');
      }
      
      
      const formattedData: LocalTraining[] = apiData.map(convertToLocalTraining);
      
      setTrainings(formattedData);
    } catch (err: any) {
      console.error(`${isBootcampMode ? 'Bootcampler' : 'Eğitimler'} yüklenirken hata:`, err);
      setError(err.message || `${isBootcampMode ? 'Bootcampler' : 'Eğitimler'} yüklenirken bir hata oluştu.`);
      setTrainings([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    
    if (user) {
      fetchTrainings();
    }
  }, [user, isBootcampMode]); 

  
  const handleDelete = async (id: string) => {
    setTrainingToDelete(id);
    setIsDeleteModalOpen(true);
  };

  
  const confirmDelete = async () => {
    if (!trainingToDelete) return;
    
    try {
      if (isBootcampMode) {
        await trainingApiService.deleteBootcamp(trainingToDelete);
        message.success('Bootcamp başarıyla silindi.');
      } else {
        await trainingApiService.deleteTraining(trainingToDelete);
        message.success('Eğitim başarıyla silindi.');
      }
      
      fetchTrainings();
    } catch (error) {
      console.error(`${isBootcampMode ? 'Bootcamp' : 'Eğitim'} silinirken hata (ID: ${trainingToDelete}):`, error);
      message.error(`${isBootcampMode ? 'Bootcamp' : 'Eğitim'} silinirken bir hata oluştu.`);
    }
    
    
    setIsDeleteModalOpen(false);
    setTrainingToDelete(null);
  };

  
  const handleCancel = () => {
    form.resetFields();
    setModalVisible(false);
    setEditingTraining(null);
  };

  
  const handleAdd = () => {
    if (isBootcampMode) {
      
      bootcampForm.resetFields();
      setSelectedTrainings([]);
      
      fetchAvailableTrainings();
      setBootcampModalVisible(true);
    } else {
      
      setModalTitle('Yeni Eğitim Ekle');
      setEditingTraining(null);
      form.resetFields();
      setModalVisible(true);
    }
  };
  
  
  const fetchAvailableTrainings = async () => {
    setAvailableTrainingsLoading(true);
    try {
      console.log('[AdminTrainingsPage] Bootcamp için eğitimler getiriliyor...');
      const apiData = await trainingApiService.getAllTrainings();
      
      
      if (!apiData || !Array.isArray(apiData)) {
        console.warn('[AdminTrainingsPage] Eğitim verisi boş veya dizi değil:', apiData);
        setAvailableTrainings([]);
        return;
      }
      
      
      const formattedData: LocalTraining[] = apiData.map(convertToLocalTraining);
      
      console.log(`[AdminTrainingsPage] ${formattedData.length} eğitim başarıyla yüklendi.`);
      setAvailableTrainings(formattedData);
    } catch (err) {
      console.error('[AdminTrainingsPage] Eğitimler yüklenirken hata:', err);
      message.error('Eğitimler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      setAvailableTrainings([]); 
    } finally {
      setAvailableTrainingsLoading(false);
    }
  };
  
  
  const handleBootcampCancel = () => {
    bootcampForm.resetFields();
    setBootcampModalVisible(false);
    setSelectedTrainings([]);
  };
  
  
  const handleBootcampFormSubmit = async (values: TrainingFormValues) => {
    setBootcampModalLoading(true);
    
    try {
      
      const bootcampPayload = {
        title: values.title,
        description: values.description,
        category: values.category,
        duration: values.duration,
        author: values.author,
        published: values.published,
        deadline: values.deadline ? values.deadline.format('YYYY-MM-DD') : null
      };
      
      
      if (editingTraining) {
        await trainingApiService.updateBootcamp(
          editingTraining.id,
          bootcampPayload
        );
        
        try {
          
          await trainingApiService.updateBootcampTrainings(
            editingTraining.id,
            selectedTrainings
          );
          
          message.success('Bootcamp ve atanmış eğitimler başarıyla güncellendi!');
        } catch (error) {
          console.error('Eğitim atama hatası:', error);
          
          
          message.warning('Bootcamp güncellendi ancak eğitim ataması tam olarak yapılamadı.');
        }
      } else {
        
        const newBootcamp = await trainingApiService.createBootcamp(bootcampPayload);
        
        if (selectedTrainings.length > 0 && newBootcamp && newBootcamp.id) {
          try {
            
            await trainingApiService.updateBootcampTrainings(
              newBootcamp.id,
              selectedTrainings
            );
            
            message.success('Yeni bootcamp ve eğitimler başarıyla oluşturuldu!');
          } catch (error) {
            console.error('Eğitim atama hatası:', error);
            message.warning('Yeni bootcamp oluşturuldu ancak eğitim ataması tam olarak yapılamadı.');
          }
        } else {
          message.success('Yeni bootcamp başarıyla oluşturuldu!');
        }
      }
      
      
      bootcampForm.resetFields();
      setSelectedTrainings([]);
      setBootcampModalVisible(false);
      setEditingTraining(null);
      fetchTrainings();
    } catch (error) {
      console.error('Bootcamp işlemi sırasında hata:', error);
      message.error('Bootcamp kaydedilirken bir hata oluştu.');
    } finally {
      setBootcampModalLoading(false);
    }
  };

  
  const handleEdit = (record: LocalTraining) => {
    
    setModalLoading(false);
    
    
    setEditingTraining(record);
    
    if (isBootcampMode) {
      
      setModalTitle(`Bootcamp Düzenle: ${record.title}`);
      
      
      setAvailableTrainingsLoading(true);
      
      
      bootcampForm.setFieldsValue({
        title: record.title,
        description: record.description,
        category: record.category,
        duration: record.duration,
        author: record.author,
        deadline: record.deadline ? dayjs(record.deadline) : null,
        published: record.published,
        isMandatory: record.isMandatory || false
      });
      
      
      setBootcampModalVisible(true);
      
      
      trainingApiService.getAllTrainings()
        .then(apiTrainings => {
          
          const formattedTrainings: LocalTraining[] = apiTrainings.map(item => ({
            id: item.id,
            title: item.title,
            description: item.description,
            category: item.category,
            duration: item.duration ?? 0,
            author: item.author ?? '',
            published: item.published ?? false,
            isMandatory: (item as any).isMandatory ?? false
          }));
          
          setAvailableTrainings(formattedTrainings);
          
          
          return trainingApiService.getBootcampTrainings(record.id)
            .catch(error => {
              console.warn('Bootcamp eğitimleri getirilemedi, boş dizi kullanılıyor:', error);
              return []; 
            });
        })
        .then(assignedTrainings => {
          
          setSelectedTrainings(assignedTrainings || []);
        })
        .catch(error => {
          console.error("Eğitimler alınırken hata oluştu:", error);
          message.error("Bootcamp eğitimleri yüklenirken bir hata oluştu.");
          setSelectedTrainings([]);
        })
        .finally(() => {
          setAvailableTrainingsLoading(false);
        });
    } else {
      
      setModalTitle(`Eğitim Düzenle: ${record.title}`);
      
      
      form.setFieldsValue({
        title: record.title,
        description: record.description,
        category: record.category,
        duration: record.duration,
        author: record.author,
        deadline: record.deadline ? dayjs(record.deadline) : null,
        published: record.published,
        isMandatory: record.isMandatory || false
      });
      
      
      setModalVisible(true);
    }
  };

  
  const handleViewTraining = (record: LocalTraining) => {
    navigate(`/dashboard/trainings/${record.id}`);
  };

  
  const handleEditContent = (record: LocalTraining) => {
    navigate(`/dashboard/admin/trainings/edit/${record.id}`);
  };

  
  const handleFormSubmit = async (values: TrainingFormValues) => {
    setModalLoading(true);
    try {
      const deadlineString = values.deadline ? values.deadline.format('YYYY-MM-DD') : null;
      
      
      const payload = {
        title: values.title,
        description: values.description,
        category: values.category,
        duration: values.duration,
        author: values.author,
        published: values.published,
        deadline: deadlineString
      };
      
      
      if (values.isMandatory !== undefined) {
        (payload as any).isMandatory = values.isMandatory;
      }

      if (editingTraining) {
        
        await trainingApiService.updateTraining(editingTraining.id, payload);
        message.success('Eğitim başarıyla güncellendi.');
      } else {
        
        await trainingApiService.createTraining(payload);
        message.success('Yeni eğitim başarıyla eklendi.');
      }
      
      handleCancel();
      fetchTrainings();
    } catch (err: any) {
      console.error('Eğitim kaydedilirken hata:', err);
      message.error(err.message || 'Eğitim kaydedilirken bir hata oluştu.');
    } finally {
      setModalLoading(false);
    }
  };

  
  const isAdmin = user?.role === UserRole.ADMIN_SENIOR || user?.role === UserRole.ADMIN_JUNIOR;

  const columns = [
    { title: 'Başlık', dataIndex: 'title', key: 'title', sorter: (a: LocalTraining, b: LocalTraining) => a.title?.localeCompare(b.title || '') || 0 },
    { title: 'Kategori', dataIndex: 'category', key: 'category', sorter: (a: LocalTraining, b: LocalTraining) => (a.category && b.category) ? a.category.localeCompare(b.category) : (a.category ? 1 : -1) },
    { title: 'Süre (dk)', dataIndex: 'duration', key: 'duration', sorter: (a: LocalTraining, b: LocalTraining) => (a.duration ?? 0) - (b.duration ?? 0) },
    
    ...(isAdmin ? [
      { title: 'Yazar', dataIndex: 'author', key: 'author' },
      { title: 'Yayınlandı mı?', dataIndex: 'published', key: 'published', render: (published: boolean) => (published ? 'Evet' : 'Hayır') },
      { title: 'Zorunlu', dataIndex: 'isMandatory', key: 'isMandatory', render: (isMandatory: boolean) => (isMandatory ? 'Evet' : 'Hayır') },
    ] : []),
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_: any, record: LocalTraining) => (
        <Space size="middle">
          {} 
          {isAdmin && (
            <>
              <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                Düzenle
              </Button>
              
              {}
              {!isBootcampMode && (
                <Button icon={<FormOutlined />} type="primary" onClick={() => handleEditContent(record)}>
                  İçeriği Düzenle
                </Button>
              )}
              
              <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id.toString())}>
                Sil
              </Button>
              
              {}
              {isBootcampMode && (
                <Button 
                  type="primary" 
                  onClick={() => navigate(`/dashboard/admin/bootcamps/${record.id}/attendees`)}
                >
                  Katılımcıları Yönet
                </Button>
              )}
            </>
          )}
          
          {}
          {!isBootcampMode && (
            <Button icon={<EyeOutlined />} onClick={() => handleViewTraining(record)}>
              Eğitime Git
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>{isBootcampMode ? 'Bootcamp Yönetimi' : 'Eğitim Yönetimi'}</Title>
      <Space>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAdd} 
          style={{ marginBottom: 16 }}
        >
          {isBootcampMode ? 'Yeni Bootcamp Ekle' : 'Yeni Eğitim Ekle'}
        </Button>

      </Space>
      
      {} 
      {!isAdmin && <Title level={2}>Atanmış Eğitimlerim</Title>}

      {error && <Alert message="Hata" description={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      {loading ? (
        <Spin tip={isBootcampMode ? "Bootcampler yükleniyor..." : "Eğitimler yükleniyor..."} />
      ) : (
        <Table 
          columns={columns} 
          dataSource={trainings}
          rowKey="id" 
          pagination={{ pageSize: 10 }}
        />
      )}

      {}
      <Modal
        title={modalTitle}
        open={modalVisible}
        onCancel={handleCancel}
        confirmLoading={modalLoading}
        onOk={() => form.submit()} 
        okText="Kaydet"
        cancelText="İptal"
        width={700} 
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{ published: false, isMandatory: false }} 
        >
          <Form.Item
            name="title"
            label="Başlık"
            rules={[{ required: true, message: 'Lütfen başlığı girin!' }]}
          >
            <Input placeholder="Eğitim Başlığı" />
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
            name="duration"
            label="Tahmini Süre (Dakika)"
            rules={[{ type: 'number', min: 1, message: 'Süre pozitif bir sayı olmalıdır!' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Örn: 60" />
          </Form.Item>

          <Form.Item
            name="author"
            label="Yazar"
            rules={[{ required: true, message: 'Lütfen yazar adını girin!' }]}
          >
            <Input placeholder="Yazar Adı" />
          </Form.Item>

          <Form.Item
            name="deadline"
            label="Son Teslim Tarihi (İsteğe Bağlı)"
          >
            <DatePicker style={{ width: '100%' }} placeholder="Tarih Seçin" format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item
            name="published"
            label="Yayın Durumu"
            valuePropName="checked"
          >
            <Switch checkedChildren="Yayınlandı" unCheckedChildren="Taslak" />
          </Form.Item>

          <Form.Item
            name="isMandatory"
            label="Zorunluluk Durumu"
            valuePropName="checked"
          >
            <Switch checkedChildren="Zorunlu" unCheckedChildren="İsteğe Bağlı" />
          </Form.Item>
        </Form>
      </Modal>

      {}
      <Modal
        title={`${editingTraining ? 'Bootcamp Düzenle' : 'Yeni Bootcamp Ekle'}`}
        open={bootcampModalVisible}
        onCancel={handleBootcampCancel}
        confirmLoading={bootcampModalLoading}
        onOk={() => bootcampForm.submit()} 
        okText="Kaydet"
        cancelText="İptal"
        width={700}
      >
        <Form
          form={bootcampForm}
          layout="vertical"
          onFinish={handleBootcampFormSubmit}
          initialValues={{ published: false }}
        >
          <Form.Item
            name="title"
            label="Bootcamp Başlığı"
            rules={[{ required: true, message: 'Lütfen başlığı girin!' }]}
          >
            <Input placeholder="Bootcamp Başlığı" />
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
            name="duration"
            label="Tahmini Süre (Gün)"
            rules={[{ type: 'number', min: 1, message: 'Süre pozitif bir sayı olmalıdır!' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Örn: 30" />
          </Form.Item>

          <Form.Item
            name="author"
            label="Yazar"
            rules={[{ required: true, message: 'Lütfen yazar adını girin!' }]}
          >
            <Input placeholder="Yazar Adı" />
          </Form.Item>

          <Form.Item
            name="deadline"
            label="Son Teslim Tarihi (İsteğe Bağlı)"
          >
            <DatePicker style={{ width: '100%' }} placeholder="Tarih Seçin" format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item
            name="published"
            label="Yayın Durumu"
            valuePropName="checked"
          >
            <Switch checkedChildren="Yayınlandı" unCheckedChildren="Taslak" />
          </Form.Item>

          <Divider>Eğitim Seçimi</Divider>
          <Typography.Text type="secondary" style={{ marginBottom: '16px', display: 'block' }}>
            Bu bootcamp'e dahil edilecek eğitimleri seçin. Seçili eğitimler mavi tik ile işaretlenir.
          </Typography.Text>

          {availableTrainingsLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin tip="Eğitimler yükleniyor..." />
            </div>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #f0f0f0', padding: '10px', borderRadius: '6px' }}>
              {availableTrainings.length > 0 ? (
                <List
                  dataSource={availableTrainings}
                  renderItem={training => (
                    <List.Item key={training.id} style={{ padding: '8px 0' }}>
                      <Checkbox
                        checked={selectedTrainings.includes(training.id.toString())}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedTrainings(prev => [...prev, training.id.toString()]);
                          } else {
                            setSelectedTrainings(prev => prev.filter(id => id !== training.id.toString()));
                          }
                        }}
                        style={{ marginRight: '8px' }}
                      />
                      <span style={{ 
                        fontWeight: selectedTrainings.includes(training.id.toString()) ? 600 : 400,
                        color: selectedTrainings.includes(training.id.toString()) ? '#1890ff' : 'inherit'
                      }}>
                        {training.title}
                      </span>
                      <Tag color="blue" style={{ marginLeft: '8px' }}>{training.category}</Tag>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty 
                  description="Hiç eğitim bulunamadı. Öncelikle eğitim ekleyin." 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>
          )}

          {selectedTrainings.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <Typography.Text strong>
                {selectedTrainings.length} eğitim seçildi
              </Typography.Text>
              <Button 
                type="link" 
                danger 
                onClick={() => setSelectedTrainings([])}
                style={{ marginLeft: '8px' }}
              >
                Tümünü Temizle
              </Button>
            </div>
          )}
        </Form>
      </Modal>

      {}
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={`${isBootcampMode ? 'Bootcamp' : 'Eğitim'} Siliniyor`}
        message={`Bu ${isBootcampMode ? 'bootcamp' : 'eğitim'}i silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText={`Evet, ${isBootcampMode ? 'Bootcamp' : 'Eğitim'}i Sil`}
        danger={true}
      />
    </div>
  );
};
export default AdminTrainingsPage;
