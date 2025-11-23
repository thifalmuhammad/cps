# CPS - Coffee Production System

Sistem monolith aplikasi basis data untuk manajemen produksi kopi menggunakan Node.js (Express), React, PostgreSQL, dan Prisma ORM.

## Struktur Project

```
├── app.js                 # File utama Express server
├── .env                   # Konfigurasi environment
├── package.json           # Dependencies backend
├── prisma/
│   ├── schema.prisma      # Prisma schema (database models)
│   └── migrations/        # Database migrations
├── src/
│   ├── controllers/       # Business logic
│   ├── routes/            # API endpoints
│   ├── models/            # Database models
│   ├── lib/               # Library (Prisma client)
│   └── services/          # External services
└── frontend/              # React SPA
    ├── public/
    ├── src/
    │   ├── components/    # Reusable React components
    │   ├── pages/         # Page components
    │   ├── services/      # API services
    │   ├── hooks/         # Custom React hooks
    │   └── App.js         # Main App component
    ├── package.json
    ├── tailwind.config.js
    └── postcss.config.js
```

## Database Schema

### Tables
- **t_user** - User management (admin & regular users)
- **t_district** - District/Kecamatan data
- **t_farm** - Farm data dengan lokasi geografis
- **t_productivity** - Pencatatan produktivitas panen
- **t_warehouse** - Data gudang penyimpanan

## Setup & Installation

### Prerequisites
- Node.js v18+
- PostgreSQL 12+
- npm atau yarn

### Backend Setup

1. Install dependencies:
```bash
npm install
```

2. Setup environment variables (`.env`):
```env
PORT=5000
DATABASE_URL="postgresql://username:password@localhost:5432/cps_db"
```

3. Setup database:
```bash
npx prisma db push
```

4. Generate Prisma Client:
```bash
npx prisma generate
```

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Development Mode (dengan live reload)

```bash
npm run dev
```

Ini akan menjalankan:
- Express server di `http://localhost:5000`
- React dev server di `http://localhost:3000`

### Production Build

1. Build frontend:
```bash
npm run build
```

2. Start production server:
```bash
npm start
```

## API Endpoints

### User Management
- `POST /api/users/register` - Register user baru
- `GET /api/users` - Get semua users
- `GET /api/users/:uuid` - Get user by UUID

### Districts
- `POST /api/districts` - Create district
- `GET /api/districts` - Get semua districts
- `GET /api/districts/:uuid` - Get district by UUID
- `PUT /api/districts/:uuid` - Update district
- `DELETE /api/districts/:uuid` - Delete district

### Farms
- `POST /api/farms` - Create farm
- `GET /api/farms` - Get semua farms
- `GET /api/farms/:uuid` - Get farm by UUID
- `PUT /api/farms/:uuid` - Update farm
- `DELETE /api/farms/:uuid` - Delete farm

### Productivity
- `POST /api/productivities` - Create productivity record
- `GET /api/productivities` - Get semua records
- `GET /api/productivities/:uuid` - Get record by UUID
- `PUT /api/productivities/:uuid` - Update record
- `DELETE /api/productivities/:uuid` - Delete record

### Warehouses
- `POST /api/warehouses` - Create warehouse
- `GET /api/warehouses` - Get semua warehouses
- `GET /api/warehouses/:uuid` - Get warehouse by UUID
- `PUT /api/warehouses/:uuid` - Update warehouse
- `DELETE /api/warehouses/:uuid` - Delete warehouse

## Technology Stack

### Backend
- **Express.js** - Web framework
- **Prisma ORM** - Database ORM
- **PostgreSQL** - Database
- **bcryptjs** - Password hashing
- **cors** - Cross-origin requests
- **dotenv** - Environment variables

### Frontend
- **React 18** - UI library
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Development Tips

### Create new API endpoint
1. Buat controller di `src/controllers/`
2. Buat routes di `src/routes/`
3. Import routes di `src/routes/index.js`

### Create new React page
1. Buat file di `src/pages/`
2. Import di `App.js`
3. Tambahkan navigation link

### Database changes
1. Update `prisma/schema.prisma`
2. Run: `npx prisma migrate dev --name <migration-name>`

## Deployment

### Local Server
1. Build React: `npm run build`
2. Start server: `npm start`
3. Access: `http://localhost:5000`

### Cloud Deployment (Heroku, Railway, etc)
1. Push to GitHub
2. Connect to deployment platform
3. Set environment variables
4. Deploy

## License
ISC
