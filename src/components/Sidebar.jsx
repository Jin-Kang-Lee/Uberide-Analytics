import React from "react";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white dark:bg-[#181A20] shadow-sm p-4 rounded-2xl">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-blue-600 dark:text-yellow-400">Uber Analytics</h1>
      </div>
      <nav className="flex-1 p-4 space-y-3">
        <a href="#" className="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#222531]">Dashboard</a>
        <a href="#" className="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#222531]">Manage Bookings</a>
        <a href="#" className="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#222531]">Customers</a>
        <a href="#" className="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#222531]">Reports</a>
      </nav>
    </aside>
  );
}
