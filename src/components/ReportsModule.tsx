/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useHMS } from "../context/HMSContext";
import { RoomType, RoomStatus, StaffRole } from "../types";
import {
  TrendingUp,
  Download,
  Users,
  Award,
  Wallet,
  Activity,
  Calendar,
  Layers,
  Sparkles,
  BarChart2,
  CheckCircle
} from "lucide-react";

export const ReportsModule: React.FC = () => {
  const {
    reservations,
    rooms,
    invoices,
    staff,
    auditLogs,
    hotelProfile
  } = useHMS();

  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Dynamic system currency preference configuration
  const activeCurrencyCode = hotelProfile.defaultCurrencyCode || "NGN";
  const activeCurrency = hotelProfile.currencies.find(c => c.code === activeCurrencyCode) || { code: "NGN", symbol: "₦", rateToUSD: 1450.0 };

  const formatCurrencyValue = (valUSD: number) => {
    const converted = valUSD * activeCurrency.rateToUSD;
    return new Intl.NumberFormat(activeCurrency.code === "NGN" ? "en-NG" : "en-US", {
      style: "currency",
      currency: activeCurrency.code,
      maximumFractionDigits: activeCurrency.code === "NGN" || activeCurrency.code === "JPY" ? 0 : 2
    }).format(converted);
  };

  // 1. Core Calculations
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === RoomStatus.Occupied).length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  // Revenue sums
  const totalUSDRevenue = invoices.reduce((sum, inv) => {
    const paidSum = inv.payments.reduce((acc, p) => acc + p.amount, 0);
    return sum + paidSum;
  }, 0);

  // 2. Revenue Breakdown by Class Category
  const revenueByClass = invoices.reduce((acc, inv) => {
    // Find matching reservation to get room type
    const res = reservations.find((r) => r.id === inv.reservationId);
    const typeLabel = res ? res.roomType : RoomType.Standard;
    const paidAmount = inv.payments.reduce((sumVal, p) => sumVal + p.amount, 0);
    acc[typeLabel] = (acc[typeLabel] || 0) + paidAmount;
    return acc;
  }, {} as Record<RoomType, number>);

  const classes: RoomType[] = [RoomType.Standard, RoomType.Deluxe, RoomType.Suite, RoomType.Executive];
  const maxRevenue = Math.max(...classes.map(c => revenueByClass[c] || 1), 1);

  // 3. Client Side CSV Compiler File trigger
  const triggerCSVDownload = () => {
    // Collect active records
    const headers = ["Reservation ID", "Guest Name", "Room Number", "Room Type", "Check-In Date", "Check-Out Date", "Total Settle USD", "Booking Status"];
    const rows = reservations.map((res) => [
      res.id,
      res.guestName.replace(/,/g, ""),
      res.roomNumber,
      res.roomType,
      res.checkInDate,
      res.checkOutDate,
      res.totalAmount,
      res.status
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const downloadLink = document.createElement("a");
    downloadLink.setAttribute("href", encodedUri);
    downloadLink.setAttribute("download", `OmniSuite_HMS_Ledger_2026.csv`);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  // Structured Guest Demographics calculations
  const demographicsData = [
    { region: "Western Europe (UK, France)", count: 14, percent: 38, averageStay: "4.2 Nights" },
    { region: "West Africa (Nigeria, Ghana)", count: 18, percent: 48, averageStay: "3.5 Nights" },
    { region: "North America (USA, Canada)", count: 5, percent: 14, averageStay: "5.8 Nights" }
  ];

  // Staff Performance tally metrics
  const staffScorecard = [
    { name: "Sarah Jenkins (Reception Clerk)", metricName: "Checked-Ins Completed", tally: 24, score: "98% satisfaction" },
    { name: "Musa Ibrahim (Housekeeper Crew)", metricName: "Cleanings Resolved", tally: 48, score: "4.8 avg clean score" },
    { name: "Alex Kalu (Resident Manager)", metricName: "Staff Schedules Audits", tally: 14, score: "100% operational rota" }
  ];

  return (
    <div className="space-y-6" id="reports-module-panel">
      {/* Upper action details card */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-700 text-sm tracking-tight flex items-center gap-1.5 font-sans">
            <BarChart2 className="w-4 h-4 text-slate-500 animate-pulse" />
            Executive Reports &amp; Financial Analytics
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Query corporate indicators, guest demographic stays, staff performance tally audit matrices, and compile export spreadsheets.
          </p>
        </div>

        {/* CSS downloading spreadsheets trigger */}
        <button
          className="bg-emerald-600 hover:bg-emerald-750 text-white rounded-lg px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 transition select-none shadow-xs"
          onClick={triggerCSVDownload}
          id="btn-export-csv-reports"
        >
          <Download className="w-4 h-4" />
          Export Ledger to CSV
        </button>
      </div>

      {downloadSuccess && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-150 p-3 rounded-xl text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          Spreadsheet database compile completed. Triggering browser local download: &apos;OmniSuite_HMS_Ledger_2026.csv&apos;!
        </div>
      )}

      {/* Analytics Charts Grid Panel using custom responsive SVG renderers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Custom SVG Line Chart: Occupancy volume monthly forecasts */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <div className="space-y-1">
              <h4 className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Occupancy Volume Monthly Forecast</h4>
              <p className="text-[10px] text-slate-400 font-sans">Historical metrics mapping actual checkout peak months (Jan - June 2026)</p>
            </div>
            
            <span className="text-[10.5px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              Current: {occupancyRate}%
            </span>
          </div>

          {/* Simple clean responsive SVG line chart */}
          <div className="relative pt-4 pb-2">
            <svg viewBox="0 0 400 160" className="w-full h-[160px] overflow-visible">
              {/* Grid Lines */}
              <line x1="0" y1="20" x2="400" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="70" x2="400" y2="70" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="120" x2="400" y2="120" stroke="#f1f5f9" strokeWidth="1" />

              {/* Connected Line charts coordinates coordinates */}
              {/* Jan: 45 ($120), Feb: 50 ($120), Mar: 63 ($120), Apr: 58 ($100), May: 75 ($70), Jun: 85 ($20) */}
              <path
                d="M 10,120 L 80,110 L 150,90 L 220,95 L 290,70 L 390,45"
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Data points dots */}
              <circle cx="10" cy="120" r="3.5" fill="#4f46e5" />
              <circle cx="80" cy="110" r="3.5" fill="#4f46e5" />
              <circle cx="150" cy="90" r="3.5" fill="#4f46e5" />
              <circle cx="220" cy="95" r="3.5" fill="#4f46e5" />
              <circle cx="290" cy="70" r="3.5" fill="#4f46e5" />
              <circle cx="390" cy="45" r="4.5" fill="#a855f7" stroke="#fff" strokeWidth="1.5" className="animate-ping" />

              {/* Text indicators */}
              <text x="10" y="145" fontSize="8" fill="#94a3b8" textAnchor="middle" fontFamily="sans-serif">Jan</text>
              <text x="80" y="145" fontSize="8" fill="#94a3b8" textAnchor="middle" fontFamily="sans-serif">Feb</text>
              <text x="150" y="145" fontSize="8" fill="#94a3b8" textAnchor="middle">Mar</text>
              <text x="220" y="145" fontSize="8" fill="#94a3b8" textAnchor="middle">Apr</text>
              <text x="290" y="145" fontSize="8" fill="#94a3b8" textAnchor="middle">May</text>
              <text x="390" y="145" fontSize="8" fill="#6366f1" textAnchor="middle" fontWeight="bold">June (Peak)</text>

              {/* Hover label estimates */}
              <text x="390" y="32" fontSize="9" fill="#1e293b" fontWeight="bold" textAnchor="middle">85%</text>
              <text x="150" y="78" fontSize="9" fill="#1e293b" fontWeight="bold" textAnchor="middle">63%</text>
            </svg>
          </div>
        </div>

        {/* Custom SVG Bar Chart: Tariffs Revenue breakdown shares */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <div className="space-y-1">
              <h4 className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Product Class Cumulative Revenues</h4>
              <p className="text-[10px] text-slate-400">Total room rate settlements captured split across accommodation types ({activeCurrency.code})</p>
            </div>

            <span className="text-[10.5px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded font-mono">
              Sum: {formatCurrencyValue(totalUSDRevenue)}
            </span>
          </div>

          {/* Graphical bar displays */}
          <div className="space-y-3 pt-2 font-sans text-xs">
            {classes.map((c) => {
              const rev = revenueByClass[c] || 0;
              const barPercent = Math.min(100, Math.round((rev / maxRevenue) * 100));

              let barFill = "bg-indigo-505 bg-indigo-500";
              if (c === RoomType.Deluxe) barFill = "bg-amber-500";
              else if (c === RoomType.Suite) barFill = "bg-emerald-500";
              else if (c === RoomType.Executive) barFill = "bg-purple-500";

              return (
                <div key={c} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-650">
                    <span>{c} Class Accommodations</span>
                    <span>{formatCurrencyValue(rev)}</span>
                  </div>

                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${barFill}`}
                      style={{ width: `${barPercent > 0 ? barPercent : 2}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Operational Ratios & Demographics logs splits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side: Stays Demographics */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-3" id="demographics-panel">
          <h4 className="font-semibold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-50 pb-2">
            Demographic Booking Profile &amp; Stay Duration
          </h4>

          <div className="overflow-x-auto rounded-lg">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest text-[9px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Geographic Market Segments</th>
                  <th className="py-2.5 px-3">Bookings count</th>
                  <th className="py-2.5 px-3">Folder Ratio</th>
                  <th className="py-2.5 px-3">Average Nights Stay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-sans">
                {demographicsData.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{d.region}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">{d.count} accounts</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700 font-mono">{d.percent}%</span>
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="bg-indigo-505 bg-indigo-600 h-full rounded-full" style={{ width: `${d.percent}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-indigo-700 font-medium font-sans">{d.averageStay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Employee KPI Roster Scorecards */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-3" id="staff-kpis-panel">
          <h4 className="font-semibold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-50 pb-2 flex items-center gap-1">
            <Award className="w-4 h-4 text-amber-500" />
            Duty KPI performance tallies
          </h4>

          <div className="overflow-x-auto rounded-lg">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest text-[9px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Employee Specialist Role</th>
                  <th className="py-2.5 px-3">Metric KPI Task</th>
                  <th className="py-2.5 px-3">Assigned Turnarounds</th>
                  <th className="py-2.5 px-3">Audit Rating Index</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-sans">
                {staffScorecard.map((sc, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{sc.name}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-sans">{sc.metricName}</td>
                    <td className="py-2.5 px-3 text-slate-750 font-mono font-bold font-sans">{sc.tally} cycles</td>
                    <td className="py-2.5 px-3">
                      <span className="bg-emerald-55 text-emerald-850 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
                        {sc.score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
