import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit2, Download, Eye, DollarSign, Package, FileText, Save } from "lucide-react";
import { toast } from "sonner";

interface ServiceItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: string;
  projectName: string;
  clientName: string;
  date: string;
  dueDate: string;
  items: ServiceItem[];
  subtotal: number;
  gstPercentage: number;
  gstAmount: number;
  total: number;
  status: "draft" | "sent" | "paid";
  notes?: string;
}

const SERVICE_TYPES = [
  { value: "web-development", label: "Web Development" },
  { value: "mobile-app", label: "Mobile App Development" },
  { value: "ui-ux-design", label: "UI/UX Design" },
  { value: "graphic-design", label: "Graphic Design" },
  { value: "branding", label: "Branding" },
  { value: "content-writing", label: "Content Writing" },
  { value: "seo", label: "SEO Optimization" },
  { value: "digital-marketing", label: "Digital Marketing" },
  { value: "video-production", label: "Video Production" },
  { value: "photography", label: "Photography" },
  { value: "consulting", label: "Consulting" },
  { value: "maintenance", label: "Maintenance & Support" },
  { value: "other", label: "Other Services" },
];

const calculateGST = (subtotal: number, gstPercentage: number) => {
  return (subtotal * gstPercentage) / 100;
};

  const generatePDF = (invoice: Invoice) => {
    if (!invoice) {
      toast.error("Please select an invoice first");
      return;
    }
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${invoice.id}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; }
        .logo { font-size: 28px; font-weight: bold; color: #4f46e5; }
        .invoice-title { text-align: right; }
        .invoice-title h1 { margin: 0; font-size: 32px; color: #1f2937; }
        .invoice-title p { margin: 5px 0; color: #6b7280; }
        .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
        .detail-section h3 { margin: 0 0 10px 0; color: #374151; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
        .detail-section p { margin: 5px 0; color: #1f2937; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin: 30px 0; }
        th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; }
        td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
        tr:last-child td { border-bottom: 2px solid #e5e7eb; }
        .text-right { text-align: right; }
        .totals { margin-top: 30px; display: flex; justify-content: flex-end; }
        .totals-table { width: 400px; }
        .totals-table tr td { padding: 10px; border: none; }
        .totals-table tr td:first-child { text-align: right; padding-right: 20px; color: #6b7280; }
        .totals-table tr td:last-child { text-align: right; font-weight: 600; color: #1f2937; }
        .total-row { background: #f3f4f6; border-top: 2px solid #e5e7eb; border-bottom: 2px solid #e5e7eb; }
        .total-row td:last-child { font-size: 18px; color: #4f46e5; }
        .notes { margin-top: 30px; padding: 15px; background: #f9fafb; border-left: 4px solid #4f46e5; }
        .notes h4 { margin: 0 0 10px 0; color: #374151; }
        .notes p { margin: 0; color: #6b7280; font-size: 13px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎯 Akmal Hub Pro</div>
          <div class="invoice-title">
            <h1>${invoice.id}</h1>
            <p>Invoice</p>
          </div>
        </div>

        <div class="invoice-details">
          <div>
            <div class="detail-section">
              <h3>Bill To</h3>
              <p><strong>${invoice.clientName}</strong></p>
              <p>${invoice.projectName}</p>
            </div>
          </div>
          <div>
            <div class="detail-section">
              <h3>Invoice Details</h3>
              <p><strong>Invoice Date:</strong> ${new Date(invoice.date).toLocaleDateString('en-IN')}</p>
              <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}</p>
              <p><strong>Status:</strong> <span style="text-transform: capitalize; color: ${invoice.status === 'paid' ? '#10b981' : invoice.status === 'sent' ? '#3b82f6' : '#9ca3af'}">${invoice.status}</span></p>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right">Quantity</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">₹${item.unitPrice.toLocaleString('en-IN')}</td>
                <td class="text-right">₹${item.total.toLocaleString('en-IN')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <table class="totals-table">
            <tr>
              <td>Subtotal</td>
              <td>₹${invoice.subtotal.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>GST (${invoice.gstPercentage}%)</td>
              <td>₹${invoice.gstAmount.toLocaleString('en-IN')}</td>
            </tr>
            <tr class="total-row">
              <td><strong>Total Amount</strong></td>
              <td>₹${invoice.total.toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>

        ${invoice.notes ? `
          <div class="notes">
            <h4>Notes</h4>
            <p>${invoice.notes}</p>
          </div>
        ` : ''}

        <div class="footer">
          <p>Thank you for your business! | Akmal Hub Pro | Generated on ${new Date().toLocaleDateString('en-IN')}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
  setTimeout(() => URL.revokeObjectURL(url), 5000);
};

export default function Services() {
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem("akmal-invoices");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 2 && parsed.every((inv: any) => ["INV-001","INV-002"].includes(inv.id))) {
          localStorage.removeItem("akmal-invoices");
          return [];
        }
        return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem("akmal-invoices", JSON.stringify(invoices));
  }, [invoices]);

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isAddingInvoice, setIsAddingInvoice] = useState(false);
  const [isEditingItems, setIsEditingItems] = useState(false);
  const [editingItems, setEditingItems] = useState<ServiceItem[]>([]);
  const [newInvoiceData, setNewInvoiceData] = useState({
    projectName: "",
    clientName: "",
    dueDate: "",
  });
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: "" as any,
    unitPrice: "" as any,
  });

  const handleAddInvoice = () => {
    if (!newInvoiceData.projectName || !newInvoiceData.clientName || !newInvoiceData.dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const invoice: Invoice = {
      id: `INV-${String(Date.now()).slice(-6)}`,
      projectName: newInvoiceData.projectName,
      clientName: newInvoiceData.clientName,
      date: new Date().toISOString().split("T")[0],
      dueDate: newInvoiceData.dueDate,
      items: [],
      subtotal: 0,
      gstPercentage: 18,
      gstAmount: 0,
      total: 0,
      status: "draft",
    };

    setInvoices([...invoices, invoice]);
    setSelectedInvoice(invoice);
    setNewInvoiceData({ projectName: "", clientName: "", dueDate: "" });
    setIsAddingInvoice(false);
    toast.success("Invoice created successfully");
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.quantity || !newItem.unitPrice) {
      toast.error("Please fill in all item details");
      return;
    }
    
    const qty = typeof newItem.quantity === 'string' ? parseInt(newItem.quantity) : newItem.quantity;
    const price = typeof newItem.unitPrice === 'string' ? parseFloat(newItem.unitPrice) : newItem.unitPrice;
    
    if (qty <= 0 || price <= 0) {
      toast.error("Quantity and price must be greater than 0");
      return;
    }

    if (!selectedInvoice) return;

    const item: ServiceItem = {
      id: String(Date.now()),
      name: newItem.name,
      quantity: qty,
      unitPrice: price,
      total: qty * price,
    };

    const updatedItems = [...selectedInvoice.items, item];
    const subtotal = updatedItems.reduce((sum, i) => sum + i.total, 0);
    const gstAmount = calculateGST(subtotal, selectedInvoice.gstPercentage);

    const updatedInvoice = {
      ...selectedInvoice,
      items: updatedItems,
      subtotal,
      gstAmount,
      total: subtotal + gstAmount,
    };

    setInvoices(invoices.map((inv) => (inv.id === selectedInvoice.id ? updatedInvoice : inv)));
    setSelectedInvoice(updatedInvoice);
    setNewItem({ name: "", quantity: "" as any, unitPrice: "" as any });
    toast.success("Item added to invoice");
  };

  const handleRemoveItem = (invoiceId: string, itemId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return;

    const updatedItems = invoice.items.filter((it) => it.id !== itemId);
    const subtotal = updatedItems.reduce((sum, i) => sum + i.total, 0);
    const gstAmount = calculateGST(subtotal, invoice.gstPercentage);

    const updatedInvoice = {
      ...invoice,
      items: updatedItems,
      subtotal,
      gstAmount,
      total: subtotal + gstAmount,
    };

    setInvoices(invoices.map((inv) => (inv.id === invoiceId ? updatedInvoice : inv)));
    if (selectedInvoice?.id === invoiceId) {
      setSelectedInvoice(updatedInvoice);
    }
    toast.success("Item removed");
  };

  const handleEditItem = (invoiceId: string, itemId: string, quantity: number, unitPrice: number) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return;

    const updatedItems = invoice.items.map((item) =>
      item.id === itemId
        ? { ...item, quantity, unitPrice, total: quantity * unitPrice }
        : item
    );

    const subtotal = updatedItems.reduce((sum, i) => sum + i.total, 0);
    const gstAmount = calculateGST(subtotal, invoice.gstPercentage);

    const updatedInvoice = {
      ...invoice,
      items: updatedItems,
      subtotal,
      gstAmount,
      total: subtotal + gstAmount,
    };

    setInvoices(invoices.map((inv) => (inv.id === invoiceId ? updatedInvoice : inv)));
    if (selectedInvoice?.id === invoiceId) {
      setSelectedInvoice(updatedInvoice);
    }
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    setInvoices(invoices.filter((inv) => inv.id !== invoiceId));
    if (selectedInvoice?.id === invoiceId) {
      setSelectedInvoice(null);
    }
    toast.success("Invoice deleted");
  };

  const handleUpdateStatus = (invoiceId: string, status: "draft" | "sent" | "paid") => {
    const updatedInvoices = invoices.map((inv) =>
      inv.id === invoiceId ? { ...inv, status } : inv
    );
    setInvoices(updatedInvoices);
    if (selectedInvoice?.id === invoiceId) {
      setSelectedInvoice({ ...selectedInvoice, status });
    }
    toast.success(`Invoice marked as ${status}`);
  };

  const handleUpdateGST = (invoiceId: string, gstPercentage: number) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return;

    const gstAmount = calculateGST(invoice.subtotal, gstPercentage);

    const updatedInvoice = {
      ...invoice,
      gstPercentage,
      gstAmount,
      total: invoice.subtotal + gstAmount,
    };

    setInvoices(invoices.map((inv) => (inv.id === invoiceId ? updatedInvoice : inv)));
    if (selectedInvoice?.id === invoiceId) {
      setSelectedInvoice(updatedInvoice);
    }
    toast.success("GST updated");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-700";
      case "sent":
        return "bg-blue-100 text-blue-700";
      case "paid":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Services & Billing</h1>
            <p className="text-slate-600">Manage services, create invoices, and track payments</p>
          </div>
          <Dialog open={isAddingInvoice} onOpenChange={setIsAddingInvoice}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white">
                <Plus className="w-4 h-4 mr-2" />
                New Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Project Name
                  </label>
                  <Input
                    placeholder="Enter project name"
                    value={newInvoiceData.projectName}
                    onChange={(e) =>
                      setNewInvoiceData({ ...newInvoiceData, projectName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Client Name
                  </label>
                  <Input
                    placeholder="Enter client name"
                    value={newInvoiceData.clientName}
                    onChange={(e) =>
                      setNewInvoiceData({ ...newInvoiceData, clientName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Due Date
                  </label>
                  <Input
                    type="date"
                    value={newInvoiceData.dueDate}
                    onChange={(e) =>
                      setNewInvoiceData({ ...newInvoiceData, dueDate: e.target.value })
                    }
                  />
                </div>
                <Button
                  onClick={handleAddInvoice}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  Create Invoice
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Invoices List */}
          <div className="lg:col-span-1">
            <Card className="glass sticky top-8">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Invoices</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {invoices.length === 0 ? (
                    <p className="text-sm text-slate-500">No invoices yet</p>
                  ) : (
                    invoices.map((invoice) => (
                      <button
                        key={invoice.id}
                        onClick={() => setSelectedInvoice(invoice)}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          selectedInvoice?.id === invoice.id
                            ? "bg-indigo-100 border-2 border-indigo-500"
                            : "bg-white border border-slate-200 hover:border-indigo-300"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 text-sm">{invoice.id}</p>
                            <p className="text-xs text-slate-600 truncate">
                              {invoice.projectName}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2 ${getStatusColor(
                              invoice.status
                            )}`}
                          >
                            {invoice.status}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Invoice Details */}
          <div className="lg:col-span-2">
            {selectedInvoice ? (
              <div className="space-y-6">
                {/* Invoice Header */}
                <Card className="glass">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">
                          {selectedInvoice.id}
                        </h2>
                        <p className="text-slate-600">{selectedInvoice.projectName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600">Date</p>
                        <p className="font-medium text-slate-900">{selectedInvoice.date}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-sm text-slate-600">Client</p>
                        <p className="font-medium text-slate-900">{selectedInvoice.clientName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Due Date</p>
                        <p className="font-medium text-slate-900">{selectedInvoice.dueDate}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Select
                        value={selectedInvoice.status}
                        onValueChange={(value) =>
                          handleUpdateStatus(
                            selectedInvoice.id,
                            value as "draft" | "sent" | "paid"
                          )
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generatePDF(selectedInvoice)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteInvoice(selectedInvoice.id)}
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
                          value={String(selectedInvoice.gstPercentage)}
                          onValueChange={(value) =>
                            handleUpdateGST(selectedInvoice.id, parseFloat(value))
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
                          ₹{selectedInvoice.gstAmount.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Invoice Items */}
                <Card className="glass">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">Services</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditingItems(!isEditingItems);
                          setEditingItems(selectedInvoice.items);
                        }}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        {isEditingItems ? "Done Editing" : "Edit Items"}
                      </Button>
                    </div>

                    {selectedInvoice.items.length > 0 ? (
                      <div className="space-y-3 mb-6">
                        {selectedInvoice.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
                          >
                            <div className="flex-1">
                              {isEditingItems ? (
                                <div className="space-y-2">
                                  <p className="font-medium text-slate-900">{item.name}</p>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <label className="text-xs text-slate-600">Qty</label>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) =>
                                          handleEditItem(
                                            selectedInvoice.id,
                                            item.id,
                                            parseInt(e.target.value) || 1,
                                            item.unitPrice
                                          )
                                        }
                                        className="text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-slate-600">Unit Price</label>
                                      <Input
                                        type="number"
                                        min="0"
                                        value={item.unitPrice}
                                        onChange={(e) =>
                                          handleEditItem(
                                            selectedInvoice.id,
                                            item.id,
                                            item.quantity,
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                        className="text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-slate-600">Total</label>
                                      <div className="bg-slate-100 rounded p-2 text-sm font-semibold">
                                        ₹{item.total.toLocaleString('en-IN')}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="font-medium text-slate-900">{item.name}</p>
                                  <p className="text-sm text-slate-600">
                                    {item.quantity} × ₹{item.unitPrice.toLocaleString('en-IN')}
                                  </p>
                                </>
                              )}
                            </div>
                            <div className="text-right mr-4">
                              <p className="font-semibold text-slate-900">
                                ₹{item.total.toLocaleString('en-IN')}
                              </p>
                            </div>
                            {!isEditingItems && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRemoveItem(selectedInvoice.id, item.id)
                                }
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 mb-6">No items added yet</p>
                    )}

                    {!isEditingItems && (
                      <div className="border-t border-slate-200 pt-4">
                        <h4 className="font-medium text-slate-900 mb-3">Add Service</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Service Name
                            </label>
                            <Select value={newItem.name} onValueChange={(value) => setNewItem({ ...newItem, name: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select service type or enter custom" />
                              </SelectTrigger>
                              <SelectContent>
                                {SERVICE_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.label}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="Or enter custom service name"
                              value={newItem.name}
                              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                              className="mt-2"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Qty
                              </label>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Enter qty"
                            value={newItem.quantity}
                            onChange={(e) =>
                              setNewItem({
                                ...newItem,
                                quantity: e.target.value,
                              })
                            }
                          />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Unit Price
                              </label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Enter price"
                            value={newItem.unitPrice}
                            onChange={(e) =>
                              setNewItem({
                                ...newItem,
                                unitPrice: e.target.value,
                              })
                            }
                          />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Total
                              </label>
                              <div className="bg-slate-100 rounded-md p-2 text-center font-semibold text-slate-900">
                                ₹{(newItem.quantity * newItem.unitPrice).toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>

                          <Button
                            onClick={handleAddItem}
                            className="w-full bg-teal-600 hover:bg-teal-700"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Item
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Total */}
                <Card className="glass bg-gradient-to-r from-indigo-50 to-teal-50">
                  <div className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-slate-600">Subtotal</p>
                        <p className="font-semibold text-slate-900">
                          ₹{selectedInvoice.subtotal.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-slate-600">GST ({selectedInvoice.gstPercentage}%)</p>
                        <p className="font-semibold text-slate-900">
                          ₹{selectedInvoice.gstAmount.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                        <p className="text-lg font-bold text-slate-900">Total Amount</p>
                        <p className="text-3xl font-bold text-indigo-600">
                          ₹{selectedInvoice.total.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="glass flex items-center justify-center h-96">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">Select an invoice or create a new one</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
