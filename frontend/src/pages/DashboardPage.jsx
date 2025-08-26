import { useState, useEffect } from 'react'
import { PlusIcon, ArrowRightOnRectangleIcon, HomeIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../context/AuthContext'
import { useExpenses } from '../context/ExpenseContext'
import { shouldShowRentReminder, checkHasRentThisMonth, clearExpiredData, incrementLoginCount } from '../utils/helpers'
import { expenseAPI } from '../utils/api'
import ExpenseList from '../components/ExpenseList'
import ExpenseForm from '../components/ExpenseForm'
import EditExpenseForm from '../components/EditExpenseForm'
import RentPaymentForm from '../components/RentPaymentForm'
import ExpenseFilters from '../components/ExpenseFilters'
import ExpenseTotals from '../components/ExpenseTotals'
import RentBanner from '../components/RentBanner'
import LoadingSpinner from '../components/LoadingSpinner'

const DashboardPage = () => {
    const { user, logout } = useAuth()
    const { expenses, loading, totals, pagination, fetchExpenses } = useExpenses()

    const [showExpenseForm, setShowExpenseForm] = useState(false)
    const [showRentForm, setShowRentForm] = useState(false)
    const [editingExpense, setEditingExpense] = useState(null)
    const [showRentBanner, setShowRentBanner] = useState(false)
    const [rentPaid, setRentPaid] = useState(false)
    const [filters, setFilters] = useState({
        from: null,
        to: null,
        category: null
    })
    const [initialLoading, setInitialLoading] = useState(true)

    useEffect(() => {
        // Clear expired localStorage data
        clearExpiredData()

        // Increment login count
        incrementLoginCount()

        // Load initial data
        loadInitialData()
    }, [])

    useEffect(() => {
        // Check rent reminder after expenses are loaded
        if (!loading && expenses.length >= 0) {
            const hasRentThisMonth = checkHasRentThisMonth(expenses)
            const shouldShow = shouldShowRentReminder(rentPaid) && !hasRentThisMonth
            setShowRentBanner(shouldShow)
        }
    }, [expenses, loading, rentPaid])

    const loadInitialData = async () => {
        try {
            // Load expenses
            await loadExpenses()

            // Check rent status
            const rentResponse = await expenseAPI.getRentStatus()
            if (rentResponse.success) {
                setRentPaid(rentResponse.data.paid)
            }
        } catch (error) {
            console.error('Failed to load initial data:', error)
        } finally {
            setInitialLoading(false)
        }
    }

    const loadExpenses = async (newFilters = filters, append = false) => {
        const params = {
            ...newFilters,
            limit: 20,
            offset: append ? expenses.length : 0
        }

        await fetchExpenses(params)
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

    const handleExpenseSuccess = () => {
        // Refresh expenses after successful addition
        loadExpenses(filters, false)
    }

    const handleRentPaid = () => {
        setRentPaid(true)
        setShowRentBanner(false)
        // Refresh expenses to show the new rent entry
        loadExpenses(filters, false)
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
        <div className="min-h-screen bg-gray-50 pt-20">
            {/* User Info & Actions */}
            <div className="max-w-4xl mx-auto px-4 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-lg font-medium text-gray-900">
                            Welcome back, {user?.userId}
                        </p>
                        <p className="text-sm text-gray-600">
                            Manage your expenses efficiently
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowRentForm(true)}
                            className="btn-secondary btn-md"
                            disabled={rentPaid}
                        >
                            <HomeIcon className="h-4 w-4 mr-2" />
                            {rentPaid ? 'Rent Paid' : 'Pay Rent'}
                        </button>
                        <button
                            onClick={handleAddExpense}
                            className="btn-primary btn-md"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add Expenses
                        </button>
                        <button
                            onClick={handleLogout}
                            className="btn-secondary btn-md"
                            title="Sign out"
                        >
                            <ArrowRightOnRectangleIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4">
                <div className="space-y-6">
                    {/* Rent Banner */}
                    {showRentBanner && (
                        <RentBanner
                            onClose={() => setShowRentBanner(false)}
                            onRentPaid={handleRentPaid}
                        />
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

            {/* Expense Form Modal - for adding new */}
            {!editingExpense && (
                <ExpenseForm
                    isOpen={showExpenseForm}
                    onClose={handleCloseExpenseForm}
                    onSuccess={handleExpenseSuccess}
                />
            )}

            {/* Edit Expense Form Modal - for editing existing */}
            {editingExpense && (
                <EditExpenseForm
                    isOpen={showExpenseForm}
                    onClose={handleCloseExpenseForm}
                    expense={editingExpense}
                />
            )}

            {/* Rent Payment Form Modal */}
            <RentPaymentForm
                isOpen={showRentForm}
                onClose={() => setShowRentForm(false)}
                onSuccess={handleRentPaid}
            />
        </div>
    )
}

export default DashboardPage