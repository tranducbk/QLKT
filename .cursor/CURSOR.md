# 🎯 QLKT Project Guide for Cursor AI

## Quick Project Overview

**QLKT** = Quản lý Khen thưởng (Awards Management System) for Vietnam Military Science Academy

### Stack
- **Frontend**: Next.js 14 + React 18 + TypeScript + TailwindCSS + shadcn/ui
- **Backend**: Node.js + Express + PostgreSQL + Prisma
- **Auth**: JWT (Access + Refresh Token)

## 🎭 User Roles

```
SUPER_ADMIN → Manage all accounts
ADMIN       → Manage all data (units, positions, personnel, awards)
MANAGER     → Manage own unit's personnel and awards
USER        → View own profile and awards
```

## 📁 Project Structure

```
FE-QLKT/src/
├── app/              # Next.js App Router
│   ├── (auth)/       # Auth routes
│   ├── super-admin/  # Super admin pages
│   ├── admin/        # Admin pages
│   ├── manager/      # Manager pages
│   └── user/         # User pages
├── components/       # React components
│   ├── ui/          # shadcn/ui components
│   └── layout/      # Layout components
├── hooks/           # Custom hooks
├── lib/             # Utilities (axios, utils)
└── configs/         # Config files

BE-QLKT/src/
├── controllers/     # Route handlers
├── services/        # Business logic
├── routes/          # API routes
├── middlewares/     # Express middlewares
└── models/          # Prisma models
```

## 🗄️ Core Database Tables

### Master Data
1. **DonVi** (Units) - Departments/Faculties
2. **NhomCongHien** (Contribution Groups) - For service calculation
3. **ChucVu** (Positions) - Job positions in units
4. **QuanNhan** (Personnel) - Military personnel
5. **TaiKhoan** (Accounts) - User accounts

### INPUT Data
6. **LichSuChucVu** (Position History) - For service award calculation
7. **ThanhTichKhoaHoc** (Scientific Achievements) - NCKH/SKKH records
8. **DanhHieuHangNam** (Annual Titles) - CSTDCS/CSTT records

### OUTPUT Data
9. **HoSoNienHan** (Service Profile) - Calculated service awards
10. **HoSoHangNam** (Annual Profile) - Calculated annual awards

## 🔑 Key Concepts

### CCCD
- **Primary key** for Import/Export operations
- Unique identifier for each personnel

### ngay_nhap_ngu
- Enlistment date
- Used to calculate service years awards

### Award Types

**Service Awards (Niên hạn):**
- HCCSVV (Huân chương Chiến sỹ Vẻ vang): Hạng Ba (10y), Nhì (15y), Nhất (20y)
- HCBVTQ (Huân chương Bảo vệ Tổ quốc): Based on contribution months

**Annual Awards:**
- CSTDCS (Chiến sỹ Thi đua Cơ sở)
- CSTT (Chiến sỹ Tiên tiến)
- BKBQP (Bằng khen BQP) - 5 consecutive CSTDCS
- CSTDTQ (Chiến sỹ Thi đua Toàn quân) - 10 consecutive CSTDCS + 1 NCKH/SKKH

## 🛣️ API Patterns

### Standard Response Format
```typescript
// Success
{ success: true, data: {...}, message?: string }

// Error
{ success: false, error: string, details?: any }
```

### Authentication
All API calls (except auth endpoints) require:
```
Authorization: Bearer <access_token>
```

### Common Query Parameters
- `?page=1&limit=10` - Pagination
- `?personnel_id=123` - Filter by personnel
- `?unit_id=456` - Filter by unit

## 🎨 Frontend Patterns

### File Organization
- Pages: `app/[role]/[feature]/page.tsx`
- Components: `components/[feature]/[ComponentName].tsx`
- Hooks: `hooks/use[FeatureName].ts`

### Common Hooks
```typescript
useAuth()           // Authentication state
useToast()          // Toast notifications
usePersonnel()      // Personnel data fetching
useAnnualRewards()  // Annual rewards data
```

### State Management
- Local state: `useState`
- Server state: Direct API calls with `useEffect`
- Global state: Redux Toolkit (minimal usage)

### Component Patterns
```tsx
// Typical page component structure
export default function PageName() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return <MainContent data={data} />
}
```

## 🔧 Backend Patterns

### Controller Pattern
```javascript
exports.getAllPersonnel = async (req, res) => {
  try {
    const { role, userId } = req.user
    const data = await personnelService.getAll(role, userId)
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}
```

### Service Layer
```javascript
exports.getAll = async (role, userId) => {
  if (role === 'ADMIN') {
    return await prisma.quanNhan.findMany()
  }
  if (role === 'MANAGER') {
    const account = await prisma.taiKhoan.findUnique({
      where: { id: userId },
      include: { quanNhan: true }
    })
    const unitId = account.quanNhan.don_vi_id
    return await prisma.quanNhan.findMany({
      where: { don_vi_id: unitId }
    })
  }
  // ... more logic
}
```

