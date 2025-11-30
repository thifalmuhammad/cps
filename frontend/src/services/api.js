const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// URL validation to prevent SSRF
const validateUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    const baseUrl = new URL(API_BASE_URL);

    // Only allow URLs with same hostname and port as API_BASE_URL
    return parsedUrl.hostname === baseUrl.hostname &&
      parsedUrl.port === baseUrl.port &&
      parsedUrl.protocol === baseUrl.protocol;
  } catch {
    return false;
  }
};

// API helper function with error handling
const apiRequest = async (url, options = {}) => {
  // Validate URL to prevent SSRF
  if (!validateUrl(url)) {
    throw new Error('Invalid or unauthorized URL');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        // If response is not JSON, create a default error object
        errorData = {
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      
      // Create error with more details
      const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

// User API
export const userAPI = {
  register: async (data) => {
    return apiRequest(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login: async (data) => {
    if (!data || !data.email || !data.password) {
      throw new Error('Email and password are required');
    }
    return apiRequest(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAll: async () => {
    return apiRequest(`${API_BASE_URL}/users`);
  },

  getById: async (uuid) => {
    if (!uuid) throw new Error('UUID is required');
    return apiRequest(`${API_BASE_URL}/users/${uuid}`);
  },
};

// District API
export const districtAPI = {
  create: async (data) => {
    if (!data || !data.districtCode || !data.districtName) {
      throw new Error('District code and name are required');
    }
    return apiRequest(`${API_BASE_URL}/districts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAll: async () => {
    return apiRequest(`${API_BASE_URL}/districts`);
  },

  getById: async (uuid) => {
    if (!uuid) throw new Error('UUID is required');
    return apiRequest(`${API_BASE_URL}/districts/${uuid}`);
  },

  update: async (uuid, data) => {
    if (!uuid) throw new Error('UUID is required');
    if (!data || (!data.districtCode && !data.districtName)) {
      throw new Error('At least one field (districtCode or districtName) is required');
    }
    return apiRequest(`${API_BASE_URL}/districts/${uuid}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (uuid) => {
    if (!uuid) throw new Error('UUID is required');
    return apiRequest(`${API_BASE_URL}/districts/${uuid}`, {
      method: 'DELETE',
    });
  },
};

// Farm API
export const farmAPI = {
  create: async (data) => {
    if (!data) throw new Error('Farm data is required');
    return apiRequest(`${API_BASE_URL}/farms`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAll: async () => {
    return apiRequest(`${API_BASE_URL}/farms`);
  },

  getById: async (uuid) => {
    if (!uuid) throw new Error('UUID is required');
    return apiRequest(`${API_BASE_URL}/farms/${uuid}`);
  },

  update: async (uuid, data) => {
    if (!uuid) throw new Error('UUID is required');
    if (!data) throw new Error('Update data is required');
    return apiRequest(`${API_BASE_URL}/farms/${uuid}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (uuid) => {
    if (!uuid) throw new Error('UUID is required');
    return apiRequest(`${API_BASE_URL}/farms/${uuid}`, {
      method: 'DELETE',
    });
  },

  getPending: async () => {
    return apiRequest(`${API_BASE_URL}/farms/pending`);
  },

  verify: async (farmId, data) => {
    if (!farmId) throw new Error('Farm ID is required');
    if (!data) throw new Error('Verification data is required');
    return apiRequest(`${API_BASE_URL}/farms/${farmId}/verify`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  reject: async (farmId, data) => {
    if (!farmId) throw new Error('Farm ID is required');
    if (!data) throw new Error('Rejection data is required');
    return apiRequest(`${API_BASE_URL}/farms/${farmId}/reject`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getByDistrict: async (districtId) => {
    if (!districtId) throw new Error('District ID is required');
    return apiRequest(`${API_BASE_URL}/districts/${districtId}/farms`);
  }
};

// Productivity API
export const productivityAPI = {
  create: async (data) => {
    if (!data) throw new Error('Productivity data is required');
    return apiRequest(`${API_BASE_URL}/productivities`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAll: async () => {
    return apiRequest(`${API_BASE_URL}/productivities`);
  },

  getById: async (uuid) => {
    if (!uuid) throw new Error('UUID is required');
    return apiRequest(`${API_BASE_URL}/productivities/${uuid}`);
  },

  update: async (uuid, data) => {
    if (!uuid) throw new Error('UUID is required');
    if (!data) throw new Error('Update data is required');
    return apiRequest(`${API_BASE_URL}/productivities/${uuid}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (uuid) => {
    if (!uuid) throw new Error('UUID is required');
    return apiRequest(`${API_BASE_URL}/productivities/${uuid}`, {
      method: 'DELETE',
    });
  },
};

// Warehouse API
export const warehouseAPI = {
  create: async (data) => {
    if (!data || !data.productivityId || !data.quantityStored || !data.storageLocation || !data.dateStored) {
      throw new Error('Productivity ID, quantity stored, storage location, and date stored are required');
    }
    return apiRequest(`${API_BASE_URL}/warehouses`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAll: async () => {
    return apiRequest(`${API_BASE_URL}/warehouses`);
  },

  getById: async (uuid) => {
    if (!uuid) throw new Error('UUID is required');
    return apiRequest(`${API_BASE_URL}/warehouses/${uuid}`);
  },

  update: async (uuid, data) => {
    if (!uuid) throw new Error('UUID is required');
    return apiRequest(`${API_BASE_URL}/warehouses/${uuid}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (uuid) => {
    if (!uuid) throw new Error('UUID is required');
    return apiRequest(`${API_BASE_URL}/warehouses/${uuid}`, {
      method: 'DELETE',
    });
  },
};
