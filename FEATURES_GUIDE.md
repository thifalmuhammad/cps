# CPS - Coffee Production System - Feature Guide

## 🌾 Alur Aplikasi

```
┌─────────────────────────────────────────────────────────────┐
│                    FARMER                                    │
│           1. Register Farm Data                             │
│    (Area, Elevation, Coordinates, Location)                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │     Farm Data di Database         │
         │  (PostgreSQL + Prisma ORM)        │
         └───────────────────┬───────────────┘
                             │
                    ┌────────▼────────┐
                    │                 │
                    ▼                 ▼
            ┌──────────────┐   ┌────────────┐
            │   Admin      │   │  Leaflet   │
            │  Mapping     │   │   Map      │
            │  (QGIS)      │   │  Display   │
            └──────┬───────┘   └────────────┘
                   │
                   ▼
        ┌─────────────────────────┐
        │   Export Mapping Data   │
        │   (GeoJSON/Coordinates) │
        └──────────┬──────────────┘
                   │
                   ▼
         ┌───────────────────────────┐
         │  Update Farm Coordinates  │
         │   in Leaflet Map          │
         └───────────────────────────┘
```

## 📋 Fitur Utama

### 1. **Farm Registration (untuk Farmer)**
**URL:** `http://localhost:3000` → Navigate ke "Register Farm"

**Input yang dibutuhkan:**
- **Farmer ID (UUID)** - Identitas unik farmer
- **District** - Pilih kecamatan/distrik
- **Farm Area** - Luas kebun (dalam hektar)
- **Elevation** - Ketinggian lokasi (dalam meter)
- **Geom Coordinates** - Koordinat geografis (format GeoJSON)
  - Contoh: `{"type":"Point","coordinates":[-6.2088,106.8456]}`
- **Planting Year** - Tahun penanaman

**Proses:**
1. Farmer mengisi form
2. Data disimpan ke database
3. Status: "Menunggu Mapping Admin"

---

### 2. **Admin Mapping (QGIS Integration)**
**Alur:**
1. Admin membuka data farm di QGIS
2. Melakukan proses mapping/digitasi
3. Export hasil mapping sebagai GeoJSON atau koordinat
4. Update data farm dengan hasil mapping

**Data yang ter-export dari QGIS:**
- Polygon/Point koordinat geografis
- Boundary kebun
- Metadata lokasi

---

### 3. **Farm Map Visualization (Leaflet)**
**URL:** `http://localhost:3000` → Navigate ke "Farm Map"

**Fitur:**
- Peta interaktif berbasis OpenStreetMap
- Marker untuk setiap farm yang terdaftar
- Popup info ketika marker diklik
  - Nama distrik
  - Luas kebun
  - Ketinggian
  - Tahun tanam
- Sidebar list semua farm
- Zoom & Pan controls

**Data yang ditampilkan:**
- Dari kolom `geomCoordinates` di tabel `t_farm`
- Format: GeoJSON Point atau koordinat lat/lng

---

### 4. **Farm Management (Admin)**
**URL:** `http://localhost:3000` → Navigate ke "Manage Farms"

**Fitur:**
- View semua farm terdaftar
- Edit data farm (setelah QGIS mapping)
- Delete farm
- Update koordinat hasil mapping

**Form Edit:**
- Farm Area
- Elevation
- Geom Coordinates (dari QGIS output)
- Planting Year

---

## 🔄 Workflow Lengkap

### Scenario: Farmer Mendaftarkan Kebun Baru

**Langkah 1: Farmer Register Farm**
```
Farmer → Register Farm → Input Data → Submit
                          ↓
                    Simpan ke DB
                          ↓
                   Status: Pending Mapping
```

**Langkah 2: Admin Verify & Mapping (QGIS)**
```
Admin → Manage Farms → Edit Farm
              ↓
        Buka QGIS → Import Farm Data
              ↓
        Lakukan digitasi/mapping
              ↓
        Export GeoJSON/Coordinates
              ↓
        Paste koordinat ke form
              ↓
        Save → Update DB
```

**Langkah 3: View in Map**
```
User → Farm Map → Lihat farm di Leaflet
                   ↓
              Data dari GeoJSON
              coordinates field
```

---

## 🔗 API Endpoints

### Farm API
```
POST   /api/farms                    - Create farm
GET    /api/farms                    - Get all farms
GET    /api/farms/:uuid              - Get farm by UUID
PUT    /api/farms/:uuid              - Update farm
DELETE /api/farms/:uuid              - Delete farm
```

### District API (untuk dropdown)
```
GET    /api/districts                - Get all districts
POST   /api/districts                - Create district
```

---

## 📝 Contoh Data GeoJSON

### Point (Single Location)
```json
{
  "type": "Point",
  "coordinates": [-6.2088, 106.8456]
}
```

### Polygon (Farm Boundary)
```json
{
  "type": "Polygon",
  "coordinates": [[
    [-6.2080, 106.8450],
    [-6.2090, 106.8450],
    [-6.2090, 106.8460],
    [-6.2080, 106.8460],
    [-6.2080, 106.8450]
  ]]
}
```

---

## 🛠️ Tech Stack untuk Mapping

### QGIS Integration
- **QGIS** - Desktop GIS software untuk mapping
- **Output Format:** GeoJSON, Shapefile, WKT
- **Import:** CSV dengan koordinat → QGIS → Digitasi → Export

### Leaflet Map (Frontend)
- **Library:** leaflet + react-leaflet
- **Base Map:** OpenStreetMap
- **Features:** Markers, Popups, Zoom controls
- **Data Source:** Database farm coordinates

---

## 📊 Database Schema

### t_farm (Farm Data)
```sql
CREATE TABLE t_farm (
  uuid UUID PRIMARY KEY,
  farmer_id UUID NOT NULL,           -- Reference to t_user
  district_id UUID NOT NULL,         -- Reference to t_district
  farm_area DOUBLE PRECISION,        -- Luas (hektar)
  elevation DOUBLE PRECISION,        -- Ketinggian (meter)
  geom_coordinates VARCHAR,          -- GeoJSON/Coordinates
  planting_year INTEGER
);
```

---

## 🚀 Next Steps (Optional Enhancements)

1. **Advanced GIS Features**
   - Import Shapefile direktly
   - Draw farm boundaries di map
   - Multi-polygon support

2. **Productivity Tracking**
   - Visualize harvest data per farm
   - Heatmap produktivitas

3. **Analytics Dashboard**
   - Total farm area by district
   - Average elevation by region
   - Productivity statistics

4. **Real-time Collaboration**
   - Live updates saat admin mapping
   - Comments/Notes per farm

5. **Export & Reporting**
   - Export farm data sebagai PDF
   - Map screenshots
   - CSV export untuk QGIS

---

## ⚠️ Important Notes

### QGIS Workflow
1. Export data farm dari sistem ke CSV
2. Import CSV ke QGIS
3. Lakukan digitasi/mapping
4. Export hasil sebagai GeoJSON
5. Paste GeoJSON ke form Update Farm
6. Save untuk update database

### Coordinate Format
- **Leaflet uses:** [latitude, longitude]
- **GeoJSON uses:** [longitude, latitude]
- **System converts automatically**

### Import dari CSV ke QGIS
```
CSV Format:
name, lat, lng, area, elevation
Farm 1, -6.2088, 106.8456, 5.5, 1200
```

---

Untuk pertanyaan lebih lanjut atau custom features, hubungi development team!
