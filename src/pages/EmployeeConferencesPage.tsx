import React, { useState, useEffect } from 'react';
import { getUserConferences } from '../services/conferenceApiService'; 
import { ConferenceTraining } from '../types'; 

const EmployeeConferencesPage: React.FC = () => {
  const [conferences, setConferences] = useState<ConferenceTraining[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyConferences = async () => {
      try {
        setLoading(true);
        
        const fetchedConferences = await getUserConferences(); 
        setConferences(fetchedConferences);
        setError(null);
      } catch (err: any) {
        console.error('Konferanslar yüklenirken hata:', err);
        setError('Konferanslar yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyConferences();
  }, []);

  if (loading) {
    return <div className="p-6">Konferanslar yükleniyor...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Hata: {error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Katıldığım Konferans Eğitimleri</h1>
      {conferences.length === 0 ? (
        <p>Henüz katıldığınız bir konferans eğitimi bulunmamaktadır.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="py-3 px-4 border-b text-left">Konferans Adı</th>
                <th className="py-3 px-4 border-b text-left">Tarih</th>
                <th className="py-3 px-4 border-b text-left">Konum</th>
                <th className="py-3 px-4 border-b text-left">Konuşmacı</th>
                {}
              </tr>
            </thead>
            <tbody>
              {conferences.map((conference) => (
                <tr key={conference.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="py-3 px-4 border-b">{conference.title}</td>
                  <td className="py-3 px-4 border-b">
                    {new Date(conference.startDate).toLocaleDateString()} - {new Date(conference.endDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 border-b">{conference.location}</td>
                  <td className="py-3 px-4 border-b">{conference.author}</td>
                  {}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeeConferencesPage;
