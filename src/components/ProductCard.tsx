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
  onView: () => void;
  onRefresh: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onViewHistory: (id: string) => void;
}

export function ProductCard({ product, onView, onRefresh, onDelete, onViewHistory }: ProductCardProps) {
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
    <button
      onClick={onView}
      className="bg-white rounded-xl border border-primary-200 hover:border-primary-300 hover:shadow-md transition p-4 text-left group cursor-pointer"
    >
      <div className="flex gap-3">
        {product.image_url && (
          <div className="flex-shrink-0 w-20 h-20 bg-primary-50 rounded-lg flex items-center justify-center overflow-hidden">
            <img
              src={product.image_url}
              alt={product.title}
              className="w-full h-full object-contain"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-primary-900 line-clamp-2 text-sm group-hover:text-accent-600 transition">
              {product.title}
            </h3>
          </div>

          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex text-xs font-semibold px-2 py-0.5 bg-accent-50 text-accent-700 rounded-full uppercase tracking-wide">
              {product.platform}
            </span>
            {!product.is_available && (
              <span className="inline-flex text-xs font-semibold px-2 py-0.5 bg-error-50 text-error-600 rounded-full uppercase">
                Out Stock
              </span>
            )}
          </div>

          {product.current_price ? (
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xl font-bold text-primary-900">
                  {product.currency} {product.current_price.toFixed(2)}
                </span>
                {product.lowest_price !== product.current_price && (
                  <span
                    className={`text-xs font-semibold flex items-center gap-0.5 ${
                      isPriceDown ? 'text-success-600' : 'text-error-600'
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
                <p className="text-xs text-primary-600">
                  Lowest: {product.currency} {product.lowest_price.toFixed(2)}
                </p>
              )}
              {atTargetPrice && (
                <div className="mt-2 inline-block px-2 py-1 bg-success-50 text-success-700 text-xs font-semibold rounded">
                  Target reached!
                </div>
              )}
            </div>
          ) : (
            <p className="text-primary-600 text-sm">Price unavailable</p>
          )}
        </div>
      </div>
    </button>
  );
}
