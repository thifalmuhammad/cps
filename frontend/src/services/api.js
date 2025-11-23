const API_BASE_URL = 'http://localhost:5000/api';

// User API
export const userAPI = {
  register: async (data) => {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/users`);
    return response.json();
  },

  getById: async (uuid) => {
    const response = await fetch(`${API_BASE_URL}/users/${uuid}`);
    return response.json();
  },
};

// District API
export const districtAPI = {
  create: async (data) => {
    const response = await fetch(`${API_BASE_URL}/districts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/districts`);
    return response.json();
  },

  getById: async (uuid) => {
    const response = await fetch(`${API_BASE_URL}/districts/${uuid}`);
    return response.json();
  },

  update: async (uuid, data) => {
    const response = await fetch(`${API_BASE_URL}/districts/${uuid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  delete: async (uuid) => {
    const response = await fetch(`${API_BASE_URL}/districts/${uuid}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};

// Farm API
export const farmAPI = {
  create: async (data) => {
    const response = await fetch(`${API_BASE_URL}/farms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/farms`);
    return response.json();
  },

  getById: async (uuid) => {
    const response = await fetch(`${API_BASE_URL}/farms/${uuid}`);
    return response.json();
  },

  update: async (uuid, data) => {
    const response = await fetch(`${API_BASE_URL}/farms/${uuid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  delete: async (uuid) => {
    const response = await fetch(`${API_BASE_URL}/farms/${uuid}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};

// Productivity API
export const productivityAPI = {
  create: async (data) => {
    const response = await fetch(`${API_BASE_URL}/productivities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/productivities`);
    return response.json();
  },

  getById: async (uuid) => {
    const response = await fetch(`${API_BASE_URL}/productivities/${uuid}`);
    return response.json();
  },

  update: async (uuid, data) => {
    const response = await fetch(`${API_BASE_URL}/productivities/${uuid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  delete: async (uuid) => {
    const response = await fetch(`${API_BASE_URL}/productivities/${uuid}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};

// Warehouse API
export const warehouseAPI = {
  create: async (data) => {
    const response = await fetch(`${API_BASE_URL}/warehouses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/warehouses`);
    return response.json();
  },

  getById: async (uuid) => {
    const response = await fetch(`${API_BASE_URL}/warehouses/${uuid}`);
    return response.json();
  },

  update: async (uuid, data) => {
    const response = await fetch(`${API_BASE_URL}/warehouses/${uuid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  delete: async (uuid) => {
    const response = await fetch(`${API_BASE_URL}/warehouses/${uuid}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};
