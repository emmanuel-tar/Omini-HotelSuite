/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useHMS } from "../context/HMSContext";
import { StaffRole, StaffUser } from "../types";
import {
  Settings,
  Building2,
  Coins,
  ShieldAlert,
  Percent,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Printer,
  FileText,
  Palette,
  Users,
  Plus,
  Trash2,
  UserCheck,
  CheckSquare,
  Network,
  RotateCcw,
  Sliders,
  Globe,
  Share2,
  Eye,
  Database,
  Mail,
  Smartphone,
  ShieldCheck,
  Wifi,
  DollarSign
} from "lucide-react";

// Structure for Saved Printers
interface PrinterConfig {
  id: string;
  name: string;
  type: "Thermal Roll 58mm" | "Thermal Roll 80mm" | "Office LaserJet A4" | "Dot Matrix KOT";
  connection: "Wi-Fi Network" | "USB Local Cable" | "Bluetooth" | "Ethernet LAN";
  ip: string;
  assignedRole: "All Receipts" | "Bill Invoices" | "Kitchen Orders" | "Accounting Reports" | "Front Desk Ledger";
  status: "Online" | "Offline" | "In Use";
}

// Structure for Permissions Item
interface RolePermission {
  id: string;
  category: string;
  label: string;
  adminAllowed: boolean;
  managerAllowed: boolean;
  receptionistAllowed: boolean;
  housekeepingAllowed: boolean;
  accountantAllowed: boolean;
}

