/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useHMS } from "../context/HMSContext";
import { InventoryItem } from "../types";
import {
  Archive,
  Search,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  Plus,
  Compass,
  Coins,
  ArrowUpRight,
  TrendingDown
} from "lucide-react";

export const InventoryModule: React.FC = () => {
  const {
    inventory,
    restockInventory,
    consumeInventory,
    addInventoryItem
  } = useHMS();

  // state
  const [invSearch, setInvSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");

  // restock dialog
  const [selectedRestock, setSelectedRestock] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState<number>(100);

  // Consume dialog
  const [selectedConsume, setSelectedConsume] = useState<InventoryItem | null>(null);
  const [consumeQty, setConsumeQty] = useState<number>(1);

  // Add Item Dialog
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCat, setNewItemCat] = useState<"Consumables" | "Linens" | "Bar" | "Kitchen" | "Office">("Consumables");
  const [newItemMin, setNewItemMin] = useState<number>(30);
  const [newItemQty, setNewItemQty] = useState<number>(100);
  const [newItemUnit, setNewItemUnit] = useState("Units");
  const [newItemSupplier, setNewItemSupplier] = useState("");

  // Filters
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(invSearch.toLowerCase()) || item.supplier.toLowerCase().includes(invSearch.toLowerCase());
    const matchesCat = catFilter === "ALL" || item.category === catFilter;
    return matchesSearch && matchesCat;
  });

  // Calculate alerts totals
  const totalLowStock = inventory.filter((item) => item.qty < item.minQty).length;

  // Submit restock
  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestock) return;
    if (restockQty <= 0) {
      alert("Please specify restock amount.");
      return;
    }

    restockInventory(selectedRestock.id, restockQty);
    setSelectedRestock(null);
    setRestockQty(100);
  };

  // Submit consumption
  const handleConsumeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsume) return;
    if (consumeQty <= 0) return;

    consumeInventory(selectedConsume.id, consumeQty);
    setSelectedConsume(null);
    setConsumeQty(1);
  };

  // Submit New Item addition
  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemSupplier) {
      alert("Mandatory fields missing.");
      return;
    }

    addInventoryItem({
      name: newItemName,
      category: newItemCat,
      qty: newItemQty,
      minQty: newItemMin,
      unit: newItemUnit,
      supplier: newItemSupplier,
      lastRestockDate: new Date().toISOString().split("T")[0]
    });

    setShowAddForm(false);
    setNewItemName("");
    setNewItemSupplier("");
  };

  return (
    <div className="space-y-6" id="inventory-module-panel">
      {/* Upper informational area */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-700 text-sm tracking-tight flex items-center gap-1.5">
            <Archive className="w-4 h-4 text-slate-500" />
            Consumable Stock &amp; Replenishment Ledger
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Configure supply catalogs (linens, amenities, bar beverages), log daily housekeeping consumptions, trigger real-time reserve warning levels, and dispatch Vendor purchase orders.
          </p>
        </div>

        {/* Global summary count badges */}
        <div className="flex gap-4 self-stretch md:self-auto text-xs border border-slate-100 bg-slate-50 p-2.5 rounded-lg font-medium">
          <span className="text-slate-650">Stock items logged: <strong>{inventory.length} items</strong></span>
          <span className="text-slate-200">|</span>
          <span className="text-slate-650 flex items-center gap-1">
            Min Alert Warnings:
            {totalLowStock > 0 ? (
              <strong className="text-red-650 font-sans animate-pulse">{totalLowStock} items</strong>
            ) : (
              <strong className="text-emerald-650 font-sans">0 (All Stocked)</strong>
            )}
          </span>
        </div>
      </div>

      {/* Main Grid display table */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs" id="inventory-supplies-box">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-slate-700 text-sm tracking-tight">Supply Reserves Inventory</h3>
            
            {/* Category Selects */}
            <div className="flex items-center gap-1 border border-slate-150 rounded-lg bg-slate-50 text-slate-600">
              <select
                className="text-xs py-1.5 px-2 bg-transparent border-none focus:outline-hidden text-slate-650 text-sans"
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                id="inventory-class-select"
              >
                <option value="ALL">All Categories</option>
                <option value="Consumables">Consumables (Amenities)</option>
                <option value="Linens">Linens &amp; Towels</option>
                <option value="Bar">Mini-Bar Stock</option>
                <option value="Kitchen">Kitchen Supplies</option>
                <option value="Office">Office Supplies</option>
              </select>
            </div>
          </div>

          {/* Search bar controls & adds */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                className="text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 focus:outline-hidden focus:border-indigo-500 text-slate-700 bg-white placeholder:text-slate-400 w-[180px]"
                placeholder="Search name, vendors..."
                value={invSearch}
                onChange={(e) => setInvSearch(e.target.value)}
                id="inventory-search-input"
              />
            </div>

            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3.5 py-2 text-xs font-semibold flex items-center gap-1 transition"
              onClick={() => setShowAddForm(true)}
              id="action-add-item-trigger"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Stock Catalog Item
            </button>
          </div>
        </div>

        {/* Catalog Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-50">
          <table className="min-w-full text-xs text-left" id="inventory-catalog-table">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Item Ref</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Current reserves</th>
                <th className="py-3 px-4">Safe limits threshold</th>
                <th className="py-3 px-4">Preferred Supplier</th>
                <th className="py-3 px-4">Last replenishment</th>
                <th className="py-3 px-4">Alert Indicator</th>
                <th className="py-3 px-4 text-right">Roster Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {filteredInventory.map((item) => {
                const isUnderLimit = item.qty < item.minQty;
                
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">{item.id}</td>
                    <td className="py-3 px-4 text-slate-800 font-semibold">{item.name}</td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100/80 text-slate-650 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-tight">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold font-mono">
                      <span className={isUnderLimit ? "text-red-650 underline" : "text-slate-850"}>
                        {item.qty} {item.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{item.minQty} {item.unit}</td>
                    <td className="py-3 px-4 text-slate-600">{item.supplier}</td>
                    <td className="py-3 px-4 text-slate-500">{item.lastRestockDate}</td>
                    <td className="py-3 px-4">
                      {isUnderLimit ? (
                        <span className="bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 text-[10px] font-extrabold border border-red-150 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          REORDER NEEDED
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 text-[10px] font-extrabold border border-emerald-150">
                          <CheckCircle className="w-3 h-3" />
                          STOCKED SECURE
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          className="bg-indigo-650 hover:bg-slate-90 text-indigo-700 hover:bg-indigo-50 border border-slate-100 px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-1"
                          onClick={() => {
                            setSelectedRestock(item);
                            setRestockQty(100);
                          }}
                          id={`action-restock-${item.id}`}
                        >
                          <ArrowUpRight className="w-3 h-3" /> Restock Buy
                        </button>

                        <button
                          className="bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-205 px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-1"
                          onClick={() => {
                            setSelectedConsume(item);
                            setConsumeQty(1);
                          }}
                        >
                          <TrendingDown className="w-3 h-3" /> Consume
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* VENDOR ORDER RESTOCK MODAL OVERLAY */}
      {selectedRestock && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 max-w-sm w-full shadow-2xl relative text-left" id="restock-purchase-modal">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3 mb-4">
              <FileCheck className="w-4 h-4 text-indigo-500" />
              Dispatch Vendor Purchase Order
            </h3>

            <form onSubmit={handleRestockSubmit} className="space-y-4 text-slate-755">
              <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
                <p>Catalog Item: <strong className="text-slate-800">{selectedRestock.name}</strong></p>
                <p>Supplier Liaison: <strong>{selectedRestock.supplier}</strong></p>
                <p>Current On-Hand reserves: <strong>{selectedRestock.qty} {selectedRestock.unit}</strong></p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 block uppercase font-sans">Settle Order Quantity ({selectedRestock.unit})</label>
                <input
                  type="number"
                  min="5"
                  max="5000"
                  className="text-xs border border-slate-250 rounded-lg p-2.5 bg-white w-full text-slate-800 font-bold font-mono"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 block uppercase">Clerk purchase / PO Notes</label>
                <textarea
                  className="text-xs border border-slate-250 rounded-lg p-2 bg-white w-full h-[55px] font-sans"
                  placeholder="Invoice 7-day net cash settle, priority delivery..."
                  defaultValue={`PO for ${selectedRestock.name} replenishment from ${selectedRestock.supplier}`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  className="border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg px-3 py-1.5 hover:bg-slate-50 transition"
                  onClick={() => setSelectedRestock(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg px-4 py-1.5 transition text-sans"
                  id="btn-restock-purchase-confirm"
                >
                  Authorize Purchase &amp; Load Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONSUME QUANTITY MODAL */}
      {selectedConsume && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 max-w-sm w-full shadow-2xl relative text-left">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3 mb-4">
              <TrendingDown className="w-4 h-4 text-indigo-500 animate-pulse" />
              Deduct Consumed Supplies
            </h3>

            <form onSubmit={handleConsumeSubmit} className="space-y-4 text-slate-755">
              <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
                <p>Item to Deduct: <strong className="text-slate-800">{selectedConsume.name}</strong></p>
                <p>Current reserves: <strong className="text-slate-800">{selectedConsume.qty} {selectedConsume.unit}</strong></p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 block uppercase">Quantity Consumed ({selectedConsume.unit})</label>
                <input
                  type="number"
                  min="1"
                  max={selectedConsume.qty}
                  className="text-xs border border-slate-250 rounded-lg p-2.5 bg-white w-full text-slate-800 font-bold"
                  value={consumeQty}
                  onChange={(e) => setConsumeQty(Number(e.target.value))}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  className="border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg px-3 py-1.5 hover:bg-slate-50 transition"
                  onClick={() => setSelectedConsume(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg px-4 py-1.5 transition"
                  id="btn-confirm-consumption"
                >
                  Confirm Consumption
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CATALOG ITEM MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 max-w-sm w-full shadow-2xl relative text-left">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3 mb-4">
              <Plus className="w-4 h-4 text-indigo-500" />
              Add Stock Catalog Item
            </h3>

            <form onSubmit={handleAddItemSubmit} className="space-y-3.5 text-slate-700">
              <input
                type="text"
                className="text-xs border border-slate-200 rounded-lg p-2.5 bg-white block w-full"
                placeholder="Product Name / Description"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  className="text-xs text-slate-650 w-full border border-slate-200 rounded-lg p-2 bg-white focus:outline-hidden"
                  value={newItemCat}
                  onChange={(e) => setNewItemCat(e.target.value as any)}
                >
                  <option value="Consumables">Consumables</option>
                  <option value="Linens">Linens &amp; Towels</option>
                  <option value="Bar">Mini-Bar</option>
                  <option value="Kitchen">Kitchen</option>
                  <option value="Office">Office Supplies</option>
                </select>

                <input
                  type="text"
                  className="text-xs border border-slate-200 rounded-lg p-2 bg-white"
                  placeholder="Measurement Unit (Packs, Bottles)"
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-450 uppercase block font-bold">Initial On-Hand Qty</label>
                  <input
                    type="number"
                    className="text-xs border border-slate-200 rounded-lg p-2 bg-white block w-full"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-450 uppercase block font-bold">Alert Threshold Min</label>
                  <input
                    type="number"
                    className="text-xs border border-slate-200 rounded-lg p-2 bg-white block w-full"
                    value={newItemMin}
                    onChange={(e) => setNewItemMin(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <input
                type="text"
                className="text-xs border border-slate-200 rounded-lg p-2.5 bg-white block w-full"
                placeholder="Preferred Vendor / Supplier Name"
                value={newItemSupplier}
                onChange={(e) => setNewItemSupplier(e.target.value)}
                required
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  className="border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg px-3 py-1.5 hover:bg-slate-50 transition"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg px-4 py-1.5 transition"
                  id="btn-lock-inventory-add"
                >
                  Log Item Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
