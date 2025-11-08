import { useEffect, useState } from 'react';
import { Plus, LogOut, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
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
    <div className="min-h-screen bg-primary-50">
      <header className="sticky top-0 z-40 bg-white border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent-100">
                <Package className="w-6 h-6 text-accent-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary-900">Price Tracker</h1>
                <p className="text-xs text-primary-600">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationPanel />
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg transition flex items-center gap-2 font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
              <button
                onClick={signOut}
                className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition"
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
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-100 border-t-accent-600"></div>
              <p className="text-sm text-primary-600">Loading your products...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mx-auto mb-4">
              <Package className="w-8 h-8 text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-primary-900 mb-2">No products yet</h2>
            <p className="text-primary-600 mb-8 max-w-sm mx-auto">
              Start tracking prices by adding your first product. We'll monitor price changes and notify you of deals.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-accent-600 hover:bg-accent-700 text-white rounded-lg transition inline-flex items-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onView={() => setSelectedProduct(product)}
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

      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onRefresh={handleRefreshProduct}
        onDelete={handleDeleteProduct}
        onViewHistory={handleViewHistory}
      />

      <PriceHistoryModal
        productId={historyProductId}
        productTitle={historyProductTitle}
        onClose={() => setHistoryProductId(null)}
      />
    </div>
  );
}
