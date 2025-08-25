import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import Alert from '../components/Alert'

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        legacy_id: '',
        password: '',
        confirmPassword: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const { register } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
        if (error) setError('') // Clear error when user starts typing
    }

    const validateForm = () => {
        if (!formData.legacy_id || !formData.password || !formData.confirmPassword) {
            setError('Please fill in all fields')
            return false
        }

        if (formData.legacy_id.length < 3) {
            setError('User ID must be at least 3 characters long')
            return false
        }

        if (!/^[a-zA-Z0-9]+$/.test(formData.legacy_id)) {
            setError('User ID must contain only letters and numbers')
            return false
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long')
            return false
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            return false
        }

        return true
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) return

        setLoading(true)
        setError('')

        try {
            const result = await register({
                legacy_id: formData.legacy_id,
                password: formData.password
            })

            if (result.success) {
                setSuccess(true)
                setTimeout(() => {
                    navigate('/login')
                }, 2000)
            } else {
                setError(result.message || 'Registration failed')
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-md w-full text-center">
                    <Alert
                        type="success"
                        title="Account created successfully!"
                        message="You will be redirected to the login page shortly."
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
                        Create your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Or{' '}
                        <Link
                            to="/login"
                            className="font-medium text-primary-600 hover:text-primary-500"
                        >
                            sign in to existing account
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
                                placeholder="Choose a unique user ID"
                                disabled={loading}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                3-30 characters, letters and numbers only
                            </p>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="mt-1 input"
                                placeholder="Choose a secure password"
                                disabled={loading}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                At least 6 characters
                            </p>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="mt-1 input"
                                placeholder="Confirm your password"
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
                                        Creating account...
                                    </>
                                ) : (
                                    'Create account'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default RegisterPage