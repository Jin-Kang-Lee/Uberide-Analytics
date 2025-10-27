import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import CityInsights from "./pages/CityInsights";
import Bookings from "./pages/Bookings";
import CustomerInsights from "./pages/CustomerInsights"; 
import OperationalOverview from "./pages/OperationalOverview";
import Vehicles from "./pages/Vehicles";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/city-insights" element={<CityInsights />} />
      <Route path="/manage-bookings" element={<Bookings />} />
      <Route path="/operationaloverview" element={<OperationalOverview />} />
      <Route path="/mongo-vehicles" element={<Vehicles />} />
      <Route path="/customer-insights" element={<CustomerInsights />} /> 
    </Routes>
  );
}

export default App;