export const SettingsModule: React.FC = () => {
  const {
    hotelProfile,
    updateHotelProfile,
    activeBranchId,
    setActiveBranchId,
    clearAllData,
    addAuditLog,
    staff,
    addStaffUser,
    updateStaffUserStatus
  } = useHMS();

  // Active Sub Tab
  const [activeSubTab, setActiveSubTab] = useState<"profile" | "staff" | "printers" | "docs" | "system">("profile");

  // 1. Hotel Profile & Identity state
  const [profName, setProfName] = useState(hotelProfile.name);
  const [profAddress, setProfAddress] = useState(hotelProfile.address);
  const [profEmail, setProfEmail] = useState(hotelProfile.email);
  const [profPhone, setProfPhone] = useState(hotelProfile.phone);
  const [vatRate, setVatRate] = useState(hotelProfile.taxRate);
  const [svcCharge, setSvcCharge] = useState(hotelProfile.serviceChargeRate);
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState(hotelProfile.defaultCurrencyCode || "NGN");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 2. Staff / Employee Profile State
  const [staffFilter, setStaffFilter] = useState<string>("ALL");
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>(StaffRole.Receptionist);
  const [newStaffStatus, setNewStaffStatus] = useState<"Active" | "Off-Duty" | "On-Leave">("Active");
  const [newStaffShift, setNewStaffShift] = useState("Morning Shift (07:00 - 15:00)");
  const [newStaffAvatar, setNewStaffAvatar] = useState("👩‍💼");
  const [staffSuccessMsg, setStaffSuccessMsg] = useState("");

  // Role Permissions Data State (loaded or fallback)
  const [permissions, setPermissions] = useState<RolePermission[]>(() => {
    const saved = localStorage.getItem("hms_role_permissions");
    if (saved) return JSON.parse(saved);
    return [
      { id: "p1", category: "System Configuration", label: "Configure API gateways & Corporate default profile", adminAllowed: true, managerAllowed: false, receptionistAllowed: false, housekeepingAllowed: false, accountantAllowed: false },
      { id: "p2", category: "Financial Operations", label: "Settle billing invoices, log manual adjustments & refunds", adminAllowed: true, managerAllowed: true, receptionistAllowed: true, housekeepingAllowed: false, accountantAllowed: true },
      { id: "p3", category: "Audit & Purges", label: "Trigger database formatted wipeout limits", adminAllowed: true, managerAllowed: false, receptionistAllowed: false, housekeepingAllowed: false, accountantAllowed: false },
      { id: "p4", category: "Guest Experience", label: "Register reservations, check-in guests & issue room keycards", adminAllowed: true, managerAllowed: true, receptionistAllowed: true, housekeepingAllowed: false, accountantAllowed: false },
      { id: "p5", category: "Pricing Administration", label: "Modify base accommodation room tariffs & dynamic multipliers", adminAllowed: true, managerAllowed: true, receptionistAllowed: false, housekeepingAllowed: false, accountantAllowed: false },
      { id: "p6", category: "Housekeeping & Facility Management", label: "Assign housekeeping clean/dirty tasks & change room status", adminAllowed: true, managerAllowed: true, receptionistAllowed: true, housekeepingAllowed: true, accountantAllowed: false },
      { id: "p7", category: "Analytical Reports", label: "Access and export cumulated revenue ledger sheet logs", adminAllowed: true, managerAllowed: true, receptionistAllowed: false, housekeepingAllowed: false, accountantAllowed: true }
    ];
  });

  // Save Permissions to localStorage
  const handleTogglePivotPermission = (permId: string, roleKey: "adminAllowed" | "managerAllowed" | "receptionistAllowed" | "housekeepingAllowed" | "accountantAllowed") => {
    const updated = permissions.map(p => {
      if (p.id === permId) {
        const newValue = !p[roleKey];
        addAuditLog("SECURITY", `Toggled Security Rule: [${p.category}] - [${p.label}] for role [${roleKey}] to: ${newValue ? "ALLOWED" : "BLOCKED"}`);
        return { ...p, [roleKey]: newValue };
      }
      return p;
    });
    setPermissions(updated);
    localStorage.setItem("hms_role_permissions", JSON.stringify(updated));
  };

  // 3. Printer Ecosystem State
  const [printers, setPrinters] = useState<PrinterConfig[]>(() => {
    const saved = localStorage.getItem("hms_network_printers");
    if (saved) return JSON.parse(saved);
    return [
      { id: "pr-1", name: "Front Desk Receipt Thermal", type: "Thermal Roll 80mm", connection: "Wi-Fi Network", ip: "192.168.1.101", assignedRole: "All Receipts", status: "Online" },
      { id: "pr-2", name: "F&B Bar POS Slip Thermal", type: "Thermal Roll 58mm", connection: "Bluetooth", ip: "BT:BarSlip_FD", assignedRole: "Kitchen Orders", status: "Online" },
      { id: "pr-3", name: "Accounting Ledger Laser A4", type: "Office LaserJet A4", connection: "Ethernet LAN", ip: "192.168.1.144", assignedRole: "Accounting Reports", status: "Online" }
    ];
  });

  // Printer addition variables
  const [newPrName, setNewPrName] = useState("");
  const [newPrType, setNewPrType] = useState<PrinterConfig["type"]>("Thermal Roll 80mm");
  const [newPrConn, setNewPrConn] = useState<PrinterConfig["connection"]>("Wi-Fi Network");
  const [newPrIp, setNewPrIp] = useState("192.168.1.");
  const [newPrRole, setNewPrRole] = useState<PrinterConfig["assignedRole"]>("All Receipts");

  // Default bindings state
  const [defInvoicePr, setDefInvoicePr] = useState("pr-3");
  const [defReceiptPr, setDefReceiptPr] = useState("pr-1");
  const [defReportPr, setDefReportPr] = useState("pr-3");

  // Test Print simulation state
  const [activeTestingPrinter, setActiveTestingPrinter] = useState<PrinterConfig | null>(null);
  const [testProgress, setTestProgress] = useState(0);
  const [testMsg, setTestMsg] = useState("");
  const [testSuccess, setTestSuccess] = useState(false);

  // 4. Document & Receipt Design Lab State
  const [brandColor, setBrandColor] = useState<"indigo" | "emerald" | "amber" | "rose" | "slate">("indigo");
  const [designerShowLogo, setDesignerShowLogo] = useState(true);
  const [designerLogoText, setDesignerLogoText] = useState("🏢 OMNISUITE");
  const [designerGreeting, setDesignerGreeting] = useState("Thank you for your business. We hope to welcome you back soon!");
  const [designerShowTaxes, setDesignerShowTaxes] = useState(true);
  const [designerShowServiceCharge, setDesignerShowServiceCharge] = useState(true);
  const [designerShowRoomBreakdown, setDesignerShowRoomBreakdown] = useState(true);
  const [designerShowTxIds, setDesignerShowTxIds] = useState(true);
  const [designerShowQrCode, setDesignerShowQrCode] = useState(true);
  const [designerTerms, setDesignerTerms] = useState("Invoices must be paid in full upon check-out schedules. Values are dynamically calculated according to branch conversions.");
  const [designerFooterNotes, setDesignerFooterNotes] = useState("OmniSuite Group ISO 27011 Hospitality Compliance Guaranteed");

  // 5. System Configuration variables
  const [sysNotificationChannel, setSysNotificationChannel] = useState<"email" | "sms" | "both">("both");
  const [sysBackupFrequency, setSysBackupFrequency] = useState<"hourly" | "daily" | "weekly">("daily");
  const [sysStripeSecretKey, setSysStripeSecretKey] = useState("••••••••••••••••••••••••");
  const [sysIsSandboxMode, setSysIsSandboxMode] = useState(true);

  // Persists setup configs helper
  useEffect(() => {
    localStorage.setItem("hms_network_printers", JSON.stringify(printers));
  }, [printers]);

  // Submit Corporate Profile edits
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateHotelProfile({
      ...hotelProfile,
      name: profName,
      address: profAddress,
      email: profEmail,
      phone: profPhone,
      taxRate: vatRate,
      serviceChargeRate: svcCharge,
      defaultCurrencyCode: selectedCurrencyCode
    });

    addAuditLog("SYSTEM", `Updated global hotel settings. Default Currency: ${selectedCurrencyCode}, taxRate: ${vatRate}%`);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  // Create new staff profile
  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) {
      alert("Please check employees fields are populated.");
      return;
    }
    // Context creates StaffUser
    addStaffUser({
      name: newStaffName,
      email: newStaffEmail,
      phone: newStaffPhone || "+234 (0) 800-000",
      role: newStaffRole,
      status: newStaffStatus,
      avatar: newStaffAvatar
    });

    setStaffSuccessMsg(`Hired profile created for ${newStaffName} (${newStaffRole}) successfully!`);
    
    // Clear forms
    setNewStaffName("");
    setNewStaffEmail("");
    setNewStaffPhone("");
    setNewStaffShift("Morning Shift (07:00 - 15:00)");
    
    setTimeout(() => setStaffSuccessMsg(""), 4000);
  };

  // Add network printer
  const handleAddPrinter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrName) return;

    const newPrinter: PrinterConfig = {
      id: "pr-" + Date.now(),
      name: newPrName,
      type: newPrType,
      connection: newPrConn,
      ip: newPrIp,
      assignedRole: newPrRole,
      status: "Online"
    };

    setPrinters(prev => [...prev, newPrinter]);
    addAuditLog("PRINTER", `Registered new branch network printer: ${newPrName} at ${newPrIp}`);
    setNewPrName("");
    setNewPrIp("192.168.1.");
  };

  const handleDeletePrinter = (id: string, name: string) => {
    setPrinters(prev => prev.filter(p => p.id !== id));
    addAuditLog("PRINTER", `Removed network printer interface wrapper: ${name}`);
  };

  // Trigger simulated Test Print Job
  const triggerTestPrint = (printer: PrinterConfig) => {
    setActiveTestingPrinter(printer);
    setTestProgress(10);
    setTestSuccess(false);
    setTestMsg(`Locating active printer routing node: ${printer.name}...`);

    const interval = setInterval(() => {
      setTestProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTestSuccess(true);
          setTestMsg(`Raw ESC/POS byte-array package successfully acknowledged by printer processor!`);
          addAuditLog("PRINTER", `Triggered successful test print folio receipt page on ${printer.name} [${printer.ip}]`);
          return 100;
        }
        if (p === 30) setTestMsg(`Establishing handshakes packet transport on connection scope [${printer.connection}]`);
        if (p === 65) setTestMsg(`Spooling customized document template schema. Buffer allocated...`);
        if (p === 85) setTestMsg(`Pushing raster graphics payload inline...`);
        return p + 15;
      });
    }, 450);
  };

  const handleFactoryReset = () => {
    if (confirm("🚨 DATABASE WIPE WARNING: Are you sure you want to format all local storage databases and restore initial hotel presets? This will clear all transactions, guest profiles, invoice payments, and rota shifts!")) {
      clearAllData();
      alert("System formatted. Page will reload to synchronize initial tables.");
      window.location.reload();
    }
  };

  // Helper color mappings for Document Preview
  const getColorClasses = () => {
    switch (brandColor) {
      case "emerald":
        return { primary: "bg-emerald-600", border: "border-emerald-600", text: "text-emerald-700" };
      case "amber":
        return { primary: "bg-amber-500", border: "border-amber-500", text: "text-amber-700" };
      case "rose":
        return { primary: "bg-rose-500", border: "border-rose-500", text: "text-rose-700" };
      case "slate":
        return { primary: "bg-slate-700", border: "border-slate-700", text: "text-slate-800" };
      default:
        return { primary: "bg-indigo-600", border: "border-indigo-600", text: "text-indigo-700" };
    }
  };

  const previewColor = getColorClasses();

  return (
    <div className="space-y-6" id="settings-module-panel">
      {/* Dynamic Tester Overlay */}
      {activeTestingPrinter && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="print-simulator-modal-wrapper">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-500 animate-pulse" />
                Raw Document Print Spooler Test
              </h5>
              <button 
                onClick={() => setActiveTestingPrinter(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-lg border text-xs space-y-1 font-sans">
                <p>Target Node: <strong className="text-slate-700">{activeTestingPrinter.name}</strong></p>
                <p>Port Interface: <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-[10.5px]">{activeTestingPrinter.ip}</span></p>
                <p>Paper size specification: <strong className="text-slate-700">{activeTestingPrinter.type}</strong></p>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                  <span>{testMsg}</span>
                  <span>{testProgress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${testProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* simulated print ticket body preview conditional */}
              {testSuccess && (
                <div className="border border-dashed border-stone-300 bg-amber-50/20 p-4 rounded text-[10.5px] font-mono shadow-inner text-slate-700 space-y-2">
                  <div className="text-center border-b border-dashed border-stone-200 pb-2">
                    <p className="font-extrabold text-xs">{designerLogoText}</p>
                    <p className="text-[9px] text-slate-400">{hotelProfile.address}</p>
                    <p className="text-[9px] text-slate-400">IP: {activeTestingPrinter.ip}</p>
                  </div>
                  <div className="space-y-1 py-1">
                    <p className="font-bold text-center text-indigo-805">** TERMINAL TEST TICKET OK **</p>
                    <p>JOB TYPE: {activeTestingPrinter.assignedRole}</p>
                    <p>PORT INTERFACE: {activeTestingPrinter.connection}</p>
                    <p>COMPILED AT: {new Date().toLocaleTimeString()}</p>
                    <p>COMPLIANCE PROTOCOL: ESC/POS</p>
                    <p className="text-stone-400 text-center text-[9px] mt-2 italic">&quot;{designerGreeting}&quot;</p>
                  </div>
                  <div className="text-center border-t border-dashed border-stone-200 pt-2 text-[9px] text-slate-400">
                    {designerFooterNotes}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveTestingPrinter(null)}
                className="bg-slate-700 text-white font-semibold rounded-lg px-4 py-1.5 text-xs hover:bg-slate-800 transition cursor-pointer"
              >
                Close Spooler View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Information Header Block */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-bold text-slate-800 text-base tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            System Control Center &amp; Preferences Office
          </h3>
          <p className="text-xs text-slate-400 font-sans">
            Oversee staff credentials, adjust multi-location operational branches, calibrate network printers, design invoices, and manage fiscal tax multipliers.
          </p>
        </div>

        {/* Global reset button */}
        <button
          type="button"
          onClick={handleFactoryReset}
          className="text-stone-600 hover:text-red-700 hover:bg-red-50 text-[11px] font-bold border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1 bg-white cursor-pointer transition shadow-3xs"
          title="Restore factory system states and seed original holdings"
        >
          <Database className="w-3.5 h-3.5" /> Force Database Wipe
        </button>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 text-emerald-800 border-emerald-150 border p-3 rounded-xl text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          Settings successfully persisted to local storage cache node! All transaction modules synchronized.
        </div>
      )}

      {/* Segmented Sub Tabs Header */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1" id="settings-tab-bar-nav">
        <button
          onClick={() => { setActiveSubTab("profile"); }}
          className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all ${
            activeSubTab === "profile" 
              ? "border-indigo-600 text-indigo-705 bg-indigo-50/20" 
              : "border-transparent text-slate-450 hover:text-slate-700 bg-transparent hover:bg-slate-100/50"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Hotel Profile &amp; Forex
        </button>
        <button
          onClick={() => { setActiveSubTab("staff"); }}
          className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all ${
            activeSubTab === "staff" 
              ? "border-indigo-600 text-indigo-705 bg-indigo-50/20" 
              : "border-transparent text-slate-450 hover:text-slate-700 bg-transparent hover:bg-slate-100/50"
          }`}
        >
          <Users className="w-4 h-4" />
          Employee Profiles &amp; Permissions
        </button>
        <button
          onClick={() => { setActiveSubTab("printers"); }}
          className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all ${
            activeSubTab === "printers" 
              ? "border-indigo-600 text-indigo-705 bg-indigo-50/20" 
              : "border-transparent text-slate-450 hover:text-slate-700 bg-transparent hover:bg-slate-100/50"
          }`}
        >
          <Printer className="w-4 h-4" />
          Printer Infrastructure Setup
        </button>
        <button
          onClick={() => { setActiveSubTab("docs"); }}
          className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all ${
            activeSubTab === "docs" 
              ? "border-indigo-600 text-indigo-705 bg-indigo-50/20" 
              : "border-transparent text-slate-450 hover:text-slate-700 bg-transparent hover:bg-slate-100/50"
          }`}
        >
          <Palette className="w-4 h-4" />
          Invoice &amp; Document Designer
        </button>
        <button
          onClick={() => { setActiveSubTab("system"); }}
          className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all ${
            activeSubTab === "system" 
              ? "border-indigo-600 text-indigo-705 bg-indigo-50/20" 
              : "border-transparent text-slate-450 hover:text-slate-700 bg-transparent hover:bg-slate-100/50"
          }`}
        >
          <Sliders className="w-4 h-4" />
          System Preferences
        </button>
      </div>

      {/* Main tab content displays conditional panels */}
      <div className="grid grid-cols-1 gap-6" id="settings-rendered-container">
        
        {/* PANEL 1: HOTEL PROFILE & FOREX */}
        {activeSubTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
            <div className="lg:col-span-2 space-y-5">
              <form onSubmit={handleProfileSubmit} className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs space-y-4">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-2.5 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  Corporate Identity &amp; Profile Details
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">SaaS App Brand Name</label>
                    <input
                      type="text"
                      className="text-xs border border-slate-205 rounded-lg p-2.5 w-full bg-white text-slate-755 font-medium"
                      value={profName}
                      onChange={(e) => setProfName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">HQ Contact phone</label>
                    <input
                      type="text"
                      className="text-xs border border-slate-205 rounded-lg p-2.5 w-full bg-white text-slate-755 font-medium"
                      value={profPhone}
                      onChange={(e) => setProfPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Corporate Headquarters address</label>
                  <input
                    type="text"
                    className="text-xs border border-slate-205 rounded-lg p-2.5 w-full bg-white text-slate-755 font-medium"
                    value={profAddress}
                    onChange={(e) => setProfAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-indigo-500" /> Active System Currency
                    </label>
                    <select
                      className="text-xs border border-slate-205 rounded-lg p-2.5 w-full bg-white text-slate-755 font-bold"
                      value={selectedCurrencyCode}
                      onChange={(e) => setSelectedCurrencyCode(e.target.value)}
                    >
                      {hotelProfile.currencies.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} ({c.symbol}) - {c.code === "USD" ? "Base Ledger Rate" : `1 USD = ${c.rateToUSD}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Operational Email</label>
                    <input
                      type="email"
                      className="text-xs border border-slate-205 rounded-lg p-2.5 w-full bg-white text-slate-755 font-medium"
                      value={profEmail}
                      onChange={(e) => setProfEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-450 font-bold uppercase block flex items-center gap-0.5">
                      <Percent className="w-3.5 h-3.5 text-indigo-500" /> State Tax / VAT (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="text-xs border border-slate-205 rounded-lg p-2.5 w-full bg-slate-50 text-slate-755 font-mono font-bold"
                      value={vatRate}
                      onChange={(e) => setVatRate(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-450 font-bold uppercase block flex items-center gap-0.5">
                      <Percent className="w-3.5 h-3.5 text-indigo-500" /> Service Surcharges (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="text-xs border border-slate-205 rounded-lg p-2.5 w-full bg-slate-50 text-slate-755 font-mono font-bold"
                      value={svcCharge}
                      onChange={(e) => setSvcCharge(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2.5 text-xs font-semibold w-full transition tracking-wide shadow-xs mt-3.5 cursor-pointer"
                  id="btn-persist-admin-settings"
                >
                  Persist Corporate Profile Updates
                </button>
              </form>

              {/* Compliance Guidelines Rules info */}
              <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs space-y-3">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-2.5 flex items-center gap-1 font-sans">
                  <ShieldAlert className="w-4 h-4 text-emerald-600 animate-pulse" />
                  Corporate Security compliance policies
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans text-slate-605 leading-relaxed font-medium">
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <p className="font-extrabold text-slate-800 mb-1 flex items-center gap-1 text-[11px]">🛡️ Guest Privacy Audit lock</p>
                    <p className="text-[10.5px] leading-relaxed text-slate-450 font-medium">
                      Guest passports, driver licenses, or NI/NIN numbers are stored locally via double-hash structures and audited inside immutables log records to satisfy ISO 27001 hospitality directives.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <p className="font-extrabold text-slate-800 mb-1 flex items-center gap-1 text-[11px]">🏦 Multi-Currency Forex Sync</p>
                    <p className="text-[10.5px] leading-relaxed text-slate-450 font-medium">
                      Multi-currency checkout schedules sync direct conversion rates in our database. Settle payments captured in other currencies are instantly compiled at flat USD ledger values.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: Branch support card */}
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs space-y-4" id="multi-branch-card">
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-2 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  Hotel Operating Branches
                </h4>

                <p className="text-[11px] text-slate-400">
                  Select and switch active branch contexts. Rates and allocations update in real-time according to local regulations.
                </p>

                <div className="space-y-2">
                  {hotelProfile.branches.map((branch) => {
                    const isActive = branch.id === activeBranchId;
                    
                    return (
                      <div
                        key={branch.id}
                        className={`border rounded-xl p-3.5 cursor-pointer hover:shadow-xs transition duration-200 flex items-center justify-between ${
                          isActive 
                            ? "border-indigo-500 bg-indigo-50/20" 
                            : "border-slate-150 bg-slate-50/50 hover:bg-slate-50"
                        }`}
                        onClick={() => {
                          setActiveBranchId(branch.id);
                          addAuditLog("BRANCH_SWAP", `Swapped active operation branch focal reference to ${branch.name}`);
                        }}
                        id={`branch-item-tile-${branch.id}`}
                      >
                        <div>
                          <h5 className="font-extrabold text-slate-800 text-xs">{branch.name}</h5>
                          <p className="text-[10px] text-slate-405 font-mono mt-0.5">{branch.address}, {branch.city}</p>
                        </div>

                        <div className="flex items-center">
                          <span className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-indigo-600 animate-pulse" : "bg-slate-350"}`}></span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-indigo-50/20 rounded-lg border border-indigo-100 text-[10px] text-indigo-900 leading-normal font-medium">
                  <strong>Multi-location architecture is live.</strong> Booking records are securely separated by branch ID tokens, while master settings and profile defaults propagate globally.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PANEL 2: EMPLOYEE PROFILES & PERMISSIONS */}
        {activeSubTab === "staff" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up" id="staff-permissions-tab-panel">
            
            {/* Left Column: Register New Employee Profile */}
            <div className="space-y-5 lg:col-span-1">
              <form onSubmit={handleCreateStaff} className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs space-y-4 text-slate-705">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-2.5 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  Hire New Staff Account
                </h4>

                {staffSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-lg text-emerald-800 text-[11px] font-semibold animate-pulse">
                    {staffSuccessMsg}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Full Employee Name</label>
                  <input
                    type="text"
                    required
                    className="text-xs border border-slate-205 rounded-lg p-2.5 w-full bg-white font-medium text-slate-755"
                    placeholder="e.g., Jane Ngozi Doe"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Corporate Local Email</label>
                  <input
                    type="email"
                    required
                    className="text-xs border border-slate-205 rounded-lg p-2.5 w-full bg-white font-medium text-slate-755"
                    placeholder="e.g., jane.n@omnisuite.com"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Telephone Line</label>
                  <input
                    type="text"
                    className="text-xs border border-slate-205 rounded-lg p-2.5 w-full bg-white font-medium text-slate-755"
                    placeholder="e.g., +234 810 555 1212"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Role Title</label>
                    <select
                      className="text-xs border border-slate-205 rounded-lg p-2 bg-white font-semibold text-slate-755"
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value as StaffRole)}
                    >
                      <option value={StaffRole.Admin}>Admin Profile</option>
                      <option value={StaffRole.Manager}>Manager Desk</option>
                      <option value={StaffRole.Receptionist}>Clerk / Receptionist</option>
                      <option value={StaffRole.Housekeeping}>Crews / Housekeeper</option>
                      <option value={StaffRole.Accountant}>Accountant / Auditor</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Avatar Badge</label>
                    <select
                      className="text-xs border border-slate-205 rounded-lg p-2 bg-white font-medium text-slate-755"
                      value={newStaffAvatar}
                      onChange={(e) => setNewStaffAvatar(e.target.value)}
                    >
                      <option value="👩‍💼">👩‍💼 Manager Woman</option>
                      <option value="🤵">🤵 Clerk Man</option>
                      <option value="👩‍💻">👩‍💻 Tech Developer</option>
                      <option value="👨‍💻">👨‍💻 Tech Man</option>
                      <option value="🧹">🧹 Housekeeper Crew</option>
                      <option value="💰">💰 Finance Chief</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Assigned Shift Schedule</label>
                  <input
                    type="text"
                    className="text-xs border border-slate-205 rounded-lg p-2.5 w-full bg-white font-mono text-slate-755"
                    value={newStaffShift}
                    onChange={(e) => setNewStaffShift(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2.5 text-xs font-bold w-full transition tracking-normal shadow-xs mt-2 cursor-pointer"
                >
                  Create &amp; Authorize Employee Account
                </button>
              </form>
            </div>

            {/* Right Columns: Current Staff List & Fine-grained Permissions Grid */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Staff Registered Table */}
              <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b pb-2.5">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-500" />
                    Authorized Employee Profiles
                  </h4>
                  
                  {/* Quick role filter */}
                  <select
                    className="text-[10.5px] border border-slate-200 rounded px-2 py-1 bg-slate-50 text-slate-650 font-semibold"
                    value={staffFilter}
                    onChange={(e) => setStaffFilter(e.target.value)}
                  >
                    <option value="ALL">Show All Classes</option>
                    <option value="Admin">Administrators</option>
                    <option value="Manager">Managers</option>
                    <option value="Receptionist">Receptionists</option>
                    <option value="Housekeeping">Housekeepers</option>
                    <option value="Accountant">Accountants</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-600">
                    <thead className="bg-slate-50 text-[10px] text-slate-450 uppercase font-bold tracking-wider">
                      <tr>
                        <th className="p-2.5">Staff Name &amp; Role</th>
                        <th className="p-2.5">Contact Details</th>
                        <th className="p-2.5">Duty Status</th>
                        <th className="p-2.5 text-center">Authorization Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {staff
                        .filter(s => staffFilter === "ALL" || s.role === staffFilter)
                        .map((member) => (
                          <tr key={member.id} className="hover:bg-slate-50/50">
                            <td className="p-2.5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className="text-lg bg-indigo-50 p-1.5 rounded-lg border border-indigo-100">{member.avatar || "👤"}</span>
                                <div>
                                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                    {member.name}
                                    <span className="bg-slate-100 text-slate-600 text-[8.5px] font-mono px-1 py-0.2 rounded">
                                      ID: {member.id}
                                    </span>
                                  </div>
                                  <div className="text-[9.5px] font-bold text-indigo-600 uppercase tracking-wider">{member.role}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-2.5 font-medium text-slate-500">
                              <p className="flex items-center gap-1 text-[10.5px]"><Mail className="w-3 h-3 text-slate-400" /> {member.email}</p>
                              <p className="flex items-center gap-1 text-[10.5px]"><Smartphone className="w-3 h-3 text-slate-400" /> {member.phone}</p>
                            </td>
                            <td className="p-2.5 whitespace-nowrap">
                              <select
                                className={`text-[10px] font-bold p-1 rounded-md border ${
                                  member.status === "Active" 
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-250 font-extrabold" 
                                    : member.status === "Off-Duty" 
                                      ? "bg-slate-100 text-slate-600 border-slate-300 font-bold" 
                                      : "bg-amber-50 text-amber-700 border-amber-350 font-semibold"
                                }`}
                                value={member.status}
                                onChange={(e) => updateStaffUserStatus(member.id, e.target.value as any)}
                              >
                                <option value="Active">🟢 Active / On Duty</option>
                                <option value="Off-Duty">⚫ Off-Duty</option>
                                <option value="On-Leave">🟡 Medical / Vacation Leave</option>
                              </select>
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  alert(`Secured employee de-authentication error: Cannot purge root staff member ${member.name} directly. Re-assign their profile active shift via the Shift Roster instead.`);
                                }}
                                className="text-[10px] text-red-700 font-bold hover:underline px-2.5 py-1 hover:bg-red-50 rounded-lg transition"
                              >
                                De-Auth Token
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Security - Fine-grained Role-based Permissions Grid */}
              <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs space-y-4">
                <div className="border-b pb-2.5 space-y-1">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                    Fine-Grained Role Permissions Control Matrix
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Audit role permissions in real-time. Changes restrict user actions dynamically across operational modules.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-100 rounded-lg overflow-hidden">
                    <thead className="bg-indigo-50/40 text-[9.5px] font-bold text-indigo-905 uppercase tracking-wider">
                      <tr>
                        <th className="p-3 w-1/3 min-w-[150px]">Functional Privilege</th>
                        <th className="p-3 text-center">Admin</th>
                        <th className="p-3 text-center">Manager</th>
                        <th className="p-3 text-center">Clerk (Recep)</th>
                        <th className="p-3 text-center">Crews (Hous)</th>
                        <th className="p-3 text-center">Auditor (Acct)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-650">
                      {permissions.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-3 font-medium">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">{p.category}</span>
                            <span className="text-[11px] leading-tight text-slate-800 font-semibold">{p.label}</span>
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              checked={p.adminAllowed}
                              onChange={() => handleTogglePivotPermission(p.id, "adminAllowed")}
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              checked={p.managerAllowed}
                              onChange={() => handleTogglePivotPermission(p.id, "managerAllowed")}
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              checked={p.receptionistAllowed}
                              onChange={() => handleTogglePivotPermission(p.id, "receptionistAllowed")}
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              checked={p.housekeepingAllowed}
                              onChange={() => handleTogglePivotPermission(p.id, "housekeepingAllowed")}
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              checked={p.accountantAllowed}
                              onChange={() => handleTogglePivotPermission(p.id, "accountantAllowed")}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg text-[9.5px]/1.4 text-slate-500 leading-normal font-medium">
                  <strong>* Active Security Rule mapping policies:</strong> Toggling a checkbox writes an encrypted system audit log directly into our database. Administrators can audit rules for custom workflow security.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PANEL 3: PRINTER INFRASTRUCTURE SETUP */}
        {activeSubTab === "printers" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up" id="printers-setup-tab-panel">
            
            {/* Left Column: Register New Printer Device */}
            <div className="space-y-5 lg:col-span-1">
              <form onSubmit={handleAddPrinter} className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs space-y-4">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-2.5 flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-indigo-500" />
                  Hook Up Printer Port
                </h4>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Printer Identifier Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Housekeeping Slip Printer B"
                    className="text-xs border border-slate-205 rounded-lg p-2.5 w-full bg-white font-medium text-slate-755"
                    value={newPrName}
                    onChange={(e) => setNewPrName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Print Width Tech Category</label>
                  <select
                    className="text-xs border border-slate-205 rounded-lg p-2 bg-white font-semibold text-slate-755"
                    value={newPrType}
                    onChange={(e) => setNewPrType(e.target.value as any)}
                  >
                    <option value="Thermal Roll 80mm">Thermal Roll 80mm (Receipts Default)</option>
                    <option value="Thermal Roll 58mm">Thermal Roll 58mm (Mobile POS Slip)</option>
                    <option value="Office LaserJet A4">Office LaserJet A4 (High Density Invoice)</option>
                    <option value="Dot Matrix KOT">Dot Matrix KOT (Impact Duplicate Paper)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Connection Type</label>
                    <select
                      className="text-xs border border-slate-205 rounded-lg p-2 bg-white font-semibold text-slate-755"
                      value={newPrConn}
                      onChange={(e) => setNewPrConn(e.target.value as any)}
                    >
                      <option value="Wi-Fi Network">📶 Wi-Fi Network</option>
                      <option value="Ethernet LAN">🔌 Ethernet LAN</option>
                      <option value="USB Local Cable">💻 USB Local Cable</option>
                      <option value="Bluetooth">📱 Bluetooth Sync</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Device Task Association</label>
                    <select
                      className="text-xs border border-slate-205 rounded-lg p-2 bg-white font-medium text-slate-755"
                      value={newPrRole}
                      onChange={(e) => setNewPrRole(e.target.value as any)}
                    >
                      <option value="All Receipts">All Receipts &amp; Slips</option>
                      <option value="Bill Invoices">Bill Folio Invoices</option>
                      <option value="Kitchen Orders">Kitchen Orders &amp; Bar</option>
                      <option value="Accounting Reports">Accounting Reports</option>
                      <option value="Front Desk Ledger">Front Desk ledger logs</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Network IP Address / Descriptor PORT</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      className="text-xs border border-slate-205 rounded-lg p-2.5 w-full bg-white font-mono text-slate-755"
                      value={newPrIp}
                      onChange={(e) => setNewPrIp(e.target.value)}
                    />
                    <span className="absolute right-2.5 top-2 bg-slate-100 text-[9px] px-1 py-0.5 rounded font-mono font-bold text-slate-450 border uppercase">
                      Port Raw
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg px-4 py-2.5 text-xs font-bold w-full transition tracking-normal shadow-xs mt-2 cursor-pointer"
                >
                  Plug &amp; Connect Printer Profile
                </button>
              </form>
            </div>

            {/* Right Column: Manage Mounted Printers & Defaults */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Default Spooler Routing Targets bindings */}
              <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs space-y-4">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-2.5 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-500" />
                  Default Spooler Hardware Routing Assignments
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-150 space-y-1.5">
                    <label className="text-[9.5px] text-slate-450 font-bold uppercase tracking-wider block">Standard Guest Receipts</label>
                    <select
                      className="text-xs border p-2 rounded-lg bg-white w-full font-bold text-slate-755"
                      value={defReceiptPr}
                      onChange={(e) => setDefReceiptPr(e.target.value)}
                    >
                      {printers.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-150 space-y-1.5">
                    <label className="text-[9.5px] text-slate-450 font-bold uppercase tracking-wider block">Folio Bill Invoices</label>
                    <select
                      className="text-xs border p-2 rounded-lg bg-white w-full font-bold text-slate-755"
                      value={defInvoicePr}
                      onChange={(e) => setDefInvoicePr(e.target.value)}
                    >
                      {printers.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-150 space-y-1.5">
                    <label className="text-[9.5px] text-slate-450 font-bold uppercase tracking-wider block">Staff Analytical Reports</label>
                    <select
                      className="text-xs border p-2 rounded-lg bg-white w-full font-bold text-slate-755"
                      value={defReportPr}
                      onChange={(e) => setDefReportPr(e.target.value)}
                    >
                      {printers.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Active list of Printer Devices */}
              <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs space-y-4">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-2.5 flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-indigo-500" />
                  Mounted Printers &amp; Devices status
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {printers.map((p) => {
                    const isInvoiceDefault = defInvoicePr === p.id;
                    const isReceiptDefault = defReceiptPr === p.id;
                    const isReportDefault = defReportPr === p.id;

                    return (
                      <div key={p.id} className="border border-slate-150 p-4 rounded-xl shadow-3xs hover:shadow-xs transition duration-200 bg-slate-50/50 space-y-3 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded font-mono">
                              {p.type}
                            </span>
                            <span className="flex items-center gap-1 text-[10.5px] font-bold text-emerald-700">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              {p.status}
                            </span>
                          </div>

                          <h5 className="font-extrabold text-slate-800 text-xs tracking-tight">{p.name}</h5>
                          
                          <div className="text-[10.5px] text-slate-500 font-mono space-y-0.5">
                            <p className="flex items-center gap-1"><Network className="w-3 h-3 text-slate-400" /> Interface: {p.connection}</p>
                            <p className="flex items-center gap-1"><Wifi className="w-3 h-3 text-slate-400" /> Endpoint IP: {p.ip}</p>
                            <p className="font-bold text-slate-650 mt-1 uppercase tracking-wider text-[9px] bg-slate-100 p-1 rounded inline-block">
                              Target task: {p.assignedRole}
                            </p>
                          </div>
                        </div>

                        {/* Defaults badges list */}
                        {(isInvoiceDefault || isReceiptDefault || isReportDefault) && (
                          <div className="flex flex-wrap gap-1 pt-1.5 border-t border-dashed border-slate-200">
                            {isReceiptDefault && <span className="bg-slate-700 text-white text-[8.5px] font-bold px-1.5 py-0.2 rounded">Receipt Default</span>}
                            {isInvoiceDefault && <span className="bg-indigo-600 text-white text-[8.5px] font-bold px-1.5 py-0.2 rounded">Invoice Default</span>}
                            {isReportDefault && <span className="bg-emerald-700 text-white text-[8.5px] font-bold px-1.5 py-0.2 rounded">Reports Default</span>}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                          <button
                            type="button"
                            onClick={() => triggerTestPrint(p)}
                            className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-lg px-2.5 py-1 text-[10.5px] transition flex items-center gap-1 cursor-pointer shadow-3xs"
                          >
                            <Eye className="w-3 h-3" /> ESC/POS Test Job
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePrinter(p.id, p.name)}
                            disabled={printers.length <= 1}
                            className={`p-1.5 rounded-lg border transition ${
                              printers.length <= 1 
                                ? "text-slate-300 border-slate-100 cursor-not-allowed" 
                                : "text-stone-400 border-slate-200 hover:border-red-200 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                            }`}
                            title="De-register printer profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PANEL 4: DOCUMENT & RECEIPT DESIGNER */}
        {activeSubTab === "docs" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up" id="invoice-designer-tab-panel">
            
            {/* Left Controls Span : Col 5 */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs space-y-4">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-2.5 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-indigo-500" />
                  Branding Layout Parameters
                </h4>

                {/* Primary theme picker */}
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Accent Palette Scheme</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setBrandColor("indigo")}
                      className={`w-7 h-7 rounded-full bg-indigo-600 border-2 transition ${brandColor === "indigo" ? "border-slate-800 scale-110" : "border-transparent"}`}
                      title="Indigo"
                    />
                    <button
                      type="button"
                      onClick={() => setBrandColor("emerald")}
                      className={`w-7 h-7 rounded-full bg-emerald-600 border-2 transition ${brandColor === "emerald" ? "border-slate-800 scale-110" : "border-transparent"}`}
                      title="Emerald"
                    />
                    <button
                      type="button"
                      onClick={() => setBrandColor("amber")}
                      className={`w-7 h-7 rounded-full bg-amber-500 border-2 transition ${brandColor === "amber" ? "border-slate-800 scale-110" : "border-transparent"}`}
                      title="Amber"
                    />
                    <button
                      type="button"
                      onClick={() => setBrandColor("rose")}
                      className={`w-7 h-7 rounded-full bg-rose-500 border-2 transition ${brandColor === "rose" ? "border-slate-800 scale-110" : "border-transparent"}`}
                      title="Rose"
                    />
                    <button
                      type="button"
                      onClick={() => setBrandColor("slate")}
                      className={`w-7 h-7 rounded-full bg-slate-700 border-2 transition ${brandColor === "slate" ? "border-slate-800 scale-110" : "border-transparent"}`}
                      title="Slate Minimal"
                    />
                  </div>
                </div>

                {/* Toggle features in print layout */}
                <div className="space-y-2.5 border-t border-dashed border-slate-200 pt-3">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block">Toggle Visible Parts</label>
                  
                  <div className="space-y-1.5 text-xs text-slate-650">
                    <label className="flex items-center gap-2 cursor-pointer font-medium hover:text-slate-900">
                      <input
                        type="checkbox"
                        className="rounded text-indigo-600"
                        checked={designerShowLogo}
                        onChange={(e) => setDesignerShowLogo(e.target.checked)}
                      />
                      Show Custom Header Logo
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-medium hover:text-slate-900">
                      <input
                        type="checkbox"
                        className="rounded text-indigo-600"
                        checked={designerShowRoomBreakdown}
                        onChange={(e) => setDesignerShowRoomBreakdown(e.target.checked)}
                      />
                      Include Room Tariff Breakdown
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-medium hover:text-slate-900">
                      <input
                        type="checkbox"
                        className="rounded text-indigo-600"
                        checked={designerShowTaxes}
                        onChange={(e) => setDesignerShowTaxes(e.target.checked)}
                      />
                      Render Global State Taxes ({hotelProfile.taxRate}%)
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-medium hover:text-slate-900">
                      <input
                        type="checkbox"
                        className="rounded text-indigo-600"
                        checked={designerShowServiceCharge}
                        onChange={(e) => setDesignerShowServiceCharge(e.target.checked)}
                      />
                      Render Service Charge Rates ({hotelProfile.serviceChargeRate}%)
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-medium hover:text-slate-900">
                      <input
                        type="checkbox"
                        className="rounded text-indigo-600"
                        checked={designerShowTxIds}
                        onChange={(e) => setDesignerShowTxIds(e.target.checked)}
                      />
                      Display Unique Transaction IDs
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-medium hover:text-slate-900">
                      <input
                        type="checkbox"
                        className="rounded text-indigo-600"
                        checked={designerShowQrCode}
                        onChange={(e) => setDesignerShowQrCode(e.target.checked)}
                      />
                      Inject Express Checkout QR Code
                    </label>
                  </div>
                </div>

                {/* Editable text details on receipt */}
                <div className="space-y-3 border-t border-dashed border-slate-200 pt-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Header Logo Brand Text</label>
                    <input
                      type="text"
                      className="text-xs border w-full p-2 rounded bg-slate-50 hover:bg-white text-slate-755 font-mono"
                      value={designerLogoText}
                      onChange={(e) => setDesignerLogoText(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Welcome Booking Greeting</label>
                    <textarea
                      rows={2}
                      className="text-xs border w-full p-2 rounded bg-slate-50 hover:bg-white text-slate-755 font-medium leading-tight"
                      value={designerGreeting}
                      onChange={(e) => setDesignerGreeting(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase font-sans">Legal Terms &amp; Policies text</label>
                    <textarea
                      rows={2}
                      className="text-[10.5px] border w-full p-2 rounded bg-slate-50 hover:bg-white text-slate-655 leading-tight font-medium"
                      value={designerTerms}
                      onChange={(e) => setDesignerTerms(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    addAuditLog("SYSTEM", `Custom invoice template branding saved with color: ${brandColor.toUpperCase()}`);
                    alert("Document layout modifications persisted! Check preview sheet inside livePayments or Reservation bills print pages.");
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-xs font-semibold w-full transition tracking-normal shadow-xs mt-1 cursor-pointer"
                >
                  Apply Custom Branding Configuration
                </button>
              </div>
            </div>

            {/* Right Live Preview: Col 7 */}
            <div className="lg:col-span-7 flex flex-col items-center justify-start space-y-4">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block select-none">
                Real-Time Document Sheet render preview
              </span>

              {/* simulated physical sheet */}
              <div className="w-full max-w-lg bg-white border border-slate-205 shadow-md p-6 sm:p-8 rounded-sm font-sans space-y-5 text-slate-755 relative overflow-hidden" id="interactive-designer-viewpaper">
                
                {/* Horizontal Top Accent Line */}
                <div className={`h-1.5 w-full absolute top-0 left-0 ${previewColor.primary}`}></div>

                {/* Header elements */}
                <div className="flex justify-between items-start border-b border-dashed border-slate-200 pb-4">
                  <div className="space-y-1">
                    {designerShowLogo ? (
                      <h5 className="font-extrabold text-base text-slate-800 tracking-tight">{designerLogoText}</h5>
                    ) : (
                      <div className="h-4 w-20 bg-slate-100 rounded animate-pulse"></div>
                    )}
                    <p className="text-[10px] text-slate-450 leading-relaxed font-mono">
                      {branchIdToName(activeBranchId)} Branch<br />
                      {hotelProfile.address}<br />
                      Phone: {hotelProfile.phone}
                    </p>
                  </div>

                  <div className="text-right text-[10px] font-mono leading-relaxed text-slate-455">
                    <p className={`font-bold text-xs uppercase tracking-wide px-1.5 py-0.5 rounded ${previewColor.text} inline-block bg-slate-50 mb-1`}>
                      DEMO BILLING FOLIO
                    </p>
                    <p>INVOICE REF: #INV-2026-99120</p>
                    <p>CHECK-IN: 2026-06-20</p>
                    <p>STATUS: LOCKED SETTLED</p>
                  </div>
                </div>

                {/* Subtitle / Guest details container */}
                <div className="bg-slate-50 p-3 rounded text-[10.5px] flex justify-between tracking-tight font-medium text-slate-655">
                  <div>
                    <h6 className="font-bold text-[9.5px] uppercase tracking-wider text-slate-450 mb-0.5">Guest Foliower Details</h6>
                    <p className="font-extrabold text-slate-800 text-[11px] mb-0.5">Chief Aliko Alhaji</p>
                    <p>Loyalty tier status: <strong className="text-indigo-805">Exclusive Platinum Elite</strong>- VIP</p>
                  </div>

                  <div className="text-right">
                    <h6 className="font-bold text-[9.5px] uppercase tracking-wider text-slate-450 mb-0.5">Assigned Accommodations</h6>
                    <p className="font-semibold text-slate-805">Executive Suite #502</p>
                    <p>Period: Standard (3 Nights Tariff)</p>
                  </div>
                </div>

                {/* Booking charges listing */}
                <div className="space-y-3">
                  <h6 className="font-extrabold text-[9.5px] uppercase tracking-wider text-slate-450">Document Ledger breakdown</h6>
                  
                  <div className="border border-slate-100 rounded overflow-hidden text-[10.5px]">
                    <div className="bg-slate-50 p-2 font-bold text-[9.5px] uppercase text-slate-450 flex justify-between">
                      <span>Service Description</span>
                      <span>Rate (USD Equivalent)</span>
                    </div>

                    <div className="divide-y divide-slate-100 font-sans text-slate-650">
                      {designerShowRoomBreakdown ? (
                        <div className="p-2 flex justify-between">
                          <span>Accommodation Suite Room Rate (Premium Tier)</span>
                          <span className="font-bold font-mono">$1,250.00</span>
                        </div>
                      ) : (
                        <div className="p-2 text-stone-400 italic text-[10px]">Room rate tariff breakdown disabled in settings.</div>
                      )}
                      
                      <div className="p-2 flex justify-between">
                        <span>Spa Renewal Surcharge &amp; F&amp;B service</span>
                        <span className="font-bold font-mono">$450.00</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calculations summary row */}
                <div className="flex justify-between items-start pt-2">
                  
                  {/* QR code and welcome message block */}
                  <div className="w-1/2 space-y-2">
                    {designerShowQrCode && (
                      <div className="flex items-center gap-2 border border-slate-150 p-2 rounded-lg bg-slate-50/50">
                        <div className="p-1 border bg-white rounded flex items-center justify-center shrink-0">
                          {/* simulated QR Vector */}
                          <div className="w-7 h-7 grid grid-cols-3 gap-0.5" title="Mock express scan QR">
                            <div className="bg-slate-800"></div><div className="bg-slate-800"></div><div className="bg-white"></div>
                            <div className="bg-white"></div><div className="bg-slate-800"></div><div className="bg-slate-800"></div>
                            <div className="bg-slate-800"></div><div className="bg-white"></div><div className="bg-slate-800"></div>
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-450 leading-relaxed font-mono">
                          Scan to pay balance<br />or verify security token ID
                        </p>
                      </div>
                    )}

                    <p className="text-[9.5px] leading-tight text-slate-400 italic">
                      &quot;{designerGreeting}&quot;
                    </p>
                  </div>

                  {/* Pricing numbers block */}
                  <div className="w-2.5/5 text-xs text-slate-655 space-y-1 text-right">
                    <div className="flex justify-between gap-4">
                      <span>Ledger Subtotal:</span>
                      <strong className="font-mono font-semibold">$1,700.00</strong>
                    </div>

                    {designerShowTaxes && (
                      <div className="flex justify-between gap-4">
                        <span>VAT ({hotelProfile.taxRate}%):</span>
                        <span className="font-mono">${(1700 * hotelProfile.taxRate / 100).toFixed(2)}</span>
                      </div>
                    )}

                    {designerShowServiceCharge && (
                      <div className="flex justify-between gap-4">
                        <span>Surcharges ({hotelProfile.serviceChargeRate}%):</span>
                        <span className="font-mono">${(1700 * hotelProfile.serviceChargeRate / 100).toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between gap-4 font-bold text-slate-855 border-t border-slate-200 pt-1.5 text-xs">
                      <span>Total Amount:</span>
                      <span className={`font-mono text-sm underline decoration-double ${previewColor.text}`}>
                        ${(1700 + (1700 * hotelProfile.taxRate / 100) + (1700 * hotelProfile.serviceChargeRate / 100)).toFixed(2)} USD
                      </span>
                    </div>

                    {designerShowTxIds && (
                      <p className="text-[8px] font-mono text-slate-455 text-right mt-1 truncate max-w-[185px]">
                        TXID: txn_981a2c38d7b30fef1a2
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer and Terms notes */}
                <div className="border-t border-stone-200 border-dashed pt-3 text-[8.5px]/1.3 text-slate-450 font-medium space-y-1 select-none">
                  <p><strong>Branded Invoice Policy Terms:</strong> {designerTerms}</p>
                  <p className="text-center font-bold text-slate-400 select-all font-mono tracking-wider">{designerFooterNotes}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PANEL 5: SYSTEM PREFERENCES GATEWAY */}
        {activeSubTab === "system" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up" id="system-pref-tab-panel">
            
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs space-y-4">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-2.5 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-505 text-indigo-500" />
                  System Configurations
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Notifications Channel selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-505 font-bold uppercase block">Default Notification Provider</label>
                    <select
                      className="text-xs border p-2.5 rounded-lg bg-white w-full font-bold text-slate-755"
                      value={sysNotificationChannel}
                      onChange={(e) => setSysNotificationChannel(e.target.value as any)}
                    >
                      <option value="both">📧 Email SMTP + 📱 SMS gateway (Amazon SES/Twilio)</option>
                      <option value="email">📧 SMTP Server Relays only (No Twilio SMS Charges)</option>
                      <option value="sms">📱 SMS short-code text logs only</option>
                    </select>
                  </div>

                  {/* Auto backup scheduler */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block">Automated Database Backups Tracker</label>
                    <select
                      className="text-xs border p-2.5 rounded-lg bg-white w-full font-bold text-slate-755"
                      value={sysBackupFrequency}
                      onChange={(e) => setSysBackupFrequency(e.target.value as any)}
                    >
                      <option value="hourly">Hourly incremental Cloud SQL backup replicas</option>
                      <option value="daily">Daily full multi-region database snapshot dumps</option>
                      <option value="weekly">Weekly archived tarballs in Google Cloud Storage</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-dashed border-slate-200 pt-3">
                  {/* Simulated API Key */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-505 font-bold uppercase block">Stripe API Secret Gateway Key</label>
                    <input
                      type="password"
                      className="text-xs border p-2.5 rounded-lg bg-slate-50 text-slate-755 w-full font-mono font-bold"
                      value={sysStripeSecretKey}
                      onChange={(e) => setSysStripeSecretKey(e.target.value)}
                    />
                  </div>

                  {/* Dev Sandbox Toggle */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-505 font-bold uppercase block">Compliance Sandbox Environment Mode</label>
                    <select
                      className="text-xs border p-2.5 rounded-lg bg-white w-full font-bold text-slate-755"
                      value={sysIsSandboxMode ? "sandbox" : "production"}
                      onChange={(e) => setSysIsSandboxMode(e.target.value === "sandbox")}
                    >
                      <option value="sandbox">🟡 Developers Sandbox Sync Mode (Test Transactions OK)</option>
                      <option value="production">🔴 Real Production Nodes (Lock credentials validation)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    addAuditLog("SYSTEM", `Updated System preferences: notification channel: ${sysNotificationChannel}, backup: ${sysBackupFrequency}`);
                    alert("System configuration variables successfully saved! Handshakes updated.");
                  }}
                  className="bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg px-4 py-2.5 text-xs font-semibold w-full transition tracking-normal shadow-xs mt-2 cursor-pointer"
                >
                  Save Global System Configurations
                </button>
              </div>
            </div>

            {/* General FAQs/Admin guide */}
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs space-y-3.5">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-emerald-600" />
                  Administration SLA Checklists
                </h4>

                <div className="space-y-2.5 text-xs text-slate-600 leading-normal">
                  <div className="p-2 bg-slate-50 rounded border border-slate-150">
                    <p className="font-bold text-slate-800 text-[11px] mb-1">How do I change currency rates?</p>
                    <p className="text-[10.5px]/1.4 text-slate-450 font-medium">To modify conversion rates, update individual records in currency objects inside types declaration lists, or select the system preference dynamically.</p>
                  </div>

                  <div className="p-2 bg-slate-50 rounded border border-slate-150">
                    <p className="font-bold text-slate-800 text-[11px] mb-1">What happens when data is purged?</p>
                    <p className="text-[10.5px]/1.4 text-slate-450 font-medium">Purges erase memory buffers, restoring Lagos and London seeds to default system parameters. Ensure any custom bookings have been exported beforehand.</p>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        )}

      </div>
    </div>
  );
};

// Helper lookup for branch names
function branchIdToName(id: string): string {
  switch (id) {
    case "lagos": return "Lagos Atlantic Resort";
    case "london": return "London Regent Hotel";
    case "newyork": return "New York Hudson Plaza";
    default: return "OmniSuite Luxury Resort";
  }
}
