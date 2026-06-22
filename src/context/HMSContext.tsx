/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Room,
  RoomType,
  RoomStatus,
  Reservation,
  ReservationStatus,
  Guest,
  LoyaltyTier,
  Invoice,
  InvoiceStatus,
  Payment,
  PaymentMethod,
  ActivityService,
  ServiceBooking,
  PackageBundle,
  InventoryItem,
  StaffRole,
  StaffUser,
  Shift,
  AuditLog,
  HotelProfile,
  HotelBranch,
  PrinterConfig,
  Prepayment
} from "../types";

interface HMSContextType {
  // Authentication & Simulation States
  activeRole: StaffRole;
  setActiveRole: (role: StaffRole) => void;
  activeStaffId: string;
  setActiveStaffId: (id: string) => void;
  activeBranchId: string;
  setActiveBranchId: (id: string) => void;

  // Master Lists
  hotelProfile: HotelProfile;
  rooms: Room[];
  reservations: Reservation[];
  guests: Guest[];
  invoices: Invoice[];
  services: ActivityService[];
  serviceBookings: ServiceBooking[];
  packageBundles: PackageBundle[];
  inventory: InventoryItem[];
  staff: StaffUser[];
  shifts: Shift[];
  auditLogs: AuditLog[];
  printers: PrinterConfig[];
  prepayments: Prepayment[];
 
  // Mutators & Core Actions
  updateHotelProfile: (profile: HotelProfile) => void;
  createReservation: (reservation: Omit<Reservation, "id" | "createdAt">) => Reservation;
  updateReservationStatus: (id: string, status: ReservationStatus) => void;
  rescheduleReservation: (id: string, checkInDate: string, checkOutDate: string, roomNumber: string, totalAmount: number) => void;
  checkInReservation: (id: string, idType: string, idNumber: string, roomNumber: string) => void;
  checkOutReservation: (id: string, method: PaymentMethod, currencyCode: string) => void;
  updateRoomStatus: (id: string, status: RoomStatus) => void;
  updateRoomHousekeeper: (id: string, housekeeperId: string | undefined) => void;
  updateRoomPricing: (id: string, baseRate: number, dynamicModifier: number) => void;
  saveGuest: (guest: Omit<Guest, "id" | "totalSpend" | "totalBookings">) => Guest;
  updateGuestProfile: (id: string, updates: Partial<Guest>) => void;
  addPaymentToInvoice: (invoiceId: string, amount: number, method: PaymentMethod, currency: string) => void;
  bookService: (booking: Omit<ServiceBooking, "id">) => ServiceBooking;
  updateServiceBookingStatus: (id: string, status: "Pending" | "Completed" | "Cancelled") => void;
  restockInventory: (id: string, amount: number) => void;
  consumeInventory: (id: string, amount: number) => void;
  addInventoryItem: (item: Omit<InventoryItem, "id">) => void;
  addStaffUser: (user: Omit<StaffUser, "id">) => void;
  updateStaffUserStatus: (id: string, status: "Active" | "Off-Duty" | "On-Leave") => void;
  addShift: (shift: Omit<Shift, "id">) => void;
  deleteShift: (id: string) => void;
  addPrinter: (printer: Omit<PrinterConfig, "id">) => void;
  updatePrinter: (id: string, updates: Partial<PrinterConfig>) => void;
  deletePrinter: (id: string) => void;
  recordPrepayment: (prepayment: Omit<Prepayment, "id" | "date">) => void;
  adjustGuestCredit: (guestId: string, amount: number, notes: string) => void;
  addAuditLog: (action: string, detail: string) => void;
  clearAllData: () => void;
}

const HMSContext = createContext<HMSContextType | undefined>(undefined);

// Initial Static Configs
const DEFAULT_BRANCHES: HotelBranch[] = [
  { id: "lagos", name: "Lagos Atlantic Resort", city: "Lagos", address: "14 Kingsway Road, Ikoyi" },
  { id: "london", name: "London Regent Hotel", city: "London", address: "22 Regent Street, Westminster" },
  { id: "newyork", name: "New York Hudson Plaza", city: "New York", address: "450 West 33rd Street, Chelsea" }
];

const DEFAULT_PROFILE: HotelProfile = {
  name: "OmniSuite Luxury Group",
  address: "Headquarters: 100 Marina Boulevard, San Francisco, CA",
  phone: "+1 (800) 555-OMNI",
  email: "operations@omnisuitegroup.com",
  currentBranchId: "lagos",
  branches: DEFAULT_BRANCHES,
  taxRate: 7.5,
  serviceChargeRate: 5.0,
  currencies: [
    { code: "USD", symbol: "$", rateToUSD: 1.0 },
    { code: "NGN", symbol: "₦", rateToUSD: 1450.0 },
    { code: "EUR", symbol: "€", rateToUSD: 0.92 },
    { code: "GBP", symbol: "£", rateToUSD: 0.79 },
    { code: "CAD", symbol: "C$", rateToUSD: 1.36 }
  ],
  defaultCurrencyCode: "NGN"
};

