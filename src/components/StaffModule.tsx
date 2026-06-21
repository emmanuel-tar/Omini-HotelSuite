/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useHMS } from "../context/HMSContext";
import { StaffRole, Shift, StaffUser } from "../types";
import {
  Users,
  Calendar,
  Lock,
  Search,
  Plus,
  Trash2,
  Clock,
  Shield,
  Activity,
  CheckCircle,
  AlertOctagon,
  Sliders,
  ShieldCheck,
  Info,
  Check,
  X,
  RefreshCcw,
  Sparkles
} from "lucide-react";

export interface GranularPermission {
  module: string;
  action: "View" | "Edit" | "Delete";
  allowedRoles: { [key in StaffRole]: boolean };
}

const DEFAULT_GRANULAR_PERMISSIONS: GranularPermission[] = [
  {
    module: "Reservations",
    action: "View",
    allowedRoles: { Admin: true, Manager: true, Receptionist: true, Housekeeping: false, Accountant: true }
  },
  {
    module: "Reservations",
    action: "Edit",
    allowedRoles: { Admin: true, Manager: true, Receptionist: true, Housekeeping: false, Accountant: false }
  },
  {
    module: "Reservations",
    action: "Delete",
    allowedRoles: { Admin: true, Manager: true, Receptionist: false, Housekeeping: false, Accountant: false }
  },
  {
    module: "Billing",
    action: "View",
    allowedRoles: { Admin: true, Manager: true, Receptionist: true, Housekeeping: false, Accountant: true }
  },
  {
    module: "Billing",
    action: "Edit",
    allowedRoles: { Admin: true, Manager: true, Receptionist: true, Housekeeping: false, Accountant: true }
  },
  {
    module: "Billing",
    action: "Delete",
    allowedRoles: { Admin: true, Manager: false, Receptionist: false, Housekeeping: false, Accountant: false }
  },
  {
    module: "Inventory",
    action: "View",
    allowedRoles: { Admin: true, Manager: true, Receptionist: true, Housekeeping: true, Accountant: true }
  },
  {
    module: "Inventory",
    action: "Edit",
    allowedRoles: { Admin: true, Manager: true, Receptionist: false, Housekeeping: true, Accountant: false }
  },
  {
    module: "Inventory",
    action: "Delete",
    allowedRoles: { Admin: true, Manager: false, Receptionist: false, Housekeeping: false, Accountant: false }
  },
  {
    module: "Housekeeping",
    action: "View",
    allowedRoles: { Admin: true, Manager: true, Receptionist: true, Housekeeping: true, Accountant: false }
  },
  {
    module: "Housekeeping",
    action: "Edit",
    allowedRoles: { Admin: true, Manager: true, Receptionist: true, Housekeeping: true, Accountant: false }
  },
  {
    module: "Housekeeping",
    action: "Delete",
    allowedRoles: { Admin: true, Manager: true, Receptionist: false, Housekeeping: false, Accountant: false }
  },
  {
    module: "Services & Packages",
    action: "View",
    allowedRoles: { Admin: true, Manager: true, Receptionist: true, Housekeeping: false, Accountant: true }
  },
  {
    module: "Services & Packages",
    action: "Edit",
    allowedRoles: { Admin: true, Manager: true, Receptionist: true, Housekeeping: false, Accountant: false }
  },
  {
    module: "Services & Packages",
    action: "Delete",
    allowedRoles: { Admin: true, Manager: true, Receptionist: false, Housekeeping: false, Accountant: false }
  },
  {
    module: "Financial Reports",
    action: "View",
    allowedRoles: { Admin: true, Manager: true, Receptionist: false, Housekeeping: false, Accountant: true }
  },
  {
    module: "Financial Reports",
    action: "Edit",
    allowedRoles: { Admin: true, Manager: true, Receptionist: false, Housekeeping: false, Accountant: true }
  },
  {
    module: "Financial Reports",
    action: "Delete",
    allowedRoles: { Admin: true, Manager: false, Receptionist: false, Housekeeping: false, Accountant: false }
  }
];

