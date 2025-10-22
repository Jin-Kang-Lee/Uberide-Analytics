// =============================================================================
// UNIFIED SERVER.JS
// Runs both MySQL backend (port 5000) and MongoDB backend (port 5001)
// =============================================================================

import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";

// Mongo Imports
import connectMongo from "./config/mongo.js";
import rideRoutes from "./routes/rideRoutes.js";

dotenv.config();
// Load ports from .env
const SQL_PORT = process.env.SQL_PORT || 5001;
const MONGO_PORT = process.env.MONGO_PORT || 5002;

// =============================================================================
// 🧱 SERVER 1: MySQL BACKEND (PORT 5000)
// =============================================================================
const sqlApp = express();
sqlApp.use(cors({ origin: "http://localhost:3000" }));
sqlApp.use(express.json());

async function startMySQLServer() {
  try {
    const db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    const [dbName] = await db.query("SELECT DATABASE() AS current_db;");
    console.log(`✅ Connected to MySQL DB: ${dbName[0].current_db}`);

    // Keep your SQL endpoints as is
    sqlApp.get("/api/test", async (req, res) => {
      try {
        const [rows] = await db.query("SELECT COUNT(*) AS total_rides FROM booking;");
        res.json(rows[0]);
      } catch (err) {
        console.error("❌ Error fetching from DB:", err);
        res.status(500).json({ error: "Database error" });
      }
    });


    // -----------------------------------------------------------
    // 2️⃣ Summary (KPI Cards)
    // -----------------------------------------------------------
    sqlApp.get("/api/summary", async (req, res) => {
      try {
        const [summary] = await db.query(`
          SELECT
            COUNT(b.booking_id) AS total_rides,
            ROUND(SUM(b.booking_value), 2) AS total_revenue,
            ROUND(AVG(b.ride_distance), 2) AS avg_distance,
            ROUND(
              IFNULL(
                AVG(
                  (COALESCE(r.driver_rating, 0) + COALESCE(r.customer_rating, 0)) / 2
                ),
                0
              ),
              2
            ) AS avg_rating
          FROM booking b
          LEFT JOIN ratings r ON b.booking_id = r.booking_id;
        `);
        res.json(summary[0]);
      } catch (err) {
        console.error("❌ Error fetching summary:", err);
        res.status(500).json({ error: "Database error" });
      }
    });

    // -----------------------------------------------------------
    // 3️⃣ Rides per City (Top 20)
    // -----------------------------------------------------------
    sqlApp.get("/api/rides-per-city", async (req, res) => {
      try {
        const [rows] = await db.query(`
          SELECT 
            COALESCE(l.name, 'Unknown') AS location_name,
            COUNT(b.booking_id) AS rides
          FROM booking b
          LEFT JOIN location l ON b.pickup_location_id = l.location_id
          GROUP BY location_name
          ORDER BY rides DESC
          LIMIT 20;
        `);
        res.json(rows);
      } catch (err) {
        console.error("❌ Error fetching rides per city:", err);
        res.status(500).json({ error: "Database error" });
      }
    });

    // -----------------------------------------------------------
    // 4️⃣ Recent Bookings (Table)
    // -----------------------------------------------------------
    sqlApp.get("/api/bookings", async (req, res) => {
      try {
        const [rows] = await db.query(`
          SELECT 
            b.booking_id,
            c.name AS customer_name,
            lp.city AS pickup_city,
            ld.city AS drop_city,
            b.ride_distance AS distance_km,
            b.booking_value AS fare_amount
          FROM booking b
          JOIN customer c ON b.customer_id = c.customer_id
          JOIN location lp ON b.pickup_location_id = lp.location_id
          JOIN location ld ON b.drop_location_id = ld.location_id
          ORDER BY b.booking_ts DESC
          LIMIT 10;
        `);
        res.json(rows);
      } catch (err) {
        console.error("❌ Error fetching bookings:", err);
        res.status(500).json({ error: "Database error" });
      }
    });

    // -----------------------------------------------------------
    // 5️⃣ Revenue by Vehicle Type (Donut Chart)
    // -----------------------------------------------------------
    sqlApp.get("/api/revenue-by-vehicle", async (req, res) => {
      try {
        const [rows] = await db.query(`
          SELECT 
            v.name AS vehicle_type,
            ROUND(SUM(b.booking_value), 2) AS revenue
          FROM booking b
          JOIN vehicle_type v ON b.vehicle_type_id = v.vehicle_type_id
          GROUP BY v.name
          ORDER BY revenue DESC;
        `);
        res.json(rows);
      } catch (err) {
        console.error("❌ Error fetching revenue by vehicle type:", err);
        res.status(500).json({ error: "Database error" });
      }
    });

    // -----------------------------------------------------------
    // 6️⃣ Rides per Location (Bar Chart)
    // -----------------------------------------------------------
    sqlApp.get("/api/rides-per-location", async (req, res) => {
      try {
        const [rows] = await db.query(`
          SELECT 
            COALESCE(l.name, 'Unknown') AS location_name,
            COUNT(b.booking_id) AS rides
          FROM booking b
          LEFT JOIN location l ON b.pickup_location_id = l.location_id
          GROUP BY location_name
          ORDER BY rides DESC
          LIMIT 5;
        `);
        res.json(rows);
      } catch (err) {
        console.error("❌ Error fetching rides per location:", err);
        res.status(500).json({ error: "Database error" });
      }
    });

    // -----------------------------------------------------------
    // 7️⃣ Rides Trend Over Time (Line Chart)
    // -----------------------------------------------------------
    sqlApp.get("/api/rides-trend", async (req, res) => {
      try {
        const [rows] = await db.query(`
          SELECT 
            DATE_FORMAT(b.booking_ts, '%Y-%m') AS month,
            COUNT(*) AS total_rides
          FROM booking b
          GROUP BY month
          ORDER BY month ASC
          LIMIT 12;
        `);
        res.json(rows);
      } catch (err) {
        console.error("❌ Error fetching rides trend:", err);
        res.status(500).json({ error: "Database error" });
      }
    });

    // -----------------------------------------------------------
    // 8️⃣ City & Region Insights (for Map visualization)
    // -----------------------------------------------------------
    sqlApp.get("/api/city-insights", async (req, res) => {
      try {
        const [rows] = await db.query(`
          SELECT 
            sub.city,
            COUNT(sub.booking_id) AS total_rides,
            ROUND(SUM(sub.booking_value), 2) AS total_revenue,
            ROUND(AVG(sub.ride_distance), 2) AS avg_distance,
            ROUND(AVG(COALESCE(sub.customer_rating, 0)), 2) AS avg_rating
          FROM (
            SELECT 
              b.booking_id,
              b.booking_value,
              b.ride_distance,
              r.customer_rating,
              COALESCE(l.name, 'Unknown') AS city
            FROM booking b
            JOIN location l ON b.pickup_location_id = l.location_id
            LEFT JOIN ratings r ON b.booking_id = r.booking_id
          ) AS sub
          GROUP BY sub.city
          ORDER BY total_revenue DESC
          LIMIT 10;
        `);

        // Optional coordinates
        const cityCoords = {
          "Barakhamba Road":  { lat: 28.6304, lon: 77.2240 },
          "Khandsa":          { lat: 28.4319, lon: 77.0322 },
          "Pataudi Chowk":    { lat: 28.3260, lon: 76.9550 },
          "Subhash Chowk":    { lat: 28.4558, lon: 77.0337 },
          "Badarpur":         { lat: 28.4962, lon: 77.3006 },
          "Inderlok":         { lat: 28.6712, lon: 77.1760 },
          "AIIMS":            { lat: 28.5665, lon: 77.2100 },
          "Tughlakabad":      { lat: 28.4986, lon: 77.2577 },
          "Greater Noida":    { lat: 28.4744, lon: 77.5030 },
          "Mayur Vihar":      { lat: 28.6044, lon: 77.3117 },
        };

        const enriched = rows.map(row => ({
          ...row,
          latitude: cityCoords[row.city]?.lat || 22.9734,
          longitude: cityCoords[row.city]?.lon || 78.6569,
        }));

        res.json(enriched);
      } catch (err) {
        console.error("❌ Error fetching city insights:", err);
        res.status(500).json({ error: "Database error" });
      }
    });

    // Start MySQL server
    sqlApp.listen(SQL_PORT, () => {
      console.log(`🧱 MySQL backend running on port ${SQL_PORT}`);
    });
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
  }
}

startMySQLServer();

// =============================================================================
// 🍃 SERVER 2: MONGODB BACKEND (PORT 5001)
// =============================================================================
const mongoApp = express();
mongoApp.use(cors({ origin: "http://localhost:3000" }));
mongoApp.use(express.json());

(async () => {
  try {
    const conn = await connectMongo();
    console.log(`🍃 MongoDB connected successfully → ${conn.connection.name}`);
    mongoApp.use("/api/mongo", rideRoutes);

    mongoApp.listen(MONGO_PORT, () => {
      console.log(`🍃 MongoDB backend running on port ${MONGO_PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
  }
})();