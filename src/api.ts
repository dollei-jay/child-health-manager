// Frontend API Client

const API_URL = '/api';

export const getToken = () => localStorage.getItem('token');
export const setToken = (token: string) => localStorage.setItem('token', token);
export const removeToken = () => localStorage.removeItem('token');

const headers = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const api = {
  async register(data: any) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },

  async login(data: any) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  async getProfile() {
    const res = await fetch(`${API_URL}/profile`, { headers: headers() });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch profile');
    }
    return res.json();
  },

  async updateProfile(data: any) {
    const res = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update profile');
    }
    return res.json();
  },

  async getTodos() {
    const res = await fetch(`${API_URL}/todos`, { headers: headers() });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch todos');
    }
    return res.json();
  },

  async createTodo(data: { text: string; priority?: 'low' | 'medium' | 'high'; dueDate?: string | null }) {
    const res = await fetch(`${API_URL}/todos`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create todo');
    }
    return res.json();
  },

  async updateTodo(id: number, data: { completed?: boolean; text?: string; priority?: 'low' | 'medium' | 'high'; dueDate?: string | null }) {
    const res = await fetch(`${API_URL}/todos/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update todo');
    }
    return res.json();
  },

  async deleteTodo(id: number) {
    const res = await fetch(`${API_URL}/todos/${id}`, {
      method: 'DELETE',
      headers: headers()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete todo');
    }
    return res.json();
  },

  async getWeeklyPlan() {
    const res = await fetch(`${API_URL}/weekly-plan`, { headers: headers() });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch weekly plan');
    }
    return res.json();
  },

  async saveWeeklyPlan(planData: string) {
    const res = await fetch(`${API_URL}/weekly-plan`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ planData })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save weekly plan');
    }
    return res.json();
  },

  async getChecklist() {
    const res = await fetch(`${API_URL}/checklist`, { headers: headers() });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch checklist');
    }
    return res.json();
  },

  async saveChecklist(checkedItems: string) {
    const res = await fetch(`${API_URL}/checklist`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ checkedItems })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save checklist');
    }
    return res.json();
  },

  async getGroceryList() {
    const res = await fetch(`${API_URL}/grocery-list`, { headers: headers() });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch grocery list');
    }
    return res.json();
  },

  async saveGroceryList(listData: string) {
    const res = await fetch(`${API_URL}/grocery-list`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ listData })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save grocery list');
    }
    return res.json();
  },

  async getGrowthRecords() {
    const res = await fetch(`${API_URL}/growth-records`, { headers: headers() });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch growth records');
    }
    return res.json();
  },

  async createGrowthRecord(data: any) {
    const res = await fetch(`${API_URL}/growth-records`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create growth record');
    }
    return res.json();
  },

  async deleteGrowthRecord(id: string | number) {
    const res = await fetch(`${API_URL}/growth-records/${id}`, {
      method: 'DELETE',
      headers: headers()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete growth record');
    }
    return res.json();
  },

  async getWeeklyReport(days: number = 7) {
    const res = await fetch(`${API_URL}/reports/weekly?days=${days}`, { headers: headers() });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch weekly report');
    }
    return res.json();
  }
};
