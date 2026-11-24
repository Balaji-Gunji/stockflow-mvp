
# StockFlow – Multi-Tenant Inventory Management System

StockFlow is a web-based inventory management application
designed to help organizations manage products, monitor
inventory levels, and identify low-stock items.

Built as a Minimum Viable Product (MVP) for the Wexa AI
Software Developer Intern assessment.

## Features

### Authentication
- Organization registration
- User login and logout
- Secure password hashing using bcrypt
- Persistent SQLite-backed sessions
- Protected application routes

### Inventory Management
- Create, view, update, and delete products
- Search products by name or SKU
- Organization-specific SKU uniqueness
- Product quantity and pricing management
- Delete confirmation
- Configurable low-stock thresholds

### Inventory Dashboard
- Total number of products
- Total inventory quantity
- Low-stock product count
- Low-stock product listing

### Organization Settings
- Configurable default low-stock threshold
- Product-level threshold overrides

### Multi-Tenant Isolation
- Separate inventory for each organization
- Organization-scoped database queries
- Prevention of unauthorized cross-organization access

### Security
- Password hashing with bcrypt
- Parameterized SQL queries
- CSRF token validation
- Helmet security headers
- Login and signup rate limiting
- HTTP-only session cookies
- Secure cookies in production
- Protected page cache prevention
- Persistent session storage

## Technology Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express.js |
| Frontend | HTML, CSS, JavaScript, EJS |
| Database | SQLite, better-sqlite3 |
| Authentication | bcryptjs, express-session |
| Security | Helmet, express-rate-limit |
| Version Control | Git, GitHub |

## Project Structure

```text
stockflow-mvp/
├── database/
│   ├── db.js
│   └── session-store.js
├── middleware/
│   ├── auth.js
│   └── csrf.js
├── public/
│   ├── css/
│   │   ├── auth.css
│   │   └── dashboard.css
│   └── js/
│       └── products.js
├── routes/
│   ├── auth.js
│   ├── dashboard.js
│   ├── products.js
│   └── settings.js
├── views/
│   ├── signup.ejs
│   ├── login.ejs
│   ├── dashboard.ejs
│   ├── products.ejs
│   ├── add-product.ejs
│   ├── edit-product.ejs
│   └── settings.ejs
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 22
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Balaji-Gunji/stockflow-mvp.git
cd stockflow-mvp
```

### 2. Install dependencies

```bash
npm ci
```

### 3. Configure environment variables

Create a `.env` file using `.env.example` as a reference.

```env
PORT=3000
SESSION_SECRET=replace_with_a_secure_random_secret
NODE_ENV=development
```

Generate a secure session secret using:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Start the application

```bash
node server.js
```

### 5. Open the application

Visit:

http://localhost:3000

The SQLite database and required tables are initialized
automatically when the application starts.

## Database Design

The application uses four main tables:

| Table | Purpose |
|---|---|
| organizations | Organization information and default threshold |
| users | User accounts and password hashes |
| products | Organization-specific inventory |
| sessions | Persistent session data and expiration |

## Multi-Tenant Architecture

Each registered user belongs to an organization.

Product queries are scoped using the authenticated user's
organization ID, ensuring that users can only access and
modify inventory belonging to their own organization.

SKU uniqueness is enforced within each organization.

## Low-Stock Logic

A product is considered low stock when:

```text
Product Quantity <= Effective Low Stock Threshold
```

If a product has a custom threshold, that value is used.
Otherwise, the organization's default threshold is used.

The initial organization default threshold is 5.

## Manual Testing

The following scenarios were manually tested during development:

- User registration and login
- Invalid credentials
- Duplicate email validation
- Password confirmation validation
- Product creation, editing, and deletion
- Duplicate SKU validation
- Product search
- Dashboard calculations
- Low-stock threshold boundary conditions
- Organization settings updates
- Cross-organization access prevention
- CSRF request rejection
- Login rate limiting
- Session persistence after server restart
- Logout and protected route access

## Deployment

Live application URL: Pending deployment.

The application is designed for single-instance deployment
with persistent SQLite storage and HTTPS.

## MVP Limitations

- One user account per organization
- No advanced role-based access control
- No supplier or purchase order management
- No inventory transaction history
- No distributed session or rate-limit storage
- Persistent storage is required for production deployment

## Future Improvements

- Multiple users per organization
- Role-based permissions
- Inventory movement history
- CSV import and export
- Automated testing
- Advanced inventory reporting

## Author

**Balaji Gunji**

GitHub: https://github.com/Balaji-Gunji

## Project Purpose

Developed for the Wexa AI Software Developer Intern
assessment to demonstrate full-stack development,
database design, multi-tenant architecture,
authentication, and application security.
