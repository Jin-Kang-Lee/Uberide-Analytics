// backend/server.js
import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ---- DB Connection ----
const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

const [dbName] = await db.query("SELECT DATABASE() AS current_db;");
console.log("📂 Connected to DB:", dbName[0].current_db);

// -----------------------------------------------------------
// 1️⃣ Test Route
// -----------------------------------------------------------
app.get("/api/test", async (req, res) => {
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
app.get("/api/summary", async (req, res) => {
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
// 3️⃣ Rides per City (Top 5)
// -----------------------------------------------------------
app.get("/api/rides-per-city", async (req, res) => {
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
app.get("/api/bookings", async (req, res) => {
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
app.get("/api/revenue-by-vehicle", async (req, res) => {
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
app.get("/api/rides-per-location", async (req, res) => {
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
app.get("/api/rides-trend", async (req, res) => {
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
// Start server
// -----------------------------------------------------------
app.listen(5000, () => console.log("✅ Backend running on port 5000"));