export const StaffModule: React.FC = () => {
  const {
    staff,
    shifts,
    activeRole,
    setActiveRole,
    activeStaffId,
    setActiveStaffId,
    addShift,
    deleteShift,
    updateStaffUserStatus,
    auditLogs,
    addAuditLog
  } = useHMS();

  // Active sub-tab inside StaffModule
  const [staffActiveSubTab, setStaffActiveSubTab] = useState<"roster" | "permissions">("roster");

  // Granular Permissions matrix state
  const [granularPermissions, setGranularPermissions] = useState<GranularPermission[]>(() => {
    const saved = localStorage.getItem("hms_granular_permissions");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return DEFAULT_GRANULAR_PERMISSIONS;
  });

  // Filter for permissions search
  const [permissionQuery, setPermissionQuery] = useState("");

  // Diagnostic simulator states
  const [testSimModule, setTestSimModule] = useState("Reservations");
  const [testSimAction, setTestSimAction] = useState<"View" | "Edit" | "Delete">("View");

  // Helper to determine simulation results
  const currentSimUser = staff.find(s => s.id === activeStaffId);
  const currentSimRole = currentSimUser ? currentSimUser.role : activeRole;

  // Find permission item
  const matchedPerm = granularPermissions.find(p => p.module === testSimModule && p.action === testSimAction);
  const isActionAllowed = matchedPerm ? matchedPerm.allowedRoles[currentSimRole] : false;

  // Save granular permissions and sync
  const saveGranularPermissions = (updated: GranularPermission[]) => {
    setGranularPermissions(updated);
    localStorage.setItem("hms_granular_permissions", JSON.stringify(updated));
  };

  const handleTogglePermission = (moduleName: string, actionName: "View" | "Edit" | "Delete", roleKey: StaffRole) => {
    const updated = granularPermissions.map((item) => {
      if (item.module === moduleName && item.action === actionName) {
        const nextVal = !item.allowedRoles[roleKey];
        addAuditLog("SECURITY", `Toggled [${moduleName} - ${actionName}] action permission for role: [${roleKey}] to: ${nextVal ? "ALLOWED" : "BLOCKED"}`);
        return {
          ...item,
          allowedRoles: {
            ...item.allowedRoles,
            [roleKey]: nextVal
          }
        };
      }
      return item;
    });
    saveGranularPermissions(updated);
  };

  const applyPresetTemplate = (preset: "enterprise" | "strict" | "open") => {
    let targetMatrix: GranularPermission[] = [];
    if (preset === "enterprise") {
      targetMatrix = DEFAULT_GRANULAR_PERMISSIONS;
      addAuditLog("SECURITY", "Restored system default Tiered Enterprise authorization matrix.");
    } else if (preset === "strict") {
      targetMatrix = DEFAULT_GRANULAR_PERMISSIONS.map((item) => {
        const isDelete = item.action === "Delete";
        return {
          ...item,
          allowedRoles: {
            Admin: true,
            Manager: !isDelete,
            Receptionist: item.module !== "Financial Reports" && item.action === "View",
            Housekeeping: (item.module === "Housekeeping" || item.module === "Inventory") && item.action === "View",
            Accountant: (item.module === "Billing" || item.module === "Financial Reports") && item.action === "View"
          }
        };
      });
      addAuditLog("SECURITY", "Applied Strict Audit Security Protocol. Enforced rigid cross-role deletion limits.");
    } else if (preset === "open") {
      targetMatrix = DEFAULT_GRANULAR_PERMISSIONS.map((item) => {
        const isDelete = item.action === "Delete";
        return {
          ...item,
          allowedRoles: {
            Admin: true,
            Manager: true,
            Receptionist: !isDelete && item.module !== "Financial Reports",
            Housekeeping: !isDelete && (item.module === "Housekeeping" || item.module === "Inventory" || item.module === "Reservations"),
            Accountant: !isDelete && (item.module === "Billing" || item.module === "Financial Reports")
          }
        };
      });
      addAuditLog("SECURITY", "Activated Open Collaborative Mode. Permitted generalized View/Edit access for active departments.");
    }
    saveGranularPermissions(targetMatrix);
  };

  // Search filter
  const [logSearch, setLogSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");

  // Add shift state
  const [showRosterForm, setShowRosterForm] = useState(false);
  const [schedStaffId, setSchedStaffId] = useState("");
  const [schedDay, setSchedDay] = useState<any>("Monday");
  const [schedStart, setSchedStart] = useState("08:00");
  const [schedEnd, setSchedEnd] = useState("16:00");

  // Filter staff catalog
  const filteredStaff = staff.filter((s) => s.name.toLowerCase().includes(staffSearch.toLowerCase()));

  // Filter audit logs
  const filteredAudits = auditLogs.filter((log) => {
    return (
      log.userName.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.detail.toLowerCase().includes(logSearch.toLowerCase())
    );
  });

  // Submit Shift Addition
  const handleRosterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedStaffId) {
      alert("Specify a team member from catalog.");
      return;
    }

    const matchedS = staff.find((s) => s.id === schedStaffId);
    if (!matchedS) return;

    addShift({
      staffId: matchedS.id,
      staffName: matchedS.name,
      role: matchedS.role,
      dayOfWeek: schedDay,
      startTime: schedStart,
      endTime: schedEnd
    });

    setShowRosterForm(false);
    setSchedStaffId("");
  };

  // Group shifts by Day
  const getShiftsByDay = (day: string) => {
    return shifts.filter((sh) => sh.dayOfWeek === day);
  };

  const DAYS: string[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="space-y-6" id="staff-module-panel">
      
      {/* Simulation Persona controls */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 p-6 rounded-xl text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider w-fit flex items-center gap-1">
            <Shield className="w-3" />
            System Simulation Controls
          </div>
          <h3 className="font-extrabold text-white text-base tracking-tight">Active Duty Role Roleplay</h3>
          <p className="text-xs text-indigo-200 leading-relaxed max-w-xl font-sans">
            Switch logged staff personae in this control bar. The OmniSuite HMS restricts database operations, pricing modifications, and report downloads based on active role credentials.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 self-stretch md:self-auto font-sans">
          
          {/* Switch Active Role */}
          <div className="space-y-1">
            <label className="text-[9.5px] font-bold text-indigo-300 block uppercase">Simulated Role Access</label>
            <select
              className="text-xs font-bold text-slate-800 bg-white border border-indigo-700/50 rounded-lg p-2 focus:outline-hidden w-full sm:w-[160px]"
              value={activeRole}
              onChange={(e) => {
                const role = e.target.value as StaffRole;
                setActiveRole(role);
                // Bind a default staff user matching that role
                const matchedStaff = staff.find((s) => s.role === role);
                if (matchedStaff) setActiveStaffId(matchedStaff.id);
              }}
              id="simulation-role-switcher"
            >
              <option value={StaffRole.Admin}>🛡️ Admin (Evelyn)</option>
              <option value={StaffRole.Manager}>💼 Manager (Alex)</option>
              <option value={StaffRole.Receptionist}>🔑 Clerk (Sarah)</option>
              <option value={StaffRole.Housekeeping}>🧹 Clean (Musa)</option>
              <option value={StaffRole.Accountant}>💰 Accountant (Chinedu)</option>
            </select>
          </div>

          {/* Switch Staff ID */}
          <div className="space-y-1">
            <label className="text-[9.5px] font-bold text-indigo-300 block uppercase">Operative Actor Name</label>
            <select
              className="text-xs font-bold text-slate-800 bg-white border border-indigo-700/50 rounded-lg p-2 focus:outline-hidden w-full sm:w-[160px]"
              value={activeStaffId}
              onChange={(e) => setActiveStaffId(e.target.value)}
              id="simulation-actor-switcher"
            >
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.avatar} {s.name} ({s.role.slice(0, 5)}.)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sub tabs switcher */}
      <div className="flex gap-2 border-b border-slate-200" id="staff-subtab-navigation">
        <button
          onClick={() => setStaffActiveSubTab("roster")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
            staffActiveSubTab === "roster"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/10"
              : "border-transparent text-slate-405 hover:text-slate-700 bg-transparent hover:bg-slate-100/50 shadow-none"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Roster &amp; Employee Directory
        </button>
        <button
          onClick={() => setStaffActiveSubTab("permissions")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
            staffActiveSubTab === "permissions"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/10"
              : "border-transparent text-slate-405 hover:text-slate-700 bg-transparent hover:bg-slate-100/50 shadow-none"
          }`}
          id="btn-permissions-subtab"
        >
          <Lock className="w-4 h-4" />
          Granular Permission Editor
        </button>
      </div>

      {staffActiveSubTab === "permissions" ? (
        <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs space-y-6" id="granular-permissions-editor-box">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5 font-sans">
                <Lock className="w-4 h-4 text-indigo-650 animate-pulse" />
                Granular Module Permission Matrix
              </h3>
              <p className="text-[10.5px] text-slate-400 font-sans font-medium">
                Fine-tune operational authorization schemas by mapping permitted actions (View, Edit, Delete) across hotel departments.
              </p>
            </div>

            {/* Quick Templates presets wrapper */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block md:inline">Presets:</span>
              <button
                type="button"
                onClick={() => applyPresetTemplate("enterprise")}
                className="bg-slate-50 hover:bg-slate-100 text-slate-750 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-205 transition flex items-center gap-1 cursor-pointer"
              >
                <RefreshCcw className="w-3 h-3" /> Standard Tiered
              </button>
              <button
                type="button"
                onClick={() => applyPresetTemplate("strict")}
                className="bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-red-200 transition flex items-center gap-1 cursor-pointer"
              >
                <Sliders className="w-3 h-3 text-red-505" /> Strict Security
              </button>
              <button
                type="button"
                onClick={() => applyPresetTemplate("open")}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-emerald-200 transition flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-emerald-505 animate-pulse" /> Collaborative
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Left 2 columns: Permissions Table */}
            <div className="xl:col-span-2 space-y-4">
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  className="text-xs border border-slate-205 rounded-lg pl-9 pr-3 py-2 w-full bg-slate-55 placeholder:text-slate-400 text-slate-700 font-medium"
                  placeholder="Filter key functional modules (e.g. reservations, billing, inventory)..."
                  value={permissionQuery}
                  onChange={(e) => setPermissionQuery(e.target.value)}
                  id="search-granular-permissions-matrix"
                />
              </div>

              {/* Matrix List inside a neat table */}
              <div className="overflow-x-auto border border-slate-150 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-150 text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="p-3">Module - Operation</th>
                      <th className="p-3 text-center">Admin</th>
                      <th className="p-3 text-center">Manager</th>
                      <th className="p-3 text-center">Clerk</th>
                      <th className="p-3 text-center">Crews</th>
                      <th className="p-3 text-center">Auditor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 font-sans font-medium text-slate-700">
                    {granularPermissions
                      .filter((p) => {
                        const searchString = `${p.module} ${p.action}`.toLowerCase();
                        return searchString.includes(permissionQuery.toLowerCase());
                      })
                      .map((p) => {
                        return (
                          <tr key={`${p.module}-${p.action}`} className="hover:bg-slate-50/40">
                            {/* Operation Cell */}
                            <td className="p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-extrabold text-slate-800 block text-xs">{p.module}</span>
                                  <span className={`inline-block px-1.5 py-0.2 rounded text-[8.5px] font-extrabold uppercase tracking-wide leading-none ${
                                    p.action === "View" 
                                      ? "bg-sky-50 text-sky-700 border border-sky-200" 
                                      : p.action === "Edit"
                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                        : "bg-rose-50 text-rose-700 border border-rose-200"
                                  }`}>
                                    {p.action} Action
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Admin Column */}
                            <td className="p-3 text-center bg-slate-50/20">
                              <input
                                type="checkbox"
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                                checked={p.allowedRoles[StaffRole.Admin]}
                                onChange={() => handleTogglePermission(p.module, p.action, StaffRole.Admin)}
                                title={`Toggle permission for Admin`}
                              />
                            </td>

                            {/* Manager Column */}
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                checked={p.allowedRoles[StaffRole.Manager]}
                                onChange={() => handleTogglePermission(p.module, p.action, StaffRole.Manager)}
                                title={`Toggle permission for Manager`}
                              />
                            </td>

                            {/* Receptionist Column */}
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                checked={p.allowedRoles[StaffRole.Receptionist]}
                                onChange={() => handleTogglePermission(p.module, p.action, StaffRole.Receptionist)}
                                title={`Toggle permission for Receptionist`}
                              />
                            </td>

                            {/* Housekeeping Column */}
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                checked={p.allowedRoles[StaffRole.Housekeeping]}
                                onChange={() => handleTogglePermission(p.module, p.action, StaffRole.Housekeeping)}
                                title={`Toggle permission for Housekeeping`}
                              />
                            </td>

                            {/* Accountant Column */}
                            <td className="p-3 text-center bg-indigo-50/10">
                              <input
                                type="checkbox"
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                checked={p.allowedRoles[StaffRole.Accountant]}
                                onChange={() => handleTogglePermission(p.module, p.action, StaffRole.Accountant)}
                                title={`Toggle permission for Accountant`}
                              />
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right side column: Sandbox Perm Checker */}
            <div className="space-y-4 text-slate-705">
              
              {/* Dynamic Sandbox Selector Card */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-205 space-y-4 shadow-sm">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Permission Sandbox Testing
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Interact with real-time simulations to test how current rules govern active personae actions in OmniSuite.
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-150 font-sans text-xs font-medium">
                  
                  {/* Persona diagnostic */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[9.5px] uppercase font-bold text-indigo-650 block leading-none mb-1">Active Simulated Persona</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{currentSimUser?.avatar || "👤"}</span>
                      <div>
                        <strong className="text-slate-805 text-xs block">{currentSimUser?.name || "Evelyn Williams"}</strong>
                        <span className="text-[10px] text-slate-500 block font-mono">Assigned Role: <span className="font-extrabold uppercase text-indigo-705">{currentSimRole}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Module choice selector */}
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-bold text-slate-500 block uppercase font-sans">Module Segment</label>
                    <select
                      className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg p-2.5 w-full focus:outline-hidden"
                      value={testSimModule}
                      onChange={(e) => setTestSimModule(e.target.value)}
                    >
                      <option value="Reservations">Reservations</option>
                      <option value="Billing">Billing &amp; Finance</option>
                      <option value="Inventory">Inventory &amp; Supplies</option>
                      <option value="Housekeeping">Housekeeping Tasks</option>
                      <option value="Services &amp; Packages">Services &amp; Bundle Packages</option>
                      <option value="Financial Reports">Financial Revenue Reports</option>
                    </select>
                  </div>

                  {/* Operation choice selector */}
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-bold text-slate-500 block uppercase font-sans">Target Operation Action</label>
                    <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-lg border">
                      {(["View", "Edit", "Delete"] as const).map((act) => (
                        <button
                          key={act}
                          type="button"
                          onClick={() => setTestSimAction(act)}
                          className={`py-1 rounded text-2xs font-extrabold capitalize cursor-pointer transition ${
                            testSimAction === act 
                              ? "bg-indigo-600 text-white" 
                              : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          {act}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Evaluation Banner */}
                  <div className="pt-2 border-t border-slate-150">
                    <span className="text-[9.5px] uppercase font-bold text-slate-450 block leading-none mb-2 font-mono">Simulated Authorization Verdict</span>
                    
                    {isActionAllowed ? (
                      <div className="bg-emerald-50 border border-emerald-250 text-emerald-805 p-3 rounded-lg flex items-start gap-2.5 shadow-3xs">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-extrabold text-[11px] leading-snug">🟢 VERDICT: PERMITTED</p>
                          <p className="text-[10px] leading-normal font-sans text-emerald-650 font-medium">
                            {currentSimUser?.name || "Evelyn"} ({currentSimRole}) holds authorized {testSimAction} privileges for {testSimModule}.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-rose-50 border border-rose-250 text-rose-805 p-3 rounded-lg flex items-start gap-2.5 shadow-3xs">
                        <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-extrabold text-[11px] leading-snug">🔴 VERDICT: ACCESS DENIED</p>
                          <p className="text-[10px] leading-normal font-sans text-rose-650 font-medium">
                            {currentSimUser?.name || "Evelyn"} ({currentSimRole}) is currently blocked from executing {testSimAction} operations on {testSimModule}.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Informational Guidelines Card */}
              <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-505 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="font-bold text-slate-800 text-[11px] leading-none">Security Architecture Insights</h5>
                  <p className="text-[10px] text-slate-500 !leading-relaxed font-sans font-medium">
                    This interactive matrix uses a decoupled authorization engine. In production deployments, these rules compile to custom API validation middlewares, preventing unauthorized back-channel endpoints.
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Columns (Col Span 2): Shifts matrix weekly board */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs" id="rota-scheduler-box">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
                <h3 className="font-semibold text-slate-700 text-sm tracking-tight flex items-center gap-1.5 font-sans">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  Staff Weekly Duty Rosters
                </h3>

                <button
                  className="bg-indigo-650 hover:bg-indigo-700 text-indigo-700 hover:text-white px-3 py-1.5 rounded-lg border border-indigo-250 text-xs font-bold flex items-center gap-1 transition"
                  onClick={() => {
                    if (activeRole !== StaffRole.Admin && activeRole !== StaffRole.Manager) {
                      alert("Roster changes denied. Only Admins / Managers are authorized.");
                      return;
                    }
                    setShowRosterForm(true);
                  }}
                  id="action-add-roster-trigger"
                >
                  <Plus className="w-3.5 h-3.5" /> AssignShift
                </button>
              </div>

              {/* Weekly Days List */}
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 font-sans">
                {DAYS.map((day) => {
                  const dayShifts = getShiftsByDay(day);

                  return (
                    <div key={day} className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 flex flex-col md:flex-row md:items-center gap-4 hover:shadow-xs transition">
                      <div className="w-[100px] shrink-0">
                        <span className="font-extrabold text-slate-850 text-xs uppercase block">{day}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{dayShifts.length} assigned</span>
                      </div>

                      <div className="flex flex-wrap gap-2 w-full">
                        {dayShifts.length === 0 ? (
                          <span className="text-slate-400 text-xs italic">No scheduled shifts Roster Empty</span>
                        ) : (
                          dayShifts.map((sh) => {
                            const isWorkerActive = staff.find((s) => s.id === sh.staffId)?.status === "Active";

                            return (
                              <div
                                key={sh.id}
                                className="bg-white border border-slate-150 p-2 rounded-lg flex items-center justify-between gap-3 text-xs shadow-xs"
                                id={`shift-tag-${sh.id}`}
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${isWorkerActive ? "bg-emerald-500" : "bg-slate-350"}`}></span>
                                    <strong className="text-slate-805 text-[11px]">{sh.staffName}</strong>
                                  </div>
                                  <p className="text-[9.5px] text-slate-400 tracking-tight font-mono">
                                    {sh.role} &bull; {sh.startTime}-{sh.endTime}
                                  </p>
                                </div>

                                <button
                                  className="text-slate-405 hover:text-red-500 p-1 rounded-sm hover:bg-slate-50 transition"
                                  onClick={() => {
                                    if (activeRole !== StaffRole.Admin && activeRole !== StaffRole.Manager) {
                                      alert("Unauthorized shift removal action.");
                                      return;
                                    }
                                    if (confirm(`Remove weekly Rota shift for ${sh.staffName} on ${sh.dayOfWeek}?`)) {
                                      deleteShift(sh.id);
                                    }
                                  }}
                                  title="Remove shift assignment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Audit Logs Accountability Index */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-4" id="staff-audit-logs-tab">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-3 font-sans">
                <div>
                  <h3 className="font-semibold text-slate-700 text-sm tracking-tight flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-500 animate-pulse" />
                    Operator Audits &amp; Traceability Index
                  </h3>
                  <p className="text-[10px] text-slate-450 mt-1 font-medium">
                    Immutable trails of all checkout payment settlement, room changes, or PO updates.
                  </p>
                </div>

                <div className="relative w-full sm:w-[180px]">
                  <Search className="w-3 h-3 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    className="text-xs border border-slate-150 rounded-lg pl-8 pr-3 py-1.5 w-full bg-white text-slate-700 font-medium"
                    placeholder="Filter actor/action..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    id="logs-audit-sub-search"
                  />
                </div>
              </div>

              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-2 font-mono text-[10.5px]">
                {filteredAudits.map((log) => {
                  let badgeColor = "bg-slate-100 text-slate-700";
                  if (log.action === "CHECK-IN" || log.action === "CHECK-OUT") badgeColor = "bg-green-100 text-green-800";
                  else if (log.action === "PAYMENT") badgeColor = "bg-emerald-100 text-emerald-800";
                  else if (log.action === "SYSTEM") badgeColor = "bg-purple-150 text-purple-850 px-2";

                  return (
                    <div key={log.id} className="bg-slate-50 p-2.5 rounded-lg border-b border-slate-150 flex items-center justify-between gap-3 text-slate-650 hover:bg-slate-100/50 transition">
                      <p className="leading-normal">
                        <span className="text-[10px] text-slate-400 block sm:inline-block sm:mr-2">
                          {new Date(log.timestamp).toLocaleDateString()} &mdash; {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-bold uppercase tracking-tight mr-2 leading-none inline-block ${badgeColor}`}>
                          {log.action}
                        </span>
                        {log.detail}
                      </p>
                      <span className="text-[10px] text-slate-450 bg-white border border-slate-100 rounded px-1.5 py-0.5 whitespace-nowrap shrink-0">
                        👤 {log.userName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Side Column (Col Span 1): Staff Catalog Directory */}
          <div className="space-y-6" id="staff-catalog-box">
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-4">
              <h3 className="font-semibold text-slate-700 text-sm tracking-tight flex items-center gap-1.5 font-sans">
                <Users className="w-4 h-4 text-slate-500 animate-pulse" />
                Employee Directory ({staff.length})
              </h3>

              {/* Quick search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  className="text-xs border border-slate-205 rounded-lg pl-9 pr-3 py-2 w-full bg-slate-50 placeholder:text-slate-400 text-slate-700 font-medium"
                  placeholder="Search staff profile name..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  id="staff-catalogue-quick-search"
                />
              </div>

              <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredStaff.map((person) => {
                  return (
                    <div key={person.id} className="border border-slate-150 p-3.5 rounded-xl flex items-center justify-between hover:bg-slate-50 transition">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl filter drop-shadow-xs select-none">{person.avatar}</span>
                        <div>
                          <h5 className="font-bold text-slate-805 text-xs">{person.name}</h5>
                          <p className="text-[10px] text-slate-400 font-mono">{person.role} &bull; {person.email}</p>
                        </div>
                      </div>

                      {/* Status Toggles selection dropdown */}
                      <select
                        className="text-[10px] border border-slate-100 rounded bg-white px-1.5 py-0.5 hover:border-indigo-400 text-slate-650"
                        value={person.status}
                        onChange={(e) => {
                          if (activeRole !== StaffRole.Admin) {
                            alert("Staff administrative status shifts restricted to Admins only.");
                            return;
                          }
                          updateStaffUserStatus(person.id, e.target.value as any);
                        }}
                      >
                        <option value="Active">🟢 Active</option>
                        <option value="Off-Duty">⚫ Rest</option>
                        <option value="On-Leave">🟡 Leave</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROSTER SCHEDULING FORM OVERLAY */}
      {showRosterForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 max-w-sm w-full shadow-2xl relative text-left" id="roster-shift-modal">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3 mb-4">
              <Calendar className="w-4 h-4 text-indigo-500 animate-pulse" />
              Schedule Weekly Duty Shift
            </h3>

            <form onSubmit={handleRosterSubmit} className="space-y-4 text-slate-705">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-450 block uppercase font-bold">Select Team Employee</label>
                <select
                  className="text-xs text-slate-650 w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-hidden focus:border-indigo-500"
                  value={schedStaffId}
                  onChange={(e) => setSchedStaffId(e.target.value)}
                  required
                >
                  <option value="">-- Select Member --</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.avatar} {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-450 block uppercase font-bold font-sans">Calendar Day of Rota</label>
                <select
                  className="text-xs text-slate-650 w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-hidden"
                  value={schedDay}
                  onChange={(e) => setSchedDay(e.target.value)}
                  required
                >
                  {DAYS.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-450 block uppercase font-bold">Start shift Time (HH:MM)</label>
                  <input
                    type="time"
                    className="text-xs border border-slate-200 rounded-lg p-2 bg-white w-full text-slate-800"
                    value={schedStart}
                    onChange={(e) => setSchedStart(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-450 block uppercase font-bold">End shift Time (HH:MM)</label>
                  <input
                    type="time"
                    className="text-xs border border-slate-200 rounded-lg p-2 bg-white w-full text-slate-800"
                    value={schedEnd}
                    onChange={(e) => setSchedEnd(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  className="border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg px-3 py-1.5 hover:bg-slate-50 transition"
                  onClick={() => setShowRosterForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg px-4 py-1.5 transition"
                  id="btn-lock-shift-confirm"
                >
                  Publish Duty Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
