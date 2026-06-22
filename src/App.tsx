/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { HMSProvider, useHMS } from "./context/HMSContext";
import { StaffRole, RoomStatus, ReservationStatus } from "./types";

// Core views
import { OverviewDashboard } from "./components/OverviewDashboard";
import { ReservationModule } from "./components/ReservationModule";
import { ReceptionModule } from "./components/ReceptionModule";
import { RoomModule } from "./components/RoomModule";
import { CRMModule } from "./components/CRMModule";
import { BillingModule } from "./components/BillingModule";
import { ServicesModule } from "./components/ServicesModule";
import { InventoryModule } from "./components/InventoryModule";
import { StaffModule } from "./components/StaffModule";
import { ReportsModule } from "./components/ReportsModule";
import { SettingsModule } from "./components/SettingsModule";
import { OmniSearchInspector } from "./components/OmniSearchInspector";

import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  CalendarDays,
  UserCheck,
  BedDouble,
  Users,
  FileSpreadsheet,
  Zap,
  Boxes,
  Contact2,
  BarChart3,
  Sliders,
  Building,
  Bell,
  Clock,
  LogOut,
  User,
  ShieldAlert,
  ArrowRight,
  Search,
  X
} from "lucide-react";

const MainHMSWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("overview");

  const {
    hotelProfile,
    activeBranchId,
    activeRole,
    staff,
    activeStaffId,
    rooms,
    reservations,
    inventory,
    guests,
    setActiveRole,
    setActiveStaffId
  } = useHMS();

  // Search Input and results interactive overlay states
  const [globalQuery, setGlobalQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<{
    type: "guest" | "reservation" | "room";
    id: string;
  } | null>(null);

  const query = globalQuery.trim().toLowerCase();

  const matchedGuests = query
    ? guests.filter((g) =>
        `${g.firstName} ${g.lastName}`.toLowerCase().includes(query) ||
        g.email.toLowerCase().includes(query) ||
        g.phone.includes(query) ||
        g.id.toLowerCase().includes(query)
      )
    : [];

  const matchedReservations = query
    ? reservations.filter((r) =>
        r.id.toLowerCase().includes(query) ||
        r.guestName.toLowerCase().includes(query) ||
        r.roomNumber.includes(query) ||
        (r.notes && r.notes.toLowerCase().includes(query))
      )
    : [];

  const matchedRooms = query
    ? rooms.filter((r) =>
        r.number.includes(query) ||
        r.type.toLowerCase().includes(query) ||
        r.status.toLowerCase().includes(query) ||
        r.features.some((f) => f.toLowerCase().includes(query))
      )
    : [];

  // Active Branch details mapping
  const branchObj = hotelProfile.branches.find((b) => b.id === activeBranchId) || hotelProfile.branches[0];
  const activeOperator = staff.find((s) => s.id === activeStaffId) || staff[0];

  // Global counts for badges
  const totalOccupied = rooms.filter((r) => r.status === RoomStatus.Occupied).length;
  const arrivalsCount = reservations.filter((r) => r.status === ReservationStatus.Confirmed).length;
  const lowStockCount = inventory.filter((item) => item.qty < item.minQty).length;

  // Render correct module conditional block
  const renderActiveModule = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewDashboard />;
      case "reservations":
        return <ReservationModule />;
      case "reception":
        return <ReceptionModule />;
      case "rooms":
        return <RoomModule />;
      case "crm":
        return <CRMModule />;
      case "billing":
        return <BillingModule />;
      case "services":
        return <ServicesModule />;
      case "inventory":
        return <InventoryModule />;
      case "staff":
        return <StaffModule />;
      case "reports":
        return <ReportsModule />;
      case "settings":
        return <SettingsModule />;
      default:
        return <OverviewDashboard />;
    }
  };

  // Nav items list
  const NAV_ITEMS = [
    { id: "overview", label: "Executive Dashboard", icon: LayoutDashboard, badge: null },
    { id: "reservations", label: "Reservations", icon: CalendarDays, badge: null },
    { id: "reception", label: "Front Desk", icon: UserCheck, badge: arrivalsCount > 0 ? arrivalsCount : null },
    { id: "rooms", label: "Rooms & Rota", icon: BedDouble, badge: null },
    { id: "crm", label: "CRM Ledger", icon: Users, badge: null },
    { id: "billing", label: "Payments", icon: FileSpreadsheet, badge: null },
    { id: "services", label: "Amenities", icon: Zap, badge: null },
    { id: "inventory", label: "Inventory", icon: Boxes, badge: lowStockCount > 0 ? lowStockCount : null, alert: true },
    { id: "staff", label: "Staff & Access", icon: Contact2, badge: null },
    { id: "reports", label: "Reports & CSV", icon: BarChart3, badge: null },
    { id: "settings", label: "Settings", icon: Sliders, badge: null }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="omnisuite-app-frame">
      
      {/* Upper Main Branded Bar */}
      <header className="bg-white border-b border-slate-150 h-16 shrink-0 flex items-center justify-between px-6 z-10 sticky top-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg flex items-center justify-center text-white font-extrabold text-sm tracking-widest font-mono">
            🏨 OMNI
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-sm text-slate-800 tracking-tight">{hotelProfile.name}</h1>
              <span className="bg-indigo-50 text-indigo-805 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1">
                <Building className="w-3 h-3 text-indigo-500" />
                {branchObj.name} Branch
              </span>
            </div>
            <p className="text-[10px] text-slate-450 leading-none mt-0.5">{branchObj.address}, {branchObj.city}</p>
          </div>
        </div>

        {/* Global OmniSearch Input field */}
        <div className="flex-grow max-w-[280px] xl:max-w-md mx-6 relative" id="header-global-search-container">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              className="w-full text-2xs bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-indigo-505 rounded-xl pl-9 pr-8 py-2 focus:outline-hidden transition-all text-slate-850 placeholder:text-slate-400 font-medium"
              placeholder="Search guest, room or reservation ID..."
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              id="header-global-search-input"
            />
            {globalQuery && (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                onMouseDown={() => setGlobalQuery("")}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Floater search results */}
          {isSearchFocused && globalQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-96 overflow-y-auto p-2 space-y-3">
              {matchedReservations.length === 0 && matchedGuests.length === 0 && matchedRooms.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No matches found for &ldquo;<span className="text-slate-600 font-semibold">{globalQuery}</span>&rdquo;
                </div>
              ) : (
                <>
                  {/* RESERVATIONS SECTION */}
                  {matchedReservations.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center justify-between">
                        <span>Reservations ({matchedReservations.length})</span>
                        <CalendarDays className="w-3 h-3 text-slate-400" />
                      </div>
                      <div className="space-y-0.5">
                        {matchedReservations.map((res) => (
                          <button
                            key={res.id}
                            type="button"
                            onMouseDown={() => {
                              setSelectedEntity({ type: "reservation", id: res.id });
                              setIsSearchFocused(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-50 transition flex items-center justify-between text-xs cursor-pointer"
                          >
                            <div className="truncate">
                              <span className="font-extrabold text-slate-805 block truncate">{res.guestName}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                #{res.id} &bull; Room {res.roomNumber} ({res.roomType})
                              </span>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${
                              res.status === "Confirmed" ? "bg-indigo-50 text-indigo-700" :
                              res.status === "CheckedIn" ? "bg-amber-50 text-amber-850" :
                              res.status === "CheckedOut" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-500"
                            }`}>
                              {res.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* GUESTS SECTION */}
                  {matchedGuests.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center justify-between">
                        <span>Guests ({matchedGuests.length})</span>
                        <User className="w-3 h-3 text-slate-400" />
                      </div>
                      <div className="space-y-0.5">
                        {matchedGuests.map((gst) => (
                          <button
                            key={gst.id}
                            type="button"
                            onMouseDown={() => {
                              setSelectedEntity({ type: "guest", id: gst.id });
                              setIsSearchFocused(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-50 transition flex items-center justify-between text-xs cursor-pointer"
                          >
                            <div className="truncate">
                              <span className="font-extrabold text-slate-850 block truncate">{gst.firstName} {gst.lastName}</span>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {gst.email} &bull; {gst.phone}
                              </span>
                            </div>
                            <span className="bg-indigo-55 text-indigo-700 border border-indigo-100 text-[9px] font-black px-1.5 py-0.2 rounded font-mono shrink-0">
                              {gst.loyaltyTier}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ROOMS SECTION */}
                  {matchedRooms.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center justify-between">
                        <span>Rooms ({matchedRooms.length})</span>
                        <BedDouble className="w-3 h-3 text-slate-400" />
                      </div>
                      <div className="space-y-0.5">
                        {matchedRooms.map((rm) => (
                          <button
                            key={rm.id}
                            type="button"
                            onMouseDown={() => {
                              setSelectedEntity({ type: "room", id: rm.id });
                              setIsSearchFocused(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-50 transition flex items-center justify-between text-xs cursor-pointer"
                          >
                            <div className="truncate">
                              <span className="font-extrabold text-slate-805 block truncate">Room {rm.number} &mdash; {rm.type}</span>
                              <span className="text-[10px] text-slate-400 block">
                                Floor {rm.floor} &bull; ${rm.baseRate}/night
                              </span>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${
                              rm.status === "Available" ? "bg-emerald-50 text-emerald-800" :
                              rm.status === "Occupied" ? "bg-amber-50 text-amber-800" :
                              rm.status === "Cleaning" ? "bg-sky-50 text-sky-700" : "bg-red-50 text-red-700"
                            }`}>
                              {rm.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Dynamic tickers & user controls */}
        <div className="flex items-center gap-4 text-xs font-sans">
          
          {/* Quick Info tickers */}
          <div className="hidden lg:flex items-center gap-3 border-r border-slate-200 pr-4">
            <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              SIM TIME: <strong className="text-slate-800">2026-06-21 UTC</strong>
            </span>

            <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              Occupancy: <strong className="text-indigo-700">{totalOccupied} Occupied</strong>
            </span>
          </div>

          {/* Quick Active Operator badge display */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-xl">
            <span className="text-lg filter drop-shadow-xs select-none">{activeOperator.avatar}</span>
            <div className="text-left leading-tight">
              <span className="font-bold text-slate-800 block text-[10.5px]">{activeOperator.name}</span>
              <span className="text-[9px] text-slate-450 font-semibold uppercase tracking-wider block font-mono">
                🛡️ {activeRole} Key Approved
              </span>
            </div>

            {/* Quick drop down shortcut from top bar */}
            <select
              className="text-[9px] font-bold bg-transparent border-none text-slate-505 focus:outline-hidden hover:text-slate-800"
              value={activeRole}
              onChange={(e) => {
                const role = e.target.value as StaffRole;
                setActiveRole(role);
                const matchedS = staff.find(s => s.role === role);
                if (matchedS) setActiveStaffId(matchedS.id);
              }}
              id="topbar-fast-role-swapper"
            >
              <option value={StaffRole.Admin}>Admin</option>
              <option value={StaffRole.Manager}>Manager</option>
              <option value={StaffRole.Receptionist}>Clerk</option>
              <option value={StaffRole.Housekeeping}>Crews</option>
              <option value={StaffRole.Accountant}>Auditor</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Structural row: Sidebar + Stage */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Navigation Sidebar */}
        <aside className="w-[230px] bg-slate-900 border-r border-slate-950 text-slate-350 flex flex-col shrink-0 justify-between select-none">
          
          {/* Menu links list */}
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[80vh]" id="sidebar-nav-menu">
            {NAV_ITEMS.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white font-bold"
                      : "hover:bg-slate-800 text-slate-300 hover:text-white"
                  }`}
                  onClick={() => setActiveTab(item.id)}
                  id={`nav-link-${item.id}`}
                >
                  <span className="flex items-center gap-2.5">
                    <IconComp className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                    {item.label}
                  </span>

                  {/* Warning / Alerts Badges */}
                  {item.badge !== null && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full font-mono ${
                        item.alert
                          ? "bg-red-500 text-white animate-pulse"
                          : "bg-indigo-400 text-white"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer of Sidebar */}
          <div className="p-4 bg-slate-950 border-t border-slate-900 text-[10px] text-slate-400 font-sans space-y-2">
            <div className="flex items-center gap-1 text-[9px] text-slate-500 uppercase tracking-wider font-bold">
              <Zap className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              OmniSuite Core v9.2
            </div>
            <p className="leading-normal">Connected via Local Sandbox persistent node. Multi-branch state is active.</p>
          </div>
        </aside>

        {/* Central Dynamic Stage with Motion wrapping */}
        <main className="flex-grow overflow-y-auto p-6 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="h-full"
            >
              {renderActiveModule()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global OmniSearch details inspection modal */}
      {selectedEntity && (
        <OmniSearchInspector
          entity={selectedEntity}
          onClose={() => setSelectedEntity(null)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <HMSProvider>
      <MainHMSWorkspace />
    </HMSProvider>
  );
}
