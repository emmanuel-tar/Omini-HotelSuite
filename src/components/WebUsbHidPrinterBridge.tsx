import React, { useState } from "react";
import { usePrinter, PhysicalPrinter } from "../services/PrinterService";
import { useHMS } from "../context/HMSContext";
import { 
  Usb, 
  Cpu, 
  Play, 
  Plus, 
  Trash2, 
  Info, 
  ShieldAlert, 
  RefreshCcw, 
  Printer, 
  CheckCircle2, 
  Check,
  Zap
} from "lucide-react";

export const WebUsbHidPrinterBridge: React.FC = () => {
  const {
    scannedDevices,
    isScanning,
    transmissionLogs,
    errorContext,
    isUsbSupported,
    isHidSupported,
    requestPhysicalUsbDevice,
    requestPhysicalHidDevice,
    scanPhysicalPortsEmulated,
    spoolRawTestCommand,
    mountPrinterToOmniSuite,
    clearScans,
    ToastElement
  } = usePrinter();

  const { printers } = useHMS();

  // Selected target configurations for mounting discovered hardware
  const [defaultRole, setDefaultRole] = useState("All Receipts");
  const [customDeviceName, setCustomDeviceName] = useState("");

  const handleRegisterToHMS = (device: PhysicalPrinter) => {
    // Determine default location based on assigned role selection
    const locationMapping = 
      defaultRole === "Kitchen Orders" ? "Kitchen/Restaurant" : 
      defaultRole === "Accounting Reports" ? "Accounting Office" : "Front Desk Reception";

    const success = mountPrinterToOmniSuite(
      device, 
      locationMapping, 
      defaultRole, 
      customDeviceName
    );

    if (success) {
      alert(`Attached physical device "${customDeviceName.trim() || device.name}" successfully added to Front Desk and Settlement workflows!`);
      // Clear temp configuration input
      setCustomDeviceName("");
    }
  };

  const handleBulkAttachAll = () => {
    if (scannedDevices.length === 0) return;
    
    let addedCount = 0;
    scannedDevices.forEach(dp => {
      const locationMapping = 
        dp.endpointType.includes("Kitchen") ? "Kitchen/Restaurant" : "Front Desk Reception";
      const success = mountPrinterToOmniSuite(
        dp,
        locationMapping,
        dp.endpointType.includes("Label") ? "Bill Invoices" : "All Receipts",
        dp.name
      );
      if (success) addedCount++;
    });

    if (addedCount > 0) {
      alert(`BULK MOUNT COMPLETE: Added ${addedCount} physical devices to the active print routing scheme.`);
    } else {
      alert("No new devices were added (already registered in system config).");
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-white shadow-xl">
      {ToastElement}
      {/* Header section with Dynamic Status indicators */}
      <div className="flex items-center justify-between border-b border-slate-850 pb-3">
        <div className="space-y-1">
          <h3 className="font-extrabold text-sm tracking-wide text-indigo-400 flex items-center gap-2">
            <Usb className="w-4 h-4 text-indigo-400 animate-pulse" />
            Hardware Print Spooler Integration
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">
            Scan and pair desktop printers directly via physical USB/HID ports using PrinterService &amp; usePrinter Hook
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase transition ${
            isUsbSupported 
              ? "bg-emerald-950 text-emerald-400 border-emerald-900" 
              : "bg-amber-950 text-amber-400 border-amber-900"
          }`}>
            WebUSB: {isUsbSupported ? "Available" : "Sandbox Block"}
          </span>
          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase transition ${
            isHidSupported 
              ? "bg-emerald-950 text-emerald-400 border-emerald-900" 
              : "bg-amber-950 text-amber-400 border-amber-900"
          }`}>
            WebHID: {isHidSupported ? "Available" : "Sandbox Block"}
          </span>
        </div>
      </div>

      {/* Frame Warning Alert if permissions could be limited inside typical cloud iframes */}
      <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-lg text-[10.5px] leading-relaxed text-slate-300 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-505 shrink-0 mt-0.5 animate-bounce" />
        <div className="space-y-1">
          <span className="font-bold text-amber-400">Security Sandbox Isolation Protocol:</span>
          <p>
            Modern browsers restrict direct <strong className="text-white">WebUSB &amp; WebHID access</strong> unless connected over secure top-level window boundaries. If client sandbox blocks browser dialogues, click the <strong className="text-indigo-450 font-bold text-indigo-400">Emulate USB Scan</strong> fallback to execute simulated high-fidelity physical port handshakes!
          </p>
        </div>
      </div>

      {/* Control Scan Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={requestPhysicalUsbDevice}
          className="bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-650 text-slate-200 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          title="Queries browser permissions layer for standard physical class 0x07 (USB printers)"
        >
          <Usb className="w-3.5 h-3.5 text-indigo-400" />
          Query WebUSB Interface
        </button>

        <button
          type="button"
          onClick={requestPhysicalHidDevice}
          className="bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-650 text-slate-200 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          title="Queries browser permissions layer for Human Interface Devices (HID)"
        >
          <Cpu className="w-3.5 h-3.5 text-violet-400" />
          Request WebHID Handshake
        </button>

        <button
          type="button"
          onClick={scanPhysicalPortsEmulated}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:scale-[1.01]"
          title="Run mock scan of all local parallel printer buses & spool ports"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
          Emulate USB Scan
        </button>
      </div>

      {/* Sandboxed browser framework warnings */}
      {errorContext && (
        <div className="bg-indigo-950/40 border border-indigo-900/40 p-2.5 rounded-lg flex items-center gap-2 text-[10px] text-indigo-300">
          <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>{errorContext} Emulator simulation layer is active as helper context.</span>
        </div>
      )}

      {/* Main Grid mapping scans alongside stream byte loggers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Discovered / Attached Hardware Devices List */}
        <div className="space-y-2 border border-slate-850 p-3 rounded-lg bg-slate-950/40">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-850">
            <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-indigo-300 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-indigo-400 animate-pulse" />
              Attached Hub Hardware ({scannedDevices.length})
            </span>
            {scannedDevices.length > 0 && (
              <button 
                onClick={clearScans} 
                className="text-[9.5px] text-red-400 hover:text-red-300 font-extrabold cursor-pointer"
              >
                Reset List
              </button>
            )}
          </div>

          {scannedDevices.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-1.5">
              <Printer className="w-8 h-8 text-slate-700 stroke-1" />
              <p>No physically attached hardware endpoints found in browser cache.</p>
              <button 
                onClick={scanPhysicalPortsEmulated} 
                className="text-[10px] text-indigo-450 text-indigo-400 font-bold hover:underline cursor-pointer mt-1"
              >
                Scan connected USB cables
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {scannedDevices.map((device) => {
                const pathDescriptor = `USB Controller (${device.vendorId}:${device.productId})`;
                const alreadyAdded = printers.some(p => p.connection === pathDescriptor);
                
                return (
                  <div key={device.id} className="p-3 bg-slate-900/95 border border-slate-800 rounded-lg space-y-2.5 text-xs">
                    
                    <div className="flex justify-between items-start gap-2">
                      <div className="truncate">
                        <h4 className="font-bold text-slate-100 flex items-center gap-1.5 hover:text-indigo-300 transition truncate">
                          <span className={`w-1.5 h-1.5 rounded-full ${device.status === "Online" ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></span>
                          {device.name}
                        </h4>
                        <span className="text-[9.5px] text-slate-400 font-mono">
                          {device.apiType} &bull; Class: {device.endpointType}
                        </span>
                      </div>
                      <span className="shrink-0 bg-slate-800 text-slate-300 font-mono text-[9px] px-1.5 py-0.5 rounded border border-slate-750 uppercase">
                        {device.vendorId}:{device.productId}
                      </span>
                    </div>

                    <div className="bg-slate-950/80 p-2 rounded text-[10px] font-mono text-slate-400 space-y-0.5">
                      {device.serialNumber && <p className="truncate">Serial ID: <strong className="text-slate-350 text-slate-200">{device.serialNumber}</strong></p>}
                      <p className="truncate">Manufacturer Device: {device.manufacturerName || "Generic Win32 Driver Direct"}</p>
                    </div>

                    {/* Mapping Form tools inside card */}
                    <div className="border-t border-slate-850 pt-2 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <label className="text-[8.5px] uppercase tracking-wider font-extrabold text-slate-400 block pb-1">Target Task Queue</label>
                          <select 
                            className="bg-slate-950 border border-slate-800 rounded p-1 text-slate-300 w-full font-mono text-[10px]"
                            value={defaultRole}
                            onChange={(e) => setDefaultRole(e.target.value)}
                          >
                            <option value="All Receipts">All Receipts (Front Desk)</option>
                            <option value="Bill Invoices">Bill Invoices (Checkout)</option>
                            <option value="Kitchen Orders">Kitchen Orders (Kitchen F&amp;B)</option>
                            <option value="Accounting Reports">Accounting Reports (Admin)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[8.5px] uppercase tracking-wider font-extrabold text-slate-400 block pb-1">Hook Alias label</label>
                          <input 
                            type="text" 
                            className="bg-slate-950 border border-slate-800 rounded p-1 text-slate-300 w-full text-[10px]"
                            placeholder="e.g. EPSON-FRONT-01"
                            value={customDeviceName}
                            onChange={(e) => setCustomDeviceName(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => spoolRawTestCommand(device)}
                          className="bg-transparent hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-205 rounded px-2.5 py-1 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3 text-indigo-400" />
                          Test Raster Feed
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRegisterToHMS(device)}
                          disabled={alreadyAdded}
                          className={`rounded-md px-3.5 py-1 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                            alreadyAdded 
                              ? "bg-slate-950 text-slate-500 border border-slate-850 cursor-not-allowed"
                              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                          }`}
                        >
                          {alreadyAdded ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Mounted
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              Map/Attach Device
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}

              <button
                type="button"
                onClick={handleBulkAttachAll}
                className="w-full bg-slate-800/80 hover:bg-slate-800 border border-slate-750 text-indigo-300 text-[10.5px] font-bold py-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer mt-1"
              >
                <Check className="w-3.5 h-3.5 text-indigo-400" />
                Bulk Map All Scanned Hardware
              </button>
            </div>
          )}
        </div>

        {/* Port Transmission Hex Logs Viewport */}
        <div className="space-y-2 border border-slate-850 p-3 rounded-lg bg-slate-950/40">
          <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400 block pb-2.5 border-b border-slate-850">
            💻 Local USB/HID Serial Signal Transmissions
          </span>
          
          <div className="bg-slate-950 border border-slate-900 p-2.5 rounded-lg font-mono text-[10px] text-slate-350 space-y-1 min-h-[220px] max-h-[280px] overflow-y-auto">
            {transmissionLogs.length === 0 ? (
              <p className="text-slate-600 italic">Console initialized. Waiting for USB/HID interface connection activity packets...</p>
            ) : (
              transmissionLogs.map((log, index) => {
                let badgeStyle = "text-slate-420 text-slate-400";
                if (log.includes("[ESC/POS]")) badgeStyle = "text-amber-400 font-bold";
                if (log.includes("[USB-PORT]")) badgeStyle = "text-emerald-400 font-bold";
                if (log.includes("Authorized")) badgeStyle = "text-teal-400 font-bold font-semibold";
                if (log.includes("failed")) badgeStyle = "text-rose-400";

                return (
                  <p key={index} className={`${badgeStyle} leading-normal border-b border-slate-900 pb-1 break-all`}>
                    {log}
                  </p>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Sequence layout guidelines */}
      <div className="p-3 bg-slate-955 bg-opacity-40 border border-slate-800 rounded-lg text-[10.5px] leading-relaxed text-slate-400 space-y-1">
        <span className="font-extrabold text-slate-200 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          Recommended Hardware Setup Sequence:
        </span>
        <ul className="list-decimal pl-4.5 space-y-1">
          <li>Ensure physical USB/HID thermal label or invoice printer device is switched on and connected to the PC.</li>
          <li>Select the <strong className="text-indigo-400">Query WebUSB Interface</strong> or <strong className="text-indigo-400 text-violet-400">Request WebHID Handshake</strong> button to prompt browser driver handshake.</li>
          <li>Assign appropriate print target tasks (e.g., Kitchen Orders or Bill Invoices) and click <strong className="text-indigo-400">Map/Attach Device</strong>.</li>
        </ul>
      </div>

    </div>
  );
};
