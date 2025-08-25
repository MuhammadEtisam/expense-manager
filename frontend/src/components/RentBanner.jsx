import { useState } from 'react'
import { XMarkIcon, HomeIcon } from '@heroicons/react/24/outline'
import { suppressRentReminder } from '../utils/helpers'
import { useExpenses } from '../context/ExpenseContext'
import Alert from './Alert'

const RentBanner = ({ onClose }) => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { addExpense } = useExpenses()

    const handleAddRent = async () => {
        setLoading(true)
        setError('')

        const today = new Date().toISOString().split('T')[0]

        try {
            const result = await addExpense({
                amount: 0, // User will need to edit this
                category: 'RENT',
                date: today,
                note: 'Monthly rent payment'
            })

            if (result.success) {
                onClose()
            } else {
                setError(result.message)
            }
        } catch (err) {
            setError('Failed to add rent expense')
        } finally {
            setLoading(false)
        }
    }

    const handleSuppress = () => {
        suppressRentReminder(5)
        onClose()
    }

    return (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex">
                <div className="flex-shrink-0">
                    <HomeIcon className="h-5 w-5 text-purple-400" />
                </div>
                <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-purple-800">
                        Add this month's rent
                    </h3>
                    <div className="mt-2 text-sm text-purple-700">
                        <p>
                            It looks like you haven't added your rent expense for this month yet.
                            Would you like to add it now?
                        </p>
                    </div>

                    {error && (
                        <div className="mt-3">
                            <Alert
                                type="error"
                                message={error}
                                onClose={() => setError('')}
                            />
                        </div>
                    )}

                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={handleAddRent}
                            disabled={loading}
                            className="btn-sm btn-primary"
                        >
                            {loading ? 'Adding...' : 'Add Rent'}
                        </button>
                        <button
                            onClick={handleSuppress}
                            className="btn-sm btn-secondary"
                        >
                            Don't remind me for 5 days
                        </button>
                    </div>
                </div>
                <div className="ml-auto pl-3">
                    <button
                        onClick={onClose}
                        className="inline-flex rounded-md p-1.5 text-purple-400 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-purple-50"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default RentBanner