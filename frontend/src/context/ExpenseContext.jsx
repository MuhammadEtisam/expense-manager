import { createContext, useContext, useState, useCallback } from 'react'
import { api } from '../utils/api'

const ExpenseContext = createContext()

export const useExpenses = () => {
    const context = useContext(ExpenseContext)
    if (!context) {
        throw new Error('useExpenses must be used within an ExpenseProvider')
    }
    return context
}

export const ExpenseProvider = ({ children }) => {
    const [expenses, setExpenses] = useState([])
    const [loading, setLoading] = useState(false)
    const [totals, setTotals] = useState({ amount: 0, count: 0 })
    const [pagination, setPagination] = useState({ total: 0, hasMore: false })

    const fetchExpenses = useCallback(async (filters = {}) => {
        setLoading(true)
        try {
            const params = new URLSearchParams()

            if (filters.from) params.append('from', filters.from)
            if (filters.to) params.append('to', filters.to)
            if (filters.category) params.append('category', filters.category)
            if (filters.offset) params.append('offset', filters.offset.toString())
            if (filters.limit) params.append('limit', filters.limit.toString())

            const response = await api.get(`/v1/expenses?${params.toString()}`)

            if (response.success) {
                const { expenses: newExpenses, totals: newTotals, pagination: newPagination } = response.data

                if (filters.offset && filters.offset > 0) {
                    // Append for pagination
                    setExpenses(prev => [...prev, ...newExpenses])
                } else {
                    // Replace for new filters
                    setExpenses(newExpenses)
                }

                setTotals(newTotals)
                setPagination(newPagination)

                return { success: true }
            } else {
                return { success: false, message: response.message }
            }
        } catch (error) {
            console.error('Fetch expenses error:', error)
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch expenses'
            }
        } finally {
            setLoading(false)
        }
    }, [])

    const addExpense = async (expenseData) => {
        try {
            const response = await api.post('/v1/expenses', expenseData)

            if (response.success) {
                // Add to the beginning of the list
                setExpenses(prev => [response.data, ...prev])
                setTotals(prev => ({
                    amount: (parseFloat(prev.amount) + parseFloat(response.data.amount)).toFixed(2),
                    count: prev.count + 1
                }))

                return { success: true, data: response.data }
            } else {
                return { success: false, message: response.message }
            }
        } catch (error) {
            console.error('Add expense error:', error)
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to add expense'
            }
        }
    }

    const updateExpense = async (id, expenseData) => {
        try {
            const response = await api.put(`/v1/expenses/${id}`, expenseData)

            if (response.success) {
                // Update in the list
                setExpenses(prev => prev.map(expense =>
                    expense.id === id ? response.data : expense
                ))

                // Recalculate totals (simple approach - could be optimized)
                const updatedExpenses = expenses.map(expense =>
                    expense.id === id ? response.data : expense
                )
                const newAmount = updatedExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
                setTotals(prev => ({ ...prev, amount: newAmount.toFixed(2) }))

                return { success: true, data: response.data }
            } else {
                return { success: false, message: response.message }
            }
        } catch (error) {
            console.error('Update expense error:', error)
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to update expense'
            }
        }
    }

    const deleteExpense = async (id) => {
        try {
            const response = await api.delete(`/v1/expenses/${id}`)

            if (response.success) {
                const expenseToDelete = expenses.find(exp => exp.id === id)

                // Remove from the list
                setExpenses(prev => prev.filter(expense => expense.id !== id))

                // Update totals
                if (expenseToDelete) {
                    setTotals(prev => ({
                        amount: (parseFloat(prev.amount) - parseFloat(expenseToDelete.amount)).toFixed(2),
                        count: prev.count - 1
                    }))
                }

                return { success: true }
            } else {
                return { success: false, message: response.message }
            }
        } catch (error) {
            console.error('Delete expense error:', error)
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to delete expense'
            }
        }
    }

    const value = {
        expenses,
        loading,
        totals,
        pagination,
        fetchExpenses,
        addExpense,
        updateExpense,
        deleteExpense
    }

    return (
        <ExpenseContext.Provider value={value}>
            {children}
        </ExpenseContext.Provider>
    )
}