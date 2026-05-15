import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const getEmptyFacilityForm = () => ({
  name: '',
  type: 'Leasing',
  fixedRate: '',
  floatingRate: '',
  maxLtv: '',
  status: 'Active',
  logoFile: null
});

export default function Financing() {
  const [facilities, setFacilities] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newFacility, setNewFacility] = useState(getEmptyFacilityForm);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/api/admin/financing-options');
      setFacilities(data?.facilities || []);
    } catch (error) {
      console.error('Error fetching facilities:', error);
      alert('Failed to load facilities.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      await api.put(`/api/admin/financing-options/${id}`, { status: newStatus });
      setFacilities(facilities.map(f => 
        f.id === id ? { ...f, status: newStatus } : f
      ));
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update status.');
    }
  };

  const handleRateLocalChange = (id, field, value) => {
    setFacilities(facilities.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  const handleRateBlur = async (id, field, value) => {
    try {
      const dbField = field === 'fixedRate' ? 'fixed_rate' : 'floating_rate';
      const numericValue = parseFloat(value) || 0;
      await api.put(`/api/admin/financing-options/${id}`, { [dbField]: numericValue });
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      alert('Failed to update rate. Reverting to original value.');
      fetchFacilities(); // Refresh to get correct value
    }
  };

  const handleDelete = async (id, logoUrl) => {
    if (!window.confirm('Are you sure you want to delete this facility?')) return;
    
    try {
      await api.delete(`/api/admin/financing-options/${id}`);
      setFacilities(facilities.filter(f => f.id !== id));
    } catch (error) {
      console.error('Error deleting facility:', error);
      alert('Failed to delete facility.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewFacility({ ...newFacility, logoFile: file });
    }
  };

  const openCreateModal = () => {
    setEditingFacility(null);
    setNewFacility(getEmptyFacilityForm());
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsModalOpen(true);
  };

  const openEditModal = (facility) => {
    setEditingFacility(facility);
    setNewFacility({
      name: facility.name || '',
      type: facility.type || 'Leasing',
      fixedRate: facility.fixed_rate ?? '',
      floatingRate: facility.floating_rate ?? '',
      maxLtv: facility.max_ltv ?? '',
      status: facility.status || 'Active',
      logoFile: null
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsModalOpen(true);
  };

  const closeModal = (force = false) => {
    if (isSubmitting && !force) return;
    setIsModalOpen(false);
    setEditingFacility(null);
    setNewFacility(getEmptyFacilityForm());
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const saveFacility = async () => {
    if (!newFacility.name) {
      alert('Institution Name is required');
      return;
    }
    
    try {
      setIsSubmitting(true);

      if (editingFacility) {
        const payload = {
          name: newFacility.name.trim(),
          type: newFacility.type,
          fixed_rate: parseFloat(newFacility.fixedRate) || 0,
          floating_rate: parseFloat(newFacility.floatingRate) || 0,
          max_ltv: parseFloat(newFacility.maxLtv) || 0,
          status: newFacility.status
        };

        const { data } = await api.put(`/api/admin/financing-options/${editingFacility.id}`, payload);
        const updatedFacility = data?.facility || { ...editingFacility, ...payload };
        setFacilities(facilities.map((facility) => (
          facility.id === editingFacility.id ? { ...facility, ...updatedFacility } : facility
        )));
        closeModal(true);
        return;
      }

      const formData = new FormData();
      formData.append('name', newFacility.name);
      formData.append('type', newFacility.type);
      formData.append('fixed_rate', String(parseFloat(newFacility.fixedRate) || 0));
      formData.append('floating_rate', String(parseFloat(newFacility.floatingRate) || 0));
      formData.append('max_ltv', String(parseFloat(newFacility.maxLtv) || 0));
      if (newFacility.logoFile) {
        formData.append('logo_file', newFacility.logoFile);
      }

      const { data } = await api.post('/api/admin/financing-options', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setFacilities([data.facility, ...facilities]);
      closeModal(true);
      
    } catch (error) {
      console.error('Error saving facility:', error);
      alert('Failed to save facility.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Finance Control Center</h1>
          <p className="text-sm text-gray-400 mt-1">Manage bank and lender financing rates</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Bank/Lender
        </button>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : facilities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-400">
            <svg className="w-16 h-16 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium text-white mb-1">No Financing Options found.</p>
            <p className="text-sm">Add a new bank/lender to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Institution</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fixed Rate (%)</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Floating Rate (%)</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Max LTV (%)</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {facilities.map((facility) => (
                  <tr key={facility.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img src={facility.logo_url} alt={facility.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                        <span className="font-medium text-white">{facility.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-300">
                      <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium border border-white/5">
                        {facility.type}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <input
                        type="number"
                        value={facility.fixed_rate ?? ''}
                        onChange={(e) => handleRateLocalChange(facility.id, 'fixed_rate', e.target.value)}
                        onBlur={(e) => handleRateBlur(facility.id, 'fixedRate', e.target.value)}
                        className="w-24 bg-white/5 border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                        step="0.1"
                        min="0"
                      />
                    </td>
                    <td className="py-4 px-6">
                      <input
                        type="number"
                        value={facility.floating_rate ?? ''}
                        onChange={(e) => handleRateLocalChange(facility.id, 'floating_rate', e.target.value)}
                        onBlur={(e) => handleRateBlur(facility.id, 'floatingRate', e.target.value)}
                        className="w-24 bg-white/5 border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                        step="0.1"
                        min="0"
                      />
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-300">
                      {facility.max_ltv ?? '0'}%
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleStatus(facility.id, facility.status)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0b1120] ${
                            facility.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              facility.status === 'Active' ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`font-medium ${facility.status === 'Active' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {facility.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(facility)}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                          title="Edit facility"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(facility.id, facility.logo_url)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Delete facility"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Facility Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-semibold text-white mb-6">
              {editingFacility ? 'Edit Bank/Lender' : 'Add New Bank/Lender'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Institution Name *</label>
                <input
                  type="text"
                  placeholder="e.g. LOLC Finance"
                  value={newFacility.name}
                  onChange={(e) => setNewFacility({...newFacility, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Type *</label>
                <select
                  value={newFacility.type}
                  onChange={(e) => setNewFacility({...newFacility, type: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors [&>option]:bg-gray-900"
                >
                  <option value="Leasing">Leasing</option>
                  <option value="Personal Loan">Personal Loan</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              {editingFacility && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Status *</label>
                  <select
                    value={newFacility.status}
                    onChange={(e) => setNewFacility({...newFacility, status: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors [&>option]:bg-gray-900"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Fixed Rate (%)</label>
                  <input
                    type="number"
                    placeholder="e.g. 15.5"
                    step="0.1"
                    min="0"
                    value={newFacility.fixedRate}
                    onChange={(e) => setNewFacility({...newFacility, fixedRate: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Floating Rate (%)</label>
                  <input
                    type="number"
                    placeholder="e.g. 16.0"
                    step="0.1"
                    min="0"
                    value={newFacility.floatingRate}
                    onChange={(e) => setNewFacility({...newFacility, floatingRate: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Max LTV (%)</label>
                  <input
                    type="number"
                    placeholder="e.g. 70"
                    min="0"
                    max="100"
                    value={newFacility.maxLtv}
                    onChange={(e) => setNewFacility({...newFacility, maxLtv: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              {!editingFacility && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Bank Logo (Optional)</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/10 border-dashed rounded-xl cursor-pointer hover:bg-white/5 hover:border-blue-500/50 transition-colors overflow-hidden relative">
                    {newFacility.logoFile ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
                        <p className="font-medium text-white truncate px-4">{newFacility.logoFile.name}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                        </svg>
                        <p className="mb-2 text-sm text-gray-400"><span className="font-semibold text-blue-400">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-500">PNG, JPG or WEBP</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/png, image/jpeg, image/webp" 
                      onChange={handleFileChange} 
                      ref={fileInputRef}
                    />
                  </label>
                </div>
              </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={saveFacility}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  editingFacility ? 'Update Facility' : 'Save Facility'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
