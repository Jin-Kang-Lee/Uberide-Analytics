// src/services/mongoApi.js
const BASE_URL = "http://localhost:5000/api/mongo/rides";
const SUMMARY_URL = "http://localhost:5000/api/mongo/summary";

export async function fetchMongoRides() {
  try {
    const response = await fetch(BASE_URL);
    if (!response.ok) throw new Error("Failed to fetch MongoDB data");
    return await response.json();
  } catch (err) {
    console.error("❌ Error fetching Mongo data:", err);
    return [];
  }
}

export async function fetchMongoSummary() {
  try {
    const response = await fetch(SUMMARY_URL);
    if (!response.ok) throw new Error("Failed to fetch Mongo summary");
    return await response.json();
  } catch (err) {
    console.error("❌ Error fetching Mongo summary:", err);
    return {};
  }
}
