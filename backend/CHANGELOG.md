# 📌 Changelog

All notable changes to **Expense Manager** will be documented here.  

## v1.1.1 - 2025-08-26
- Fixed: “Add row” button placement (moved below expense rows for easier access).
- Fixed: Amount rounding issue (values like 40 were stored as 39.99).
- Fixed: Rent date picker allowed last day of previous month (31 July) — now restricted to current month.

## [v1.1] - 2025-08-26
### ✨ New Features
- Multi-expense form: add multiple expenses in a single submission.  
- Food category sub-options (Breakfast, Lunch, Dinner, Tea).  
- Dedicated Rent Payment form for easier rent entry.  

### 🛡 Restrictions & Rules
- Rent: only one entry allowed per month.  
- Food: only one Breakfast, Lunch, Dinner per day (multiple Tea entries allowed).  
- Category availability based on selected date/month.  

### 🎨 UI/UX Improvements
- Sticky header with clickable **Expense Manager** logo (scrolls to top).  
- App name visible on login & registration pages.  
- Updated currency symbol → ₨ (PKR).  

---

## [v1.0] - Initial Release 2025-08-25
- User authentication (Register/Login with JWT).  
- Expense tracking with categories.  
- Filters & totals dashboard.  
- Basic rent banner notification.  