// INITIAL REALISTIC MOCK DATA
const INITIAL_ROOMS: Room[] = [
  // Floor 1 (Standard & Deluxe)
  { id: "101", number: "101", type: RoomType.Standard, status: RoomStatus.Available, baseRate: 120, dynamicModifier: 1.0, floor: 1, features: ["Free Wi-Fi", "Desk", "Heater"] },
  { id: "102", number: "102", type: RoomType.Standard, status: RoomStatus.Occupied, baseRate: 120, dynamicModifier: 1.0, floor: 1, features: ["Free Wi-Fi", "Desk", "TV"], currentGuestName: "Tunde Alabi" },
  { id: "103", number: "103", type: RoomType.Deluxe, status: RoomStatus.Available, baseRate: 180, dynamicModifier: 1.1, floor: 1, features: ["Minibar", "Bathtub", "Ocean View", "Balcony"] },
  { id: "104", number: "104", type: RoomType.Deluxe, status: RoomStatus.Cleaning, baseRate: 180, dynamicModifier: 1.0, floor: 1, features: ["Coffee Maker", "Desk", "Ocean View"], housekeeperId: "staff_4" },
  
  // Floor 2 (Deluxe & Suites)
  { id: "201", number: "201", type: RoomType.Standard, status: RoomStatus.Maintenance, baseRate: 130, dynamicModifier: 1.0, floor: 2, features: ["Free Wi-Fi", "Express Checkout"] },
  { id: "202", number: "202", type: RoomType.Deluxe, status: RoomStatus.Occupied, baseRate: 200, dynamicModifier: 1.25, floor: 2, features: ["Ocean View", "Smart TV", "Air Purifier"], currentGuestName: "Sophia Carter" },
  { id: "203", number: "203", type: RoomType.Suite, status: RoomStatus.Available, baseRate: 350, dynamicModifier: 1.0, floor: 2, features: ["Kitchenette", "Living Room", "Butler Service"] },
  { id: "204", number: "204", type: RoomType.Suite, status: RoomStatus.Occupied, baseRate: 380, dynamicModifier: 1.15, floor: 2, features: ["Patio", "Jacuzzi", "King Size Bed"], currentGuestName: "Oliver Dubois", housekeeperId: "staff_4" },

  // Floor 3 (Suites & Executive VIP)
  { id: "301", number: "301", type: RoomType.Suite, status: RoomStatus.Available, baseRate: 400, dynamicModifier: 1.0, floor: 3, features: ["Kitchenette", "Dining Area", "2 Bedrooms"] },
  { id: "302", number: "302", type: RoomType.Executive, status: RoomStatus.Available, baseRate: 550, dynamicModifier: 1.1, floor: 3, features: ["VIP Lounge Access", "High Floor", "Private Office", "Local Car Service"] },
  { id: "303", number: "303", type: RoomType.Executive, status: RoomStatus.Occupied, baseRate: 550, dynamicModifier: 1.3, floor: 3, features: ["VIP Lounge Access", "Panoramic Glass Walls", "Personal Gym Equipment"], currentGuestName: "Amina Lawal" },
  { id: "304", number: "304", type: RoomType.Executive, status: RoomStatus.Maintenance, baseRate: 600, dynamicModifier: 1.0, floor: 3, features: ["Massage Chair", "Balcony Hot Tub", "Premium Sound System"] }
];

const INITIAL_GUESTS: Guest[] = [
  { id: "guest_1", firstName: "Tunde", lastName: "Alabi", email: "tunde.alabi@gmail.com", phone: "+234 803 111 2222", idType: "Passport", idNumber: "NGA1249219A", loyaltyTier: LoyaltyTier.Gold, totalSpend: 1540, totalBookings: 6, lastCheckIn: "2026-06-18", preferences: ["Extra coffee pods", "Firm mattress", "High floor"] },
  { id: "guest_2", firstName: "Sophia", lastName: "Carter", email: "sophia.carter@yahoo.com", phone: "+1 (415) 555-8910", idType: "Driver License", idNumber: "CA-DL90219491", loyaltyTier: LoyaltyTier.Platinum, totalSpend: 4890, totalBookings: 12, lastCheckIn: "2026-06-19", preferences: ["Allergic to feathers", "Quiet room required", "Late check-out"] },
  { id: "guest_3", firstName: "Oliver", lastName: "Dubois", email: "oliver.dubois@luxe.fr", phone: "+33 6 1234 5678", idType: "Passport", idNumber: "FRA89204A2", loyaltyTier: LoyaltyTier.Silver, totalSpend: 820, totalBookings: 2, lastCheckIn: "2026-06-20", preferences: ["Hard pillow", "Enjoys room service breakfast"] },
  { id: "guest_4", firstName: "Amina", lastName: "Lawal", email: "amina.lawal@techcorp.ng", phone: "+234 905 444 8888", idType: "National ID", idNumber: "NIN-893048920", loyaltyTier: LoyaltyTier.Platinum, totalSpend: 12500, totalBookings: 24, lastCheckIn: "2026-06-20", preferences: ["Wants daily newspapers", "Requires VIP private garage access"] },
  { id: "guest_5", firstName: "Chidi", lastName: "Eze", email: "chidi.eze@outlook.com", phone: "+234 812 777 9999", idType: "Passport", idNumber: "NGA0987654B", loyaltyTier: LoyaltyTier.Bronze, totalSpend: 240, totalBookings: 1, preferences: ["Vegan dining choices"] }
];

const INITIAL_RESERVATIONS: Reservation[] = [
  { id: "res_1", guestId: "guest_1", guestName: "Tunde Alabi", roomNumber: "102", roomType: RoomType.Standard, checkInDate: "2026-06-18", checkOutDate: "2026-06-22", totalAmount: 480, status: ReservationStatus.CheckedIn, createdAt: "2026-06-10" },
  { id: "res_2", guestId: "guest_2", guestName: "Sophia Carter", roomNumber: "202", roomType: RoomType.Deluxe, checkInDate: "2026-06-19", checkOutDate: "2026-06-24", totalAmount: 1000, status: ReservationStatus.CheckedIn, createdAt: "2026-06-12" },
  { id: "res_3", guestId: "guest_3", guestName: "Oliver Dubois", roomNumber: "204", roomType: RoomType.Suite, checkInDate: "2026-06-20", checkOutDate: "2026-06-23", totalAmount: 1140, status: ReservationStatus.CheckedIn, createdAt: "2026-06-14" },
  { id: "res_4", guestId: "guest_4", guestName: "Amina Lawal", roomNumber: "303", roomType: RoomType.Executive, checkInDate: "2026-06-20", checkOutDate: "2026-06-26", totalAmount: 4290, status: ReservationStatus.CheckedIn, createdAt: "2026-06-15" },
  { id: "res_5", guestId: "guest_5", guestName: "Chidi Eze", roomNumber: "103", roomType: RoomType.Deluxe, checkInDate: "2026-06-22", checkOutDate: "2026-06-25", totalAmount: 540, status: ReservationStatus.Confirmed, createdAt: "2026-06-17" }
];

const INITIAL_INVOICES: Invoice[] = [
  { id: "inv_1", reservationId: "res_1", guestName: "Tunde Alabi", roomCharges: 480, serviceCharges: 45, taxes: 39.38, discount: 0, total: 564.38, status: InvoiceStatus.Unpaid, currencyCode: "USD", date: "2026-06-18", payments: [] },
  { id: "inv_2", reservationId: "res_2", guestName: "Sophia Carter", roomCharges: 1000, serviceCharges: 180, taxes: 88.5, discount: 50, total: 1218.5, status: InvoiceStatus.Partial, currencyCode: "USD", date: "2026-06-19", payments: [
    { id: "p_1", date: "2026-06-19", amount: 500, method: PaymentMethod.CreditCard, currency: "USD", transactionId: "TXN-892040182" }
  ] },
  { id: "inv_3", reservationId: "res_3", guestName: "Oliver Dubois", roomCharges: 1140, serviceCharges: 0, taxes: 85.5, discount: 0, total: 1225.5, status: InvoiceStatus.Unpaid, currencyCode: "USD", date: "2026-06-20", payments: [] },
  { id: "inv_4", reservationId: "res_4", guestName: "Amina Lawal", roomCharges: 4290, serviceCharges: 450, taxes: 355.5, discount: 200, total: 4895.5, status: InvoiceStatus.Paid, currencyCode: "USD", date: "2026-06-20", payments: [
    { id: "p_2", date: "2026-06-20", amount: 4895.5, method: PaymentMethod.BankTransfer, currency: "USD", transactionId: "TXN-773917492" }
  ] }
];

