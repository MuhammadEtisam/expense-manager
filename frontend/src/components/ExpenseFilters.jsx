import { useState, useEffect } from 'react'
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { EXPENSE_CATEGORIES, getDateRanges } from '../utils/helpers'

const ExpenseFilters = ({ filters, onFiltersChange, className = '' }) => {
    const [localFilters, setLocalFilters] = useState(filters)
    const [isExpanded, setIsExpanded] = useState(false)

    const dateRanges = getDateRanges()

    useEffect(() => {
        setLocalFilters(filters)
    }, [filters])

    const handleFilterChange = (key, value) => {
        const newFilters = { ...localFilters, [key]: value }
        setLocalFilters(newFilters)
        onFiltersChange(newFilters)
    }

    const handleDateRangeChange = (range) => {
        const newFilters = {
            ...localFilters,
            from: range.from,
            to: range.to
        }
        setLocalFilters(newFilters)
        onFiltersChange(newFilters)
    }

    const clearFilters = () => {
        const clearedFilters = {
            from: null,
            to: null,
            category: null
        }
        setLocalFilters(clearedFilters)
        onFiltersChange(clearedFilters)
    }

    const hasActiveFilters = localFilters.from || localFilters.to || localFilters.category

    return (
        <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
            <div className="p-4">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center justify-between w-full text-left"
                >
                    <div className="flex items-center gap-2">
                        <FunnelIcon className="h-5 w-5 text-gray-400" />
                        <span className="font-medium text-gray-900">Filters</span>
                        {hasActiveFilters && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                Active
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {hasActiveFilters && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    clearFilters()
                                }}
                                className="text-xs text-gray-500 hover:text-gray-700"
                            >
                                Clear all
                            </button>
                        )}
                        <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            ▼
                        </div>
                    </div>
                </button>

                {isExpanded && (
                    <div className="mt-4 space-y-4 animate-slide-up">
                        {/* Quick Date Ranges */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quick Date Ranges
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(dateRanges).map(([key, range]) => {
                                    const isActive = localFilters.from === range.from && localFilters.to === range.to
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => handleDateRangeChange(range)}
                                            className={`px-3 py-1 text-sm rounded-full transition-colors ${isActive
                                                    ? 'bg-primary-100 text-primary-800 border border-primary-200'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                                }`}
                                        >
                                            {range.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Custom Date Range */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="from-date" className="block text-sm font-medium text-gray-700 mb-1">
                                    From Date
                                </label>
                                <input
                                    type="date"
                                    id="from-date"
                                    value={localFilters.from || ''}
                                    onChange={(e) => handleFilterChange('from', e.target.value || null)}
                                    className="input text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="to-date" className="block text-sm font-medium text-gray-700 mb-1">
                                    To Date
                                </label>
                                <input
                                    type="date"
                                    id="to-date"
                                    value={localFilters.to || ''}
                                    onChange={(e) => handleFilterChange('to', e.target.value || null)}
                                    min={localFilters.from || undefined}
                                    className="input text-sm"
                                />
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div>
                            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-2">
                                Category
                            </label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleFilterChange('category', null)}
                                    className={`px-3 py-1 text-sm rounded-full transition-colors ${!localFilters.category
                                            ? 'bg-primary-100 text-primary-800 border border-primary-200'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                        }`}
                                >
                                    All Categories
                                </button>
                                {EXPENSE_CATEGORIES.map((category) => {
                                    const isActive = localFilters.category === category.value
                                    return (
                                        <button
                                            key={category.value}
                                            onClick={() => handleFilterChange('category', category.value)}
                                            className={`px-3 py-1 text-sm rounded-full transition-colors ${isActive
                                                    ? 'bg-primary-100 text-primary-800 border border-primary-200'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                                }`}
                                        >
                                            {category.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ExpenseFilters