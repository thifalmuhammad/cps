# 🚀 Setup Environment Variables di Vercel

## 📁 Struktur Project Anda

Repository ini adalah **Full-Stack Application** dengan struktur:

```
CPS/
├── app.js                    ← Backend Express Server
├── src/                      ← Backend source code
├── .env                      ← Backend environment (JANGAN commit!)
├── .env.example              ← Backend environment template
├── frontend/                 ← React Frontend
│   ├── .env                  ← Frontend environment (JANGAN commit!)
│   ├── public/
│   └── src/
├── prisma/                   ← Database schema
└── vercel.json              ← Vercel configuration
```

---

## 🎯 Strategi Deployment

### **Opsi A: Deploy Backend & Frontend di Satu Vercel Project (Recommended untuk project kecil)**

1. **Di Vercel Dashboard:**
   - Buat project baru
   - Connect ke GitHub repository Anda
   - Framework: **Other** (bukan Next.js)
   - Root Directory: **.** (root)

2. **Environment Variables (Add di Vercel Settings):**

   ```
   DATABASE_URL = postgresql://[username]:[password]@[host]:[port]/cps_db
   NODE_ENV = production
   REACT_APP_API_URL = https://[your-vercel-domain].vercel.app/api
   ```

3. **Build & Start Commands:**
   - Build Command: `npm run build && cd frontend && npm run build`
   - Start Command: `node app.js`
   - Output Directory: `.`

4. **Pastikan `package.json` di root memiliki:**
   ```json
   {
     "scripts": {
       "build": "npm run build && cd frontend && npm run build",
       "start": "node app.js"
     }
   }
   ```

---

### **Opsi B: Deploy Backend & Frontend Terpisah (Recommended untuk production)**

#### **Part 1: Deploy Backend ke Vercel**

1. **Buat Vercel project baru untuk backend**
   - Connect GitHub repository
   - Root Directory: **.** (root)
   - Framework: **Node.js**

2. **Environment Variables:**
   ```
   DATABASE_URL = postgresql://[username]:[password]@[host]:[port]/cps_db
   NODE_ENV = production
   ```

3. **Build Settings:**
   - Build Command: `npm install && npx prisma generate && npx prisma db push`
   - Output Directory: `.`
   - Start Command: `node app.js`

4. **Copy Backend URL** (misal: `https://cps-backend.vercel.app`)

---

#### **Part 2: Deploy Frontend ke Vercel**

1. **Buat Vercel project baru untuk frontend**
   - Connect GitHub repository
   - Root Directory: `frontend`
   - Framework: **Create React App**

2. **Environment Variables:**
   ```
   REACT_APP_API_URL = https://cps-backend.vercel.app/api
   GENERATE_SOURCEMAP = false
   DISABLE_ESLINT_PLUGIN = false
   ```

3. **Build Settings:**
   - Build Command: `npm run build`
   - Start Command: `npm start` (auto-configured)
   - Output Directory: `build` (auto-configured)

---

## 🔐 Environment Variables Reference

### **Backend (.env di Vercel):**

| Variable | Deskripsi | Contoh |
|----------|-----------|--------|
| `DATABASE_URL` | PostgreSQL Connection String | `postgresql://user:pass@host:5432/cps_db` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port (Vercel auto-assign) | `3000` (auto) |

### **Frontend (frontend/.env di Vercel):**

| Variable | Deskripsi | Contoh |
|----------|-----------|--------|
| `REACT_APP_API_URL` | Backend API endpoint | `https://backend-domain.vercel.app/api` |
| `GENERATE_SOURCEMAP` | Generate source maps | `false` |
| `DISABLE_ESLINT_PLUGIN` | Disable ESLint in build | `false` |

---

## 📝 Step-by-Step Setup Guide

### **Langkah 1: Prepare GitHub Repository**

```bash
# Pastikan .env files sudah di .gitignore
git status  # Pastikan .env files tidak muncul

# Commit perubahan
git add .
git commit -m "Add Vercel configuration"
git push origin main
```

### **Langkah 2: Setup di Vercel Dashboard**

**Untuk Backend (Opsi A atau B):**

1. Go to `vercel.com` → Log in → New Project
2. Select Repository: `thifalmuhammad/cps`
3. Configure Project:
   - Framework: **Other**
   - Root Directory: **.** (atau `./` jika Opsi B terpisah)
   - Build Command: Sesuai opsi di atas
   - Output Directory: `.`

4. **Environment Variables → Add:**
   ```
   Key: DATABASE_URL
   Value: postgresql://postgres:admin@localhost:5432/cps_db
   
   Key: NODE_ENV
   Value: production
   
   Key: REACT_APP_API_URL
   Value: https://[your-backend-vercel-domain].vercel.app/api
   ```

5. Deploy

---

## 🐛 Troubleshooting

### **Error: "prisma.warehouse is not defined"**
- Build command belum run `npx prisma generate`
- Solusi: Tambahkan ke build command: `npx prisma generate && npx prisma db push`

### **Error: "Cannot find module './frontend/build'"**
- Frontend belum di-build
- Solusi: Pastikan build command include `cd frontend && npm run build`

### **Frontend API calls fail (Network error)**
- `REACT_APP_API_URL` tidak benar atau backend offline
- Solusi: Verify Backend URL benar dan accessible

### **Environment variables tidak ter-read**
- Variable name tidak match dengan kode
- Untuk React: Harus prefix `REACT_APP_` (misal: `REACT_APP_API_URL`)
- Solusi: Verify spelling dan prefix

---

## 📚 File Checklist

Sebelum deploy, pastikan sudah ada/siap:

- ✅ `.env` (local, jangan commit)
- ✅ `.env.example` (template, boleh commit)
- ✅ `frontend/.env` (local, jangan commit)
- ✅ `vercel.json` (sudah di-commit)
- ✅ `package.json` (sudah di-commit, di root)
- ✅ `frontend/package.json` (sudah di-commit)
- ✅ `prisma/schema.prisma` (sudah di-commit)
- ✅ `.gitignore` include `.env` files

---

## 🎉 Setelah Deploy

1. **Test Frontend:** `https://[frontend-vercel-domain].vercel.app`
2. **Test API:** `https://[backend-vercel-domain].vercel.app/api/test-db`
3. **Check Logs:** Vercel Dashboard → Deployments → View Build Logs

Kalau ada error, buka file ini untuk referensi troubleshooting!