const INITIAL_PRINTERS: PrinterConfig[] = [
  { id: "prt_1", name: "Front Desk Thermal Reception", location: "Front Desk", type: "Thermal", isDefault: true, status: "Online" },
  { id: "prt_2", name: "Accounting Main Billing Jet", location: "Accounting", type: "Laser", isDefault: false, status: "Online" },
  { id: "prt_3", name: "Kitchen Culinary Orders", location: "Restaurant", type: "Thermal", isDefault: false, status: "Online" }
];


const INITIAL_SERVICES: ActivityService[] = [
  { id: "srv_1", name: "Deep Tissue Swedish Massage", category: "Spa", rate: 120, duration: "60 Mins", resourceName: "Therapy Room A" },
  { id: "srv_2", name: "Detox Body Scrub & Facial", category: "Spa", rate: 150, duration: "90 Mins", resourceName: "Therapy Room B" },
  { id: "srv_3", name: "Personal Fitness Training", category: "Gym", rate: 50, duration: "60 Mins", resourceName: "Studio Arena" },
  { id: "srv_4", name: "Ocean Side Candlelight Dinner", category: "Dining", rate: 180, duration: "120 Mins", resourceName: "Cabana Grill" },
  { id: "srv_5", name: "Historic City & Markets Tour", category: "Tours", rate: 80, duration: "4 Hours", resourceName: "Premium Shuttle Box" },
  { id: "srv_6", name: "VIP Yacht Sunset Champagne Cruise", category: "Tours", rate: 450, duration: "3 Hours", resourceName: "Adriatic Yacht III" }
];

const INITIAL_SERVICE_BOOKINGS: ServiceBooking[] = [
  { id: "sb_1", serviceId: "srv_1", serviceName: "Deep Tissue Swedish Massage", reservationId: "res_1", guestName: "Tunde Alabi", date: "2026-06-19", time: "14:00", quantity: 1, totalCost: 120, status: "Completed", staffAssigned: "Sandra (Massage Specialist)" },
  { id: "sb_2", serviceId: "srv_4", serviceName: "Ocean Side Candlelight Dinner", reservationId: "res_2", guestName: "Sophia Carter", date: "2026-06-21", time: "19:30", quantity: 2, totalCost: 360, status: "Pending", staffAssigned: "Chef Anthony Davis" },
  { id: "sb_3", serviceId: "srv_3", serviceName: "Personal Fitness Training", reservationId: "res_4", guestName: "Amina Lawal", date: "2026-06-21", time: "08:00", quantity: 1, totalCost: 50, status: "Pending", staffAssigned: "Coach David K." }
];

const INITIAL_PACKAGE_BUNDLES: PackageBundle[] = [
  { id: "pkg_1", name: "Romance & Spa Escape", description: "Standard Room pricing + Ocean Side Candlelight Dinner + Swedish Massage for two with 15% flat bundle discount applied.", discountPercentage: 15, includedServices: ["srv_1", "srv_4"], rateUSD: 240 },
  { id: "pkg_2", name: "VIP Executive Leisure", description: "Executive Suite + Private Yacht Sunset Champagne Cruise with 10% premium status discount applied.", discountPercentage: 10, includedServices: ["srv_6"], rateUSD: 400 }
];

const INITIAL_INVENTORY: InventoryItem[] = [
  // Low quantities on some items so warnings triggers on dashboard!
  { id: "item_1", name: "Lux Body Wash & Gel (50ml)", category: "Consumables", qty: 450, minQty: 100, unit: "Bottles", supplier: "Afriluxe Ltd.", lastRestockDate: "2026-06-05" },
  { id: "item_2", name: "Ultra Soft Velvet Slippers", category: "Consumables", qty: 24, minQty: 50, unit: "Pairs", supplier: "Global Beddings Co.", lastRestockDate: "2026-05-18" }, // WARNING
  { id: "item_3", name: "Egyptian Cotton Queen Bed Sheets", category: "Linens", qty: 85, minQty: 40, unit: "Pieces", supplier: "Global Beddings Co.", lastRestockDate: "2026-06-01" },
  { id: "item_4", name: "Laurent Perrier Champagne Vintage", category: "Bar", qty: 8, minQty: 12, unit: "Bottles", supplier: "Vintage Distributors NGR", lastRestockDate: "2026-05-20" }, // WARNING
  { id: "item_5", name: "Organic Arabica Coffee Beans (1kg)", category: "Kitchen", qty: 35, minQty: 15, unit: "Packs", supplier: "Highland Farms Ltd.", lastRestockDate: "2026-06-14" },
  { id: "item_6", name: "Pristine Luxury Toilet Rolls", category: "Consumables", qty: 12, minQty: 100, unit: "Rolls", supplier: "Pristine Pulp Ltd.", lastRestockDate: "2026-06-01" } // CRITICAL WARNING
];

const INITIAL_STAFF: StaffUser[] = [
  { id: "staff_1", name: "Sarah Jenkins", role: StaffRole.Receptionist, email: "sarah.j@omnisuite.com", phone: "+234 810 555 1234", avatar: "👩‍💼", status: "Active" },
  { id: "staff_2", name: "Alex Kalu", role: StaffRole.Manager, email: "alex.k@omnisuite.com", phone: "+234 810 555 5678", avatar: "🤵", status: "Active" },
  { id: "staff_3", name: "Evelyn Williams", role: StaffRole.Admin, email: "evelyn.w@omnisuite.com", phone: "+234 810 555 1111", avatar: "👩‍💻", status: "Active" },
  { id: "staff_4", name: "Musa Ibrahim", role: StaffRole.Housekeeping, email: "musa.i@omnisuite.com", phone: "+234 810 555 2222", avatar: "🧹", status: "Active" },
  { id: "staff_5", name: "Bose Peters", role: StaffRole.Housekeeping, email: "bose.p@omnisuite.com", phone: "+234 810 555 3333", avatar: "🧽", status: "Off-Duty" },
  { id: "staff_6", name: "Chinedu Okafor", role: StaffRole.Accountant, email: "chinedu.o@omnisuite.com", phone: "+234 810 555 7777", avatar: "💰", status: "Active" }
];

