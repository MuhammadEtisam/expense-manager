import { useState, useEffect } from 'react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { EXPENSE_CATEGORIES, FOOD_SUBCATEGORIES, validateExpenseForm } from '../utils/helpers'
import { expenseAPI } from '../utils/api'
import LoadingSpinner from './LoadingSpinner'
import Alert from './Alert'
import Modal from './Modal'

const ExpenseForm = ({ isOpen, onClose, onSuccess }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [expenses, setExpenses] = useState([{
        id: Date.now(),
        amount: '',
        category: '',
        subcategory: '',
        note: ''
    }])
    const [restrictions, setRestrictions] = useState({ unavailableFood: [], rentPaid: false })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [dateChanged, setDateChanged] = useState(false)

    // Load restrictions when date changes
    useEffect(() => {
        if (selectedDate && isOpen) {
            loadRestrictions()
        }
    }, [selectedDate, isOpen])

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            resetForm()
        }
    }, [isOpen])

    const loadRestrictions = async () => {
        try {
            const response = await expenseAPI.getRestrictions(selectedDate)
            setRestrictions(response.data)
        } catch (error) {
            console.error('Failed to load restrictions:', error)
            setRestrictions({ unavailableFood: [], rentPaid: false })
        }
    }

    const resetForm = () => {
        setExpenses([{
            id: Date.now(),
            amount: '',
            category: '',
            subcategory: '',
            note: ''
        }])
        setError('')
        setDateChanged(false)
    }

    const handleDateChange = (newDate) => {
        if (newDate !== selectedDate && expenses.some(exp => exp.amount || exp.category || exp.note)) {
            if (!confirm('Changing the date will reset entered expenses. Continue?')) {
                return
            }
            resetForm()
        }
        setSelectedDate(newDate)
        setDateChanged(true)
    }

    const addExpenseRow = () => {
        setExpenses([...expenses, {
            id: Date.now() + Math.random(),
            amount: '',
            category: '',
            subcategory: '',
            note: ''
        }])
    }

    const removeExpenseRow = (id) => {
        if (expenses.length > 1) {
            setExpenses(expenses.filter(exp => exp.id !== id))
        }
    }

    const updateExpense = (id, field, value) => {
        setExpenses(expenses.map(exp => {
            if (exp.id === id) {
                const updated = { ...exp, [field]: value }

                // Clear subcategory if category changes and is not FOOD
                if (field === 'category' && value !== 'FOOD') {
                    updated.subcategory = ''
                }

                return updated
            }
            return exp
        }))

        if (error) setError('')
    }

    const getAvailableCategories = (currentExpenseId) => {
        const usedCategories = expenses
            .filter(exp => exp.id !== currentExpenseId && exp.category === 'RENT')
            .map(exp => exp.category)

        return EXPENSE_CATEGORIES.filter(cat => {
            if (cat.value === 'RENT') {
                // Check if rent is already paid or used in form
                return !restrictions.rentPaid && !usedCategories.includes('RENT')
            }
            return true
        })
    }

    const getAvailableSubcategories = (currentExpenseId) => {
        const usedSubcategories = [...restrictions.unavailableFood]

        // Add subcategories already used in current form
        expenses.forEach(exp => {
            if (exp.id !== currentExpenseId && exp.category === 'FOOD' && exp.subcategory) {
                const subcategory = FOOD_SUBCATEGORIES.find(sub => sub.value === exp.subcategory)
                if (subcategory && subcategory.restricted) {
                    usedSubcategories.push(exp.subcategory)
                }
            }
        })

        return FOOD_SUBCATEGORIES.filter(sub => !usedSubcategories.includes(sub.value))
    }

    const validateForm = () => {
        const validExpenses = expenses.filter(exp => exp.amount || exp.category || exp.note)

        if (validExpenses.length === 0) {
            setError('Please add at least one expense')
            return false
        }

        // Validate each expense
        for (const expense of validExpenses) {
            const validation = validateExpenseForm({ ...expense, date: selectedDate })
            if (!validation.isValid) {
                const errorMessages = Object.values(validation.errors)
                setError(`Error in expense: ${errorMessages[0]}`)
                return false
            }
        }

        return { validExpenses }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const validation = validateForm()
        if (!validation) return

        setLoading(true)
        setError('')

        try {
            const data = {
                date: selectedDate,
                expenses: validation.validExpenses.map(exp => ({
                    amount: parseFloat(exp.amount),
                    category: exp.category,
                    subcategory: exp.subcategory || null,
                    note: exp.note.trim() || null
                }))
            }

            const response = await expenseAPI.createMultiple(data)

            if (response.success) {
                onSuccess && onSuccess(response.data)
                onClose()
            } else {
                setError(response.message)
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create expenses')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add Expenses"
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <Alert
                        type="error"
                        message={error}
                        onClose={() => setError('')}
                    />
                )}

                {/* Date Selection - First Step */}
                <div className="border-b border-gray-200 pb-4">
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                        Select Date *
                    </label>
                    <input
                        type="date"
                        id="date"
                        value={selectedDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="input max-w-xs"
                        disabled={loading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        You must select a date before adding expenses
                    </p>
                </div>

                {/* Expenses List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-700">Expenses for {selectedDate}</h3>
                        <button
                            type="button"
                            onClick={addExpenseRow}
                            className="btn-primary btn-sm"
                            disabled={loading}
                        >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            Add Row
                        </button>
                    </div>

                    {expenses.map((expense, index) => (
                        <div key={expense.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600">Expense #{index + 1}</span>
                                {expenses.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeExpenseRow(expense.id)}
                                        className="text-red-600 hover:text-red-700"
                                        disabled={loading}
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Amount */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Amount *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 text-sm">₨</span>
                                        </div>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={expense.amount}
                                            onChange={(e) => updateExpense(expense.id, 'amount', e.target.value)}
                                            className="input pl-8"
                                            placeholder="0.00"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Category *
                                    </label>
                                    <select
                                        value={expense.category}
                                        onChange={(e) => updateExpense(expense.id, 'category', e.target.value)}
                                        className="select"
                                        disabled={loading}
                                    >
                                        <option value="">Select category</option>
                                        {getAvailableCategories(expense.id).map(category => (
                                            <option key={category.value} value={category.value}>
                                                {category.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Food Subcategory */}
                            {expense.category === 'FOOD' && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Food Type *
                                    </label>
                                    <select
                                        value={expense.subcategory}
                                        onChange={(e) => updateExpense(expense.id, 'subcategory', e.target.value)}
                                        className="select"
                                        disabled={loading}
                                    >
                                        <option value="">Select food type</option>
                                        {getAvailableSubcategories(expense.id).map(sub => (
                                            <option key={sub.value} value={sub.value} disabled={restrictions.unavailableFood.includes(sub.value)}>
                                                {sub.label}
                                                {restrictions.unavailableFood.includes(sub.value) && ' (Already taken)'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Note */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Note
                                </label>
                                <input
                                    type="text"
                                    value={expense.note}
                                    onChange={(e) => updateExpense(expense.id, 'note', e.target.value)}
                                    className="input"
                                    placeholder="Optional note..."
                                    maxLength="500"
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary btn-md flex-1"
                    >
                        {loading ? (
                            <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Adding Expenses...
                            </>
                        ) : (
                            'Add Expenses'
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

export default ExpenseForm