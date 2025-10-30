// backend/server.js
import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";
import { randomUUID } from "crypto"; 
dotenv.config();

//MONGODB
import { connectMongo } from "./config/mongo.js";
import rideRoutes from "./routes/rideRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";


const app = express();
app.use(cors());
app.use(express.json());

// ---- DB Connection (POOL) ----
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3307,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 20000,
  enableKeepAlive: true,
});

// verify once on boot
const [dbName] = await pool.query("SELECT DATABASE() AS current_db;");
console.log("📂 Connected to DB:", dbName[0].current_db);


// -----------------------------------------------------------
// 1️⃣ Test Route
// -----------------------------------------------------------
app.get("/api/test", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT COUNT(*) AS total_rides FROM booking;");
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
    const [summary] = await pool.query(`
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
    const [rows] = await pool.query(`
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
// GET /api/bookings
// - If no query params: return the old "recent 10 with joins" for the dashboard.
// - If any of {limit, offset, search} is present: return paginated + searchable data
//   for the Manage Bookings table (with total count).
app.get("/api/bookings", async (req, res) => {
  try {
    const limit  = req.query.limit  ? Number(req.query.limit)  : null;
    const offset = req.query.offset ? Number(req.query.offset) : null;
    const search = (req.query.search || "").trim();
    const paged  = limit !== null || offset !== null || search.length > 0;

    if (!paged) {
      // --- Dashboard mode (your existing query) ---
      const [rows] = await pool.query(`
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
      return res.json(rows);
    }

    // --- Manage Bookings mode (paginated + search) ---
    const pageLimit  = Number.isFinite(limit)  && limit  > 0 ? limit  : 25;
    const pageOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;

    let where = "";
    const params = [];
    if (search) {
      where = "WHERE booking_id LIKE ?";
      params.push(`%${search}%`);
    }

    // Lean list for table; joins are expensive and not needed for search/pagination
    const [data] = await pool.query(
      `
      SELECT 
        booking_id, customer_id, vehicle_type_id,
        pickup_location_id, drop_location_id,
        status, booking_value, ride_distance,
        payment_method, currency, booking_ts,locked_by, locked_at
      FROM booking
      ${where}
      ORDER BY booking_ts DESC
      LIMIT ? OFFSET ?;
      `,
      [...params, pageLimit, pageOffset]
    );

    const [cnt] = await pool.query(
      `SELECT COUNT(*) AS total FROM booking ${where};`,
      params
    );

    return res.json({
      data,
      total: cnt[0].total,
      limit: pageLimit,
      offset: pageOffset,
    });
  } catch (err) {
    console.error("❌ GET /api/bookings:", err);
    res.status(500).json({ error: "Failed to fetch bookings." });
  }
});



// -----------------------------------------------------------
// 5️⃣ Revenue by Vehicle Type (Donut Chart)
// -----------------------------------------------------------
app.get("/api/revenue-by-vehicle", async (req, res) => {
  try {
    const [rows] = await pool.query(`
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
    const [rows] = await pool.query(`
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
    const [rows] = await pool.query(`
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
    const [rows] = await pool.query(`
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
    const [payments] = await pool.query(`
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

app.get("/api/customers", async (req, res) => {
  console.time("/api/customers");
  try {
    const [rows] = await pool.query(`
      SELECT customer_id, name
      FROM customer
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ /api/customers:", { message: err.message, sqlMessage: err.sqlMessage });
    res.status(500).json({ error: err.sqlMessage || "Failed to fetch customers" });
  } finally {
    console.timeEnd("/api/customers");
  }
});

app.get("/api/vehicle-types", async (req, res) => {
  console.time("/api/vehicle-types");
  try {
    const [rows] = await pool.query(`
      SELECT vehicle_type_id, name AS type_name
      FROM vehicle_type
      ORDER BY name ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ /api/vehicle-types:", { message: err.message, sqlMessage: err.sqlMessage });
    res.status(500).json({ error: err.sqlMessage || "Failed to fetch vehicle types" });
  } finally {
    console.timeEnd("/api/vehicle-types");
  }
});

app.get("/api/locations", async (req, res) => {
  console.time("/api/locations");
  try {
    const [rows] = await pool.query(`
      SELECT
        location_id,
        name  AS location_name,
        name  AS city
      FROM location
      ORDER BY location_name ASC
      LIMIT 500
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ /api/locations:", { message: err.message, sqlMessage: err.sqlMessage });
    res.status(500).json({ error: err.sqlMessage || "Failed to fetch locations" });
  } finally {
    console.timeEnd("/api/locations");
  }
});


// ✅ Validate a customer_id (VARCHAR-safe)
app.get("/api/customers/:id", async (req, res) => {
  try {
    const id = (req.params.id || "").trim();

    if (!id) return res.status(400).json({ exists: false, error: "Missing customer_id" });

    const [rows] = await pool.query(
      `SELECT customer_id FROM customer WHERE customer_id = ? LIMIT 1`,
      [id]
    );

    res.json({ exists: rows.length > 0, customer_id: id });
  } catch (err) {
    console.error("❌ /api/customers/:id:", err.message);
    res.status(500).json({ error: "Failed to validate customer" });
  }
});





// at top (already present): import { randomUUID } from "crypto";

// ---- helpers ----
function toMySqlDateTime(dt) {
  if (!dt) return null;
  const s = String(dt).trim().replace("T", " ").replace("Z", "");
  return s.length === 16 ? `${s}:00` : s.slice(0, 19);
}

// Generate next booking id like CNR1058308, based on current max.
// We normalize by removing spaces before reading the numeric part.
async function getNextBookingId() {
  const [rows] = await pool.query(
    `
    SELECT
      MAX(CAST(SUBSTRING(REPLACE(booking_id, ' ', ''), 4) AS UNSIGNED)) AS max_num
    FROM booking
    WHERE REPLACE(booking_id,' ','') REGEXP '^CNR[0-9]+$'
    `
  );
  const currentMax = rows?.[0]?.max_num || 0;
  return `CNR${currentMax + 1}`; // no space in new IDs
}

// Ensure the id doesn't exist (very unlikely after MAX(), but be safe).
async function allocateBookingId() {
  // try a few times; if a race happens, bump and retry
  let attempts = 0;
  let candidate;
  while (attempts < 5) {
    candidate = await getNextBookingId();
    const [exists] = await pool.query(
      `SELECT 1 FROM booking WHERE booking_id = ? LIMIT 1`,
      [candidate]
    );
    if (exists.length === 0) return candidate;

    // If somehow taken, increment its numeric tail by 1 and test again
    const num = Number(candidate.replace(/^CNR\s*/, "").replace(" ", "").slice(3)) || 0;
    candidate = `CNR${num + 1}`;
    attempts++;
  }
  // super-rare fallback: unique-ish suffix
  return `CNR${Date.now()}`;
}

// ---- route ----
app.post("/api/bookings", async (req, res) => {
  try {
    const {
      customer_id,
      vehicle_type_id,
      pickup_location_id,
      drop_location_id,
      booking_ts,
      status,
      booking_value,
      ride_distance,
      payment_method,
      currency,
    } = req.body || {};

    // basic validation
    if (
      !customer_id ||
      !vehicle_type_id ||
      !pickup_location_id ||
      !drop_location_id ||
      !booking_ts ||
      !payment_method
    ) {
      return res.status(400).json({ error: "Missing required fields." });
    }
    if (pickup_location_id === drop_location_id) {
      return res.status(400).json({ error: "Pickup and drop must be different." });
    }

    const cid = String(customer_id).trim();
    const vt  = Number(vehicle_type_id);
    const pk  = Number(pickup_location_id);
    const dp  = Number(drop_location_id);
    const ts  = toMySqlDateTime(booking_ts);

    // FK validations (clear 4xx messages)
    const [[cust], [veh], [pick], [drop]] = await Promise.all([
      pool.query(`SELECT 1 FROM customer WHERE customer_id = ? LIMIT 1`, [cid]),
      pool.query(`SELECT 1 FROM vehicle_type WHERE vehicle_type_id = ? LIMIT 1`, [vt]),
      pool.query(`SELECT 1 FROM location WHERE location_id = ? LIMIT 1`, [pk]),
      pool.query(`SELECT 1 FROM location WHERE location_id = ? LIMIT 1`, [dp]),
    ]);
    if (cust.length === 0) return res.status(400).json({ error: "Customer not found." });
    if (veh.length === 0)  return res.status(400).json({ error: "Vehicle type not found." });
    if (pick.length === 0) return res.status(400).json({ error: "Pickup location not found." });
    if (drop.length === 0) return res.status(400).json({ error: "Drop location not found." });

    // allocate booking_id in your "CNR<number>" format
    let booking_id = await allocateBookingId();

    const sql = `
      INSERT INTO booking
        (booking_id, customer_id, vehicle_type_id, pickup_location_id, drop_location_id,
         booking_ts, status, booking_value, ride_distance, payment_method, currency)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      booking_id,
      cid,
      vt,
      pk,
      dp,
      ts,
      status || "Pending",
      booking_value ?? 0,
      ride_distance ?? 0,
      payment_method,
      currency || "INR",
    ];

    // if booking_id is UNIQUE/PK, any collision throws and we can retry (rare)
    try {
      await pool.execute(sql, params);
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        // race: retry once with a fresh id
        booking_id = await allocateBookingId();
        params[0] = booking_id;
        await pool.execute(sql, params);
      } else {
        throw err;
      }
    }

    return res.status(201).json({ ok: true, booking_id, message: "Booking created successfully." });
  } catch (err) {
    const code = err?.code || err?.errno;
    if (code === "ER_NO_REFERENCED_ROW_2" || code === 1452) {
      return res.status(400).json({ error: "Foreign key does not exist (vehicle type or location)." });
    }
    if (code === "ER_BAD_FIELD_ERROR" || code === 1054) {
      return res.status(500).json({ error: `Column mismatch: ${err.sqlMessage}` });
    }
    console.error("❌ POST /api/bookings:", {
      message: err.message,
      code: err.code,
      errno: err.errno,
      sqlMessage: err.sqlMessage,
      sql: err.sql,
    });
    return res.status(500).json({ error: "Failed to create booking." });
  }
});


// ====== Simple row lock with TTL ======
const LOCK_TTL_SECONDS = 180; // 3 minutes

// helper to check if a row is currently lockable
async function tryAcquireLock(bookingId, actor) {
  // expire old locks inline
  const [res] = await pool.query(
    `
    UPDATE booking
       SET locked_by = ?, locked_at = NOW()
     WHERE booking_id = ?
       AND (
             locked_by IS NULL
          OR locked_at IS NULL
          OR TIMESTAMPDIFF(SECOND, locked_at, NOW()) > ?
           )
    `,
    [actor, bookingId, LOCK_TTL_SECONDS]
  );
  return res.affectedRows === 1;
}

// POST /api/bookings/:id/lock { actor }
app.post("/api/bookings/:id/lock", async (req, res) => {
  try {
    const bookingId = (req.params.id || "").trim();
    const actor = (req.body?.actor || "").trim() || "unknown";

    if (!bookingId) return res.status(400).json({ ok: false, error: "Missing booking id" });

    const acquired = await tryAcquireLock(bookingId, actor);
    if (acquired) {
      return res.json({ ok: true, locked_by: actor, ttl_seconds: LOCK_TTL_SECONDS });
    }

    // Someone else holds a non-expired lock — tell the UI who
    const [rows] = await pool.query(
      `
      SELECT locked_by,
             TIMESTAMPDIFF(SECOND, locked_at, NOW()) AS age_sec
        FROM booking
       WHERE booking_id = ?
      `,
      [bookingId]
    );
    const holder = rows?.[0]?.locked_by || "someone else";
    return res.json({ ok: false, locked_by: holder });
  } catch (e) {
    console.error("LOCK error:", e);
    res.status(500).json({ ok: false, error: "Lock failed" });
  }
});

// POST /api/bookings/:id/unlock { actor }
app.post("/api/bookings/:id/unlock", async (req, res) => {
  try {
    const bookingId = (req.params.id || "").trim();
    const actor = (req.body?.actor || "").trim() || "unknown";
    if (!bookingId) return res.status(400).json({ ok: false, error: "Missing booking id" });

    // Only the same actor (or expired) can clear the lock
    const [res1] = await pool.query(
      `
      UPDATE booking
         SET locked_by = NULL, locked_at = NULL
       WHERE booking_id = ?
         AND (
               locked_by = ?
            OR locked_by IS NULL
            OR locked_at IS NULL
            OR TIMESTAMPDIFF(SECOND, locked_at, NOW()) > ?
             )
      `,
      [bookingId, actor, LOCK_TTL_SECONDS]
    );

    return res.json({ ok: res1.affectedRows > 0 });
  } catch (e) {
    console.error("UNLOCK error:", e);
    res.status(500).json({ ok: false, error: "Unlock failed" });
  }
});








// PUT /api/bookings/:booking_id
app.put("/api/bookings/:booking_id", async (req, res) => {
  try {
    const { booking_id } = req.params;
    const updates = req.body || {};

    const allowedFields = [
      "status",
      "booking_value",
      "ride_distance",
      "payment_method",
      "currency",
    ];

    const setClauses = [];
    const values = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        values.push(updates[field]);
      }
    }

    if (!setClauses.length) {
      return res.status(400).json({ error: "No valid fields to update." });
    }

    values.push(booking_id);

    const [result] = await pool.query(
      `UPDATE booking SET ${setClauses.join(", ")} WHERE booking_id = ?;`,
      values
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Booking not found." });

    res.json({ ok: true, message: "Booking updated." });
  } catch (err) {
    console.error("❌ PUT /api/bookings:", err);
    res.status(500).json({ error: "Failed to update booking." });
  }
});

// DELETE /api/bookings/:booking_id
app.delete("/api/bookings/:booking_id", async (req, res) => {
  try {
    const { booking_id } = req.params;
    const [result] = await pool.query(
      `DELETE FROM booking WHERE booking_id = ?;`,
      [booking_id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Booking not found." });

    res.json({ ok: true, message: "Booking deleted." });
  } catch (err) {
    console.error("❌ DELETE /api/bookings:", err);
    res.status(500).json({ error: "Failed to delete booking." });
  }
});



// -----------------------------------------------------------
// 9️⃣ CUSTOMER INSIGHTS SECTION
// -----------------------------------------------------------

// 9.1️⃣ Customer Summary
app.get("/api/customer-summary", async (req, res) => {
  try {
    const [rows] = await pool.query(`
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
    const [rows] = await pool.query(`
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
    const [rows] = await pool.query(`
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
    const [rows] = await pool.query(`
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
    const [rows] = await pool.query(`
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

    const [rows] = await pool.query(`
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
    const [rows] = await pool.query(`
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
    const [rows] = await pool.query(`
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
