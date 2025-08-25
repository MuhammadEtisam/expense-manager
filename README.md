# Expense Manager V1

A production-ready expense tracking application built with Node.js, React, Prisma, and PostgreSQL.

## 🏗️ Tech Stack

- **Frontend**: React (Vite) + Tailwind CSS
- **Backend**: Node.js + Express + Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT tokens
- **Deployment**: Railway (backend) + Vercel (frontend)

## 🚀 Features

- **Account Management**: Register/login with unique IDs
- **Expense Tracking**: Add, edit, delete expenses with categories
- **Smart Rent Reminders**: Automatic monthly rent prompts
- **Filtering**: Filter expenses by date range and category
- **Responsive UI**: Mobile-friendly interface
- **Secure**: JWT authentication, bcrypt password hashing

## 📁 Project Structure

```
expense-manager/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── routes/
│   │   ├── auth.js
│   │   └── expenses.js
│   ├── middleware/
│   │   └── auth.js
│   ├── validation/
│   │   └── schemas.js
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🛠️ Local Development Setup

### Prerequisites

- Node.js (v18+)
- npm or yarn
- PostgreSQL database

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:UgbfBdYfEkoVNWqHyTJQGPdjLhTCUXEB@shinkansen.proxy.rlwy.net:54631/railway"
JWT_SECRET="your-super-secret-jwt-key-here-change-in-production"
FRONTEND_URL="http://localhost:5173"
```

4. Generate Prisma client:
```bash
npm run db:generate
```

5. Push database schema:
```bash
npm run db:push
```

6. Start development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_URL=http://localhost:5000
```

4. Start development server:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## 🚀 Production Deployment

### Railway Backend Deployment

1. **Create Railway Account**: Sign up at [railway.app](https://railway.app)

2. **Create New Project**: 
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Configure Environment Variables**:
   ```env
   NODE_ENV=production
   JWT_SECRET=your-production-jwt-secret-min-32-chars-long
   DATABASE_URL=postgresql://postgres:UgbfBdYfEkoVNWqHyTJQGPdjLhTCUXEB@shinkansen.proxy.rlwy.net:54631/railway
   PORT=5000
   ```

4. **Configure Build Settings**:
   - Root Directory: `/backend`
   - Build Command: `npm run db:generate && npm install`
   - Start Command: `npm start`

5. **Deploy**:
   - Railway will automatically deploy on git push
   - Database schema will be pushed automatically

6. **Get Backend URL**: Copy the generated Railway URL (e.g., `https://your-app.railway.app`)

### Vercel Frontend Deployment

1. **Create Vercel Account**: Sign up at [vercel.com](https://vercel.com)

2. **Import Project**:
   - Click "New Project"
   - Import from Git repository
   - Select your repository

3. **Configure Build Settings**:
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Configure Environment Variables**:
   ```env
   VITE_API_URL=https://your-railway-backend-url.railway.app
   ```

5. **Deploy**: Vercel will automatically build and deploy

6. **Update CORS**: Update your Railway backend's CORS configuration with the Vercel URL:
   ```javascript
   const corsOptions = {
     origin: process.env.NODE_ENV === 'production' 
       ? ['https://your-frontend-domain.vercel.app']
       : ['http://localhost:3000', 'http://localhost:5173'],
     // ...
   }
   ```

## 🔧 API Endpoints

### Authentication
- `POST /v1/auth/register` - Register new user
- `POST /v1/auth/login` - Login user

### Expenses (Protected)
- `GET /v1/expenses` - List expenses with filters
- `POST /v1/expenses` - Add new expense
- `PUT /v1/expenses/:id` - Update expense
- `DELETE /v1/expenses/:id` - Delete expense

### Health Check
- `GET /health` - Service health status

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds 12
- **JWT Authentication**: Short-lived tokens (1 hour)
- **Input Validation**: Joi schema validation
- **SQL Injection Prevention**: Prisma parameterized queries
- **CORS Protection**: Restricted origins
- **Rate Limiting**: Express rate limit middleware
- **Security Headers**: Helmet.js

## 🎯 Usage Guide

### Registration/Login
1. Create account with unique user ID (3-30 alphanumeric chars)
2. Login with credentials to receive JWT token
3. Token auto-refreshes on successful requests

### Managing Expenses
1. Add expenses with amount, category, date, and optional notes
2. Categories: FOOD, TRANSPORT, RENT, MISC, OTHER
3. Edit/delete expenses with inline actions
4. Filter by date range and category

### Rent Reminders
- Automatically prompted after 5th of month
- Shows on 1st and 3rd daily logins
- One-click rent entry with pre-filled category
- 5-day suppression option available

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**:
   - Verify DATABASE_URL is correct
   - Check network connectivity
   - Ensure database is accessible

2. **JWT Verification Failed**:
   - Check JWT_SECRET is set correctly
   - Verify token hasn't expired
   - Clear localStorage and re-login

3. **CORS Errors**:
   - Update backend CORS origins
   - Check frontend VITE_API_URL points to correct backend

4. **Build Failures**:
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify all environment variables are set

### Development Tips

- Use `npm run db:studio` to view database in browser
- Check Railway logs for backend issues
- Use browser dev tools for frontend debugging
- Test API endpoints with tools like Postman

## 📄 License

MIT License - feel free to use this project as a starting point for your own applications.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

**Happy expense tracking! 💰**