import { ExternalLink, RefreshCw, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';

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

interface ProductCardProps {
  product: Product;
  onRefresh: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onViewHistory: (id: string) => void;
}

export function ProductCard({ product, onRefresh, onDelete, onViewHistory }: ProductCardProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh(product.id);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove this product?')) return;
    setDeleting(true);
    try {
      await onDelete(product.id);
    } finally {
      setDeleting(false);
    }
  };

  const priceChange =
    product.current_price && product.lowest_price
      ? ((product.current_price - product.lowest_price) / product.lowest_price) * 100
      : 0;

  const isPriceDown = priceChange < 0;
  const atTargetPrice = product.target_price && product.current_price && product.current_price <= product.target_price;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition group">
      <div className="p-4">
        <div className="flex gap-4">
          {product.image_url && (
            <div className="flex-shrink-0">
              <img
                src={product.image_url}
                alt={product.title}
                className="w-24 h-24 object-contain rounded-lg"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-slate-900 line-clamp-2 text-sm">
                {product.title}
              </h3>
              <span className="flex-shrink-0 text-xs font-medium px-2 py-1 bg-slate-100 text-slate-700 rounded uppercase">
                {product.platform}
              </span>
            </div>

            {product.current_price ? (
              <div className="mb-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">
                    {product.currency} {product.current_price.toFixed(2)}
                  </span>
                  {product.lowest_price !== product.current_price && (
                    <span
                      className={`text-xs font-medium flex items-center gap-1 ${
                        isPriceDown ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {isPriceDown ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : (
                        <TrendingUp className="w-3 h-3" />
                      )}
                      {Math.abs(priceChange).toFixed(1)}%
                    </span>
                  )}
                </div>
                {product.lowest_price && (
                  <p className="text-xs text-slate-500 mt-1">
                    Lowest: {product.currency} {product.lowest_price.toFixed(2)}
                  </p>
                )}
                {atTargetPrice && (
                  <div className="mt-2 inline-block px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded">
                    Target price reached!
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-sm mb-3">Price not available</p>
            )}

            {!product.is_available && (
              <div className="mb-3 inline-block px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded">
                Out of Stock
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => window.open(product.url, '_blank')}
                className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                View Product
              </button>
              <button
                onClick={() => onViewHistory(product.id)}
                className="text-xs px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
              >
                Price History
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-xs px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition disabled:opacity-50 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition disabled:opacity-50 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
