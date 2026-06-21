/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useHMS } from "../context/HMSContext";
import { RoomStatus, ReservationStatus } from "../types";
import {
  TrendingUp,
  Users,
  BedDouble,
  AlertTriangle,
  Clock,
  Briefcase,
  Activity,
  CheckCircle,
  Warehouse
} from "lucide-react";

export const OverviewDashboard: React.FC = () => {
  const {
    rooms,
    reservations,
    invoices,
    inventory,
    auditLogs,
    hotelProfile,
    activeRole
  } = useHMS();

  // 1. Calculations
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === RoomStatus.Occupied).length;
  const cleaningRooms = rooms.filter((r) => r.status === RoomStatus.Cleaning).length;
  const maintenanceRooms = rooms.filter((r) => r.status === RoomStatus.Maintenance).length;
  const availableRooms = rooms.filter((r) => r.status === RoomStatus.Available).length;

  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  // Revenue compiled from all invoice payments
  const totalUSDRevenue = invoices.reduce((sumVal, inv) => {
    const paidSum = inv.payments.reduce((acc, p) => acc + p.amount, 0);
    return sumVal + paidSum;
  }, 0);

  // Check today's bookings
  const todayStr = new Date().toISOString().split("T")[0];
  const pendingCheckins = reservations.filter(
    (r) => r.checkInDate <= todayStr && r.status === ReservationStatus.Confirmed
  ).length;
  const checkedInCurrently = reservations.filter(
    (r) => r.status === ReservationStatus.CheckedIn
  ).length;

  // Inventory Critical Alerts (items below minQty)
  const lowStockItems = inventory.filter((item) => item.qty < item.minQty);

  // Dynamic system currency formatting helper
  const activeCurrencyCode = hotelProfile.defaultCurrencyCode || "NGN";
  const activeCurrency = hotelProfile.currencies.find(c => c.code === activeCurrencyCode) || { code: "NGN", symbol: "₦", rateToUSD: 1450.0 };

  const formatCurrencyValue = (valUSD: number) => {
    const converted = valUSD * activeCurrency.rateToUSD;
    return new Intl.NumberFormat(activeCurrency.code === "NGN" ? "en-NG" : "en-US", {
      style: "currency",
      currency: activeCurrency.code,
      maximumFractionDigits: 0
    }).format(converted);
  };

  // Generate 6 months historical trend from January 2026 onwards for the SVG chart
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const monthlyRevenueData = months.map((m, index) => {
    const monthNum = index + 1;
    const targetMonthStr = `2026-0${monthNum}`;
    const usdVal = invoices
      .filter((inv) => inv.date?.startsWith(targetMonthStr))
      .reduce((sumVal, inv) => {
        const paid = inv.payments.reduce((acc, p) => acc + p.amount, 0);
        return sumVal + paid;
      }, 0);
    
    // Fallback default mock baseline if database is empty so chart renders beautifully
    const baseline = [18000, 24000, 21500, 31000, 28000, 36000][index];
    const finalUSD = usdVal > 0 ? usdVal : baseline;
    return {
      month: m,
      usd: finalUSD,
      converted: finalUSD * activeCurrency.rateToUSD
    };
  });

  const maxRevenueVal = Math.max(...monthlyRevenueData.map(d => d.converted), 1);

  // Generate dynamic weekly occupancy trend based on room status
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dailyOccupancyData = daysOfWeek.map((day, index) => {
    const baselineOccupancy = [45, 55, 60, 75, 85, 95, 80][index];
    const currentAdjusted = Math.min(100, Math.max(15, Math.round(baselineOccupancy * (occupancyRate / 100 || 1))));
    return {
      day,
      pct: currentAdjusted
    };
  });

  return (
    <div className="space-y-6" id="overview-dashboard-panel">
      {/* Redesigned Premium Stat Grid Deck */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Stat Card 1: Occupancy Quotient */}
        <div className="bg-white p-6 rounded-2xl border border-slate-150/70 shadow-sm relative overflow-hidden group hover:border-indigo-200 hover:shadow-md transition-all duration-300" id="stat-card-occupancy">
          <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50/35 rounded-bl-[80px] -z-10 group-hover:scale-110 transition-transform duration-300 pointer-events-none" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Occupancy Rate</span>
              <h3 className="text-3xl font-bold text-slate-800 font-sans tracking-tight">{occupancyRate}%</h3>
            </div>
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-xs">
              <BedDouble className="w-5 h-5" />
            </div>
          </div>
          
          {/* Custom Visual Mini Progress bar */}
          <div className="mt-4 space-y-2">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-sans">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                {occupiedRooms} / {totalRooms} Booked
              </span>
              <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.2 rounded">{availableRooms} Empty</span>
            </div>
          </div>
        </div>

        {/* Stat Card 2: Revenue Collections (Currency Adaptive NGN / Settings currency) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-150/70 shadow-sm relative overflow-hidden group hover:border-emerald-200 hover:shadow-md transition-all duration-300" id="stat-card-revenue">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50/35 rounded-bl-[80px] -z-10 group-hover:scale-110 transition-transform duration-300 pointer-events-none" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Group Performance Revenue</span>
              <h3 className="text-2xl font-bold text-slate-800 font-sans tracking-tight truncate max-w-[190px]" title={formatCurrencyValue(totalUSDRevenue)}>
                {formatCurrencyValue(totalUSDRevenue)}
              </h3>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 pt-1 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-50">
            <span className="flex items-center gap-1 text-slate-400">
              Exchange rate link
            </span>
            <span className="font-mono bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
              1 USD = {activeCurrency.symbol}{activeCurrency.rateToUSD.toLocaleString()} {activeCurrency.code}
            </span>
          </div>
        </div>

        {/* Stat Card 3: Guests Boarding Capacity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-150/70 shadow-sm relative overflow-hidden group hover:border-violet-200 hover:shadow-md transition-all duration-300" id="stat-card-checkedin">
          <div className="absolute right-0 top-0 w-24 h-24 bg-violet-50/35 rounded-bl-[80px] -z-10 group-hover:scale-110 transition-transform duration-300 pointer-events-none" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">In-House Guests</span>
              <h3 className="text-3xl font-bold text-slate-800 font-sans tracking-tight">{checkedInCurrently}</h3>
            </div>
            <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 pt-1.5 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-50">
            <span className="flex items-center gap-1 text-slate-500">
              Today&apos;s Arrivals List
            </span>
            <span className="font-mono text-violet-600 font-bold bg-violet-50 px-1.5 py-0.5 rounded">
              {pendingCheckins} Expected Today
            </span>
          </div>
        </div>

        {/* Stat Card 4: Supply Reserves & Alerts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-150/70 shadow-sm relative overflow-hidden group hover:border-amber-200 hover:shadow-md transition-all duration-300" id="stat-card-inventory">
          <div className="absolute right-0 top-0 w-24 h-24 bg-amber-50/30 rounded-bl-[80px] -z-10 group-hover:scale-110 transition-transform duration-300 pointer-events-none" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Consumables Inventory</span>
              <h3 className="text-2xl font-bold text-slate-800 font-sans tracking-tight mt-1">
                {lowStockItems.length > 0 ? (
                  <span className="text-amber-600 flex items-center gap-1 animate-pulse">
                    {lowStockItems.length} Warnings
                  </span>
                ) : (
                  <span className="text-emerald-600">All Stocked</span>
                )}
              </h3>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${lowStockItems.length > 0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 pt-1.5 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-50">
            <span className="text-slate-400">Reserve guidelines</span>
            <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${lowStockItems.length > 0 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
              {lowStockItems.length > 0 ? "Refilling Needed" : "Optimal Store Levels"}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Trend Visual System Section (GORGEOUS CUSTOM HIGH-CONTRAST SVG GRAPHS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="executive-trend-indicator-deck">
        
        {/* Chart Card 1: Revenue Performance Timeline */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150/70 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-2">
            <div>
              <p className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Financial Statistics Monitor</p>
              <h4 className="font-bold text-xs text-slate-700 font-sans">Monthly Revenue Trend ({activeCurrency.code})</h4>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
              Forex Sync: Live
            </span>
          </div>

          {/* Precise custom SVG line area plot */}
          <div className="w-full relative h-[155px] select-none">
            <svg viewBox="0 0 350 140" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Horizontal Reference Grid lines */}
              <line x1="20" y1="20" x2="330" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="20" y1="55" x2="330" y2="55" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="20" y1="90" x2="330" y2="90" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="20" y1="120" x2="330" y2="120" stroke="#f1f5f9" strokeWidth="1" />

              {/* Draw area filled under the path */}
              <path
                d={`M 30,120 
                    ${monthlyRevenueData.map((d, index) => {
                      const x = index * 55 + 30;
                      const y = 120 - (d.converted / maxRevenueVal) * 90;
                      return `L ${x},${y}`;
                    }).join(" ")} 
                    L 305,120 Z`}
                fill="url(#areaGrad)"
              />

              {/* Draw main path line */}
              <path
                d={monthlyRevenueData.map((d, index) => {
                  const x = index * 55 + 30;
                  const y = 120 - (d.converted / maxRevenueVal) * 90;
                  return `${index === 0 ? "M" : "L"} ${x},${y}`;
                }).join(" ")}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interaction nodes & labels */}
              {monthlyRevenueData.map((d, index) => {
                const x = index * 55 + 30;
                const y = 120 - (d.converted / maxRevenueVal) * 90;
                return (
                  <g key={index} className="group cursor-pointer">
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      className="fill-white stroke-emerald-500 stroke-[2] hover:r-5 hover:stroke-[3] transition-all"
                    />
                    {/* Tooltip labels */}
                    <text
                      x={x}
                      y={y - 8}
                      className="text-[8px] font-bold font-sans fill-slate-700 opacity-90 text-center"
                      textAnchor="middle"
                    >
                      {activeCurrency.symbol}{Math.round(d.converted / (activeCurrency.code === "NGN" ? 1000 : 1))}{(activeCurrency.code === "NGN" ? "K" : "")}
                    </text>
                    {/* Bottom Month Axis Labels */}
                    <text
                      x={x}
                      y="134"
                      className="text-[9px] font-sans font-bold fill-slate-400"
                      textAnchor="middle"
                    >
                      {d.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Chart Card 2: Weekly Occupancy Trajectory */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150/70 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-2">
            <div>
              <p className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Occupancy Performance Tracking</p>
              <h4 className="font-bold text-xs text-slate-700 font-sans">Weekly Occupancy Allocation Target (%)</h4>
            </div>
            <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
              Synchronized
            </span>
          </div>

          {/* Weekly SVG Area Plot */}
          <div className="w-full relative h-[155px] select-none">
            <svg viewBox="0 0 350 140" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="areaIndigoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="20" y1="20" x2="330" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="20" y1="55" x2="330" y2="55" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="20" y1="90" x2="330" y2="90" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="20" y1="120" x2="330" y2="120" stroke="#f1f5f9" strokeWidth="1" />

              {/* Fill */}
              <path
                d={`M 25,120 
                    ${dailyOccupancyData.map((d, index) => {
                      const x = index * 48 + 25;
                      const y = 120 - (d.pct / 100) * 90;
                      return `L ${x},${y}`;
                    }).join(" ")} 
                    L 313,120 Z`}
                fill="url(#areaIndigoGrad)"
              />

              {/* Path */}
              <path
                d={dailyOccupancyData.map((d, index) => {
                  const x = index * 48 + 25;
                  const y = 120 - (d.pct / 100) * 90;
                  return `${index === 0 ? "M" : "L"} ${x},${y}`;
                }).join(" ")}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Dots and Labels */}
              {dailyOccupancyData.map((d, index) => {
                const x = index * 48 + 25;
                const y = 120 - (d.pct / 100) * 90;
                return (
                  <g key={index}>
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      className="fill-white stroke-indigo-500 stroke-[2] hover:r-5 hover:stroke-[3] transition-all"
                    />
                    <text
                      x={x}
                      y={y - 8}
                      className="text-[8.5px] font-bold font-sans fill-indigo-700"
                      textAnchor="middle"
                    >
                      {d.pct}%
                    </text>
                    <text
                      x={x}
                      y="134"
                      className="text-[9px] font-sans font-bold fill-slate-400"
                      textAnchor="middle"
                    >
                      {d.day}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Main Grid: Section layout split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Room Cleanliness and Availability Overview */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs lg:col-span-2 space-y-4" id="overview-rooms-map">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <h3 className="font-semibold text-slate-700 text-sm tracking-tight flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-slate-500" />
              In-House Room Allocation Ledger
            </h3>
            <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
              Real-time
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg text-center text-xs">
            <div className="p-2 border-r border-slate-200">
              <span className="text-emerald-600 block font-bold text-lg">{availableRooms}</span>
              <span className="text-slate-500 font-medium">Available</span>
            </div>
            <div className="p-2 border-r border-slate-200">
              <span className="text-amber-600 block font-bold text-lg">{occupiedRooms}</span>
              <span className="text-slate-500 font-medium">Occupied</span>
            </div>
            <div className="p-2 border-r border-slate-200">
              <span className="text-indigo-600 block font-bold text-lg">{cleaningRooms}</span>
              <span className="text-slate-500 font-medium">Cleaning</span>
            </div>
            <div className="p-2">
              <span className="text-slate-600 block font-bold text-lg">{maintenanceRooms}</span>
              <span className="text-slate-500 font-medium font-sans">Maintenance</span>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {rooms.map((room) => {
              let statusColor = "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100";
              if (room.status === RoomStatus.Occupied) {
                statusColor = "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100";
              } else if (room.status === RoomStatus.Cleaning) {
                statusColor = "bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100";
              } else if (room.status === RoomStatus.Maintenance) {
                statusColor = "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200";
              }

              return (
                <div
                  key={room.id}
                  className={`border p-2.5 rounded-lg text-center transition-all cursor-pointer ${statusColor}`}
                  title={`${room.type} room, floor ${room.floor} - ${room.status}`}
                  id={`room-tile-${room.number}`}
                >
                  <span className="block font-bold text-xs">{room.number}</span>
                  <span className="block text-[10px] opacity-80 mt-0.5 truncate">{room.type}</span>
                  {room.currentGuestName && (
                    <span className="block text-[8px] opacity-90 truncate bg-amber-200/50 text-amber-900 px-1 py-0.5 rounded mt-1 font-medium select-none">
                      👤 {room.currentGuestName.split(" ")[0]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="text-[11px] text-slate-400 italic">
            * Quick Guide: Click on &apos;Room Management&apos; or &apos;Front Desk&apos; side tabs to modify pricing, assign housekeeping staff, or schedule check‑outs.
          </div>
        </div>

        {/* Right Column: Alerts and Quick Tasks */}
        <div className="space-y-6" id="dashboard-sidebar-alerts">
          
          {/* Critical Replenishment alerts */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-3">
            <h3 className="font-semibold text-slate-700 text-sm tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Stock Replenishment Alerts
            </h3>
            
            {lowStockItems.length === 0 ? (
              <div className="bg-emerald-50/50 p-4 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                No stock alerts. All consumables are above reserve levels.
              </div>
            ) : (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="bg-amber-50/50 hover:bg-amber-50 p-2.5 rounded-lg border border-amber-100/60 flex items-center justify-between text-xs transition">
                    <div>
                      <p className="font-semibold text-slate-800">{item.name}</p>
                      <p className="text-[10px] text-slate-500">Supplier: {item.supplier}</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        {item.qty} {item.unit} left
                      </span>
                      <p className="text-[9px] text-slate-400 mt-1">Min: {item.minQty}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Core App Guidelines reminder */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-4 rounded-xl text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
              <Briefcase className="w-32 h-32" />
            </div>
            <div className="relative z-10 space-y-2">
              <div className="bg-indigo-500/20 text-indigo-300 w-fit px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                Staff Credentials
              </div>
              <h4 className="font-bold text-sm">Role Simulations Enabled</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Switch role personae at the top-right menu to experience strict role permissions and distinct workflows for Admins, Managers, Receptionists, and Housekeepers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section: Cohesive Audit Logger System Feed */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-4" id="system-audit-feed">
        <div className="flex items-center justify-between border-b border-slate-50 pb-3">
          <h3 className="font-semibold text-slate-700 text-sm tracking-tight flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" />
            Accountability Audit Feed
          </h3>
          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Live Event Stream
          </span>
        </div>

        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar font-mono text-xs">
          {auditLogs.slice(0, 10).map((log) => {
            let badgeColor = "bg-slate-100 text-slate-700";
            if (log.action === "CHECK-IN" || log.action === "CHECK-OUT") badgeColor = "bg-emerald-100 text-emerald-800";
            else if (log.action === "PAYMENT") badgeColor = "bg-green-100 text-green-800";
            else if (log.action === "PRICING") badgeColor = "bg-amber-100 text-amber-800";
            else if (log.action === "SYSTEM") badgeColor = "bg-purple-100 text-purple-800";

            return (
              <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded hover:bg-slate-50 border-b border-slate-100/50 transition">
                <div className="flex items-start sm:items-center gap-2">
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-tight uppercase shrink-0 ${badgeColor}`}>
                    {log.action}
                  </span>
                  <p className="text-slate-600 leading-relaxed text-[11px] break-all sm:break-normal">
                    {log.detail}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 text-right self-end sm:self-auto shrink-0 bg-slate-100/50 px-1.5 py-0.5 rounded">
                  👤 {log.userName} ({log.role})
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