## 📋 Common Tasks

### Adding a New Feature

1. **Backend**: Create route → controller → service
2. **Frontend**: Create page → fetch data → display

### Adding a New Role-Based Page

```typescript
// 1. Create route in app/[role]/[feature]/page.tsx
// 2. Add middleware check
// 3. Implement data fetching based on role
// 4. Add navigation link in layout
```

### Import/Export Excel

**Import Pattern:**
```javascript
POST /api/personnel/import
Content-Type: multipart/form-data
Body: { file: <excel_file> }

// Backend validates CCCD as primary key
// Creates or updates records
```

**Export Pattern:**
```javascript
GET /api/personnel/export
Returns: Excel file download
```

## 🎯 Code Locations for Common Tasks

### Authentication
- Frontend: `src/app/(auth)/login/page.tsx`
- Backend: `src/controllers/authController.js`, `src/middlewares/auth.js`

### Personnel Management
- Frontend: `src/app/admin/personnel/page.tsx`
- Backend: `src/controllers/personnelController.js`, `src/services/personnelService.js`

### Awards Management
- Annual: `src/app/admin/personnel/[id]/annual-rewards/page.tsx`
- Scientific: `src/app/admin/personnel/[id]/scientific-achievements/page.tsx`
- Position History: `src/app/admin/personnel/[id]/position-history/page.tsx`

### Profile Calculation ("Bộ não")
- Backend: `src/services/profileService.js`
- Logic: Calculates HoSoNienHan and HoSoHangNam based on INPUT data

## 🚨 Important Rules

### DO:
- Use Prisma for all database operations (prevents SQL injection)
- Validate all inputs with express-validator
- Check user role in every protected route
- Use try-catch for all async operations
- Return consistent response format
- Log errors for debugging

### DON'T:
- Use raw SQL queries
- Store passwords in plain text
- Skip input validation
- Expose sensitive data in responses
- Modify OUTPUT tables (HoSoNienHan, HoSoHangNam) directly - use recalculate endpoint

### Security Checklist
- [ ] JWT token in Authorization header
- [ ] Role-based access control checked
- [ ] Input validated and sanitized
- [ ] Error messages don't expose system details
- [ ] File uploads validated (size, type)

## 🐛 Debugging Tips

### Frontend Issues
```bash
# Check console for errors
# Check Network tab for API calls
# Verify token in localStorage: localStorage.getItem('accessToken')
# Check role: localStorage.getItem('role')
```

### Backend Issues
```bash
# Check server logs
# Use Prisma Studio: npx prisma studio
# Test API with Postman/Thunder Client
# Check database with: npx prisma db push
```

### Common Errors
- **401 Unauthorized**: Token expired or invalid → use refresh token
- **403 Forbidden**: Insufficient permissions → check role
- **404 Not Found**: Check route path and parameters
- **500 Server Error**: Check backend logs and database connection

## 📚 Quick Reference

### Environment Variables
```bash
# Backend (.env)
DATABASE_URL="postgresql://user:pass@localhost:5432/qlkt"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
PORT=5000

# Frontend (.env.local)
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```

### Useful Commands
```bash
# Frontend
npm run dev              # Start dev server
npm run build           # Build for production
npm run lint            # Run linter

# Backend
npm run dev             # Start dev server
npx prisma studio       # Open Prisma Studio
npx prisma migrate dev  # Run migrations
npx prisma generate     # Generate Prisma Client
npx prisma db push      # Push schema to database
```

## 💡 AI Assistant Tips

When asking Cursor AI for help:

1. **Be specific about the role**: "Add a feature for ADMIN to..."
2. **Mention the layer**: "In the backend service layer..." or "In the frontend component..."
3. **Reference existing patterns**: "Similar to how we handle personnel..."
4. **Specify the file**: "In src/app/admin/personnel/page.tsx..."
5. **Include context**: "For the awards calculation feature..."

### Good Prompts Examples
- "Add a new API endpoint for MANAGER to view unit statistics"
- "Create a frontend component to display annual rewards with edit/delete actions"
- "Implement Excel export for position history following the existing personnel export pattern"
- "Add input validation for the scientific achievements form"
- "Fix the permission check in the annual rewards controller"

### Files to Reference Often
- API docs: `QLKT.md`
- Database schema: `prisma/schema.prisma`
- Auth middleware: `src/middlewares/auth.js`
- Axios config: `src/lib/axios.ts` (frontend)

---

**Remember**: This is a role-based system. Always consider which role should have access to what data!
