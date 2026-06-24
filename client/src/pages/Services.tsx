import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit2, Download, Eye, DollarSign, Package, FileText, Save, Share2, Printer, CreditCard, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";

interface ServiceItem {
  id: string;
  name: string;
  billingType: "Fixed" | "Hourly" | "Daily" | "Monthly";
  quantity: number;
  unitPrice: number;
  total: number;
  description?: string;
  hsn: string;
  discount: number;
  cess: number;
}

interface Invoice {
  id: string;
  title: string;
  projectName: string;
  clientName: string;
  clientAddress: string;
  clientGstin: string;
  clientPhone: string;
  placeOfSupply: string;
  date: string;
  dueDate: string;
  items: ServiceItem[];
  subtotal: number;
  gstPercentage: number;
  gstAmount: number;
  additionalCharges: number;
  discount: number;
  roundOff: number;
  cess: number;
  total: number;
  receivedAmount: number;
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
  { value: "domain", label: "Domain" },
  { value: "hosting", label: "Hosting" },
  { value: "other", label: "Other Services" },
];

const calculateGST = (subtotal: number, gstPercentage: number) => {
  return (subtotal * gstPercentage) / 100;
};

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.toLocaleDateString("en-IN")} ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
};

  const generatePDF = (invoice: Invoice) => {
    if (!invoice) {
      toast.error("Please select an invoice first");
      return;
    }
    // Load company profile from Settings
    let company = { name: "Akmal", address: "", mobile: "", gstin: "", email: "", pan: "" };
    try {
      const saved = localStorage.getItem("akmal-company-profile");
      if (saved) company = JSON.parse(saved);
    } catch {}

    const dueDays = invoice.dueDate ? Math.max(0, Math.ceil((new Date(invoice.dueDate).getTime() - Date.now()) / (1000*60*60*24))) : 0;
    const halfGst = Math.round(invoice.gstAmount / 2);
    const halfGstPercent = invoice.gstPercentage / 2;
    const taxable = invoice.subtotal;

    const numberToWords = (n: number): string => {
      if (n === 0) return "Zero";
      const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
      const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
      const conv = (num: number): string => {
        if (num < 20) return ones[num];
        if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
        if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " and " + conv(num % 100) : "");
        if (num < 100000) return conv(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + conv(num % 1000) : "");
        if (num < 10000000) return conv(Math.floor(num / 100000)) + " Lakh" + (num % 100000 ? " " + conv(num % 100000) : "");
        return conv(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 ? " " + conv(num % 10000000) : "");
      };
      const rupees = Math.floor(n);
      const paise = Math.round((n - rupees) * 100);
      let result = conv(rupees) + " Rupees";
      if (paise > 0) result += " and " + conv(paise) + " Paise";
      result += " Only";
      return result;
    };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${invoice.id}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', Arial, sans-serif; background: #fff; color: #1a1a1a; }
        .page { width: 210mm; margin: 0 auto; padding: 15mm 20mm; background: white; }
        
        /* Header */
        .header { display: flex; align-items: flex-start; gap: 20px; margin-bottom: 8px; }
        .logo-area { flex-shrink: 0; width: 110px; height: 110px; }
        .logo-area svg { width: 110px; height: 110px; }
        .company-info h1 { font-size: 32px; font-weight: 800; color: #000; margin-bottom: 4px; }
        .company-info p { font-size: 11px; color: #444; line-height: 1.5; }
        .company-info .contact { font-size: 11px; color: #444; margin-top: 4px; }
        
        /* Invoice Bar */
        .invoice-bar { background: #333; color: white; padding: 10px 20px; display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; margin: 12px 0; }
        
        /* Bill To / Ship To */
        .addresses { display: flex; justify-content: space-between; margin: 15px 0; gap: 40px; }
        .address-section h3 { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #000; margin-bottom: 6px; }
        .address-section .name { font-size: 16px; font-weight: 700; color: #000; margin-bottom: 4px; }
        .address-section p { font-size: 11px; color: #444; line-height: 1.6; }
        
        /* Table */
        .items-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .items-table thead th { padding: 10px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #000; border-top: 2px solid #000; border-bottom: 1px solid #ccc; text-align: left; }
        .items-table thead th.text-right { text-align: right; }
        .items-table tbody td { padding: 10px 12px; font-size: 12px; color: #1a1a1a; border-bottom: 1px solid #eee; }
        .items-table tbody td.text-right { text-align: right; }
        .items-table tbody td.item-name { font-weight: 600; }
        .items-table tbody td.desc { font-size: 10px; color: #888; }
        .items-table tbody td.tax { font-size: 10px; color: #666; text-align: right; }
        
        /* Subtotal & Totals */
        .totals-section { margin-top: 20px; border-top: 2px solid #000; }
        .subtotal-row { display: flex; justify-content: space-between; padding: 12px 0; font-size: 12px; font-weight: 700; border-bottom: 2px solid #000; }
        .tax-breakdown { display: flex; justify-content: flex-end; padding: 10px 0; }
        .tax-breakdown table { width: 280px; }
        .tax-breakdown table td { padding: 4px 0; font-size: 12px; }
        .tax-breakdown table td:first-child { text-align: right; padding-right: 15px; color: #555; }
        .tax-breakdown table td:last-child { text-align: right; font-weight: 500; }
        .total-row-main { display: flex; justify-content: flex-end; padding: 10px 0; border-top: 1px solid #ccc; border-bottom: 2px solid #000; margin: 5px 0; }
        .total-row-main .total-label { font-weight: 700; font-size: 13px; width: 280px; }
        .total-row-main .total-label span { padding-right: 15px; }
        .total-row-main .total-value { text-align: right; font-weight: 800; font-size: 15px; }
        .received-row { display: flex; justify-content: flex-end; padding: 8px 0; font-size: 12px; }
        .received-row .r-label { width: 280px; text-align: right; padding-right: 15px; color: #555; }
        .received-row .r-value { text-align: right; font-weight: 600; }
        .words-row { display: flex; justify-content: flex-end; padding: 10px 0; margin-top: 10px; border-top: 1px solid #ccc; }
        .words-row .words-label { text-align: right; padding-right: 15px; font-weight: 700; font-size: 12px; width: 280px; }
        .words-row .words-value { font-size: 11px; font-weight: 500; }
        
        /* Notes */
        .notes { margin-top: 20px; padding: 10px; background: #f9fafb; border-left: 3px solid #333; font-size: 11px; color: #666; }
        
        /* Print */
        @media print { body { background: white; } .page { padding: 0; width: 100%; } }
      </style>
    </head>
    <body>
      <div class="page">
        <!-- Header -->
        <div class="header">
          <div class="logo-area">
            <svg viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg">
              <circle cx="55" cy="55" r="50" fill="#D4AF37" opacity="0.15"/>
              <path d="M55 20 C35 35, 20 60, 55 85 C90 60, 75 35, 55 20Z" fill="#B8860B" opacity="0.8"/>
              <path d="M45 30 C30 48, 25 65, 55 82 C55 65, 48 45, 45 30Z" fill="#D4AF37"/>
              <path d="M65 30 C80 48, 85 65, 55 82 C55 65, 62 45, 65 30Z" fill="#C5A028"/>
              <path d="M55 25 L55 82" stroke="#8B7355" stroke-width="1" fill="none"/>
            </svg>
          </div>
          <div class="company-info">
            <h1>${company.name}</h1>
            <p>${company.address}</p>
            <div class="contact">
              <p><strong>Mobile:</strong> ${company.mobile} ${company.gstin ? `&nbsp;&nbsp;&nbsp; <strong>GSTIN:</strong> ${company.gstin}` : ''}</p>
              <p><strong>Email:</strong> ${company.email}</p>
              ${company.pan ? `<p><strong>PAN:</strong> ${company.pan}</p>` : ''}
            </div>
          </div>
        </div>

        <!-- Invoice Bar -->
        <div class="invoice-bar">
          <span>Invoice No.: ${invoice.id.replace('INV-', '#')}</span>
          <span>Invoice Date: ${new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
          <span>Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${dueDays > 0 ? `(${dueDays} day(s))` : ''}</span>
        </div>

        <!-- Bill To / Ship To -->
        <div class="addresses">
          <div class="address-section">
            <h3>Bill To</h3>
            <p class="name">${invoice.clientName}</p>
            <p>${invoice.projectName}</p>
          </div>
          <div class="address-section">
            <h3>Ship To</h3>
            <p class="name">${invoice.clientName}</p>
          </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th>Products / Services</th>
              <th class="text-right">HSN</th>
              <th class="text-right">Qty.</th>
              <th class="text-right">Rate</th>
              <th class="text-right">Disc.</th>
              <th class="text-right">Tax</th>
              <th class="text-right">Cess</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => {
              const taxAmt = Math.round(item.total * invoice.gstPercentage / 100);
              const itemGstPct = invoice.gstPercentage;
              const amtAfterDisc = item.total - (item.discount || 0) + (item.cess || 0);
              return `
              <tr>
                <td class="item-name">
                  ${item.name}
                  ${item.description ? `<br><span class="desc">${item.description}</span>` : ''}
                  ${item.billingType && item.billingType !== 'Fixed' ? `<br><span class="desc">${item.billingType}</span>` : ''}
                </td>
                <td class="text-right">${item.hsn || '-'}</td>
                <td class="text-right">${item.quantity.toLocaleString('en-IN')}</td>
                <td class="text-right">₹${item.unitPrice.toLocaleString('en-IN')}</td>
                <td class="text-right">${item.discount ? '₹' + item.discount.toLocaleString('en-IN') : '-'}</td>
                <td class="tax">₹${taxAmt.toLocaleString('en-IN')}<br>(${itemGstPct}%)</td>
                <td class="text-right">${item.cess ? '₹' + item.cess.toLocaleString('en-IN') : '-'}</td>
                <td class="text-right" style="font-weight:600;">₹${amtAfterDisc.toLocaleString('en-IN')}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-section">
          <div class="subtotal-row">
            <span>Subtotal</span>
            <span style="width:280px; text-align:right;">₹ ${taxable.toLocaleString('en-IN')}</span>
            <span style="width:150px; text-align:right; font-size:15px;">₹ ${invoice.total.toLocaleString('en-IN')}</span>
          </div>
          
          <div class="tax-breakdown">
            <table>
              <tr><td>Taxable Amount</td><td>₹ ${taxable.toLocaleString('en-IN')}</td></tr>
              <tr><td>CGST @${halfGstPercent}%</td><td>₹ ${halfGst.toLocaleString('en-IN')}</td></tr>
              <tr><td>SGST @${halfGstPercent}%</td><td>₹ ${halfGst.toLocaleString('en-IN')}</td></tr>
              ${invoice.cess > 0 ? `<tr><td>Cess</td><td>₹ ${invoice.cess.toLocaleString('en-IN')}</td></tr>` : ''}
              ${(invoice.additionalCharges || 0) > 0 ? `<tr><td>Additional Charges</td><td>₹ ${(invoice.additionalCharges || 0).toLocaleString('en-IN')}</td></tr>` : ''}
              ${(invoice.discount || 0) > 0 ? `<tr><td>Discount</td><td style="color:#ef4444">-₹ ${(invoice.discount || 0).toLocaleString('en-IN')}</td></tr>` : ''}
              ${(invoice.roundOff || 0) > 0 ? `<tr><td>Round Off</td><td>₹ ${(invoice.roundOff || 0).toLocaleString('en-IN')}</td></tr>` : ''}
            </table>
          </div>

          <div class="total-row-main">
            <div class="total-label"><span>Total Amount</span></div>
            <div class="total-value">₹ ${invoice.total.toLocaleString('en-IN')}</div>
          </div>

          <div class="received-row">
            <span class="r-label">Received Amount</span>
            <span class="r-value">₹ ${(invoice.receivedAmount || 0).toLocaleString('en-IN')}</span>
          </div>

          <div class="words-row">
            <div class="words-label">Total Amount (in words)</div>
            <div class="words-value">${numberToWords(invoice.total)}</div>
          </div>
        </div>

        ${invoice.notes ? `
          <div class="notes">
            <strong>Notes:</strong> ${invoice.notes}
          </div>
        ` : ''}
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
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [payments, setPayments] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem("akmal-payments") || "[]"); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("akmal-payments", JSON.stringify(payments));
  }, [payments]);
  const [newInvoiceData, setNewInvoiceData] = useState({
    title: "",
    projectName: "",
    clientName: "",
    clientAddress: "",
    clientGstin: "",
    clientPhone: "",
    placeOfSupply: "Gujarat",
    dueDate: "",
    additionalCharges: "",
    discount: "",
    roundOff: "",
  });
  const [newItem, setNewItem] = useState({
    name: "",
    billingType: "Fixed" as "Fixed" | "Hourly" | "Daily" | "Monthly",
    quantity: "" as any,
    unitPrice: "" as any,
    description: "",
    hsn: "",
    discount: "" as any,
    cess: "" as any,
  });

  const handleAddInvoice = () => {
    if (!newInvoiceData.projectName || !newInvoiceData.clientName || !newInvoiceData.dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const invoice: Invoice = {
      id: `INV-${String(invoices.length + 1).padStart(3, '0')}`,
      title: newInvoiceData.title || `${newInvoiceData.projectName} - Invoice`,
      projectName: newInvoiceData.projectName,
      clientName: newInvoiceData.clientName,
      clientAddress: newInvoiceData.clientAddress,
      clientGstin: newInvoiceData.clientGstin,
      clientPhone: newInvoiceData.clientPhone,
      placeOfSupply: newInvoiceData.placeOfSupply || "Gujarat",
      date: new Date().toISOString(),
      dueDate: newInvoiceData.dueDate,
      items: [],
      subtotal: 0,
      gstPercentage: 18,
      gstAmount: 0,
      additionalCharges: Number(newInvoiceData.additionalCharges) || 0,
      discount: Number(newInvoiceData.discount) || 0,
      roundOff: Number(newInvoiceData.roundOff) || 0,
      cess: 0,
      total: 0,
      receivedAmount: 0,
      status: "draft",
    };

    setInvoices([...invoices, invoice]);
    setSelectedInvoice(invoice);
    
    // Auto-save client to localStorage
    if (newInvoiceData.clientName.trim()) {
      try {
        const savedClients = JSON.parse(localStorage.getItem("akmal-clients") || "[]");
        const exists = savedClients.find((c: any) => c.name?.toLowerCase() === newInvoiceData.clientName.trim().toLowerCase());
        if (!exists) {
          savedClients.push({
            id: String(Date.now()),
            name: newInvoiceData.clientName.trim(),
            email: "",
            phone: newInvoiceData.clientPhone?.trim() || "",
            address: newInvoiceData.clientAddress?.trim() || "",
            gstin: newInvoiceData.clientGstin?.trim() || "",
            placeOfSupply: newInvoiceData.placeOfSupply?.trim() || "Gujarat",
            userId: "",
          });
          localStorage.setItem("akmal-clients", JSON.stringify(savedClients));
        }
      } catch {}
    }
    
    setNewInvoiceData({ title: "", projectName: "", clientName: "", clientAddress: "", clientGstin: "", clientPhone: "", placeOfSupply: "Gujarat", dueDate: "", additionalCharges: "", discount: "", roundOff: "" });
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
      billingType: newItem.billingType || "Fixed",
      quantity: qty,
      unitPrice: price,
      total: qty * price,
      description: newItem.description || "",
      hsn: newItem.hsn || "",
      discount: Number(newItem.discount) || 0,
      cess: Number(newItem.cess) || 0,
    };

    const updatedItems = [...selectedInvoice.items, item];
    const subtotal = updatedItems.reduce((sum, i) => sum + i.total, 0);
    const gstAmount = calculateGST(subtotal, selectedInvoice.gstPercentage);
    const cessTotal = updatedItems.reduce((sum, i) => sum + (i.cess || 0), 0);
    const discountTotal = updatedItems.reduce((sum, i) => sum + (i.discount || 0), 0);

    const updatedInvoice = {
      ...selectedInvoice,
      items: updatedItems,
      subtotal,
      gstAmount,
      cess: cessTotal,
      discount: discountTotal,
      total: subtotal + gstAmount + cessTotal + (selectedInvoice.additionalCharges || 0) - discountTotal,
    };

    setInvoices(invoices.map((inv) => (inv.id === selectedInvoice.id ? updatedInvoice : inv)));
    setSelectedInvoice(updatedInvoice);
    setNewItem({ name: "", billingType: "Fixed", quantity: "" as any, unitPrice: "" as any, description: "", hsn: "", discount: "" as any, cess: "" as any });
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

  const handleEditItem = (
    invoiceId: string,
    itemId: string,
    quantity: number,
    unitPrice: number,
    billingType?: "Fixed" | "Hourly" | "Daily" | "Monthly",
    description?: string,
    hsn?: string,
    discount?: number,
    cess?: number
  ) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return;

    const updatedItems = invoice.items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            quantity,
            unitPrice,
            total: quantity * unitPrice,
            billingType: billingType !== undefined ? billingType : item.billingType,
            description: description !== undefined ? description : item.description,
            hsn: hsn !== undefined ? hsn : item.hsn,
            discount: discount !== undefined ? discount : item.discount,
            cess: cess !== undefined ? cess : item.cess,
          }
        : item
    );

    const subtotal = updatedItems.reduce((sum, i) => sum + i.total, 0);
    const gstAmount = calculateGST(subtotal, invoice.gstPercentage);
    const cessTotal = updatedItems.reduce((sum, i) => sum + (i.cess || 0), 0);
    const discountTotal = updatedItems.reduce((sum, i) => sum + (i.discount || 0), 0);

    const updatedInvoice = {
      ...invoice,
      items: updatedItems,
      subtotal,
      gstAmount,
      cess: cessTotal,
      discount: discountTotal,
      total: subtotal + gstAmount + cessTotal + (invoice.additionalCharges || 0) - discountTotal + (invoice.roundOff || 0),
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

  const handleRecordPayment = () => {
    if (!selectedInvoice) return;
    const amount = Number(paymentAmount);
    if (amount <= 0) { toast.error("Enter a valid amount"); return; }

    const payment = {
      id: String(Date.now()),
      invoiceId: selectedInvoice.id,
      clientName: selectedInvoice.clientName,
      amount,
      mode: paymentMode,
      date: new Date().toISOString(),
      notes: paymentNotes,
    };
    setPayments([payment, ...payments]);

    // Update invoice received amount and status
    const newReceived = (selectedInvoice.receivedAmount || 0) + amount;
    const newStatus: "draft" | "sent" | "paid" = newReceived >= selectedInvoice.total ? "paid" : "sent";
    const updatedInvoice = { ...selectedInvoice, receivedAmount: newReceived, status: newStatus };
    setInvoices(invoices.map(inv => inv.id === selectedInvoice.id ? updatedInvoice : inv));
    setSelectedInvoice(updatedInvoice);

    setPaymentAmount("");
    setPaymentMode("cash");
    setPaymentNotes("");
    setShowPaymentDialog(false);
    toast.success(`₹${amount.toLocaleString('en-IN')} payment recorded`);
  };

  const getOutstandingAmount = (invoice: Invoice) => {
    return Math.max(0, invoice.total - (invoice.receivedAmount || 0));
  };

  const totalOutstanding = invoices.reduce((sum, inv) => sum + getOutstandingAmount(inv), 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-2">Services & Billing</h1>
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
                    Invoice Title
                  </label>
                  <Input
                    placeholder="e.g. Website Development Invoice"
                    value={newInvoiceData.title}
                    onChange={(e) =>
                      setNewInvoiceData({ ...newInvoiceData, title: e.target.value })
                    }
                  />
                </div>
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
                    Client Address
                  </label>
                  <Input
                    placeholder="Enter client address"
                    value={newInvoiceData.clientAddress}
                    onChange={(e) =>
                      setNewInvoiceData({ ...newInvoiceData, clientAddress: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Client GSTIN
                    </label>
                    <Input
                      placeholder="22AAAAA0000A1Z5"
                      value={newInvoiceData.clientGstin}
                      onChange={(e) =>
                        setNewInvoiceData({ ...newInvoiceData, clientGstin: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Client Phone
                    </label>
                    <Input
                      placeholder="9876543210"
                      value={newInvoiceData.clientPhone}
                      onChange={(e) =>
                        setNewInvoiceData({ ...newInvoiceData, clientPhone: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Place of Supply
                    </label>
                    <Input
                      placeholder="Gujarat"
                      value={newInvoiceData.placeOfSupply}
                      onChange={(e) =>
                        setNewInvoiceData({ ...newInvoiceData, placeOfSupply: e.target.value })
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
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Additional Charges (₹)
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newInvoiceData.additionalCharges}
                      onChange={(e) =>
                        setNewInvoiceData({ ...newInvoiceData, additionalCharges: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Discount (₹)
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newInvoiceData.discount}
                      onChange={(e) =>
                        setNewInvoiceData({ ...newInvoiceData, discount: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Round Off (₹)
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newInvoiceData.roundOff}
                      onChange={(e) =>
                        setNewInvoiceData({ ...newInvoiceData, roundOff: e.target.value })
                      }
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAddInvoice}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white"
                >
                  Create Invoice
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Invoices List */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="glass lg:sticky lg:top-8">
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
          <div className="lg:col-span-2 order-1 lg:order-2">
            {selectedInvoice ? (
              <div className="space-y-6">
                {/* Invoice Header */}
                <Card className="glass">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">
                          {selectedInvoice.title || selectedInvoice.id}
                        </h2>
                        <p className="text-sm text-slate-500">{selectedInvoice.id}</p>
                        <p className="text-slate-600">{selectedInvoice.projectName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600">Date</p>
                        <p className="font-medium text-slate-900">{formatDateTime(selectedInvoice.date)}</p>
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
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-xs text-slate-600">Billing Type</label>
                                      <Select
                                        value={item.billingType || "Fixed"}
                                        onValueChange={(val) =>
                                          handleEditItem(
                                            selectedInvoice.id,
                                            item.id,
                                            item.quantity,
                                            item.unitPrice,
                                            val as any,
                                            item.description
                                          )
                                        }
                                      >
                                        <SelectTrigger className="text-sm h-9">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Fixed">Fixed</SelectItem>
                                          <SelectItem value="Hourly">Hourly</SelectItem>
                                          <SelectItem value="Daily">Daily</SelectItem>
                                          <SelectItem value="Monthly">Monthly</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <label className="text-xs text-slate-600">Description (Optional)</label>
                                      <Input
                                        type="text"
                                        value={item.description || ""}
                                        onChange={(e) =>
                                          handleEditItem(
                                            selectedInvoice.id,
                                            item.id,
                                            item.quantity,
                                            item.unitPrice,
                                            item.billingType,
                                            e.target.value
                                          )
                                        }
                                        className="text-sm h-9"
                                      />
                                    </div>
                                  </div>
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
                                            item.unitPrice,
                                            item.billingType,
                                            item.description
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
                                            parseFloat(e.target.value) || 0,
                                            item.billingType,
                                            item.description
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
                                  {item.description && (
                                    <p className="text-xs text-slate-500 italic mt-0.5">{item.description}</p>
                                  )}
                                  <p className="text-sm text-slate-600 mt-1">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 mr-2">
                                      {item.billingType || "Fixed"}
                                    </span>
                                    {item.hsn && <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded mr-1">HSN: {item.hsn}</span>}
                                    {item.quantity} × ₹{item.unitPrice.toLocaleString('en-IN')}
                                    {item.discount > 0 && <span className="text-xs text-red-600 ml-1">-₹{item.discount}</span>}
                                    {item.cess > 0 && <span className="text-xs text-orange-600 ml-1">+₹{item.cess}</span>}
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
                        <h4 className="font-medium text-slate-900 mb-3">Add Item</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Select from Items or type custom name
                            </label>
                            <Select value={newItem.name} onValueChange={(value) => {
                              // Load item details from Items page
                              try {
                                const savedItems = JSON.parse(localStorage.getItem("akmal-items") || "[]");
                                const found = savedItems.find((i: any) => i.name === value);
                                if (found) {
                                  setNewItem({
                                    ...newItem,
                                    name: found.name,
                                    unitPrice: String(found.salesPrice || ""),
                                    description: found.description || "",
                                    hsn: found.hsnOrSac || "",
                                    cess: String(found.gst || 0),
                                  });
                                } else {
                                  setNewItem({ ...newItem, name: value });
                                }
                              } catch {
                                setNewItem({ ...newItem, name: value });
                              }
                            }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select product/service or enter custom" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__custom__" disabled>— Custom Name —</SelectItem>
                                {(() => {
                                  try {
                                    const savedItems = JSON.parse(localStorage.getItem("akmal-items") || "[]");
                                    return savedItems.map((item: any) => (
                                      <SelectItem key={item.id} value={item.name}>
                                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mr-1.5 ${item.itemType === "Product" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                                          {item.itemType}
                                        </span>
                                        {item.name}
                                      </SelectItem>
                                    ));
                                  } catch {
                                    return SERVICE_TYPES.map((type) => (
                                      <SelectItem key={type.value} value={type.label}>
                                        {type.label}
                                      </SelectItem>
                                    ));
                                  }
                                })()}
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="Or enter custom item name"
                              value={newItem.name}
                              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                              className="mt-2"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Billing Type
                              </label>
                              <Select
                                value={newItem.billingType}
                                onValueChange={(value) =>
                                  setNewItem({
                                    ...newItem,
                                    billingType: value as any,
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Fixed">Fixed</SelectItem>
                                  <SelectItem value="Hourly">Hourly</SelectItem>
                                  <SelectItem value="Daily">Daily</SelectItem>
                                  <SelectItem value="Monthly">Monthly</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Description (Optional)
                              </label>
                              <Input
                                placeholder="Enter description"
                                value={newItem.description}
                                onChange={(e) =>
                                  setNewItem({
                                    ...newItem,
                                    description: e.target.value,
                                  })
                                }
                              />
                            </div>
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

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                HSN/SAC
                              </label>
                              <Input
                                placeholder="Code"
                                value={newItem.hsn}
                                onChange={(e) => setNewItem({ ...newItem, hsn: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Discount (₹)
                              </label>
                              <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={newItem.discount}
                                onChange={(e) => setNewItem({ ...newItem, discount: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Cess (₹)
                              </label>
                              <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={newItem.cess}
                                onChange={(e) => setNewItem({ ...newItem, cess: e.target.value })}
                              />
                            </div>
                          </div>

                          <Button
                            onClick={handleAddItem}
                            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white"
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
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <p className="text-slate-600">Subtotal</p>
                        <p className="font-medium text-slate-900">
                          ₹{selectedInvoice.subtotal.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <p className="text-slate-600">GST ({selectedInvoice.gstPercentage}%)</p>
                        <p className="font-medium text-slate-900">
                          ₹{selectedInvoice.gstAmount.toLocaleString('en-IN')}
                        </p>
                      </div>
                      {(selectedInvoice.cess || 0) > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <p className="text-slate-600">Cess</p>
                          <p className="font-medium text-slate-900">₹{selectedInvoice.cess.toLocaleString('en-IN')}</p>
                        </div>
                      )}
                      {(selectedInvoice.additionalCharges || 0) > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <p className="text-slate-600">Additional Charges</p>
                          <p className="font-medium text-slate-900">₹{selectedInvoice.additionalCharges.toLocaleString('en-IN')}</p>
                        </div>
                      )}
                      {(selectedInvoice.discount || 0) > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <p className="text-slate-600">Discount</p>
                          <p className="font-medium text-red-600">-₹{selectedInvoice.discount.toLocaleString('en-IN')}</p>
                        </div>
                      )}
                      {(selectedInvoice.roundOff || 0) > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <p className="text-slate-600">Round Off</p>
                          <p className="font-medium text-slate-900">₹{selectedInvoice.roundOff.toLocaleString('en-IN')}</p>
                        </div>
                      )}
                      <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                        <p className="text-lg font-bold text-slate-900">Total Amount</p>
                        <p className="text-3xl font-bold text-indigo-600">
                          ₹{selectedInvoice.total.toLocaleString('en-IN')}
                        </p>
                      </div>
                      {(selectedInvoice.receivedAmount || 0) > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <p className="text-slate-600">Received</p>
                          <p className="font-medium text-green-600">₹{selectedInvoice.receivedAmount.toLocaleString('en-IN')}</p>
                        </div>
                      )}
                    </div>
                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <Button size="sm" variant="outline" onClick={() => generatePDF(selectedInvoice)} className="flex items-center gap-1">
                        <Printer className="w-3 h-3" /> Print
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => generatePDF(selectedInvoice)} className="flex items-center gap-1">
                        <Download className="w-3 h-3" /> Download
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        const text = `Invoice ${selectedInvoice.id} - ₹${selectedInvoice.total.toLocaleString('en-IN')}`;
                        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                        window.open(url, '_blank');
                      }} className="flex items-center gap-1">
                        <Share2 className="w-3 h-3" /> Share
                      </Button>
                      {getOutstandingAmount(selectedInvoice) > 0 && (
                        <Button size="sm" onClick={() => {
                          setPaymentAmount(String(getOutstandingAmount(selectedInvoice)));
                          setShowPaymentDialog(true);
                        }} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white col-span-2 sm:col-span-1">
                          <CreditCard className="w-3 h-3" /> Record Payment (₹{getOutstandingAmount(selectedInvoice).toLocaleString('en-IN')})
                        </Button>
                      )}
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

      {/* Record Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="glass sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Invoice: {selectedInvoice?.id} | Outstanding: ₹{selectedInvoice ? getOutstandingAmount(selectedInvoice).toLocaleString('en-IN') : 0}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input type="number" placeholder="0" className="glass-sm" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger className="glass-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Input placeholder="Payment reference" className="glass-sm" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} />
            </div>
            <Button onClick={handleRecordPayment} className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white">
              <CreditCard className="w-4 h-4 mr-2" /> Record Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
