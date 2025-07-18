import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    specialty?: string;
    licenseNumber?: string;
  }) => api.post('/auth/register', userData),
  
  getCurrentUser: () => api.get('/auth/me'),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  
  updateProfile: (profileData: any) =>
    api.put('/users/profile', profileData),
  
  getAllUsers: (params?: any) => api.get('/users', { params }),
  
  getUsersForMessaging: (params?: any) => api.get('/users/messaging', { params }),
  
  getUserById: (id: string) => api.get(`/users/${id}`),
  
  updateUser: (id: string, userData: any) =>
    api.put(`/users/${id}`, userData),
  
  deleteUser: (id: string) => api.delete(`/users/${id}`),
};

// Doctors API
export const doctorsAPI = {
  getAllDoctors: (params?: any) => api.get('/doctors', { params }),
  
  getDoctorById: (id: string) => api.get(`/doctors/${id}`),
  
  getDoctorProfile: () => api.get('/doctors/profile/me'),
  
  updateDoctorProfile: (profileData: any) =>
    api.put('/doctors/profile/me', profileData),
  
  getDoctorAppointments: (params?: any) =>
    api.get('/doctors/appointments/me', { params }),
  
  updateAppointmentStatus: (id: string, statusData: any) =>
    api.put(`/doctors/appointments/${id}/status`, statusData),
  
  getDoctorStats: () => api.get('/doctors/stats/me'),
};

// Appointments API
export const appointmentsAPI = {
  bookAppointment: (appointmentData: any) =>
    api.post('/appointments', appointmentData),
  
  getMyAppointments: (params?: any) =>
    api.get('/appointments/my-appointments', { params }),
  
  getAppointmentById: (id: string) => api.get(`/appointments/${id}`),
  
  cancelAppointment: (id: string) =>
    api.put(`/appointments/${id}/cancel`),
  
  getAllAppointments: (params?: any) =>
    api.get('/appointments', { params }),
  
  getAppointmentStats: () => api.get('/appointments/stats/overview'),
  
  markAsComplete: (id: string) =>
    api.put(`/appointments/${id}/complete`),
};

// Messages API
export const messagesAPI = {
  sendMessage: (messageData: any) => api.post('/messages/send', messageData),
  
  getConversation: (userId: string, params?: any) =>
    api.get(`/messages/conversation/${userId}`, { params }),
  
  getConversations: () => api.get('/messages/conversations'),
  
  markAsRead: (senderId: string) =>
    api.put(`/messages/read/${senderId}`),
  
  getUnreadCount: () => api.get('/messages/unread/count'),
  
  deleteMessage: (id: string) => api.delete(`/messages/${id}`),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  
  getUserStats: () => api.get('/admin/stats/users'),
  
  getAppointmentStats: () => api.get('/admin/stats/appointments'),
  
  getRevenueStats: (params?: any) =>
    api.get('/admin/stats/revenue', { params }),
  
  getDoctorStats: () => api.get('/admin/stats/doctors'),
  
  getPendingDoctors: () => api.get('/admin/doctors/pending'),
  
  getAllDoctors: (params?: any) => api.get('/admin/doctors', { params }),
  
  verifyDoctor: (id: string) => api.put(`/admin/doctors/${id}/verify`),
  
  rejectDoctor: (id: string, reason?: string) => 
    api.put(`/admin/doctors/${id}/reject`, { reason }),
  
  getLogs: () => api.get('/admin/logs'),
  
  getAllUsers: (params?: any) => api.get('/admin/users', { params }),
  
  updateUser: (id: string, userData: any) =>
    api.put(`/admin/users/${id}`, userData),
  
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  
  getAllAppointments: (params?: any) => api.get('/admin/appointments', { params }),
};

export default api; 