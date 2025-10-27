import React, { createContext, useState, useEffect } from "react";
import {
  fetchSummary,
  fetchCityInsights,
  fetchRevenueByVehicle,
  fetchRidesPerLocation,
  fetchRidesTrend
} from "../services/api";

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [summary, setSummary] = useState(() => JSON.parse(localStorage.getItem("summary")) || null);
  const [cityData, setCityData] = useState(() => JSON.parse(localStorage.getItem("cityData")) || null);

    const [revenueByVehicle, setRevenueByVehicle] = useState(() =>
        JSON.parse(localStorage.getItem("revenueByVehicle")) || null
    );
    const [ridesPerLocation, setRidesPerLocation] = useState(() =>
        JSON.parse(localStorage.getItem("ridesPerLocation")) || null
    );
    const [ridesTrend, setRidesTrend] = useState(() =>
        JSON.parse(localStorage.getItem("ridesTrend")) || null
    );

    useEffect(() => {
        const loadData = async () => {
        // ✅ Dashboard summary
        if (!summary) {
            console.log("🟢 Fetching summary from backend...");
            const data = await fetchSummary();
            setSummary(data);
            localStorage.setItem("summary", JSON.stringify(data));
        }

        // ✅ City insights (map + table)
        if (!cityData) {
            console.log("🟢 Fetching city insights from backend...");
            const data = await fetchCityInsights();
            setCityData(data);
            localStorage.setItem("cityData", JSON.stringify(data));
        }

        // ✅ DonutChart (Revenue by vehicle)
        if (!revenueByVehicle) {
            console.log("🟢 Fetching revenue-by-vehicle from backend...");
            const data = await fetchRevenueByVehicle();
            setRevenueByVehicle(data);
            localStorage.setItem("revenueByVehicle", JSON.stringify(data));
        }

        // ✅ BarChart (Rides per location)
        if (!ridesPerLocation) {
            console.log("🟢 Fetching rides-per-location from backend...");
            const data = await fetchRidesPerLocation();
            setRidesPerLocation(data);
            localStorage.setItem("ridesPerLocation", JSON.stringify(data));
        }

        // ✅ LineChart (Rides trend)
        if (!ridesTrend) {
            console.log("🟢 Fetching rides-trend from backend...");
            const data = await fetchRidesTrend();
            setRidesTrend(data);
            localStorage.setItem("ridesTrend", JSON.stringify(data));
        }
        };

        loadData();
    }, []);


  return (
  <DataContext.Provider
      value={{
        summary,
        cityData,
        revenueByVehicle,
        ridesPerLocation,
        ridesTrend
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
