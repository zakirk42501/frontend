const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/$/, '');
const GET_CACHE_TTL_MS = 30000;
const getCache = new Map();

const cloneData = (data) => {
  if (data == null) return data;
  if (typeof structuredClone === 'function') {
    return structuredClone(data);
  }
  return JSON.parse(JSON.stringify(data));
};

const clearGetCache = () => {
  getCache.clear();
};

const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const method = options.method || 'GET';
  const isGet = method === 'GET';
  const useCache = isGet && !options.force;
  const cacheKey = endpoint;

  if (useCache) {
    const cached = getCache.get(cacheKey);
    if (cached?.data && Date.now() - cached.timestamp < GET_CACHE_TTL_MS) {
      return cloneData(cached.data);
    }
    if (cached?.promise) {
      return cloneData(await cached.promise);
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    method,
    headers,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const fetchPromise = (async () => {
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
  })();

  if (useCache) {
    getCache.set(cacheKey, { promise: fetchPromise, timestamp: Date.now() });
  }

  try {
    const data = await fetchPromise;

    if (useCache) {
      getCache.set(cacheKey, { data: cloneData(data), timestamp: Date.now() });
    } else if (!isGet) {
      clearGetCache();
    }

    return cloneData(data);
  } catch (error) {
    if (useCache) {
      getCache.delete(cacheKey);
    }
    throw error;
  }
};

const api = {
  get: (endpoint, options = {}) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
  clearCache: clearGetCache,
};

export default api;
