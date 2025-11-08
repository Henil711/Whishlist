import { useState } from 'react';
import { X, ExternalLink, RefreshCw, Trash2, TrendingDown, TrendingUp, Heart } from 'lucide-react';

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

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onViewHistory: (id: string) => void;
}

export function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onRefresh,
  onDelete,
  onViewHistory,
}: ProductDetailModalProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  if (!isOpen || !product) return null;

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
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  const priceChange =
    product.current_price && product.lowest_price
      ? ((product.current_price - product.lowest_price) / product.lowest_price) * 100
      : 0;

  const isPriceDown = priceChange < 0;
  const atTargetPrice =
    product.target_price && product.current_price && product.current_price <= product.target_price;

  const savingsAmount =
    product.current_price && product.lowest_price ? product.lowest_price - product.current_price : 0;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-primary-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary-900 line-clamp-1">{product.title}</h2>
          <button
            onClick={onClose}
            className="text-primary-400 hover:text-primary-600 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Product Image */}
          {product.image_url && (
            <div className="mb-6 flex justify-center">
              <img
                src={product.image_url}
                alt={product.title}
                className="max-h-80 object-contain rounded-lg"
              />
            </div>
          )}

          {/* Platform Badge */}
          <div className="mb-4 flex items-center gap-2">
            <span className="px-3 py-1 bg-accent-50 text-accent-700 text-xs font-semibold rounded-full uppercase tracking-wide">
              {product.platform}
            </span>
            {!product.is_available && (
              <span className="px-3 py-1 bg-error-50 text-error-600 text-xs font-semibold rounded-full uppercase tracking-wide">
                Out of Stock
              </span>
            )}
          </div>

          {/* Price Section */}
          <div className="mb-6">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-4xl font-bold text-primary-900">
                {product.currency} {product.current_price?.toFixed(2) || 'N/A'}
              </span>
              {product.lowest_price !== product.current_price && (
                <span
                  className={`inline-flex items-center gap-1 text-sm font-semibold ${
                    isPriceDown ? 'text-success-600' : 'text-error-600'
                  }`}
                >
                  {isPriceDown ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  {Math.abs(priceChange).toFixed(1)}%
                </span>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-primary-100">
              <div className="text-center">
                <p className="text-xs text-primary-600 mb-1">Lowest</p>
                <p className="text-lg font-semibold text-primary-900">
                  {product.currency} {product.lowest_price?.toFixed(2) || 'N/A'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-primary-600 mb-1">Highest</p>
                <p className="text-lg font-semibold text-primary-900">
                  {product.currency} {product.highest_price?.toFixed(2) || 'N/A'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-primary-600 mb-1">You Save</p>
                <p className="text-lg font-semibold text-success-600">
                  {product.currency} {savingsAmount.toFixed(2)}
                </p>
              </div>
            </div>

            {atTargetPrice && (
              <div className="mt-4 p-3 bg-success-50 border border-success-200 rounded-lg">
                <p className="text-sm font-semibold text-success-700">
                  ✓ Target price reached! Price is at or below your target.
                </p>
              </div>
            )}
          </div>

          {/* Target Price Info */}
          {product.target_price && (
            <div className="mb-6 p-4 bg-primary-50 rounded-lg">
              <p className="text-xs text-primary-600 mb-1">Target Price</p>
              <p className="text-lg font-semibold text-primary-900">
                {product.currency} {product.target_price.toFixed(2)}
              </p>
            </div>
          )}

          {/* Last Updated */}
          {product.last_checked_at && (
            <div className="mb-6 text-xs text-primary-600">
              Last updated: {new Date(product.last_checked_at).toLocaleString()}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => window.open(product.url, '_blank')}
                className="flex-1 px-4 py-3 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View on Store
              </button>
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`px-4 py-3 rounded-lg transition font-medium flex items-center justify-center gap-2 ${
                  isWishlisted
                    ? 'bg-error-50 text-error-600 hover:bg-error-100'
                    : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                }`}
              >
                <Heart className="w-4 h-4" fill={isWishlisted ? 'currentColor' : 'none'} />
                {isWishlisted ? 'Wishlisted' : 'Wishlist'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onViewHistory(product.id)}
                className="px-4 py-3 bg-primary-100 hover:bg-primary-200 text-primary-700 font-medium rounded-lg transition"
              >
                Price History
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-3 bg-success-50 hover:bg-success-100 text-success-700 font-medium rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full px-4 py-3 bg-error-50 hover:bg-error-100 text-error-600 font-medium rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Removing...' : 'Remove Product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
