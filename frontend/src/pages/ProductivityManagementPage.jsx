import React, { useState, useEffect } from 'react';
import { farmAPI, productivityAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { TrendingUp, Download, Filter, Plus, Trash2, Edit2, Calendar, DollarSign } from 'lucide-react';

export default function ProductivityManagementPage() {
    const { user } = useAuth();
    const [myFarms, setMyFarms] = useState([]);
    const [myProductivities, setMyProductivities] = useState([]);
    const [filteredProductivities, setFilteredProductivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [saving, setSaving] = useState(false);

    // Filter states
    const [filterFarmId, setFilterFarmId] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [sortBy, setSortBy] = useState('recent');

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
                applyFilters(userProds, '', '', '', 'recent');

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

    // Apply filters
    useEffect(() => {
        applyFilters(myProductivities, filterFarmId, filterDateFrom, filterDateTo, sortBy);
    }, [filterFarmId, filterDateFrom, filterDateTo, sortBy, myProductivities]);

    const applyFilters = (data, farmId, dateFrom, dateTo, sort) => {
        let filtered = [...data];

        // Filter by farm
        if (farmId) {
            filtered = filtered.filter(p => p.farmId === farmId);
        }

        // Filter by date range
        if (dateFrom) {
            filtered = filtered.filter(p => new Date(p.harvestDate) >= new Date(dateFrom));
        }
        if (dateTo) {
            filtered = filtered.filter(p => new Date(p.harvestDate) <= new Date(dateTo));
        }

        // Sort
        if (sort === 'recent') {
            filtered.sort((a, b) => new Date(b.harvestDate) - new Date(a.harvestDate));
        } else if (sort === 'oldest') {
            filtered.sort((a, b) => new Date(a.harvestDate) - new Date(b.harvestDate));
        } else if (sort === 'highest-production') {
            filtered.sort((a, b) => b.productionAmount - a.productionAmount);
        } else if (sort === 'highest-price') {
            filtered.sort((a, b) => b.sellingPrice - a.sellingPrice);
        }

        setFilteredProductivities(filtered);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };
        
        // Auto-calculate productivity when farmId or productionAmount changes
        if (name === 'farmId' || name === 'productionAmount') {
            const selectedFarm = myFarms.find(f => f.uuid === (name === 'farmId' ? value : formData.farmId));
            const productionAmount = parseFloat(name === 'productionAmount' ? value : formData.productionAmount);
            
            if (selectedFarm && !isNaN(productionAmount) && productionAmount > 0) {
                const productivity = (productionAmount / selectedFarm.farmArea).toFixed(2);
                newFormData.productivity = productivity;
            } else {
                newFormData.productivity = '';
            }
        }
        
        setFormData(newFormData);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
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
                await productivityAPI.update(editingId, submitData);
                setSuccess('✅ Productivity record updated successfully!');
            } else {
                await productivityAPI.create(submitData);
                setSuccess('✅ Productivity record created successfully!');
            }

            const prodRes = await productivityAPI.getAll();
            const allProds = prodRes.data || [];
            const userProds = allProds.filter(p =>
                myFarms.some(f => f.uuid === p.farmId)
            );
            setMyProductivities(userProds);

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

    // Export data as CSV
    const handleExport = () => {
        const csvContent = [
            ['Farm', 'Harvest Date', 'Production (kg)', 'Price (Rp/kg)', 'Productivity (kg/ha)', 'Total Revenue (Rp)'],
            ...filteredProductivities.map(p => {
                const farm = myFarms.find(f => f.uuid === p.farmId);
                const totalRevenue = p.productionAmount * p.sellingPrice;
                return [
                    farm?.district?.districtName || 'Unknown',
                    new Date(p.harvestDate).toLocaleDateString('id-ID'),
                    p.productionAmount.toFixed(2),
                    p.sellingPrice.toFixed(2),
                    p.productivity.toFixed(2),
                    totalRevenue.toFixed(2)
                ];
            })
        ]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
        element.setAttribute('download', `productivity_${new Date().toISOString().split('T')[0]}.csv`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const farmMap = Object.fromEntries(myFarms.map(f => [f.uuid, f]));
    const totalProduction = filteredProductivities.reduce((sum, p) => sum + p.productionAmount, 0);
    const totalRevenue = filteredProductivities.reduce((sum, p) => sum + (p.productionAmount * p.sellingPrice), 0);
    const avgProductivity = filteredProductivities.length > 0
        ? (filteredProductivities.reduce((sum, p) => sum + p.productivity, 0) / filteredProductivities.length).toFixed(2)
        : 0;
    const avgPrice = filteredProductivities.length > 0
        ? (filteredProductivities.reduce((sum, p) => sum + p.sellingPrice, 0) / filteredProductivities.length).toFixed(2)
        : 0;

    return (
        <div className="min-h-screen bg-white">
            {/* Header Section */}
            <div className="bg-white border-b border-slate-200">
                <div className="px-8 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Manage Productivity</h1>
                            <p className="text-sm text-slate-600 mt-1">Record and track your harvest results</p>
                        </div>
                        <div className="flex gap-2">
                            {filteredProductivities.length > 0 && (
                                <Button
                                    onClick={handleExport}
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Export
                                </Button>
                            )}
                            <Button
                                onClick={() => setShowForm(!showForm)}
                                className="gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                {showForm ? 'Cancel' : 'Add Record'}
                            </Button>
                        </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card variant="elevated">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Total Harvest</p>
                                <p className="text-3xl font-bold text-slate-900 mt-2">{totalProduction.toFixed(2)}</p>
                                <p className="text-xs text-slate-500 mt-2">kg harvested</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-slate-900" />
                            </div>
                        </div>
                    </Card>

                    <Card variant="elevated">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                                <p className="text-3xl font-bold text-slate-900 mt-2">Rp {(totalRevenue / 1000000).toFixed(2)}M</p>
                                <p className="text-xs text-slate-500 mt-2">from sales</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                                <DollarSign className="h-6 w-6 text-slate-900" />
                            </div>
                        </div>
                    </Card>

                    <Card variant="elevated">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Avg Productivity</p>
                                <p className="text-3xl font-bold text-slate-900 mt-2">{avgProductivity}</p>
                                <p className="text-xs text-slate-500 mt-2">kg/ha</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-slate-900" />
                            </div>
                        </div>
                    </Card>

                    <Card variant="elevated">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Avg Price</p>
                                <p className="text-3xl font-bold text-slate-900 mt-2">Rp {parseFloat(avgPrice).toLocaleString('id-ID')}</p>
                                <p className="text-xs text-slate-500 mt-2">per kg</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                                <DollarSign className="h-6 w-6 text-slate-900" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Add/Edit Form */}
                {showForm && (
                    <Card className="mb-8 p-6 border-2 border-slate-300 bg-gradient-to-br from-slate-50 to-white">
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            {editingId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                            {editingId ? 'Edit Productivity Record' : 'Add New Productivity Record'}
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
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white"
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
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Harvest Date *
                                    </label>
                                    <input
                                        type="date"
                                        name="harvestDate"
                                        value={formData.harvestDate}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
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
                                        min="0"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                                        required
                                    />
                                </div>

                                {/* Selling Price */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                        <DollarSign className="w-4 h-4" />
                                        Selling Price (Rp/kg) *
                                    </label>
                                    <input
                                        type="number"
                                        name="sellingPrice"
                                        value={formData.sellingPrice}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                                        required
                                    />
                                </div>

                                {/* Productivity */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" />
                                        Productivity (kg/ha) * (Auto-calculated)
                                    </label>
                                    <input
                                        type="number"
                                        name="productivity"
                                        value={formData.productivity}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-100 cursor-not-allowed"
                                        readOnly
                                        required
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Formula: Production Amount ÷ Farm Area</p>
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

                {/* Filters */}
                <Card className="mb-8 p-4 bg-gradient-to-r from-slate-50 to-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-slate-600" />
                        <h3 className="font-semibold text-slate-900">Filters & Sort</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-2">Farm</label>
                            <select
                                value={filterFarmId}
                                onChange={(e) => setFilterFarmId(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
                            >
                                <option value="">All Farms</option>
                                {myFarms.map(farm => (
                                    <option key={farm.uuid} value={farm.uuid}>
                                        {farm.district?.districtName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-2">From Date</label>
                            <input
                                type="date"
                                value={filterDateFrom}
                                onChange={(e) => setFilterDateFrom(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-2">To Date</label>
                            <input
                                type="date"
                                value={filterDateTo}
                                onChange={(e) => setFilterDateTo(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-2">Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
                            >
                                <option value="recent">Most Recent</option>
                                <option value="oldest">Oldest First</option>
                                <option value="highest-production">Highest Production</option>
                                <option value="highest-price">Highest Price</option>
                            </select>
                        </div>
                    </div>
                </Card>

                {/* Productivity Records List */}
                <Card>
                    <div className="border-b border-slate-200 pb-4 mb-4">
                        <h2 className="text-lg font-bold text-slate-900">Your Productivity Records</h2>
                        <p className="text-sm text-slate-600 mt-1">{filteredProductivities.length} of {myProductivities.length} record(s)</p>
                    </div>

                    {loading ? (
                        <div className="text-center py-8">
                            <p className="text-slate-600">⏳ Loading records...</p>
                        </div>
                    ) : filteredProductivities.length > 0 ? (
                        <div className="space-y-3">
                            {filteredProductivities.map((prod) => {
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
                                        className="p-4 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"
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
                                                className="flex-1 gap-2"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                Edit
                                            </Button>
                                            <Button
                                                onClick={() => handleDelete(prod.uuid)}
                                                variant="outline"
                                                size="sm"
                                                disabled={saving}
                                                className="flex-1 gap-2 text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-4xl mb-4">📊</p>
                            <p className="text-slate-600 mb-4 font-medium">No productivity records found</p>
                            <p className="text-sm text-slate-600 mb-6">Start recording your harvest results to track your productivity</p>
                            <Button onClick={() => setShowForm(true)}>+ Add Your First Record</Button>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
