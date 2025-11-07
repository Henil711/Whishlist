import { supabase } from './supabase';

const API_BASE_URL = 'http://localhost:3001/api';

async function getAuthHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
}

export async function fetchProducts() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/products`, { headers });

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return response.json();
}

export async function addProduct(url: string, targetPrice?: number) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ url, target_price: targetPrice }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add product');
  }

  return response.json();
}

export async function updateProduct(
  id: string,
  data: { target_price?: number; check_frequency?: number }
) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update product');
  }

  return response.json();
}

export async function deleteProduct(id: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to delete product');
  }

  return response.json();
}

export async function refreshProduct(id: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/products/${id}/refresh`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to refresh product');
  }

  return response.json();
}

export async function fetchPriceHistory(id: string, limit = 30) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/products/${id}/history?limit=${limit}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch price history');
  }

  return response.json();
}

export async function fetchNotifications(unreadOnly = false) {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/notifications?unread_only=${unreadOnly}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }

  return response.json();
}

export async function markNotificationAsRead(id: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: 'PATCH',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to mark notification as read');
  }

  return response.json();
}

export async function markAllNotificationsAsRead() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to mark all notifications as read');
  }

  return response.json();
}

export async function deleteNotification(id: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to delete notification');
  }

  return response.json();
}
