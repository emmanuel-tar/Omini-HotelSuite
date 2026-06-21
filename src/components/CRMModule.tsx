/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useHMS } from "../context/HMSContext";
import { LoyaltyTier, Guest } from "../types";
import {
  Users,
  Search,
  Plus,
  Heart,
  Star,
  Send,
  MessageSquare,
  Gift,
  CheckCircle,
  FileCheck
} from "lucide-react";

interface FeedbackSurvey {
  id: string;
  guestName: string;
  rating: number; // 1 to 5
  moduleService: string; // e.g., "Spa", "Room 103", "Dining"
  comments: string;
  date: string;
}

const INITIAL_FEEDBACK: FeedbackSurvey[] = [
  { id: "f_1", guestName: "Sophia Carter", rating: 5, moduleService: "Swedish Massage (Spa)", comments: "The therapy session was exceptionally serene. Sandra is a true master!", date: "2026-06-19" },
  { id: "f_2", guestName: "Tunde Alabi", rating: 4, moduleService: "Room 102 (Standard Room)", comments: "Clean room, fast wifi, appreciated the extra coffee pods in room.", date: "2026-06-18" }
];

export const CRMModule: React.FC = () => {
  const {
    guests,
    reservations,
    updateGuestProfile,
    saveGuest,
    addAuditLog
  } = useHMS();

  // Search filter
  const [crmSearch, setCrmSearch] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  // New Guest state
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [idType, setIdType] = useState("Passport");
  const [idNumber, setIdNumber] = useState("");
  const [loyalty, setLoyalty] = useState<LoyaltyTier>(LoyaltyTier.Bronze);
  const [preferencesStr, setPreferencesStr] = useState("");

  // Feedback states
  const [feedbackList, setFeedbackList] = useState<FeedbackSurvey[]>(INITIAL_FEEDBACK);
  const [showSurveyForm, setShowSurveyForm] = useState(false);
  const [surveyGuestId, setSurveyGuestId] = useState("");
  const [surveyService, setSurveyService] = useState("Front Desk Reception");
  const [surveyRating, setSurveyRating] = useState(5);
  const [surveyComments, setSurveyComments] = useState("");

  // Campaign state
  const [campaignTitle, setCampaignTitle] = useState("Privileged Summer Sojourn");
  const [campaignBody, setCampaignBody] = useState("Dear Guest, as an esteemed loyalty member, unlock 30% off your next booking at Lagos Atlantic using promo code OMNI30.");
  const [campaignTargetTier, setCampaignTargetTier] = useState<string>("ALL");
  const [campaignSuccess, setCampaignSuccess] = useState(false);

  // Search filtered guests list
  const filteredGuests = guests.filter((g) => {
    const fullName = `${g.firstName} ${g.lastName}`.toLowerCase();
    return (
      fullName.includes(crmSearch.toLowerCase()) ||
      g.email.toLowerCase().includes(crmSearch.toLowerCase()) ||
      g.phone.includes(crmSearch)
    );
  });

  // Handle registering guest
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) {
      alert("Please specify mandatory first/last names & email.");
      return;
    }

    const prefArray = preferencesStr ? preferencesStr.split(",").map(p => p.trim()) : [];
    
    saveGuest({
      firstName,
      lastName,
      email,
      phone,
      idType,
      idNumber,
      loyaltyTier: loyalty,
      preferences: prefArray,
      address: "Lagos, Nigeria"
    });

    setShowAddGuest(false);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setIdNumber("");
    setPreferencesStr("");
  };

  // Submit survey feedback
  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetG = guests.find(g => g.id === surveyGuestId);
    if (!targetG) {
      alert("Please select a registered guest first.");
      return;
    }

    const newF: FeedbackSurvey = {
      id: "f_" + Date.now(),
      guestName: `${targetG.firstName} ${targetG.lastName}`,
      rating: surveyRating,
      moduleService: surveyService,
      comments: surveyComments,
      date: new Date().toISOString().split("T")[0]
    };

    setFeedbackList([newF, ...feedbackList]);
    addAuditLog("CRM-SURVEY", `Received feedback from ${newF.guestName} - Rating: ${newF.rating}/5`);
    
    setShowSurveyForm(false);
    setSurveyComments("");
  };

  // Dispatch campaign simulation
  const handleCampaignDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    const targetedMembersCount = guests.filter(
      (g) => campaignTargetTier === "ALL" || g.loyaltyTier === campaignTargetTier
    ).length;

    addAuditLog(
      "LOYALTY-CAMPAIGN",
      `Dispatched campaign '${campaignTitle}' targeting ${targetedMembersCount} members in loyalty segment: ${campaignTargetTier}`
    );

    setCampaignSuccess(true);
    setTimeout(() => setCampaignSuccess(false), 5000);
  };

  // Retrieve reservations associated with chosen guest
  const getGuestBookingHistory = (gId: string) => {
    return reservations.filter((r) => r.guestId === gId);
  };

  return (
    <div className="space-y-6" id="crm-module-panel">
      
      {/* Visual Splits layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (Col Span 2): Guest list of catalog profile */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-slate-800 text-sm">CRM Guests Registration Portfolio</h3>
              </div>

              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    className="text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-hidden focus:border-indigo-500 text-slate-700 bg-white placeholder:text-slate-400 w-[180px]"
                    placeholder="Search name, phone, email"
                    value={crmSearch}
                    onChange={(e) => setCrmSearch(e.target.value)}
                    id="crm-guests-quick-search"
                  />
                </div>

                <button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition"
                  onClick={() => setShowAddGuest(true)}
                  id="btn-register-crm-guest"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Register Client
                </button>
              </div>
            </div>

            {/* Guests Grid Map */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1">
              {filteredGuests.length === 0 ? (
                <p className="col-span-2 text-center py-12 text-slate-400 text-xs">
                  No guest records found. Modify filters or register a new client profile.
                </p>
              ) : (
                filteredGuests.map((g) => {
                  const historyCount = getGuestBookingHistory(g.id).length;
                  
                  let tierColor = "bg-slate-100 text-slate-700 border-slate-200";
                  if (g.loyaltyTier === LoyaltyTier.Silver) tierColor = "bg-stone-100 text-stone-700 border-stone-200";
                  else if (g.loyaltyTier === LoyaltyTier.Gold) tierColor = "bg-yellow-50 text-amber-800 border-yellow-200";
                  else if (g.loyaltyTier === LoyaltyTier.Platinum) tierColor = "bg-indigo-50 text-indigo-800 border-indigo-200";

                  return (
                    <div
                      key={g.id}
                      className={`border rounded-xl p-4 cursor-pointer hover:shadow-md transition flex flex-col justify-between ${selectedGuest?.id === g.id ? "border-indigo-500 shadow-sm ring-1 ring-indigo-500" : "border-slate-150"}`}
                      onClick={() => setSelectedGuest(g)}
                      id={`guest-profile-card-${g.id}`}
                    >
                      <div className="space-y-2">
                        {/* Name Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs">{g.firstName} {g.lastName}</h4>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{g.email}</p>
                          </div>

                          <span className={`text-[8.5px] px-2 py-0.5 rounded font-bold border capitalize ${tierColor}`}>
                            ⭐ {g.loyaltyTier}
                          </span>
                        </div>

                        {/* Contacts */}
                        <p className="text-[10px] text-slate-500 font-sans">📞 Mobile: {g.phone}</p>
                        
                        {/* Preferences */}
                        {g.preferences && g.preferences.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1.5 border-t border-slate-50">
                            {g.preferences.map((p) => (
                              <span key={p} className="text-[8px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-sm font-medium">
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Financial statistics indicators */}
                      <div className="pt-3 mt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-450 font-sans">
                        <span>Splurge: <strong className="text-slate-700">${g.totalSpend.toLocaleString()} USD</strong></span>
                        <span>Total Bookings: <strong className="text-indigo-700">{historyCount} stays</strong></span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Feedback & Satisfaction index logs */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-4" id="crm-feedback-reviews">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-700 text-sm tracking-tight flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                Hotel Survey Satisfaction Feed ({feedbackList.length})
              </h3>

              <button
                className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                onClick={() => setShowSurveyForm(true)}
                id="btn-crm-launch-survey"
              >
                + Register Client Feedback
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[220px] overflow-y-auto pr-1">
              {feedbackList.map((f) => (
                <div key={f.id} className="bg-slate-50 border border-slate-250/50 p-3.5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 text-[11px]">{f.guestName}</p>
                      <p className="text-[9px] text-slate-400">Department: {f.moduleService}</p>
                    </div>

                    {/* Simple Stars mapping */}
                    <div className="flex text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < f.rating ? "fill-amber-500" : "text-slate-350"}`} />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-normal italic font-sans">&ldquo;{f.comments}&rdquo;</p>
                  <p className="text-[9px] text-slate-400 text-right">{f.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side Column (Col Span 1): Guest detail panel + dispatcher */}
        <div className="space-y-6">
          
          {selectedGuest ? (
            <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-md space-y-4" id="guest-history-expanded">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1">
                  <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                  CRM Expansion Card
                </h4>
                <button
                  className="text-xs text-slate-400 hover:text-slate-600"
                  onClick={() => setSelectedGuest(null)}
                >
                  Deselect
                </button>
              </div>

              {/* CRM details */}
              <div className="space-y-2 text-xs">
                <p className="text-slate-450 uppercase text-[9px] font-bold tracking-wider font-sans">Guest Info</p>
                <h4 className="text-sm font-extrabold text-slate-800">{selectedGuest.firstName} {selectedGuest.lastName}</h4>
                <p className="text-slate-600">Email: <strong className="text-slate-800 font-mono">{selectedGuest.email}</strong></p>
                <p className="text-slate-600 font-sans">Identifier: <strong className="text-slate-800">{selectedGuest.idType} ({selectedGuest.idNumber})</strong></p>
                <p className="text-slate-600 font-sans">Loyalty Rank: <strong className="text-indigo-600">{selectedGuest.loyaltyTier} Tier</strong></p>
              </div>

              {/* Stays list */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Reservation Chronology</span>
                
                {getGuestBookingHistory(selectedGuest.id).length === 0 ? (
                  <p className="text-slate-400 text-[11px] italic leading-normal">
                    No stays registered to client name yet. Create some bookings.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 font-mono text-[10px]">
                    {getGuestBookingHistory(selectedGuest.id).map((res) => (
                      <div key={res.id} className="bg-slate-50 hover:bg-slate-100 p-2 border border-slate-100 rounded-md flex items-center justify-between text-slate-700">
                        <div>
                          <p className="font-semibold text-slate-800">Booking {res.id}</p>
                          <p className="text-slate-450 text-[9px]">Rm {res.roomNumber} ({res.checkInDate} to {res.checkOutDate})</p>
                        </div>
                        <span className="bg-emerald-50 text-emerald-800 px-1 py-0.2 rounded font-bold text-[8px] leading-tight">
                          {res.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Preferences Editor */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // Save updates
                  alert("Client CRM attributes updated.");
                }}
                className="pt-3 border-t border-slate-150 space-y-2"
              >
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest block">Update Preferences notes</span>
                <textarea
                  className="text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 hover:bg-white text-slate-700 w-full font-sans"
                  placeholder="Extra water bottles, high floors, quiet stay logs..."
                  defaultValue={selectedGuest.preferences?.join(", ") || ""}
                  onChange={(e) => {
                    const updatedPrefs = e.target.value.split(",").map(p => p.trim());
                    updateGuestProfile(selectedGuest.id, { preferences: updatedPrefs });
                  }}
                />
              </form>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs text-center py-12 space-y-2">
              <span className="text-slate-200 block text-4xl select-none">👑</span>
              <h4 className="font-bold text-slate-700 text-xs">CRM Client Folder</h4>
              <p className="text-[11px] text-slate-400 select-none max-w-[200px] mx-auto font-sans">
                Click on any custom Guest Card on the left grids to pull up their historical reservation timeline or edit specific details.
              </p>
            </div>
          )}

          {/* Marketing Campaigns Panel */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-3" id="crm-campaign-box">
            <h3 className="font-semibold text-slate-700 text-sm tracking-tight flex items-center gap-2">
              <Gift className="w-4 h-4 text-emerald-600" />
              Promotional offer campaign dispatch
            </h3>

            <form onSubmit={handleCampaignDispatch} className="space-y-3 text-xs text-slate-705">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-450 uppercase block font-semibold font-sans">Target Customer Folder</label>
                <select
                  className="text-xs text-slate-650 w-full border border-slate-200 rounded-lg p-2 bg-white"
                  value={campaignTargetTier}
                  onChange={(e) => setCampaignTargetTier(e.target.value)}
                >
                  <option value="ALL">All Registered Clients ({guests.length})</option>
                  <option value={LoyaltyTier.Bronze}>Bronze Tier Only</option>
                  <option value={LoyaltyTier.Silver}>Silver Tier Only</option>
                  <option value={LoyaltyTier.Gold}>Gold Tier Only</option>
                  <option value={LoyaltyTier.Platinum}>Platinum Tier Only</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-450 uppercase block font-semibold">Promotion Headline</label>
                <input
                  type="text"
                  className="text-xs border border-slate-200 rounded-lg p-2 bg-white w-full"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-450 uppercase block font-semibold">Campaign Copy / Text</label>
                <textarea
                  className="text-xs border border-slate-200 rounded-lg p-2 bg-white w-full h-[65px] font-sans"
                  value={campaignBody}
                  onChange={(e) => setCampaignBody(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg px-4 py-2 text-xs w-full transition flex items-center justify-center gap-1.5"
                id="btn-dispatch-marketing-run"
              >
                <Send className="w-3.5 h-3.5" />
                Dispatch Campaigns
              </button>

              {campaignSuccess && (
                <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-lg text-[10.5px] border border-emerald-100 flex items-center gap-2 animate-bounce">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Campaigns successfully dispatched to chosen loyalty tiers!
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* ADD CUSTOM GUEST MODAL */}
      {showAddGuest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 max-w-sm w-full shadow-2xl relative text-left">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3 mb-4">
              <Users className="w-4 h-4 text-indigo-500" />
              Register Guest Account
            </h3>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-slate-700">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  className="text-xs border border-slate-200 rounded-lg p-2.5 bg-white block w-full"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="text-xs border border-slate-200 rounded-lg p-2.5 bg-white block w-full"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              <input
                type="email"
                className="text-xs border border-slate-200 rounded-lg p-2.5 bg-white block w-full"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <input
                type="tel"
                className="text-xs border border-slate-200 rounded-lg p-2.5 bg-white block w-full"
                placeholder="Mobile Direct +234/..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  className="text-xs text-slate-650 w-full border border-slate-200 rounded-lg p-2 bg-white"
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                >
                  <option value="Passport">Passport</option>
                  <option value="Driver License">Driver License</option>
                  <option value="National ID">National ID Card/NIN</option>
                </select>

                <input
                  type="text"
                  className="text-xs border border-slate-200 rounded-lg p-2 bg-white"
                  placeholder="ID Document Serial"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-450 block uppercase font-bold font-sans">Initial Loyalty Level</label>
                <select
                  className="text-xs text-slate-650 w-full border border-slate-200 rounded-lg p-2 bg-white"
                  value={loyalty}
                  onChange={(e) => setLoyalty(e.target.value as LoyaltyTier)}
                >
                  <option value={LoyaltyTier.Bronze}>Bronze (Default)</option>
                  <option value={LoyaltyTier.Silver}>Silver Tier</option>
                  <option value={LoyaltyTier.Gold}>Gold Partner VIP</option>
                  <option value={LoyaltyTier.Platinum}>Platinum Prestige VIP</option>
                </select>
              </div>

              <input
                type="text"
                className="text-xs border border-slate-200 rounded-lg p-2.5 bg-white block w-full"
                placeholder="Preferences (comma separated, e.g. High pillow, coffee)"
                value={preferencesStr}
                onChange={(e) => setPreferencesStr(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  className="border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg px-3 py-1.5 hover:bg-slate-50 transition"
                  onClick={() => setShowAddGuest(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg px-4 py-1.5 transition"
                  id="btn-lock-register-guest"
                >
                  Create Guest Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FEEDBACK SURVEY MODAL */}
      {showSurveyForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 max-w-sm w-full shadow-2xl relative text-left">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3 mb-4">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              Register Survey Satisfaction Feedback
            </h3>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-slate-755">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-450 block uppercase font-bold">Select Survey Respondent</label>
                <select
                  className="text-xs text-slate-650 w-full border border-slate-200 rounded-lg p-2 bg-white"
                  value={surveyGuestId}
                  onChange={(e) => setSurveyGuestId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Registered Contact --</option>
                  {guests.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.firstName} {g.lastName} &mdash; {g.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-450 block uppercase font-bold">Concerned Department / Room</label>
                <input
                  type="text"
                  className="text-xs border border-slate-200 rounded-lg p-2.5 bg-white block w-full"
                  placeholder="E.g., Room 204, Swedish Massage (Spa)"
                  value={surveyService}
                  onChange={(e) => setSurveyService(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-450 block uppercase font-bold">Rating score (1 to 5 Stars)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <button
                      type="button"
                      key={stars}
                      className={`p-2 border rounded-lg hover:border-amber-300 hover:bg-amber-50 transition w-full ${stars === surveyRating ? "bg-amber-50 border-amber-400 font-bold text-slate-800" : "bg-white border-slate-200"}`}
                      onClick={() => setSurveyRating(stars)}
                    >
                      ⭐ {stars}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-450 block uppercase font-bold">Detailed Comments</label>
                <textarea
                  className="text-xs border border-slate-200 rounded-lg p-2 bg-white w-full h-[65px] font-sans"
                  placeholder="What was the guest experience? Include direct comments..."
                  value={surveyComments}
                  onChange={(e) => setSurveyComments(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  className="border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg px-3 py-1.5 hover:bg-slate-50 transition"
                  onClick={() => setShowSurveyForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg px-4 py-1.5 transition"
                  id="btn-lock-survey-log"
                >
                  Archive Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
