import React from 'react';
import LanguageLearningAssistant from '../components/language/LanguageLearningAssistant';

export default function LanguageLearningPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <LanguageLearningAssistant />
      </div>
    </div>
  );
}