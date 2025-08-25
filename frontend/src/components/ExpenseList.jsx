import { useState } from 'react'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { formatDate, formatCurrency, getCategoryInfo } from '../utils/helpers'
import { useExpenses } from '../context/ExpenseContext'
import LoadingSpinner from './LoadingSpinner'
import Alert from './Alert'
import Modal from './Modal'

const ExpenseItem = ({ expense, onEdit, onDelete }) => {
    const categoryInfo = getCategoryInfo(expense.category)

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`badge badge-${categoryInfo.color}`}>
                            {categoryInfo.label}
                        </span>
                        <span className="text-sm text-gray-500">
                            {formatDate(expense.date)}
                        </span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900 mb-1">
                        {formatCurrency(expense.amount)}
                    </div>
                    {expense.note && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                            {expense.note}
                        </p>
                    )}
                </div>
                <div className="flex gap-1 ml-4">
                    <button
                        onClick={() => onEdit(expense)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                        title="Edit expense"
                    >
                        <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => onDelete(expense)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete expense"
                    >
                        <TrashIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

const DeleteConfirmModal = ({ isOpen, onClose, expense, onConfirm, loading }) => (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Expense" size="sm">
        <div className="space-y-4">
            <p className="text-sm text-gray-600">
                Are you sure you want to delete this expense? This action cannot be undone.
            </p>

            {expense && (
                <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm">
                        <div className="font-medium">{formatCurrency(expense.amount)}</div>
                        <div className="text-gray-600">
                            {getCategoryInfo(expense.category).label} • {formatDate(expense.date)}
                        </div>
                        {expense.note && (
                            <div className="text-gray-500 text-xs mt-1 truncate">
                                {expense.note}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex gap-3">
                <button
                    onClick={onConfirm}
                    disabled={loading}
                    className="btn-danger btn-md flex-1"
                >
                    {loading ? (
                        <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Deleting...
                        </>
                    ) : (
                        'Delete'
                    )}
                </button>
                <button
                    onClick={onClose}
                    disabled={loading}
                    className="btn-secondary btn-md"
                >
                    Cancel
                </button>
            </div>
        </div>
    </Modal>
)

const ExpenseList = ({ expenses, onEdit, loading, onLoadMore, hasMore }) => {
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, expense: null })
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [error, setError] = useState('')

    const { deleteExpense } = useExpenses()

    const handleDeleteClick = (expense) => {
        setDeleteModal({ isOpen: true, expense })
        setError('')
    }

    const handleDeleteConfirm = async () => {
        if (!deleteModal.expense) return

        setDeleteLoading(true)
        setError('')

        try {
            const result = await deleteExpense(deleteModal.expense.id)

            if (result.success) {
                setDeleteModal({ isOpen: false, expense: null })
            } else {
                setError(result.message)
            }
        } catch (err) {
            setError('Failed to delete expense')
        } finally {
            setDeleteLoading(false)
        }
    }

    const handleDeleteModalClose = () => {
        if (!deleteLoading) {
            setDeleteModal({ isOpen: false, expense: null })
            setError('')
        }
    }

    if (loading && expenses.length === 0) {
        return (
            <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (!loading && expenses.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">No expenses found</div>
                <p className="text-gray-500 text-sm">
                    Start by adding your first expense using the "Add Expense" button above.
                </p>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-3">
                {expenses.map((expense) => (
                    <ExpenseItem
                        key={expense.id}
                        expense={expense}
                        onEdit={onEdit}
                        onDelete={handleDeleteClick}
                    />
                ))}
            </div>

            {hasMore && (
                <div className="flex justify-center mt-6">
                    <button
                        onClick={onLoadMore}
                        disabled={loading}
                        className="btn-secondary btn-md"
                    >
                        {loading ? (
                            <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Loading...
                            </>
                        ) : (
                            'Load More'
                        )}
                    </button>
                </div>
            )}

            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={handleDeleteModalClose}
                expense={deleteModal.expense}
                onConfirm={handleDeleteConfirm}
                loading={deleteLoading}
            />

            {error && (
                <div className="fixed bottom-4 right-4 max-w-sm">
                    <Alert
                        type="error"
                        message={error}
                        onClose={() => setError('')}
                    />
                </div>
            )}
        </>
    )
}

export default ExpenseList