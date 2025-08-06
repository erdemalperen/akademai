import React from 'react';
import TrainingDetail from '../components/training/TrainingDetail';
import { useParams } from 'react-router-dom';

const TrainingDetailPage: React.FC = () => {
  
  const { trainingId } = useParams<{ trainingId: string }>();
  
  return <TrainingDetail trainingId={trainingId || ''} />;
};

export default TrainingDetailPage;