# StyleTry — Project Context File
# Paste this at the start of every Claude Code (VS Code) or Claude AI (IntelliJ) session.

---

## What is this project?
StyleTry is a full-stack fashion e-commerce web app with a virtual try-on feature.
- Frontend: React 18 + Vite → runs at http://localhost:5173
- Backend:  Spring Boot 3.3 + Spring Security 6 + JWT → runs at http://localhost:8090
- Database: PostgreSQL 16 → database name: styletry_db
- Repo: github.com/nishanadhkl/style-try (shared with a friend who owns the backend)

---

## Folder Structure
D:\StyleTry\
├── frontend/          ← React + Vite (you work here in VS Code)
│   └── src/
│       ├── components/
│       │   ├── Navbar.jsx
│       │   └── ProtectedAdminRoute.jsx
│       ├── context/
│       │   ├── AdminContext.jsx
│       │   └── CartContext.jsx
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Cart.jsx
│       │   └── admin/
│       │       ├── AdminLogin.jsx
│       │       ├── AdminDashboard.jsx
│       │       └── AdminProducts.jsx
│       ├── services/
│       │   └── api.jsx         ← all Axios API calls live here
│       ├── App.jsx
│       ├── main.jsx
│       └── index.css
└── backend/           ← Spring Boot (your friend owns this, you fix issues in IntelliJ)

---

## Auth System
- Admin login:    POST /api/auth/login    → stores token as "adminToken" in localStorage
- Customer login: POST /auth/login        → stores token as "userToken" in localStorage
- All API calls use Axios in src/services/api.jsx
- Token is attached in the request interceptor in api.jsx automatically

---

## What is DONE ✅
- Admin login/logout with JWT
- Protected admin routes (ProtectedAdminRoute.jsx)
- Admin dashboard with stat cards
- Product CRUD (create, read, update, delete) in admin panel
- Product variants (size, color, price, stock, SKU)
- Category management (Men, Women, Accessories)
- Cart system — full frontend + backend API
- CartContext global state
- Login.jsx and Register.jsx UI (pages exist but NOT connected to real API yet)
- Navbar with cart counter slot (not live yet)
- CORS fixed with CorsConfigurationSource bean in SecurityConfig.java
- BCrypt password hashing on backend

---

## What NEEDS to be built 🔲
1. Wire Login.jsx to POST /auth/login API → save userToken → redirect to home
2. Wire Register.jsx to POST /auth/register API → redirect to login
3. Create src/context/AuthContext.jsx → manages customer login state
4. Update Navbar.jsx → show username when logged in, show live cart count
5. Create src/pages/Shop.jsx → product grid, fetches /api/products, category filter
6. Create src/pages/ProductDetail.jsx → product info, variant selector, Add to Cart
7. Create src/pages/Checkout.jsx → order summary + place order
8. Create src/pages/admin/AdminOrders.jsx → list orders, update status
9. Virtual Try-On feature → Canvas 2D overlay (HTML5 Canvas, no extra library needed)
10. Search and filter by category and price on Shop page

---

## Errors We Fixed (so don't repeat these mistakes)

### 1. CORS Error
- Symptom: API calls to /api/products or /api/categories fail with CORS error in browser
- Fix: Add CorsConfigurationSource bean in SecurityConfig.java allowing http://localhost:5173

### 2. Git Merge Conflict (application.properties)
- Symptom: Git pull fails because backend friend pushed changes to application.properties
- Fix: git stash → git pull → git stash pop → manually resolve conflict → git commit

### 3. Database Schema Error (NOT NULL column)
- Symptom: App crashes after friend added a NOT NULL email column to users table
- Fix: ALTER TABLE to add column as nullable first, backfill data, then add constraint

### 4. Admin Modal Too Tall
- Symptom: Add Product form modal goes off screen, save button not visible
- Fix: Add max-height: 85vh and overflow-y: auto to .admin-form-card in index.css

### 5. CartContext Crash (unauthenticated user)
- Symptom: App crashes on load because cart API returns 401 when no user is logged in
- Fix: Wrap loadCart() in try/catch, set cart to null on error — already fixed in CartContext.jsx

### 6. Admin Routes Showing Navbar
- Symptom: Navbar was showing on admin pages even when admin was logged in
- Fix: In App.jsx, check isAdminRoute && isAdminLoggedIn before rendering Navbar

---

## Design System (use these colors in all CSS)
- Primary:   #4f46e5  (indigo — buttons, links, active states)
- Dark:      #111827  (body text, headings)
- Light BG:  #f8fafc  (page background)
- Success:   #10b981  (free shipping, success)
- Danger:    #dc2626  (delete, errors)
- Orange:    #f97316  (cart counter badge)
- Fonts:     system-ui, sans-serif (Playfair Display + DM Sans planned)

---

## API Endpoints Reference
# Auth
POST   /auth/register         → { fullName, email, password }
POST   /auth/login            → { email, password } → returns token
GET    /auth/profile          → returns logged-in user info

# Admin Auth
POST   /api/auth/login        → { username, password } → returns admin token

# Products
GET    /api/products          → list all products
POST   /api/products          → create product (admin)
GET    /api/products/{id}     → single product
PUT    /api/products/{id}     → update product (admin)
DELETE /api/products/{id}     → delete product (admin)

# Variants
GET    /api/variants/product/{productId}  → variants for a product
POST   /api/variants          → create variant (admin)
PUT    /api/variants/{id}     → update variant (admin)
DELETE /api/variants/{id}     → delete variant (admin)

# Cart
GET    /api/cart              → get current user's cart
POST   /api/cart/add          → { variantId, quantity }
PUT    /api/cart/update/{itemId}  → update quantity
DELETE /api/cart/remove/{itemId} → remove item
DELETE /api/cart/clear        → empty cart

# Categories
GET    /api/categories        → list all
POST   /api/categories        → create (admin)

---

## Git Workflow
# Daily commands
git add .
git commit -m "feat: describe what you did"
git push origin feature/your-branch-name

# Branch strategy
main     → production only
develop  → merge features here first
feature/ → one branch per feature

# Commit message rules
feat:     new feature
fix:      bug fix
style:    CSS only
refactor: restructure, no behavior change
chore:    config or dependencies

---

## How to Start the Project Each Day
# Terminal 1 (backend)
cd D:\StyleTry\backend
mvn spring-boot:run

# Terminal 2 (frontend)
cd D:\StyleTry\frontend
npm run dev

# Then open VS Code for frontend work
# Open IntelliJ for backend work
