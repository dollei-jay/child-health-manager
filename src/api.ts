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

  async getWeeklyReview(weekStart: string) {
    const res = await fetch(`${API_URL}/weekly-review?weekStart=${encodeURIComponent(weekStart)}`, { headers: headers() });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch weekly review');
    }
    return res.json();
  },

  async getChildren() {
    const res = await fetch(`${API_URL}/children`, { headers: headers() });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch children');
    }
    return res.json();
  },

  async createChild(data: { childName: string; childBirthDate?: string | null; childGender?: 'boy' | 'girl'; childGoal?: string }) {
    const res = await fetch(`${API_URL}/children`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create child');
    }
    return res.json();
  },

  async updateChild(id: number, data: { childName: string; childBirthDate?: string | null; childGender?: 'boy' | 'girl'; childGoal?: string }) {
    const res = await fetch(`${API_URL}/children/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update child');
    }
    return res.json();
  },

  async selectChild(id: number) {
    const res = await fetch(`${API_URL}/children/${id}/select`, {
      method: 'POST',
      headers: headers()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to select child');
    }
    return res.json();
  },

  async deleteChild(id: number, targetChildId?: number) {
    const res = await fetch(`${API_URL}/children/${id}`, {
      method: 'DELETE',
      headers: headers(),
      body: JSON.stringify({ targetChildId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete child');
    }
    return res.json();
  },

  async saveWeeklyReview(data: { weekStart: string; summary: string; blockers: string; nextFocus: string; score: number }) {
    const res = await fetch(`${API_URL}/weekly-review`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save weekly review');
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
  },

  async getReminders() {
    const res = await fetch(`${API_URL}/reminders`, { headers: headers() });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch reminders');
    }
    return res.json();
  },

  async exportCsv(type: 'growth' | 'todos') {
    const res = await fetch(`${API_URL}/export/csv?type=${encodeURIComponent(type)}`, { headers: headers() });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to export csv');
    }
    return res.blob();
  },

  async markReminderRead(type: string, hash: string) {
    const res = await fetch(`${API_URL}/reminders/${encodeURIComponent(type)}/${encodeURIComponent(hash)}/read`, {
      method: 'POST',
      headers: headers()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to mark reminder read');
    }
    return res.json();
  },

  async snoozeReminder(type: string, hash: string, minutes: number = 60) {
    const res = await fetch(`${API_URL}/reminders/${encodeURIComponent(type)}/${encodeURIComponent(hash)}/snooze`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ minutes })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to snooze reminder');
    }
    return res.json();
  }
};
