import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import CityInsights from "./pages/CityInsights";
import OperationalOverview from "./pages/OperationalOverview";
import Vehicles from "./pages/Vehicles";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/city-insights" element={<CityInsights />} />
      <Route path="/operationaloverview" element={<OperationalOverview />} />
      <Route path="/mongo-vehicles" element={<Vehicles />} />
    </Routes>
  );
}

export default App;
