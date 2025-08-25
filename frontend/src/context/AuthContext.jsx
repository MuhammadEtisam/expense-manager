import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../utils/api'

const AuthContext = createContext()

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('authToken')
        const userId = localStorage.getItem('userId')

        if (token && userId) {
            setUser({ token, userId })
            api.setAuthToken(token)
        }

        setLoading(false)
    }, [])

    const login = async (credentials) => {
        try {
            const response = await api.post('/v1/auth/login', credentials)

            if (response.success) {
                const { token, userId } = response.data

                localStorage.setItem('authToken', token)
                localStorage.setItem('userId', userId)

                setUser({ token, userId })
                api.setAuthToken(token)

                return { success: true }
            } else {
                return { success: false, message: response.message }
            }
        } catch (error) {
            console.error('Login error:', error)
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            }
        }
    }

    const register = async (userData) => {
        try {
            const response = await api.post('/v1/auth/register', userData)

            if (response.success) {
                return { success: true }
            } else {
                return { success: false, message: response.message }
            }
        } catch (error) {
            console.error('Register error:', error)
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            }
        }
    }

    const logout = () => {
        localStorage.removeItem('authToken')
        localStorage.removeItem('userId')
        localStorage.removeItem('rentReminderSuppressed')

        setUser(null)
        api.setAuthToken(null)
    }

    const value = {
        user,
        login,
        register,
        logout,
        loading
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}