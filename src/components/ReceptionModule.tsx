/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useHMS } from "../context/HMSContext";
import { Reservation, ReservationStatus, PaymentMethod, RoomStatus } from "../types";
import {
  IdCard,
  LogOut,
  Key,
  Smartphone,
  PlusSquare,
  Search,
  CheckCircle,
  AlertTriangle,
  FileText,
  Printer
} from "lucide-react";

export const ReceptionModule: React.FC = () => {
  const {
    reservations,
    rooms,
    invoices,
    guests,
    hotelProfile,
    checkInReservation,
    checkOutReservation,
    printers,
    addAuditLog
  } = useHMS();

  // Search state
  const [rcpSearch, setRcpSearch] = useState("");

  // Check In dialog state
  const [checkingInRes, setCheckingInRes] = useState<Reservation | null>(null);
  const [idType, setIdType] = useState("Passport");
  const [idNumber, setIdNumber] = useState("");
  const [assignedRoomNo, setAssignedRoomNo] = useState("");

  // Check Out dialog state
  const [checkingOutRes, setCheckingOutRes] = useState<Reservation | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CreditCard);
  const [checkoutCurrency, setCheckoutCurrency] = useState("USD");

  // Printer configuration integration inside Front Desk Checkout
  const [selectedPrinterId, setSelectedPrinterId] = useState("prt_1");
  const [isSpoolingPrint, setIsSpoolingPrint] = useState(false);
  const [printStatusMsg, setPrintStatusMsg] = useState("");
  const [checkoutStep, setCheckoutStep] = useState<"input" | "print-success">("input");
  const [settledResInvoice, setSettledResInvoice] = useState<any>(null);

  const closeCheckoutTerminal = () => {
    setCheckingOutRes(null);
    setCheckoutStep("input");
    setSettledResInvoice(null);
    setIsSpoolingPrint(false);
    setPrintStatusMsg("");
  };

  const handleSimulatePrinterSpool = (invoiceId: string, guestName: string) => {
    const selectedPr = printers.find(p => p.id === selectedPrinterId) || printers[0] || { name: "Front Desk Thermal" };
    setIsSpoolingPrint(true);
    setPrintStatusMsg("Establishing handshake with " + selectedPr.name + "...");
    
    setTimeout(() => {
      setPrintStatusMsg("Spooling byte stream PDF raster vectors...");
      setTimeout(() => {
        setPrintStatusMsg("Cutting check-out folio invoice roll...");
        setTimeout(() => {
          setIsSpoolingPrint(false);
          setPrintStatusMsg("");
          addAuditLog("PRINTER", `Printed Checkout Folio (ResID: #${checkingOutRes?.id || "N/A"}) to: ${selectedPr.name}`);
          alert(`SUCCESS: Checkout invoice spooled to ${selectedPr.name} successfully!`);
        }, 800);
      }, 800);
    }, 800);
  };

  // Filter reservations based on clerk search input
  const matchesSearch = (res: Reservation) => {
    return res.guestName.toLowerCase().includes(rcpSearch.toLowerCase()) || res.roomNumber.includes(rcpSearch);
  };

  const arrivalsToday = reservations.filter(
    (r) => r.status === ReservationStatus.Confirmed && matchesSearch(r)
  );

  const activeInHouse = reservations.filter(
    (r) => r.status === ReservationStatus.CheckedIn && matchesSearch(r)
  );

  // Trigger check in submitting
  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkingInRes) return;
    if (!idNumber) {
      alert("Please key in the Guest ID Serial to fulfill compliance audit rules.");
      return;
    }
    if (!assignedRoomNo) {
      alert("Please select a physical Room Assignment.");
      return;
    }

    checkInReservation(checkingInRes.id, idType, idNumber, assignedRoomNo);
    setCheckingInRes(null);
    setIdNumber("");
    setAssignedRoomNo("");
  };

  // Trigger checkout submit
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkingOutRes) return;

    // Retrieve invoice before completing checkout
    const invoice = getInvoiceForRes(checkingOutRes.id);
    
    // Process the actual checkout
    checkOutReservation(checkingOutRes.id, paymentMethod, checkoutCurrency);
    
    setSettledResInvoice(invoice || {
      id: "INV-CHOUT-" + Date.now().toString().slice(-4),
      guestName: checkingOutRes.guestName,
      roomCharges: 250,
      serviceCharges: 50,
      taxes: 36,
      discount: 0,
      total: 336,
      payments: []
    });

    // Go to printing & confirmation step
    setCheckoutStep("print-success");

    // Automatically trigger printing simulation in settings-configured printer
    const selectedPr = printers.find(p => p.id === selectedPrinterId) || printers[0] || { name: "Front Desk Thermal" };
    setIsSpoolingPrint(true);
    setPrintStatusMsg("Establishing handshake with " + selectedPr.name + "...");
    
    setTimeout(() => {
      setPrintStatusMsg("Rasterizing thermal fonts...");
      setTimeout(() => {
        setPrintStatusMsg("Transmitting TCP packets pool...");
        setTimeout(() => {
          setIsSpoolingPrint(false);
          setPrintStatusMsg("");
          addAuditLog("PRINTER", `Printed Checkout Folio (Invoice: #${invoice?.id || "N/A"}) to: ${selectedPr.name}`);
        }, 800);
      }, 800);
    }, 800);
  };

  // Get invoice details for checkouts
  const getInvoiceForRes = (resId: string) => {
    return invoices.find((inv) => inv.reservationId === resId);
  };

  // Local currency calculation function
  const convertUSDToLocal = (usdAmount: number, code: string) => {
    const matchedCurr = hotelProfile.currencies.find((c) => c.code === code) || hotelProfile.currencies[0];
    return {
      symbol: matchedCurr.symbol,
      amount: usdAmount * matchedCurr.rateToUSD
    };
  };

  return (
    <div className="space-y-6" id="reception-module-panel">
      {/* Upper Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-indigo-500 animate-pulse" />
          <span className="text-sm font-semibold text-slate-700 font-sans">Front Desk Reception Terminal</span>
        </div>

        <div className="relative w-full sm:w-[320px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            className="text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 focus:outline-hidden focus:border-indigo-500 text-slate-700 bg-white placeholder:text-slate-400 w-full"
            placeholder="Search arrivals or in-house guests..."
            value={rcpSearch}
            onChange={(e) => setRcpSearch(e.target.value)}
            id="reception-clerk-search"
          />
        </div>
      </div>

      {/* Grid splits Arrivals vs In-house */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Scheduled Arrivals Today */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-4" id="awaiting-arrivals-card">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <h3 className="font-semibold text-slate-700 text-sm tracking-tight flex items-center gap-2">
              <IdCard className="w-4 h-4 text-slate-500" />
              Awaiting Check-In Arrivals ({arrivalsToday.length})
            </h3>
            <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-bold">Today</span>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {arrivalsToday.length === 0 ? (
              <p className="text-center py-12 text-slate-400 text-xs">
                No pending arrivals found. Use the &apos;Reservation&apos; tab to add new walk‑ins.
              </p>
            ) : (
              arrivalsToday.map((res) => {
                const arrivalRooms = rooms.filter((r) => r.type === res.roomType && r.status === RoomStatus.Available);

                return (
                  <div key={res.id} className="bg-indigo-50/20 hover:bg-indigo-50/50 p-4 rounded-xl border border-indigo-150/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">{res.guestName}</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Booking ID: <span className="font-mono">{res.id}</span></p>
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px] text-slate-500">
                        <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-medium">Class: {res.roomType}</span>
                        <span>Date Range: {res.checkInDate} to {res.checkOutDate}</span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end gap-2 shrink-0 self-end sm:self-auto">
                      <span className="text-[10.5px] font-semibold text-slate-800 bg-white border border-slate-100 px-2 py-1 rounded">
                        Expected Rm {res.roomNumber}
                      </span>
                      <button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold rounded-lg px-2.5 py-1.5 flex items-center gap-1 transition"
                        onClick={() => {
                          setCheckingInRes(res);
                          setAssignedRoomNo(res.roomNumber); // Suggest booked room number
                        }}
                        id={`btn-check-in-${res.id}`}
                      >
                        Check In Client
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active In-house list */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-4" id="active-stays-card">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <h3 className="font-semibold text-slate-700 text-sm tracking-tight flex items-center gap-2">
              <Key className="w-4 h-4 text-slate-500 animate-pulse" />
              Active In-House Stays ({activeInHouse.length})
            </h3>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">Checked-In</span>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {activeInHouse.length === 0 ? (
              <p className="text-center py-12 text-slate-400 text-xs text-sans">
                No active in‑house stays found. Perform check‑ins on the left feed to populate.
              </p>
            ) : (
              activeInHouse.map((res) => {
                const invoice = getInvoiceForRes(res.id);
                const totalPaid = invoice ? invoice.payments.reduce((acc, p) => acc + p.amount, 0) : 0;
                const balance = invoice ? Math.max(0, invoice.total - totalPaid) : 0;

                // Simple simulated active key cards
                const mockKeyCardStatus = balance > 1000 ? "Active Key (Standard)" : "Premium VIP Fob Active";

                return (
                  <div key={res.id} className="bg-slate-50 hover:bg-slate-100/60 p-4 rounded-xl border border-slate-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition" id={`inhouse-stay-entry-${res.id}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-xs">{res.guestName}</h4>
                        <span className="bg-amber-100 text-amber-800 font-mono text-[8px] px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                          🔑 Room {res.roomNumber}
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">Verified ID: {guests.find(g => g.id === res.guestId)?.idType} ({guests.find(g => g.id === res.guestId)?.idNumber})</p>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px]">
                        <span className="text-slate-500 font-medium font-sans">Checkout: {res.checkOutDate}</span>
                        <span className="text-slate-200">|</span>
                        <span className={`${balance > 0 ? "text-amber-600 font-semibold" : "text-emerald-600 font-semibold"}`}>
                          Invoice Balance: ${balance.toFixed(2)} USD
                        </span>
                      </div>
                    </div>

                    <button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold rounded-lg px-2.5 py-1.5 flex items-center gap-1 transition self-end sm:self-auto shrink-0"
                      onClick={() => setCheckingOutRes(res)}
                      id={`btn-check-out-${res.id}`}
                    >
                      Check Out &amp; Bill
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* CHECK-IN DIALOG OVERLAY */}
      {checkingInRes && (
        <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 max-w-sm w-full shadow-2xl relative text-left">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <IdCard className="w-4 h-4 text-indigo-500" />
              ID Verification &amp; Guest Registry
            </h3>

            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Registering check-in check rules for Guest: <strong className="text-slate-700">{checkingInRes.guestName}</strong>
            </p>

            <form onSubmit={handleCheckInSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ID Document Type</label>
                <select
                  className="text-xs text-slate-650 w-full border border-slate-200 rounded-lg p-2.5 bg-white"
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                >
                  <option value="Passport">Passport</option>
                  <option value="Driver License">Driver License</option>
                  <option value="National ID">National IDCard / NIN</option>
                  <option value="Voters Card">Voters Card</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ID Document Serial / Number</label>
                <input
                  type="text"
                  className="text-xs text-slate-650 w-full border border-slate-200 rounded-lg p-2.5 bg-white"
                  placeholder="E.g., NGA9120489A"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  id="reception-id-input"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Final Room Assignment</label>
                <select
                  className="text-xs text-slate-650 w-full border border-slate-200 rounded-lg p-2.5 bg-white"
                  value={assignedRoomNo}
                  onChange={(e) => setAssignedRoomNo(e.target.value)}
                  required
                >
                  <option value="">-- Assign Vacant Room --</option>
                  {rooms.map((rm) => (
                    <option key={rm.id} value={rm.number} disabled={rm.status !== RoomStatus.Available && rm.number !== checkingInRes.roomNumber}>
                      Room {rm.number} ({rm.type}) &mdash; {rm.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-indigo-50/50 p-2.5 rounded-lg text-[10.5px] text-indigo-800 flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span className="leading-normal font-sans">Upon completion, the physical room lock status will toggle to &apos;Occupied&apos; &amp; a cleaning request is archived on guest checkout.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
                <button
                  type="button"
                  className="border border-slate-250 text-slate-600 text-xs font-semibold rounded-lg px-3 py-1.5 hover:bg-slate-50 transition"
                  onClick={() => setCheckingInRes(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg px-4 py-1.5 transition"
                  id="btn-reception-lock-signin"
                >
                  Approve Entry &amp; Program Keys
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHECK-OUT BILLING BILL DIALOG */}
      {checkingOutRes && (
        <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 max-w-md w-full shadow-2xl relative text-left">
            
            {checkoutStep === "input" ? (
              <>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                  <LogOut className="w-4 h-4 text-emerald-600" />
                  Settlement Checkout Terminal
                </h3>

                {(() => {
                  const invoice = getInvoiceForRes(checkingOutRes.id);
                  const totalPaid = invoice ? invoice.payments.reduce((acc, p) => acc + p.amount, 0) : 0;
                  const usdBalance = invoice ? Math.max(0, invoice.total - totalPaid) : 0;
                  const convertedPayment = convertUSDToLocal(usdBalance, checkoutCurrency);

                  return (
                    <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Checkout Folio Summary</p>
                        <p>Guest: <strong className="text-slate-800">{checkingOutRes.guestName}</strong></p>
                        <p>Assigned Room: <strong className="text-slate-800">Room {checkingOutRes.roomNumber}</strong></p>
                        
                        {invoice && (
                          <div className="pt-2 border-t border-slate-200 space-y-1 text-slate-600">
                            <p className="flex justify-between"><span>Room Charges:</span><span>${invoice.roomCharges}</span></p>
                            <p className="flex justify-between"><span>Service Charges:</span><span>${invoice.serviceCharges}</span></p>
                            <p className="flex justify-between"><span>Taxes ({hotelProfile.taxRate}%):</span><span>${invoice.taxes}</span></p>
                            <p className="flex justify-between font-bold text-slate-800 border-t border-slate-150 pt-1">
                              <span>Invoice Total:</span><span>${invoice.total}</span>
                            </p>
                            <p className="flex justify-between text-emerald-600">
                              <span>Total Paid (USD):</span><span>-${totalPaid.toFixed(2)}</span>
                            </p>
                            <p className="flex justify-between font-bold text-amber-700 bg-amber-50 p-1.5 rounded mt-1.5">
                              <span>Settle Balance:</span><span>${usdBalance.toFixed(2)}</span>
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Hardware printer routing selection pre-setup */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hardware Router Device</label>
                        <select
                          className="text-xs text-slate-650 w-full border border-slate-200 rounded-lg p-2.5 bg-white font-mono font-bold"
                          value={selectedPrinterId}
                          onChange={(e) => setSelectedPrinterId(e.target.value)}
                        >
                          {printers.map((p) => (
                            <option key={p.id} value={p.id}>
                              🖨️ {p.name} ({p.type}) &mdash; {p.location}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Currency Selection for payment */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Settle Currency</label>
                          <select
                            className="text-xs text-slate-650 w-full border border-slate-200 rounded-lg p-2.5 bg-white"
                            value={checkoutCurrency}
                            onChange={(e) => setCheckoutCurrency(e.target.value)}
                          >
                            {hotelProfile.currencies.map((cur) => (
                              <option key={cur.code} value={cur.code}>
                                {cur.code} ({cur.symbol})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Method</label>
                          <select
                            className="text-xs text-slate-650 w-full border border-slate-200 rounded-lg p-2.5 bg-white"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                          >
                            <option value={PaymentMethod.CreditCard}>Credit Card</option>
                            <option value={PaymentMethod.Cash}>Cash Payment</option>
                            <option value={PaymentMethod.BankTransfer}>Bank Wire Transfer</option>
                            <option value={PaymentMethod.MobileMoney}>Mobile Money (MPesa/OPay)</option>
                          </select>
                        </div>
                      </div>

                      {/* Local Amount Preview */}
                      {usdBalance > 0 && (
                        <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-lg flex items-center justify-between text-xs font-semibold">
                          <span>Total localized collection: </span>
                          <span className="text-sm font-bold text-emerald-950 font-mono">
                            {convertedPayment.symbol}{convertedPayment.amount.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
                        <button
                          type="button"
                          className="border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg px-3 py-1.5 hover:bg-slate-50 transition"
                          onClick={closeCheckoutTerminal}
                        >
                          Exit Terminal
                        </button>
                        <button
                          type="submit"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg px-4 py-1.5 transition flex items-center gap-1 cursor-pointer"
                          id="btn-reception-settle"
                        >
                          Settle &amp; Deactivate Fobs
                        </button>
                      </div>
                    </form>
                  );
                })()}
              </>
            ) : (
              // STEP 2: PRINT FOLIO CONFIRMATION & HARDWARE INTEGRATION VIEW
              <div className="space-y-4">
                <div className="text-center space-y-1.5">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-base">Checkout Folio Settled!</h3>
                  <p className="text-xs text-slate-500 leading-normal">
                    Fobs deactivated. Standard cleaning task spooled. Dynamic receipt output ready.
                  </p>
                </div>

                {/* Simulated connected printer status info */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5 text-xs">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-450 block">🖨️ Settings-Configured Device Router</span>
                  
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-slate-500">Selected Device:</span>
                    <strong className="text-slate-850 truncate font-mono">
                      {printers.find(p => p.id === selectedPrinterId)?.name || printers[0]?.name || "System Thermal printer"}
                    </strong>
                  </div>

                  {isSpoolingPrint ? (
                    <div className="bg-indigo-50 border border-indigo-150 p-2.5 rounded-lg space-y-2 animate-pulse mt-1">
                      <div className="flex justify-between items-center text-[10.5px] font-bold text-indigo-800">
                        <span>{printStatusMsg}</span>
                        <span className="font-mono text-[9px] bg-indigo-100 px-1 py-0.2 rounded">SPOOLING</span>
                      </div>
                      <div className="w-full bg-indigo-100 h-1 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full w-4/5 animate-infinite"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSimulatePrinterSpool(settledResInvoice?.id, settledResInvoice?.guestName || checkingOutRes.guestName)}
                        className="bg-white border border-slate-200.5 hover:bg-slate-100 text-slate-700 font-bold px-2 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition text-[11px] cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        Re-Submit to Setting Printer
                      </button>
                    </div>
                  )}
                </div>

                {/* System Attached Real Computer Printer Section */}
                <div className="bg-emerald-50/55 p-3.5 rounded-xl border border-emerald-150 space-y-2 text-xs text-slate-700">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-800 block">🖥️ Physical Printer Attached to Device</span>
                  <p className="text-[10px] leading-relaxed text-emerald-900 font-normal">
                    To output an high-contrast receipt folio on the physical hardware printer and drivers directly hooked to this computer/app.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      window.print();
                      addAuditLog("PRINTER", `Triggered browser-attached computer printing for Invoice PDF #${settledResInvoice?.id || "N/A"}`);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition text-xs shadow-sm cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Print to Attached Local Printer (Browser)
                  </button>
                </div>

                {/* Mini Printed Receipt Slip Template */}
                <div className="border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50/30 text-[11px] font-mono leading-relaxed text-slate-700 my-2 shadow-inner">
                  <div className="text-center font-bold text-xs uppercase tracking-widest border-b border-slate-250 pb-2 mb-2">
                    {hotelProfile.name || "HMS HOTEL SYSTEM"}
                    <span className="block text-[9.5px] font-normal leading-relaxed text-slate-500 tracking-normal italic mt-0.5">CHECKOUT RECEIPT FOLIO</span>
                  </div>
                  
                  <div className="space-y-1 font-mono text-[10.5px]">
                    <p>INVOICE REF : {settledResInvoice?.id || "INV-GEN"}</p>
                    <p>CLIENT GUEST: {settledResInvoice?.guestName || checkingOutRes.guestName}</p>
                    <p>ROOM NUMBER : Room {checkingOutRes.roomNumber}</p>
                    <p>METHOD CODES: {paymentMethod} ({checkoutCurrency})</p>
                    <div className="border-t border-dashed border-slate-250 my-2 pt-2 space-y-1">
                      <div className="flex justify-between"><span>LODGING RATE :</span><span>${settledResInvoice?.roomCharges || 0}</span></div>
                      <div className="flex justify-between"><span>AMENITIES DU :</span><span>${settledResInvoice?.serviceCharges || 0}</span></div>
                      <div className="flex justify-between"><span>TAXES STATS :</span><span>${settledResInvoice?.taxes || 0}</span></div>
                      {settledResInvoice?.discount > 0 && (
                        <div className="flex justify-between text-red-650"><span>REBATES DISC :</span><span>-${settledResInvoice?.discount}</span></div>
                      )}
                      <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-1">
                        <span>NET GRAND TOT:</span><span>${settledResInvoice?.total || 0}</span>
                      </div>
                    </div>
                    <div className="text-center font-bold text-emerald-700 bg-emerald-50/60 p-1.5 rounded-md mt-3 tracking-widest border border-emerald-120">
                      💰 COMPLIMENTARY PAID & OFF LEDGER
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeCheckoutTerminal}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg px-5 py-2 cursor-pointer transition shadow-xs"
                  >
                    Done &amp; Exit Terminal
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
