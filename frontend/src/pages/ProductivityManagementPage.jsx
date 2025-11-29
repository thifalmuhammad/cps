import React, { useState, useEffect } from 'react';
import { farmAPI, productivityAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';

export default function ProductivityManagementPage() {
    const { user } = useAuth();
    const [myFarms, setMyFarms] = useState([]);
    const [myProductivities, setMyProductivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form states
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        farmId: '',
        harvestDate: '',
        productionAmount: '',
        sellingPrice: '',
        productivity: '',
    });

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Get user's farms
                const farmsRes = await farmAPI.getAll();
                const allFarms = farmsRes.data || [];
                const userFarms = allFarms.filter(f => f.farmerId === user?.uuid);
                setMyFarms(userFarms);

                // Get user's productivity records
                const prodRes = await productivityAPI.getAll();
                const allProds = prodRes.data || [];
                const userProds = allProds.filter(p =>
                    userFarms.some(f => f.uuid === p.farmId)
                );
                setMyProductivities(userProds);

                setError(null);
            } catch (err) {
                console.error('❌ Error fetching data:', err);
                setError(err.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        if (user?.uuid) fetchData();
    }, [user?.uuid]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            // Validation
            if (!formData.farmId || !formData.harvestDate || !formData.productionAmount ||
                !formData.sellingPrice || !formData.productivity) {
                setError('❌ Please fill in all fields');
                setSaving(false);
                return;
            }

            const submitData = {
                farmId: formData.farmId,
                harvestDate: new Date(formData.harvestDate).toISOString(),
                productionAmount: parseFloat(formData.productionAmount),
                sellingPrice: parseFloat(formData.sellingPrice),
                productivity: parseFloat(formData.productivity),
            };

            if (editingId) {
                // Update
                await productivityAPI.update(editingId, submitData);
                setSuccess('✅ Productivity record updated successfully!');
            } else {
                // Create
                await productivityAPI.create(submitData);
                setSuccess('✅ Productivity record created successfully!');
            }

            // Refresh data
            const prodRes = await productivityAPI.getAll();
            const allProds = prodRes.data || [];
            const userProds = allProds.filter(p =>
                myFarms.some(f => f.uuid === p.farmId)
            );
            setMyProductivities(userProds);

            // Reset form
            setFormData({
                farmId: '',
                harvestDate: '',
                productionAmount: '',
                sellingPrice: '',
                productivity: '',
            });
            setEditingId(null);
            setShowForm(false);

            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('❌ Error saving productivity:', err);
            setError(err.message || 'Failed to save productivity record');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (prod) => {
        setEditingId(prod.uuid);
        setFormData({
            farmId: prod.farmId,
            harvestDate: new Date(prod.harvestDate).toISOString().split('T')[0],
            productionAmount: prod.productionAmount.toString(),
            sellingPrice: prod.sellingPrice.toString(),
            productivity: prod.productivity.toString(),
        });
        setShowForm(true);
    };

    const handleDelete = async (prodId) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;

        try {
            setSaving(true);
            await productivityAPI.delete(prodId);
            setSuccess('✅ Productivity record deleted successfully!');

            const prodRes = await productivityAPI.getAll();
            const allProds = prodRes.data || [];
            const userProds = allProds.filter(p =>
                myFarms.some(f => f.uuid === p.farmId)
            );
            setMyProductivities(userProds);

            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message || 'Failed to delete record');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({
            farmId: '',
            harvestDate: '',
            productionAmount: '',
            sellingPrice: '',
            productivity: '',
        });
    };

    const farmMap = Object.fromEntries(myFarms.map(f => [f.uuid, f]));
    const totalProduction = myProductivities.reduce((sum, p) => sum + p.productionAmount, 0);
    const totalRevenue = myProductivities.reduce((sum, p) => sum + (p.productionAmount * p.sellingPrice), 0);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header Section */}
            <div className="bg-white border-b border-slate-200">
                <div className="px-8 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">📊 Manage Productivity</h1>
                            <p className="text-sm text-slate-600 mt-1">Record and track your harvest results</p>
                        </div>
                        <Button
                            onClick={() => setShowForm(!showForm)}
                            className="gap-2"
                        >
                            {showForm ? '✖ Cancel' : '+ Add Record'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-8 py-8">
                {/* Success/Error Alerts */}
                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center justify-between">
                        <span>{success}</span>
                        <button onClick={() => setSuccess(null)} className="text-green-700 hover:text-green-900">✕</button>
                    </div>
                )}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between">
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">✕</button>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card variant="elevated">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Total Harvest</p>
                                <p className="text-3xl font-bold text-slate-900 mt-2">{totalProduction.toFixed(2)}</p>
                                <p className="text-xs text-slate-500 mt-2">kg harvested</p>
                            </div>
                            <span className="text-4xl">🌾</span>
                        </div>
                    </Card>

                    <Card variant="elevated">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                                <p className="text-3xl font-bold text-slate-900 mt-2">Rp {(totalRevenue / 1000000).toFixed(2)}M</p>
                                <p className="text-xs text-slate-500 mt-2">from sales</p>
                            </div>
                            <span className="text-4xl">💰</span>
                        </div>
                    </Card>

                    <Card variant="elevated">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Records</p>
                                <p className="text-3xl font-bold text-slate-900 mt-2">{myProductivities.length}</p>
                                <p className="text-xs text-slate-500 mt-2">logged entries</p>
                            </div>
                            <span className="text-4xl">📋</span>
                        </div>
                    </Card>
                </div>

                {/* Add/Edit Form */}
                {showForm && (
                    <Card className="mb-8 p-6 border-2 border-blue-200 bg-blue-50">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">
                            {editingId ? '✏️ Edit Productivity Record' : '➕ Add New Productivity Record'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Farm Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Farm *</label>
                                    <select
                                        name="farmId"
                                        value={formData.farmId}
                                        onChange={handleInputChange}
                                        disabled={editingId}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Choose a farm...</option>
                                        {myFarms.map(farm => (
                                            <option key={farm.uuid} value={farm.uuid}>
                                                {farm.district?.districtName} - {farm.farmArea} ha
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Harvest Date */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Harvest Date *</label>
                                    <input
                                        type="date"
                                        name="harvestDate"
                                        value={formData.harvestDate}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                {/* Production Amount */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Production Amount (kg) *</label>
                                    <input
                                        type="number"
                                        name="productionAmount"
                                        value={formData.productionAmount}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                {/* Selling Price */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price (Rp/kg) *</label>
                                    <input
                                        type="number"
                                        name="sellingPrice"
                                        value={formData.sellingPrice}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                {/* Productivity */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Productivity (kg/ha) *</label>
                                    <input
                                        type="number"
                                        name="productivity"
                                        value={formData.productivity}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-200">
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1"
                                >
                                    {saving ? '💾 Saving...' : (editingId ? '💾 Update' : '➕ Create')}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleCancel}
                                    variant="outline"
                                    disabled={saving}
                                    className="flex-1"
                                >
                                    ✖ Cancel
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Productivity Records List */}
                <Card>
                    <div className="border-b border-slate-200 pb-4 mb-4">
                        <h2 className="text-lg font-bold text-slate-900">Your Productivity Records</h2>
                        <p className="text-sm text-slate-600 mt-1">{myProductivities.length} record(s) found</p>
                    </div>

                    {loading ? (
                        <div className="text-center py-8">
                            <p className="text-slate-600">⏳ Loading records...</p>
                        </div>
                    ) : myProductivities.length > 0 ? (
                        <div className="space-y-3">
                            {myProductivities.map((prod) => {
                                const farm = farmMap[prod.farmId];
                                const harvestDate = new Date(prod.harvestDate).toLocaleDateString('id-ID');
                                const revenue = (prod.productionAmount * prod.sellingPrice).toLocaleString('id-ID', {
                                    style: 'currency',
                                    currency: 'IDR',
                                    maximumFractionDigits: 0
                                });

                                return (
                                    <div
                                        key={prod.uuid}
                                        className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="font-semibold text-slate-900">
                                                    📍 {farm?.district?.districtName}
                                                </p>
                                                <p className="text-xs text-slate-600 mt-1">
                                                    📅 {harvestDate}
                                                </p>
                                            </div>
                                            <Badge variant="success">Recorded</Badge>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-slate-200">
                                            <div>
                                                <p className="text-xs text-slate-600 font-medium">Production</p>
                                                <p className="font-bold text-slate-900 mt-1">{prod.productionAmount.toFixed(2)}</p>
                                                <p className="text-xs text-slate-600">kg</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-600 font-medium">Price/kg</p>
                                                <p className="font-bold text-slate-900 mt-1">Rp {prod.sellingPrice.toLocaleString('id-ID')}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-600 font-medium">Total Revenue</p>
                                                <p className="font-bold text-slate-900 mt-1">{revenue}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-600 font-medium">Productivity</p>
                                                <p className="font-bold text-slate-900 mt-1">{prod.productivity.toFixed(2)}</p>
                                                <p className="text-xs text-slate-600">kg/ha</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                                            <Button
                                                onClick={() => handleEdit(prod)}
                                                variant="outline"
                                                size="sm"
                                                disabled={saving}
                                                className="flex-1"
                                            >
                                                ✏️ Edit
                                            </Button>
                                            <Button
                                                onClick={() => handleDelete(prod.uuid)}
                                                variant="outline"
                                                size="sm"
                                                disabled={saving}
                                                className="flex-1 text-red-600 hover:text-red-700"
                                            >
                                                🗑️ Delete
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-4xl mb-4">📊</p>
                            <p className="text-slate-600 mb-4 font-medium">No productivity records yet</p>
                            <p className="text-sm text-slate-600 mb-6">Start recording your harvest results to track your productivity</p>
                            <Button onClick={() => setShowForm(true)}>+ Add Your First Record</Button>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
