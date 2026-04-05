const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/$/, '');

const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const text = await response.text();
    let data = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!response.ok) {
      throw {
        status: response.status,
        message: data?.message || data?.error || 'An error occurred',
        data,
      };
    }

    return data;
  } catch (error) {
    if (error?.status) throw error;
    throw { message: error?.message || 'Network error' };
  }
};

const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

export default api;
