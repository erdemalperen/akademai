import React, { useState, useEffect } from 'react';
import { Table, Button, Spin, Alert, Space, Typography, Modal, Form, Input, Select, InputNumber, Switch, message, DatePicker, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import { tokenService } from '../../lib/api/apiClient';

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
  'Liderlik ve Yönetim',
  'Kişisel Gelişim'
];

interface BootcampFormValues {
  title: string;
  description: string;
  category: string;
  duration: number;
  author: string;
  published: boolean;
  deadline: Dayjs | null;
}


interface Bootcamp {
  id: string;
  title: string;
  description?: string;
  category?: string;
  author?: string;
  published?: boolean;
  duration?: number;
  deadline?: string;
  createdAt?: string;
  updatedAt?: string;
}

const AdminBootcampsPage: React.FC = () => {
  const [bootcamps, setBootcamps] = useState<Bootcamp[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingBootcamp, setEditingBootcamp] = useState<Bootcamp | null>(null);
  const [form] = Form.useForm();
  
  const navigate = useNavigate();
  
  
  const fetchBootcamps = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/bootcamps', {
        headers: {
          Authorization: `Bearer ${tokenService.getToken()}`
        }
      });
      
      setBootcamps(response.data);
    } catch (err: any) {
      console.error('Bootcampleri getirirken hata oluştu:', err);
      setError(err.response?.data?.message || 'Bootcampleri getirirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  
  useEffect(() => {
    fetchBootcamps();
  }, []);
  
  
  const handleModalCancel = () => {
    form.resetFields();
    setEditingBootcamp(null);
    setModalVisible(false);
  };
  
  
  const handleAddBootcamp = () => {
    form.resetFields();
    setEditingBootcamp(null);
    setModalVisible(true);
  };
  
  
  const handleEditBootcamp = (bootcamp: Bootcamp) => {
    setEditingBootcamp(bootcamp);
    
    
    form.setFieldsValue({
      ...bootcamp,
      deadline: bootcamp.deadline ? dayjs(bootcamp.deadline) : null
    });
    
    setModalVisible(true);
  };
  
  
  const handleFormSubmit = async (values: BootcampFormValues) => {
    try {
      const formData = {
        ...values,
        deadline: values.deadline ? values.deadline.toISOString() : undefined
      };
      
      if (editingBootcamp) {
        
        await axios.put(`/api/bootcamps/${editingBootcamp.id}`, formData, {
          headers: {
            Authorization: `Bearer ${tokenService.getToken()}`
          }
        });
        
        message.success('Bootcamp başarıyla güncellendi');
      } else {
        
        await axios.post('/api/bootcamps', formData, {
          headers: {
            Authorization: `Bearer ${tokenService.getToken()}`
          }
        });
        
        message.success('Bootcamp başarıyla oluşturuldu');
      }
      
      
      handleModalCancel();
      fetchBootcamps();
    } catch (err: any) {
      console.error('Bootcamp kaydedilirken hata oluştu:', err);
      message.error(err.response?.data?.message || 'Bootcamp kaydedilirken bir hata oluştu');
    }
  };
  
  
  const handleDeleteBootcamp = async (bootcampId: string) => {
    try {
      Modal.confirm({
        title: 'Bootcamp\'i silmek istediğinize emin misiniz?',
        content: 'Bu işlem geri alınamaz ve tüm ilgili veriler silinecektir.',
        okText: 'Evet, Sil',
        okType: 'danger',
        cancelText: 'İptal',
        onOk: async () => {
          await axios.delete(`/api/bootcamps/${bootcampId}`, {
            headers: {
              Authorization: `Bearer ${tokenService.getToken()}`
            }
          });
          
          message.success('Bootcamp başarıyla silindi');
          fetchBootcamps();
        }
      });
    } catch (err: any) {
      console.error('Bootcamp silinirken hata oluştu:', err);
      message.error(err.response?.data?.message || 'Bootcamp silinirken bir hata oluştu');
    }
  };
  
  
  const handleViewBootcamp = (bootcampId: string) => {
    
    navigate(`/dashboard/bootcamps/${bootcampId}`);
  };
  
  
  const columns = [
    {
      title: 'Başlık',
      dataIndex: 'title',
      key: 'title',
      sorter: (a: any, b: any) => a.title.localeCompare(b.title)
    },
    {
      title: 'Kategori',
      dataIndex: 'category',
      key: 'category',
      filters: categoryOptions.map(category => ({ text: category, value: category })),
      onFilter: (value: any, record: any) => record.category === value
    },
    {
      title: 'Yazar',
      dataIndex: 'author',
      key: 'author'
    },
    {
      title: 'Süre (gün)',
      dataIndex: 'duration',
      key: 'duration',
      sorter: (a: any, b: any) => (a.duration || 0) - (b.duration || 0)
    },
    {
      title: 'Son Tarih',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (text: string) => text ? dayjs(text).format('DD.MM.YYYY') : '-',
      sorter: (a: any, b: any) => {
        if (!a.deadline) return -1;
        if (!b.deadline) return 1;
        return dayjs(a.deadline).unix() - dayjs(b.deadline).unix();
      }
    },
    {
      title: 'Yayında',
      dataIndex: 'published',
      key: 'published',
      render: (published: boolean) => published ? 'Evet' : 'Hayır',
      filters: [
        { text: 'Evet', value: true },
        { text: 'Hayır', value: false }
      ],
      onFilter: (value: any, record: any) => record.published === value
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => handleViewBootcamp(record.id)}
            title="Görüntüle"
          />
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEditBootcamp(record)}
            title="Düzenle"
          />
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDeleteBootcamp(record.id)}
            title="Sil"
          />
        </Space>
      )
    }
  ] as any;
  
  return (
    <div>
      <Title level={2}>Bootcamp Yönetimi</Title>
      <Button 
        type="primary" 
        icon={<PlusOutlined />} 
        onClick={handleAddBootcamp}
        style={{ marginBottom: 16 }}
      >
        Yeni Bootcamp Ekle
      </Button>
      
      {error && (
        <Alert 
          message="Hata" 
          description={error} 
          type="error" 
          showIcon 
          className="mb-4"
          closable
        />
      )}
      
      <div className="bg-white p-6 rounded-lg shadow">
        {loading ? (
          <div className="flex justify-center items-center p-10">
            <Spin size="large" tip="Bootcampler yükleniyor..." />
          </div>
        ) : (
          <Table 
            columns={columns} 
            dataSource={bootcamps.map(bootcamp => ({ ...bootcamp, key: bootcamp.id }))} 
            rowKey="id"
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} bootcamp`
            }}
          />
        )}
      </div>
      
      {}
      <Modal
        title={editingBootcamp ? 'Bootcamp Düzenle' : 'Yeni Bootcamp Ekle'}
        open={modalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{
            published: false
          }}
        >
          <Form.Item
            name="title"
            label="Başlık"
            rules={[{ required: true, message: 'Lütfen bootcamp başlığını girin' }]}
          >
            <Input placeholder="Bootcamp başlığını girin" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Açıklama"
          >
            <TextArea rows={4} placeholder="Bootcamp açıklamasını girin" />
          </Form.Item>
          
          <Form.Item
            name="category"
            label="Kategori"
          >
            <Select placeholder="Kategori seçin">
              {categoryOptions.map(category => (
                <Option key={category} value={category}>{category}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="author"
            label="Eğitmen/Yazar"
          >
            <Input placeholder="Eğitmen veya yazar adını girin" />
          </Form.Item>
          
          <Form.Item
            name="duration"
            label="Süre (Gün)"
          >
            <InputNumber min={1} placeholder="Tahmini süre (gün)" style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="deadline"
            label="Son Tamamlanma Tarihi"
          >
            <DatePicker 
              placeholder="Son tamamlanma tarihi seçin" 
              style={{ width: '100%' }} 
              format="DD.MM.YYYY"
            />
          </Form.Item>
          
          <Form.Item
            name="published"
            label="Yayınla"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          
          <Divider />
          
          <div className="flex justify-end">
            <Button onClick={handleModalCancel} style={{ marginRight: 8 }}>
              İptal
            </Button>
            <Button type="primary" htmlType="submit">
              {editingBootcamp ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminBootcampsPage;
