import { useState, useEffect } from 'react'
import { getCurrentMonthRange } from '../utils/helpers'
import { expenseAPI } from '../utils/api'
import LoadingSpinner from './LoadingSpinner'
import Alert from './Alert'
import Modal from './Modal'

const RentPaymentForm = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        note: ''
    })
    const [dateRange, setDateRange] = useState({ min: '', max: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (isOpen) {
            const range = getCurrentMonthRange()
            console.log('Rent form date range:', range) // Debug log
            setDateRange(range)

            // Ensure the default date is within the allowed range
            const today = new Date().toISOString().split('T')[0]
            const defaultDate = today <= range.max ? today : range.max

            setFormData({
                amount: '',
                date: defaultDate,
                note: ''
            })
            setError('')
        }
    }, [isOpen])

    const handleChange = (e) => {
        const { name, value } = e.target

        // Additional validation for date field to ensure it's within range
        if (name === 'date') {
            const selectedDate = new Date(value)
            const minDate = new Date(dateRange.min)
            const maxDate = new Date(dateRange.max)

            // If selected date is outside allowed range, don't update
            if (selectedDate < minDate || selectedDate > maxDate) {
                setError(`Date must be within current month (${dateRange.min} to ${dateRange.max})`)
                return
            }
        }

        setFormData(prev => ({ ...prev, [name]: value }))
        if (error) setError('')
    }

    const validateForm = () => {
        if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
            setError('Please enter a valid amount')
            return false
        }

        if (!formData.date) {
            setError('Please select a date')
            return false
        }

        const selectedDate = new Date(formData.date)
        const minDate = new Date(dateRange.min)
        const maxDate = new Date(dateRange.max)

        if (selectedDate < minDate || selectedDate > maxDate) {
            setError('Date must be within the current month (1st of month to today)')
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
            const data = {
                amount: Math.round(parseFloat(formData.amount) * 100) / 100,
                date: formData.date,
                note: formData.note.trim() || null
            }

            const response = await expenseAPI.payRent(data)

            if (response.success) {
                onSuccess && onSuccess(response.data)
                onClose()
            } else {
                setError(response.message)
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to record rent payment')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Pay Rent"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <Alert
                        type="error"
                        message={error}
                        onClose={() => setError('')}
                    />
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                        Record your rent payment for the current month. Date must be within this month and not in the future.
                    </p>
                </div>

                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                        Rent Amount *
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">₨</span>
                        </div>
                        <input
                            type="number"
                            id="amount"
                            name="amount"
                            step="0.01"
                            min="0"
                            max="9999999999.99"
                            value={formData.amount}
                            onChange={handleChange}
                            className="input pl-8"
                            placeholder="0.00"
                            disabled={loading}
                            required
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Date *
                    </label>
                    <input
                        type="date"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        min={dateRange.min}
                        max={dateRange.max}
                        className="input"
                        disabled={loading}
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Must be within current month ({dateRange.min} to {dateRange.max})
                    </p>
                    {/* Debug info - remove in production */}
                    <p className="text-xs text-blue-600 mt-1">
                        Debug: min="{dateRange.min}", max="{dateRange.max}"
                    </p>
                </div>

                <div>
                    <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                        Note
                    </label>
                    <textarea
                        id="note"
                        name="note"
                        rows="3"
                        value={formData.note}
                        onChange={handleChange}
                        className="textarea"
                        placeholder="Optional note (e.g., apartment number, payment method...)"
                        maxLength="500"
                        disabled={loading}
                    />
                    <div className="text-xs text-gray-500 text-right">
                        {formData.note.length}/500
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary btn-md flex-1"
                    >
                        {loading ? (
                            <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Recording Payment...
                            </>
                        ) : (
                            'Record Rent Payment'
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="btn-secondary btn-md"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </Modal>
    )
}

export default RentPaymentForm