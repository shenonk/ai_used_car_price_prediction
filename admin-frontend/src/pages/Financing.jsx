import React, { useState } from 'react';

const mockData = [
  { id: 1, logo: 'https://ui-avatars.com/api/?name=LOLC+Finance&background=0284c7&color=fff', name: 'LOLC Finance', type: 'Leasing', fixedRate: 15.5, floatingRate: 16.0, status: 'Active' },
  { id: 2, logo: 'https://ui-avatars.com/api/?name=Commercial+Bank&background=10b981&color=fff', name: 'Commercial Bank', type: 'Personal Loan', fixedRate: 14.0, floatingRate: 14.5, status: 'Active' },
  { id: 3, logo: 'https://ui-avatars.com/api/?name=Peoples+Bank&background=e11d48&color=fff', name: 'Peoples Bank', type: 'Leasing', fixedRate: 16.0, floatingRate: 17.5, status: 'Inactive' },
];

export default function Financing() {
  const [facilities, setFacilities] = useState(mockData);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleStatus = (id) => {
    setFacilities(facilities.map(f => 
      f.id === id ? { ...f, status: f.status === 'Active' ? 'Inactive' : 'Active' } : f
    ));
  };

  const updateRate = (id, field, value) => {
    setFacilities(facilities.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Finance Control Center</h1>
          <p className="text-sm text-gray-400 mt-1">Manage bank and lender financing rates</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Bank/Lender
        </button>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Institution</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fixed Rate (%)</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Floating Rate (%)</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {facilities.map((facility) => (
                <tr key={facility.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <img src={facility.logo} alt={facility.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
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
                      value={facility.fixedRate}
                      onChange={(e) => updateRate(facility.id, 'fixedRate', e.target.value)}
                      className="w-24 bg-white/5 border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                      step="0.1"
                    />
                  </td>
                  <td className="py-4 px-6">
                    <input
                      type="number"
                      value={facility.floatingRate}
                      onChange={(e) => updateRate(facility.id, 'floatingRate', e.target.value)}
                      className="w-24 bg-white/5 border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                      step="0.1"
                    />
                  </td>
                  <td className="py-4 px-6 text-sm">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleStatus(facility.id)}
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
                      <button className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
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
      </div>

      {/* Add New Facility Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-semibold text-white mb-6">Add New Bank/Lender</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Institution Name</label>
                <input
                  type="text"
                  placeholder="e.g. LOLC Finance"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Interest Rate (%)</label>
                  <input
                    type="number"
                    placeholder="e.g. 15.5"
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Max LTV (%)</label>
                  <input
                    type="number"
                    placeholder="e.g. 70"
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Bank Logo</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/10 border-dashed rounded-xl cursor-pointer hover:bg-white/5 hover:border-blue-500/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                      </svg>
                      <p className="mb-2 text-sm text-gray-400"><span className="font-semibold text-blue-400">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                    </div>
                    <input type="file" className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors shadow-lg shadow-blue-500/20"
              >
                Save Facility
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
