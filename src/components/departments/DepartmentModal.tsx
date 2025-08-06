import React, { useEffect, useState } from 'react';
import { Department } from '../../types';
import axios from 'axios';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}


const DepartmentModal: React.FC<DepartmentModalProps> = ({ isOpen, onClose, onSave }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newDepartment, setNewDepartment] = useState({ name: '' });
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  
  useEffect(() => {
    if (!isOpen) {
      setNewDepartment({ name: '' });
      setEditingDepartment(null);
      setError(null);
    }
  }, [isOpen]);

  
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/departments`);
      setDepartments(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error('Departmanları yükleme hatası:', err);
      setError(err.message || 'Departmanlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
    }
  }, [isOpen]);

  
  const handleCreateDepartment = async () => {
    try {
      if (!newDepartment.name.trim()) {
        setError('Departman adı boş olamaz');
        return;
      }

      setLoading(true);
      setError(null);
      
      await axios.post(`${API_URL}/departments`, { name: newDepartment.name.trim() });
      
      setNewDepartment({ name: '' });
      await fetchDepartments();
    } catch (err: any) {
      console.error('Departman oluşturma hatası:', err);
      setError(err.message || 'Departman oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  
  const handleUpdateDepartment = async () => {
    try {
      if (!editingDepartment || !editingDepartment.name.trim()) {
        setError('Departman adı boş olamaz');
        return;
      }

      setLoading(true);
      setError(null);
      
      await axios.put(`${API_URL}/departments/${editingDepartment.id}`, { name: editingDepartment.name.trim() });
      
      setEditingDepartment(null);
      await fetchDepartments();
    } catch (err: any) {
      console.error('Departman güncelleme hatası:', err);
      setError(err.message || 'Departman güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  
  const handleDeleteDepartment = async (id: number) => {
    try {
      if (!window.confirm('Bu departmanı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
        return;
      }

      setLoading(true);
      setError(null);
      
      await axios.delete(`${API_URL}/departments/${id}`);
      
      await fetchDepartments();
    } catch (err: any) {
      console.error('Departman silme hatası:', err);
      setError(err.message || 'Departman silinirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Departman Yönetimi</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded">
              <p className="font-medium">Hata</p>
              <p>{error}</p>
            </div>
          )}

          {}
          <div className="mb-8 p-4 border rounded bg-gray-50">
            <h3 className="text-lg font-medium mb-4">Yeni Departman Ekle</h3>
            <div className="flex flex-col space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departman Adı *
                </label>
                <input
                  type="text"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Departman adı"
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleCreateDepartment}
                disabled={loading || !newDepartment.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Ekleniyor...' : 'Departman Ekle'}
              </button>
            </div>
          </div>

          {}
          <div>
            <h3 className="text-lg font-medium mb-4">Mevcut Departmanlar</h3>
            {loading && departments.length === 0 ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full w-6 h-6 border-2 border-t-blue-600 border-gray-200 mx-auto"></div>
                <p className="mt-2 text-gray-600">Departmanlar yükleniyor...</p>
              </div>
            ) : departments.length === 0 ? (
              <p className="text-gray-500 py-4">Henüz departman bulunmuyor.</p>
            ) : (
              <div className="border rounded overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Departman Adı
                      </th>

                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {departments.map((department) => (
                      <tr key={department.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {department.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {editingDepartment?.id === department.id ? (
                            <input
                              type="text"
                              value={editingDepartment.name}
                              onChange={(e) => setEditingDepartment({...editingDepartment, name: e.target.value})}
                              className="w-full p-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              disabled={loading}
                            />
                          ) : (
                            department.name
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          {editingDepartment?.id === department.id ? (
                            <div className="flex space-x-2 justify-end">
                              <button
                                onClick={handleUpdateDepartment}
                                disabled={loading || !editingDepartment.name.trim()}
                                className="text-green-600 hover:text-green-800 disabled:opacity-50"
                              >
                                Kaydet
                              </button>
                              <button
                                onClick={() => setEditingDepartment(null)}
                                disabled={loading}
                                className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
                              >
                                İptal
                              </button>
                            </div>
                          ) : (
                            <div className="flex space-x-3 justify-end">
                              <button
                                onClick={() => setEditingDepartment(department)}
                                disabled={loading || !!editingDepartment}
                                className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                              >
                                Düzenle
                              </button>
                              <button
                                onClick={() => handleDeleteDepartment(department.id)}
                                disabled={loading || !!editingDepartment}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                              >
                                Sil
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={() => {
                onSave();
                onClose();
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentModal;
