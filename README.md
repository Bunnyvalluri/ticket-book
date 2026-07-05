# 🎬 CineMax — Movie Ticket Booking Platform

CineMax is a production-ready, full-stack Movie Ticket Booking Platform featuring a premium dark-mode interface, real-time seat locking via WebSockets, secure payment simulations, and comprehensive admin controls.

---

## ✨ Features

### 👤 Customer Experience
* **Dynamic Catalog**: Browse trending, now showing, and coming-soon movies with ratings, trailers, and reviews.
* **Smart Filtering**: Filter by genre, language, rating, and local cities.
* **Real-time Seat Selection**: Interactive seat grid with live locking (using Socket.io) to prevent double bookings.
* **Simulated Checkout**: Integration with a simulated payment gateway flow.
* **Digital e-Ticket**: Printable ticket receipts with simulated scan-ready QR codes and automated email confirmations.
* **User Profile**: Personal settings, password manager, and notification preferences.

### 👑 Admin Controls
* **Interactive Dashboard**: Real-time sales charts, revenue metrics, user growth analytics, and occupancy stats.
* **Resource Management**: Complete UI to manage movies, theatres, screens, and show times.
* **Coupon Engine**: Create and manage percentage, flat, or BOGO discount coupons.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite | Fast, modern web application framework. |
| **State & Query** | Zustand + React Query | Clean state management & query caching. |
| **Styling** | Tailwind CSS v4 | Curated glassmorphic styling and HSL tokens. |
| **Backend** | Node.js + Express | Highly scalable REST API. |
| **Real-time** | Socket.io | Bidirectional connection for seat locking. |
| **Database** | PostgreSQL + Prisma ORM | Normalized relational database schema. |
| **Mailing** | Nodemailer | Transactional email confirmation templates. |

---

## 🏗️ Architecture Flow

```mermaid
graph TD
    Client[React Client] <-->|HTTP / REST API| Express[Express Server]
    Client <-->|WebSockets / Seat Locks| Socket[Socket.io Server]
    Express -->|Prisma Client| DB[(PostgreSQL Database)]
    Express -->|Nodemailer| Mail[SMTP Email Service]
    Express -->|Payment Gateway| Pay[Razorpay Gateway]
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
