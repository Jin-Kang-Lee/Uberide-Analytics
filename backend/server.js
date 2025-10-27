// backend/server.js
import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

//MONGODB
import { connectMongo } from "./config/mongo.js";
import rideRoutes from "./routes/rideRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";


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
// 8️⃣ City & Region Insights (for Map visualization)
// -----------------------------------------------------------
app.get("/api/city-insights", async (req, res) => {
  try {
    // 🧮 Core city metrics
    const [rows] = await db.query(`
      SELECT 
        sub.city,
        COUNT(sub.booking_id) AS total_rides,
        ROUND(SUM(sub.booking_value), 2) AS total_revenue,
        ROUND(AVG(sub.ride_distance), 2) AS avg_distance,
        ROUND(AVG(COALESCE(sub.customer_rating, 0)), 2) AS avg_rating,

        -- ✅ Completion Rate & Revenue per km
        ROUND(
          (SUM(CASE WHEN sub.status = 'Completed' THEN 1 ELSE 0 END) / COUNT(sub.booking_id)) * 100,
          2
        ) AS completion_rate,
        ROUND(SUM(sub.booking_value) / NULLIF(SUM(sub.ride_distance), 0), 2) AS revenue_per_km

      FROM (
        SELECT 
          b.booking_id,
          b.status,                
          b.booking_value,
          b.ride_distance,
          b.payment_method,
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

    // 🧮 Separate query for payment preferences per city
    const [payments] = await db.query(`
      SELECT 
        COALESCE(l.name, 'Unknown') AS city,
        b.payment_method,
        COUNT(*) AS method_count
      FROM booking b
      JOIN location l ON b.pickup_location_id = l.location_id
      GROUP BY l.name, b.payment_method;
    `);

    // 🧠 Reformat payment data
    const paymentMap = {};
    payments.forEach(row => {
      if (!paymentMap[row.city]) paymentMap[row.city] = {};
      paymentMap[row.city][row.payment_method] = row.method_count;
    });

    // 🗺️ Coordinates for your cities
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

    // 🧩 Merge everything together
    const enriched = rows.map(row => {
      // calculate payment preference %
      const payData = paymentMap[row.city] || {};
      const total = Object.values(payData).reduce((a, b) => a + b, 0);
      let payment_preference = "N/A";

      if (total > 0) {
        payment_preference = Object.entries(payData)
          .map(([method, count]) => `${method}: ${((count / total) * 100).toFixed(1)}%`)
          .join(", ");
      }

      return {
        ...row,
        latitude: cityCoords[row.city]?.lat || 22.9734,
        longitude: cityCoords[row.city]?.lon || 78.6569,
        payment_preference,
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error("❌ Error fetching city insights:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// -----------------------------------------------------------
// 9️⃣ CUSTOMER INSIGHTS SECTION
// -----------------------------------------------------------

// 9.1️⃣ Customer Summary
app.get("/api/customer-summary", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        COUNT(DISTINCT c.customer_id) AS total_customers,
        ROUND(AVG(r.customer_rating), 2) AS avg_customer_rating,
        ROUND(AVG(total_spent), 2) AS avg_spending_per_customer,
        (
          SELECT c2.customer_id
          FROM customer c2
          JOIN booking b2 ON c2.customer_id = b2.customer_id
          GROUP BY c2.customer_id
          ORDER BY SUM(b2.booking_value) DESC
          LIMIT 1
        ) AS top_customer_id
      FROM customer c
      JOIN booking b ON c.customer_id = b.customer_id
      LEFT JOIN ratings r ON b.booking_id = r.booking_id
      JOIN (
        SELECT customer_id, SUM(booking_value) AS total_spent
        FROM booking
        GROUP BY customer_id
      ) spend_per_customer ON spend_per_customer.customer_id = c.customer_id;
    `);
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Error fetching customer summary:", err);
    res.status(500).json({ error: "Database error" });
  }
});


// 9.2️⃣ Top 10 Customers by Total Spend
app.get("/api/top-customers", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        c.customer_id,
        COUNT(b.booking_id) AS total_rides,
        ROUND(SUM(b.booking_value), 2) AS total_spent,
        ROUND(AVG(r.customer_rating), 2) AS avg_rating
      FROM customer c
      JOIN booking b ON c.customer_id = b.customer_id
      LEFT JOIN ratings r ON b.booking_id = r.booking_id
      GROUP BY c.customer_id
      ORDER BY total_spent DESC
      LIMIT 10;
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching top customers:", err);
    res.status(500).json({ error: "Database error" });
  }
});


// 9.3️⃣ Customer Ride Frequency
app.get("/api/customer-frequency", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        ride_count AS ride_bracket,
        COUNT(*) AS num_customers
      FROM (
        SELECT c.customer_id, COUNT(b.booking_id) AS ride_count
        FROM customer c
        JOIN booking b ON c.customer_id = b.customer_id
        GROUP BY c.customer_id
      ) ride_stats
      GROUP BY ride_count
      ORDER BY ride_count ASC;
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching customer frequency:", err);
    res.status(500).json({ error: "Database error" });
  }
});




