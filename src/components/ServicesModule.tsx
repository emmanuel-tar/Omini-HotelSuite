/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useHMS } from "../context/HMSContext";
import { ReservationStatus, ActivityService } from "../types";
import {
  Sparkles,
  Search,
  PlusSquare,
  CookingPot,
  Compass,
  Calendar,
  Check,
  X,
  Clock,
  User,
  Activity
} from "lucide-react";

export const ServicesModule: React.FC = () => {
  const {
    services,
    serviceBookings,
    packageBundles,
    reservations,
    bookService,
    updateServiceBookingStatus
  } = useHMS();

  // Dialog configurations
  const [showAddBooking, setShowAddBooking] = useState(false);
  const [activeResId, setActiveResId] = useState("");
  const [activeSrvId, setActiveSrvId] = useState("");
  const [actDate, setActDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [actTime, setActTime] = useState("10:00");
  const [actQty, setActQty] = useState(1);
  const [assignedTeamMember, setAssignedTeamMember] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Filter amenities catalog
  const filteredCatalog = services.filter((s) => {
    return categoryFilter === "ALL" || s.category === categoryFilter;
  });

  // Filter active check-in reservations to bind charges
  const checkInOnlyGuests = reservations.filter(
    (res) => res.status === ReservationStatus.CheckedIn
  );

  // Submit activity appointment booking
  const handleServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeResId) {
      alert("Choose an active In-house client to link the service charges folios.");
      return;
    }
    if (!activeSrvId) {
      alert("Please choose a service from the catalog.");
      return;
    }

    const matchedRes = reservations.find((r) => r.id === activeResId);
    const matchedSrv = services.find((s) => s.id === activeSrvId);

    if (!matchedRes || !matchedSrv) return;

    bookService({
      serviceId: matchedSrv.id,
      serviceName: matchedSrv.name,
      reservationId: matchedRes.id,
      guestName: matchedRes.guestName,
      date: actDate,
      time: actTime,
      quantity: actQty,
      totalCost: matchedSrv.rate * actQty,
      staffAssigned: assignedTeamMember || "House Specialist Core",
      status: "Pending"
    });

    setShowAddBooking(false);
    setActiveResId("");
    setActiveSrvId("");
    setAssignedTeamMember("");
  };

  return (
    <div className="space-y-6" id="services-module-panel">
      {/* Upper overview header */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-700 text-sm tracking-tight flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-slate-500 animate-pulse" />
            Hotel Amenities &amp; Activities Scheduling Center
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Manage premium wellness clubs, fine dining tours, and conference spaces. Book activities &amp; auto-sync extra charges into dynamic reservation checkout folios.
          </p>
        </div>

        {/* Global summary stats */}
        <div className="flex gap-4 self-stretch md:self-auto text-xs border border-slate-105 bg-slate-50 p-2.5 rounded-lg font-medium">
          <span className="text-slate-650">Current Services Catalog: <strong>{services.length} items</strong></span>
          <span className="text-slate-200">|</span>
          <span className="text-slate-650">Pending bookings today: <strong className="text-amber-600 font-sans">{serviceBookings.filter(b => b.status === "Pending").length} sessions</strong></span>
        </div>
      </div>

      {/* Grid: Split Catalog vs Booking Timeline logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Catalog layout */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
              <h4 className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Services Catalog</h4>
              
              {/* Categories selectors */}
              <div className="flex gap-1.5 overflow-x-auto">
                {["ALL", "Spa", "Gym", "Dining", "Tours", "Events"].map((cat) => (
                  <button
                    key={cat}
                    className={`text-[9.5px] px-2.5 py-1 rounded-full border transition font-bold ${categoryFilter === cat ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-600 border-slate-200"}`}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredCatalog.map((service) => {
                return (
                  <div key={service.id} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-150 p-4 rounded-xl flex items-start justify-between gap-2 transition">
                    <div className="space-y-1 mt-0">
                      <span className="bg-slate-200 text-slate-700 font-mono text-[7px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider leading-none">
                        {service.category}
                      </span>
                      <h5 className="font-bold text-slate-800 text-xs mt-1.5">{service.name}</h5>
                      <p className="text-[10px] text-slate-400 font-sans">Duration: {service.duration} &bull; Resource: {service.resourceName || "House Area"}</p>
                    </div>

                    <div className="text-right space-y-2 shrink-0">
                      <p className="font-sans font-extrabold text-slate-800 text-sm">${service.rate}</p>
                      
                      {/* Booking trigger shortcut */}
                      <button
                        className="bg-indigo-600 text-white px-2 py-1 rounded-md text-[9px] font-bold hover:bg-indigo-750 transition flex items-center gap-1.5"
                        onClick={() => {
                          setActiveSrvId(service.id);
                          setShowAddBooking(true);
                        }}
                        id={`btn-service-book-${service.id}`}
                      >
                        <PlusSquare className="w-3 h-3" /> Book
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Service Booking schedules */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-4" id="service-bookings-ledger">
            <h3 className="font-semibold text-slate-700 text-sm tracking-tight flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              Scheduled Activities Log ({serviceBookings.length})
            </h3>

            <div className="overflow-x-auto rounded-lg border border-slate-50">
              <table className="min-w-full text-xs text-left" id="service-bookings-table">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Receipt</th>
                    <th className="py-3 px-4">Guest Name</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Date &amp; Time</th>
                    <th className="py-3 px-4">Assigned Team</th>
                    <th className="py-3 px-4">Total Fee</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {serviceBookings.map((sb) => {
                    let sbStatus = "bg-amber-50 text-amber-800";
                    if (sb.status === "Completed") sbStatus = "bg-emerald-50 text-emerald-800";
                    else if (sb.status === "Cancelled") sbStatus = "bg-slate-100 text-slate-500";

                    return (
                      <tr key={sb.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-800">{sb.id}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{sb.guestName}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold block text-slate-705">{sb.serviceName}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">Folio: {sb.reservationId}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span>{sb.date}</span>
                          <span className="text-[10px] text-slate-400 block">{sb.time}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{sb.staffAssigned || "Therapist Team"}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">${sb.totalCost}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sbStatus}`}>
                            {sb.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {sb.status === "Pending" && (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2 py-1 rounded text-[10px] font-bold transition"
                                onClick={() => updateServiceBookingStatus(sb.id, "Completed")}
                                id={`btn-complete-service-${sb.id}`}
                              >
                                Complete
                              </button>
                              <button
                                className="bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded text-[10px] font-bold transition"
                                onClick={() => updateServiceBookingStatus(sb.id, "Cancelled")}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                          {sb.status === "Completed" && (
                            <span className="text-[10px] text-emerald-600 font-semibold select-none">Billed Settled</span>
                          )}
                          {sb.status === "Cancelled" && (
                            <span className="text-[10px] text-slate-400 italic">No Show</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side Columns: Combo promotions packages */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-4" id="package-deals-box">
            <h3 className="font-semibold text-slate-700 text-sm tracking-tight flex items-center gap-1.5">
              <CookingPot className="w-4 h-4 text-emerald-600" />
              Promotion Package Bundles
            </h3>

            <div className="space-y-3.5">
              {packageBundles.map((pkg) => (
                <div key={pkg.id} className="bg-indigo-50/20 hover:bg-indigo-50/50 border border-indigo-150/50 p-4 rounded-xl space-y-2.5 transition">
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs">{pkg.name}</h5>
                    <span className="bg-indigo-100 text-indigo-800 font-mono text-[8px] font-bold px-1.5 py-0.5 rounded inline-block mt-1">
                      👑 Flat {pkg.discountPercentage}% Discount
                    </span>
                  </div>

                  <p className="text-[10.5px] text-slate-500 leading-normal font-sans">{pkg.description}</p>
                  
                  <div className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded-lg text-xs">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Additional Bundle Fee:</span>
                    <strong className="text-indigo-800 text-sm font-sans font-black">+${pkg.rateUSD} USD</strong>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[10.5px] text-slate-500 leading-relaxed font-sans">
              * Note: Apply bundles over the &apos;Reservation&apos; tab to secure package discounts dynamically during client bookings.
            </div>
          </div>
        </div>
      </div>

      {/* DISPATCH AMENITY MODAL FORM */}
      {showAddBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 max-w-sm w-full shadow-2xl relative text-left" id="book-amenity-modal">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3 mb-4">
              <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
              Book Activity Session Appointment
            </h3>

            <form onSubmit={handleServiceSubmit} className="space-y-3.5 text-slate-700">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-450 block uppercase font-bold">Select Active In-House Guest</label>
                <select
                  className="text-xs text-slate-650 w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-hidden focus:border-indigo-500"
                  value={activeResId}
                  onChange={(e) => setActiveResId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Checked-In Folio --</option>
                  {checkInOnlyGuests.map((res) => (
                    <option key={res.id} value={res.id}>
                      👤 Room {res.roomNumber} &mdash; {res.guestName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-450 block uppercase font-bold">Select Target Service</label>
                <select
                  className="text-xs text-slate-650 w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:border-indigo-500"
                  value={activeSrvId}
                  onChange={(e) => setActiveSrvId(e.target.value)}
                  required
                >
                  <option value="">-- Select Service --</option>
                  {services.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      [{srv.category}] {srv.name} &mdash; ${srv.rate}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-450 block uppercase font-bold">Session Date</label>
                  <input
                    type="date"
                    className="text-xs text-slate-650 border border-slate-200 rounded-lg p-2 bg-white w-full"
                    value={actDate}
                    onChange={(e) => setActDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-450 block uppercase font-bold">Session Time</label>
                  <input
                    type="time"
                    className="text-xs text-slate-650 border border-slate-200 rounded-lg p-2 bg-white w-full"
                    value={actTime}
                    onChange={(e) => setActTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-450 block uppercase font-bold">Pax / Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="text-xs text-slate-650 border border-slate-200 rounded-lg p-2 bg-white w-full"
                    value={actQty}
                    onChange={(e) => setActQty(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-450 block uppercase font-bold">Resource / Specialist</label>
                  <input
                    type="text"
                    className="text-xs border border-slate-200 bg-white rounded-lg p-2 text-slate-700 w-full"
                    placeholder="E.g., Sandra (Spa Specialist)"
                    value={assignedTeamMember}
                    onChange={(e) => setAssignedTeamMember(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-indigo-50/50 p-2.5 rounded-lg text-[10.5px] text-indigo-850 leading-relaxed">
                * Note: Submitting this appointment dynamically links additional charges onto the Guest Checkout Folio in real‑time context synchronization.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  className="border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg px-3 py-1.5 hover:bg-slate-50 transition"
                  onClick={() => setShowAddBooking(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg px-4 py-1.5 transition"
                  id="btn-service-add-confirm"
                >
                  Confirm Activity Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
