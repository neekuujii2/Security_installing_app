import { useState, useEffect } from 'react';
import { apiClient } from '../lib/axios';
import { cn } from '../lib/utils';
import { Search, Package, AlertTriangle, Plus, Minus } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  unit: string;
  price: number;
}

const categories = ['All', 'Camera', 'Cabling', 'DVR', 'Power', 'Accessories'];

export function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showLowStock, setShowLowStock] = useState(false);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const params = new URLSearchParams();
        if (category !== 'All') params.append('category', category);
        if (showLowStock) params.append('lowStockOnly', 'true');
        
        const response = await apiClient.get(`/inventory?${params.toString()}`);
        setItems(response.data);
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [category, showLowStock]);

  const filteredItems = items.filter((item) =>
    search
      ? item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock <= item.minStockLevel) {
      return { status: 'low', color: 'text-red-600 bg-red-50' };
    }
    if (item.currentStock >= item.maxStockLevel) {
      return { status: 'excess', color: 'text-blue-600 bg-blue-50' };
    }
    return { status: 'normal', color: 'text-emerald-600 bg-emerald-50' };
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-action border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Inventory</h1>
          <p className="mt-1 text-slate-500">Track and manage stock levels</p>
        </div>
        <button className="flex items-center gap-2 rounded-full bg-action px-5 py-2.5 text-sm font-medium text-white hover:bg-action/90">
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-action"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex rounded-xl border border-slate-200 bg-white p-1">
            {categories.slice(0, 4).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  'rounded-lg px-4 py-1.5 text-sm font-medium transition',
                  category === cat
                    ? 'bg-navy text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowLowStock(!showLowStock)}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition',
              showLowStock
                ? 'bg-red-50 text-red-600'
                : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            <AlertTriangle className="h-4 w-4" />
            Low Stock
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredItems.map((item) => {
          const stockStatus = getStockStatus(item);
          
          return (
            <div
              key={item.id}
              className="rounded-[28px] bg-white p-5 shadow-panel"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <Package className="h-5 w-5 text-slate-600" />
                </div>
                <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', stockStatus.color)}>
                  {stockStatus.status === 'low' ? 'Low' : stockStatus.status === 'excess' ? 'Excess' : 'Normal'}
                </span>
              </div>

              <h3 className="mt-4 font-medium text-slate-900">{item.name}</h3>
              <p className="text-sm text-slate-500">SKU: {item.sku}</p>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-semibold text-slate-900">{item.currentStock}</p>
                  <p className="text-xs text-slate-500">{item.unit}s in stock</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Min: {item.minStockLevel}</p>
                  <p className="text-sm text-slate-500">Max: {item.maxStockLevel}</p>
                </div>
              </div>

              <div className="mt-4 h-2 rounded-full bg-slate-100">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all',
                    stockStatus.status === 'low'
                      ? 'bg-red-500'
                      : stockStatus.status === 'excess'
                      ? 'bg-blue-500'
                      : 'bg-emerald-500'
                  )}
                  style={{
                    width: `${Math.min((item.currentStock / item.maxStockLevel) * 100, 100)}%`,
                  }}
                />
              </div>

              <div className="mt-4 flex gap-2">
                <button className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  <Minus className="mr-1 inline h-3 w-3" /> Use
                </button>
                <button className="flex-1 rounded-lg bg-navy py-2 text-sm font-medium text-white hover:bg-navy/90">
                  <Plus className="mr-1 inline h-3 w-3" /> Add
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="py-12 text-center text-slate-500">
          No inventory items found
        </div>
      )}
    </div>
  );
}