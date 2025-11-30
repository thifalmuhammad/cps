import React, { useState, useEffect } from 'react';
import { productivityAPI, warehouseAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { Plus, Trash2, Edit2, Download, Package, TrendingDown, Calendar, MapPin } from 'lucide-react';

export default function WarehouseInventoryPage() {
    const { user } = useAuth();
    const [productivityRecords, setProductivityRecords] = useState([]);
    const [warehouseInventory, setWarehouseInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form states
    const [showInventoryForm, setShowInventoryForm] = useState(false);
    const [editingInventoryId, setEditingInventoryId] = useState(null);
    const [inventoryForm, setInventoryForm] = useState({
        productivityId: '',
        quantityStored: '',
        storageLocation: '',
        dateStored: '',
        notes: '',
    });

    const [showRemovalForm, setShowRemovalForm] = useState(false);
    const [removalForm, setRemovalForm] = useState({
        inventoryId: '',
        quantityRemoved: '',
        removalReason: 'sold',
        dateRemoved: '',
        buyerInfo: '',
    });

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Get user's productivity records (harvested items)
                const prodRes = await productivityAPI.getAll();
                const allProds = prodRes.data || [];
                const userProds = allProds.filter(p => p.farm?.farmer?.uuid === user?.uuid);
                setProductivityRecords(userProds);

                // Get warehouse inventory
                const warehouseRes = await warehouseAPI.getAll();
                const allInventory = warehouseRes.data || [];
                // Filter inventory related to user's productivity
                const userInventory = allInventory.filter(inv =>
                    userProds.some(p => p.uuid === inv.productivityId)
                );
                setWarehouseInventory(userInventory);

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

    // Handle store in warehouse
    const handleStoreInventory = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            if (!inventoryForm.productivityId || !inventoryForm.quantityStored ||
                !inventoryForm.storageLocation || !inventoryForm.dateStored) {
                setError('❌ Please fill in required fields');
                setSaving(false);
                return;
            }

            const submitData = {
                productivityId: inventoryForm.productivityId,
                quantityStored: parseFloat(inventoryForm.quantityStored),
                storageLocation: inventoryForm.storageLocation,
                dateStored: new Date(inventoryForm.dateStored).toISOString(),
                notes: inventoryForm.notes || '',
            };

            if (editingInventoryId) {
                await warehouseAPI.update(editingInventoryId, submitData);
                setSuccess('✅ Warehouse inventory updated successfully!');
            } else {
                await warehouseAPI.create(submitData);
                setSuccess('✅ Items stored in warehouse successfully!');
            }

            // Refresh data
            const warehouseRes = await warehouseAPI.getAll();
            const allInventory = warehouseRes.data || [];
            const userInventory = allInventory.filter(inv =>
                productivityRecords.some(p => p.uuid === inv.productivityId)
            );
            setWarehouseInventory(userInventory);

            // Reset form
            setInventoryForm({
                productivityId: '',
                quantityStored: '',
                storageLocation: '',
                dateStored: '',
                notes: '',
            });
            setEditingInventoryId(null);
            setShowInventoryForm(false);

            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('❌ Error storing inventory:', err);
            setError(err.message || 'Failed to store inventory');
        } finally {
            setSaving(false);
        }
    };

    // Handle remove from warehouse (sold/removed)
    const handleRemoveInventory = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            if (!removalForm.inventoryId || !removalForm.quantityRemoved || !removalForm.dateRemoved) {
                setError('❌ Please fill in required fields');
                setSaving(false);
                return;
            }

            const inventory = warehouseInventory.find(w => w.uuid === removalForm.inventoryId);
            if (!inventory) {
                setError('❌ Inventory not found');
                setSaving(false);
                return;
            }

            const quantityRemoved = parseFloat(removalForm.quantityRemoved);
            if (quantityRemoved > inventory.quantityStored - (inventory.quantityRemoved || 0)) {
                setError('❌ Removal quantity exceeds available stock');
                setSaving(false);
                return;
            }

            const submitData = {
                ...inventory,
                quantityRemoved: (inventory.quantityRemoved || 0) + quantityRemoved,
                removalReason: removalForm.removalReason,
                dateRemoved: new Date(removalForm.dateRemoved).toISOString(),
                buyerInfo: removalForm.buyerInfo || '',
            };

            await warehouseAPI.update(removalForm.inventoryId, submitData);
            setSuccess(`✅ ${quantityRemoved} kg removed from warehouse!`);

            // Refresh data
            const warehouseRes = await warehouseAPI.getAll();
            const allInventory = warehouseRes.data || [];
            const userInventory = allInventory.filter(inv =>
                productivityRecords.some(p => p.uuid === inv.productivityId)
            );
            setWarehouseInventory(userInventory);

            // Reset form
            setRemovalForm({
                inventoryId: '',
                quantityRemoved: '',
                removalReason: 'sold',
                dateRemoved: '',
                buyerInfo: '',
            });
            setShowRemovalForm(false);

            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('❌ Error removing inventory:', err);
            setError(err.message || 'Failed to remove inventory');
        } finally {
            setSaving(false);
        }
    };

    const handleEditInventory = (inv) => {
        setEditingInventoryId(inv.uuid);
        setInventoryForm({
            productivityId: inv.productivityId,
            quantityStored: inv.quantityStored.toString(),
            storageLocation: inv.storageLocation,
            dateStored: new Date(inv.dateStored).toISOString().split('T')[0],
            notes: inv.notes || '',
        });
        setShowInventoryForm(true);
    };

    const handleDeleteInventory = async (invId) => {
        if (!window.confirm('Delete this inventory record?')) return;
        try {
            setSaving(true);
            await warehouseAPI.delete(invId);
            setSuccess('✅ Inventory deleted successfully!');
            const warehouseRes = await warehouseAPI.getAll();
            const allInventory = warehouseRes.data || [];
            const userInventory = allInventory.filter(inv =>
                productivityRecords.some(p => p.uuid === inv.productivityId)
            );
            setWarehouseInventory(userInventory);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message || 'Failed to delete inventory');
        } finally {
            setSaving(false);
        }
    };

    // Calculate stats
    const totalHarvested = productivityRecords.reduce((sum, p) => sum + p.productionAmount, 0);
    const totalStored = warehouseInventory.reduce((sum, w) => sum + w.quantityStored, 0);
    const totalRemoved = warehouseInventory.reduce((sum, w) => sum + (w.quantityRemoved || 0), 0);
    const currentStock = totalStored - totalRemoved;
    const totalRevenue = warehouseInventory.reduce((sum, w) => {
        const prod = productivityRecords.find(p => p.uuid === w.productivityId);
        return sum + ((w.quantityRemoved || 0) * (prod?.sellingPrice || 0));
    }, 0);

    // Export inventory as CSV
    const handleExportInventory = () => {
        const csvContent = [
            ['Date Stored', 'Quantity Stored', 'Storage Location', 'Quantity Removed', 'Removal Reason', 'Date Removed', 'Buyer Info', 'Current Stock'],
            ...warehouseInventory.map(w => [
                new Date(w.dateStored).toLocaleDateString('id-ID'),
                w.quantityStored.toFixed(2),
                w.storageLocation,
                w.quantityRemoved?.toFixed(2) || '0.00',
                w.removalReason || '-',
                w.dateRemoved ? new Date(w.dateRemoved).toLocaleDateString('id-ID') : '-',
                w.buyerInfo || '-',
                (w.quantityStored - (w.quantityRemoved || 0)).toFixed(2)
            ])
        ]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
        element.setAttribute('download', `warehouse_inventory_${new Date().toISOString().split('T')[0]}.csv`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header Section */}
            <div className="bg-white border-b border-slate-200">
                <div className="px-8 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">🏭 Warehouse Inventory</h1>
                            <p className="text-sm text-slate-600 mt-1">Track your harvested products and sales</p>
                        </div>
                        <div className="flex gap-2">
                            {warehouseInventory.length > 0 && (
                                <Button
                                    onClick={handleExportInventory}
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Export
                                </Button>
                            )}
                            <Button
                                onClick={() => setShowInventoryForm(!showInventoryForm)}
                                className="gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                {showInventoryForm ? 'Cancel' : 'Store Item'}
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card variant="elevated">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Total Harvested</p>
                                <p className="text-2xl font-bold text-slate-900 mt-2">{totalHarvested.toFixed(2)}</p>
                                <p className="text-xs text-slate-500 mt-2">kg</p>
                            </div>
                            <span className="text-3xl">🌾</span>
                        </div>
                    </Card>

                    <Card variant="elevated">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Stored</p>
                                <p className="text-2xl font-bold text-slate-900 mt-2">{totalStored.toFixed(2)}</p>
                                <p className="text-xs text-slate-500 mt-2">kg in warehouse</p>
                            </div>
                            <span className="text-3xl">📦</span>
                        </div>
                    </Card>

                    <Card variant="elevated" className="bg-gradient-to-br from-blue-50 to-blue-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-blue-900">Current Stock</p>
                                <p className="text-2xl font-bold text-blue-900 mt-2">{currentStock.toFixed(2)}</p>
                                <p className="text-xs text-blue-700 mt-2">kg available</p>
                            </div>
                            <span className="text-3xl">📊</span>
                        </div>
                    </Card>

                    <Card variant="elevated" className="bg-gradient-to-br from-green-50 to-green-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-green-900">Revenue from Sales</p>
                                <p className="text-2xl font-bold text-green-900 mt-2">Rp {(totalRevenue / 1000000).toFixed(2)}M</p>
                                <p className="text-xs text-green-700 mt-2">from removed items</p>
                            </div>
                            <span className="text-3xl">💰</span>
                        </div>
                    </Card>

                    <Card variant="elevated" className="bg-gradient-to-br from-green-50 to-green-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-green-900">Sold/Removed</p>
                                <p className="text-2xl font-bold text-green-900 mt-2">{totalRemoved.toFixed(2)}</p>
                                <p className="text-xs text-green-700 mt-2">kg out</p>
                            </div>
                            <span className="text-3xl">✅</span>
                        </div>
                    </Card>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Store New Harvest */}
                    <div className="lg:col-span-1">
                        <Card className="p-6 border-2 border-slate-300 bg-gradient-to-br from-slate-50 to-white">
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                Store Harvest
                            </h2>
                            <form onSubmit={handleStoreInventory} className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Harvest Record *</label>
                                    <select
                                        value={inventoryForm.productivityId}
                                        onChange={(e) => setInventoryForm({ ...inventoryForm, productivityId: e.target.value })}
                                        disabled={editingInventoryId}
                                        className="w-full px-2 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select harvest...</option>
                                        {productivityRecords.map(prod => (
                                            <option key={prod.uuid} value={prod.uuid}>
                                                {prod.farm?.district?.districtName} - {prod.productionAmount.toFixed(2)} kg
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Quantity (kg) *</label>
                                    <input
                                        type="number"
                                        value={inventoryForm.quantityStored}
                                        onChange={(e) => setInventoryForm({ ...inventoryForm, quantityStored: e.target.value })}
                                        placeholder="0.00"
                                        step="0.01"
                                        className="w-full px-2 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        Storage Location *
                                    </label>
                                    <input
                                        type="text"
                                        value={inventoryForm.storageLocation}
                                        onChange={(e) => setInventoryForm({ ...inventoryForm, storageLocation: e.target.value })}
                                        placeholder="e.g., Rack A-1"
                                        className="w-full px-2 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Date Stored *
                                    </label>
                                    <input
                                        type="date"
                                        value={inventoryForm.dateStored}
                                        onChange={(e) => setInventoryForm({ ...inventoryForm, dateStored: e.target.value })}
                                        className="w-full px-2 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
                                    <textarea
                                        value={inventoryForm.notes}
                                        onChange={(e) => setInventoryForm({ ...inventoryForm, notes: e.target.value })}
                                        placeholder="Additional notes..."
                                        rows="2"
                                        className="w-full px-2 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        size="sm"
                                        className="flex-1"
                                    >
                                        📦 Store
                                    </Button>
                                    {editingInventoryId && (
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                setEditingInventoryId(null);
                                                setInventoryForm({ productivityId: '', quantityStored: '', storageLocation: '', dateStored: '', notes: '' });
                                            }}
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                        >
                                            ✖
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </Card>
                    </div>

                    {/* Inventory & Removal */}
                    <div className="lg:col-span-2">
                        {/* Inventory List */}
                        <Card className="mb-6">
                            <div className="border-b border-slate-200 pb-4 mb-4">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Package className="w-5 h-5" />
                                    Warehouse Inventory
                                </h2>
                                <p className="text-sm text-slate-600 mt-1">{warehouseInventory.length} entries</p>
                            </div>

                            {loading ? (
                                <p className="text-slate-600 text-center py-8">⏳ Loading...</p>
                            ) : warehouseInventory.length > 0 ? (
                                <div className="space-y-3">
                                    {warehouseInventory.map((inv) => {
                                        const availableStock = inv.quantityStored - (inv.quantityRemoved || 0);
                                        const removedPercentage = inv.quantityStored > 0 ? ((inv.quantityRemoved || 0) / inv.quantityStored * 100) : 0;

                                        return (
                                            <div key={inv.uuid} className="p-4 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <p className="font-semibold text-slate-900 flex items-center gap-2">
                                                            <MapPin className="w-4 h-4 text-slate-600" />
                                                            {inv.storageLocation}
                                                        </p>
                                                        <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(inv.dateStored).toLocaleDateString('id-ID')}
                                                        </p>
                                                    </div>
                                                    <Badge variant={availableStock > 0 ? 'success' : 'secondary'}>
                                                        {availableStock > 0 ? 'In Stock' : 'Empty'}
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-200 my-2">
                                                    <div>
                                                        <p className="text-xs text-slate-600">Stored</p>
                                                        <p className="text-sm font-bold">{inv.quantityStored.toFixed(2)} kg</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-600">Removed</p>
                                                        <p className="text-sm font-bold">{(inv.quantityRemoved || 0).toFixed(2)} kg</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-600">Available</p>
                                                        <p className="text-sm font-bold text-blue-600">{availableStock.toFixed(2)} kg</p>
                                                    </div>
                                                </div>

                                                {/* Progress bar */}
                                                <div className="mb-3">
                                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                                        <div
                                                            className="bg-green-500 h-2 rounded-full"
                                                            style={{ width: `${100 - removedPercentage}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-xs text-slate-600 mt-1">
                                                        {removedPercentage.toFixed(0)}% sold/removed
                                                    </p>
                                                </div>

                                                {inv.notes && (
                                                    <p className="text-xs text-slate-600 mb-3 italic">📝 {inv.notes}</p>
                                                )}

                                                <div className="flex gap-2 pt-2">
                                                    {availableStock > 0 && (
                                                        <Button
                                                            onClick={() => {
                                                                setRemovalForm({ inventoryId: inv.uuid, quantityRemoved: '', removalReason: 'sold', dateRemoved: '', buyerInfo: '' });
                                                                setShowRemovalForm(true);
                                                            }}
                                                            size="sm"
                                                            className="flex-1 gap-2"
                                                        >
                                                            <TrendingDown className="w-4 h-4" />
                                                            Sell/Remove
                                                        </Button>
                                                    )}
                                                    <Button
                                                        onClick={() => handleEditInventory(inv)}
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={saving || availableStock < inv.quantityStored}
                                                        className="gap-2"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleDeleteInventory(inv.uuid)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-2 text-red-600 hover:text-red-700"
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
                                <div className="text-center py-8">
                                    <p className="text-3xl mb-2">📦</p>
                                    <p className="text-slate-600 font-medium">No warehouse inventory yet</p>
                                    <p className="text-sm text-slate-600 mt-2">Store your harvested products first</p>
                                </div>
                            )}
                        </Card>

                        {/* Sales/Removal Form */}
                        {showRemovalForm && (
                            <Card className="p-6 border-2 border-slate-300 bg-gradient-to-br from-slate-50 to-white">
                                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <TrendingDown className="w-5 h-5" />
                                    Remove from Warehouse
                                </h2>
                                <form onSubmit={handleRemoveInventory} className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Select Inventory *</label>
                                        <select
                                            value={removalForm.inventoryId}
                                            onChange={(e) => setRemovalForm({ ...removalForm, inventoryId: e.target.value })}
                                            className="w-full px-2 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                            required
                                        >
                                            <option value="">Select inventory...</option>
                                            {warehouseInventory.map(inv => {
                                                const available = inv.quantityStored - (inv.quantityRemoved || 0);
                                                return available > 0 ? (
                                                    <option key={inv.uuid} value={inv.uuid}>
                                                        {inv.storageLocation} - {available.toFixed(2)} kg available
                                                    </option>
                                                ) : null;
                                            })}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Quantity to Remove (kg) *</label>
                                        <input
                                            type="number"
                                            value={removalForm.quantityRemoved}
                                            onChange={(e) => setRemovalForm({ ...removalForm, quantityRemoved: e.target.value })}
                                            placeholder="0.00"
                                            step="0.01"
                                            className="w-full px-2 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Reason *</label>
                                        <select
                                            value={removalForm.removalReason}
                                            onChange={(e) => setRemovalForm({ ...removalForm, removalReason: e.target.value })}
                                            className="w-full px-2 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                            required
                                        >
                                            <option value="sold">Sold</option>
                                            <option value="damaged">Damaged</option>
                                            <option value="used">Used</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Date Removed *</label>
                                        <input
                                            type="date"
                                            value={removalForm.dateRemoved}
                                            onChange={(e) => setRemovalForm({ ...removalForm, dateRemoved: e.target.value })}
                                            className="w-full px-2 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Buyer/Recipient Info</label>
                                        <input
                                            type="text"
                                            value={removalForm.buyerInfo}
                                            onChange={(e) => setRemovalForm({ ...removalForm, buyerInfo: e.target.value })}
                                            placeholder="Name, company, etc."
                                            className="w-full px-2 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            type="submit"
                                            disabled={saving}
                                            size="sm"
                                            className="flex-1"
                                        >
                                            ✅ Confirm
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                setShowRemovalForm(false);
                                                setRemovalForm({ inventoryId: '', quantityRemoved: '', removalReason: 'sold', dateRemoved: '', buyerInfo: '' });
                                            }}
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                        >
                                            ✖ Cancel
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
