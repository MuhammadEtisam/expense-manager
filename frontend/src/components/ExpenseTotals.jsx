import { formatCurrency } from '../utils/helpers'

const ExpenseTotals = ({ totals, loading, className = '' }) => {
    return (
        <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center md:text-left">
                    <div className="text-2xl font-bold text-gray-900">
                        {loading ? (
                            <div className="bg-gray-200 animate-pulse h-8 w-24 rounded"></div>
                        ) : (
                            formatCurrency(totals.amount)
                        )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                        Total Amount
                    </div>
                </div>

                <div className="text-center md:text-left">
                    <div className="text-2xl font-bold text-gray-900">
                        {loading ? (
                            <div className="bg-gray-200 animate-pulse h-8 w-16 rounded"></div>
                        ) : (
                            totals.count.toLocaleString()
                        )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                        Total Expenses
                    </div>
                </div>
            </div>

            {!loading && totals.count > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                        Average per expense: {formatCurrency(totals.amount / totals.count)}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ExpenseTotals