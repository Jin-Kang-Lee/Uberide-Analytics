import { Routes, Route, Navigate } from "react-router-dom";

// Existing pages
import Dashboard from "./pages/Dashboard";
import CityInsights from "./pages/CityInsights";

// 🟢 New Mongo pages
import TripReplay from "./pages/TripReplay";
import RideRecommendations from "./pages/RideRecommendations";
import PromotionsLab from "./pages/PromotionsLab";

function App() {
  return (
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" />} />

      {/* Existing routes */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/city-insights" element={<CityInsights />} />

      {/* 🟢 New Mongo routes */}
      <Route path="/mongo-trip-replay" element={<TripReplay />} />
      <Route path="/mongo-recommendations" element={<RideRecommendations />} />
      <Route path="/mongo-promotions" element={<PromotionsLab />} />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
