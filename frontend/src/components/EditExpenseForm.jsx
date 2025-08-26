import { useState, useEffect } from 'react'
import { EXPENSE_CATEGORIES, FOOD_SUBCATEGORIES, validateExpenseForm } from '../utils/helpers'
import { useExpenses } from '../context/ExpenseContext'
import LoadingSpinner from './LoadingSpinner'
import Alert from './Alert'
import Modal from './Modal'

const EditExpenseForm = ({ isOpen, onClose, expense = null }) => {
    const isEditing = !!expense
    const [formData, setFormData] = useState({
        amount: '',
        category: '',
        subcategory: '',
        date: new Date().toISOString().split('T')[0],
        note: ''
    })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const { updateExpense } = useExpenses()

    // Populate form when editing
    useEffect(() => {
        if (expense && isOpen) {
            setFormData({
                amount: expense.amount.toString(),
                category: expense.category,
                subcategory: expense.subcategory || '',
                date: expense.date.split('T')[0], // Convert to YYYY-MM-DD format
                note: expense.note || ''
            })
        }
    }, [expense, isOpen])

    // Clear errors and form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setErrors({})
            setError('')
        }
    }, [isOpen])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => {
            const updated = { ...prev, [name]: value }
            
            // Clear subcategory if category changes and is not FOOD
            if (name === 'category' && value !== 'FOOD') {
                updated.subcategory = ''
            }
            
            return updated
        })

        // Clear specific field error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
        if (error) setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const validation = validateExpenseForm(formData)

        if (!validation.isValid) {
            setErrors(validation.errors)
            return
        }

        setLoading(true)
        setError('')
        setErrors({})

        try {
            const expenseData = {
                amount: parseFloat(formData.amount),
                category: formData.category,
                subcategory: formData.subcategory || null,
                date: formData.date,
                note: formData.note.trim() || null
            }

            const result = await updateExpense(expense.id, expenseData)

            if (result.success) {
                onClose()
            } else {
                setError(result.message)
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    if (!isEditing) return null

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Expense"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <Alert
                        type="error"
                        message={error}
                        onClose={() => setError('')}
                    />
                )}

                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                        Amount *
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
                            className={`input pl-8 ${errors.amount ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                            placeholder="0.00"
                            disabled={loading}
                        />
                    </div>
                    {errors.amount && (
                        <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                    </label>
                    <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className={`select ${errors.category ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                        disabled={loading}
                    >
                        <option value="">Select a category</option>
                        {EXPENSE_CATEGORIES.map(category => (
                            <option key={category.value} value={category.value}>
                                {category.label}
                            </option>
                        ))}
                    </select>
                    {errors.category && (
                        <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                    )}
                </div>

                {formData.category === 'FOOD' && (
                    <div>
                        <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">
                            Food Type *
                        </label>
                        <select
                            id="subcategory"
                            name="subcategory"
                            value={formData.subcategory}
                            onChange={handleChange}
                            className={`select ${errors.subcategory ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                            disabled={loading}
                        >
                            <option value="">Select food type</option>
                            {FOOD_SUBCATEGORIES.map(sub => (
                                <option key={sub.value} value={sub.value}>
                                    {sub.label}
                                </option>
                            ))}
                        </select>
                        {errors.subcategory && (
                            <p className="mt-1 text-sm text-red-600">{errors.subcategory}</p>
                        )}
                    </div>
                )}

                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                        Date *
                    </label>
                    <input
                        type="date"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        max={new Date().toISOString().split('T')[0]}
                        className={`input ${errors.date ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                        disabled={loading}
                    />
                    {errors.date && (
                        <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                    )}
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
                        className={`textarea ${errors.note ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                        placeholder="Optional note about this expense..."
                        maxLength="500"
                        disabled={loading}
                    />
                    <div className="mt-1 flex justify-between">
                        {errors.note && (
                            <p className="text-sm text-red-600">{errors.note}</p>
                        )}
                        <p className="text-xs text-gray-500 ml-auto">
                            {formData.note.length}/500
                        </p>
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
                                Updating...
                            </>
                        ) : (
                            'Update Expense'
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

export default EditExpenseForm