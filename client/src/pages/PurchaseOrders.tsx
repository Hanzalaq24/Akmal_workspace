import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Download, Package, FileText } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface POItem {
  id: string;
  name: string;
  quantity: number;
  rate: number;
  total: number;
}

interface PurchaseOrder {
  id: string;
  supplierName: string;
  date: string;
  dueDate: string;
  items: POItem[];
  gstPercentage: number;
  notes: string;
  status: "draft" | "sent" | "received";
}

const STORAGE_KEY = "akmal-purchase-orders";

const generatePOId = (existing: PurchaseOrder[]): string => {
  const nextNum = existing.length > 0
    ? Math.max(...existing.map(po => parseInt(po.id.replace("PO-", "")))) + 1
    : 1;
  return `PO-${String(nextNum).padStart(3, "0")}`;
};

export default function PurchaseOrders() {
  const [, navigate] = useLocation();

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return [];
  });

  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", quantity: "", rate: "" });

  const [form, setForm] = useState({
    supplierName: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    gstPercentage: "18",
    notes: "",
  });
  const [items, setItems] = useState<POItem[]>([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-700";
      case "sent":
        return "bg-blue-100 text-blue-700";
      case "received":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const calculateSubtotal = (poItems: POItem[]) =>
    poItems.reduce((sum, item) => sum + item.total, 0);

  const calculateGST = (subtotal: number, gstPercent: number) =>
    (subtotal * gstPercent) / 100;

  const calculateTotal = (poItems: POItem[], gstPercent: number) => {
    const subtotal = calculateSubtotal(poItems);
    const gst = calculateGST(subtotal, gstPercent);
    return subtotal + gst;
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.quantity || !newItem.rate) {
      toast.error("Please fill in all item details");
      return;
    }

    const qty = parseInt(newItem.quantity);
    const rate = parseFloat(newItem.rate);

    if (qty <= 0 || rate <= 0) {
      toast.error("Quantity and rate must be greater than 0");
      return;
    }

    const item: POItem = {
      id: String(Date.now()),
      name: newItem.name,
      quantity: qty,
      rate,
      total: qty * rate,
    };

    setItems([...items, item]);
    setNewItem({ name: "", quantity: "", rate: "" });
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId));
  };

  const handleCreatePO = () => {
    if (!form.supplierName) {
      toast.error("Supplier name is required");
      return;
    }

    if (items.length === 0) {
      toast.error("Add at least one item");
      return;
    }

    const po: PurchaseOrder = {
      id: generatePOId(purchaseOrders),
      supplierName: form.supplierName,
      date: form.date,
      dueDate: form.dueDate,
      items,
      gstPercentage: parseFloat(form.gstPercentage) || 0,
      notes: form.notes,
      status: "draft",
    };

    setPurchaseOrders([...purchaseOrders, po]);
    setSelectedPO(po);
    setForm({
      supplierName: "",
      date: new Date().toISOString().split("T")[0],
      dueDate: "",
      gstPercentage: "18",
      notes: "",
    });
    setItems([]);
    setIsCreating(false);
    toast.success("Purchase order created successfully");
  };

  const handleUpdateStatus = (poId: string, status: "draft" | "sent" | "received") => {
    const updated = purchaseOrders.map((po) =>
      po.id === poId ? { ...po, status } : po
    );
    setPurchaseOrders(updated);
    if (selectedPO?.id === poId) {
      setSelectedPO({ ...selectedPO, status });
    }
    toast.success(`Status updated to ${status}`);
  };

  const handleDeletePO = (poId: string) => {
    setPurchaseOrders(purchaseOrders.filter((po) => po.id !== poId));
    if (selectedPO?.id === poId) {
      setSelectedPO(null);
    }
    toast.success("Purchase order deleted");
  };

  const handleUpdateGST = (poId: string, gstPercentage: number) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return;

    const updatedPO = { ...po, gstPercentage };
    setPurchaseOrders(purchaseOrders.map((p) => (p.id === poId ? updatedPO : p)));
    if (selectedPO?.id === poId) {
      setSelectedPO(updatedPO);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-2">Purchase Orders</h1>
            <p className="text-slate-600">Manage supplier orders and stock intake</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
            >
              Back
            </Button>
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  New Purchase Order
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Purchase Order</DialogTitle>
                  <DialogDescription>Fill in supplier and item details</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Supplier Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Enter supplier name"
                      value={form.supplierName}
                      onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                      <Input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                      <Input
                        type="date"
                        value={form.dueDate}
                        onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Items */}
                  <div className="border-t border-slate-200 pt-4">
                    <h4 className="font-medium text-slate-900 mb-3">Items</h4>
                    {items.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-slate-900 text-sm">{item.name}</p>
                              <p className="text-xs text-slate-600">
                                {item.quantity} × ₹{item.rate.toLocaleString("en-IN")}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 text-sm">
                                ₹{item.total.toLocaleString("en-IN")}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
                        <Input
                          placeholder="Enter item name"
                          value={newItem.name}
                          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            value={newItem.quantity}
                            onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Rate (₹)</label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Rate"
                            value={newItem.rate}
                            onChange={(e) => setNewItem({ ...newItem, rate: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Total</label>
                          <div className="bg-slate-100 rounded-md p-2 text-center font-semibold text-slate-900 h-[38px] flex items-center justify-center">
                            ₹{((parseInt(newItem.quantity) || 0) * (parseFloat(newItem.rate) || 0)).toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={handleAddItem}
                        variant="outline"
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                      </Button>
                    </div>
                  </div>

                  {/* Totals Preview */}
                  {items.length > 0 && (
                    <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Subtotal</span>
                        <span className="font-medium text-slate-900">
                          ₹{calculateSubtotal(items).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">GST ({form.gstPercentage}%)</span>
                        <span className="font-medium text-slate-900">
                          ₹{calculateGST(calculateSubtotal(items), parseFloat(form.gstPercentage) || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2">
                        <span className="text-slate-900">Total</span>
                        <span className="text-indigo-600">
                          ₹{calculateTotal(items, parseFloat(form.gstPercentage) || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">GST %</label>
                      <Select
                        value={form.gstPercentage}
                        onValueChange={(value) => setForm({ ...form, gstPercentage: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="5">5%</SelectItem>
                          <SelectItem value="12">12%</SelectItem>
                          <SelectItem value="18">18%</SelectItem>
                          <SelectItem value="28">28%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                      <Input
                        placeholder="Optional notes"
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleCreatePO}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white"
                  >
                    Create Purchase Order
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* PO List */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="glass lg:sticky lg:top-8">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Purchase Orders</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {purchaseOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-500">No purchase orders yet</p>
                    </div>
                  ) : (
                    purchaseOrders.map((po) => (
                      <button
                        key={po.id}
                        onClick={() => setSelectedPO(po)}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          selectedPO?.id === po.id
                            ? "bg-indigo-100 border-2 border-indigo-500"
                            : "bg-white border border-slate-200 hover:border-indigo-300"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 text-sm">{po.id}</p>
                            <p className="text-xs text-slate-600 truncate">{po.supplierName}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(po.date).toLocaleDateString("en-IN")} • ₹{calculateTotal(po.items, po.gstPercentage).toLocaleString("en-IN")}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2 ${getStatusColor(po.status)}`}
                          >
                            {po.status}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* PO Details */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            {selectedPO ? (
              <div className="space-y-6">
                {/* PO Header */}
                <Card className="glass">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">{selectedPO.id}</h2>
                        <p className="text-sm text-slate-500">{selectedPO.supplierName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600">Date</p>
                        <p className="font-medium text-slate-900">
                          {new Date(selectedPO.date).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-sm text-slate-600">Supplier</p>
                        <p className="font-medium text-slate-900">{selectedPO.supplierName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Due Date</p>
                        <p className="font-medium text-slate-900">
                          {selectedPO.dueDate
                            ? new Date(selectedPO.dueDate).toLocaleDateString("en-IN")
                            : "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Select
                        value={selectedPO.status}
                        onValueChange={(value) =>
                          handleUpdateStatus(selectedPO.id, value as "draft" | "sent" | "received")
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="received">Received</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePO(selectedPO.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* GST Settings */}
                <Card className="glass">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Tax Settings</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          GST Percentage (%)
                        </label>
                        <Select
                          value={String(selectedPO.gstPercentage)}
                          onValueChange={(value) =>
                            handleUpdateGST(selectedPO.id, parseFloat(value))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0% (No GST)</SelectItem>
                            <SelectItem value="5">5% GST</SelectItem>
                            <SelectItem value="12">12% GST</SelectItem>
                            <SelectItem value="18">18% GST</SelectItem>
                            <SelectItem value="28">28% GST</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          GST Amount
                        </label>
                        <div className="bg-slate-100 rounded-md p-2 text-center font-semibold text-slate-900">
                          ₹{calculateGST(calculateSubtotal(selectedPO.items), selectedPO.gstPercentage).toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* PO Items */}
                <Card className="glass">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Items</h3>
                    {selectedPO.items.length > 0 ? (
                      <div className="space-y-2">
                        {selectedPO.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
                          >
                            <div>
                              <p className="font-medium text-slate-900 text-sm">{item.name}</p>
                              <p className="text-xs text-slate-600">
                                {item.quantity} × ₹{item.rate.toLocaleString("en-IN")}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-slate-900">
                                ₹{item.total.toLocaleString("en-IN")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No items added</p>
                    )}
                  </div>
                </Card>

                {/* Totals */}
                <Card className="glass bg-gradient-to-r from-indigo-50 to-teal-50">
                  <div className="p-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <p className="text-slate-600">Subtotal</p>
                        <p className="font-medium text-slate-900">
                          ₹{calculateSubtotal(selectedPO.items).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <p className="text-slate-600">GST ({selectedPO.gstPercentage}%)</p>
                        <p className="font-medium text-slate-900">
                          ₹{calculateGST(calculateSubtotal(selectedPO.items), selectedPO.gstPercentage).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                        <p className="text-lg font-bold text-slate-900">Total Amount</p>
                        <p className="text-3xl font-bold text-indigo-600">
                          ₹{calculateTotal(selectedPO.items, selectedPO.gstPercentage).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Notes */}
                {selectedPO.notes && (
                  <Card className="glass">
                    <div className="p-6">
                      <h3 className="text-sm font-semibold text-slate-900 mb-2">Notes</h3>
                      <p className="text-sm text-slate-600">{selectedPO.notes}</p>
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="glass flex items-center justify-center h-96">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">Select a purchase order or create a new one</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
