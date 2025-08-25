import { useState, useEffect } from 'react'
import { PlusIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../context/AuthContext'
import { useExpenses } from '../context/ExpenseContext'
import { shouldShowRentReminder, checkHasRentThisMonth, clearExpiredData } from '../utils/helpers'
import ExpenseList from '../components/ExpenseList'
import ExpenseForm from '../components/ExpenseForm'
import ExpenseFilters from '../components/ExpenseFilters'
import ExpenseTotals from '../components/ExpenseTotals'
import RentBanner from '../components/RentBanner'
import LoadingSpinner from '../components/LoadingSpinner'

const DashboardPage = () => {
    const { user, logout } = useAuth()
    const { expenses, loading, totals, pagination, fetchExpenses } = useExpenses()

    const [showExpenseForm, setShowExpenseForm] = useState(false)
    const [editingExpense, setEditingExpense] = useState(null)
    const [showRentBanner, setShowRentBanner] = useState(false)
    const [filters, setFilters] = useState({
        from: null,
        to: null,
        category: null
    })
    const [initialLoading, setInitialLoading] = useState(true)

    useEffect(() => {
        // Clear expired localStorage data
        clearExpiredData()

        // Load initial expenses
        loadExpenses()
    }, [])

    useEffect(() => {
        // Check rent reminder after expenses are loaded
        if (!loading && expenses.length >= 0) {
            const hasRentThisMonth = checkHasRentThisMonth(expenses)
            const shouldShow = shouldShowRentReminder() && !hasRentThisMonth
            setShowRentBanner(shouldShow)
        }
    }, [expenses, loading])

    const loadExpenses = async (newFilters = filters, append = false) => {
        const params = {
            ...newFilters,
            limit: 20,
            offset: append ? expenses.length : 0
        }

        await fetchExpenses(params)

        if (initialLoading) {
            setInitialLoading(false)
        }
    }

    const handleFiltersChange = (newFilters) => {
        setFilters(newFilters)
        loadExpenses(newFilters, false)
    }

    const handleAddExpense = () => {
        setEditingExpense(null)
        setShowExpenseForm(true)
    }

    const handleEditExpense = (expense) => {
        setEditingExpense(expense)
        setShowExpenseForm(true)
    }

    const handleCloseExpenseForm = () => {
        setShowExpenseForm(false)
        setEditingExpense(null)
    }

    const handleLoadMore = () => {
        loadExpenses(filters, true)
    }

    const handleLogout = () => {
        logout()
    }

    if (initialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="xl" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">
                                Expense Manager
                            </h1>
                            <p className="text-sm text-gray-600">
                                Welcome back, {user?.userId}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleAddExpense}
                                className="btn-primary btn-md"
                            >
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Add Expense
                            </button>
                            <button
                                onClick={handleLogout}
                                className="btn-secondary btn-md"
                                title="Sign out"
                            >
                                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-6">
                    {/* Rent Banner */}
                    {showRentBanner && (
                        <RentBanner onClose={() => setShowRentBanner(false)} />
                    )}

                    {/* Totals */}
                    <ExpenseTotals
                        totals={totals}
                        loading={loading && expenses.length === 0}
                    />

                    {/* Filters */}
                    <ExpenseFilters
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                    />

                    {/* Expense List */}
                    <div className="bg-white border border-gray-200 rounded-lg">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Expenses
                                </h2>
                                <div className="text-sm text-gray-600">
                                    {!loading && expenses.length > 0 && (
                                        `Showing ${expenses.length} of ${pagination.total} expenses`
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <ExpenseList
                                expenses={expenses}
                                onEdit={handleEditExpense}
                                loading={loading}
                                onLoadMore={handleLoadMore}
                                hasMore={pagination.hasMore}
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Expense Form Modal */}
            <ExpenseForm
                isOpen={showExpenseForm}
                onClose={handleCloseExpenseForm}
                expense={editingExpense}
            />
        </div>
    )
}

export default DashboardPage