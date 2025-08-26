import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

class ApiClient {
    constructor() {
        this.client = axios.create({
            baseURL: BASE_URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        })

        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('authToken')
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`
                }
                return config
            },
            (error) => Promise.reject(error)
        )

        // Response interceptor
        this.client.interceptors.response.use(
            (response) => response.data,
            (error) => {
                if (error.response?.status === 401) {
                    // Token expired or invalid
                    localStorage.removeItem('authToken')
                    localStorage.removeItem('userId')
                    window.location.href = '/login'
                }
                return Promise.reject(error)
            }
        )
    }

    setAuthToken(token) {
        if (token) {
            this.client.defaults.headers.Authorization = `Bearer ${token}`
        } else {
            delete this.client.defaults.headers.Authorization
        }
    }

    async get(url, config = {}) {
        return this.client.get(url, config)
    }

    async post(url, data = {}, config = {}) {
        return this.client.post(url, data, config)
    }

    async put(url, data = {}, config = {}) {
        return this.client.put(url, data, config)
    }

    async delete(url, config = {}) {
        return this.client.delete(url, config)
    }
}

export const api = new ApiClient()

// Expense API methods
export const expenseAPI = {
    // Get all expenses with filters
    getAll: (params = {}) => api.get('/v1/expenses', { params }),

    // Create single expense
    create: (data) => api.post('/v1/expenses', data),

    // Create multiple expenses for a date
    createMultiple: (data) => api.post('/v1/expenses/multiple', data),

    // Update expense
    update: (id, data) => api.put(`/v1/expenses/${id}`, data),

    // Delete expense
    delete: (id) => api.delete(`/v1/expenses/${id}`),

    // Pay rent
    payRent: (data) => api.post('/v1/expenses/pay-rent', data),

    // Get rent status for current month
    getRentStatus: () => api.get('/v1/expenses/rent-status'),

    // Get restrictions for a specific date
    getRestrictions: (date) => api.get(`/v1/expenses/restrictions/${date}`)
}

// Auth API methods  
export const authAPI = {
    register: (data) => api.post('/v1/auth/register', data),
    login: (data) => api.post('/v1/auth/login', data)
}