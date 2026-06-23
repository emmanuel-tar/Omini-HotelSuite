/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useHMS } from "../context/HMSContext";
import { WebUsbHidPrinterBridge } from "./WebUsbHidPrinterBridge";
import { PrintDiagnosticsPanel } from "./PrintDiagnosticsPanel";
import { StaffRole, StaffUser, PrinterConfig } from "../types";
import { usePrinter, PrinterService } from "../services/PrinterService";
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
  DollarSign,
  Search,
  Laptop,
  Sparkles,
  Check,
  Edit,
  Cable,
  Cpu,
  Wrench,
  Terminal
} from "lucide-react";

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

// Standalone helpers for ESC/POS hexadecimal command parser and debugger
const parseHexToUint8Array = (hexStr: string): Uint8Array => {
  const cleanHex = hexStr.replace(/[^a-fA-F0-9]/g, "");
  if (cleanHex.length % 2 !== 0) {
    throw new Error("Hexadecimal string must have an even length (each byte is 2 hex characters).");
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
};

const decodeEscPosBytes = (bytes: Uint8Array): string[] => {
  const decoded: string[] = [];
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i];
    if (b === 0x1B) { // ESC
      if (i + 1 < bytes.length) {
        const next = bytes[i + 1];
        if (next === 0x40) {
          decoded.push("[ESC @ (Initialize/Reset)]");
          i += 2;
          continue;
        } else if (next === 0x45) { // Bold ESC E n
          const val = i + 2 < bytes.length ? bytes[i + 2] : 0;
          decoded.push(`[ESC E (Bold Mode: ${val === 1 ? "ON" : "OFF"})]`);
          i += 3;
          continue;
        } else if (next === 0x21) { // ESC ! n
          const val = i + 2 < bytes.length ? bytes[i + 2] : 0;
          decoded.push(`[ESC ! (Print Mode Mask: 0x${val.toString(16).toUpperCase()})]`);
          i += 3;
          continue;
        } else if (next === 0x2D) { // ESC - n (Underline)
          const val = i + 2 < bytes.length ? bytes[i + 2] : 0;
          decoded.push(`[ESC - (Underline: ${val === 1 ? "ON" : "OFF"})]`);
          i += 3;
          continue;
        }
        decoded.push(`[ESC 0x${next.toString(16).toUpperCase()}]`);
        i += 2;
        continue;
      }
      decoded.push("[ESC]");
      i += 1;
    } else if (b === 0x1D) { // GS
      if (i + 1 < bytes.length) {
        const next = bytes[i + 1];
        if (next === 0x56) { // Page Cut GS V m
          const val = i + 2 < bytes.length ? bytes[i + 2] : 0;
          decoded.push(`[GS V (Paper Cut: 0x${val.toString(16).toUpperCase()})]`);
          i += 2;
          // check if m is 0 or 1, or has another byte
          if (i < bytes.length) {
            decoded[decoded.length - 1] += ` (Feed: ${bytes[i]} lines)`;
            i += 1;
          }
          continue;
        }
        decoded.push(`[GS 0x${next.toString(16).toUpperCase()}]`);
        i += 2;
        continue;
      }
      decoded.push("[GS]");
      i += 1;
    } else if (b === 0x0A) {
      decoded.push("[LF (Line Feed)]");
      i += 1;
    } else if (b === 0x0D) {
      decoded.push("[CR (Carriage Return)]");
      i += 1;
    } else if (b === 0x09) {
      decoded.push("[HT (Horizontal Tab)]");
      i += 1;
    } else if (b === 0x07) {
      decoded.push("[BEL (Sound Buzzer)]");
      i += 1;
    } else if (b >= 32 && b <= 126) {
      decoded.push(String.fromCharCode(b));
      i += 1;
    } else {
      decoded.push(`[0x${b.toString(16).toUpperCase().padStart(2, "0")}]`);
      i += 1;
    }
  }
  return decoded;
};

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
    updateStaffUserStatus,
    printers,
    addPrinter,
    updatePrinter,
    deletePrinter
  } = useHMS();

  const {
    scannedDevices: discoveredUsbPrinters,
    isScanning: isUsbScanning,
    scanPhysicalPortsEmulated: scanUsbPrinters,
    requestPhysicalUsbDevice,
    requestPhysicalHidDevice,
    ToastElement
  } = usePrinter();

  const [defaultUsbPrinterId, setDefaultUsbPrinterId] = useState<string>("usb-phys-01");
  const [usbTestPrintMessage, setUsbTestPrintMessage] = useState<string>("");
  const [usbTestPrintSuccess, setUsbTestPrintSuccess] = useState<boolean | null>(null);

  const triggerUsbTestPrint = async (device: any) => {
    if (!device) return;
    setUsbTestPrintMessage(`Generating high-fidelity dummy invoice payload...`);
    setUsbTestPrintSuccess(null);

    const dummyInvoiceBytes = 
`========================================
             OMNISUITE RESORT           
          HARDWARE TEST RECEIPT         
========================================
DATE: 2026-06-22 07:48:19
FOLIO NO: F-924-USB
GUEST: EMMANUEL TESTER
ROOM: 404 (PREMIUM PENTHOUSE VIEW)
----------------------------------------
Nightly Tariffs (3 Nights)    $1,050.00
Spa Amenities & Wellness       $150.00
Beverages Room Service         $85.00
----------------------------------------
SUBTOTAL:                     $1,285.00
STATE & LOCAL TAX (15%):       $192.75
REBATE ADJUSTMENT:             -$50.00
========================================
GRAND TOTAL:                  $1,427.75
========================================
PAYMENTS RECEIVED:            $1,427.75
OUTSTANDING BALANCE:              $0.00
========================================
STATUS: PAID & SETTLED
CHANNELS: DIRECT PHYSICAL PORT SUCCESS
========================================
Thank you for staying at OmniSuite!
`;

    try {
      setUsbTestPrintMessage(`Transmitting ESC/POS packet stream (size: ${dummyInvoiceBytes.length} bytes)...`);
      const result = await PrinterService.getInstance().sendRawCommand(
        device.apiType,
        device.vendorId,
        device.productId,
        dummyInvoiceBytes
      );

      if (result.success) {
        setUsbTestPrintSuccess(true);
        setUsbTestPrintMessage(`SUCCESS! Tested device '${device.name}'. ${result.diagnostic}`);
        addAuditLog("PRINTER", `Successfully triggered dummy invoice test print on USB device: ${device.name}`);
      } else {
        setUsbTestPrintSuccess(false);
        setUsbTestPrintMessage(`Failed to transmit raw packet. Reason: ${result.diagnostic}`);
      }
    } catch (err: any) {
      setUsbTestPrintSuccess(false);
      setUsbTestPrintMessage(`Error compiling/sending payload: ${err.message}`);
    }
  };

  const handleDirectBindUSB = async (printerId: string, printerName: string) => {
    try {
      const device = await requestPhysicalUsbDevice();
      if (device) {
        updatePrinter(printerId, {
          connection: `USB Controller (${device.vendorId}:${device.productId})`,
          ip: `Serial: ${device.serialNumber || "N/A"} (${device.apiType})`,
          type: "Thermal Roll 80mm",
          status: device.status
        });
        addAuditLog("PRINTER", `Successfully bound physical WebUSB port for printer '${printerName}' to device: ${device.name}`);
      }
    } catch (error: any) {
      console.error("[SettingsModule] USB binding canceled/failed:", error);
    }
  };

  const handleDirectBindHID = async (printerId: string, printerName: string) => {
    try {
      const device = await requestPhysicalHidDevice();
      if (device) {
        updatePrinter(printerId, {
          connection: `HID Controller (${device.vendorId}:${device.productId})`,
          ip: `Serial: ${device.serialNumber || "N/A"} (${device.apiType})`,
          type: "Laser / HID Port",
          status: device.status
        });
        addAuditLog("PRINTER", `Successfully bound physical WebHID port for printer '${printerName}' to device: ${device.name}`);
      }
    } catch (error: any) {
      console.error("[SettingsModule] HID binding canceled/failed:", error);
    }
  };

  const handleUnbindHardware = (printerId: string, printerName: string) => {
    updatePrinter(printerId, {
      connection: "Wi-Fi Network",
      ip: "192.168.1.50",
      type: "Thermal Roll 80mm"
    });
    addAuditLog("PRINTER", `Unbound physical hardware ports from printer entity: ${printerName}`);
  };

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

  // 3. Printer Ecosystem Windows Auto-Discovery Scan State
  const [windowsScanStatus, setWindowsScanStatus] = useState<"idle" | "scanning" | "found">("idle");
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [discoveredPrinters, setDiscoveredPrinters] = useState<any[]>([]);

  // Printer addition variables
  const [newPrName, setNewPrName] = useState("");
  const [newPrType, setNewPrType] = useState<string>("Thermal Roll 80mm");
  const [newPrConn, setNewPrConn] = useState<string>("Wi-Fi Network");
  const [newPrIp, setNewPrIp] = useState("192.168.1.");
  const [newPrRole, setNewPrRole] = useState<string>("All Receipts");

  // Printer editing state variables
  const [editingPrinterId, setEditingPrinterId] = useState<string | null>(null);
  const [editPrName, setEditPrName] = useState("");
  const [editPrType, setEditPrType] = useState("");
  const [editPrLocation, setEditPrLocation] = useState("");
  const [editPrConn, setEditPrConn] = useState("");
  const [editPrIp, setEditPrIp] = useState("");
  const [editPrRole, setEditPrRole] = useState("");

  // Default bindings state
  const [defInvoicePr, setDefInvoicePr] = useState("prt_2");
  const [defReceiptPr, setDefReceiptPr] = useState("prt_1");
  const [defReportPr, setDefReportPr] = useState("pr-3");

  // Test Print simulation state
  const [activeTestingPrinter, setActiveTestingPrinter] = useState<PrinterConfig | null>(null);
  const [testProgress, setTestProgress] = useState(0);
  const [testMsg, setTestMsg] = useState("");
  const [testSuccess, setTestSuccess] = useState(false);

  // ESC/POS Command Debugger state
  const [activeDebuggingPrinter, setActiveDebuggingPrinter] = useState<PrinterConfig | null>(null);
  const [debugHexInput, setDebugHexInput] = useState("1B 40 1B 45 01 48 45 58 20 44 45 42 55 47 1B 45 00 0A 1D 56 00");
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [debugSending, setDebugSending] = useState(false);
  const [debugStatus, setDebugStatus] = useState<{ success: boolean; message: string } | null>(null);

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

  // Persists setup configs helper is completely delegated to global HMSContext.
  useEffect(() => {
    // No-op. Single source of printers truth is HMSContext.
  }, []);

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

    addPrinter({
      name: newPrName,
      location: newPrRole === "Kitchen Orders" ? "Restaurant" : (newPrRole === "Accounting Reports" ? "Accounting" : "Front Desk"),
      type: newPrType,
      isDefault: false,
      status: "Online",
      connection: newPrConn,
      ip: newPrIp,
      assignedRole: newPrRole
    });

    addAuditLog("PRINTER", `Registered new branch network printer: ${newPrName} at ${newPrIp}`);
    setNewPrName("");
    setNewPrIp("192.168.1.");
  };

  const handleDeletePrinter = (id: string, name: string) => {
    deletePrinter(id);
    addAuditLog("PRINTER", `Removed network printer interface wrapper: ${name}`);
  };

  const startEditingPrinter = (printer: any) => {
    setEditingPrinterId(printer.id);
    setEditPrName(printer.name);
    setEditPrType(printer.type);
    setEditPrLocation(printer.location || "Front Desk");
    setEditPrConn(printer.connection || "Wi-Fi Network");
    setEditPrIp(printer.ip || "192.168.1.");
    setEditPrRole(printer.assignedRole || "All Receipts");
  };

  const handleEditPrinterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrinterId) return;

    updatePrinter(editingPrinterId, {
      name: editPrName,
      type: editPrType,
      location: editPrLocation,
      connection: editPrConn,
      ip: editPrIp,
      assignedRole: editPrRole
    });

    addAuditLog("PRINTER", `Updated configurations of printer: ${editPrName}`);
    setEditingPrinterId(null);
  };

  // Windows Spooler and Driver Scanner Simulated Function
  const handleScanWindowsPrinters = () => {
    setWindowsScanStatus("scanning");
    setScanLogs([
      "🔋 [SPOOLSV] Initializing connection to Windows Print Spooler (spoolsv.exe)...",
      "🛰️ [DRIVER] Loading client side Win32 drivers dynamic wrapper...",
    ]);
    setDiscoveredPrinters([]);

    setTimeout(() => {
      setScanLogs(prev => [...prev, "🔍 [SPOOLSV] Enumerating active print spoolers (PRINTER_ENUM_LOCAL | PRINTER_ENUM_CONNECTIONS)..."]);
      setTimeout(() => {
        setScanLogs(prev => [...prev, "📄 [SPOOLSV] Reading drivers registry: Software\\Microsoft\\Windows NT\\CurrentVersion\\Print\\Printers..."]);
        setTimeout(() => {
          setScanLogs(prev => [...prev, "🔌 [DRIVER] Discovered 5 installed system printers with online/offline states."]);
          setTimeout(() => {
            const list = [
              { name: "HP LaserJet Pro M402dn", type: "Laser", connection: "USB Local Cable", ip: "USB001 (Windows Spool)", status: "Online" as const, assignedRole: "Bill Invoices" },
              { name: "Zebra GK420t Thermal Label", type: "Thermal", connection: "USB Local Cable", ip: "USB002 (Zebra Spool)", status: "Online" as const, assignedRole: "All Receipts" },
              { name: "Microsoft Print to PDF", type: "Laser", connection: "Virtual Port", ip: "PORTPROMPT: (Virtual)", status: "Online" as const, assignedRole: "All Receipts" },
              { name: "Canon TS3120 Series Inkjet", type: "Inkjet", connection: "Wi-Fi Network", ip: "192.168.1.188 (Local WLAN)", status: "Offline" as const, assignedRole: "Accounting Reports" },
              { name: "Epson LX-310 Dot Matrix", type: "Dot Matrix KOT", connection: "USB Local Cable", ip: "LPT1: (Parallel-USB)", status: "Offline" as const, assignedRole: "Kitchen Orders" }
            ];
            setDiscoveredPrinters(list);
            setWindowsScanStatus("found");
            setScanLogs(prev => [...prev, "🏁 [SPOOLSV] Scan complete! Selected printers are ready for local/attached routing association."]);
            addAuditLog("PRINTER", "Executed auto-discovery scan on client Windows Print Spool Host. 5 drivers identified.");
          }, 600);
        }, 605);
      }, 610);
    }, 615);
  };

  const handleAttachDiscoveredPrinter = (dp: any) => {
    addPrinter({
      name: dp.name,
      location: dp.assignedRole === "Kitchen Orders" ? "Restaurant" : (dp.assignedRole === "Accounting Reports" ? "Accounting" : "Front Desk"),
      type: dp.type,
      isDefault: false,
      status: dp.status,
      connection: dp.connection,
      ip: dp.ip,
      assignedRole: dp.assignedRole
    });
    alert(`Attached Windows Printer: "${dp.name}" of status ${dp.status} successfully mapped to default queue!`);
  };

  const handleBulkAttachAllPrinters = () => {
    discoveredPrinters.forEach(dp => {
      addPrinter({
        name: dp.name,
        location: dp.assignedRole === "Kitchen Orders" ? "Restaurant" : (dp.assignedRole === "Accounting Reports" ? "Accounting" : "Front Desk"),
        type: dp.type,
        isDefault: false,
        status: dp.status,
        connection: dp.connection,
        ip: dp.ip,
        assignedRole: dp.assignedRole
      });
    });
    alert("BULK COMPLETE: All 5 discovered Windows printers have been securely attached & default routing profiles updated.");
  };

  const handleSendRawHexDebug = async () => {
    if (!activeDebuggingPrinter) return;
    setDebugSending(true);
    setDebugStatus(null);
    const printer = activeDebuggingPrinter;
    
    const timestamp = new Date().toLocaleTimeString();
    let currentLogs = [`[${timestamp}] Initiating custom byte stream compile...`];
    setDebugLogs(currentLogs);

    try {
      const cleanHex = debugHexInput.replace(/[^a-fA-F0-9]/g, "");
      if (cleanHex.length === 0) {
        throw new Error("No valid hex character tokens found. Input should contain paired HEX codes (e.g., 1B 40).");
      }
      if (cleanHex.length % 2 !== 0) {
        throw new Error("Odd length of hex digits. Hex fields must form exact byte-byte pairs (each 2 characters long).");
      }

      const bytes = parseHexToUint8Array(debugHexInput);
      currentLogs.push(`[${new Date().toLocaleTimeString()}] Hex compiled successfully. Byte array size: ${bytes.length} bytes.`);
      
      // Live decompile for immediate troubleshooting visibility
      currentLogs.push(`[${new Date().toLocaleTimeString()}] Live decoding output sequence:`);
      const decodedInfo = decodeEscPosBytes(bytes);
      decodedInfo.forEach((step, idx) => {
        currentLogs.push(`  Byte #${idx + 1}: ${step}`);
      });
      setDebugLogs([...currentLogs]);

      const isPhysical = printer.connection?.includes("USB Controller") || printer.connection?.includes("HID Controller");
      
      if (isPhysical) {
        const matches = printer.connection.match(/0x[0-9A-Fa-f]{4}/g);
        if (matches && matches.length >= 2) {
          const vendorId = matches[0];
          const productId = matches[1];
          const apiType = printer.connection.includes("USB") ? "WebUSB" : "WebHID";

          currentLogs.push(`[${new Date().toLocaleTimeString()}] Transmitting stream to physical hardware interface ${apiType}...`);
          setDebugLogs([...currentLogs]);

          const response = await PrinterService.getInstance().sendRawCommand(
            apiType,
            vendorId,
            productId,
            bytes
          );

          if (response.success) {
            currentLogs.push(`[${new Date().toLocaleTimeString()}] SUCCESS: ${response.bytesWritten} bytes dispatched over hardware channel.`);
            currentLogs.push(`[${new Date().toLocaleTimeString()}] Hardware response detail: ${response.diagnostic}`);
            setDebugLogs([...currentLogs]);
            
            setDebugStatus({
              success: true,
              message: `Success! Wrote ${response.bytesWritten} bytes to native printer controller port: ${response.diagnostic}`
            });
            addAuditLog("PRINTER", `Raw Hex Debugger successfully spooled ${bytes.length} bytes sequence directly to device ${printer.name}`);
          } else {
            throw new Error(`Device hardware ports reject or command buffer overflow: ${response.diagnostic}`);
          }
        } else {
          throw new Error("Invalid hardware Vendor/Product addresses. Try unlinking and rebinding the direct physical port.");
        }
      } else {
        // Mock simulation dry run
        currentLogs.push(`[${new Date().toLocaleTimeString()}] Simulated dry-run spooler started for: '${printer.name}'...`);
        // Simulate a small network latency
        await new Promise(resolve => setTimeout(resolve, 500));
        currentLogs.push(`[${new Date().toLocaleTimeString()}] Acknowledged binary stream. Complete matching layout successfully.`);
        setDebugLogs([...currentLogs]);

        setDebugStatus({
          success: true,
          message: `Emulation Success! Simulated a ${bytes.length}-byte custom ESC/POS protocol sequence to simulated queue successfully.`
        });
        addAuditLog("PRINTER", `Dry-run raw ESC/POS simulator processed ${bytes.length} bytes for queue: ${printer.name}`);
      }
    } catch (err: any) {
      currentLogs.push(`[${new Date().toLocaleTimeString()}] ❌ Transport Aborted: ${err.message || err}`);
      setDebugLogs([...currentLogs]);
      setDebugStatus({
        success: false,
        message: err.message || "An unexpected parser or USB packet buffer overflow occurred."
      });
    } finally {
      setDebugSending(false);
    }
  };

  // Trigger simulated Test Print Job
  const triggerTestPrint = (printer: PrinterConfig) => {
    setActiveTestingPrinter(printer);
    setTestProgress(10);
    setTestSuccess(false);
    const isWeb = printer.connection === "Web Browser Print" || printer.type === "Web Browser Printer";
    setTestMsg(isWeb ? "Initializing local Web Browser Print engine..." : `Locating active printer routing node: ${printer.name}...`);

    const interval = setInterval(() => {
      setTestProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTestSuccess(true);
          
          let transmissionNotes = "";
          const isPhysical = printer.connection?.includes("USB Controller") || printer.connection?.includes("HID Controller");
          if (isPhysical) {
            const matches = printer.connection.match(/0x[0-9A-Fa-f]{4}/g);
            if (matches && matches.length >= 2) {
              const vendorId = matches[0];
              const productId = matches[1];
              const apiType = printer.connection.includes("USB") ? "WebUSB" : "WebHID";
              
              const testTicketTxt = 
`========================================
             OMNISUITE RESORT           
          HARDWARE SPOOLER TEST         
========================================
PRINTER NAME: ${printer.name}
TYPE/STYLE: ${printer.type}
CONNECTION: ${printer.connection}
IDENTIFIER: ${printer.ip}
TIME: ${new Date().toLocaleString()}
STATUS: SUCCESSFUL EMULATION BOUND
----------------------------------------
This is a live hardware test receipt.
If you can read this text, your thermal
printer physical interface is fully online,
paired, and successfully communication-ready.
========================================


\n\n\n`;

              PrinterService.getInstance().sendRawCommand(
                apiType,
                vendorId,
                productId,
                testTicketTxt
              ).then((result) => {
                if (result.success) {
                  setTestMsg(`Direct hardware spool secure and dispatched! Result: ${result.diagnostic}`);
                } else {
                  setTestMsg(`Direct hardware spool failed: ${result.diagnostic}`);
                }
              }).catch((e: any) => {
                setTestMsg(`Direct physical spool connection aborted: ${e.message}`);
              });
              
              transmissionNotes = " and dispatched Web-layer Esc/Pos packets inline";
            }
          }
          
          if (!isPhysical) {
            setTestMsg(isWeb ? "Web Browser print payload compilation ready!" : `Raw ESC/POS byte-array package successfully acknowledged by printer processor!`);
          }
          addAuditLog("PRINTER", `Triggered successful test print folio receipt page on ${printer.name} [${printer.ip}]${transmissionNotes}`);
          return 100;
        }
        if (p === 30) setTestMsg(isWeb ? "Acquiring container viewport resolution guidelines..." : `Establishing handshakes packet transport on connection scope [${printer.connection}]`);
        if (p === 65) setTestMsg(isWeb ? "Formulating interactive high-fidelity HTML stylesheet draft..." : `Spooling customized document template schema. Buffer allocated...`);
        if (p === 85) setTestMsg(isWeb ? "Readying local layout viewport for native print handover..." : `Pushing raster graphics payload inline...`);
        return p + 15;
      });
    }, 400);
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
      {ToastElement}

      {/* Edit Printer Configuration Modal */}
      {editingPrinterId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="edit-printer-modal-wrapper">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-500" />
                Edit Mounted Printer &amp; Port Settings
              </h5>
              <button 
                onClick={() => setEditingPrinterId(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditPrinterSubmit} className="space-y-4">
              {/* Form Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Printer Friendly Name</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 font-semibold focus:bg-white text-slate-800"
                    value={editPrName} 
                    onChange={(e) => setEditPrName(e.target.value)} 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Paper/Device Style Spec</label>
                  <select 
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 font-semibold focus:bg-white text-slate-800"
                    value={editPrType} 
                    onChange={(e) => setEditPrType(e.target.value)}
                  >
                    <option value="Thermal Roll 80mm">Thermal Roll 80mm (Desktop Slip)</option>
                    <option value="Thermal Roll 58mm">Thermal Roll 58mm (Mobile POS Slip)</option>
                    <option value="Office LaserJet A4">Office LaserJet A4 (High Density Invoice)</option>
                    <option value="Dot Matrix KOT">Dot Matrix KOT (Impact Duplicate Paper)</option>
                    <option value="Laser / HID Port">Laser / HID Port</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Physical Placement Room</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 font-semibold focus:bg-white text-slate-800"
                    value={editPrLocation} 
                    onChange={(e) => setEditPrLocation(e.target.value)} 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Task Queue Assignment</label>
                  <select 
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 font-semibold focus:bg-white text-slate-800"
                    value={editPrRole} 
                    onChange={(e) => setEditPrRole(e.target.value)}
                  >
                    <option value="All Receipts">All Receipts (Front Desk)</option>
                    <option value="Bill Invoices">Bill Invoices (Checkout)</option>
                    <option value="Kitchen Orders">Kitchen Orders (Kitchen F&amp;B)</option>
                    <option value="Accounting Reports">Accounting Reports (Admin)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Connection Port Interface</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Wi-Fi Network, Bluetooth"
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 font-semibold focus:bg-white text-slate-800"
                    value={editPrConn} 
                    onChange={(e) => setEditPrConn(e.target.value)} 
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Endpoint IP / Hardware Identification Address</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. 192.168.1.15, Serial: XXX"
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 font-semibold focus:bg-white font-mono text-slate-800"
                    value={editPrIp} 
                    onChange={(e) => setEditPrIp(e.target.value)} 
                  />
                </div>
              </div>

              {/* Dynamic Attachment of Physical hardware segment */}
              <div className="border-t border-dashed border-slate-200 pt-3 space-y-2">
                <span className="text-[10.5px] uppercase font-mono tracking-wider font-extrabold text-slate-700 flex items-center gap-1.5">
                  🔌 Attach Discovered Scanned Port
                </span>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Automatically link this printer profile with any physically scanned USB/HID serial port found in the browser session.
                </p>

                {discoveredUsbPrinters.length === 0 ? (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 text-center space-y-2">
                    <p className="text-[10px] text-slate-500">
                      No active hardware endpoints detected in local scan cache.
                    </p>
                    <div className="flex justify-center gap-2">
                      <button 
                        type="button"
                        disabled={isUsbScanning}
                        onClick={scanUsbPrinters}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded border border-slate-200 transition cursor-pointer flex items-center gap-1.5"
                      >
                        {isUsbScanning ? (
                          <>
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-ping"></span>
                            Scanning Buses...
                          </>
                        ) : (
                          "🔍 Emulate Hardware Bus Scan"
                        )}
                      </button>

                      <button 
                        type="button"
                        onClick={async () => {
                          const device = await requestPhysicalUsbDevice();
                          if (device) {
                            setEditPrConn(`USB Controller (${device.vendorId}:${device.productId})`);
                            setEditPrIp(`Serial: ${device.serialNumber || "N/A"} (${device.apiType})`);
                            setEditPrType(device.apiType === "WebUSB" ? "Thermal Roll 80mm" : "Laser / HID Port");
                            alert(`Linked client printer to active WebUSB product: ${device.name}`);
                          }
                        }}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded border border-indigo-100 transition cursor-pointer"
                      >
                        🔗 WebUSB Pair Dialog
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto bg-slate-50 p-2.5 rounded-lg border">
                    {discoveredUsbPrinters.map((dev: any) => {
                      const usbPath = `USB Controller (${dev.vendorId}:${dev.productId})`;
                      const isCurrentlyBound = editPrConn === usbPath;

                      return (
                        <div 
                          key={dev.id} 
                          className={`p-2 rounded-md border flex items-center justify-between text-[11px] transition ${
                            isCurrentlyBound 
                              ? "bg-emerald-50 border-emerald-300 text-emerald-800" 
                              : "bg-white border-slate-200 hover:border-indigo-300 text-slate-705 text-slate-700"
                          }`}
                        >
                          <div>
                            <p className="font-bold flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${dev.status === "Online" ? "bg-emerald-500" : "bg-red-500"}`}></span>
                              {dev.name}
                            </p>
                            <p className="text-[9.5px] text-slate-500 font-mono">
                              {dev.apiType} &bull; {dev.vendorId}:{dev.productId} &bull; S/N: {dev.serialNumber || "N/A"}
                            </p>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              setEditPrConn(usbPath);
                              setEditPrIp(`Serial: ${dev.serialNumber || "N/A"} (${dev.apiType})`);
                              setEditPrType(dev.apiType === "WebUSB" ? "Thermal Roll 80mm" : "Laser / HID Port");
                            }}
                            className={`px-2.5 py-1 rounded text-[9.5px] font-bold transition cursor-pointer ${
                              isCurrentlyBound 
                                ? "bg-emerald-600 text-white cursor-default" 
                                : "bg-indigo-600 hover:bg-indigo-500 text-white"
                            }`}
                          >
                            {isCurrentlyBound ? "Linked ✓" : "Attach/Bind"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingPrinterId(null)}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 font-bold rounded-lg px-4 py-2 text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg px-4 py-2 text-xs transition cursor-pointer shadow-xs"
                >
                  Save Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

            <div className="flex justify-end gap-2 pt-2">
              {testSuccess && (activeTestingPrinter.connection === "Web Browser Print" || activeTestingPrinter.type === "Web Browser Printer") && (
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                    addAuditLog("PRINTER", `Successfully triggered test print using native web browser print dialog`);
                  }}
                  className="bg-indigo-600 text-white font-bold rounded-lg px-4 py-1.5 text-xs hover:bg-indigo-700 transition cursor-pointer shadow-xs whitespace-nowrap"
                >
                  🖥️ Launch Browser Print
                </button>
              )}
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

      {/* ESC/POS Hex Command Debugger Overlay */}
      {activeDebuggingPrinter && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="escpos-debugger-modal-wrapper">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-3xl w-full flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <Wrench className="w-5 h-5 text-indigo-600 animate-spin-slow" />
                </div>
                <div>
                  <h5 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                    ESC/POS Terminal Command Debugger
                  </h5>
                  <p className="text-[10px] text-slate-450 font-sans">
                    Verify direct byte array handshake compliance & printer command set capabilities.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setActiveDebuggingPrinter(null);
                  setDebugStatus(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer transition p-1"
              >
                ✕
              </button>
            </div>

            {/* Target Printer specs info */}
            <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-xs grid grid-cols-1 md:grid-cols-3 gap-2 mb-4 font-sans">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Target Device Name</span>
                <strong className="text-slate-750 font-extrabold">{activeDebuggingPrinter.name}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Bound Connection Port</span>
                <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[10px] inline-block mt-0.5">
                  {activeDebuggingPrinter.connection || "No physical port bound"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Spooler Protocol Class</span>
                <strong className="text-indigo-600">
                  {activeDebuggingPrinter.connection?.includes("USB") ? "Hardware WebUSB (Class 0x07)" : (activeDebuggingPrinter.connection?.includes("HID") ? "Hardware WebHID" : "Emulated Spooler Context")}
                </strong>
              </div>
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-y-auto pr-1">
              
              {/* Left Column: Command Entry & Presets (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Micro Command Presets */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 block">
                    ⚡ Hardware Presets (Click to Populate)
                  </span>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDebugHexInput("1B 40")}
                      className="bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-[10.5px] p-2 rounded-lg text-left transition cursor-pointer"
                      title="ESC @ - Resets printer parameters to default state"
                    >
                      <span className="font-mono text-indigo-650 font-bold block text-[9.5px]">1B 40</span>
                      <span className="text-slate-500 text-[9px]">Initialize (ESC @)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDebugHexInput("0A")}
                      className="bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-[10.5px] p-2 rounded-lg text-left transition cursor-pointer"
                      title="LF - Advances paper by single line"
                    >
                      <span className="font-mono text-indigo-650 font-bold block text-[9.5px]">0A</span>
                      <span className="text-slate-500 text-[9px]">Line Feed (LF)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDebugHexInput("1D 56 01")}
                      className="bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-[10.5px] p-2 rounded-lg text-left transition cursor-pointer"
                      title="GS V 1 - Activates hardware knives to cut receipt paper"
                    >
                      <span className="font-mono text-indigo-650 font-bold block text-[9.5px]">1D 56 01</span>
                      <span className="text-slate-500 text-[9px]">Partial Cut (GS V)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDebugHexInput("07")}
                      className="bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-[10.5px] p-2 rounded-lg text-left transition cursor-pointer"
                      title="BEL - Sound internal chassis beep/buzzer"
                    >
                      <span className="font-mono text-indigo-650 font-bold block text-[9.5px]">07</span>
                      <span className="text-slate-500 text-[9px]">Chassis Beep (BEL)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDebugHexInput("1B 45 01 4F 4D 4E 49 1B 45 00 0A")}
                      className="bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-[10.5px] p-2 rounded-lg text-left transition cursor-pointer"
                      title="ESC E 1 'OMNI' ESC E 0 LF"
                    >
                      <span className="font-mono text-indigo-650 font-bold block text-[9.5px]">1B 45 01...</span>
                      <span className="text-slate-500 text-[9px]">Bold Text Cycle</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDebugHexInput("1B 2D 01 54 45 53 54 1B 2D 00 0A")}
                      className="bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-[10.5px] p-2 rounded-lg text-left transition cursor-pointer"
                      title="ESC - 1 'TEST' ESC - 0 LF"
                    >
                      <span className="font-mono text-indigo-650 font-bold block text-[9.5px]">1B 2D 01...</span>
                      <span className="text-slate-500 text-[9px]">Underline Text</span>
                    </button>
                  </div>
                </div>

                {/* Hex entry field */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">
                      📝 Raw Hexadecimal Sequence Stream (Space Separated)
                    </label>
                    <button
                      type="button"
                      onClick={() => setDebugHexInput("")}
                      className="text-[9.5px] font-extrabold text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      Clear Input
                    </button>
                  </div>
                  
                  <textarea
                    rows={4}
                    value={debugHexInput}
                    onChange={(e) => {
                      // Filter characters: only hex letters, numbers, spaces, commas permitted
                      const val = e.target.value.replace(/[^a-fA-F0-9\s,]/gi, "");
                      setDebugHexInput(val);
                    }}
                    placeholder="E.g., 1B 40 1B 45 01 48 45 4C 4C 4F 1B 45 00 0A 1D 56 01"
                    className="w-full bg-slate-950 text-white font-mono text-xs p-3 rounded-lg border border-slate-800 focus:border-indigo-500 focus:outline-hidden whitespace-pre-wrap leading-relaxed shadow-inner"
                  />
                  <p className="text-[9.5px] text-slate-400 font-sans">
                    Type or paste space-separated hex bytes. High-level commands like line feeds (`0A`), initialize (`1B 40`), beep (`07`), or bold (`1B 45 01`) allow debugging thermal layouts safely.
                  </p>
                </div>

                {/* Status response notifications */}
                {debugStatus && (
                  <div className={`p-3 rounded-lg text-xs flex items-start gap-2 border animate-fade-in ${
                    debugStatus.success 
                      ? "bg-emerald-50 text-emerald-800 border-emerald-250" 
                      : "bg-rose-50 text-rose-800 border-rose-250"
                  }`}>
                    <span className="mt-0.5">{debugStatus.success ? "✓" : "⚠"}</span>
                    <div>
                      <p className="font-bold">{debugStatus.success ? "Command Transmitted Successfully" : "Hardware Transmission Aborted"}</p>
                      <p className="text-[10.5px] font-sans mt-0.5">{debugStatus.message}</p>
                    </div>
                  </div>
                )}

                {/* Transmit Buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={debugSending || !debugHexInput}
                    onClick={handleSendRawHexDebug}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs disabled:cursor-not-allowed"
                  >
                    {debugSending ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Transmitting Hex...
                      </>
                    ) : (
                      <>
                        <Terminal className="w-3.5 h-3.5" />
                        Transmit ESC/POS Hex Stream
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column: Live Decompile & Logs (5 cols) */}
              <div className="lg:col-span-5 flex flex-col space-y-4">
                
                {/* Live Decompile view */}
                <div className="flex-1 flex flex-col min-h-[140px]">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 block mb-1.5">
                    🔎 Live Decompiler Preview (Realtime Stream decoding)
                  </span>
                  
                  <div className="flex-1 bg-amber-50/20 border border-amber-200/50 p-3 rounded-lg overflow-y-auto max-h-[160px] text-[10.5px] font-mono leading-relaxed text-slate-700 space-y-1">
                    {(() => {
                      try {
                        const cleanStr = debugHexInput.replace(/[^a-fA-F0-9]/g, "");
                        if (!cleanStr) return <span className="text-stone-400 italic font-sans">No bytes entered. Input text above in HEX to begin live decompiling.</span>;
                        const bytes = parseHexToUint8Array(cleanStr);
                        const decompiledList = decodeEscPosBytes(bytes);
                        return (
                          <div className="flex flex-wrap gap-1 font-mono text-[9px]">
                            {decompiledList.map((tag, idx) => {
                              const isCommand = tag.startsWith("[");
                              return (
                                <span 
                                  key={idx} 
                                  className={`px-1 py-0.5 rounded leading-tight ${
                                    isCommand 
                                      ? "bg-indigo-100/60 text-indigo-805 border border-indigo-200/40 font-bold" 
                                      : "bg-slate-100 text-slate-700 font-normal border border-slate-200"
                                  }`}
                                  title={`Byte Position #${idx + 1}`}
                                >
                                  {tag}
                                </span>
                              );
                            })}
                          </div>
                        );
                      } catch (err: any) {
                        return <span className="text-red-500 italic font-sans">Wait: {err.message || "Syntactic hex alignment mismatch."}</span>;
                      }
                    })()}
                  </div>
                </div>

                {/* Hardware Terminal Logs Console */}
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 block mb-1.5">
                    🖥️ Diagnostic Terminal Execution Logs
                  </span>
                  
                  <div className="bg-slate-950 font-mono text-emerald-400 text-[10.5px] p-3 rounded-lg border border-slate-800 h-[190px] overflow-y-auto space-y-1 shadow-inner">
                    {debugLogs.length === 0 ? (
                      <p className="text-slate-500 italic">No command dispatched yet. Setup raw commands and execute transmission.</p>
                    ) : (
                      debugLogs.map((log, idx) => (
                        <p key={idx} className="leading-snug break-all border-b border-white/5 pb-0.5 last:border-0">{log}</p>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* Footer */}
            <div className="border-t pt-3 mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveDebuggingPrinter(null);
                  setDebugStatus(null);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg px-4 py-2 text-xs transition cursor-pointer"
              >
                Close Debugger Portal
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
          <div className="space-y-6">
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
                    <option value="Web Browser Printer">🌐 Web Browser Native Print Interface</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Connection Type</label>
                    <select
                      className="text-xs border border-slate-205 rounded-lg p-2 bg-white font-semibold text-slate-755"
                      value={newPrConn}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewPrConn(val);
                        if (val === "Web Browser Print" && (newPrIp === "" || newPrIp === "192.168.1.")) {
                          setNewPrIp("browser://native-print");
                        } else if (val !== "Web Browser Print" && newPrIp === "browser://native-print") {
                          setNewPrIp("192.168.1.");
                        }
                      }}
                    >
                      <option value="Wi-Fi Network">📶 Wi-Fi Network</option>
                      <option value="Ethernet LAN">🔌 Ethernet LAN</option>
                      <option value="USB Local Cable">💻 USB Local Cable</option>
                      <option value="Bluetooth">📱 Bluetooth Sync</option>
                      <option value="Web Browser Print">🖥️ Web Browser Print</option>
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

              {/* Windows OS Printer Scanner & Auto-Discovery Bridge */}
              <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h4 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-indigo-400">
                    <Laptop className="w-4 h-4 text-indigo-400" />
                    Windows Spooler Bridge
                  </h4>
                  <span className="text-[9px] bg-slate-850 text-indigo-300 font-mono font-bold px-1.5 py-0.2 rounded border border-indigo-900/60 uppercase">
                    WIN32_PRINTER
                  </span>
                </div>

                <p className="text-[10.5px] text-slate-300 leading-relaxed font-normal">
                  Scans Windows PC active printing services (via local spool bridge) to discover online and offline drivers connected and attach them to OmniSuite.
                </p>

                {windowsScanStatus === "idle" && (
                  <button
                    type="button"
                    onClick={handleScanWindowsPrinters}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2.5 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:scale-[1.01]"
                  >
                    <Search className="w-3.5 h-3.5" />
                    Scan Windows Installed Printers
                  </button>
                )}

                {windowsScanStatus === "scanning" && (
                  <div className="space-y-3 p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-300">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold animate-pulse">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping"></span>
                      <span>SPOOLER INQUIRY RUNNING...</span>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin text-stone-400">
                      {scanLogs.map((log, idx) => (
                        <p key={idx} className="leading-tight">{log}</p>
                      ))}
                    </div>
                  </div>
                )}

                {windowsScanStatus === "found" && (
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-950/60 border border-emerald-900/50 rounded-lg text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <CheckCircle className="w-4 h-4" />
                        <span>Discovered {discoveredPrinters.length} System Printers</span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-normal">
                        Select device to attach to OmniSuite or import them to register local hardware endpoints.
                      </p>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {discoveredPrinters.map((dp, i) => (
                        <div key={i} className="p-2.5 bg-slate-950/80 border border-slate-850 rounded-lg flex items-center justify-between text-[11px] gap-2">
                          <div className="space-y-1 truncate">
                            <div className="font-bold text-slate-100 flex items-center gap-1.5 leading-tight truncate">
                              <span className={`w-1.5 h-1.5 rounded-full ${dp.status === "Online" ? "bg-emerald-500" : "bg-red-505"}`}></span>
                              {dp.name}
                            </div>
                            <div className="text-[9.5px] text-slate-400 font-mono tracking-tight flex flex-wrap gap-x-2">
                              <span>Port: {dp.ip.split(" ")[0]}</span>
                              <span>&bull;</span>
                              <span>{dp.connection}</span>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleAttachDiscoveredPrinter(dp)}
                            className="bg-indigo-600 hover:bg-slate-800 text-white border border-indigo-500/30 text-[9.5px] font-black uppercase px-2 py-1 rounded cursor-pointer shrink-0 transition"
                          >
                            Attach
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={handleScanWindowsPrinters}
                        className="bg-transparent hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold px-2 py-2 rounded-lg text-[10.5px] transition text-center cursor-pointer"
                      >
                        Rescan OS
                      </button>
                      <button
                        type="button"
                        onClick={handleBulkAttachAllPrinters}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2 py-2 rounded-lg text-[10.5px] transition text-center cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        Bulk Attach All
                      </button>
                    </div>
                  </div>
                )}
              </div>
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

                    // Evaluate actual live connection status
                    let isOnline = p.status === "Online";
                    const isPhysical = p.connection?.includes("USB Controller") || p.connection?.includes("HID Controller");

                    if (isPhysical) {
                      const matches = p.connection.match(/0x[0-9A-Fa-f]{4}/g);
                      if (matches && matches.length >= 2) {
                        const vendorId = matches[0].toUpperCase();
                        const productId = matches[1].toUpperCase();
                        const isConnected = discoveredUsbPrinters.some(
                          (dev: any) => dev.vendorId.toUpperCase() === vendorId && dev.productId.toUpperCase() === productId
                        );
                        isOnline = isConnected;
                      } else {
                        isOnline = false;
                      }
                    }

                    return (
                      <div key={p.id} className="border border-slate-150 p-4 rounded-xl shadow-3xs hover:shadow-xs transition duration-200 bg-slate-50/50 space-y-3 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded font-mono">
                              {p.type}
                            </span>
                            {isOnline ? (
                              <span className="flex items-center gap-1 text-[10.5px] font-bold text-emerald-700">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Online
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10.5px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full font-sans uppercase tracking-wider text-[8px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                Offline
                              </span>
                            )}
                          </div>

                          <h5 className="font-extrabold text-slate-800 text-xs tracking-tight">{p.name}</h5>
                          
                          <div className="text-[10.5px] text-slate-500 font-mono space-y-0.5">
                            <p className="flex items-center gap-1"><Network className="w-3 h-3 text-slate-400" /> Interface: {p.connection || "Local USB Hub"}</p>
                            <p className="flex items-center gap-1"><Wifi className="w-3 h-3 text-slate-400" /> Endpoint IP: {p.ip || "127.0.0.1 (OS Shared)"}</p>
                            <p className="font-bold text-slate-650 mt-1 uppercase tracking-wider text-[9px] bg-slate-100 p-1 rounded inline-block font-sans">
                              Target task: {p.assignedRole || (p.isDefault ? "All Receipts" : "Staff Report Output")}
                            </p>
                          </div>

                          {/* Hardware Port Binding Control Center */}
                          <div className="mt-2.5 pt-2 border-t border-dashed border-slate-200 space-y-1.5" id={`card-port-linker-${p.id}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] uppercase tracking-wider font-bold text-indigo-650 flex items-center gap-1 font-sans">
                                <Cable className="w-3 h-3 text-indigo-500" /> Hardware Port Link
                              </span>
                              {(p.connection?.includes("USB Controller") || p.connection?.includes("HID Controller")) && (
                                <span className="bg-emerald-100 text-emerald-800 text-[8px] font-extrabold font-mono uppercase px-1.5 py-0.2 rounded">
                                  ACTIVE PORT
                                </span>
                              )}
                            </div>
                            
                            {(p.connection?.includes("USB Controller") || p.connection?.includes("HID Controller")) ? (
                              <div className="bg-emerald-50/70 border border-emerald-200 p-2 rounded-lg text-[10px] space-y-1.5 animate-fade-in">
                                <p className="text-emerald-800 leading-tight">
                                  ⚡ Bound successfully to physical hardware interface. Spooling ESC/POS output directly.
                                </p>
                                <div className="flex items-center justify-between text-[9px] text-emerald-700 font-mono">
                                  <span>{p.connection.includes("USB") ? "Interface: USB Port" : "Interface: HID Port"}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleUnbindHardware(p.id, p.name)}
                                    className="text-red-500 hover:text-red-700 font-extrabold underline cursor-pointer uppercase text-[8.5px]"
                                  >
                                    Unlink Port
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-[10px] space-y-2">
                                <p className="leading-tight text-slate-500 text-[10px]">
                                  Lacks dedicated hardware. Trigger Web USB/HID selection flow to bind this entity to a physical port:
                                </p>
                                <div className="grid grid-cols-2 gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleDirectBindUSB(p.id, p.name)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded py-1 px-1.5 text-[9.5px] transition flex items-center justify-center gap-1 cursor-pointer shadow-3xs"
                                    title="Open WebUSB device selection menu"
                                  >
                                    <Cable className="w-2.5 h-2.5" /> Bind WebUSB
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDirectBindHID(p.id, p.name)}
                                    className="bg-slate-700 hover:bg-slate-650 text-white font-bold rounded py-1 px-1.5 text-[9.5px] transition flex items-center justify-center gap-1 cursor-pointer shadow-3xs"
                                    title="Open WebHID device selection menu"
                                  >
                                    <Cpu className="w-2.5 h-2.5" /> Bind WebHID
                                  </button>
                                </div>
                              </div>
                            )}
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

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2 gap-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => triggerTestPrint(p)}
                              className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-lg px-2.5 py-1 text-[10.5px] transition flex items-center gap-1 cursor-pointer shadow-3xs"
                            >
                              <Eye className="w-3 h-3" /> ESC/POS Test Job
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveDebuggingPrinter(p);
                                setDebugStatus(null);
                                setDebugLogs([]);
                              }}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg px-2.5 py-1 text-[10.5px] transition flex items-center gap-1 cursor-pointer shadow-3xs"
                              title="Hardware command set debugger with hexadecimal builder"
                            >
                              <Wrench className="w-3 h-3" /> Hex Debugger
                            </button>

                            <button
                              type="button"
                              onClick={() => startEditingPrinter(p)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-705 border border-slate-200 font-bold rounded-lg px-2.5 py-1 text-[10.5px] transition flex items-center gap-1 cursor-pointer shadow-3xs text-slate-700"
                              title="Edit configurations & attach hardware"
                            >
                              <Edit className="w-3.5 h-3.5 text-slate-500" /> Edit Config
                            </button>
                          </div>

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
          
          {/* SECTION: Printer Configuration (USB/HID Gateway) */}
          <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs space-y-4" id="usb-hid-discovery-section">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-2.5 flex items-center gap-1.5 justify-between">
              <span className="flex items-center gap-1.5">
                <Network className="w-4 h-4 text-indigo-500 animate-pulse" />
                Printer Configuration (USB / HID Hardware)
              </span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-mono font-bold px-1.5 py-0.5 rounded border border-indigo-100 uppercase">
                RAW SERVICE BOUND
              </span>
            </h4>

            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Locate active physical USB or Human Interface Devices (HID) connected via desktop local ports. Deselect any other routing profiles and set your <strong className="text-slate-800">Default Target Spooler</strong>. Verify formatting instantly with dummy receipt invoice rendering.
            </p>

            {/* Scan triggers */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={scanUsbPrinters}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isUsbScanning ? "animate-spin" : ""}`} />
                Scan USB/HID Ports
              </button>

              <button
                type="button"
                onClick={requestPhysicalUsbDevice}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg px-4 py-2 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-500" />
                Query WebUSB
              </button>

              <button
                type="button"
                onClick={requestPhysicalHidDevice}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-705 rounded-lg px-4 py-2 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-500" />
                Request WebHID
              </button>
            </div>

            {/* Printers list */}
            {discoveredUsbPrinters.length === 0 ? (
              <div className="py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-450 text-xs flex flex-col items-center justify-center gap-1.5">
                <Printer className="w-8 h-8 text-slate-350 stroke-1 animate-bounce" />
                <div>
                  <p className="font-bold text-slate-500">No discovered hardware interfaces yet</p>
                  <p className="text-[10.5px]">Click "Scan USB/HID Ports" to index emulated or real local terminal line drivers.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {discoveredUsbPrinters.map((device) => {
                  const isDefault = defaultUsbPrinterId === device.id;
                  return (
                    <div
                      key={device.id}
                      className={`p-4 rounded-xl border transition duration-200 flex flex-col justify-between space-y-3 ${
                        isDefault 
                          ? "bg-indigo-50/30 border-indigo-200 shadow-3xs" 
                          : "bg-slate-50 border-slate-150 hover:bg-slate-100/40"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono uppercase border ${
                            device.apiType === "WebUSB" 
                              ? "bg-teal-50 text-teal-700 border-teal-150" 
                              : "bg-violet-50 text-violet-700 border-violet-150"
                          }`}>
                            {device.apiType}
                          </span>

                          <span className={`flex items-center gap-1 text-[10px] font-bold ${
                            device.status === "Online" ? "text-emerald-700" : "text-slate-400"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              device.status === "Online" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                            }`}></span>
                            {device.status}
                          </span>
                        </div>

                        <h5 className="font-extrabold text-slate-800 text-xs tracking-tight mt-2 flex items-center gap-1.5">
                          {device.name}
                          {isDefault && (
                            <span className="bg-indigo-600 text-white font-mono text-[8.5px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shadow-3xs">
                              ★ DEFAULT
                            </span>
                          )}
                        </h5>

                        <p className="text-[10px] text-slate-500 font-mono mt-1 leading-normal">
                          VID: {device.vendorId} &bull; PID: {device.productId} <br />
                          Class: {device.endpointType}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 flex-wrap justify-end font-sans">
                        <button
                          type="button"
                          onClick={() => {
                            setDefaultUsbPrinterId(device.id);
                            addAuditLog("PRINTER", `Assigned default active USB/HID printer node to: ${device.name}`);
                          }}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition border cursor-pointer ${
                            isDefault
                              ? "bg-slate-100 text-slate-400 border-slate-150 cursor-default"
                              : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                          disabled={isDefault}
                        >
                          {isDefault ? "Active Default" : "Set as Default"}
                        </button>

                        <button
                          type="button"
                          onClick={() => triggerUsbTestPrint(device)}
                          className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-lg px-2.5 py-1 text-[10px] transition cursor-pointer flex items-center gap-1.5 shadow-3xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Test Print
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Active spool feedback messages */}
            {usbTestPrintMessage && (
              <div className={`p-3 rounded-lg border text-xs font-mono flex items-start gap-2 animate-fade-in ${
                usbTestPrintSuccess === true
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : usbTestPrintSuccess === false
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              }`}>
                {usbTestPrintSuccess === true ? (
                  <span className="text-emerald-600 shrink-0 select-none font-bold">✔</span>
                ) : usbTestPrintSuccess === false ? (
                  <span className="text-red-600 shrink-0 select-none font-bold">❌</span>
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping mt-1"></span>
                )}
                <div className="space-y-1">
                  <span className="font-bold uppercase text-[9.5px]">Printer Spool Status</span>
                  <p className="leading-tight break-all text-slate-650">{usbTestPrintMessage}</p>
                </div>
              </div>
            )}
          </div>

          {/* Direct USB & HID Hardware Discovery Port Bridge */}
          <WebUsbHidPrinterBridge />

          {/* New Interactive Print Diagnostics Panel */}
          <PrintDiagnosticsPanel />
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
