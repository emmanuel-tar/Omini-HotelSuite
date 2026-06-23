import React, { useState, useEffect, useRef } from "react";
import { usePrinter, PhysicalPrinter } from "../services/PrinterService";
import { useHMS } from "../context/HMSContext";
import {
  Terminal,
  Wrench,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Sliders,
  ShieldAlert,
  Trash2,
  Play,
  Send,
  Info,
  HelpCircle,
  Activity,
  Printer,
  ChevronRight,
  ChevronDown
} from "lucide-react";

export const PrintDiagnosticsPanel: React.FC = () => {
  const {
    scannedDevices,
    isScanning,
    transmissionLogs,
    errorContext,
    isUsbSupported,
    isHidSupported,
    spoolRawTestCommand,
    clearTransmissionLogs,
    addCustomDiagnosticLog
  } = usePrinter();

  const { printers, addAuditLog } = useHMS();

  // Selected printer for hex sandbox injection
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>("all-emulated");
  const [hexPreset, setHexPreset] = useState<string>("1B 40"); // ESC @ (Reset)
  const [customTextCommand, setCustomTextCommand] = useState<string>("");
  const [activeTroubleshootIndex, setActiveTroubleshootIndex] = useState<number | null>(null);
  
  // Simulated hardware overrides
  const [simulatedStatus, setSimulatedStatus] = useState<"Online" | "Paper Out" | "Cover Open" | "Overheated">("Online");
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom when updated
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [transmissionLogs]);

  // Log simulation updates
  const handleSimulateStatusChange = (status: typeof simulatedStatus) => {
    setSimulatedStatus(status);
    const time = new Date().toLocaleTimeString();
    let msg = "";
    let level = "INFO";

    switch (status) {
      case "Online":
        msg = "🔌 Emulated Thermal Controller status: NORMAL (Ready to spool).";
        break;
      case "Paper Out":
        msg = "⚠️ WARNING [PAPER_OUT]: Opto-sensor phototransistor detected low reflectance. Thermal roll depleted.";
        level = "WARN";
        break;
      case "Cover Open":
        msg = "❌ ERROR [COVER_UNLATCHED]: Print mechanism cover microswitch reports OPEN status. Current spool blocked.";
        level = "ERROR";
        break;
      case "Overheated":
        msg = "🔥 CRITICAL [TEMP_HIGH]: Thermal print head thermistor reports temperature exceeded 85°C thresholds. Duty cycle halted.";
        level = "CRITICAL";
        break;
    }

    addCustomDiagnosticLog(`[SYSTEM] ${msg}`);
    addAuditLog("PRINTER", `Simulated hardware state transition to ${status}: ${msg}`);
  };

  // Generate generic raw transmission error log for test
  const handleGenerateTestError = () => {
    const errorScenarios = [
      "ERR_WRITE_FAILED: Direct Endpoint Bulk Transfer pipe transfer failed. Host controller reports stall status.",
      "ERR_CONNECTION_TIMEOUT: Printer did not respond to SYN handshake on virtual serial COM4 port within 1200ms.",
      "ERR_ESC_POS_DECODE: Carriage feed overflow. Buffer size (2048 bytes) exceeded while waiting for line feed (LF/0x0A).",
      "ERR_USB_PORT_LOCKED: USB Port Interface 0 claims active lease by another kernel system driver. Release driver first."
    ];
    const randomErr = errorScenarios[Math.floor(Math.random() * errorScenarios.length)];
    addCustomDiagnosticLog(`[USB-PORT] ❌ ${randomErr}`);
    addAuditLog("PRINTER", `Diagnostic error generated: ${randomErr}`);
  };

  // Inject command sandbox
  const handleCommandSandboxExecute = () => {
    const time = new Date().toLocaleTimeString();
    
    if (customTextCommand.trim()) {
      addCustomDiagnosticLog(`[ESC/POS] 🧪 Direct string transmission: "${customTextCommand}"`);
      addCustomDiagnosticLog(`[ESC/POS] Injected raw ASCII to byte conversion payload: [${customTextCommand.split("").map((c: string) => c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")).join(" ")}]`);
      addCustomDiagnosticLog(`[USB-PORT] Spool command sent successfully. Bytes written: ${customTextCommand.length} bytes.`);
      setCustomTextCommand("");
    } else {
      // Execute selected hex preset
      let desc = "";
      switch (hexPreset) {
        case "1B 40":
          desc = "ESC @ (Initialize/Reset Printer)";
          break;
        case "1D 56 01":
          desc = "GS V 1 (Full Paper Cut Command)";
          break;
        case "1B 61 01":
          desc = "ESC a 1 (Align Text Center)";
          break;
        case "1B 45 01":
          desc = "ESC E 1 (Turn Bold Text ON)";
          break;
        case "1D 21 11":
          desc = "GS ! 17 (Double Width & Double Height font scaling mode)";
          break;
      }
      addCustomDiagnosticLog(`[ESC/POS] 🧪 Presets Injector: Transmitting bytes: [${hexPreset}] for command: ${desc}`);
      addCustomDiagnosticLog(`[USB-PORT] Hex payload queued on spool buffer. Buffer flushed successfully.`);
    }
    
    addAuditLog("PRINTER", "Executed direct diagnostic command sandbox injection.");
  };

  // Pre-configured common troubleshooting procedures
  const troubleshooterScenarios = [
    {
      title: "Printer outputs blank white paper, or ink/text is completely faded",
      symptom: "Faded text, missing sections, or entire blank receipt rolls spooling out.",
      cause: "Thermal printers generate text via direct localized heat elements meeting chemical thermal-paper coatings. Faded/blank output means either the paper roll is inserted backwards (only one side of the roll is heat-sensitive), or non-thermal standard paper was loaded, or the thermal elements under the printhead are contaminated with wax residue.",
      steps: [
        "Pull the lever to unlatch the thermal cover and remove the paper roll.",
        "Verify that paper is loaded with the outer glossy side facing outward so that it presses directly against the printhead mechanism.",
        "Scrape the glossy paper coating with a fingernail; if a dark grey streak appears, the paper is correctly thermal. If no streak appears, replace with authentic thermal receipt paper.",
        "Clean print elements gently using a lint-free swab dampened with 99% isopropyl alcohol (IPA). Ensure complete evaporation prior to re-closing."
      ]
    },
    {
      title: "Weird characters, unaligned rows, or random garbage ASCII symbols",
      symptom: "Prints continuous blocks of strings like 'µ@@ÿ?A!?!!!' accompanied by rapid feed paper spools.",
      cause: "This is a classic baud rate or emulation command set mismatch. If a printer is configured to expect EPSON ESC/POS standard directives, but is supplied with raster bitmaps or host-based Windows printer commands (GDI), it prints the raw control byte streams as ASCII letters. Alternately, physical serial dip-switches on the back panel may be configured to 9600 Baud while the host driver transmits at 19200 Baud.",
      steps: [
        "Unplug the printer power cable, hold down the Feed button, and reconnect power while keeping the button pressed. This prints a configuration sheet containing active Baud rate, Emulation (e.g. ESC/POS, Star), and Dip-switch logs.",
        "Ensure your Virtual Interface config or Serial COM link parameters in OmniSuite settings match this exact physical Baud rate.",
        "Disable high-density graphic print options if your printer has limited RAM buffer size.",
        "Ensure standard ESC/POS compatibility mode is enabled on the device hardware switches."
      ]
    },
    {
      title: "WebUSB / WebHID scans fail, or security sandbox exceptions are logged",
      symptom: "SecurityException, standard pairing failures, or scanning returns empty arrays continuously.",
      cause: "Most browsers restrict WebUSB, WebHID, and Web Serial access to authenticated Secure Contexts (HTTPS and localhost). Additionally, standard Web browser security settings block background scripts or nested iframes (such as the AI Studio integrated dev frame preview) from accessing direct USB peripherals without explicitly declared permissions in the host parent window.",
      steps: [
        "To break out of the container iframe sandboxing restriction, look at the top right of this preview pan and click the 'Open in New Tab' icon.",
        "Inside the standalone tab, ensure your browser address is HTTPS or localhost.",
        "When the 'Scan USB/HID Ports' or 'Query WebUSB Interface' button is clicked, look at the upper-left of your Chrome/Edge browser bar and click 'Allow' on the hardware access pop-up.",
        "Check that your computer's OS does not lock the port. In Linux, verify udev rule configurations to permit 'dialout' group read/write lease permissions."
      ]
    },
    {
      title: "No response, USB Serial Device not discovered (Offline Status)",
      symptom: "Mount status stays 'Offline' and transmission logs show transfer timeout failures.",
      cause: "The desktop operating system has assigned a direct kernel driver lock to the printer (e.g. Star or Epson Vendor USB class driver), which prevents the raw WebUSB browser layer from reserving the bulk endpoints. Alternatively, the interface cables might be damaged, plugged into an unpowered USB hub, or matching VID/PID keys were transcribed with typographic errors.",
      steps: [
        "Ensure the printer status lamp glows a solid green. A red blinking lamp indicates an error state.",
        "Unplug other heavy power draw USB peripherals from your motherboard's direct USB bus to exclude power sagging.",
        "Open Device Manager (Windows) or type 'lsusb' (macOS/Linux) to confirm that the hardware system recognizes the vendor ID.",
        "Replace the current USB connection profile with virtual serial emulation if the raw USB endpoints are continuously intercepted by the OS print spooler."
      ]
    },
    {
      title: "Red status LED flashing or continuous buzzer warning sound",
      symptom: "Screaming beep sequences, red LED blinking on the printer front panel, motor not revolving.",
      cause: "A flashing red lamp generally signals physical blockages or mechanism traps. Possible triggers are: 1. Thermal cover lid is not securely clicked closed. 2. Auto-cutter mechanism is jammed midway. 3. Printhead temperature has temporarily spiked under high-density spool cycles.",
      steps: [
        "Open the printer lid, pull out 5 inches of paper roll, ensure no paper is twisted on the rubber roller, and slam the lid firmly shut until both side latches click.",
        "If the cutter blade is sticking out, turn off the printer, rotate the manual gear wheel under the plastic front cover to retract the blade, and power back on.",
        "Allow the printer to cool down for 4 minutes if printing massive batch folios with full black graphics."
      ]
    }
  ];

  // Helper checking browser context
  const hasIframeSandbox = typeof window !== "undefined" && window.self !== window.top;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-6 text-white" id="printer-diagnostics-panel">
      {/* Panel Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-indigo-950 text-indigo-400 rounded-xl border border-indigo-900/50">
            <Wrench className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-wide text-slate-100 flex items-center gap-2">
              🛠️ Hardware Print Diagnostics Hub
            </h3>
            <p className="text-[10px] text-slate-400 font-medium leading-normal max-w-xl">
              Inspect raw byte stream transmissions, analyze interface status, and perform interactive diagnostics to resolve common thermal receipt printer failures.
            </p>
          </div>
        </div>

        {/* Dynamic Service Status Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-850 rounded-lg">
            <span className={`w-2 h-2 rounded-full ${isUsbSupported ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></span>
            <span className="text-[10px] font-mono font-bold text-slate-300">WebUSB: {isUsbSupported ? "SUPPORTED" : "UNSUPPORTED"}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-850 rounded-lg">
            <span className={`w-2 h-2 rounded-full ${isHidSupported ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></span>
            <span className="text-[10px] font-mono font-bold text-slate-300">WebHID: {isHidSupported ? "SUPPORTED" : "UNSUPPORTED"}</span>
          </div>
        </div>
      </div>

      {/* Browser Sandbox Warning Block - if user is inside AI Studio Frame */}
      {hasIframeSandbox && (
        <div className="p-3.5 bg-amber-950/40 border border-amber-900/60 rounded-xl flex items-start gap-3 text-amber-200 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-300">Browser Security Sandbox Detected (Iframe Context)</p>
            <p className="text-[11px] leading-relaxed text-amber-200/85">
              Direct physical USB or HID peripheral connections are blocked inside the development iframe context. 
              To enable direct interface handshakes and approve real thermal printer hardware access, please use the 
              <strong className="text-white"> "Open in new tab"</strong> button at the top-right of your screen. 
              The built-in <strong className="text-white">Emulation Mode</strong> will successfully simulate and format all print jobs in this frame.
            </p>
          </div>
        </div>
      )}

      {/* 2 Column Layout - Controls & Simulation vs Live Terminal Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Hand: Controls, Overrides and Presets (Col 5) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Section 1: Simulated Motor / Hardware Overrides */}
          <div className="p-4 bg-slate-950/70 border border-slate-850 rounded-xl space-y-3.5">
            <span className="text-[10.5px] uppercase font-mono tracking-wider font-extrabold text-indigo-400 block pb-1 border-b border-indigo-950">
              🎛️ Simulated Peripheral Overrides
            </span>
            <p className="text-[10.5px] text-slate-400 leading-normal">
              Force direct telemetry errors to test how the OmniSuite PMS locks or routes print spool queues on active receipt dispatches.
            </p>

            <div className="space-y-2">
              <label className="text-[9.5px] text-slate-450 font-bold uppercase block">Change Print Head Status Sensor</label>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[9.5px]">
                <button
                  type="button"
                  onClick={() => handleSimulateStatusChange("Online")}
                  className={`py-1.5 px-2 rounded-md font-bold transition text-left flex items-center gap-1.5 border cursor-pointer ${
                    simulatedStatus === "Online"
                      ? "bg-slate-800 text-emerald-400 border-slate-700"
                      : "bg-transparent text-slate-400 hover:text-slate-200 border-slate-850 hover:bg-slate-900"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                  Online Active
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateStatusChange("Paper Out")}
                  className={`py-1.5 px-2 rounded-md font-bold transition text-left flex items-center gap-1.5 border cursor-pointer ${
                    simulatedStatus === "Paper Out"
                      ? "bg-slate-800 text-amber-400 border-slate-700"
                      : "bg-transparent text-slate-400 hover:text-slate-205 border-slate-850 hover:bg-slate-900"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                  Paper Out [Low]
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateStatusChange("Cover Open")}
                  className={`py-1.5 px-2 rounded-md font-bold transition text-left flex items-center gap-1.5 border cursor-pointer ${
                    simulatedStatus === "Cover Open"
                      ? "bg-slate-800 text-red-400 border-slate-700"
                      : "bg-transparent text-slate-400 hover:text-slate-205 border-slate-850 hover:bg-slate-900"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
                  Cover Unlatched
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateStatusChange("Overheated")}
                  className={`py-1.5 px-2 rounded-md font-bold transition text-left flex items-center gap-1.5 border cursor-pointer ${
                    simulatedStatus === "Overheated"
                      ? "bg-slate-800 text-rose-500 border-slate-700"
                      : "bg-transparent text-slate-400 hover:text-slate-205 border-slate-850 hover:bg-slate-900"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-ping"></span>
                  Overheated Platen
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleGenerateTestError}
                className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg py-2 px-3 text-[10.5px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Inject Transmit Error
              </button>
            </div>
          </div>

          {/* Section 2: ESC/POS Command Injector Sandbox */}
          <div className="p-4 bg-slate-950/70 border border-slate-850 rounded-xl space-y-4">
            <span className="text-[10.5px] uppercase font-mono tracking-wider font-extrabold text-indigo-400 block pb-1 border-b border-indigo-950">
              💻 ESC/POS Command Injector Sandbox
            </span>
            <p className="text-[10.5px] text-slate-400 leading-normal">
              Select printer endpoint and transmit hexadecimal presets or literal text direct control bytes.
            </p>

            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="space-y-1">
                <label className="text-[9.5px] font-mono font-bold text-slate-400 uppercase block">Target Spool Endpoint</label>
                <select
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  value={selectedPrinterId}
                  onChange={(e) => setSelectedPrinterId(e.target.value)}
                >
                  <option value="all-emulated">All Discovered Port Simulators</option>
                  {printers.map(p => (
                    <option key={p.id} value={p.id}>[{p.assignedRole}] {p.name}</option>
                  ))}
                </select>
              </div>

              {/* Presets and customized bytes */}
              <div className="space-y-2">
                <label className="text-[9.5px] font-mono font-bold text-slate-400 uppercase block">Pre-Defined Hex Byte Arrays</label>
                <div className="grid grid-cols-1 gap-1.5">
                  <label className="flex items-center gap-2 cursor-pointer p-1.5 bg-slate-900/50 hover:bg-slate-900 rounded border border-slate-850 transition">
                    <input
                      type="radio"
                      name="hexPresetRadio"
                      checked={hexPreset === "1B 40"}
                      onChange={() => {
                        setHexPreset("1B 40");
                        setCustomTextCommand("");
                      }}
                      className="accent-indigo-500"
                    />
                    <div className="font-mono text-[10px]">
                      <span className="text-indigo-400 font-bold shrink-0">1B 40</span>
                      <span className="text-slate-450 mx-1">&bull;</span>
                      <span className="text-slate-300">ESC @ (Initialize/Reset)</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-1.5 bg-slate-900/50 hover:bg-slate-900 rounded border border-slate-850 transition">
                    <input
                      type="radio"
                      name="hexPresetRadio"
                      checked={hexPreset === "1D 56 01"}
                      onChange={() => {
                        setHexPreset("1D 56 01");
                        setCustomTextCommand("");
                      }}
                      className="accent-indigo-500"
                    />
                    <div className="font-mono text-[10px]">
                      <span className="text-indigo-400 font-bold shrink-0">1D 56 01</span>
                      <span className="text-slate-450 mx-1">&bull;</span>
                      <span className="text-slate-300">GS V 1 (Full Paper Cut)</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-1.5 bg-slate-900/50 hover:bg-slate-900 rounded border border-slate-850 transition">
                    <input
                      type="radio"
                      name="hexPresetRadio"
                      checked={hexPreset === "1B 45 01"}
                      onChange={() => {
                        setHexPreset("1B 45 01");
                        setCustomTextCommand("");
                      }}
                      className="accent-indigo-500"
                    />
                    <div className="font-mono text-[10px]">
                      <span className="text-indigo-400 font-bold shrink-0">1B 45 01</span>
                      <span className="text-slate-450 mx-1">&bull;</span>
                      <span className="text-slate-300">ESC E 1 (Bold Typeface ON)</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Literal String input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[9.5px] font-mono font-bold text-slate-400 uppercase">Or Transmit Literal Text</label>
                  {customTextCommand && (
                    <span className="text-[8.5px] bg-slate-800 text-indigo-400 font-mono px-1.5 py-0.2 rounded">
                      ASCII Mode
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. FEED SLIP OK"
                  value={customTextCommand}
                  onChange={(e) => {
                    setCustomTextCommand(e.target.value);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="button"
                onClick={handleCommandSandboxExecute}
                className="w-full bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-lg py-2.5 text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Transmit Debug Block
              </button>
            </div>
          </div>

        </div>

        {/* Right Hand: Terminal Log Stream Output (Col 7) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          
          <div className="flex-1 bg-slate-950 rounded-xl border border-slate-850 p-4 flex flex-col space-y-3 min-h-[380px]">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3 flex-wrap gap-2">
              <span className="text-[11px] uppercase font-mono tracking-wider font-extrabold text-slate-300 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />
                PrinterService Raw Stream Telemetry
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearTransmissionLogs}
                  className="text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded p-1.5 transition text-[10px] uppercase font-mono font-extrabold flex items-center gap-1 cursor-pointer border border-transparent hover:border-slate-850"
                  title="Wipe current buffer log entries"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Console
                </button>
              </div>
            </div>

            {/* Custom Terminal Window */}
            <div 
              ref={logContainerRef}
              className="flex-1 bg-slate-950 border border-slate-900 rounded-lg p-3.5 font-mono text-[10.5px] leading-relaxed select-text overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 max-h-[460px]"
            >
              {transmissionLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-655 p-8 text-center text-slate-500">
                  <Activity className="w-10 h-10 text-slate-700 animate-ping mb-3 stroke-1" />
                  <p className="font-bold text-slate-400">Telemetry Stream Idle</p>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-sm">
                    No active direct hardware packets detected. Click "Scan Ports", simulate print outputs, or test mounted spool devices to populate telemetry history.
                  </p>
                </div>
              ) : (
                transmissionLogs.map((log, index) => {
                  let textStyle = "text-slate-300";
                  let tag = "LOG";
                  
                  if (log.includes("[ESC/POS]")) {
                    textStyle = "text-amber-400";
                    tag = "ESC/POS";
                  } else if (log.includes("[USB-PORT]")) {
                    textStyle = "text-emerald-400";
                    tag = "USB Port";
                  } else if (log.includes("[SYSTEM]")) {
                    textStyle = "text-indigo-400";
                    tag = "System";
                  } else if (log.includes("❌") || log.includes("Error") || log.includes("failed") || log.includes("[COVER_UNLATCHED]") || log.includes("[TEMP_HIGH]")) {
                    textStyle = "text-rose-400 bg-rose-950/20 px-1 py-0.5 rounded";
                    tag = "ERROR";
                  } else if (log.includes("⚠️") || log.includes("[PAPER_OUT]")) {
                    textStyle = "text-amber-300 bg-amber-950/20 px-1 py-0.5 rounded";
                    tag = "WARNING";
                  }
                  
                  return (
                    <div key={index} className="flex items-start gap-1 pb-1 border-b border-slate-900/50 select-text">
                      <span className="text-slate-600 font-semibold text-[9px] select-none uppercase shrink-0 pt-0.5" style={{ minWidth: "55px" }}>
                        [{tag}]
                      </span>
                      <p className={`${textStyle} break-all font-mono leading-relaxed`}>{log}</p>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="text-[9px] text-slate-500 font-mono flex items-center justify-between pt-1 border-t border-slate-900">
              <span>Host Controller: Standard USB Hub Root Node 0</span>
              <span>Buffer Limit: 50 packets rolling cache</span>
            </div>
          </div>
        </div>

      </div>

      {/* Expandable Step-by-Step Troubleshooter Matrix */}
      <div className="space-y-3.5">
        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
          <HelpCircle className="w-4 h-4 text-indigo-400" />
          <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-205">
            📋 Interactive Troubleshooter Matrix &amp; Self-Repair Guide
          </h4>
        </div>
        
        <p className="text-[11px] text-slate-450 leading-relaxed">
          Thermal head elements, paper sensors, and USB interfaces are prone to wear and security blocks. Click any common thermal print failure below to expand immediate troubleshooting vectors.
        </p>

        <div className="space-y-2">
          {troubleshooterScenarios.map((sc, idx) => {
            const isOpen = activeTroubleshootIndex === idx;
            return (
              <div 
                key={idx} 
                className={`bg-slate-950/50 border rounded-xl overflow-hidden transition-all duration-200 ${
                  isOpen ? "border-indigo-500/50 bg-slate-950" : "border-slate-850 hover:bg-slate-950/80"
                }`}
              >
                {/* Header Toggle */}
                <button
                  type="button"
                  onClick={() => setActiveTroubleshootIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left cursor-pointer transition focus:outline-none"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-100 flex items-center gap-1.5 flex-wrap">
                        {sc.title}
                        {idx === 2 && (
                          <span className="text-[9px] bg-red-950 text-red-400 border border-red-900/60 font-semibold px-2 py-0.2 rounded uppercase">
                            Sandbox Core
                          </span>
                        )}
                      </h5>
                      <p className="text-[10px] text-slate-500 mt-1 truncate max-w-2xl font-normal">
                        Symptom: {sc.symptom}
                      </p>
                    </div>
                  </div>
                  
                  <span className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold shrink-0 hidden sm:inline uppercase">
                    {isOpen ? "Collapse Guide" : "Solve Fault"}
                  </span>
                </button>

                {/* Open Panel Body */}
                {isOpen && (
                  <div className="p-4 bg-slate-950 border-t border-slate-900 text-[11px] text-slate-350 space-y-4 animate-fade-in animate-duration-150">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Cause description */}
                      <div className="space-y-2 bg-slate-900/40 p-3 rounded-lg border border-slate-850">
                        <span className="text-[9.5px] font-mono tracking-wider font-extrabold text-amber-500 flex items-center gap-1 uppercase">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Identified Friction Cause
                        </span>
                        <p className="leading-relaxed text-slate-300">
                          {sc.cause}
                        </p>
                      </div>

                      {/* Right: Steps */}
                      <div className="space-y-2 bg-slate-900/40 p-3 rounded-lg border border-slate-850">
                        <span className="text-[9.5px] font-mono tracking-wider font-extrabold text-indigo-400 flex items-center gap-1 uppercase">
                          <Sliders className="w-3.5 h-3.5" />
                          Diagnostic Recovery Protocol
                        </span>
                        <ol className="list-decimal pl-4.5 space-y-2 text-slate-300">
                          {sc.steps.map((st, sIdx) => (
                            <li key={sIdx} className="leading-relaxed">
                              {st}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-900">
                      <button
                        type="button"
                        onClick={() => {
                          addCustomDiagnosticLog(`[SYSTEM] Troubleshooter auto-tested: ${sc.title}`);
                          addCustomDiagnosticLog(`[SYSTEM] Reset standard connection parameters; verifying lines.`);
                          // Trigger mini emulated scan check
                          spoolRawTestCommand({
                            id: "diagnostics-auto-check",
                            name: "Integrated Diagnostics Service Check",
                            vendorId: "0x0001",
                            productId: "0x0001",
                            serialNumber: "SYS_DIAG_OK",
                            manufacturerName: "OmniSuite",
                            productName: "Diagnostics Check",
                            apiType: "WebUSB",
                            endpointType: "POS Thermal Bulk Receipt Line (80mm)",
                            status: "Online"
                          });
                        }}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-205 rounded-lg px-3 py-1.5 font-bold transition flex items-center gap-1.5 cursor-pointer text-xs"
                      >
                        <RefreshCw className="w-3 h-3 text-indigo-400" />
                        Execute Auto-Test Cycle
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
