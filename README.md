# 🎬 CineMax — Movie Ticket Booking Platform

CineMax is a production-ready, full-stack Movie Ticket Booking Platform featuring a premium dark-mode interface, real-time seat locking via WebSockets, Firebase Authentication, secure payment simulations, and comprehensive admin controls.

🌐 **Live Demo**: [https://ticket-book-2026.vercel.app](https://ticket-book-2026.vercel.app)

---

## ✨ Features

### 👤 Customer Experience
* **Dynamic Catalog**: Browse trending, now showing, and coming-soon movies with ratings, trailers, and audience reviews.
* **Smart Filtering**: Filter by genre, language, format, rating, and local cities.
* **Top-View Seat Selection**: Interactive top-view aerial seat map with real-time seat status indicators and zoom controls.
* **Showtime Quick Switcher**: Easily switch between showtimes (e.g. 11:10 PM IMAX 3D, 02:10 AM Dolby Atmos, 12:10 AM IMAX 3D) directly on the seat matrix page with automatic top-view focus.
* **Real-time Seat Locking**: Powered by Socket.io to prevent double bookings during active 10-minute sessions.
* **Firebase Authentication**: Flexible sign-in options including Email/Password and Firebase integration.
* **Simulated Checkout & Payments**: Seamless checkout flow with discount coupons and price breakdowns.
* **Digital e-Tickets**: Printable ticket receipts featuring simulated scan-ready QR codes and automated booking receipts.
* **User Profile & History**: Track personal booking history, view active tickets, and manage account preferences.

### 👑 Admin Controls
* **Interactive Dashboard**: Real-time sales charts, revenue metrics, user growth analytics, and screen occupancy stats.
* **Resource Management**: Complete management interface for movies, theatres, screens, and show schedules.
* **Coupon Engine**: Create and manage percentage, flat amount, or promotional discount coupons.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite | Fast, modern SPA framework. |
| **State & Query** | Zustand + React Query | State management & query caching. |
| **Styling** | Tailwind CSS v4 | Curated glassmorphic dark-mode styling. |
| **Authentication** | Firebase Auth | Secure user authentication and token handling. |
| **Backend** | Node.js + Express | Scalable REST API server. |
| **Real-time** | Socket.io | Bidirectional WebSockets for seat locking. |
| **Database** | PostgreSQL + Prisma ORM | Relational database schema with migrations. |
| **Mailing** | Nodemailer | Transactional email confirmation templates. |
| **Deployment** | Vercel & GitHub CI/CD | Automatic continuous deployment. |

---

## 🏗️ Architecture Flow

```mermaid
graph TD
    Client[React Client] <-->|HTTP / REST API| Express[Express Server]
    Client <-->|WebSockets / Seat Locks| Socket[Socket.io Server]
    Client <-->|Auth Tokens| Firebase[Firebase Auth]
    Express -->|Prisma Client| DB[(PostgreSQL Database)]
    Express -->|Nodemailer| Mail[SMTP Email Service]
```

---

## 🚀 Getting Started

### 📋 Prerequisites
* **Node.js** (v18 or higher)
* **PostgreSQL** (installed and running on port 5432)

---

### 💾 Installation & Setup

#### 1. Clone & Setup Workspace
```bash
git clone https://github.com/Bunnyvalluri/ticket-book.git
cd ticket-book
```

#### 2. Configure Database & Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install backend dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file (based on `.env.example`) and supply your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/cinemax?schema=public"
   PORT=5000
   JWT_SECRET="generate_a_long_secret_key"
   ```
4. Run Prisma database migrations to create the tables:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Seed the database with sample movies, theatres, and shows:
   ```bash
   node prisma/seed.js
   ```
6. Start the backend development server:
   ```bash
   npm run dev
   ```

#### 3. Configure Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173/`.

---

## 👥 Demo Credentials

For testing the application, you can use the pre-seeded users:

* **Customer Account**:
  * **Email**: `customer@cinemax.com`
  * **Password**: `Test@1234`
* **Admin Account**:
  * **Email**: `admin@cinemax.com`
  * **Password**: `Admin@1234`

---

## 🔗 Deployment

- **Live URL**: [https://ticket-book-2026.vercel.app](https://ticket-book-2026.vercel.app)
- **Repository**: [https://github.com/Bunnyvalluri/ticket-book](https://github.com/Bunnyvalluri/ticket-book)
