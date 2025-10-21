import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import CityInsights from "./pages/CityInsights";
import CustomerInsights from "./pages/CustomerInsights"; 

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/city-insights" element={<CityInsights />} />
      <Route path="/customer-insights" element={<CustomerInsights />} /> 
      
    </Routes>
  );
}

export default App;
