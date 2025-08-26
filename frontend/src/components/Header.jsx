import React from 'react'

const Header = ({ onTitleClick }) => {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        if (onTitleClick) onTitleClick()
    }

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-4xl mx-auto px-4 py-4">
                <h1
                    className="text-2xl font-bold text-primary-600 cursor-pointer hover:text-primary-700 transition-colors"
                    onClick={scrollToTop}
                >
                    Expense Manager
                </h1>
            </div>
        </header>
    )
}

export default Header