const INITIAL_SHIFTS: Shift[] = [
  { id: "s_1", staffId: "staff_1", staffName: "Sarah Jenkins", role: StaffRole.Receptionist, dayOfWeek: "Monday", startTime: "07:00", endTime: "15:00" },
  { id: "s_2", staffId: "staff_1", staffName: "Sarah Jenkins", role: StaffRole.Receptionist, dayOfWeek: "Tuesday", startTime: "07:00", endTime: "15:00" },
  { id: "s_3", staffId: "staff_1", staffName: "Sarah Jenkins", role: StaffRole.Receptionist, dayOfWeek: "Wednesday", startTime: "07:00", endTime: "15:00" },
  { id: "s_4", staffId: "staff_1", staffName: "Sarah Jenkins", role: StaffRole.Receptionist, dayOfWeek: "Thursday", startTime: "07:00", endTime: "15:00" },
  { id: "s_5", staffId: "staff_1", staffName: "Sarah Jenkins", role: StaffRole.Receptionist, dayOfWeek: "Friday", startTime: "07:00", endTime: "15:00" },

  { id: "s_6", staffId: "staff_2", staffName: "Alex Kalu", role: StaffRole.Manager, dayOfWeek: "Monday", startTime: "09:00", endTime: "17:00" },
  { id: "s_7", staffId: "staff_2", staffName: "Alex Kalu", role: StaffRole.Manager, dayOfWeek: "Wednesday", startTime: "09:00", endTime: "17:00" },
  { id: "s_8", staffId: "staff_2", staffName: "Alex Kalu", role: StaffRole.Manager, dayOfWeek: "Friday", startTime: "09:00", endTime: "17:00" },

  { id: "s_9", staffId: "staff_4", staffName: "Musa Ibrahim", role: StaffRole.Housekeeping, dayOfWeek: "Monday", startTime: "08:00", endTime: "16:00" },
  { id: "s_10", staffId: "staff_4", staffName: "Musa Ibrahim", role: StaffRole.Housekeeping, dayOfWeek: "Tuesday", startTime: "08:00", endTime: "16:00" },
  { id: "s_11", staffId: "staff_4", staffName: "Musa Ibrahim", role: StaffRole.Housekeeping, dayOfWeek: "Wednesday", startTime: "08:00", endTime: "16:00" }
];

const INITIAL_AUDITS: AuditLog[] = [
  { id: "a_1", timestamp: "2026-06-20T08:15:00Z", userEmail: "evelyn.w@omnisuite.com", userName: "Evelyn Williams", role: StaffRole.Admin, action: "SYSTEM", detail: "OmniSuite HMS initialized for Lagos Atlantic High Performance Node" },
  { id: "a_2", timestamp: "2026-06-20T09:30:00Z", userEmail: "sarah.j@omnisuite.com", userName: "Sarah Jenkins", role: StaffRole.Receptionist, action: "CHECK-IN", detail: "Guest Amina Lawal successfully verified and checked into Executive Suite 303 via mobile walk-in flow" },
  { id: "a_3", timestamp: "2026-06-20T11:45:00Z", userEmail: "alex.k@omnisuite.com", userName: "Alex Kalu", role: StaffRole.Manager, action: "PRICING", detail: "Dynamic multiplier for Deluxe Rooms updated to 1.25x for seasonal summer weekend peak hours" },
  { id: "a_4", timestamp: "2026-06-20T14:10:00Z", userEmail: "sarah.j@omnisuite.com", userName: "Sarah Jenkins", role: StaffRole.Receptionist, action: "PAYMENT", detail: "Captured $4895.50 bank wire for Invoice #inv_4 (Amina Lawal) - completed status locked" }
];


