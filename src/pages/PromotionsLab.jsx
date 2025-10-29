import React, { useState } from "react";

export default function PromotionsLab() {
  const [customerId, setCustomerId] = useState("");
  const [vehicleType, setVehicleType] = useState("Bike");
  const [hour, setHour] = useState(18);
  const [dayOfWeek, setDayOfWeek] = useState("Sunday");

  const [snapshot, setSnapshot] = useState(null);
  const [decision, setDecision] = useState(null);
  const [err, setErr] = useState("");

  const loadSnapshot = async () => {
    setErr(""); setSnapshot(null); setDecision(null);
    if (!customerId.trim()) { setErr("Enter a Customer ID"); return; }
    try {
      const res = await fetch(`http://localhost:5002/api/mongo/customers/${encodeURIComponent(customerId)}/snapshot`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSnapshot(await res.json());
    } catch (e) {
      setErr(`Failed to load snapshot: ${e.message}`);
    }
  };

  const requestDecision = async () => {
    setErr(""); setDecision(null);
    try {
      const res = await fetch(`http://localhost:5002/api/mongo/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, vehicleType, hour: Number(hour), dayOfWeek })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDecision(await res.json());
    } catch (e) {
      setErr(`Failed to decide: ${e.message}`);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Promotions & Experiments (MongoDB)</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <input className="border rounded px-3 py-2" value={customerId} onChange={(e)=>setCustomerId(e.target.value)} placeholder="CID7747807" />
        <select className="border rounded px-3 py-2" value={vehicleType} onChange={(e)=>setVehicleType(e.target.value)}>
          <option>Bike</option><option>Sedan</option><option>Premier</option>
        </select>
        <div className="flex gap-2">
          <input className="border rounded px-3 py-2 w-24" type="number" min="0" max="23" value={hour} onChange={(e)=>setHour(e.target.value)} />
          <select className="border rounded px-3 py-2" value={dayOfWeek} onChange={(e)=>setDayOfWeek(e.target.value)}>
            {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={loadSnapshot} className="px-4 py-2 rounded bg-gray-700 text-white">Load Snapshot</button>
        <button onClick={requestDecision} className="px-4 py-2 rounded bg-green-600 text-white">Get Decision</button>
      </div>

      {err && <p className="text-red-600 mb-3">{err}</p>}

      {snapshot && (
        <div className="p-4 rounded border mb-4">
          <h2 className="font-medium mb-2">customer_snapshots</h2>
          <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">{JSON.stringify(snapshot, null, 2)}</pre>
        </div>
      )}

      {decision && (
        <div className="p-4 rounded border">
          <h2 className="font-medium mb-2">Decision</h2>
          <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">{JSON.stringify(decision, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
