export interface Product {
  id: string;
  user_id: string;
  url: string;
  platform: 'amazon' | 'flipkart' | 'walmart' | 'aliexpress' | 'other';
  product_id: string;
  title: string;
  image_url?: string;
  current_price?: number;
  currency: string;
  target_price?: number;
  lowest_price?: number;
  highest_price?: number;
  is_available: boolean;
  last_checked_at?: string;
  check_frequency: number;
  created_at: string;
  updated_at: string;
}

export interface PriceHistory {
  id: string;
  product_id: string;
  price: number;
  currency: string;
  is_available: boolean;
  checked_at: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  product_id?: string;
  type: 'price_drop' | 'back_in_stock' | 'target_reached' | 'scraping_error';
  title: string;
  message: string;
  old_price?: number;
  new_price?: number;
  is_read: boolean;
  sent_at?: string;
  created_at: string;
}

export interface ScrapingLog {
  id: string;
  product_id?: string;
  status: 'success' | 'failed' | 'rate_limited' | 'blocked';
  error_message?: string;
  response_time?: number;
  created_at: string;
}

export interface ScrapedProductData {
  title: string;
  price?: number;
  currency: string;
  image_url?: string;
  is_available: boolean;
  product_id: string;
}

export interface AddProductRequest {
  url: string;
  target_price?: number;
}

export interface UpdateProductRequest {
  target_price?: number;
  check_frequency?: number;
}
