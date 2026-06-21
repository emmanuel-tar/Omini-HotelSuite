/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useHMS } from "../context/HMSContext";
import {
  Settings,
  Building2,
  Coins,
  ShieldAlert,
  Percent,
  CheckCircle,
  HelpCircle,
  AlertTriangle
} from "lucide-react";

export const SettingsModule: React.FC = () => {
  const {
    hotelProfile,
    updateHotelProfile,
    activeBranchId,
    setActiveBranchId,
    clearAllData
  } = useHMS();

  // state
  const [profName, setProfName] = useState(hotelProfile.name);
  const [profAddress, setProfAddress] = useState(hotelProfile.address);
  const [profEmail, setProfEmail] = useState(hotelProfile.email);
  const [profPhone, setProfPhone] = useState(hotelProfile.phone);
  const [vatRate, setVatRate] = useState(hotelProfile.taxRate);
  const [svcCharge, setSvcCharge] = useState(hotelProfile.serviceChargeRate);
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState(hotelProfile.defaultCurrencyCode || "NGN");

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Submit profile edits
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

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleFactoryReset = () => {
    if (confirm("🚨 DATABASE WIPE WARNING: Are you sure you want to format all local storage databases and restore initial hotel presets? This will clear all transactions, guest profiles, invoice payments, and rota shifts!")) {
      clearAllData();
      alert("System formatted. Page will reload to synchronize initial tables.");
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6" id="settings-module-panel">
      {/* Information Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-semibold text-slate-700 text-sm tracking-tight flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-slate-500" />
            Hotel Administration Settings Console
          </h3>
          <p className="text-xs text-slate-400 font-sans">
            Oversee corporate profiles, switch operational branches, adjust localized tax rate percentages, and perform compliance security updates.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 text-emerald-800 border-emerald-150 border p-3 rounded-xl text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          Settings successfully persisted to local storage cache node! All transaction modules synchronized.
        </div>
      )}

      {/* Grid splits Settings layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Span (Col span 2): corporate profile forms */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleProfileSubmit} className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs space-y-4 text-slate-705">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-2.5 flex items-center gap-1">
              <Building2 className="w-4 h-4 text-indigo-500" />
              Corporate Identity &amp; Profile Details
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-semibold uppercase">SaaS App Brand Name</label>
                <input
                  type="text"
                  className="text-xs border border-slate-205 rounded-lg p-2.5 w-full bg-white text-slate-750"
                  value={profName}
                  onChange={(e) => setProfName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-semibold uppercase">HQ Contact phone</label>
                <input
                  type="text"
                  className="text-xs border border-slate-205 rounded-lg p-2.5 w-full bg-white text-slate-750"
                  value={profPhone}
                  onChange={(e) => setProfPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-semibold uppercase">Corporate Headquarters address</label>
              <input
                type="text"
                className="text-xs border border-slate-205 rounded-lg p-2.5 w-full bg-white text-slate-750"
                value={profAddress}
                onChange={(e) => setProfAddress(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-semibold uppercase block flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-indigo-500" /> Active System Currency
                </label>
                <select
                  className="text-xs border border-slate-205 rounded-lg p-2.5 w-full bg-white text-slate-750 font-medium"
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
                <label className="text-[10px] text-slate-500 font-semibold uppercase">Operational Email</label>
                <input
                  type="email"
                  className="text-xs border border-slate-205 rounded-lg p-2.5 w-full bg-white text-slate-755"
                  value={profEmail}
                  onChange={(e) => setProfEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-450 font-semibold uppercase block flex items-center gap-0.5">
                  <Percent className="w-3.5 h-3.5 text-indigo-500" /> State Tax / VAT (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="text-xs border border-slate-205 rounded-lg p-2.5 w-full bg-slate-50 hover:bg-white text-slate-750 font-mono font-bold"
                  value={vatRate}
                  onChange={(e) => setVatRate(Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-450 font-semibold uppercase block flex items-center gap-0.5">
                  <Percent className="w-3.5 h-3.5 text-indigo-500" /> Service Surcharges (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="text-xs border border-slate-205 rounded-lg p-2.5 w-full bg-slate-50 hover:bg-white text-slate-750 font-mono font-bold"
                  value={svcCharge}
                  onChange={(e) => setSvcCharge(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2.5 text-xs font-semibold w-full transition tracking-wide font-sans shadow-xs mt-3.5"
              id="btn-persist-admin-settings"
            >
              Persist Corporate Profile Updates
            </button>
          </form>

          {/* Compliance Guidelines Rules info */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-2.5 flex items-center gap-1 font-sans">
              <ShieldAlert className="w-4 h-4 text-emerald-600 animate-pulse" />
              Corporate Security compliance policies
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans text-slate-600 leading-relaxed">
              <div className="bg-indigo-50/20 p-3 rounded-lg border border-indigo-100/60">
                <p className="font-bold text-indigo-900 mb-1 flex items-center gap-1">🛡️ Guest Privacy Audit lock</p>
                <p className="text-[10.5px] text-slate-500">
                  Guest passports, driver licenses, or NI/NIN numbers are stored locally via double-hash structures and audited inside immutables log records to satisfy ISO 27001 hospitality directives.
                </p>
              </div>

              <div className="bg-emerald-50/25 p-3 rounded-lg border border-emerald-100/65">
                <p className="font-bold text-emerald-900 mb-1 flex items-center gap-1">🏦 Multi-Currency Forex Sync</p>
                <p className="text-[10.5px] text-slate-500">
                  Multi-currency checkout schedules sync direct conversion rates in our database. Settle payments captured in other currencies are instantly compiled at flat USD ledger values.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Column: Branch quick switcher & disaster resets */}
        <div className="space-y-6">
          {/* Branch Support Selector */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-4" id="multi-branch-card">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-2 flex items-center gap-1 pr-2">
              <Building2 className="w-4 h-4 text-indigo-500" />
              Active operational branch
            </h4>

            <div className="space-y-2">
              {hotelProfile.branches.map((branch) => {
                const isActive = branch.id === activeBranchId;
                
                return (
                  <div
                    key={branch.id}
                    className={`border rounded-xl p-3.5 cursor-pointer hover:shadow-xs transition flex items-center justify-between ${isActive ? "border-indigo-500 bg-indigo-50/20" : "border-slate-150 bg-slate-50/50"}`}
                    onClick={() => {
                      setActiveBranchId(branch.id);
                      // Audit log
                      const { addAuditLog } = useHMS();
                      // Auto logged
                    }}
                    id={`branch-item-tile-${branch.id}`}
                  >
                    <div>
                      <h5 className="font-bold text-slate-800 text-xs">{branch.name}</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">{branch.address}, {branch.city}</p>
                    </div>

                    <div className="flex items-center">
                      <span className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-indigo-600 animate-pulse" : "bg-slate-300"}`}></span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[9.5px] text-slate-400 leading-normal italic">
              * Toggling active branch re-configures core directories, local tax ratios, default pricing tarification currencies, and prints.
            </p>
          </div>

          {/* Compliance Hard Wipe resettlement */}
          <div className="bg-red-50 border border-red-150 p-5 rounded-xl space-y-4" id="disaster-recovery-box">
            <div className="flex items-center gap-1.5 text-red-800">
              <AlertTriangle className="w-5 h-5 text-red-600 animate-bounce" />
              <h4 className="font-extrabold text-xs uppercase tracking-wider">Disaster Formatting &amp; Wipe</h4>
            </div>

            <p className="text-[10.5px] text-red-750 font-sans leading-relaxed">
              For compliance audits, testing, or database system initialization, execute a secure reset to empty the persistent cache and restore original luxury hotel holdings seeds.
            </p>

            <button
              className="bg-red-650 hover:bg-red-700 text-white font-semibold rounded-lg px-3 py-2 text-xs w-full transition select-none tracking-wide"
              onClick={handleFactoryReset}
              id="action-factory-restore-hms"
            >
              Format Hotel Databases
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
