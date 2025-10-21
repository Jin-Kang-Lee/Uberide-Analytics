import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import CityInsights from "./pages/CityInsights";
import OperationalOverview from "./pages/OperationalOverview";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/city-insights" element={<CityInsights />} />
      <Route path="/operationaloverview" element={<OperationalOverview />} />
    </Routes>
  );
}

export default App;
