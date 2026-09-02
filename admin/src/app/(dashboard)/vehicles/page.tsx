'use client';

import React, { useEffect, useState } from 'react';
import { getVehicleTypes, saveVehicleType } from '@/lib/supabase/admin';
import { formatCurrency } from '@/lib/utils';
import { Sliders, Truck, Plus, Edit2, Check, X, RefreshCcw } from 'lucide-react';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [capacityKg, setCapacityKg] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [isActive, setIsActive] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getVehicleTypes();
      setVehicles(data);
    } catch (err) {
      console.warn('Vehicles load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openModal = (vehicle?: any) => {
    if (vehicle) {
      setEditModal(vehicle);
      setName(vehicle.name || '');
      setDescription(vehicle.description || '');
      setCapacityKg(vehicle.capacity_kg ? vehicle.capacity_kg.toString() : '');
      setBasePrice(vehicle.base_price ? vehicle.base_price.toString() : '');
      setIsActive(vehicle.is_active ?? true);
    } else {
      setEditModal({ isNew: true });
      setName('');
      setDescription('');
      setCapacityKg('500');
      setBasePrice('30');
      setIsActive(true);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await saveVehicleType({
        id: editModal?.isNew ? undefined : editModal.id,
        name,
        description,
        capacity_kg: parseInt(capacityKg) || 0,
        base_price: parseFloat(basePrice) || 0,
        is_active: isActive,
      });
      await loadData();
      setEditModal(null);
    } catch (err: any) {
      alert(err.message || 'Failed to save vehicle type');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Vehicle & Service Type Configuration
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Configure vehicle payload capacities, base pricing models, and operational availability.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle Type</span>
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {vehicles.map((v) => (
          <div
            key={v.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                  <Truck className="w-6 h-6" />
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    v.is_active
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}
                >
                  {v.is_active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-white text-lg">{v.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{v.description || 'Standard waste collection vehicle'}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Payload Limit:</span>
                  <span className="text-white font-bold">{v.capacity_kg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Base Fare Price:</span>
                  <span className="text-emerald-400 font-bold">{formatCurrency(Number(v.base_price))}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => openModal(v)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Configuration</span>
            </button>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">
                {editModal.isNew ? 'Add New Vehicle Type' : 'Edit Vehicle Configuration'}
              </h3>
              <button onClick={() => setEditModal(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Vehicle Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Capacity (kg)</label>
                  <input
                    type="number"
                    required
                    value={capacityKg}
                    onChange={(e) => setCapacityKg(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Base Price (GH₵)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-300 font-semibold">Active in Fleet</span>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
              >
                {submitting ? 'Saving Configuration...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
