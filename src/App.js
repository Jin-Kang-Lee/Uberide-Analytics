// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import MongoDashboard from "./pages/MongoDashboard";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 dark:bg-[#0B0E11] text-gray-900 dark:text-gray-200">
        <Routes>
          <Route path="/" element={<Navigate to="/sql" replace />} />
          <Route path="/sql" element={<Dashboard />} />
          <Route path="/mongo" element={<MongoDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