export const HMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // SIMULATED USER PERMISSIONS & BRANCH
  const [activeRole, setActiveRole] = useState<StaffRole>(() => {
    return (localStorage.getItem("hms_activeRole") as StaffRole) || StaffRole.Admin;
  });
  const [activeStaffId, setActiveStaffId] = useState<string>(() => {
    return localStorage.getItem("hms_activeStaffId") || "staff_3"; // Evelyn is Admin
  });
  const [activeBranchId, setActiveBranchId] = useState<string>(() => {
    return localStorage.getItem("hms_activeBranchId") || "lagos";
  });

  // DB STATE variables
  const [hotelProfile, setHotelProfile] = useState<HotelProfile>(() => {
    const saved = localStorage.getItem("hms_profile");
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });

  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem("hms_rooms");
    return saved ? JSON.parse(saved) : INITIAL_ROOMS;
  });

  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const saved = localStorage.getItem("hms_reservations");
    return saved ? JSON.parse(saved) : INITIAL_RESERVATIONS;
  });

  const [guests, setGuests] = useState<Guest[]>(() => {
    const saved = localStorage.getItem("hms_guests");
    return saved ? JSON.parse(saved) : INITIAL_GUESTS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem("hms_invoices");
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [services, setServices] = useState<ActivityService[]>(() => {
    const saved = localStorage.getItem("hms_services");
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [serviceBookings, setServiceBookings] = useState<ServiceBooking[]>(() => {
    const saved = localStorage.getItem("hms_serviceBookings");
    return saved ? JSON.parse(saved) : INITIAL_SERVICE_BOOKINGS;
  });

  const [packageBundles, setPackageBundles] = useState<PackageBundle[]>(() => {
    const saved = localStorage.getItem("hms_packageBundles");
    return saved ? JSON.parse(saved) : INITIAL_PACKAGE_BUNDLES;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem("hms_inventory");
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [staff, setStaff] = useState<StaffUser[]>(() => {
    const saved = localStorage.getItem("hms_staff");
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });

  const [shifts, setShifts] = useState<Shift[]>(() => {
    const saved = localStorage.getItem("hms_shifts");
    return saved ? JSON.parse(saved) : INITIAL_SHIFTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem("hms_audits");
    return saved ? JSON.parse(saved) : INITIAL_AUDITS;
  });

  const [printers, setPrinters] = useState<PrinterConfig[]>(() => {
    const saved = localStorage.getItem("hms_printers");
    return saved ? JSON.parse(saved) : INITIAL_PRINTERS;
  });

  const [prepayments, setPrepayments] = useState<Prepayment[]>(() => {
    const saved = localStorage.getItem("hms_prepayments");
    return saved ? JSON.parse(saved) : [];
  });

  // Current active worker name helper
  const currentStaffUser = staff.find((s) => s.id === activeStaffId) || {
    name: "System Operator",
    email: "operator@omnisuite.com",
    role: activeRole
  };

  // Persist configurations & state
  useEffect(() => {
    localStorage.setItem("hms_activeRole", activeRole);
  }, [activeRole]);

  useEffect(() => {
    localStorage.setItem("hms_activeStaffId", activeStaffId);
  }, [activeStaffId]);

  useEffect(() => {
    localStorage.setItem("hms_activeBranchId", activeBranchId);
  }, [activeBranchId]);

  useEffect(() => {
    localStorage.setItem("hms_profile", JSON.stringify(hotelProfile));
  }, [hotelProfile]);

  useEffect(() => {
    localStorage.setItem("hms_rooms", JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem("hms_reservations", JSON.stringify(reservations));
  }, [reservations]);

  useEffect(() => {
    localStorage.setItem("hms_guests", JSON.stringify(guests));
  }, [guests]);

  useEffect(() => {
    localStorage.setItem("hms_invoices", JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem("hms_services", JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem("hms_serviceBookings", JSON.stringify(serviceBookings));
  }, [serviceBookings]);

  useEffect(() => {
    localStorage.setItem("hms_packageBundles", JSON.stringify(packageBundles));
  }, [packageBundles]);

  useEffect(() => {
    localStorage.setItem("hms_inventory", JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem("hms_staff", JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem("hms_shifts", JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem("hms_audits", JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem("hms_printers", JSON.stringify(printers));
  }, [printers]);

  useEffect(() => {
    localStorage.setItem("hms_prepayments", JSON.stringify(prepayments));
  }, [prepayments]);


  // Helper Log Writer
  const addAuditLog = (action: string, detail: string) => {
    const newLog: AuditLog = {
      id: "a_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      userEmail: currentStaffUser.email,
      userName: currentStaffUser.name,
      role: activeRole,
      action,
      detail
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Mutators
  const updateHotelProfile = (updated: HotelProfile) => {
    setHotelProfile(updated);
    addAuditLog("SETTINGS", `Hotel core profile and business guidelines modified`);
  };

  const createReservation = (newResData: Omit<Reservation, "id" | "createdAt">) => {
    const generatedId = "res_" + Date.now() + "_" + Math.floor(Math.random() * 100);
    const newRes: Reservation = {
      ...newResData,
      id: generatedId,
      createdAt: new Date().toISOString().split("T")[0]
    };

    setReservations((prev) => [newRes, ...prev]);

    // Create a matching unpaid Invoice
    const generatedInvoice: Invoice = {
      id: "inv_" + Date.now() + "_" + Math.floor(Math.random() * 100),
      reservationId: generatedId,
      guestName: newResData.guestName,
      roomCharges: newResData.totalAmount,
      serviceCharges: 0,
      taxes: Math.round(newResData.totalAmount * (hotelProfile.taxRate / 100) * 100) / 100,
      discount: 0,
      total: Math.round(newResData.totalAmount * (1 + (hotelProfile.taxRate + hotelProfile.serviceChargeRate) / 100) * 100) / 100,
      status: InvoiceStatus.Unpaid,
      currencyCode: "USD",
      date: newRes.checkInDate,
      payments: []
    };

    setInvoices((prev) => [generatedInvoice, ...prev]);

    // Update Guest Total Bookings record
    setGuests((prev) =>
      prev.map((g) => {
        if (g.id === newResData.guestId) {
          return { ...g, totalBookings: g.totalBookings + 1 };
        }
        return g;
      })
    );

    addAuditLog(
      "RESERVATION",
      `Created offline booking ${generatedId} for room ${newResData.roomNumber} (${newResData.guestName})`
    );

    return newRes;
  };

  const updateReservationStatus = (id: string, status: ReservationStatus) => {
    setReservations((prev) =>
      prev.map((res) => {
        if (res.id === id) {
          return { ...res, status };
        }
        return res;
      })
    );

    const res = reservations.find((r) => r.id === id);
    if (res) {
      addAuditLog("RESERVATION", `Booking status updated for ${id} to ${status}`);
      
      // Sync Room Status as well
      if (status === ReservationStatus.Cancelled) {
        setRooms((roomsPrev) =>
          roomsPrev.map((rm) => {
            if (rm.number === res.roomNumber && rm.status === RoomStatus.Occupied) {
              return { ...rm, status: RoomStatus.Cleaning, currentGuestName: undefined };
            }
            return rm;
          })
        );
      }
    }
  };

  const rescheduleReservation = (id: string, checkInDate: string, checkOutDate: string, roomNumber: string, totalAmount: number) => {
    setReservations((prev) =>
      prev.map((res) => {
        if (res.id === id) {
          return { ...res, checkInDate, checkOutDate, roomNumber, totalAmount };
        }
        return res;
      })
    );

    addAuditLog(
      "RESERVATION",
      `Rescheduled booking ${id} to ${checkInDate} -> ${checkOutDate} in room ${roomNumber} (New cost: $${totalAmount})`
    );

    // Also update matching unpaid Invoice if any
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.reservationId === id && inv.status === InvoiceStatus.Unpaid) {
          const newTax = Math.round(totalAmount * (hotelProfile.taxRate / 100) * 100) / 100;
          const newTotal = Math.round(totalAmount * (1 + (hotelProfile.taxRate + hotelProfile.serviceChargeRate) / 100) * 100) / 100;
          return {
            ...inv,
            roomCharges: totalAmount,
            taxes: newTax,
            total: newTotal
          };
        }
        return inv;
      })
    );
  };

  const checkInReservation = (id: string, idType: string, idNumber: string, roomNumber: string) => {
    // 1. Mark Reservation as CheckedIn
    setReservations((prev) =>
      prev.map((res) => {
        if (res.id === id) {
          return { ...res, status: ReservationStatus.CheckedIn, roomNumber };
        }
        return res;
      })
    );

    const reservation = reservations.find((r) => r.id === id);
    const guestName = reservation ? reservation.guestName : "Unknown Guest";
    const guestId = reservation ? reservation.guestId : "";

    // 2. Mark Room Status as Occupied
    setRooms((prev) =>
      prev.map((rm) => {
        if (rm.number === roomNumber) {
          return { ...rm, status: RoomStatus.Occupied, currentGuestName: guestName };
        }
        // If checking out of an old room, clear it
        if (reservation && rm.number === reservation.roomNumber && rm.currentGuestName === guestName) {
          return { ...rm, status: RoomStatus.Cleaning, currentGuestName: undefined };
        }
        return rm;
      })
    );

    // 3. Update Guest verification info
    setGuests((prev) =>
      prev.map((g) => {
        if (g.id === guestId) {
          return {
            ...g,
            idType,
            idNumber,
            lastCheckIn: new Date().toISOString().split("T")[0]
          };
        }
        return g;
      })
    );

    addAuditLog("CHECK-IN", `Guest ${guestName} checked in to Room ${roomNumber} - ID verified (${idType})`);

    // 4. Auto apply prepayment linked to this reservation if any
    const matchPreps = prepayments.filter((p) => p.reservationId === id);
    const totalPrep = matchPreps.reduce((s, p) => s + p.amount, 0);
    if (totalPrep > 0) {
      setInvoices((prevInv) =>
        prevInv.map((inv) => {
          if (inv.reservationId === id) {
            const prepPayment: Payment = {
              id: "p_prep_" + Date.now() + "_" + Math.floor(Math.random() * 100),
              date: new Date().toISOString().split("T")[0],
              amount: totalPrep,
              method: PaymentMethod.CreditCard,
              currency: "USD",
              transactionId: "TXN-PREP-" + id
            };
            const updatedPayments = [...inv.payments, prepPayment];
            const paidSum = updatedPayments.reduce((s, p) => s + p.amount, 0);
            const status = paidSum >= inv.total ? InvoiceStatus.Paid : InvoiceStatus.Partial;
            return { ...inv, payments: updatedPayments, status };
          }
          return inv;
        })
      );

      setGuests((prevG) =>
        prevG.map((g) => {
          if (g.id === guestId) {
            const currentP = g.prepaymentBalance || 0;
            return { ...g, prepaymentBalance: Math.max(0, currentP - totalPrep) };
          }
          return g;
        })
      );

      addAuditLog("FINANCE", `Applied Prepayment of $${totalPrep} USD to Invoice for Res ID: #${id}`);
    }
  };

  const checkOutReservation = (id: string, method: PaymentMethod, currencyCode: string) => {
    const reservation = reservations.find((r) => r.id === id);
    if (!reservation) return;

    // 1. Mark booking as CheckedOut
    setReservations((prev) =>
      prev.map((res) => {
        if (res.id === id) {
          return { ...res, status: ReservationStatus.CheckedOut };
        }
        return res;
      })
    );

    // 2. Clear Room guest and set status to Cleaning
    setRooms((prev) =>
      prev.map((rm) => {
        if (rm.number === reservation.roomNumber) {
          return { ...rm, status: RoomStatus.Cleaning, currentGuestName: undefined };
        }
        return rm;
      })
    );

    // Fetch guest profile credit balance
    const targetGuest = guests.find((g) => g.id === reservation.guestId);
    const availableCredit = targetGuest?.creditBalance || 0;

    // 3. Close the Invoice by paying remaining balance
    let creditUsed = 0;
    let remainingUSD = 0;
    const paymentsToAppend: Payment[] = [];

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.reservationId === id) {
          const totalPaidBefore = inv.payments.reduce((acc, p) => acc + p.amount, 0);
          remainingUSD = Math.max(0, inv.total - totalPaidBefore);

          if (remainingUSD > 0 && availableCredit > 0) {
            creditUsed = Math.min(remainingUSD, availableCredit);
            remainingUSD -= creditUsed;

            paymentsToAppend.push({
              id: "p_credit_" + Date.now() + "_" + Math.floor(Math.random() * 100),
              date: new Date().toISOString().split("T")[0],
              amount: creditUsed,
              method: PaymentMethod.CreditCard,
              currency: "USD",
              transactionId: "TXN-CREDIT-APPLIED-" + id
            });
          }

          if (remainingUSD > 0) {
            paymentsToAppend.push({
              id: "p_" + Date.now() + "_" + Math.floor(Math.random() * 100),
              date: new Date().toISOString().split("T")[0],
              amount: remainingUSD,
              method,
              currency: currencyCode,
              transactionId: "TXN-" + Math.floor(Math.random() * 100000000)
            });
          }

          return {
            ...inv,
            status: InvoiceStatus.Paid,
            currencyCode,
            payments: [...inv.payments, ...paymentsToAppend]
          };
        }
        return inv;
      })
    );

    // Update Guest Total Spend & Credit Balances (Moved outside of setInvoices)
    setGuests((guestPrev) =>
      guestPrev.map((g) => {
        if (g.id === reservation.guestId) {
          const updatedCredit = Math.max(0, (g.creditBalance || 0) - creditUsed);
          
          // Re-calculate standard spend change
          const spendDiff = remainingUSD + creditUsed;
          const newSpend = g.totalSpend + spendDiff;
          
          let newTier = g.loyaltyTier;
          if (newSpend >= 10000) newTier = LoyaltyTier.Platinum;
          else if (newSpend >= 3000) newTier = LoyaltyTier.Gold;
          else if (newSpend >= 1000) newTier = LoyaltyTier.Silver;

          return {
            ...g,
            totalSpend: newSpend,
            loyaltyTier: newTier,
            creditBalance: updatedCredit
          };
        }
        return g;
      })
    );

    if (creditUsed > 0) {
      addAuditLog("FINANCE", `Applied guest credit balance of $${creditUsed} USD to Invoice ${id}`);
    }

    addAuditLog("CHECK-OUT", `Guest ${reservation.guestName} checked out of Room ${reservation.roomNumber}. Paid with ${method}`);
  };

  const updateRoomStatus = (id: string, status: RoomStatus) => {
    const rm = rooms.find((r) => r.id === id);
    if (rm) {
      addAuditLog("ROOM", `Room ${rm.number} status modified from ${rm.status} to ${status}`);
    }

    setRooms((prev) =>
      prev.map((rm) => {
        if (rm.id === id) {
          return {
            ...rm,
            status,
            currentGuestName: status === RoomStatus.Available ? undefined : rm.currentGuestName
          };
        }
        return rm;
      })
    );
  };

  const updateRoomHousekeeper = (id: string, housekeeperId: string | undefined) => {
    const rm = rooms.find((r) => r.id === id);
    if (rm) {
      const hkName = housekeeperId ? staff.find((s) => s.id === housekeeperId)?.name : "None";
      addAuditLog("HOUSEKEEPING", `Assigned Room ${rm.number} to cleaning team member: ${hkName}`);
    }

    setRooms((prev) =>
      prev.map((rm) => {
        if (rm.id === id) {
          return { ...rm, housekeeperId };
        }
        return rm;
      })
    );
  };

  const updateRoomPricing = (id: string, baseRate: number, dynamicModifier: number) => {
    const rm = rooms.find((r) => r.id === id);
    if (rm) {
      addAuditLog(
        "PRICING",
        `Room ${rm.number} pricing updated - Base: $${baseRate}, Peak Modifier: ${dynamicModifier}x`
      );
    }

    setRooms((prev) =>
      prev.map((rm) => {
        if (rm.id === id) {
          return { ...rm, baseRate, dynamicModifier };
        }
        return rm;
      })
    );
  };

  const saveGuest = (g: Omit<Guest, "id" | "totalSpend" | "totalBookings">) => {
    const generatedId = "guest_" + Date.now() + "_" + Math.floor(Math.random() * 100);
    const newGuest: Guest = {
      ...g,
      id: generatedId,
      totalSpend: 0,
      totalBookings: 0
    };
    setGuests((prev) => [newGuest, ...prev]);
    addAuditLog("CRM", `Registered new guest account for ${g.firstName} ${g.lastName} (${g.email})`);
    return newGuest;
  };

  const updateGuestProfile = (id: string, updates: Partial<Guest>) => {
    const g = guests.find((x) => x.id === id);
    if (g) {
      addAuditLog("CRM", `Guest profile updated for ${g.firstName} ${g.lastName}`);
    }

    setGuests((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          return { ...g, ...updates };
        }
        return g;
      })
    );
  };

  const addPaymentToInvoice = (invoiceId: string, amount: number, method: PaymentMethod, currency: string) => {
    const selectedCurrency = hotelProfile.currencies.find((c) => c.code === currency) || hotelProfile.currencies[0];
    const amountInUSD = amount / selectedCurrency.rateToUSD;

    const newPayment: Payment = {
      id: "p_" + Date.now() + "_" + Math.floor(Math.random() * 100),
      date: new Date().toISOString().split("T")[0],
      amount: amountInUSD,
      method,
      currency,
      transactionId: "TXN-" + Math.floor(Math.random() * 100000000)
    };

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          const newPaymentsList = [...inv.payments, newPayment];
          const totalPaid = newPaymentsList.reduce((acc, p) => acc + p.amount, 0);

          let newStatus = InvoiceStatus.Partial;
          if (totalPaid >= inv.total - 0.05) {
            newStatus = InvoiceStatus.Paid;
          }

          return {
            ...inv,
            payments: newPaymentsList,
            status: newStatus
          };
        }
        return inv;
      })
    );

    const inv = invoices.find((i) => i.id === invoiceId);
    if (inv) {
      // Fetch Reservation to update Guest info
      const res = reservations.find((r) => r.id === inv.reservationId);
      if (res) {
        setGuests((guestPrev) =>
          guestPrev.map((g) => {
            if (g.id === res.guestId) {
              const newSpend = g.totalSpend + amountInUSD;
              let newTier = g.loyaltyTier;
              if (newSpend >= 10000) newTier = LoyaltyTier.Platinum;
              else if (newSpend >= 3000) newTier = LoyaltyTier.Gold;
              else if (newSpend >= 1000) newTier = LoyaltyTier.Silver;

              return { ...g, totalSpend: newSpend, loyaltyTier: newTier };
            }
            return g;
          })
        );
      }
    }

    addAuditLog(
      "PAYMENT",
      `Invoice ${invoiceId} received payment of ${selectedCurrency.symbol}${amount.toFixed(2)} using ${method}`
    );
  };

  const bookService = (bookingData: Omit<ServiceBooking, "id">) => {
    const generatedId = "sb_" + Date.now() + "_" + Math.floor(Math.random() * 100);
    const newServiceBooking: ServiceBooking = {
      ...bookingData,
      id: generatedId
    };

    setServiceBookings((prev) => [newServiceBooking, ...prev]);

    // Append service charges to the reservation's Invoice
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.reservationId === bookingData.reservationId) {
          const newRoomExpense = inv.roomCharges;
          const newServiceExpense = inv.serviceCharges + bookingData.totalCost;
          const newTax = Math.round((newRoomExpense + newServiceExpense) * (hotelProfile.taxRate / 100) * 100) / 100;
          const newTotal = Math.round((newRoomExpense + newServiceExpense) * (1 + (hotelProfile.taxRate + hotelProfile.serviceChargeRate) / 100) * 100) / 100;

          return {
            ...inv,
            serviceCharges: newServiceExpense,
            taxes: newTax,
            total: newTotal
          };
        }
        return inv;
      })
    );

    addAuditLog(
      "SERVICES",
      `Booked activity: ${bookingData.serviceName} for reservation ${bookingData.reservationId} ($${bookingData.totalCost})`
    );

    return newServiceBooking;
  };

  const updateServiceBookingStatus = (id: string, status: "Pending" | "Completed" | "Cancelled") => {
    addAuditLog("SERVICES", `Activity order ${id} status altered to: ${status}`);

    setServiceBookings((prev) =>
      prev.map((sb) => {
        if (sb.id === id) {
          return { ...sb, status };
        }
        return sb;
      })
    );
  };

  const restockInventory = (id: string, amount: number) => {
    const item = inventory.find((i) => i.id === id);
    if (item) {
      addAuditLog("INVENTORY", `Restocked ${amount} units of ${item.name}. Supplier: ${item.supplier}`);
    }

    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextQty = item.qty + amount;
          return {
            ...item,
            qty: nextQty,
            lastRestockDate: new Date().toISOString().split("T")[0]
          };
        }
        return item;
      })
    );
  };

  const consumeInventory = (id: string, amount: number) => {
    const item = inventory.find((i) => i.id === id);
    if (item) {
      addAuditLog("INVENTORY", `Deducted ${amount} units of ${item.name} from consumable stock`);
    }

    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextQty = Math.max(0, item.qty - amount);
          return { ...item, qty: nextQty };
        }
        return item;
      })
    );
  };

  const addInventoryItem = (newItemData: Omit<InventoryItem, "id">) => {
    const generatedId = "item_" + Date.now() + "_" + Math.floor(Math.random() * 100);
    const item: InventoryItem = {
      ...newItemData,
      id: generatedId
    };
    setInventory((prev) => [...prev, item]);
    addAuditLog("INVENTORY", `Added catalog item: ${newItemData.name} - Unit: ${newItemData.unit}`);
  };

  const addStaffUser = (staffData: Omit<StaffUser, "id">) => {
    const generatedId = "staff_" + (staff.length + 1);
    const user: StaffUser = {
      ...staffData,
      id: generatedId
    };
    setStaff((prev) => [...prev, user]);
    addAuditLog("STAFF", `Hired profile and created login credentials for: ${staffData.name} (${staffData.role})`);
  };

  const updateStaffUserStatus = (id: string, status: "Active" | "Off-Duty" | "On-Leave") => {
    const s = staff.find((x) => x.id === id);
    if (s) {
      addAuditLog("STAFF", `Updated staff status for ${s.name} to: ${status}`);
    }

    setStaff((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return { ...s, status };
        }
        return s;
      })
    );
  };

  const addShift = (shiftData: Omit<Shift, "id">) => {
    const generatedId = "s_" + Date.now() + "_" + Math.floor(Math.random() * 100);
    const newShift: Shift = {
      ...shiftData,
      id: generatedId
    };
    setShifts((prev) => [...prev, newShift]);
    addAuditLog("STAFF", `Assigned shift to ${shiftData.staffName} for ${shiftData.dayOfWeek} (${shiftData.startTime}-${shiftData.endTime})`);
  };

  const deleteShift = (id: string) => {
    const target = shifts.find((sh) => sh.id === id);
    if (target) {
      addAuditLog("STAFF", `Removed shift assignment for ${target.staffName} on ${target.dayOfWeek}`);
    }
    setShifts((prev) => prev.filter((sh) => sh.id !== id));
  };

  const addPrinter = (printerData: Omit<PrinterConfig, "id">) => {
    const generatedId = "prt_" + Date.now();
    const newPrinter: PrinterConfig = {
      ...printerData,
      id: generatedId
    };
    setPrinters((prev) => [...prev, newPrinter]);
    addAuditLog("SETTINGS", `Configured new printer queue: ${printerData.name} (${printerData.type}) at ${printerData.location}`);
  };

  const updatePrinter = (id: string, updates: Partial<PrinterConfig>) => {
    const p = printers.find((x) => x.id === id);
    if (p) {
      addAuditLog("SETTINGS", `Updated printer config for: ${p.name}`);
    }

    setPrinters((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return { ...p, ...updates };
        }
        return p;
      })
    );
  };

  const deletePrinter = (id: string) => {
    const target = printers.find((p) => p.id === id);
    if (target) {
      addAuditLog("SETTINGS", `Decommissioned printer queue: ${target.name}`);
    }
    setPrinters((prev) => prev.filter((p) => p.id !== id));
  };

  const recordPrepayment = (prepData: Omit<Prepayment, "id" | "date">) => {
    const generatedId = "prep_" + Date.now();
    const newPrep: Prepayment = {
      ...prepData,
      id: generatedId,
      date: new Date().toISOString().split("T")[0]
    };
    setPrepayments((prev) => [...prev, newPrep]);

    // Also increment guest prepaymentBalance
    setGuests((prev) =>
      prev.map((g) => {
        if (g.id === prepData.guestId) {
          const currentBal = g.prepaymentBalance || 0;
          return { ...g, prepaymentBalance: currentBal + prepData.amount };
        }
        return g;
      })
    );

    addAuditLog("FINANCE", `Recorded prepayment of $${prepData.amount} USD for reservation ID #${prepData.reservationId}`);
  };

  const adjustGuestCredit = (guestId: string, amount: number, notes: string) => {
    const g = guests.find((x) => x.id === guestId);
    if (g) {
      addAuditLog("FINANCE", `Adjusted credit balance for ${g.firstName} ${g.lastName} by $${amount} USD (${notes})`);
    }

    setGuests((prev) =>
      prev.map((g) => {
        if (g.id === guestId) {
          const currentBal = g.creditBalance || 0;
          const nextBal = Math.max(0, currentBal + amount);
          return { ...g, creditBalance: nextBal };
        }
        return g;
      })
    );
  };

  const clearAllData = () => {
    localStorage.removeItem("hms_rooms");
    localStorage.removeItem("hms_reservations");
    localStorage.removeItem("hms_guests");
    localStorage.removeItem("hms_invoices");
    localStorage.removeItem("hms_services");
    localStorage.removeItem("hms_serviceBookings");
    localStorage.removeItem("hms_packageBundles");
    localStorage.removeItem("hms_inventory");
    localStorage.removeItem("hms_staff");
    localStorage.removeItem("hms_shifts");
    localStorage.removeItem("hms_audits");
    localStorage.removeItem("hms_profile");
    localStorage.removeItem("hms_printers");
    localStorage.removeItem("hms_prepayments");
 
    setRooms(INITIAL_ROOMS);
    setReservations(INITIAL_RESERVATIONS);
    setGuests(INITIAL_GUESTS);
    setInvoices(INITIAL_INVOICES);
    setServices(INITIAL_SERVICES);
    setServiceBookings(INITIAL_SERVICE_BOOKINGS);
    setPackageBundles(INITIAL_PACKAGE_BUNDLES);
    setInventory(INITIAL_INVENTORY);
    setStaff(INITIAL_STAFF);
    setShifts(INITIAL_SHIFTS);
    setAuditLogs(INITIAL_AUDITS);
    setHotelProfile(DEFAULT_PROFILE);
    setPrinters(INITIAL_PRINTERS);
    setPrepayments([]);
 
    addAuditLog("SYSTEM", "All databases formatted and restored to system factory settings template");
  };

  return (
    <HMSContext.Provider
      value={{
        activeRole,
        setActiveRole,
        activeStaffId,
        setActiveStaffId,
        activeBranchId,
        setActiveBranchId,

        hotelProfile,
        rooms,
        reservations,
        guests,
        invoices,
        services,
        serviceBookings,
        packageBundles,
        inventory,
        staff,
        shifts,
        auditLogs,
        printers,
        prepayments,

        updateHotelProfile,
        createReservation,
        updateReservationStatus,
        rescheduleReservation,
        checkInReservation,
        checkOutReservation,
        updateRoomStatus,
        updateRoomHousekeeper,
        updateRoomPricing,
        saveGuest,
        updateGuestProfile,
        addPaymentToInvoice,
        bookService,
        updateServiceBookingStatus,
        restockInventory,
        consumeInventory,
        addInventoryItem,
        addStaffUser,
        updateStaffUserStatus,
        addShift,
        deleteShift,
        addPrinter,
        updatePrinter,
        deletePrinter,
        recordPrepayment,
        adjustGuestCredit,
        addAuditLog,
        clearAllData
      }}
    >
      {children}
    </HMSContext.Provider>
  );
};

export const useHMS = () => {
  const context = useContext(HMSContext);
  if (!context) {
    throw new Error("useHMS must be used within a HMSProvider");
  }
  return context;
};
