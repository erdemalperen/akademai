import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Button, Space, Typography, Modal, Spin, Alert, message, Select, Tag, Form, Input, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import * as conferenceApiService from '../../services/conferenceApiService';
import * as employeeApiService from '../../services/employeeApiService';

import * as departmentApiService from '../../services/departmentApiService';
import { ConferenceTraining, User, Department } from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ConferenceAttendeesPage: React.FC = () => {
  const { conferenceId } = useParams<{ conferenceId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [conference, setConference] = useState<ConferenceTraining | null>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const [isAttendanceModalVisible, setAttendanceModalVisible] = useState<boolean>(false);
  const [currentAttendee, setCurrentAttendee] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!conferenceId) {
        setError('Konferans ID bulunamadı.');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [conferenceData, allEmployees, allDepartments] = await Promise.all([
          conferenceApiService.getConferenceById(conferenceId),
          employeeApiService.getAllEmployees(),
          departmentApiService.getAllDepartments()
        ]);

        setConference(conferenceData);
        if (conferenceData.attendees && Array.isArray(conferenceData.attendees)) {
          setAttendees(conferenceData.attendees);
        }
        setEmployees(allEmployees.filter((u: User) => u.role === 'EMPLOYEE'));
        setDepartments(allDepartments);
        setError(null);
      } catch (err: any) {
        console.error('Veri yüklenirken hata:', err);
        setError(err.message || 'Konferans bilgileri veya çalışanlar/departmanlar yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [conferenceId]);

  const handleAddAttendee = async () => {
    if (selectedUsers.length === 0 || !conferenceId) {
      message.error('Lütfen en az bir kullanıcı seçin!');
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const userId of selectedUsers) {
        try {
          await conferenceApiService.addAttendeeToConference(conferenceId, userId);
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

      const conferenceData = await conferenceApiService.getConferenceById(conferenceId);
      if (conferenceData.attendees && Array.isArray(conferenceData.attendees)) {
        setAttendees(conferenceData.attendees);
      }

      setAddModalVisible(false);
      setSelectedUsers([]);
      setSelectedDepartment(null);
    } catch (err: any) {
      console.error('Katılımcı eklenirken genel hata:', err);
      message.error('Katılımcılar eklenirken genel bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAttendee = async (userId: number) => {
    if (window.confirm('Bu katılımcıyı konferanstan çıkarmak istediğinizden emin misiniz?')) {
      try {
        await conferenceApiService.removeAttendeeFromConference(conferenceId!, userId);
        message.success('Katılımcı başarıyla çıkarıldı!');

        const conferenceData = await conferenceApiService.getConferenceById(conferenceId!);
        if (conferenceData.attendees && Array.isArray(conferenceData.attendees)) {
          setAttendees(conferenceData.attendees);
        }
      } catch (err: any) {
        console.error('Katılımcı çıkarılırken hata:', err);
        message.error(err.message || 'Katılımcı çıkarılırken bir hata oluştu.');
      }
    }
  };

  const showAttendanceModal = (attendee: any) => {
    setCurrentAttendee(attendee);

    form.setFieldsValue({
      attended: attendee.attended || false,
      notes: attendee.notes || ''
    });

    setAttendanceModalVisible(true);
  };

  const handleMarkAttendance = async (values: { attended: boolean; notes: string }) => {
    if (!currentAttendee || !conferenceId) {
      message.error('Katılımcı bilgisi bulunamadı!');
      return;
    }

    try {
      await conferenceApiService.markConferenceAttendance(
        conferenceId,
        currentAttendee.user_id,
        values.attended,
        values.notes
      );

      message.success('Katılım durumu başarıyla güncellendi!');

      const conferenceData = await conferenceApiService.getConferenceById(conferenceId);
      if (conferenceData.attendees && Array.isArray(conferenceData.attendees)) {
        setAttendees(conferenceData.attendees);
      }

      setAttendanceModalVisible(false);
      setCurrentAttendee(null);
    } catch (err: any) {
      console.error('Katılım durumu güncellenirken hata:', err);
      message.error(err.message || 'Katılım durumu güncellenirken bir hata oluştu.');
    }
  };

  const handleGoBack = () => {
    navigate('/dashboard/admin/conferences');
  };

  const columns = [
    {
      title: 'Ad Soyad',
      dataIndex: 'name',
      key: 'name',
      render: (_: any, record: any) => `${record.firstName || ''} ${record.lastName || ''}`
    },
    {
      title: 'E-posta',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Departman',
      dataIndex: 'department',
      key: 'department',
      render: (department: any) => department?.name || 'Belirtilmemiş'
    },
    {
      title: 'Pozisyon',
      dataIndex: 'position',
      key: 'position',
      render: (position: string) => position || 'Belirtilmemiş'
    },
    {
      title: 'Katılım Durumu',
      dataIndex: 'attended',
      key: 'attended',
      render: (attended: boolean) => (
        attended === true ?
          <Tag color="green" icon={<CheckCircleOutlined />}>Katıldı</Tag> :
          attended === false ?
            <Tag color="red" icon={<CloseCircleOutlined />}>Katılmadı</Tag> :
            <Tag color="blue">Belirlenmedi</Tag>
      )
    },
    {
      title: 'Notlar',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes: string) => (
        notes ?
          <Tooltip title={notes}>
            <Text ellipsis style={{ maxWidth: 150 }}>{notes}</Text>
          </Tooltip> :
          '-'
      )
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button onClick={() => showAttendanceModal(record)}>
            Katılım İşaretle
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveAttendee(record.user_id)}>
            Çıkar
          </Button>
        </Space>
      ),
    },
  ];

  const existingAttendeeIds = attendees.map(attendee => attendee.user_id);
  const selectableEmployees = employees
    .filter(employee => !existingAttendeeIds.includes(employee.id))
    .filter(employee => 
      !selectedDepartment || (employee.employee?.departmentId != null && employee.employee.departmentId.toString() === selectedDepartment)
    );

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={handleGoBack}>
          Konferans Listesine Dön
        </Button>
      </Space>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" tip="Yükleniyor..." />
        </div>
      ) : error ? (
        <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />
      ) : (
        <>
          <div style={{ marginBottom: 24 }}>
            <Title level={2}>
              {conference?.title || 'Konferans Detayları'}
            </Title>
            <Text type="secondary">
              {conference?.location || 'Konum belirtilmemiş'} | {' '}
              {conference?.startDate ? dayjs(conference.startDate).format('DD.MM.YYYY HH:mm') : 'Tarih belirtilmemiş'} - {' '}
              {conference?.endDate ? dayjs(conference.endDate).format('DD.MM.YYYY HH:mm') : ''}
            </Text>
            <div style={{ marginTop: 8 }}>
              <Text>{conference?.description || 'Açıklama bulunmuyor.'}</Text>
            </div>
          </div>

          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3}>Katılımcılar ({attendees.length})</Title>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalVisible(true)}>
              Katılımcı Ekle
            </Button>
          </div>

          <Table
            dataSource={attendees}
            columns={columns}
            rowKey={(record) => {
              if (!record || record.user_id === undefined || record.user_id === null) {
                console.warn('Katılımcı kaydında user_id eksik veya tanımsız:', record);
                return `invalid_key_${Math.random()}`;
              }
              return record.user_id.toString();
            }}
            loading={loading}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: 'Henüz katılımcı eklenmemiş.' }}
          />

          <Modal
            title="Katılımcı Ekle"
            visible={isAddModalVisible}
            onCancel={() => setAddModalVisible(false)}
            footer={[
              <Button key="back" onClick={() => setAddModalVisible(false)}>
                İptal
              </Button>,
              <Button key="submit" type="primary" loading={loading} onClick={handleAddAttendee} disabled={selectedUsers.length === 0}>
                Seçilenleri Ekle
              </Button>,
            ]}
          >
            <Form layout="vertical">
              <Form.Item label="Departmana Göre Filtrele">
                <Select
                  placeholder="Departman seçin"
                  onChange={(value) => setSelectedDepartment(value)}
                  allowClear
                  value={selectedDepartment}
                >
                  {departments.map(dep => (
                    <Option key={dep.id} value={dep.id.toString()}>{dep.name}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="Eklenecek Çalışanlar">
                <Select
                  mode="multiple"
                  placeholder="Çalışan seçin"
                  value={selectedUsers}
                  onChange={(values) => setSelectedUsers(values)}
                  style={{ width: '100%' }}
                >
                  {selectableEmployees.map(employee => (
                    <Option key={employee.id} value={employee.id}>
                      {`${employee.firstName} ${employee.lastName}`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            title="Katılım Durumunu İşaretle"
            visible={isAttendanceModalVisible}
            onCancel={() => {
              setAttendanceModalVisible(false);
              setCurrentAttendee(null);
            }}
            footer={null}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleMarkAttendance}
            >
              <Form.Item
                name="attended"
                label="Katılım Durumu"
                rules={[{ required: true, message: 'Lütfen katılım durumunu seçin!' }]}
              >
                <Select>
                  <Option value={true}>Katıldı</Option>
                  <Option value={false}>Katılmadı</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="notes"
                label="Notlar"
              >
                <TextArea rows={4} placeholder="İsteğe bağlı notlar..." />
              </Form.Item>

              <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                <Button style={{ marginRight: 8 }} onClick={() => setAttendanceModalVisible(false)}>
                  İptal
                </Button>
                <Button type="primary" htmlType="submit">
                  Kaydet
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </>
      )}
    </div>
  );
};

export default ConferenceAttendeesPage;
