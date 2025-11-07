import { useEffect, useState } from 'react';
import { Plus, LogOut, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ProductCard } from './ProductCard';
import { AddProductModal } from './AddProductModal';
import { PriceHistoryModal } from './PriceHistoryModal';
import { NotificationPanel } from './NotificationPanel';
import { fetchProducts, addProduct, refreshProduct, deleteProduct } from '../lib/api';

interface Product {
  id: string;
  url: string;
  platform: string;
  title: string;
  image_url?: string;
  current_price?: number;
  currency: string;
  target_price?: number;
  lowest_price?: number;
  highest_price?: number;
  is_available: boolean;
  last_checked_at?: string;
}

export function Dashboard() {
  const { signOut, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [historyProductId, setHistoryProductId] = useState<string | null>(null);
  const [historyProductTitle, setHistoryProductTitle] = useState('');

  const loadProducts = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data.products);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleAddProduct = async (url: string, targetPrice?: number) => {
    await addProduct(url, targetPrice);
    await loadProducts();
  };

  const handleRefreshProduct = async (id: string) => {
    await refreshProduct(id);
    await loadProducts();
  };

  const handleDeleteProduct = async (id: string) => {
    await deleteProduct(id);
    await loadProducts();
  };

  const handleViewHistory = (id: string) => {
    const product = products.find((p) => p.id === id);
    if (product) {
      setHistoryProductId(id);
      setHistoryProductTitle(product.title);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Price Tracker</h1>
                <p className="text-sm text-slate-600">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationPanel />
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2 font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Product
              </button>
              <button
                onClick={signOut}
                className="p-2 text-slate-600 hover:text-slate-900 transition"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              No products yet
            </h2>
            <p className="text-slate-600 mb-6">
              Start tracking prices by adding your first product
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition inline-flex items-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onRefresh={handleRefreshProduct}
                onDelete={handleDeleteProduct}
                onViewHistory={handleViewHistory}
              />
            ))}
          </div>
        )}
      </main>

      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddProduct}
      />

      <PriceHistoryModal
        productId={historyProductId}
        productTitle={historyProductTitle}
        onClose={() => setHistoryProductId(null)}
      />
    </div>
  );
}
