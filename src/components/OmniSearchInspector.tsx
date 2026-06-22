/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useHMS } from "../context/HMSContext";
import { 
  RoomStatus, 
  ReservationStatus, 
  PaymentMethod, 
  Room, 
  Reservation, 
  Guest,
  LoyaltyTier
} from "../types";
import {
  X,
  User,
  Calendar,
  BedDouble,
  Sliders,
  Sparkles,
  CreditCard,
  AlertCircle,
  Clock,
  CheckCircle2,
  Trash2,
  Plus,
  Users,
  Award,
  Globe,
  Settings,
  DollarSign
} from "lucide-react";

interface OmniSearchInspectorProps {
  entity: { type: "guest" | "reservation" | "room"; id: string };
  onClose: () => void;
}

export const OmniSearchInspector: React.FC<OmniSearchInspectorProps> = ({ entity, onClose }) => {
  const {
    reservations,
    guests,
    rooms,
    staff,
    services,
    hotelProfile,
    updateReservationStatus,
    rescheduleReservation,
    checkInReservation,
    checkOutReservation,
    updateRoomStatus,
    updateRoomHousekeeper,
    updateRoomPricing,
    updateGuestProfile,
    bookService,
    prepayments,
    recordPrepayment,
    adjustGuestCredit
  } = useHMS();

  // Find target profiles based on the selected type
  const targetReservation = reservations.find((r) => r.id === entity.id);
  const targetGuest = guests.find((g) => g.id === entity.id);
  const targetRoom = rooms.find((r) => r.id === entity.id);

  // --- RESERVATION INTERACTIVE STATE ---
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [newCheckIn, setNewCheckIn] = useState(targetReservation?.checkInDate || "");
  const [newCheckOut, setNewCheckOut] = useState(targetReservation?.checkOutDate || "");
  const [newRoomNumber, setNewRoomNumber] = useState(targetReservation?.roomNumber || "");

  const [checkInMode, setCheckInMode] = useState(false);
  const [idType, setIdType] = useState("Passport");
  const [idNumber, setIdNumber] = useState("");

  const [checkOutMode, setCheckOutMode] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CreditCard);

  const [serviceMode, setServiceMode] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [serviceQty, setServiceQty] = useState(1);
  const [serviceMessage, setServiceMessage] = useState("");

  // --- GUEST INTERACTIVE STATE ---
  const [editGuestMode, setEditGuestMode] = useState(false);
  const [gFirst, setGFirst] = useState(targetGuest?.firstName || "");
  const [gLast, setGLast] = useState(targetGuest?.lastName || "");
  const [gEmail, setGEmail] = useState(targetGuest?.email || "");
  const [gPhone, setGPhone] = useState(targetGuest?.phone || "");
  const [gPreferences, setGPreferences] = useState(targetGuest?.preferences?.join(", ") || "");
  const [gNotes, setGNotes] = useState(targetGuest?.notes || "");

  // --- GUEST FINANCIAL WORKFLOWS STATE ---
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [creditAction, setCreditAction] = useState<"add" | "deduct">("add");
  const [creditNotes, setCreditNotes] = useState("");

  const [prepayAmount, setPrepayAmount] = useState<number>(0);
  const [prepayResId, setPrepayResId] = useState("");
  const [prepayMethod, setPrepayMethod] = useState<PaymentMethod>(PaymentMethod.CreditCard);
  const [prepayNotes, setPrepayNotes] = useState("");

  // --- ROOM INTERACTIVE STATE ---
  const [editRoomPricingMode, setEditRoomPricingMode] = useState(false);
  const [newBaseRate, setNewBaseRate] = useState(targetRoom?.baseRate || 0);
  const [newModifier, setNewModifier] = useState(targetRoom?.dynamicModifier || 1.0);

  // Availability calculator to prevent room assignment collision
  const getStayRateEstimate = (rNum: string, ci: string, co: string) => {
    const roomUnit = rooms.find((r) => r.number === rNum);
    if (!roomUnit) return 0;
    const d1 = new Date(ci);
    const d2 = new Date(co);
    const nights = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
    return roomUnit.baseRate * roomUnit.dynamicModifier * nights;
  };

  const isRoomAllocatable = (roomNum: string, start: string, end: string, ignoreResId?: string) => {
    return !reservations.some((res) => {
      if (res.id === ignoreResId) return false;
      if (res.roomNumber !== roomNum) return false;
      if (res.status === ReservationStatus.Cancelled) return false;
      return (start < res.checkOutDate) && (end > res.checkInDate);
    });
  };

  // --- ACTION HANDLERS ---
  const handleSaveReschedule = () => {
    if (!targetReservation) return;
    if (new Date(newCheckOut) <= new Date(newCheckIn)) {
      alert("Check-Out date must be strictly after Check-In date.");
      return;
    }

    const available = isRoomAllocatable(newRoomNumber, newCheckIn, newCheckOut, targetReservation.id);
    if (!available) {
      alert(`Conflict Detected: Room ${newRoomNumber} is already booked inside this duration.`);
      return;
    }

    const cost = getStayRateEstimate(newRoomNumber, newCheckIn, newCheckOut);
    rescheduleReservation(targetReservation.id, newCheckIn, newCheckOut, newRoomNumber, cost);
    setRescheduleMode(false);
    alert("Stay rescheduled successfully.");
  };

  const handleCheckIn = () => {
    if (!targetReservation) return;
    if (!idNumber.trim()) {
      alert("Please submit guest Identification Document details.");
      return;
    }
    checkInReservation(targetReservation.id, idType, idNumber, targetReservation.roomNumber);
    setCheckInMode(false);
    alert("Guest successfully Checked-In!");
  };

  const handleCheckOut = () => {
    if (!targetReservation) return;
    checkOutReservation(targetReservation.id, paymentMethod, "USD");
    setCheckOutMode(false);
    alert("Stay successfully Checked-Out & Portfolio Balance Settled!");
  };

  const handleCreateServiceBooking = () => {
    if (!targetReservation || !selectedServiceId) return;
    const srvDef = services.find((s) => s.id === selectedServiceId);
    if (!srvDef) return;

    bookService({
      serviceId: selectedServiceId,
      serviceName: srvDef.name,
      reservationId: targetReservation.id,
      guestName: targetReservation.guestName,
      date: new Date().toISOString().split("T")[0],
      time: "15:00",
      quantity: serviceQty,
      totalCost: srvDef.rate * serviceQty,
      status: "Pending",
      staffAssigned: "Service Specialist assigned"
    });

    setServiceMessage(`Success: ${srvDef.name} booked!`);
    setTimeout(() => {
      setServiceMessage("");
      setServiceMode(false);
    }, 2000);
  };

  const handleUpdateGuest = () => {
    if (!targetGuest) return;
    const parsedPrefs = gPreferences.split(",").map(p => p.trim()).filter(Boolean);
    updateGuestProfile(targetGuest.id, {
      firstName: gFirst,
      lastName: gLast,
      email: gEmail,
      phone: gPhone,
      preferences: parsedPrefs,
      notes: gNotes
    });
    setEditGuestMode(false);
    alert("Guest profile details updated securely.");
  };

  const handleAdjustCredit = () => {
    if (!targetGuest || creditAmount <= 0) {
      alert("Please specify an amount greater than zero.");
      return;
    }
    const multiplier = creditAction === "add" ? 1 : -1;
    adjustGuestCredit(targetGuest.id, creditAmount * multiplier, creditNotes || "Manual staff adjustment");
    setCreditAmount(0);
    setCreditNotes("");
    alert(`Success: Credit balance for ${targetGuest.firstName} updated!`);
  };

  const handleRecordPrepayment = () => {
    if (!targetGuest || prepayAmount <= 0) {
      alert("Please specify a prepayment amount greater than zero.");
      return;
    }
    if (!prepayResId) {
      alert("Please select or specify a reservation ID link for this prepayment.");
      return;
    }

    recordPrepayment({
      guestId: targetGuest.id,
      reservationId: prepayResId,
      amount: prepayAmount,
      method: prepayMethod,
      notes: prepayNotes || "Standard account prepayment"
    });

    setPrepayAmount(0);
    setPrepayNotes("");
    alert(`Success: prepayment of $${prepayAmount} recorded for Reservation ID #${prepayResId}!`);
  };

  const handleSaveRoomPricing = () => {
    if (!targetRoom) return;
    updateRoomPricing(targetRoom.id, newBaseRate, newModifier);
    setEditRoomPricingMode(false);
    alert("Room pricing rates calibrated.");
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="omnisearch-inspector-backdrop">
      <div 
        className="bg-white rounded-2xl border border-slate-205 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
        id="omnisearch-inspector-window"
      >
        {/* Header Block */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-600 text-white rounded-xl">
              {entity.type === "reservation" && <Calendar className="w-5 h-5" />}
              {entity.type === "guest" && <User className="w-5 h-5" />}
              {entity.type === "room" && <BedDouble className="w-5 h-5" />}
            </span>
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">
                GLOBAL OMNISEARCH RESULTS INSPECTOR
              </span>
              <h3 className="text-base font-black text-slate-805">
                Targeted {entity.type.toUpperCase()}: #{entity.id}
              </h3>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Detail Body */}
        <div className="p-6 flex-grow overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
          
          {/* ==============================================
              CASE A: RESERVATION OPERATIONS
              ============================================== */}
          {entity.type === "reservation" && targetReservation && (
            <div className="space-y-6">
              
              {/* Primary Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Information Card */}
                <div className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-xl space-y-2">
                  <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Stay Details &amp; Period
                  </h4>
                  <div className="space-y-1 text-slate-650">
                    <p>Guest Name: <strong className="text-slate-800">{targetReservation.guestName}</strong></p>
                    <p>Allocated Room: <strong className="text-slate-800">Room {targetReservation.roomNumber} ({targetReservation.roomType})</strong></p>
                    <p>Stay Dates: <strong className="text-slate-800">{targetReservation.checkInDate} &rarr; {targetReservation.checkOutDate}</strong></p>
                    <p>Status Label: <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-600 text-white font-extrabold uppercase font-mono">{targetReservation.status}</span></p>
                  </div>
                </div>

                {/* Financial Summary Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-slate-550" /> Rates &amp; Promotions
                  </h4>
                  <div className="space-y-1 text-slate-650">
                    <p>Total Locked Base Amount: <strong className="text-slate-800">${targetReservation.totalAmount} USD</strong></p>
                    <p>Package Bundle: <span className="font-semibold text-slate-750">{targetReservation.packageBundleId || "None Standard Daily Rate"}</span></p>
                    {targetReservation.notes && (
                      <p className="italic text-amber-700">Client Note: &ldquo;{targetReservation.notes}&rdquo;</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Instant Operational Controls */}
              <div className="border border-slate-200 p-4 rounded-xl space-y-3">
                <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider block">Operational Status Overwrites</span>
                
                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* Status update CONFIRMED */}
                  {targetReservation.status === ReservationStatus.Cancelled && (
                    <button
                      type="button"
                      onClick={() => updateReservationStatus(targetReservation.id, ReservationStatus.Confirmed)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3.5 rounded-lg cursor-pointer"
                    >
                      Re-Instate Stay Booking
                    </button>
                  )}

                  {/* Trigger CHECK-IN Form */}
                  {targetReservation.status === ReservationStatus.Confirmed && (
                    <button
                      type="button"
                      onClick={() => {
                        setCheckInMode(!checkInMode);
                        setRescheduleMode(false);
                        setCheckOutMode(false);
                        setServiceMode(false);
                      }}
                      className="bg-amber-500 hover:bg-amber-650 text-white font-bold py-2 px-3.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      🔑 Check In Resident
                    </button>
                  )}

                  {/* Trigger CHECK-OUT Form */}
                  {targetReservation.status === ReservationStatus.CheckedIn && (
                    <button
                      type="button"
                      onClick={() => {
                        setCheckOutMode(!checkOutMode);
                        setCheckInMode(false);
                        setRescheduleMode(false);
                        setServiceMode(false);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      💳 Settle Checkout Portfolio
                    </button>
                  )}

                  {/* Quick Reschedule */}
                  {targetReservation.status !== ReservationStatus.Cancelled && targetReservation.status !== ReservationStatus.CheckedOut && (
                    <button
                      type="button"
                      onClick={() => {
                        setRescheduleMode(!rescheduleMode);
                        setCheckInMode(false);
                        setCheckOutMode(false);
                        setServiceMode(false);
                      }}
                      className="bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold py-2 px-3.5 rounded-lg cursor-pointer"
                    >
                      ✏️ Modify Dates / Unit Room
                    </button>
                  )}

                  {/* Room Activity Bookings */}
                  {targetReservation.status === ReservationStatus.CheckedIn && (
                    <button
                      type="button"
                      onClick={() => {
                        setServiceMode(!serviceMode);
                        setRescheduleMode(false);
                        setCheckInMode(false);
                        setCheckOutMode(false);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold py-2 px-3.5 rounded-lg cursor-pointer"
                    >
                      🛎️ Order Spa / Dinner
                    </button>
                  )}

                  {/* Cancel Button */}
                  {targetReservation.status === ReservationStatus.Confirmed && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Confirm cancellation?")) {
                          updateReservationStatus(targetReservation.id, ReservationStatus.Cancelled);
                          alert("Cancelled successfully.");
                        }
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 py-2 px-3.5 rounded-lg font-bold cursor-pointer"
                    >
                      Cancel Reservation
                    </button>
                  )}

                </div>
              </div>

              {/* INTERACTIVE FORM SUB-SECTIONS */}
              
              {/* Reschedule View inline */}
              {rescheduleMode && (
                <div className="p-4 border border-indigo-150 bg-indigo-50/10 rounded-xl space-y-4 animate-fade-in">
                  <h5 className="font-extrabold text-indigo-900 text-xs">Reschedule Planning Panel</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-3xs uppercase font-extrabold text-slate-400">Arrive Date</label>
                      <input
                        type="date"
                        className="p-2 border rounded-lg bg-white text-xs text-slate-700 w-full"
                        value={newCheckIn}
                        onChange={(e) => setNewCheckIn(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-3xs uppercase font-extrabold text-slate-400">Depart Date</label>
                      <input
                        type="date"
                        className="p-2 border rounded-lg bg-white text-xs text-slate-700 w-full"
                        value={newCheckOut}
                        onChange={(e) => setNewCheckOut(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1 col-span-2 md:col-span-1">
                      <label className="text-3xs uppercase font-extrabold text-slate-400">Suite Unit Room</label>
                      <select
                        className="p-2 border rounded-lg bg-white text-xs font-bold text-slate-700 w-full"
                        value={newRoomNumber}
                        onChange={(e) => setNewRoomNumber(e.target.value)}
                      >
                        {rooms.map((r) => (
                          <option key={r.id} value={r.number}>
                            Room {r.number} - {r.type} (${r.baseRate})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setRescheduleMode(false)}
                      className="text-slate-400 text-xs font-bold px-3 py-1 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveReschedule}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-lg cursor-pointer"
                    >
                      Re-commit Stay
                    </button>
                  </div>
                </div>
              )}

              {/* Check-In form details */}
              {checkInMode && (
                <div className="p-4 border border-amber-200 bg-amber-50/10 rounded-xl space-y-4 animate-fade-in">
                  <h5 className="font-extrabold text-amber-900 text-xs">Process Resident Check-In</h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-3xs uppercase font-extrabold text-slate-400">ID Document Type</label>
                      <select
                        className="p-2 border rounded-lg bg-white text-xs w-full font-semibold text-slate-700"
                        value={idType}
                        onChange={(e) => setIdType(e.target.value)}
                      >
                        <option value="Passport">Passport Document</option>
                        <option value="Driver License">Driver&apos;s License ID</option>
                        <option value="National ID">Government National ID</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-3xs uppercase font-extrabold text-slate-400">ID Reference Number</label>
                      <input
                        type="text"
                        className="p-2 border rounded-lg bg-white text-xs w-full text-slate-700"
                        placeholder="E.g. PASSPORT-FR-910243"
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setCheckInMode(false)}
                      className="text-slate-400 px-3 py-1 font-bold cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleCheckIn}
                      className="bg-amber-500 text-white px-4 py-1.5 rounded-lg font-bold cursor-pointer"
                    >
                      Approve Check-In &amp; Mint Room Keys
                    </button>
                  </div>
                </div>
              )}

              {/* Check-Out form details */}
              {checkOutMode && (
                <div className="p-4 border border-emerald-250 bg-emerald-50/15 rounded-xl space-y-4 animate-fade-in">
                  <h5 className="font-extrabold text-emerald-900 text-xs">Audit Settlement Details</h5>
                  <p className="text-[10.5px] text-slate-500">
                    Settles current outstanding bills, processes cleaning checklist allocation alerts to housekeepers, and sets Room status to Cleaning.
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-3xs uppercase font-extrabold text-slate-400">Payment Settle Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[PaymentMethod.CreditCard, PaymentMethod.Cash, PaymentMethod.MobileMoney].map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`p-2 border rounded-xl text-center font-bold text-[10.5px] transition cursor-pointer ${
                            paymentMethod === method 
                              ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                              : "border-slate-200 bg-white hover:border-slate-300 text-slate-650"
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setCheckOutMode(false)}
                      className="text-slate-400 px-3 py-1 font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCheckOut}
                      className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg font-black cursor-pointer"
                    >
                      Settle All &amp; Checkout Guest
                    </button>
                  </div>
                </div>
              )}

              {/* Service Addon mode booking inline */}
              {serviceMode && (
                <div className="p-4 border border-slate-200 bg-slate-50 rounded-xl space-y-4 animate-fade-in">
                  <h5 className="font-extrabold text-slate-800 text-xs text-indigo-700">Assign On-Service Amenity Bundle</h5>
                  {serviceMessage && <p className="text-[11px] text-emerald-600 font-bold">{serviceMessage}</p>}

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1">
                      <label className="text-3xs uppercase font-extrabold text-slate-400">Select Activity Catalog</label>
                      <select
                        className="p-2 border rounded-lg bg-white text-xs w-full text-slate-700 font-bold"
                        value={selectedServiceId}
                        onChange={(e) => setSelectedServiceId(e.target.value)}
                      >
                        <option value="">-- Choose Services --</option>
                        {services.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} (${s.rate})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-3xs uppercase font-extrabold text-slate-400">Participants Count</label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        className="p-2 border rounded-lg bg-white text-xs w-full text-slate-700 text-center font-bold"
                        value={serviceQty}
                        onChange={(e) => setServiceQty(parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setServiceMode(false)}
                      className="text-slate-400 px-3 py-1 font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateServiceBooking}
                      className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Confirm Booking &amp; Bill
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ==============================================
              CASE B: GUEST / CLIENT DIRECTIVE
              ============================================== */}
          {entity.type === "guest" && targetGuest && (
            <div className="space-y-6">
              
              {/* Profile card preview */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl bg-white p-2 rounded-2xl border border-slate-150 shadow-xs">👤</span>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800">
                      {targetGuest.firstName} {targetGuest.lastName}
                    </h4>
                    <p className="text-2xs text-slate-450 font-mono">Guest Database Key: {targetGuest.id}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="bg-amber-100 text-amber-905 font-black text-[10px] uppercase font-mono px-3 py-1 rounded border border-amber-250">
                    👑 Loyalist: {targetGuest.loyaltyTier}
                  </span>
                  <p className="text-[10px] text-slate-450 mt-1 leading-normal font-medium">All-time spends: ${targetGuest.totalSpend} USD</p>
                </div>
              </div>

              {/* Guest Details View or edit */}
              {!editGuestMode ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 bg-slate-50/50 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase text-slate-400 font-extrabold">E-Mail Address</span>
                      <strong className="text-slate-750 block">{targetGuest.email}</strong>
                    </div>
                    <div className="p-3.5 bg-slate-50/50 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase text-slate-400 font-extrabold">Mobile Contact</span>
                      <strong className="text-slate-750 block">{targetGuest.phone}</strong>
                    </div>
                  </div>

                  <div className="p-4 border border-dashed border-slate-205 rounded-xl space-y-2">
                    <span className="text-[10px] uppercase text-slate-400 font-extrabold block">Preferences Checklist</span>
                    <div className="flex flex-wrap gap-1.5">
                      {targetGuest.preferences && targetGuest.preferences.length > 0 ? (
                        targetGuest.preferences.map((p, i) => (
                          <span key={i} className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md text-[10px] font-bold">
                            &bull; {p}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No custom preferences registered yet.</span>
                      )}
                    </div>
                  </div>

                  {targetGuest.notes && (
                    <div className="p-4 bg-amber-50/30 border border-amber-100 rounded-xl">
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Internal Staff Directives</span>
                      <p className="text-[11px] text-slate-650 italic mt-1">&ldquo;{targetGuest.notes}&rdquo;</p>
                    </div>
                  )}

                  {/* Account Wallet, Prepayment, and Credit Balances Card Grid */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 space-y-4">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 block">💳 Hospitality Ledger & Private Wallet</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Column A: Guest Credit Balance */}
                      <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-[10px] font-bold text-slate-550 uppercase">Discretionary Credit</span>
                          <span className="text-xs font-mono font-extrabold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-120">
                            ${(targetGuest.creditBalance || 0).toFixed(2)} USD
                          </span>
                        </div>
                        
                        {/* Adjust credit form */}
                        <div className="space-y-1.5 text-[11px]">
                          <label className="text-[9.5px] font-black uppercase text-slate-400">Manual Staff Adjustment</label>
                          <div className="flex gap-1.5">
                            <input
                              type="number"
                              min="1"
                              placeholder="Amount"
                              className="w-20 p-1 border border-slate-200 rounded text-xs text-slate-800 font-mono font-bold"
                              value={creditAmount || ""}
                              onChange={(e) => setCreditAmount(parseFloat(e.target.value) || 0)}
                            />
                            <select
                              className="p-1 border border-slate-200 rounded text-xs font-semibold text-slate-750"
                              value={creditAction}
                              onChange={(e) => setCreditAction(e.target.value as any)}
                            >
                              <option value="add">➕ Grant Code</option>
                              <option value="deduct">➖ Deduct Fees</option>
                            </select>
                          </div>
                          
                          <input
                            type="text"
                            placeholder="Reason for adjustment... (e.g. Loyalty)"
                            className="w-full p-1 border border-slate-200 rounded text-xs text-slate-700"
                            value={creditNotes}
                            onChange={(e) => setCreditNotes(e.target.value)}
                          />
                          
                          <button
                            type="button"
                            onClick={handleAdjustCredit}
                            className="bg-indigo-650 hover:bg-slate-900 text-white font-extrabold text-[10px] uppercase rounded py-1 px-2 cursor-pointer w-full text-center tracking-wider transition"
                          >
                            Commit Credit Adjustment
                          </button>
                        </div>
                      </div>

                      {/* Column B: Prepayment Account Ledger */}
                      <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <span className="text-[10px] font-bold text-slate-550 uppercase">Prepayment Deposits</span>
                          <span className="text-xs font-mono font-extrabold text-emerald-750 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-120">
                            ${(targetGuest.prepaymentBalance || 0).toFixed(2)} USD
                          </span>
                        </div>

                        {/* Record prepayment deposit form */}
                        <div className="space-y-1.5 text-[11px]">
                          <label className="text-[9.5px] font-black uppercase text-slate-400">Record Prepayment Deposit</label>
                          
                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              type="number"
                              min="1"
                              placeholder="Deposit USD"
                              className="p-1 border border-slate-200 rounded text-xs text-slate-800 font-mono font-bold"
                              value={prepayAmount || ""}
                              onChange={(e) => setPrepayAmount(parseFloat(e.target.value) || 0)}
                            />
                            <select
                              className="p-1 border border-slate-200 rounded text-xs font-bold text-slate-700 font-mono"
                              value={prepayResId}
                              onChange={(e) => setPrepayResId(e.target.value)}
                            >
                              <option value="">-- Link Stay Res --</option>
                              {reservations
                                .filter((rv) => {
                                  // Match guest reservation either by guestId or guestName similarity
                                  return rv.guestId === targetGuest.id || 
                                         rv.guestName.toLowerCase().includes(targetGuest.firstName.toLowerCase()) ||
                                         rv.guestName.toLowerCase().includes(targetGuest.lastName.toLowerCase());
                                })
                                .map((rv) => (
                                  <option key={rv.id} value={rv.id}>
                                    #{rv.id} ({rv.roomNumber})
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            <select
                              className="p-1 border border-slate-200 rounded text-[10px] font-semibold text-slate-750"
                              value={prepayMethod}
                              onChange={(e) => setPrepayMethod(e.target.value as any)}
                            >
                              <option value={PaymentMethod.CreditCard}>💳 Credit Card</option>
                              <option value={PaymentMethod.Cash}>💵 Cash Dep</option>
                              <option value={PaymentMethod.MobileMoney}>📱 Mobile Money</option>
                            </select>
                            
                            <input
                              type="text"
                              placeholder="Tx Reference / Notes"
                              className="p-1 border border-slate-200 rounded text-xs text-slate-700 font-light"
                              value={prepayNotes}
                              onChange={(e) => setPrepayNotes(e.target.value)}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleRecordPrepayment}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase rounded py-1 px-2 cursor-pointer w-full text-center tracking-wider transition"
                          >
                            File Prepayment Deposit
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditGuestMode(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer"
                    >
                      ✏️ Edit Guest Profile
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200 p-4 rounded-xl space-y-4">
                  <span className="text-xs font-bold text-slate-800 uppercase block">Modify Client Profile</span>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-3xs uppercase font-extrabold text-slate-400">First Name</label>
                      <input
                        type="text"
                        className="p-2.5 border rounded-lg bg-white w-full text-slate-700 text-xs font-bold"
                        value={gFirst}
                        onChange={(e) => setGFirst(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-3xs uppercase font-extrabold text-slate-400">Family Name</label>
                      <input
                        type="text"
                        className="p-2.5 border rounded-lg bg-white w-full text-slate-700 text-xs font-bold"
                        value={gLast}
                        onChange={(e) => setGLast(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-3xs uppercase font-extrabold text-slate-400">Email Address</label>
                      <input
                        type="email"
                        className="p-2.5 border rounded-lg bg-white w-full text-slate-705 text-xs font-medium"
                        value={gEmail}
                        onChange={(e) => setGEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-3xs uppercase font-extrabold text-slate-400">Telephone Number</label>
                      <input
                        type="text"
                        className="p-2.5 border rounded-lg bg-white w-full text-slate-705 text-xs font-medium"
                        value={gPhone}
                        onChange={(e) => setGPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-3xs uppercase font-extrabold text-slate-400">Preferences (comma separated)</label>
                    <input
                      type="text"
                      className="p-2.5 border rounded-lg bg-white w-full text-slate-700 text-xs"
                      placeholder="Hard pillow, Sea view, Allergy to nuts..."
                      value={gPreferences}
                      onChange={(e) => setGPreferences(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-3xs uppercase font-extrabold text-slate-400">Internal Office Notes</label>
                    <textarea
                      rows={2}
                      className="p-2.5 border rounded-lg bg-white w-full text-slate-700 text-xs"
                      value={gNotes}
                      onChange={(e) => setGNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditGuestMode(false)}
                      className="text-slate-405 font-bold text-xs"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleUpdateGuest}
                      className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-1.5 px-4 rounded-lg text-xs cursor-pointer"
                    >
                      Save Guest Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Reservation Histories */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <span className="text-[10px] uppercase text-slate-450 font-black tracking-wider block">Stay Registry Histories</span>
                
                <div className="space-y-1.5">
                  {reservations.filter(r => r.guestId === targetGuest.id).map(r => (
                    <div key={r.id} className="p-2.5 border border-slate-100 rounded-xl hover:bg-slate-50 transition flex items-center justify-between">
                      <div>
                        <strong className="text-slate-800 text-xs block">Room {r.roomNumber} ({r.roomType})</strong>
                        <span className="text-[10px] text-slate-400 block font-mono">ID ref: {r.id} &bull; {r.checkInDate} to {r.checkOutDate}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase text-center ${
                        r.status === "Confirmed" ? "bg-indigo-50 text-indigo-700" :
                        r.status === "CheckedIn" ? "bg-amber-50 text-amber-850" :
                        r.status === "CheckedOut" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-500"
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                  {reservations.filter(r => r.guestId === targetGuest.id).length === 0 && (
                    <p className="text-slate-400 italic text-2xs">No stay logs matching this client key.</p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ==============================================
              CASE C: ROOM UNIT OPERATIONS
              ============================================== */}
          {entity.type === "room" && targetRoom && (
            <div className="space-y-6">
              
              {/* Profile Room Unit */}
              <div className="p-4 bg-slate-50 border border-slate-205 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl bg-white p-2 border rounded-xl shadow-xs">🛌</span>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-805">Suite Room Number {targetRoom.number}</h4>
                    <p className="text-2xs text-slate-405 font-medium uppercase">{targetRoom.type} Class &bull; Floor {targetRoom.floor}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`px-2.5 py-1 rounded text-2xs font-extrabold uppercase border ${
                    targetRoom.status === RoomStatus.Available ? "bg-emerald-50 border-emerald-205 text-emerald-800" :
                    targetRoom.status === RoomStatus.Occupied ? "bg-amber-50 border-amber-205 text-amber-800" :
                    targetRoom.status === RoomStatus.Cleaning ? "bg-sky-50 border-sky-200 text-sky-700" : "bg-rose-50 border-rose-200 text-rose-700"
                  }`}>
                    {targetRoom.status}
                  </span>
                </div>
              </div>

              {/* Dynamic properties pricing info */}
              {!editRoomPricingMode ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl space-y-1 text-slate-655 relative">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Calibration Rates</span>
                    <p className="text-slate-800 text-xs font-bold mt-1">Base Price: ${targetRoom.baseRate}/night</p>
                    <p className="text-slate-500 text-2xs font-mono">Dynamic Multiplier: {targetRoom.dynamicModifier}x</p>
                    <button
                      type="button"
                      onClick={() => {
                        setNewBaseRate(targetRoom.baseRate);
                        setNewModifier(targetRoom.dynamicModifier);
                        setEditRoomPricingMode(true);
                      }}
                      className="absolute right-3 top-3 bg-white hover:bg-slate-100 border p-1 rounded transition text-slate-500 cursor-pointer"
                      title="Calibrate Pricing"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl space-y-1 text-slate-650">
                    <span className="text-[10px] uppercase font-bold text-slate-450 block">Assigned Crew / Housekeeper</span>
                    <strong className="text-slate-800 block">
                      {targetRoom.housekeeperId 
                        ? (staff.find(s => s.id === targetRoom.housekeeperId)?.name || `ID #${targetRoom.housekeeperId}`) 
                        : "No housekeeping crew scheduled"}
                    </strong>
                    
                    {/* Choose Room Housekeeper assignments list */}
                    <select
                      className="text-[10px] font-bold border rounded bg-white p-1 mt-1 cursor-pointer"
                      value={targetRoom.housekeeperId || ""}
                      onChange={(e) => updateRoomHousekeeper(targetRoom.id, e.target.value || undefined)}
                    >
                      <option value="">-- Assign Crew --</option>
                      {staff.filter(s => s.role === "Housekeeping" || s.role === "Manager").map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.status})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-205 p-4 rounded-xl space-y-4 animate-fade-in bg-slate-50/50">
                  <h5 className="font-extrabold text-slate-800 text-xs">Calibrate Room Tariff Rates</h5>
                  
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-3xs uppercase font-extrabold text-slate-400">Regular Base Rate ($)</label>
                      <input
                        type="number"
                        className="p-2 border rounded-lg bg-white text-xs w-full font-bold text-slate-700"
                        value={newBaseRate}
                        onChange={(e) => setNewBaseRate(parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-3xs uppercase font-extrabold text-slate-400">Dynamic Tariff Multiplier</label>
                      <select
                        className="p-2 border rounded-lg bg-white text-xs w-full font-bold text-slate-700"
                        value={newModifier}
                        onChange={(e) => setNewModifier(parseFloat(e.target.value) || 1.0)}
                      >
                        <option value="1.0">1.0x (Standard Midweek)</option>
                        <option value="1.15">1.15x (Peak Dynamic)</option>
                        <option value="1.25">1.25x (Super Peak weekend)</option>
                        <option value="0.85">0.85x (Promo Low season)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 text-2xs pt-1">
                    <button
                      type="button"
                      onClick={() => setEditRoomPricingMode(false)}
                      className="text-slate-405 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveRoomPricing}
                      className="bg-indigo-600 hover:bg-indigo-705 text-white font-bold py-1.5 px-3 rounded-lg cursor-pointer"
                    >
                      Calibrate Tariff
                    </button>
                  </div>
                </div>
              )}

              {/* Status Update Controls */}
              <div className="p-4 border border-slate-150 rounded-xl space-y-3.5">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Overrule Operations Status</span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.values(RoomStatus).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        updateRoomStatus(targetRoom.id, status);
                        alert(`Room ${targetRoom.number} is now marked ${status}.`);
                      }}
                      className={`py-2 px-1 rounded-lg border text-center text-[10px] font-black uppercase transition-all cursor-pointer ${
                        targetRoom.status === status
                          ? "bg-slate-800 border-slate-900 text-white shadow-xs"
                          : "bg-white hover:bg-slate-50 border-slate-205 text-slate-650"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Unit room features lists mapping */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase text-slate-450 font-black tracking-wider block">Bespoke Suite Amenities Included</span>
                <div className="flex flex-wrap gap-1.5">
                  {targetRoom.features.map((item, id) => (
                    <span key={id} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                      &bull; {item}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer info panel */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex items-center justify-between pointer-events-none shrink-0 text-[10px] text-slate-400 font-medium font-mono">
          <span>Persisted Workspace node</span>
          <span>Security Level Authorized</span>
        </div>

      </div>
    </div>
  );
};
