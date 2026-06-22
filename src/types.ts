/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum RoomType {
  Standard = "Standard",
  Deluxe = "Deluxe",
  Suite = "Suite",
  Executive = "Executive"
}

export enum RoomStatus {
  Available = "Available",
  Occupied = "Occupied",
  Maintenance = "Maintenance",
  Cleaning = "Cleaning"
}

export interface Room {
  id: string;
  number: string;
  type: RoomType;
  status: RoomStatus;
  baseRate: number; // in USD
  dynamicModifier: number; // multiplier, e.g., 1.0 (standard), 1.25 (weekend/seasonal)
  floor: number;
  features: string[];
  currentGuestName?: string;
  housekeeperId?: string;
}

export enum ReservationStatus {
  Confirmed = "Confirmed",
  CheckedIn = "CheckedIn",
  CheckedOut = "CheckedOut",
  Cancelled = "Cancelled"
}

export interface Reservation {
  id: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  roomType: RoomType;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  totalAmount: number; // USD
  status: ReservationStatus;
  notes?: string;
  packageBundleId?: string;
  createdAt: string;
}

export enum LoyaltyTier {
  Bronze = "Bronze",
  Silver = "Silver",
  Gold = "Gold",
  Platinum = "Platinum"
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idType: string; // "Passport" | "Driver License" | "National ID"
  idNumber: string;
  loyaltyTier: LoyaltyTier;
  totalSpend: number; // USD
  totalBookings: number;
  lastCheckIn?: string;
  address?: string;
  preferences?: string[];
  notes?: string;
  creditBalance?: number; // USD, default 0
  prepaymentBalance?: number; // USD, default 0
}

export enum InvoiceStatus {
  Unpaid = "Unpaid",
  Paid = "Paid",
  Partial = "Partial",
  Refunded = "Refunded"
}

export enum PaymentMethod {
  CreditCard = "Credit Card",
  Cash = "Cash",
  BankTransfer = "Bank Transfer",
  MobileMoney = "Mobile Money",
  Web3Wallet = "MetaMask Web3"
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  currency: string;
  transactionId: string;
}

export interface Invoice {
  id: string;
  reservationId: string;
  guestName: string;
  roomCharges: number; // USD
  serviceCharges: number; // USD
  taxes: number; // USD
  discount: number; // USD
  total: number; // USD
  status: InvoiceStatus;
  currencyCode: string; // E.g., USD, NGN, EUR, GBP
  date: string;
  payments: Payment[];
}

export interface ActivityService {
  id: string;
  name: string;
  category: "Spa" | "Gym" | "Dining" | "Tours" | "Events";
  rate: number; // in USD
  duration: string;
  resourceName?: string; // staff or room, e.g. "Spa Room A", "Chef Paul"
}

export interface ServiceBooking {
  id: string;
  serviceId: string;
  serviceName: string;
  reservationId: string;
  guestName: string;
  date: string;
  time: string;
  quantity: number;
  totalCost: number; // USD
  status: "Pending" | "Completed" | "Cancelled";
  staffAssigned?: string;
}

export interface PackageBundle {
  id: string;
  name: string;
  description: string;
  discountPercentage: number;
  includedServices: string[]; // ids of ActivityService
  rateUSD: number; // Flat package base rate additions
}

export interface InventoryItem {
  id: string;
  name: string;
  category: "Consumables" | "Linens" | "Bar" | "Kitchen" | "Office";
  qty: number;
  minQty: number; // alert threshold
  unit: string; // e.g. "Units", "Packs", "Bottles"
  supplier: string;
  lastRestockDate: string;
}

export enum StaffRole {
  Admin = "Admin",
  Receptionist = "Receptionist",
  Manager = "Manager",
  Housekeeping = "Housekeeping",
  Accountant = "Accountant"
}

export interface StaffUser {
  id: string;
  name: string;
  role: StaffRole;
  email: string;
  avatar: string;
  phone: string;
  status: "Active" | "Off-Duty" | "On-Leave";
}

export interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  role: StaffRole;
  dayOfWeek: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}

export interface AuditLog {
  id: string;
  timestamp: string; // DateTime ISO
  userEmail: string;
  userName: string;
  role: StaffRole;
  action: string;
  detail: string;
}

export interface HotelBranch {
  id: string;
  name: string;
  city: string;
  address: string;
}

export interface HotelProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
  currentBranchId: string;
  branches: HotelBranch[];
  taxRate: number; // percentage (e.g. 7.5 for 7.5%)
  serviceChargeRate: number; // percentage (e.g. 5 for 5%)
  currencies: {
    code: string;
    symbol: string;
    rateToUSD: number; // multiply USD by this to get local amount
  }[];
  defaultCurrencyCode?: string;
}

export interface PrinterConfig {
  id: string;
  name: string;
  location: string; // e.g. "Front Desk", "Accounting", "Restaurant"
  type: string;     // e.g. "Thermal", "Inkjet", "Laser", "Thermal Roll 80mm", etc.
  isDefault: boolean;
  status: "Online" | "Offline" | "In Use";
  connection?: string;
  ip?: string;
  assignedRole?: string;
}

export interface Prepayment {
  id: string;
  guestId: string;
  reservationId: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  notes?: string;
}

