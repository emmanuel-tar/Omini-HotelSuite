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
  AlertOctagon
} from "lucide-react";

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
    auditLogs
  } = useHMS();

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

      {/* Rota grids and staff ledger */}
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
                                  <strong className="text-slate-800 text-[11px]">{sh.staffName}</strong>
                                </div>
                                <p className="text-[9.5px] text-slate-400 tracking-tight font-mono">
                                  {sh.role} &bull; {sh.startTime}-{sh.endTime}
                                </p>
                              </div>

                              <button
                                className="text-slate-400 hover:text-red-500 p-1 rounded-sm hover:bg-slate-50 transition"
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
                <p className="text-[10px] text-slate-400 mt-1">
                  Immutable trails of all checkout payment settlement, room changes, or PO updates.
                </p>
              </div>

              <div className="relative w-full sm:w-[180px]">
                <Search className="w-3 h-3 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  className="text-xs border border-slate-150 rounded-lg pl-8 pr-3 py-1.5 w-full bg-white text-slate-700"
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
            <h3 className="font-semibold text-slate-700 text-sm tracking-tight flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-500 animate-pulse" />
              Employee Directory ({staff.length})
            </h3>

            {/* Quick search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                className="text-xs border border-slate-205 rounded-lg pl-9 pr-3 py-2 w-full bg-slate-50 placeholder:text-slate-400 text-slate-700"
                placeholder="Search staff profile name..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                id="staff-catalogue-quick-search"
              />
            </div>

            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredStaff.map((person) => {
                let statusDot = "bg-slate-400";
                if (person.status === "Active") statusDot = "bg-green-500";
                else if (person.status === "On-Leave") statusDot = "bg-amber-500";

                return (
                  <div key={person.id} className="border border-slate-150 p-3.5 rounded-xl flex items-center justify-between hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl filter drop-shadow-xs select-none">{person.avatar}</span>
                      <div>
                        <h5 className="font-bold text-slate-800 text-xs">{person.name}</h5>
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
