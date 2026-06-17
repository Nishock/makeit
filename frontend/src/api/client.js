const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

class ApiClient {
  constructor() {
    this.baseUrl = API_URL;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  setToken(token) {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  }

  signup(name, email, password) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  getMe() {
    return this.request('/auth/me');
  }

  updateProfile(name) {
    return this.request('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  }

  changePassword(currentPassword, newPassword) {
    return this.request('/auth/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  getProjects() {
    return this.request('/projects');
  }

  createProject(name, description) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  getProject(projectId) {
    return this.request(`/projects/${projectId}`);
  }

  updateProject(projectId, data) {
    return this.request(`/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  addMember(projectId, email) {
    return this.request(`/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  removeMember(projectId, userId) {
    return this.request(`/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  deleteProject(projectId) {
    return this.request(`/projects/${projectId}`, { method: 'DELETE' });
  }

  getTasks(projectId) {
    return this.request(`/tasks/project/${projectId}`);
  }

  createTask(task) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  updateTask(taskId, updates) {
    return this.request(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  deleteTask(taskId) {
    return this.request(`/tasks/${taskId}`, { method: 'DELETE' });
  }

  getDashboard(projectId) {
    return this.request(`/dashboard/project/${projectId}`);
  }

  getOverview() {
    return this.request('/dashboard/overview');
  }

  getActivity() {
    return this.request('/dashboard/activity');
  }

  getProjectActivity(projectId) {
    return this.request(`/dashboard/activity/project/${projectId}`);
  }

  getUsers() {
    return this.request('/users');
  }

  searchUsers(query) {
    return this.request(`/users/search?q=${encodeURIComponent(query)}`);
  }
}

export const api = new ApiClient();
