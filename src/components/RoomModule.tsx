/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useHMS } from "../context/HMSContext";
import { RoomType, RoomStatus, Room, StaffRole } from "../types";
import {
  Bed,
  Settings,
  AlertTriangle,
  Brush,
  DollarSign,
  Plus,
  RefreshCw,
  Clock,
  Briefcase
} from "lucide-react";

export const RoomModule: React.FC = () => {
  const {
    rooms,
    staff,
    updateRoomStatus,
    updateRoomHousekeeper,
    updateRoomPricing,
    activeRole
  } = useHMS();

  // Selected filter states
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Selected Room for details configuration
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Pricing edit state values
  const [editBaseRate, setEditBaseRate] = useState<number>(100);
  const [editModifier, setEditModifier] = useState<number>(1.0);

  // Housekeeper filter
  const housekeepers = staff.filter((s) => s.role === StaffRole.Housekeeping);

  // Filter calculations
  const filteredRooms = rooms.filter((r) => {
    const matchesType = typeFilter === "ALL" || r.type === typeFilter;
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesType && matchesStatus;
  });

  // Save Pricing configurations
  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    updateRoomPricing(selectedRoom.id, editBaseRate, editModifier);
    setSelectedRoom(null);
  };

  return (
    <div className="space-y-6" id="room-module-panel">
      {/* Dynamic pricing controls header card */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-700 text-sm tracking-tight flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-slate-500" />
            Dynamic Rates &amp; Cleanliness Dispatch Board
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Manipulate base tariffs across room types, trigger peak surge modifiers (holiday surges), assign housekeepers, and toggle engineering lockouts.
          </p>
        </div>

        {/* Global stats indicators summary */}
        <div className="flex gap-4 self-stretch md:self-auto text-xs border border-slate-100 bg-slate-50 p-2.5 rounded-lg font-medium">
          <span className="text-slate-650">Total inventory capacity: <strong>{rooms.length} units</strong></span>
          <span className="text-slate-200">|</span>
          <span className="text-slate-650">Awaiting Service: <strong className="text-indigo-600 font-sans">{rooms.filter(r => r.status === RoomStatus.Cleaning).length} units</strong></span>
        </div>
      </div>

      {/* Selector Filters & Core Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Room grid view */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider font-sans">Filters:</span>
              
              <select
                className="text-xs border border-slate-200 rounded-lg p-1.5 bg-slate-50 text-slate-700 focus:outline-hidden"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                id="rooms-type-filter-select"
              >
                <option value="ALL">All Room Classes</option>
                <option value={RoomType.Standard}>Standard Class</option>
                <option value={RoomType.Deluxe}>Deluxe Class</option>
                <option value={RoomType.Suite}>Penthouse Suite</option>
                <option value={RoomType.Executive}>VIP Executive Suite</option>
              </select>

              <select
                className="text-xs border border-slate-200 rounded-lg p-1.5 bg-slate-50 text-slate-700 focus:outline-hidden"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                id="rooms-status-filter-select"
              >
                <option value="ALL">All Status Types</option>
                <option value={RoomStatus.Available}>Available Only</option>
                <option value={RoomStatus.Occupied}>Occupied Only</option>
                <option value={RoomStatus.Cleaning}>Awaiting Housekeeping</option>
                <option value={RoomStatus.Maintenance}>Out of Service</option>
              </select>
            </div>

            <span className="text-xs text-slate-400 font-medium">
              Showing {filteredRooms.length} of {rooms.length} rooms
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredRooms.map((room) => {
              const estRateUSD = room.baseRate * room.dynamicModifier;
              const assignedHkName = room.housekeeperId
                ? staff.find((s) => s.id === room.housekeeperId)?.name
                : "Unassigned";

              let statusClasses = "border-emerald-100 bg-emerald-50 text-emerald-800";
              let badgeDot = "bg-emerald-500 animate-pulse";
              if (room.status === RoomStatus.Occupied) {
                statusClasses = "border-amber-100 bg-amber-50 text-amber-800";
                badgeDot = "bg-amber-500";
              } else if (room.status === RoomStatus.Cleaning) {
                statusClasses = "border-indigo-100 bg-indigo-50 text-indigo-800";
                badgeDot = "bg-indigo-500";
              } else if (room.status === RoomStatus.Maintenance) {
                statusClasses = "border-slate-100 bg-slate-100 text-slate-700";
                badgeDot = "bg-slate-400";
              }

              return (
                <div
                  key={room.id}
                  className="bg-white rounded-xl border border-slate-150 p-4 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                  onClick={() => {
                    setSelectedRoom(room);
                    setEditBaseRate(room.baseRate);
                    setEditModifier(room.dynamicModifier);
                  }}
                  id={`room-card-unit-${room.number}`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">Room {room.number}</span>
                        <span className="text-[10px] text-slate-400 font-medium tracking-tight bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-sans">Floor {room.floor}</span>
                      </div>

                      <div className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border ${statusClasses}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${badgeDot}`}></span>
                        {room.status}
                      </div>
                    </div>

                    {/* Features list */}
                    <div className="flex flex-wrap gap-1">
                      {room.features.slice(0, 3).map((f) => (
                        <span key={f} className="text-[9px] bg-slate-50/85 text-slate-500 px-1.5 py-0.5 rounded-sm">
                          {f}
                        </span>
                      ))}
                    </div>

                    {/* Rates & Cleaning assignments detail */}
                    <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-xs text-slate-550 leading-relaxed font-sans">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Dynamic Rate</span>
                        <span className="font-bold text-slate-800 text-[13px]">${estRateUSD.toFixed(0)} <span className="text-[9px] font-normal text-slate-400">/ night</span></span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Housekeeping Assignment</span>
                        <span className="font-semibold text-indigo-700 text-[11px] truncate block max-w-[120px]">
                          {room.status === RoomStatus.Cleaning ? (
                            <span className="text-indigo-600 block animate-pulse font-sans">🧹 {assignedHkName}</span>
                          ) : (
                            assignedHkName
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-2 border-t border-slate-50 flex items-center justify-between text-[10px] text-indigo-650 hover:underline">
                    <span>Pricing details &amp; logs</span>
                    <span className="text-slate-400">&rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side Column: Editor forms for Room detail */}
        <div className="space-y-6" id="room-editor-sidebar">
          
          {selectedRoom ? (
            <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-md space-y-4" id="room-detail-form">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <h4 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                  <Bed className="w-4 h-4 text-indigo-500" />
                  Room {selectedRoom.number} Settings
                </h4>
                <button
                  type="button"
                  className="text-xs text-slate-400 hover:text-slate-600 p-1 bg-slate-50 rounded"
                  onClick={() => setSelectedRoom(null)}
                >
                  Close
                </button>
              </div>

              {/* Status togglers info */}
              <div className="space-y-2">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Administrative Override Status</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className={`text-xs py-2 rounded-lg font-medium transition cursor-pointer ${selectedRoom.status === RoomStatus.Available ? "bg-emerald-50 border border-emerald-350 text-emerald-800 font-bold" : "bg-slate-50 text-slate-500 border border-slate-200"}`}
                    onClick={() => updateRoomStatus(selectedRoom.id, RoomStatus.Available)}
                  >
                    📂 Available
                  </button>
                  <button
                    className={`text-xs py-2 rounded-lg font-medium transition cursor-pointer ${selectedRoom.status === RoomStatus.Occupied ? "bg-amber-50 border border-amber-300 text-amber-800 font-bold" : "bg-slate-50 text-slate-500 border border-slate-200"}`}
                    onClick={() => {
                      if (activeRole !== StaffRole.Admin && activeRole !== StaffRole.Manager) {
                        alert("Permission denied. Only Administrators / Managers are authorised to execute physical override locks.");
                        return;
                      }
                      updateRoomStatus(selectedRoom.id, RoomStatus.Occupied);
                    }}
                  >
                    👤 Occupied
                  </button>
                  <button
                    className={`text-xs py-2 rounded-lg font-medium transition cursor-pointer ${selectedRoom.status === RoomStatus.Cleaning ? "bg-indigo-50 border border-indigo-250 text-indigo-800 font-bold block" : "bg-slate-50 text-slate-500 border border-slate-200"}`}
                    onClick={() => updateRoomStatus(selectedRoom.id, RoomStatus.Cleaning)}
                  >
                    🧹 Cleaning
                  </button>
                  <button
                    className={`text-xs py-2 rounded-lg font-medium transition cursor-pointer ${selectedRoom.status === RoomStatus.Maintenance ? "bg-slate-200 border border-slate-350 text-slate-800 font-bold" : "bg-slate-50 text-slate-500 border border-slate-200"}`}
                    onClick={() => updateRoomStatus(selectedRoom.id, RoomStatus.Maintenance)}
                  >
                    ⚙️ Maintenance
                  </button>
                </div>
              </div>

              {/* Housekeeper Scheduling Assignment */}
              <div className="space-y-2 pt-2 border-t border-slate-50">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest block">Housekeeper Team Dispatch</span>
                <select
                  className="text-xs text-slate-650 w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:border-indigo-500 focus:outline-hidden"
                  value={selectedRoom.housekeeperId || ""}
                  onChange={(e) => updateRoomHousekeeper(selectedRoom.id, e.target.value || undefined)}
                  id="clerk-housekeeper-assigner"
                >
                  <option value="">-- No Assigned Staff --</option>
                  {housekeepers.map((hk) => (
                    <option key={hk.id} value={hk.id}>
                      🧹 {hk.name} ({hk.status})
                    </option>
                  ))}
                </select>
                <p className="text-[9.5px] text-slate-400">
                  Select clean staff from database roster. Housekeeper list syncs directly with Module 8 staff roster tables.
                </p>
              </div>

              {/* Tariff settings form */}
              <form onSubmit={handleSavePricing} className="space-y-3 pt-2 border-t border-slate-50">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest block">Dynamic Tariff Modifiers</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500">Base rate (USD)</label>
                    <div className="relative">
                      <DollarSign className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="number"
                        min="50"
                        max="2000"
                        className="text-xs border border-slate-200 rounded-md pl-7 pr-1.5 py-1.5 w-full bg-white text-slate-700"
                        value={editBaseRate}
                        onChange={(e) => setEditBaseRate(Number(e.target.value))}
                        required
                        id="room-field-baserate"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500">Peak Modifier</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.5"
                      max="3.0"
                      className="text-xs border border-slate-200 rounded-md p-1.5 w-full bg-white text-slate-700"
                      value={editModifier}
                      onChange={(e) => setEditModifier(Number(e.target.value))}
                      required
                      id="room-field-modifier"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[10.5px] text-slate-550 leading-relaxed font-sans">
                  Current Final Tariff Estimate: <strong className="text-slate-800">${(editBaseRate * editModifier).toFixed(0)} USD</strong> /night.
                  (Weekend surges or promotional discounts apply)
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-xs font-semibold w-full transition"
                    id="btn-room-save-pricing"
                  >
                    Sync Rates
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl border border-slate-100/60 shadow-xs text-center py-16 space-y-3 font-sans">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                <Bed className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-700 text-sm">Room Settings Terminal</h4>
              <p className="text-xs text-slate-400 max-w-[200px] mx-auto">
                Select any Room Unit on the left grid map to perform quick actions: adjust dynamic modifier multipliers, configure engineering locks, or dispatch housekeeping clean sessions.
              </p>
            </div>
          )}

          {/* Quick instructions block */}
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-2 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Dynamic Pricing Surges Active</p>
              <p className="text-[10.5px] text-amber-700 mt-1 leading-normal font-sans">
                Peak pricing modifies Reservation and Billing rates dynamically. Setting the Peak modifier (e.g. 1.25x for summers/weekends) modifies future reservations instantly across all checkout folios.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
