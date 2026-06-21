/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useHMS } from "../context/HMSContext";
import { RoomType, RoomStatus, ReservationStatus, Reservation, PaymentMethod } from "../types";
import {
  Calendar,
  Search,
  Filter,
  Plus,
  UserPlus,
  Check,
  X,
  CreditCard,
  Tag,
  AlertCircle
} from "lucide-react";

export const ReservationModule: React.FC = () => {
  const {
    reservations,
    guests,
    rooms,
    packageBundles,
    createReservation,
    updateReservationStatus,
    activeRole
  } = useHMS();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Show Booking Drawer/Modal
  const [showAddForm, setShowAddForm] = useState(false);

  // New Booking State
  const [guestId, setGuestId] = useState("");
  const [isNewGuest, setIsNewGuest] = useState(false);
  const [newGuestFirst, setNewGuestFirst] = useState("");
  const [newGuestLast, setNewGuestLast] = useState("");
  const [newGuestEmail, setNewGuestEmail] = useState("");
  const [newGuestPhone, setNewGuestPhone] = useState("");
  
  const [roomType, setRoomType] = useState<RoomType>(RoomType.Standard);
  const [roomNumber, setRoomNumber] = useState("");
  const [checkIn, setCheckIn] = useState("2026-06-21");
  const [checkOut, setCheckOut] = useState("2026-06-25");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Timeline Schedule View configuration
  const [scheduleStartDate, setScheduleStartDate] = useState("2026-06-20");

  const datesList = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(scheduleStartDate);
    d.setDate(d.getDate() + idx);
    return d.toISOString().split("T")[0];
  });

  // Available Rooms of selected type
  const matchingRooms = rooms.filter((r) => r.type === roomType && r.status === RoomStatus.Available);

  // Math for estimated cost
  const calculateEstimate = () => {
    const roomUnit = rooms.find((r) => r.number === roomNumber);
    if (!roomUnit) return 0;
    
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    
    let base = roomUnit.baseRate * roomUnit.dynamicModifier * nights;
    
    if (selectedPackageId) {
      const pkg = packageBundles.find((p) => p.id === selectedPackageId);
      if (pkg) {
        // Packages apply modifiers
        const pkgAddition = pkg.rateUSD;
        const discountMul = 1 - (pkg.discountPercentage / 100);
        base = Math.round((base + pkgAddition) * discountMul);
      }
    }
    
    return base;
  };

  // Submit booking creation
  const handleCreateBooking = (e: React.FormEvent) => {
     e.preventDefault();
     
     let finalGuestId = guestId;
     let finalGuestName = "";

     if (isNewGuest) {
       // Validate
       if (!newGuestFirst || !newGuestLast || !newGuestEmail) {
         alert("Please capture new guest mandatory profiles first.");
         return;
       }
       // Save to guest lists locally via context
       const { saveGuest } = useHMS(); // we import or pull directly
       // To maintain clean scope let's save the guest via our hms provider
       const saved = useHMS().saveGuest({
         firstName: newGuestFirst,
         lastName: newGuestLast,
         email: newGuestEmail,
         phone: newGuestPhone || "+1 555-0100",
         idType: "Driver License",
         idNumber: "PENDING-ID-VERIFY",
         loyaltyTier: useHMS().guests.length === 0 ? useHMS().guests[0]?.loyaltyTier : useHMS().guests[1]?.loyaltyTier || useHMS().guests[0]?.loyaltyTier
       });
       finalGuestId = saved.id;
       finalGuestName = `${saved.firstName} ${saved.lastName}`;
     } else {
       const matchedG = guests.find((g) => g.id === guestId);
       if (!matchedG) {
         alert("Please select a registered guest.");
         return;
       }
       finalGuestName = `${matchedG.firstName} ${matchedG.lastName}`;
     }

     if (!roomNumber) {
       alert("Please select an available room.");
       return;
     }

     const cost = calculateEstimate();

     createReservation({
       guestId: finalGuestId,
       guestName: finalGuestName,
       roomNumber,
       roomType,
       checkInDate: checkIn,
       checkOutDate: checkOut,
       totalAmount: cost,
       status: ReservationStatus.Confirmed,
       packageBundleId: selectedPackageId || undefined,
       notes: additionalNotes || undefined
     });

     // Reset
     setShowAddForm(false);
     setGuestId("");
     setIsNewGuest(false);
     setNewGuestFirst("");
     setNewGuestLast("");
     setNewGuestEmail("");
     setNewGuestPhone("");
     setSelectedPackageId("");
     setAdditionalNotes("");
  };

  // Get reservation label for calendar block
  const getReservationOnDate = (roomNum: string, dateStr: string) => {
    return reservations.find((res) => {
      if (res.status === ReservationStatus.Cancelled) return false;
      return res.roomNumber === roomNum && dateStr >= res.checkInDate && dateStr < res.checkOutDate;
    });
  };

  // Filter reservations
  const filteredReservations = reservations.filter((r) => {
    const matchesSearch = r.guestName.toLowerCase().includes(searchTerm.toLowerCase()) || r.roomNumber.includes(searchTerm);
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6" id="reservation-module-panel">
      {/* Visual Timeline scheduler calendar */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs" id="reservation-calendar-grid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-4 mb-4">
          <div>
            <h3 className="font-semibold text-slate-700 text-sm tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              Room Scheduler Timeline
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              7-Day graphical forecast of room assignments mapping check‑ins &amp; vacancies.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium font-sans">Start Date:</span>
            <input
              type="date"
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-indigo-500 text-slate-700 bg-white"
              value={scheduleStartDate}
              onChange={(e) => setScheduleStartDate(e.target.value)}
              id="timeline-start-date-input"
            />
          </div>
        </div>

        {/* The Matrix */}
        <div className="overflow-x-auto">
          <div className="min-w-[850px]">
            {/* Headers */}
            <div className="grid grid-cols-8 border-b border-slate-100 pb-2 text-center text-xs font-semibold text-slate-500">
              <div className="text-left pl-3 font-bold text-slate-700">Room Unit</div>
              {datesList.map((d) => {
                const dayLabel = new Date(d).toLocaleDateString("en-US", { weekday: "short" });
                const dayNum = d.split("-")[2];
                const isToday = d === new Date().toISOString().split("T")[0];

                return (
                  <div key={d} className={`py-1 rounded ${isToday ? "bg-indigo-50 text-indigo-700 font-bold" : ""}`}>
                    {dayLabel} {dayNum}
                  </div>
                );
              })}
            </div>

            {/* Rows */}
            <div className="space-y-1.5 mt-2">
              {rooms.map((room) => {
                return (
                  <div key={room.id} className="grid grid-cols-8 items-center border border-slate-50 rounded-lg hover:bg-slate-50/50 py-1" id={`timeline-row-${room.number}`}>
                    <div className="pl-3 text-xs">
                      <span className="font-bold text-slate-800">{room.number}</span>
                      <span className="text-[10px] text-slate-400 block tracking-tight">{room.type}</span>
                    </div>

                    {datesList.map((dateStr) => {
                      const res = getReservationOnDate(room.number, dateStr);
                      let content = <div className="h-7 rounded-md bg-stone-50 border border-dashed border-stone-200/60 m-1 flex items-center justify-center text-[10px] text-stone-300">Vacant</div>;
                      
                      if (res) {
                        let barStyle = "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100";
                        if (res.status === ReservationStatus.CheckedIn) {
                          barStyle = "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100";
                        } else if (res.status === ReservationStatus.CheckedOut) {
                          barStyle = "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100";
                        }

                        content = (
                          <div
                            className={`h-7 rounded-md border m-1 p-1 text-[8.5px] font-medium leading-none flex flex-col justify-center truncate cursor-pointer transition select-none ${barStyle}`}
                            title={`Guest: ${res.guestName}, Period: ${res.checkInDate} to ${res.checkOutDate} (${res.status})`}
                          >
                            <span className="font-semibold block truncate leading-none">{res.guestName}</span>
                            <span className="text-[7.5px] opacity-75 mt-0.5 tracking-tight font-mono">{res.status}</span>
                          </div>
                        );
                      }

                      return <div key={dateStr}>{content}</div>;
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Booking list section */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs" id="reservation-list-box">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-slate-700 text-sm tracking-tight font-sans">Reservations Ledger</h3>
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">
              {filteredReservations.length} records found
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                className="text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 focus:outline-hidden focus:border-indigo-500 text-slate-700 bg-white placeholder:text-slate-400 w-[180px]"
                placeholder="Search Guest or Room"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                id="reservations-search-field"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 text-slate-600">
              <Filter className="w-3.5 h-3.5" />
              <select
                className="text-xs py-2 bg-transparent border-none focus:outline-hidden text-slate-600"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                id="reservations-status-selector"
              >
                <option value="ALL">All Bookings</option>
                <option value={ReservationStatus.Confirmed}>Confirmed</option>
                <option value={ReservationStatus.CheckedIn}>In-House</option>
                <option value={ReservationStatus.CheckedOut}>Departed</option>
                <option value={ReservationStatus.Cancelled}>Cancelled</option>
              </select>
            </div>

            {/* Offline Booking trigger */}
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 transition ml-auto"
              onClick={() => setShowAddForm(true)}
              id="action-new-booking-trigger"
            >
              <Plus className="w-3.5 h-3.5" />
              New Booking
            </button>
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto rounded-lg border border-slate-50">
          <table className="min-w-full text-xs text-left" id="reservations-table">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-4">Guest Name</th>
                <th className="py-3 px-4">Assigned Room</th>
                <th className="py-3 px-4">Check-In</th>
                <th className="py-3 px-4">Check-Out</th>
                <th className="py-3 px-4">Nights</th>
                <th className="py-3 px-4">Est. Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">
                    No reservations matched criteria. Click &apos;New Booking&apos; to register one.
                  </td>
                </tr>
              ) : (
                filteredReservations.map((res) => {
                  const d1 = new Date(res.checkInDate);
                  const d2 = new Date(res.checkOutDate);
                  const nights = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));

                  let statusBadge = "bg-indigo-50 text-indigo-700";
                  if (res.status === ReservationStatus.CheckedIn) statusBadge = "bg-amber-150 text-amber-800 bg-amber-50";
                  else if (res.status === ReservationStatus.CheckedOut) statusBadge = "bg-emerald-50 text-emerald-800";
                  else if (res.status === ReservationStatus.Cancelled) statusBadge = "bg-slate-100 text-slate-500";

                  return (
                    <tr key={res.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-650">{res.id}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{res.guestName}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700">Rm {res.roomNumber}</span>
                        <span className="text-[10px] text-slate-400 block">{res.roomType}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-650">{res.checkInDate}</td>
                      <td className="py-3 px-4 text-slate-650">{res.checkOutDate}</td>
                      <td className="py-3 px-4 text-slate-500">{nights} Nts</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">${res.totalAmount}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusBadge}`}>
                          {res.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {res.status === ReservationStatus.Confirmed && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              className="text-slate-400 hover:text-red-500 px-1.5 py-1 rounded hover:bg-red-50 transition text-[10px]"
                              onClick={() => {
                                if (confirm(`Are you sure you want to cancel the offline booking for ${res.guestName}?`)) {
                                  updateReservationStatus(res.id, ReservationStatus.Cancelled);
                                }
                              }}
                              title="Cancel Reservation"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-slate-200">|</span>
                            <span className="text-[10px] text-indigo-600 hover:underline">
                              Clerk Check-In tab
                            </span>
                          </div>
                        )}
                        {res.status === ReservationStatus.CheckedIn && (
                          <span className="text-[10px] text-amber-600 italic">In-house (Front Desk Area)</span>
                        )}
                        {res.status === ReservationStatus.CheckedOut && (
                          <span className="text-[10px] text-emerald-600 font-medium">Completed Invoice Paid</span>
                        )}
                        {res.status === ReservationStatus.Cancelled && (
                          <span className="text-[10px] text-slate-400 italic">Cancelled</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Offline Booking Creation Drawer / Modal Overlay */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 transition-all">
          <div className="bg-white p-6 rounded-xl border border-slate-200 max-w-lg w-full shadow-2xl relative text-left" id="new-booking-modal">
            <button
               className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-50"
               onClick={() => setShowAddForm(false)}
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-150 pb-3 mb-4">
              <Calendar className="w-5 h-5 text-indigo-500" />
              Register Offline Reservation
            </h3>

            <form onSubmit={handleCreateBooking} className="space-y-4 text-slate-700">
              {/* Guest Profile Mode Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 block">Guest Selection</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                  <button
                    type="button"
                    className={`text-xs py-1.5 rounded transition ${!isNewGuest ? "bg-white text-indigo-700 shadow-xs font-semibold" : "text-slate-500"}`}
                    onClick={() => setIsNewGuest(false)}
                  >
                    Select Registered Guest
                  </button>
                  <button
                    type="button"
                    className={`text-xs py-1.5 rounded transition ${isNewGuest ? "bg-white text-indigo-700 shadow-xs font-semibold" : "text-slate-500"}`}
                    onClick={() => setIsNewGuest(true)}
                  >
                    Register New Profile
                  </button>
                </div>
              </div>

              {/* CRM selector vs Creation Form fields */}
              {!isNewGuest ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500 block">Select CRM Guest Account</label>
                  <select
                    className="text-xs text-slate-650 w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:border-indigo-500 focus:outline-hidden"
                    value={guestId}
                    onChange={(e) => setGuestId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Registered Contact --</option>
                    {guests.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.firstName} {g.lastName} ({g.loyaltyTier}) &mdash; {g.email}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-slate-50/50 rounded-lg border border-slate-100 space-y-2">
                  <p className="text-[10px] text-indigo-650 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <UserPlus className="w-3 h-3" /> Mandatory Guest Details
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="text-xs border border-slate-200 rounded-md p-2 bg-white w-full"
                      placeholder="First Name"
                      value={newGuestFirst}
                      onChange={(e) => setNewGuestFirst(e.target.value)}
                    />
                    <input
                      type="text"
                      className="text-xs border border-slate-200 rounded-md p-2 bg-white w-full"
                      placeholder="Last Name"
                      value={newGuestLast}
                      onChange={(e) => setNewGuestLast(e.target.value)}
                    />
                  </div>
                  <input
                    type="email"
                    className="text-xs border border-slate-200 rounded-md p-2 bg-white w-full block"
                    placeholder="Email Address"
                    value={newGuestEmail}
                    onChange={(e) => setNewGuestEmail(e.target.value)}
                  />
                  <input
                    type="tel"
                    className="text-xs border border-slate-200 rounded-md p-2 bg-white w-full block"
                    placeholder="Phone number (+1 / +234)"
                    value={newGuestPhone}
                    onChange={(e) => setNewGuestPhone(e.target.value)}
                  />
                </div>
              )}

              {/* Room selections */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">Room Class</label>
                  <select
                    className="text-xs text-slate-650 w-full border border-slate-200 rounded-lg p-2.5 bg-white"
                    value={roomType}
                    onChange={(e) => {
                      setRoomType(e.target.value as RoomType);
                      setRoomNumber(""); // reset assignment
                    }}
                  >
                    <option value={RoomType.Standard}>Standard ($120)</option>
                    <option value={RoomType.Deluxe}>Deluxe ($200)</option>
                    <option value={RoomType.Suite}>Suite ($350)</option>
                    <option value={RoomType.Executive}>Executive ($550)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">Vacant Assignable Room</label>
                  <select
                    className="text-xs text-slate-650 w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:border-indigo-500"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Vacant --</option>
                    {matchingRooms.map((rm) => (
                      <option key={rm.id} value={rm.number}>
                        Room {rm.number} &mdash; Floor {rm.floor} (x{rm.dynamicModifier} Peak)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Booking dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">Check-In Date</label>
                  <input
                    type="date"
                    className="text-xs text-slate-650 w-full border border-slate-200 rounded-lg p-2 bg-white"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">Check-Out Date</label>
                  <input
                    type="date"
                    className="text-xs text-slate-650 w-full border border-slate-200 rounded-lg p-2 bg-white"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Service bundle select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 block flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-indigo-500" />
                  Apply Package Promotion Bundle
                </label>
                <select
                  className="text-xs text-slate-650 w-full border border-slate-200 rounded-lg p-2.5 bg-white"
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                >
                  <option value="">-- No Extra Bundle Applied --</option>
                  {packageBundles.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} &mdash; Flat {pkg.discountPercentage}% Discount!
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 block">Staff / Special Notes</label>
                <textarea
                  className="text-xs text-slate-650 w-full border border-slate-200 rounded-lg p-2 bg-white h-12"
                  placeholder="Extra pillow requests, late checkout arrangements, food preferences..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                />
              </div>

              {/* Price Estimate Area */}
              {roomNumber && (
                <div className="bg-indigo-50/50 px-4 py-3 border border-indigo-100 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-semibold text-indigo-800">Room rate estimation cost:</span>
                  </div>
                  <span className="text-sm font-bold text-indigo-900">${calculateEstimate()} USD</span>
                </div>
              )}

              {/* Submit triggers */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  className="border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg px-4 py-2 hover:bg-slate-55 mb-0"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg px-5 py-2 transition"
                >
                  Lock In Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