// 9.4️⃣ Monthly Customer Growth (fixed version)
app.get("/api/customer-growth", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        DATE_FORMAT(first_ride, '%Y-%m') AS first_ride_month,
        COUNT(*) AS new_customers
      FROM (
        SELECT c.customer_id, MIN(b.booking_ts) AS first_ride
        FROM customer c
        JOIN booking b ON c.customer_id = b.customer_id
        GROUP BY c.customer_id
      ) AS first_rides
      GROUP BY DATE_FORMAT(first_ride, '%Y-%m')
      ORDER BY first_ride_month;
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching customer growth:", err);
    res.status(500).json({ error: "Database error" });
  }
});


// 9.5️⃣ Ratings vs Spending (Correlation)
app.get("/api/customer-ratings-spending", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        c.customer_id,
        ROUND(AVG(r.customer_rating), 2) AS avg_rating,
        ROUND(SUM(b.booking_value), 2) AS total_spent
      FROM customer c
      JOIN booking b ON c.customer_id = b.customer_id
      LEFT JOIN ratings r ON b.booking_id = r.booking_id
      GROUP BY c.customer_id
      HAVING avg_rating IS NOT NULL
      ORDER BY total_spent DESC
      LIMIT 100;
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching customer ratings vs spending:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// -----------------------------------------------------------
// 9.6️⃣ Active vs Inactive Customers (Dynamic Threshold Version)
// -----------------------------------------------------------
app.get("/api/customer-active-status", async (req, res) => {
  try {
    const THRESHOLD_DAYS = 365; // 🟢 explicitly define threshold

    const [rows] = await db.query(`
      WITH customer_last AS (
        SELECT 
          c.customer_id,
          MAX(b.booking_ts) AS last_booking
        FROM customer c
        JOIN booking b ON c.customer_id = b.customer_id
        GROUP BY c.customer_id
      ),
      latest AS (
        SELECT MAX(booking_ts) AS latest_booking FROM booking
      )
      SELECT 
        CASE 
          WHEN DATEDIFF(l.latest_booking, cl.last_booking) <= ${THRESHOLD_DAYS} THEN 'Active'
          ELSE 'Inactive'
        END AS status,
        COUNT(*) AS num_customers,
        FROM_UNIXTIME(AVG(UNIX_TIMESTAMP(cl.last_booking))) AS avg_last_booking,
        ROUND(AVG(DATEDIFF(l.latest_booking, cl.last_booking)), 2) AS avg_days_since_last
      FROM customer_last cl
      CROSS JOIN latest l
      GROUP BY status;
    `);

    // 🟢 Attach threshold info in response
    res.json({
      threshold_days: 365,
      threshold_label: "Active = last ride within 1 year",
      data: rows,
    });
  } catch (err) {
    console.error("❌ Error fetching active vs inactive customers:", err);
    res.status(500).json({ error: "Database error" });
  }
});


// -----------------------------------------------------------
// 9.7️⃣ Ride Type Popularity
// -----------------------------------------------------------
app.get("/api/ride-type-popularity", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        v.name AS ride_type,
        COUNT(b.booking_id) AS rides
      FROM booking b
      JOIN vehicle_type v ON b.vehicle_type_id = v.vehicle_type_id
      GROUP BY v.name
      ORDER BY rides DESC;
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching ride type popularity:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// -----------------------------------------------------------
// 9.8️⃣ Peak Booking Hours
// -----------------------------------------------------------
app.get("/api/peak-booking-hours", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        HOUR(b.booking_ts) AS hour,
        COUNT(*) AS ride_count
      FROM booking b
      GROUP BY hour
      ORDER BY hour ASC;
    `);

    // Format hours like 0000, 0100, 0200
    const formatted = rows.map(r => ({
      hour: r.hour.toString().padStart(2, "0") + "00",
      ride_count: r.ride_count
    }));

    res.json(formatted);
  } catch (err) {
    console.error("❌ Error fetching peak booking hours:", err.message);
    res.status(500).json({ error: "Database error: " + err.message });
  }
});



dotenv.config();

const mongoApp = express();
mongoApp.use(cors({ origin: "http://localhost:3000" }));
mongoApp.use(express.json());

(async () => {
  try {
    const conn = await connectMongo();
    console.log('🍃 MongoDB connected successfully → ${conn.connection.name}');
    mongoApp.use("/api/mongo", rideRoutes);
    mongoApp.use("/api/mongo", bookingRoutes);

    mongoApp.listen(5002, () =>
      console.log("🍃 MongoDB backend running on port 5002")
    );
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
  }
})();



// -----------------------------------------------------------
// Start server
// -----------------------------------------------------------
app.listen(5001, () => console.log("✅ Backend running on port 5001"));
