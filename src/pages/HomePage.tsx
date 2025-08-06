import React, { useState, useEffect } from 'react';
import { Card, Statistic, Spin, Alert } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { getMonthlyCompletedTrainingsCount } from '../services/statisticsApiService';

const HomePage: React.FC = () => {
  const [completedTrainings, setCompletedTrainings] = useState<number | undefined>(undefined);
  const [loadingCompletedTrainings, setLoadingCompletedTrainings] = useState<boolean>(true);
  const [errorCompletedTrainings, setErrorCompletedTrainings] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompletedTrainings = async () => {
      try {
        setLoadingCompletedTrainings(true);
        setErrorCompletedTrainings(null);
        const count = await getMonthlyCompletedTrainingsCount();
        setCompletedTrainings(count);
      } catch (err: any) {
        setErrorCompletedTrainings(err.message || 'Tamamlanan eğitim sayısı alınamadı.');
        setCompletedTrainings(0);
      } finally {
        setLoadingCompletedTrainings(false);
      }
    };

    fetchCompletedTrainings();
  }, []);

  return (
    <div>
      <Card title="Aylık İstatistikler" style={{ marginBottom: 20 }}>
        {loadingCompletedTrainings ? (
          <Spin tip="Tamamlanan eğitimler yükleniyor..." />
        ) : errorCompletedTrainings ? (
          <Alert message={errorCompletedTrainings} type="error" description="Veri yüklenirken bir sorun oluştu."/>
        ) : (
          <Statistic
            title="Bu Ay Tamamlanan Toplam Eğitim Sayısı"
            value={completedTrainings === undefined ? 0 : completedTrainings}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#3f8600' }}
          />
        )}
      </Card>
    </div>
  );
};

export default HomePage; 