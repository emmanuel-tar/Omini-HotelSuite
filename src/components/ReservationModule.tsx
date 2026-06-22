/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useHMS } from "../context/HMSContext";
import { RoomType, RoomStatus, ReservationStatus, Reservation, PaymentMethod, ActivityService, ServiceBooking } from "../types";
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
  AlertCircle,
  Clock,
  Sparkles,
  Smartphone,
  Mail,
  Phone,
  CheckCircle2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Info,
  Sliders,
  Globe,
  Award
} from "lucide-react";

export const ReservationModule: React.FC = () => {
  const {
    reservations,
    guests,
    rooms,
    packageBundles,
    services,
    serviceBookings,
    createReservation,
    updateReservationStatus,
    rescheduleReservation,
    activeRole,
    saveGuest,
    bookService,
    updateServiceBookingStatus
  } = useHMS();

  // High-level sub-tab selection
  const [activeSubTab, setActiveSubTab] = useState<"calendar" | "ledger" | "form" | "addons">("calendar");

  // --- Sub-Tab 1: 📅 Room & Activities Calendar config ---
  const [calendarView, setCalendarView] = useState<"day" | "week" | "month">("week");
  const [calendarStartDate, setCalendarStartDate] = useState<string>("2026-06-21");
  const [selectedCalendarResId, setSelectedCalendarResId] = useState<string | null>(null);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [syncStep, setSyncStep] = useState<"idle" | "connecting" | "success">("idle");

  // --- Sub-Tab 2: 📋 Staff Ledger Filters & Reschedule ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>("ALL");
  const [filterCheckInDate, setFilterCheckInDate] = useState<string>("");
  const [rescheduleResId, setRescheduleResId] = useState<string | null>(null);
  const [rescheduleNewCI, setRescheduleNewCI] = useState<string>("");
  const [rescheduleNewCO, setRescheduleNewCO] = useState<string>("");
  const [rescheduleNewRoom, setRescheduleNewRoom] = useState<string>("");

  // --- Sub-Tab 3: 🏨 Guest Booking Portal ---
  const [bookingStep, setBookingStep] = useState<number>(1);
  const [guestFirst, setGuestFirst] = useState("");
  const [guestLast, setGuestLast] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestCount, setGuestCount] = useState<number>(2);
  const [gRoomType, setGRoomType] = useState<RoomType>(RoomType.Standard);
  const [gCheckIn, setGCheckIn] = useState("2026-06-22");
  const [gCheckOut, setGCheckOut] = useState("2026-06-25");
  const [gPayment, setGPayment] = useState<PaymentMethod>(PaymentMethod.CreditCard);
  const [gPackageId, setGPackageId] = useState("");
  const [gNotes, setGNotes] = useState("");
  const [gErrors, setGErrors] = useState<Record<string, string>>({});
  
  // Successful simulation parameters
  const [confirmedRes, setConfirmedRes] = useState<Reservation | null>(null);
  const [simulatedMobileAlert, setSimulatedMobileAlert] = useState<boolean>(true);

  // --- Sub-Tab 4: 🛎️ Add-On Activities ---
  const [srvResId, setSrvResId] = useState("");
  const [srvId, setSrvId] = useState("");
  const [srvDate, setSrvDate] = useState("2026-06-23");
  const [srvTime, setSrvTime] = useState("14:00");
  const [srvQty, setSrvQty] = useState<number>(1);
  const [srvStaff, setSrvStaff] = useState("Assigned Specialist");
  const [addonMessage, setAddonMessage] = useState("");

  // Helper date lists generator (for 7-day timeline view)
  const getDatesList = (start: string, length = 7) => {
    return Array.from({ length }, (_, idx) => {
      const d = new Date(start);
      d.setDate(d.getDate() + idx);
      return d.toISOString().split("T")[0];
    });
  };

  // Helper date list generator (for 1-day View)
  const dayDatesList = getDatesList(calendarStartDate, 1);

  // Helper date list generator (for 30-day Month View)
  const monthDatesList = getDatesList(calendarStartDate, 28); // 4 full weeks block

  // Get active dates list
  const activeDates = calendarView === "day"
    ? dayDatesList
    : calendarView === "month"
      ? monthDatesList
      : getDatesList(calendarStartDate, 7);

  // Availability Check helper
  const isRoomAvailable = (roomNum: string, start: string, end: string, ignoreResId: string | null = null) => {
    return !reservations.some((res) => {
      if (res.id === ignoreResId) return false;
      if (res.roomNumber !== roomNum) return false;
      if (res.status === ReservationStatus.Cancelled) return false;
      // Overlap checks
      return (start < res.checkOutDate) && (end > res.checkInDate);
    });
  };

  // Find dynamic price estimate for rooms
  const getStayRateEstimate = (rType: RoomType, rNum: string, checkIn: string, checkOut: string, packageId: string) => {
    const roomUnit = rooms.find((r) => r.number === rNum) || rooms.find((r) => r.type === rType);
    if (!roomUnit) return 0;

    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diffTime = d2.getTime() - d1.getTime();
    const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    let price = roomUnit.baseRate * roomUnit.dynamicModifier * nights;

    if (packageId) {
      const pkg = packageBundles.find((p) => p.id === packageId);
      if (pkg) {
        price = Math.round((price + pkg.rateUSD) * (1 - pkg.discountPercentage / 100));
      }
    }
    return price;
  };

  // Handler for Rescheduling stays from the Staff view
  const handleConfirmReschedule = () => {
    if (!rescheduleResId) return;
    const targetRes = reservations.find((r) => r.id === rescheduleResId);
    if (!targetRes) return;

    if (new Date(rescheduleNewCO) <= new Date(rescheduleNewCI)) {
      alert("Validation Error: Stay Check-Out date must succeed Check-In date.");
      return;
    }

    // Check Room vacancy for rescheduled dates
    const vacancy = isRoomAvailable(rescheduleNewRoom, rescheduleNewCI, rescheduleNewCO, rescheduleResId);
    if (!vacancy) {
      alert(`Conflict Detected: Room ${rescheduleNewRoom} is already booked or occupied within those dates.`);
      return;
    }

    const newCost = getStayRateEstimate(targetRes.roomType, rescheduleNewRoom, rescheduleNewCI, rescheduleNewCO, targetRes.packageBundleId || "");
    rescheduleReservation(rescheduleResId, rescheduleNewCI, rescheduleNewCO, rescheduleNewRoom, newCost);
    setRescheduleResId(null);
  };

  // Handler for Guest Booking Form step submit
  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGErrors({});
    const errors: Record<string, string> = {};

    // Steps validation
    if (bookingStep === 1) {
      if (new Date(gCheckOut) <= new Date(gCheckIn)) {
        errors.gCheckOut = "Check-out date must occur after check-in date.";
      }
      if (new Date(gCheckIn) < new Date("2026-06-20")) {
        errors.gCheckIn = "Check-in date cannot lie in the prior history.";
      }
      if (Object.keys(errors).length > 0) {
        setGErrors(errors);
        return;
      }
      setBookingStep(2);
    } else if (bookingStep === 2) {
      if (!guestFirst.trim()) errors.guestFirst = "Specify given first name.";
      if (!guestLast.trim()) errors.guestLast = "Specify family last name.";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(guestEmail)) errors.guestEmail = "Submit a compliant email structure.";
      if (!guestPhone.trim()) errors.guestPhone = "Specify mobile phone contact.";

      if (Object.keys(errors).length > 0) {
        setGErrors(errors);
        return;
      }
      setBookingStep(3);
    } else if (bookingStep === 3) {
      // Step 3 submission executes the Reservation allocation
      // Seek vacant room of high-priority type
      const suitableRooms = rooms.filter((r) => r.type === gRoomType && r.status !== RoomStatus.Maintenance);
      let assignedRoom = "";

      for (const room of suitableRooms) {
        if (isRoomAvailable(room.number, gCheckIn, gCheckOut)) {
          assignedRoom = room.number;
          break;
        }
      }

      if (!assignedRoom) {
        // Fallback: Seek any room type that is available to avoid dry rejections
        const availableBackup = rooms.find((r) => r.status === RoomStatus.Available && isRoomAvailable(r.number, gCheckIn, gCheckOut));
        if (availableBackup) {
          assignedRoom = availableBackup.number;
          errors.gRoomType = `Optimized Allocation: room class ${gRoomType} was occupied. Upgraded/re-allotted to Room ${availableBackup.number} (${availableBackup.type})`;
          setGRoomType(availableBackup.type);
        } else {
          alert("We are fully committed for those stay dates. Please try another period or room class.");
          return;
        }
      }

      // Save Guest database profile
      const newG = saveGuest({
        firstName: guestFirst,
        lastName: guestLast,
        email: guestEmail,
        phone: guestPhone,
        idType: "Passport",
        idNumber: "GUEST-AUTO-WEB",
        loyaltyTier: guests.length > 0 ? guests[0].loyaltyTier : "Bronze" as any
      });

      // Calculate checkout final pricing
      const finalCost = getStayRateEstimate(gRoomType, assignedRoom, gCheckIn, gCheckOut, gPackageId);

      // Create Reservation record
      const reserved = createReservation({
        guestId: newG.id,
        guestName: `${guestFirst} ${guestLast}`,
        roomNumber: assignedRoom,
        roomType: gRoomType,
        checkInDate: gCheckIn,
        checkOutDate: gCheckOut,
        totalAmount: finalCost,
        status: ReservationStatus.Confirmed,
        packageBundleId: gPackageId || undefined,
        notes: gNotes ? `${gNotes} (Online Self-Book; Guests: ${guestCount})` : `Online Guest Portal (Guests: ${guestCount})`
      });

      // Advance to success page with confirmation
      setConfirmedRes(reserved);
      setBookingStep(4);
    }
  };

  // Reset form to book again
  const handleResetForm = () => {
    setBookingStep(1);
    setGuestFirst("");
    setGuestLast("");
    setGuestEmail("");
    setGuestPhone("");
    setGuestCount(2);
    setGRoomType(RoomType.Standard);
    setGCheckIn("2026-06-22");
    setGCheckOut("2026-06-25");
    setGPackageId("");
    setGNotes("");
    setConfirmedRes(null);
  };

  // Handler for adding dynamic Activity Add-on from Staff & Guest tab
  const handleAddServiceAddon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!srvResId) {
      setAddonMessage("❌ Please select a target guest reservation.");
      return;
    }
    if (!srvId) {
      setAddonMessage("❌ Please choose a specific service catalog item.");
      return;
    }

    const matchedRes = reservations.find((r) => r.id === srvResId);
    const matchedSrv = services.find((s) => s.id === srvId);
    if (!matchedRes || !matchedSrv) {
      setAddonMessage("❌ Error fetching reservation or service profiles.");
      return;
    }

    const price = matchedSrv.rate * srvQty;
    bookService({
      serviceId: srvId,
      serviceName: matchedSrv.name,
      reservationId: srvResId,
      guestName: matchedRes.guestName,
      date: srvDate,
      time: srvTime,
      quantity: srvQty,
      totalCost: price,
      status: "Pending",
      staffAssigned: srvStaff
    });

    setAddonMessage(`💚 Activity [${matchedSrv.name}] successfully booked for ${matchedRes.guestName}. Total $${price} allocated on Invoice!`);
    // auto reset list
    setTimeout(() => setAddonMessage(""), 5000);
  };

  // Helper colors for reservation calendars
  const getStatusBgColor = (status: ReservationStatus) => {
    switch (status) {
      case ReservationStatus.Confirmed:
        return "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100";
      case ReservationStatus.CheckedIn:
        return "bg-amber-50 border-amber-205 text-amber-800 hover:bg-amber-100";
      case ReservationStatus.CheckedOut:
        return "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100";
      case ReservationStatus.Cancelled:
        return "bg-slate-100 border-slate-200 text-slate-500 line-through hover:bg-slate-150";
      default:
        return "bg-slate-50 border-slate-200 text-slate-700";
    }
  };

  const getStatusBadgeStyle = (status: ReservationStatus) => {
    switch (status) {
      case ReservationStatus.Confirmed:
        return "bg-indigo-100 text-indigo-800 border border-indigo-205";
      case ReservationStatus.CheckedIn:
        return "bg-amber-100 text-amber-900 border border-amber-250";
      case ReservationStatus.CheckedOut:
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case ReservationStatus.Cancelled:
        return "bg-slate-100 text-slate-500 border border-slate-200";
      default:
        return "bg-slate-100 text-slate-705";
    }
  };

  // Helper filter results
  const filteredReservations = reservations.filter((r) => {
    const matchesSearch = r.guestName.toLowerCase().includes(searchTerm.toLowerCase()) || r.roomNumber.includes(searchTerm) || r.id.includes(searchTerm);
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    const matchesRoomType = roomTypeFilter === "ALL" || r.roomType === roomTypeFilter;
    const matchesCheckIn = !filterCheckInDate || r.checkInDate === filterCheckInDate;
    return matchesSearch && matchesStatus && matchesRoomType && matchesCheckIn;
  });

  const getReservationOnDate = (roomNum: string, dateStr: string) => {
    return reservations.find((res) => {
      if (res.status === ReservationStatus.Cancelled) return false;
      return res.roomNumber === roomNum && dateStr >= res.checkInDate && dateStr < res.checkOutDate;
    });
  };

  // Shift Calendar timeline dates offset
  const handleNavigateWeeks = (daysOffset: number) => {
    const d = new Date(calendarStartDate);
    d.setDate(d.getDate() + daysOffset);
    setCalendarStartDate(d.toISOString().split("T")[0]);
  };

  const handleTriggerExternalSync = () => {
    setSyncStep("connecting");
    setTimeout(() => {
      setSyncStep("success");
    }, 2000);
  };

  return (
    <div className="space-y-6" id="reservation-activities-grand-panel">
      
      {/* MODULE HEADER AND MAIN SUITE INTROTABS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-650 rounded-xl" id="res-module-logo-p">
              <Calendar className="w-5 h-5 text-indigo-600 animate-pulse" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight font-sans">
                Reservation Activities Platform
              </h2>
              <p className="text-xs text-slate-400">
                Luxe OmniSuite automated calendar blocks, self-service portals, activity planners, and external calendar synchronization.
              </p>
            </div>
          </div>
        </div>

        {/* ROLE INDICATOR OR NOTICES */}
        <div className="flex items-center gap-2">
          <span className="bg-slate-50 border border-slate-205 text-slate-600 text-2xs font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1 font-mono uppercase">
            <Sliders className="w-3.5 h-3.5" /> ROLE: {activeRole}
          </span>
          <button 
            type="button"
            onClick={() => {
              setActiveSubTab("form");
              setBookingStep(1);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Book Offline
          </button>
        </div>
      </div>

      {/* CORE NAVIGATION DEBATED BAR */}
      <div className="flex gap-1.5 overflow-x-auto border-b border-slate-200 pb-px" id="res-navigation-tablist">
        <button
          onClick={() => setActiveSubTab("calendar")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === "calendar"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/10 font-bold"
              : "border-transparent text-slate-450 hover:text-slate-700 bg-transparent"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Stay Calendar Grid ({calendarView.toUpperCase()})
        </button>

        <button
          onClick={() => setActiveSubTab("ledger")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === "ledger"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/10 font-bold"
              : "border-transparent text-slate-450 hover:text-slate-700 bg-transparent"
          }`}
          id="btn-ledger-subtab"
        >
          <Sliders className="w-4 h-4" />
          Dashboard Ledger ({filteredReservations.length})
        </button>

        <button
          onClick={() => {
            setActiveSubTab("form");
            setBookingStep(1);
          }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === "form"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/10 font-bold"
              : "border-transparent text-slate-450 hover:text-slate-700 bg-transparent"
          }`}
          id="btn-form-subtab"
        >
          <Globe className="w-4 h-4 text-emerald-500 animate-spin-slow" />
          Guest Reservation Portal (Guest Side)
        </button>

        <button
          onClick={() => setActiveSubTab("addons")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === "addons"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/10 font-bold"
              : "border-transparent text-slate-450 hover:text-slate-700 bg-transparent"
          }`}
          id="btn-addons-subtab"
        >
          <Award className="w-4 h-4 text-amber-500" />
          Activity Add-Ons &amp; Packages
        </button>
      </div>

      {/* SUB-TAB PANELS COMPILATION */}

      {/* PANEL 1: 📅 ROOMS & OPERATIONS CALENDAR GRID */}
      {activeSubTab === "calendar" && (
        <div className="space-y-6 animate-fade-in" id="calendar-operations-view">
          
          {/* Calendar Toolbar Panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-3xs">
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-850 text-sm tracking-tight flex items-center gap-1.5">
                <Calendar className="w-4.5 h-4.5 text-indigo-600" />
                Operational Occupancy Board
              </h3>
              <p className="text-[10.5px] text-slate-400">
                Visual grid tracking vacancy allocations. Choose perspective format to optimize arrivals planning.
              </p>
            </div>

            {/* View selectors and navigate wrappers */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Day / Week / Month selector */}
              <div className="inline-flex rounded-lg border border-slate-205 p-1 bg-slate-50 text-[10.5px]">
                {(["day", "week", "month"] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setCalendarView(view)}
                    className={`px-2.5 py-1 rounded-md font-bold uppercase transition cursor-pointer ${
                      calendarView === view ? "bg-white text-indigo-700 shadow-xs" : "text-slate-450 hover:text-slate-800"
                    }`}
                  >
                    {view}
                  </button>
                ))}
              </div>

              {/* Offset Navigation controls */}
              <div className="flex items-center gap-1.5 border border-slate-205 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => handleNavigateWeeks(calendarView === "day" ? -1 : calendarView === "month" ? -28 : -7)}
                  className="p-1 rounded-sm hover:bg-slate-100 text-slate-500 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <input
                  type="date"
                  className="text-xs bg-transparent border-none focus:outline-hidden p-0 px-1 font-mono text-slate-700 cursor-pointer"
                  value={calendarStartDate}
                  onChange={(e) => setCalendarStartDate(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => handleNavigateWeeks(calendarView === "day" ? 1 : calendarView === "month" ? 28 : 7)}
                  className="p-1 rounded-sm hover:bg-slate-100 text-slate-500 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Sync External button trigger */}
              <button
                type="button"
                onClick={() => {
                  setShowSyncModal(true);
                  setSyncStep("idle");
                }}
                className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-600 animate-spin-slow" /> Calendar Sync
              </button>
            </div>
          </div>

          {/* Calendar Matrix Board */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs overflow-x-auto">
            <div className="min-w-[850px]">
              
              {/* Header dates rows mapping */}
              <div className="grid grid-cols-8 border-b border-slate-150 pb-2.5 text-center text-2xs font-extrabold text-slate-450 uppercase tracking-wider">
                <div className="text-left pl-3 text-slate-800">Unit Room Blocks</div>
                {activeDates.map((dateVal) => {
                  const dayLabel = new Date(dateVal).toLocaleDateString("en-US", { weekday: "short" });
                  const dayNum = dateVal.split("-")[2];
                  const dMonth = new Date(dateVal).toLocaleDateString("en-US", { month: "short" });
                  const isToday = dateVal === "2026-06-22"; // simulation calendar check date

                  return (
                    <div
                      key={dateVal}
                      className={`py-1.5 rounded-lg flex flex-col items-center justify-center ${
                        isToday ? "bg-red-500 text-white font-black" : "bg-slate-50/50 text-slate-700 border border-slate-50"
                      }`}
                    >
                      <span className="text-[10px] leading-none">{dayLabel}</span>
                      <span className="text-xs font-extrabold mt-0.5">{dayNum} {calendarView === "month" && dMonth}</span>
                    </div>
                  );
                })}
              </div>

              {/* Grid Entries matrix listings */}
              <div className="space-y-1.5 mt-3.5">
                {rooms.map((room) => {
                  return (
                    <div
                      key={room.id}
                      className="grid grid-cols-8 items-center border border-slate-100 rounded-xl hover:bg-slate-50/30 py-1 transition-all"
                      id={`timeline-row-${room.number}`}
                    >
                      {/* Name of room unit column */}
                      <div className="pl-3 py-1">
                        <span className="font-extrabold text-slate-800 block text-xs">Room {room.number}</span>
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider bg-slate-50 w-max px-1.5 py-0.5 rounded border mt-0.5">
                          {room.type}
                        </span>
                      </div>

                      {/* Display cells for stays */}
                      {activeDates.map((dateStr) => {
                        const res = getReservationOnDate(room.number, dateStr);
                        
                        // Default vacant placeholder
                        let cellContent = (
                          <div 
                            className="h-10 rounded-lg bg-slate-50/30 border border-dashed border-slate-200/50 m-1 flex flex-col items-center justify-center text-[9.5px] text-slate-350 select-none hover:bg-indigo-50/10 hover:border-indigo-300 transition-all cursor-pointer"
                            onClick={() => {
                              setActiveSubTab("form");
                              setGRoomType(room.type);
                              setGCheckIn(dateStr);
                              const nextD = new Date(dateStr);
                              nextD.setDate(nextD.getDate() + 3);
                              setGCheckOut(nextD.toISOString().split("T")[0]);
                              setBookingStep(1);
                            }}
                          >
                            <span className="font-semibold block text-[8px] uppercase tracking-wider text-slate-300">Vacant Block</span>
                            <span className="text-[8px] font-mono text-slate-400">${room.baseRate}/Ngt</span>
                          </div>
                        );

                        if (res) {
                          const customStyle = getStatusBgColor(res.status);
                          
                          cellContent = (
                            <div
                              key={res.id}
                              className={`h-10 rounded-lg border m-1 p-1.5 text-[9px] font-bold leading-none flex flex-col justify-center truncate cursor-pointer transition select-none ${customStyle} shadow-3xs`}
                              onClick={() => setSelectedCalendarResId(res.id)}
                              title={`Guest: ${res.guestName}, Stay: ${res.checkInDate} to ${res.checkOutDate} (${res.status})`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-black block truncate leading-none text-slate-800">{res.guestName}</span>
                              </div>
                              <span className="text-[8px] opacity-80 mt-1 tracking-tight font-mono uppercase block">{res.status} &bull; ${res.totalAmount}</span>
                            </div>
                          );
                        }

                        return <div key={dateStr}>{cellContent}</div>;
                      })}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          {/* Popover Focus Panel on clicking stay item */}
          {selectedCalendarResId && (() => {
            const currentRes = reservations.find((r) => r.id === selectedCalendarResId);
            if (!currentRes) return null;
            return (
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-750 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl mb-4 animate-slide-in">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-600 text-white font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded">CONCENTRATE</span>
                    <span className="text-slate-400 text-xs font-mono font-bold">Booking Reference: {currentRes.id}</span>
                  </div>
                  <h4 className="font-black text-slate-100 text-sm">{currentRes.guestName} &mdash; Staying in Room {currentRes.roomNumber} ({currentRes.roomType})</h4>
                  <p className="text-[11px] text-slate-400">
                    Stay Timeline: <strong className="text-white">{currentRes.checkInDate}</strong> to <strong className="text-white">{currentRes.checkOutDate}</strong> ({currentRes.status} Status). Pricing locked at <strong className="text-emerald-450">${currentRes.totalAmount}</strong>.
                  </p>
                  {currentRes.notes && (
                    <p className="text-[10px] text-amber-300 italic">Special Instructions: {currentRes.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setRescheduleResId(currentRes.id);
                      setRescheduleNewCI(currentRes.checkInDate);
                      setRescheduleNewCO(currentRes.checkOutDate);
                      setRescheduleNewRoom(currentRes.roomNumber);
                      setSelectedCalendarResId(null);
                    }}
                    className="bg-indigo-650 hover:bg-indigo-600 text-indigo-50 border border-indigo-500 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
                  >
                    ✏️ Reschedule Dates
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSrvResId(currentRes.id);
                      setActiveSubTab("addons");
                      setSelectedCalendarResId(null);
                    }}
                    className="bg-slate-850 hover:bg-slate-800 border border-slate-700 text-xs font-bold px-3 py-2 rounded-xl text-slate-200 transition cursor-pointer"
                  >
                    🛎️ Add Extra Spa/Dining
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCalendarResId(null)}
                    className="text-slate-400 hover:text-white p-2 text-xs font-bold cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            );
          })()}

        </div>
      )}

      {/* PANEL 2: 📋 STAFF LEDGER AND MANAGEMENT COCKPIT */}
      {activeSubTab === "ledger" && (
        <div className="space-y-6 animate-fade-in" id="dashboard-ledger-pane">
          
          {/* Detailed search and filtering options */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
            <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Staff Ledger Search Index</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              
              {/* String matcher */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-450" />
                <input
                  type="text"
                  className="text-xs border border-slate-205 rounded-xl pl-9.5 pr-3 py-2.5 w-full bg-slate-50 focus:outline-hidden focus:border-indigo-500 font-medium text-slate-700 placeholder:text-slate-400"
                  placeholder="Guest name, room, ref..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  id="ledger-filter-text-search"
                />
              </div>

              {/* Status drop down */}
              <select
                className="text-xs border border-slate-205 rounded-xl p-2.5 bg-slate-50 focus:outline-hidden focus:border-indigo-500 font-bold text-slate-650"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                id="ledger-status-filter"
              >
                <option value="ALL">All Active Statuses</option>
                <option value={ReservationStatus.Confirmed}>Confirmed Arrivals</option>
                <option value={ReservationStatus.CheckedIn}>In-House Residents</option>
                <option value={ReservationStatus.CheckedOut}>Departed/Archived</option>
                <option value={ReservationStatus.Cancelled}>Cancelled/Released</option>
              </select>

              {/* Room type picker */}
              <select
                className="text-xs border border-slate-205 rounded-xl p-2.5 bg-slate-50 focus:outline-hidden focus:border-indigo-500 font-bold text-slate-650"
                value={roomTypeFilter}
                onChange={(e) => setRoomTypeFilter(e.target.value)}
                id="ledger-roomtype-filter"
              >
                <option value="ALL">All Room Classes</option>
                <option value={RoomType.Standard}>Standard Class</option>
                <option value={RoomType.Deluxe}>Deluxe Premium</option>
                <option value={RoomType.Suite}>Boutique Suite</option>
                <option value={RoomType.Executive}>Ambassador Executive</option>
              </select>

              {/* Date constraint */}
              <input
                type="date"
                className="text-xs border border-slate-205 rounded-xl p-2.5 bg-slate-50 focus:outline-hidden focus:border-indigo-500 font-bold text-slate-650"
                value={filterCheckInDate}
                onChange={(e) => setFilterCheckInDate(e.target.value)}
                title="Filter by arrival date"
              />

            </div>
          </div>

          {/* Ledger table card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <span className="text-xs text-slate-450 font-bold uppercase tracking-wide">Ledger Registry Accounts</span>
              <span className="bg-indigo-50 text-indigo-700 text-[10.5px] font-black px-2.5 py-1 rounded-full">
                {filteredReservations.length} stays filtered
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="min-w-full text-xs text-left" id="dashboard-ledger-table">
                <thead className="bg-slate-50 text-[10px] text-slate-550 font-black uppercase tracking-wider border-b border-slate-150">
                  <tr>
                    <th className="py-3.5 px-4">Stay ID</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Reg ID</th>
                    <th className="py-3.5 px-4 font-black">Guest Account</th>
                    <th className="py-3.5 px-4">Room Block</th>
                    <th className="py-3.5 px-4">Period Stay</th>
                    <th className="py-3.5 px-4 font-mono text-center">Invoice USD</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Operational Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
                  {filteredReservations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-400 italic">
                        No ledger accounts match the active query. Click &apos;Book Offline&apos; to register guest records.
                      </td>
                    </tr>
                  ) : (
                    filteredReservations.map((res) => {
                      const stayNights = Math.max(1, Math.ceil((new Date(res.checkOutDate).getTime() - new Date(res.checkInDate).getTime()) / (1000 * 60 * 60 * 24)));
                      
                      return (
                        <tr key={res.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-4 font-mono font-black text-indigo-650 text-xs">{res.id}</td>
                          <td className="py-3.5 px-4 text-slate-400 font-mono text-[10px] hidden md:table-cell">{res.guestId}</td>
                          <td className="py-3.5 px-4 font-extrabold text-slate-805">{res.guestName}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-extrabold text-slate-800">Room {res.roomNumber}</span>
                            <span className="text-[10px] text-slate-400 block font-bold leading-normal">{res.roomType}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1">
                              <span className="font-extrabold text-slate-700">{res.checkInDate}</span>
                              <span className="text-slate-400">&rarr;</span>
                              <span className="font-extrabold text-slate-700">{res.checkOutDate}</span>
                            </div>
                            <span className="text-[10.5px] text-slate-400 block font-medium">{stayNights} Nights Allocated</span>
                          </td>
                          <td className="py-3.5 px-4 font-black text-slate-850 text-center font-mono">${res.totalAmount}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase inline-block ${getStatusBadgeStyle(res.status)}`}>
                              {res.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              
                              {/* Reschedule Button */}
                              {res.status !== ReservationStatus.Cancelled && res.status !== ReservationStatus.CheckedOut && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRescheduleResId(res.id);
                                    setRescheduleNewCI(res.checkInDate);
                                    setRescheduleNewCO(res.checkOutDate);
                                    setRescheduleNewRoom(res.roomNumber);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-850 bg-indigo-50/80 hover:bg-indigo-100 px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer"
                                  title="Reschedule Stay Dates"
                                >
                                  Modify Stay
                                </button>
                              )}

                              {/* Allocate Add-on Service button */}
                              {res.status === ReservationStatus.CheckedIn && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSrvResId(res.id);
                                    setActiveSubTab("addons");
                                  }}
                                  className="text-amber-700 hover:text-amber-800 bg-amber-150 px-2 py-1 rounded text-[10px] font-extrabold transition cursor-pointer"
                                  title="Add extra room services"
                                >
                                  + Extras
                                </button>
                              )}

                              {/* Cancellation control */}
                              {res.status === ReservationStatus.Confirmed && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Cancel reservation block for ${res.guestName}? Room ${res.roomNumber} will be released.`)) {
                                      updateReservationStatus(res.id, ReservationStatus.Cancelled);
                                    }
                                  }}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition cursor-pointer"
                                  title="Instant Cancel stays"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}

                              {/* Completed Notice */}
                              {res.status === ReservationStatus.CheckedOut && (
                                <span className="text-[10px] text-slate-400 italic">Departed, Invoice Settled</span>
                              )}

                              {/* Cancelled placeholder */}
                              {res.status === ReservationStatus.Cancelled && (
                                <span className="text-[10px] text-slate-400 font-mono">Released Block</span>
                              )}

                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PANEL 3: 🏨 GUEST SELF-SERVICE RESERVATION PORTAL (GUEST SIDE) */}
      {activeSubTab === "form" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in" id="guest-booking-portal">
          
          {/* Form Side layout (Col Span 2) */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs relative">
              
              {/* Portal brand and progress tracking */}
              <div className="border-b border-slate-100 pb-5 mb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[9.5px] uppercase font-bold tracking-widest text-emerald-600 block flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-emerald-500 animate-spin-slow" /> Active Guest Self-Service Booking Server
                  </span>
                  <h3 className="text-base font-black text-slate-805">Create Web Booking</h3>
                  <p className="text-[10px] text-slate-400">
                    Direct access for client reservations. Perfect for website simulations and kiosk environments.
                  </p>
                </div>

                {/* Flow wizard metrics */}
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  {[1, 2, 3, 4].map((step) => (
                    <span
                      key={step}
                      className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                        bookingStep === step
                          ? "bg-indigo-600 text-white shadow-2xs font-bold scale-[1.08]"
                          : bookingStep > step
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-200 text-slate-550"
                      }`}
                    >
                      {step === 4 ? "✓" : step}
                    </span>
                  ))}
                </div>
              </div>

              {/* Step Forms rendering */}
              {bookingStep === 1 && (
                <form onSubmit={handleGuestSubmit} className="space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1 bg-slate-50 p-2 rounded">
                    <span>1.</span> Decide Stay Dates &amp; Room Preference
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-2xs font-extrabold text-slate-450 uppercase block font-sans">Check-In Date</label>
                      <input
                        type="date"
                        className="text-xs text-slate-700 w-full border border-slate-250 rounded-xl p-3 bg-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                        value={gCheckIn}
                        onChange={(e) => setGCheckIn(e.target.value)}
                        required
                      />
                      {gErrors.gCheckIn && <p className="text-[10px] text-rose-500 mt-1 font-bold">{gErrors.gCheckIn}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-2xs font-extrabold text-slate-450 uppercase block font-sans">Check-Out Date</label>
                      <input
                        type="date"
                        className="text-xs text-slate-700 w-full border border-slate-250 rounded-xl p-3 bg-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                        value={gCheckOut}
                        onChange={(e) => setGCheckOut(e.target.value)}
                        required
                      />
                      {gErrors.gCheckOut && <p className="text-[10px] text-rose-500 mt-1 font-bold">{gErrors.gCheckOut}</p>}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-2xs font-extrabold text-slate-450 uppercase block font-sans">Choose Suite Room Tier</label>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { type: RoomType.Standard, price: 120, desc: "Twin double bedding, High speed fiber WIFI, Hot showers" },
                        { type: RoomType.Deluxe, price: 200, desc: "Ocean View, Queen size bedding, Smart LED TV, Mini Fridge" },
                        { type: RoomType.Suite, price: 350, desc: "Penthouse design, Private balcony, Bath tub, Living area" },
                        { type: RoomType.Executive, price: 550, desc: "24/7 Butler care, Helipad access, Spa room reservation priority" }
                      ].map((item) => (
                        <div
                          key={item.type}
                          onClick={() => setGRoomType(item.type)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between h-28 hover:shadow-2xs select-none ${
                            gRoomType === item.type
                              ? "border-indigo-600 bg-indigo-50/20 text-indigo-900"
                              : "border-slate-205 bg-white text-slate-700 hover:border-slate-350"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-extrabold text-xs block">{item.type} Class</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                              gRoomType === item.type ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-650"
                            }`}>
                              ${item.price}/Ngt
                            </span>
                          </div>
                          <p className="text-[9.5px] leading-normal opacity-80 font-sans mt-1">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submission and estimates */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold leading-none uppercase">Forecast Rate Stay</span>
                      <strong className="text-sm font-black text-slate-805 mt-1 block">
                        ${getStayRateEstimate(gRoomType, "", gCheckIn, gCheckOut, gPackageId)} USD
                      </strong>
                    </div>

                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      Choose Stays <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}

              {bookingStep === 2 && (
                <form onSubmit={handleGuestSubmit} className="space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1 bg-slate-50 p-2 rounded">
                    <span>2.</span> Key Guest Contact &amp; Accompanying list
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-2xs font-extrabold text-slate-450 uppercase block font-sans">First Given Name</label>
                      <input
                        type="text"
                        className="text-xs text-slate-700 w-full border border-slate-250 rounded-xl p-3 bg-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                        placeholder="John"
                        value={guestFirst}
                        onChange={(e) => setGuestFirst(e.target.value)}
                        required
                      />
                      {gErrors.guestFirst && <p className="text-[10px] text-rose-500 mt-1 font-bold">{gErrors.guestFirst}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-2xs font-extrabold text-slate-450 uppercase block font-sans">Last Family Name</label>
                      <input
                        type="text"
                        className="text-xs text-slate-700 w-full border border-slate-250 rounded-xl p-3 bg-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                        placeholder="Smith"
                        value={guestLast}
                        onChange={(e) => setGuestLast(e.target.value)}
                        required
                      />
                      {gErrors.guestLast && <p className="text-[10px] text-rose-500 mt-1 font-bold">{gErrors.guestLast}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-2xs font-extrabold text-slate-450 uppercase block font-sans">Digital Email (Notification Hub)</label>
                      <input
                        type="email"
                        className="text-xs text-slate-700 w-full border border-slate-250 rounded-xl p-3 bg-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                        placeholder="guest@domain.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        required
                      />
                      {gErrors.guestEmail && <p className="text-[10px] text-rose-500 mt-1 font-bold">{gErrors.guestEmail}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-2xs font-extrabold text-slate-450 uppercase block font-sans">Phone Number (SMS receipt)</label>
                      <input
                        type="tel"
                        className="text-xs text-slate-700 w-full border border-slate-250 rounded-xl p-3 bg-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                        placeholder="+1 (555) 012-3456"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        required
                      />
                      {gErrors.guestPhone && <p className="text-[10px] text-rose-500 mt-1 font-bold">{gErrors.guestPhone}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-2xs font-extrabold text-slate-450 uppercase block font-sans">Number of Guests</label>
                      <select
                        className="text-xs border border-slate-255 rounded-xl p-3.5 bg-white focus:outline-hidden focus:border-indigo-500 font-bold text-slate-700 w-full"
                        value={guestCount}
                        onChange={(e) => setGuestCount(Number(e.target.value))}
                      >
                        <option value={1}>1 Guest (Single Bed Room)</option>
                        <option value={2}>2 Guests (Double Stay)</option>
                        <option value={3}>3 Guests (Includes Sofa bunk)</option>
                        <option value={4}>4 Guests (Family suite)</option>
                        <option value={6}>6 Guests (Ambassador suite maximum)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-2xs font-extrabold text-slate-450 uppercase block font-sans">Estimated check-in arrival hour</label>
                      <select className="text-xs border border-slate-255 rounded-xl p-3.5 bg-white font-bold text-slate-700 w-full">
                        <option>14:00 (Standard Hour)</option>
                        <option>16:00 (Late Check-in)</option>
                        <option>10:00 (Early Arrival Request)</option>
                        <option>00:00 Mid Night Checkin</option>
                      </select>
                    </div>
                  </div>

                  {/* Submission and navigation */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setBookingStep(1)}
                      className="text-slate-500 text-xs font-bold hover:underline cursor-pointer"
                    >
                      Back to Date choice
                    </button>

                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      Add Extra Services <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}

              {bookingStep === 3 && (
                <form onSubmit={handleGuestSubmit} className="space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1 bg-slate-50 p-2 rounded">
                    <span>3.</span> Complete Add-On Promotion Bundles &amp; Settle Payments
                  </h4>

                  {/* Optional bundles catalog */}
                  <div className="space-y-2">
                    <label className="text-2xs font-extrabold text-slate-450 uppercase block font-sans">Apply Promotion Package Addition (Optional)</label>
                    <select
                      className="text-xs text-slate-650 w-full border border-slate-205 rounded-xl p-3 bg-white font-bold"
                      value={gPackageId}
                      onChange={(e) => setGPackageId(e.target.value)}
                    >
                      <option value="">-- No Extra Bundle Applied --</option>
                      {packageBundles.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} &mdash; Flat {pkg.discountPercentage}% Discount! Includes luxury breakfast and spa vouchers.
                        </option>
                      ))}
                    </select>
                    <span className="text-[10.5px] text-slate-400 block font-sans">
                      Applying bundles gives you a discount on base stay charges while including complimentary activity services.
                    </span>
                  </div>

                  {/* Settle pay method selector */}
                  <div className="space-y-2 pt-2 border-t border-slate-50">
                    <label className="text-2xs font-extrabold text-slate-450 uppercase block font-sans">Submit Secure Payment Method</label>
                    
                    <div className="grid grid-cols-3 gap-2 text-2xs font-bold text-slate-700 uppercase">
                      {[
                        { method: PaymentMethod.CreditCard, icon: "💳 Credit Card" },
                        { method: PaymentMethod.Cash, icon: "💵 Cash Desk" },
                        { method: PaymentMethod.Web3Wallet, icon: "🦊 Web3 Wallet" }
                      ].map((pay) => (
                        <div
                          key={pay.method}
                          onClick={() => setGPayment(pay.method)}
                          className={`p-3 rounded-xl border text-center transition cursor-pointer select-none ${
                            gPayment === pay.method ? "border-indigo-600 bg-indigo-50/10" : "border-slate-150 bg-white"
                          }`}
                        >
                          <span>{pay.icon}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-2xs font-extrabold text-slate-455 uppercase block font-sans">Special requests or arrangements</label>
                    <textarea
                      className="text-xs text-slate-700 w-full border border-slate-200 rounded-xl p-2 bg-white h-16 focus:outline-hidden"
                      placeholder="Extra pillows, wheelchair assistance, honey moon package..."
                      value={gNotes}
                      onChange={(e) => setGNotes(e.target.value)}
                    />
                  </div>

                  {/* Pricing estimate display */}
                  <div className="bg-emerald-50 border border-emerald-205 text-emerald-805 p-3.5 rounded-xl flex items-center justify-between shadow-3xs text-xs font-extrabold">
                    <span className="text-emerald-700">Locked pricing inclusive of taxes &amp; discounts:</span>
                    <span className="text-sm font-black text-emerald-900">
                      ${getStayRateEstimate(gRoomType, "", gCheckIn, gCheckOut, gPackageId)} USD
                    </span>
                  </div>

                  {/* Submission and navigation */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setBookingStep(2)}
                      className="text-slate-500 text-xs font-bold hover:underline cursor-pointer"
                    >
                      Back to Personal info
                    </button>

                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-6 py-3 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md"
                    >
                      🔔 Lock In Reservation!
                    </button>
                  </div>
                </form>
              )}

              {bookingStep === 4 && confirmedRes && (
                <div className="py-6 text-center space-y-6 animate-fade-in">
                  
                  {/* Success banner */}
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <span className="p-4 bg-emerald-50 text-emerald-600 rounded-full inline-block">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-bounce" />
                    </span>
                    <h3 className="text-base font-black text-slate-805">Reservation Confirmed Flawlessly!</h3>
                    <p className="text-xs text-slate-400">
                      Stay reference id is locked in the system active rooms registry.
                    </p>
                  </div>

                  {/* Mini physical layout invoice ticket */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-205 max-w-sm mx-auto text-left text-2xs space-y-3 font-mono text-slate-650 shadow-sm relative overflow-hidden">
                    
                    <div className="absolute top-0 right-0 p-1 bg-emerald-500 text-white text-[8px] font-bold uppercase tracking-widest pl-3 pr-3 transform rotate-45 translate-x-3 translate-y-2">
                      PAID
                    </div>

                    <div className="border-b border-dashed border-slate-200 pb-2 mb-2 font-black text-slate-800 text-center">
                      LUXE OMNISUITE HOTEL RECEIPT
                    </div>

                    <div className="flex justify-between">
                      <span>STAY REF:</span>
                      <strong className="text-indigo-650">{confirmedRes.id}</strong>
                    </div>

                    <div className="flex justify-between">
                      <span>PRIMARY GUEST:</span>
                      <strong className="text-slate-800">{confirmedRes.guestName}</strong>
                    </div>

                    <div className="flex justify-between">
                      <span>COMPARTMENT ROOM:</span>
                      <strong className="text-slate-800">Room {confirmedRes.roomNumber} ({confirmedRes.roomType})</strong>
                    </div>

                    <div className="flex justify-between">
                      <span>STAY SCHEDULE:</span>
                      <strong className="text-slate-850 font-sans text-[10px]">{confirmedRes.checkInDate} &rarr; {confirmedRes.checkOutDate}</strong>
                    </div>

                    <div className="border-t border-dashed border-slate-200 pt-2 flex justify-between font-extrabold text-slate-800 text-xs">
                      <span>REVENUE POSTED:</span>
                      <span>${confirmedRes.totalAmount} USD</span>
                    </div>

                  </div>

                  {/* Reset trigger */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs px-5 py-2.5 rounded-xl border border-indigo-200 transition cursor-pointer"
                    >
                      Book Another Online Stay
                    </button>
                  </div>

                </div>
              )}

            </div>
          </div>

          {/* Simulated Mobile Phone container side (Col Span 1) */}
          <div className="space-y-6">
            
            {/* Interactive phone preview of SMS notification */}
            <div className="bg-slate-900 p-6 rounded-3xl border-8 border-slate-800 shadow-2xl relative w-full h-[470px] flex flex-col justify-between overflow-hidden" id="phone-simulation-gadget">
              
              {/* Speaker camera bar top */}
              <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto flex items-center justify-center shrink-0">
                <span className="w-2 h-2 rounded-full bg-slate-950 inline-block mr-1"></span>
                <span className="w-8 h-1 bg-slate-950 inline-block rounded"></span>
              </div>

              {/* Dynamic screen area */}
              <div className="flex-1 bg-slate-950 rounded-xl p-3.5 flex flex-col justify-between text-white font-sans text-xs select-none">
                
                {/* Simulated carrier and bars */}
                <div className="flex items-center justify-between text-[8px] opacity-70 font-mono tracking-wider font-extrabold border-b border-slate-850 pb-1.5">
                  <span>📶 OMNI-MOBILE 5G</span>
                  <span>100%🔋  08:30 AM</span>
                </div>

                {/* Notifications and center block container */}
                <div className="my-auto space-y-4">
                  {bookingStep === 4 && confirmedRes ? (
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl space-y-2.5 animate-slide-in shadow-lg">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                        <span className="font-extrabold text-[8px] text-indigo-400 block uppercase font-mono">📢 SMS Dispatched</span>
                        <span className="text-[8px] text-slate-400">just now</span>
                      </div>
                      
                      <div className="space-y-1">
                        <strong className="text-[10px] text-slate-100 block font-mono">Luxe Resort Concierge:</strong>
                        <p className="text-[10px] text-slate-350 leading-relaxed font-sans">
                          &quot;Dear {guestFirst || "Evelyn"}, your stay is confirmed! Room: <strong className="text-emerald-400">{confirmedRes.roomNumber}</strong>. Dates: {confirmedRes.checkInDate} to {confirmedRes.checkOutDate}. Booking ID: <span className="font-mono text-indigo-350 font-bold">{confirmedRes.id}</span>. We await your arrival!&quot;
                        </p>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-950/60 p-1.5 rounded text-[8.5px] text-slate-450 border border-slate-850">
                        <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">Sent check-in voucher to {guestEmail || "guest@mail.com"}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-center py-8">
                      <span className="p-3 bg-indigo-50/10 text-indigo-400 rounded-full inline-block animate-pulse">
                        <Smartphone className="w-7 h-7 text-indigo-400" />
                      </span>
                      <strong className="text-[11px] text-slate-200 block">Digital Receipt Dashboard</strong>
                      <p className="text-[10.5px] text-slate-500 leading-normal font-medium font-sans">
                        Complete stay requirements on the booking form. A live simulated text/email notice will feed directly to this mobile mockup!
                      </p>
                    </div>
                  )}
                </div>

                {/* Home Indicator bottom bar */}
                <div className="border-t border-slate-850 pt-2 font-mono text-[9px] text-center opacity-60">
                  Slide up to enter Luxe Suite
                </div>

              </div>

            </div>

            {/* Informational Guidelines Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-start gap-2.5 shadow-2xs">
              <Info className="w-4.5 h-4.5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h5 className="font-extrabold text-slate-800 text-xs">Self-service Auto Assignment</h5>
                <p className="text-[10.5px] text-slate-400 leading-normal font-medium font-sans">
                  The checkout engine implements dynamic reservation matching. When room types conflict, it triggers back-channel availability searches to reallocate vacancies, minimizing guest dry refusals.
                </p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* PANEL 4: 🛎️ ADD-ON ACTIVITIES & PACKAGES */}
      {activeSubTab === "addons" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in" id="addons-menu-activities">
          
          {/* List of Addon activities catalog (Col Span 2) */}
          <div className="xl:col-span-2 space-y-6">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-850 text-sm flex items-center gap-1">
                  <Award className="w-4.5 h-4.5 text-amber-500" />
                  Premium Activity Catalog
                </h3>
                <p className="text-[10.5px] text-slate-400">
                  Upsell stay experiences with luxury services directly chargeable to active invoices.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map((srv) => (
                  <div
                    key={srv.id}
                    className="border border-slate-205 p-4 rounded-xl flex items-start gap-3.5 hover:bg-slate-50/50 transition-all shadow-3xs"
                  >
                    <span className="text-3xl filter select-none shrink-0" id={`emoji-${srv.id}`}>
                      {srv.category === "Spa" ? "💆" : srv.category === "Dining" ? "🍷" : srv.category === "Gym" ? "🏋️" : srv.category === "Tours" ? "⛵" : "🎪"}
                    </span>
                    <div className="space-y-1 w-full text-left">
                      <div className="flex items-start justify-between">
                        <strong className="text-slate-800 text-xs block leading-tight font-extrabold">{srv.name}</strong>
                        <span className="text-indigo-650 font-black text-xs shrink-0 font-mono ml-2 block">${srv.rate}</span>
                      </div>
                      <p className="text-[10.5px] text-slate-450 font-medium">Category: <span className="font-bold text-slate-700">{srv.category}</span> &bull; Duration: {srv.duration}</p>
                      
                      {/* Booking allocation indicators */}
                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">Slots Available Today</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSrvId(srv.id);
                            // auto match with first check-in reservation if not set
                            if (!srvResId && reservations.length > 0) {
                              setSrvResId(reservations[0].id);
                            }
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[9.5px] px-2.5 py-1.5 rounded-lg transition shrink-0 cursor-pointer"
                        >
                          Reserve Activity
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Existing Scheduled Service bookings ledger for audits */}
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
              <span className="text-xs text-slate-450 font-black uppercase tracking-wider block">Currently Booked Guest Activities</span>
              
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-150">
                    <tr>
                      <th className="py-2.5 px-3">SB Ref</th>
                      <th className="py-2.5 px-3">Guest Name</th>
                      <th className="py-2.5 px-3">Sustained Service</th>
                      <th className="py-2.5 px-3">Assigned Team</th>
                      <th className="py-2.5 px-3">Timing schedule</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider text-center">Revenue</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-705">
                    {serviceBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/20">
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-550 text-[11px]">{b.id}</td>
                        <td className="py-2.5 px-3 font-extrabold text-slate-805">{b.guestName}</td>
                        <td className="py-2.5 px-3 font-bold">{b.serviceName}</td>
                        <td className="py-2.5 px-3 text-[10.5px] text-slate-400">{b.staffAssigned || "Not Assigned"}</td>
                        <td className="py-2.5 px-3 font-mono text-[9px]">{b.date} at {b.time}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-800 font-mono">${b.totalCost}</td>
                        <td className="py-2.5 px-3 text-right">
                          <select
                            className="text-[9px] font-bold border border-slate-150 rounded bg-white px-1 py-0.5 text-slate-705"
                            value={b.status}
                            onChange={(e) => updateServiceBookingStatus(b.id, e.target.value as any)}
                          >
                            <option value="Pending">🟡 Pending</option>
                            <option value="Completed">🟢 Executed</option>
                            <option value="Cancelled">🔴 Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Form Side - book service for guest (Col Span 1) */}
          <div className="space-y-6">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4 text-left">
              <h3 className="font-extrabold text-slate-850 text-xs uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1">
                <span>🛎️</span> Activity Booking Panel
              </h3>

              {addonMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-805 text-[10.5px] font-extrabold rounded-lg select-none animate-slide-in">
                  {addonMessage}
                </div>
              )}

              <form onSubmit={handleAddServiceAddon} className="space-y-4 text-xs font-medium text-slate-700">
                
                {/* Reservation choosing list */}
                <div className="space-y-1.5">
                  <label className="text-2xs font-extrabold text-slate-450 uppercase block font-sans">Active Resident Stay Account</label>
                  <select
                    className="text-xs text-slate-650 w-full border border-slate-205 rounded-xl p-3 bg-slate-50 focus:outline-hidden font-bold"
                    value={srvResId}
                    onChange={(e) => setSrvResId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Staying Resident --</option>
                    {reservations
                      .filter((r) => r.status === ReservationStatus.CheckedIn || r.status === ReservationStatus.Confirmed)
                      .map((res) => (
                        <option key={res.id} value={res.id}>
                          {res.guestName} &mdash; Room {res.roomNumber} ({res.id})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Service choice selector */}
                <div className="space-y-1.5">
                  <label className="text-2xs font-extrabold text-slate-455 uppercase block font-sans">Select Service Activity</label>
                  <select
                    className="text-xs text-slate-650 w-full border border-slate-205 rounded-xl p-3 bg-slate-50 focus:outline-hidden font-bold"
                    value={srvId}
                    onChange={(e) => setSrvId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Premium catalogs --</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (${s.rate} &mdash; {s.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Select scheduling date */}
                  <div className="space-y-1.5">
                    <label className="text-2xs font-extrabold text-slate-450 uppercase block font-sans">Reservation Date</label>
                    <input
                      type="date"
                      className="text-xs text-slate-655 w-full border border-slate-205 rounded-xl p-2.5 bg-slate-50 focus:outline-hidden font-bold"
                      value={srvDate}
                      onChange={(e) => setSrvDate(e.target.value)}
                    />
                  </div>

                  {/* Select hour timing */}
                  <div className="space-y-1.5">
                    <label className="text-2xs font-extrabold text-slate-450 uppercase block font-sans">Time Slot Hour</label>
                    <input
                      type="time"
                      className="text-xs text-slate-655 w-full border border-slate-205 rounded-xl p-2.5 bg-slate-50 focus:outline-hidden font-bold"
                      value={srvTime}
                      onChange={(e) => setSrvTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Quantity multiplier */}
                  <div className="space-y-1.5">
                    <label className="text-2xs font-extrabold text-slate-450 uppercase block font-sans">For / Participants</label>
                    <select
                      className="text-xs text-slate-655 w-full border border-slate-205 rounded-xl p-2.5 bg-slate-50 focus:outline-hidden font-bold"
                      value={srvQty}
                      onChange={(e) => setSrvQty(Number(e.target.value))}
                    >
                      <option value={1}>1 Participant</option>
                      <option value={2}>2 Participants</option>
                      <option value={3}>3 Family bundle</option>
                      <option value={4}>4 Group sessions</option>
                    </select>
                  </div>

                  {/* Designated representative */}
                  <div className="space-y-1.5">
                    <label className="text-2xs font-extrabold text-slate-450 uppercase block font-sans">Assigned Specialist</label>
                    <input
                      type="text"
                      className="text-xs text-slate-655 w-full border border-slate-205 rounded-xl p-2.5 bg-slate-50 focus:outline-hidden font-semibold"
                      value={srvStaff}
                      onChange={(e) => setSrvStaff(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs p-3 rounded-xl w-full transition shadow-xs text-center border-none inline-block uppercase tracking-wider cursor-pointer"
                >
                  Settle Activity Charge
                </button>

              </form>
            </div>

            {/* Included Bundles Notice Info */}
            <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-md border-none space-y-3 relative overflow-hidden">
              <span className="p-1 px-2.5 bg-indigo-500 hover:bg-indigo-650 text-white text-[8.5px] uppercase font-bold tracking-widest rounded-full leading-none inline-block">
                SYSTEM PACKAGE UPSELL INTEL
              </span>
              <h5 className="font-extrabold text-xs text-slate-200">Suite + Spa Vacation Packs</h5>
              <p className="text-[10.5px] text-slate-400 font-sans font-medium !leading-relaxed">
                Currently, applying any package bundle promotion during guest booking yields flat standard checks. Recommend applying these codes manually or custom bundling to increase overall hotel average checkout spends!
              </p>
            </div>

          </div>

        </div>
      )}

      {/* MODAL 1: RESCHEDULE GUEST STAY PERIOD DIALOG */}
      {rescheduleResId && (() => {
        const targetResObj = reservations.find((r) => r.id === rescheduleResId);
        if (!targetResObj) return null;

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-205 max-w-md w-full shadow-2xl relative text-left" id="ledger-reschedule-modal">
              <button
                type="button"
                className="absolute top-4 right-4 text-slate-450 hover:text-slate-650 p-1.5 rounded-full hover:bg-slate-50 cursor-pointer"
                onClick={() => setRescheduleResId(null)}
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-black text-slate-805 border-b border-slate-100 pb-3 mb-4 flex items-center gap-1.5">
                ✏️ Reschedule Stays &amp; Allocate Room
              </h3>

              <div className="space-y-4">
                
                {/* Stay reference information */}
                <div className="bg-slate-50 p-2.5 rounded-xl text-[10.5px] text-slate-600 font-sans border border-slate-100 space-y-1">
                  <div><strong>Guest ID:</strong> {targetResObj.guestName}</div>
                  <div><strong>Ref Code:</strong> {targetResObj.id}</div>
                  <div><strong>Class Room:</strong> {targetResObj.roomType} Tier</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  
                  {/* CI date select */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-450">Check-In Stay</label>
                    <input
                      type="date"
                      className="text-xs text-slate-705 border border-slate-205 rounded-lg p-2 bg-white w-full font-bold focus:outline-hidden focus:border-indigo-500"
                      value={rescheduleNewCI}
                      onChange={(e) => setRescheduleNewCI(e.target.value)}
                    />
                  </div>

                  {/* CO date select */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-450">Check-Out Stay</label>
                    <input
                      type="date"
                      className="text-xs text-slate-705 border border-slate-205 rounded-lg p-2 bg-white w-full font-bold focus:outline-hidden focus:border-indigo-500"
                      value={rescheduleNewCO}
                      onChange={(e) => setRescheduleNewCO(e.target.value)}
                    />
                  </div>

                </div>

                {/* Room code reassignment picker */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-450 block">Assigned Room Unit</label>
                  <select
                    className="text-xs text-slate-705 border border-slate-205 rounded-lg p-2 px-3 bg-white w-full font-bold focus:outline-hidden focus:border-indigo-500"
                    value={rescheduleNewRoom}
                    onChange={(e) => setRescheduleNewRoom(e.target.value)}
                  >
                    {rooms.map((rm) => (
                      <option key={rm.id} value={rm.number}>
                        Room {rm.number} &mdash; Floor {rm.floor} ({rm.type}) (Rate: ${rm.baseRate}/Ngt)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estimate rates preview */}
                <div className="bg-indigo-50 p-3.5 rounded-xl border border-indigo-100 flex items-center justify-between text-indigo-900 text-2xs font-extrabold shadow-3xs">
                  <span>Re-estimated cost:</span>
                  <span className="text-xs font-black">${getStayRateEstimate(targetResObj.roomType, rescheduleNewRoom, rescheduleNewCI, rescheduleNewCO, targetResObj.packageBundleId || "")} USD</span>
                </div>

                {/* Trigger panels */}
                <div className="pt-2 border-t border-slate-100 flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRescheduleResId(null)}
                    className="border border-slate-205 text-slate-600 text-2xs font-bold rounded-lg px-4 py-2 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReschedule}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-2xs font-bold rounded-lg px-4 py-2 hover:shadow-xs cursor-pointer"
                  >
                    Authorize Reschedule
                  </button>
                </div>

              </div>

            </div>
          </div>
        );
      })()}

      {/* MODAL 2: OPERATIONAL GOOGLE/OUTLOOK CALENDAR SYNC */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-205 max-w-sm w-full shadow-2xl relative text-center" id="calendar-sync-modal">
            <button
              type="button"
              className="absolute top-4 right-4 text-slate-455 hover:text-slate-655 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
              onClick={() => setShowSyncModal(false)}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Sync Steps flow */}
            {syncStep === "idle" && (
              <div className="space-y-4 py-3">
                <span className="p-3 bg-indigo-50 text-indigo-650 rounded-full inline-block">
                  <Globe className="w-8 h-8 text-indigo-600" />
                </span>
                <h3 className="font-extrabold text-slate-805 text-sm leading-tight">External Calendar Synchronizer</h3>
                <p className="text-[10.5px] text-slate-450 leading-relaxed font-sans font-medium">
                  Replicate stay blocks, check-ins, and activity schedules directly to your personal Google or Microsoft Outlook workflow calendars using dynamic web feeds.
                </p>

                <div className="space-y-2 text-left bg-slate-50 p-3 rounded-xl border border-slate-150 font-mono text-[9.5px] text-slate-655">
                  <div><strong>Feed URL (iCalendar format):</strong></div>
                  <div className="bg-white p-2 border border-slate-205 rounded font-bold break-all select-all select-none">
                    https://api.omnisuite.com/feed/calendar/feed-hms-luxe.ics
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleTriggerExternalSync}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs p-3 rounded-xl w-full cursor-pointer"
                  >
                    Sync with Google &amp; Outlook Account
                  </button>
                </div>
              </div>
            )}

            {syncStep === "connecting" && (
              <div className="py-8 space-y-4">
                <span className="p-3 bg-indigo-50 text-indigo-650 rounded-full inline-block animate-spin-slow">
                  <Globe className="w-8 h-8 text-indigo-600" />
                </span>
                <h4 className="font-extrabold text-slate-800 text-xs">Authenticating double-ended channel...</h4>
                <p className="text-[10px] text-slate-400 font-sans font-medium">
                  Connecting with Google OAuth APIs to synchronize reservation databases and room timeline tracks.
                </p>
              </div>
            )}

            {syncStep === "success" && (
              <div className="py-4 space-y-4">
                <span className="p-3.5 bg-emerald-50 text-emerald-600 rounded-full inline-block">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </span>
                <h3 className="font-extrabold text-slate-800 text-xs">Double-ended Sync Enabled!</h3>
                <p className="text-[10.5px] text-slate-455 font-sans leading-normal font-medium">
                  OmniSuite stay registers are now replicating automatically with your external calendars. Updates are checked every 30 seconds.
                </p>

                <button
                  type="button"
                  onClick={() => setShowSyncModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs p-2.5 rounded-lg w-full cursor-pointer"
                >
                  Dismiss Synchronizer
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
