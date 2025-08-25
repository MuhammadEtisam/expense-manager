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