# 🚖 UberRide Analytics Platform

A full-stack analytics dashboard inspired by Uber’s internal operations tools. This system visualizes ride activity, revenue trends, customer behavior, and city-level performance using a hybrid architecture of **MySQL** and **MongoDB**.

---

## 📊 Overview

UberRide Analytics transforms raw ride data into meaningful insights to support operational planning and business decision-making. The platform combines **relational SQL analytics** for financial/operational data with **MongoDB customer models** for flexible user profiling and promotion logic.

### Key Objectives
- **Data Visualization:** Real-time dashboards using Recharts and Leaflet.
- **Hybrid Database Architecture:** Leveraging SQL for structured transactional data and NoSQL for semi-structured customer snapshots.
- **Performance:** Optimized query performance through strategic indexing and aggregation pipelines.

---

## 🛠️ Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Frontend** | React.js, TailwindCSS, Recharts, Leaflet.js |
| **Backend** | Node.js, Express.js, REST API |
| **Database (SQL)** | MySQL (Ride & Revenue Analytics) |
| **Database (NoSQL)** | MongoDB (Snapshots & Promotion Logic) |


---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/uber-analytics.git](https://github.com/your-username/uber-analytics.git)
cd uber-analytics
```

2. Install Dependencies
Backend:

```bash
npm install
```

Frontend:
```bash
cd client
npm install
```

3. Configure Environment
Create a .env file in the root directory and add your database credentials:

MySQL Configuration:

Code snippet -->
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=uber_analytics


MongoDB Configuration:

Code snippet -->
MONGO_URI=your_mongodb_connection_string

4. Start the Application
Start Backend Server:
```bash
# In the root directory
node server.js
```

Start Frontend Client:
```bash
# In the client directory
npm start
```
---
