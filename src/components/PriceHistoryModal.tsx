import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchPriceHistory } from '../lib/api';

interface PriceHistoryModalProps {
  productId: string | null;
  productTitle: string;
  onClose: () => void;
}

interface PriceHistoryEntry {
  id: string;
  price: number;
  checked_at: string;
  is_available: boolean;
}

export function PriceHistoryModal({ productId, productTitle, onClose }: PriceHistoryModalProps) {
  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;

    const loadHistory = async () => {
      try {
        const data = await fetchPriceHistory(productId);
        setHistory(data.history.reverse());
      } catch (error) {
        console.error('Failed to load price history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [productId]);

  if (!productId) return null;

  const chartData = history.map((entry) => ({
    date: new Date(entry.checked_at).toLocaleDateString(),
    price: entry.price,
  }));

  const minPrice = Math.min(...history.map((h) => h.price));
  const maxPrice = Math.max(...history.map((h) => h.price));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Price History</h2>
            <p className="text-slate-600 text-sm mt-1">{productTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No price history available yet
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-600 mb-1">Current Price</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${history[history.length - 1].price.toFixed(2)}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-700 mb-1">Lowest Price</p>
                <p className="text-2xl font-bold text-green-900">${minPrice.toFixed(2)}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-red-700 mb-1">Highest Price</p>
                <p className="text-2xl font-bold text-red-900">${maxPrice.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    stroke="#64748b"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#64748b"
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-slate-900 mb-3">Recent Checks</h3>
              {history.slice(-10).reverse().map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg"
                >
                  <span className="text-sm text-slate-600">
                    {new Date(entry.checked_at).toLocaleString()}
                  </span>
                  <span className="font-semibold text-slate-900">
                    ${entry.price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
