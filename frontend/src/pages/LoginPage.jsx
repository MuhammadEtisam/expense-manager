import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { incrementLoginCount } from '../utils/helpers'
import LoadingSpinner from '../components/LoadingSpinner'
import Alert from '../components/Alert'

const LoginPage = () => {
    const [formData, setFormData] = useState({
        legacy_id: '',
        password: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const { login } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
        if (error) setError('') // Clear error when user starts typing
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.legacy_id || !formData.password) {
            setError('Please fill in all fields')
            return
        }

        setLoading(true)
        setError('')

        try {
            const result = await login(formData)

            if (result.success) {
                incrementLoginCount()
                navigate('/dashboard', { replace: true })
            } else {
                setError(result.message || 'Login failed')
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Or{' '}
                        <Link
                            to="/register"
                            className="font-medium text-primary-600 hover:text-primary-500"
                        >
                            create a new account
                        </Link>
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    {error && (
                        <Alert
                            type="error"
                            message={error}
                            onClose={() => setError('')}
                        />
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="legacy_id" className="block text-sm font-medium text-gray-700">
                                User ID
                            </label>
                            <input
                                id="legacy_id"
                                name="legacy_id"
                                type="text"
                                autoComplete="username"
                                required
                                value={formData.legacy_id}
                                onChange={handleChange}
                                className="mt-1 input"
                                placeholder="Enter your user ID"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="mt-1 input"
                                placeholder="Enter your password"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary btn-lg w-full"
                            >
                                {loading ? (
                                    <>
                                        <LoadingSpinner size="sm" className="mr-2" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign in'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default LoginPage