import { format, parseISO, startOfMonth, endOfMonth, isAfter, isBefore } from 'date-fns'

// Date formatting
export const formatDate = (date, pattern = 'MMM dd, yyyy') => {
    if (!date) return ''
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, pattern)
}

export const formatCurrency = (amount) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return `₨ ${numAmount.toLocaleString('en-PK', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    })}`
}

// Category helpers
export const EXPENSE_CATEGORIES = [
    { value: 'FOOD', label: 'Food', color: 'green' },
    { value: 'TRANSPORT', label: 'Transport', color: 'blue' },
    { value: 'RENT', label: 'Rent', color: 'purple' },
    { value: 'MISC', label: 'Miscellaneous', color: 'gray' },
    { value: 'OTHER', label: 'Other', color: 'orange' },
]

export const FOOD_SUBCATEGORIES = [
    { value: 'BREAKFAST', label: 'Breakfast', restricted: true },
    { value: 'LUNCH', label: 'Lunch', restricted: true },
    { value: 'DINNER', label: 'Dinner', restricted: true },
    { value: 'TEA', label: 'Tea', restricted: false },
    { value: 'OTHER', label: 'Other', restricted: false },
]

export const getCategoryInfo = (category) => {
    return EXPENSE_CATEGORIES.find(cat => cat.value === category) ||
        { value: category, label: category, color: 'gray' }
}

// Date range helpers
export const getDateRanges = () => {
    const now = new Date()
    const thisMonthStart = startOfMonth(now)
    const thisMonthEnd = endOfMonth(now)

    const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1))
    const lastMonthEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1))

    return {
        thisMonth: {
            from: thisMonthStart.toISOString().split('T')[0],
            to: thisMonthEnd.toISOString().split('T')[0],
            label: 'This Month'
        },
        lastMonth: {
            from: lastMonthStart.toISOString().split('T')[0],
            to: lastMonthEnd.toISOString().split('T')[0],
            label: 'Last Month'
        },
        all: {
            from: null,
            to: null,
            label: 'All Time'
        }
    }
}

// Rent reminder logic
export const shouldShowRentReminder = (rentPaid = false) => {
    const now = new Date()
    const dayOfMonth = now.getDate()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Don't show if rent is already paid for current month
    if (rentPaid) return false

    // Only show after 5th of the month
    if (dayOfMonth <= 5) return false

    // Check if reminder was suppressed
    const suppressedUntil = localStorage.getItem('rentReminderSuppressed')
    if (suppressedUntil) {
        const suppressDate = new Date(suppressedUntil)
        if (isAfter(suppressDate, now)) {
            return false
        }
    }

    // Check login count for today
    const loginKey = `loginCount_${currentYear}_${currentMonth}_${dayOfMonth}`
    const loginCount = parseInt(localStorage.getItem(loginKey) || '0')

    // Show on 1st and 3rd login of the day
    return loginCount === 1 || loginCount === 3
}

export const incrementLoginCount = () => {
    const now = new Date()
    const dayOfMonth = now.getDate()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const loginKey = `loginCount_${currentYear}_${currentMonth}_${dayOfMonth}`
    const loginCount = parseInt(localStorage.getItem(loginKey) || '0')
    localStorage.setItem(loginKey, (loginCount + 1).toString())
}

export const suppressRentReminder = (days = 5) => {
    const suppressUntil = new Date()
    suppressUntil.setDate(suppressUntil.getDate() + days)
    localStorage.setItem('rentReminderSuppressed', suppressUntil.toISOString())
}

export const checkHasRentThisMonth = (expenses) => {
    const now = new Date()
    const thisMonthStart = startOfMonth(now)
    const thisMonthEnd = endOfMonth(now)

    return expenses.some(expense => {
        if (expense.category !== 'RENT') return false

        const expenseDate = parseISO(expense.date)
        return isAfter(expenseDate, thisMonthStart) && isBefore(expenseDate, thisMonthEnd)
    })
}

// Get current month date range for rent validation
export const getCurrentMonthRange = () => {
    // Get current date in local timezone
    const now = new Date()

    // Create dates without time components to avoid timezone issues
    const year = now.getFullYear()
    const month = now.getMonth() // 0-based (January = 0)
    const today = now.getDate()

    // First day of current month (e.g., "2024-08-01")
    const firstDay = new Date(year, month, 1)
    const minDate = firstDay.getFullYear() + '-' +
        String(firstDay.getMonth() + 1).padStart(2, '0') + '-' +
        '01'

    // Today's date (e.g., "2024-08-26") 
    const todayFormatted = year + '-' +
        String(month + 1).padStart(2, '0') + '-' +
        String(today).padStart(2, '0')

    return {
        min: minDate,
        max: todayFormatted
    }
}

// Form validation helpers
export const validateExpenseForm = (data) => {
    const errors = {}

    if (!data.amount || isNaN(parseFloat(data.amount)) || parseFloat(data.amount) <= 0) {
        errors.amount = 'Amount must be a positive number'
    }

    if (!data.category) {
        errors.category = 'Category is required'
    }

    if (data.category === 'FOOD' && !data.subcategory) {
        errors.subcategory = 'Food subcategory is required'
    }

    if (!data.date) {
        errors.date = 'Date is required'
    } else {
        const inputDate = new Date(data.date)
        const today = new Date()
        today.setHours(23, 59, 59, 999) // End of today

        if (isAfter(inputDate, today)) {
            errors.date = 'Date cannot be in the future'
        }
    }

    if (data.note && data.note.length > 500) {
        errors.note = 'Note must not exceed 500 characters'
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    }
}

// Local storage helpers
export const clearExpiredData = () => {
    const now = new Date()
    const keys = Object.keys(localStorage)

    keys.forEach(key => {
        if (key.startsWith('loginCount_')) {
            const [, year, month, day] = key.split('_')
            const keyDate = new Date(parseInt(year), parseInt(month), parseInt(day))

            // Clear login counts older than 7 days
            const diffTime = Math.abs(now - keyDate)
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            if (diffDays > 7) {
                localStorage.removeItem(key)
            }
        }
    })
}