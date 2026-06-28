import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit2, Download, Eye, DollarSign, Package, FileText, Save, Share2, Printer, CreditCard, TrendingUp, Users, LayoutGrid, Receipt, UserRound, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

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
  workDoneDetail?: string;
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
    let company: any = { companyName: "Akmal", address: "", mobile: "", gstin: "", email: "", pan: "", bankName: "", bankAccountName: "", bankAccountNo: "", bankIfsc: "", upiId: "", upiMobile: "" };
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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 230.65 78.5">
              <defs><style>.st0{fill:#d3af37;fill-rule:evenodd}</style></defs>
              <g><path d="M194.83,58.12c-3.19,4-8.06,5.99-14.63,5.99-3.52,0-6.57-1.28-9.16-3.83-2.58-2.56-3.88-5.73-3.88-9.53,0-4.55,1.99-8.4,5.97-11.54s9.06-4.71,15.23-4.71c1.68,0,3.58.36,5.7,1.09,0-7.26-3.24-10.9-9.72-10.9-4.97,0-8.8,1.34-11.48,4.02l-3.35-6.66c1.51-1.23,3.6-2.28,6.26-3.16s5.22-1.32,7.65-1.32c6.51,0,11.24,1.48,14.18,4.44,2.95,2.96,4.42,7.67,4.42,14.12v16.09c0,3.94,1.17,6.57,3.52,7.88v3.98c-3.24,0-5.66-.46-7.27-1.38s-2.76-2.44-3.46-4.57h.02ZM194.07,41.24c-2.51-.56-4.27-.84-5.28-.84-4.02,0-7.31,1.03-9.85,3.1-2.54,2.07-3.81,4.51-3.81,7.33,0,4.67,2.75,7,8.26,7,4.02,0,7.58-1.91,10.69-5.74v-10.85h0Z"/><path d="M215.19,50.58V0h7.96v49.24c0,2.4.69,4.29,2.07,5.68s3.19,2.07,5.43,2.07v7.12c-10.31,0-15.46-4.51-15.46-13.54h0Z"/></g>
              <g><path d="M40.99,63.28l-4.23-12.95H13.92l-4.53,12.95H0L24.93,1.05h2.22l23.13,62.23h-9.3.01ZM25.65,17.14l-9.51,27.03h18.23l-8.72-27.03Z"/><path d="M85.12,63.28l-14.08-22.46-6.96,7.17v15.3h-7.96V0h7.96v39.27l17.18-20.87h9.3l-14.37,17.06,17.56,27.83h-8.63v-.02Z"/></g>
              <path class="st0" d="M119.02,67.13s-29.4-25.81-16.03-59.48c0,0,31.19,11.98,25.59,49.19,0,0,12.44-21.45,36.98-22.66,0,0,.89,24.81-28.93,33.56,0,0,10.76-6.49,14.4-19.04,0,0-13.78,1.42-24.92,16.45,0,0,.53-21.07-14.51-33.56,0,0-6.2,18.09,7.42,35.53"/>
              <path class="st0" d="M162.55,62.5s-38.19,31.42-80.14,6.21c0,0,12.25,1.48,22.1-5.53,0,0,13.3,21.58,58.04-.69"/>
            </svg>
          </div>
          <div class="company-info">
            <p>11, CHHIPAVAD, Near Masjid, Nana Varachha, Surat, Gujarat, 395006</p>
            <div class="contact">
              <p><strong>GSTIN:</strong> 24ALUPB9563G1ZR</p>
              <p><strong>Email:</strong> support@akmal.in</p>
              <p><strong>Mobile:</strong> 8866795230</p>
            </div>
          </div>
        </div>

        <!-- Invoice Bar -->
        <div class="invoice-bar">
          <span>Invoice No.: ${invoice.id.replace('INV-', '#')}</span>
          <span>Invoice Date: ${new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
          <span>Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${dueDays > 0 ? `(${dueDays} day(s))` : ''}</span>
        </div>

        <!-- Bill To -->
        <div class="addresses">
          <div class="address-section">
            <h3>Bill To</h3>
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
        
        <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between;">
          <div style="width: 60%;">
            <h4 style="font-size: 12px; font-weight: 700; color: #000; margin-bottom: 8px;">BANK DETAILS</h4>
            <p style="font-size: 11px; color: #444; margin: 3px 0;">Bank Name: <strong>SBI</strong></p>
            <p style="font-size: 11px; color: #444; margin: 3px 0;">Name: <strong>Abdulkarim Mohamad Afazal Bharucha</strong></p>
            <p style="font-size: 11px; color: #444; margin: 3px 0;">Account No.: <strong>32986992982</strong></p>
            <p style="font-size: 11px; color: #444; margin: 3px 0;">IFSC Code: <strong>SBIN0011050</strong></p>
            <p style="font-size: 11px; color: #444; margin: 3px 0;">Phone No.: <strong>88667 95230</strong></p>
            <p style="font-size: 11px; color: #444; margin: 3px 0;">UPI ID: <strong>8866795230@apl</strong></p>
          </div>
          <div style="width: 35%; text-align: center;">
            <h4 style="font-size: 12px; font-weight: 700; color: #000; margin-bottom: 8px;">Scan to Pay</h4>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(`upi://pay?pa=8866795230@apl&pn=Akmal&am=${(invoice.total - (invoice.receivedAmount || 0)).toFixed(2)}&tn=Payment for ${invoice.id}&cu=INR`)}" style="width: 110px; height: 110px;" alt="QR" />
            <p style="font-size: 10px; color: #666; margin-top: 4px;">8866795230@apl</p>
            <p style="font-size: 10px; color: #444; margin-top: 2px;">Amount: <strong>₹${(invoice.total - (invoice.receivedAmount || 0)).toLocaleString('en-IN')}</strong></p>
          </div>
        </div>

        ${invoice.workDoneDetail ? `
          <div style="text-align: center; margin-top: 20px; border-top: 1px dashed #ccc; padding-top: 10px;">
            <a href="#work-details" style="color: #4f46e5; text-decoration: underline; font-size: 13px; font-weight: 600;">View More Details</a>
          </div>
        ` : ''}
      </div>

      ${invoice.workDoneDetail ? `
        <div class="page" style="page-break-before: always; margin-top: 40px;" id="work-details">
          <h2 style="font-size: 20px; font-weight: 700; color: #000; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 20px; text-transform: uppercase;">Work Done in Detail</h2>
          <div style="font-size: 13px; line-height: 1.6; color: #333;" class="work-detail-content">
            ${invoice.workDoneDetail}
          </div>
        </div>
      ` : ''}
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
  const [, setLocation] = useLocation();
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

  const [trashedInvoices, setTrashedInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem("akmal-trashed-invoices");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("akmal-trashed-invoices", JSON.stringify(trashedInvoices));
  }, [trashedInvoices]);

  const [showTrash, setShowTrash] = useState(false);

  useEffect(() => {
    localStorage.setItem("akmal-invoices", JSON.stringify(invoices));
  }, [invoices]);

  // Load invoices from API for current user, merge with local
  useEffect(() => {
    const loadFromApi = async () => {
      const cu = JSON.parse(localStorage.getItem("akmal-current-user") || "{}");
      if (!cu?.id) return;
      try {
        const res = await fetch(`/api/invoices?user_id=${cu.id}`);
        if (!res.ok) return;
        const serverInvoices: any[] = await res.json();
        if (!Array.isArray(serverInvoices)) return;

        const localInvoices = JSON.parse(localStorage.getItem("akmal-invoices") || "[]");
        const merged: Invoice[] = [...localInvoices];
        const localIds = new Set(localInvoices.map((inv: any) => inv.id));
        for (const srv of serverInvoices) {
          if (!localIds.has(srv.invoice_no)) {
            merged.push({
              id: srv.invoice_no,
              title: srv.project_name ? `${srv.project_name} - Invoice` : srv.invoice_no,
              projectName: srv.project_name || "",
              clientName: srv.client_name || "",
              clientAddress: "",
              clientGstin: "",
              clientPhone: "",
              placeOfSupply: "Gujarat",
              date: srv.date,
              dueDate: srv.due_date,
              items: typeof srv.items === "string" ? JSON.parse(srv.items) : (srv.items || []),
              subtotal: Number(srv.subtotal) || 0,
              gstPercentage: Number(srv.gst_percentage) || 18,
              gstAmount: Number(srv.gst_amount) || 0,
              additionalCharges: 0,
              discount: 0,
              roundOff: 0,
              cess: 0,
              total: Number(srv.total) || 0,
              receivedAmount: 0,
              status: srv.status || "draft",
              notes: srv.notes || "",
              workDoneDetail: srv.work_done_detail || "",
            });
          }
        }
        if (merged.length !== localInvoices.length) {
          setInvoices(merged);
          localStorage.setItem("akmal-invoices", JSON.stringify(merged));
        }
      } catch {}
    };
    loadFromApi();
  }, []);

  // One-time sync existing invoices to API
  useEffect(() => {
    const sync = async () => {
      const cu = JSON.parse(localStorage.getItem("akmal-current-user") || "{}");
      if (!cu?.id) return;
      try {
        const localInvoices = JSON.parse(localStorage.getItem("akmal-invoices") || "[]");
        for (const inv of localInvoices) {
          try {
            await fetch("/api/invoices", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ invoice_no: inv.id, project_name: inv.projectName || "", client_name: inv.clientName || "", date: inv.date, due_date: inv.dueDate, items: inv.items || [], subtotal: inv.subtotal || 0, gst_percentage: inv.gstPercentage || 18, gst_amount: inv.gstAmount || 0, total: inv.total || 0, status: inv.status || "draft", notes: inv.notes || "", user_id: cu.id, work_done_detail: inv.workDoneDetail || "" }),
            });
          } catch {}
        }
      } catch {}
    };
    sync();
  }, []);

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
    clientName: "",
  });
  const [newInvoiceItem, setNewInvoiceItem] = useState({
    name: "",
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
    if (!newInvoiceData.clientName) {
      toast.error("Client name is required");
      return;
    }

    if (!newInvoiceItem.name) {
      toast.error("Please add an item");
      return;
    }

    const item: ServiceItem = {
      id: String(Date.now()),
      name: newInvoiceItem.name,
      billingType: "Fixed",
      quantity: 1,
      unitPrice: 0,
      total: 0,
      description: "",
      hsn: "",
      discount: 0,
      cess: 0,
    };

    const subtotal = 0;
    const gstAmount = 0;

    const invoice: Invoice = {
      id: `INV-${String(invoices.length + 1).padStart(3, '0')}`,
      title: `Invoice for ${newInvoiceData.clientName}`,
      projectName: "",
      clientName: newInvoiceData.clientName,
      clientAddress: "",
      clientGstin: "",
      clientPhone: "",
      placeOfSupply: "Gujarat",
      date: new Date().toISOString(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      items: [item],
      subtotal,
      gstPercentage: 18,
      gstAmount,
      additionalCharges: 0,
      discount: 0,
      roundOff: 0,
      cess: 0,
      total: subtotal + gstAmount,
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
            phone: "",
            address: "",
            gstin: "",
            placeOfSupply: "Gujarat",
            userId: "",
          });
          localStorage.setItem("akmal-clients", JSON.stringify(savedClients));
        }
      } catch {}
    }
    
    // Sync invoice to API
    try {
      const cu = JSON.parse(localStorage.getItem("akmal-current-user") || "{}");
      fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_no: invoice.id, project_name: invoice.projectName, client_name: invoice.clientName, date: invoice.date, due_date: invoice.dueDate, items: invoice.items, subtotal: invoice.subtotal, gst_percentage: invoice.gstPercentage, gst_amount: invoice.gstAmount, total: invoice.total, status: invoice.status, notes: invoice.notes || "", user_id: cu?.id || null }),
      });
    } catch {}
    
    setNewInvoiceData({ clientName: "" });
    setIsAddingInvoice(false);
    toast.success("Invoice created successfully");

    // Auto-save custom item to akmal-items if it doesn't already exist
    try {
      const savedItems = JSON.parse(localStorage.getItem("akmal-items") || "[]");
      const customName = newInvoiceItem.name.trim();
      const exists = savedItems.find((i: any) => i.name?.toLowerCase() === customName.toLowerCase());
      if (!exists && customName) {
        const newItem = {
          id: String(Date.now()),
          name: customName,
          itemType: "Service",
          unit: "Nos",
          salesPrice: 0,
          salesPriceTax: "Without Tax",
          purchasePrice: 0,
          purchasePriceTax: "Without Tax",
          gst: 0,
          hsnOrSac: "",
          discount: 0,
          openingStock: 0,
          asOfDate: new Date().toISOString(),
          itemCode: "",
          barcode: "",
          lowStockAlert: false,
          category: "No Category",
          description: "",
          showInStore: false,
          image: "",
          customFields: [],
          partyWisePrices: [],
        };
        savedItems.push(newItem);
        localStorage.setItem("akmal-items", JSON.stringify(savedItems));
      }
    } catch {}
    setNewInvoiceItem({ name: "" });
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
    cess?: number,
    name?: string
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
            name: name !== undefined ? name : item.name,
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

  const handleCreateDirectInvoice = async () => {
    const nextInvNum = invoices.length + trashedInvoices.length + 1;
    const invId = `INV-${String(nextInvNum).padStart(3, '0')}`;
    
    const defaultItem: ServiceItem = {
      id: String(Date.now()),
      name: "New Service/Item",
      billingType: "Fixed",
      quantity: 1,
      unitPrice: 0,
      total: 0,
      description: "",
      hsn: "",
      discount: 0,
      cess: 0,
    };

    const newInv: Invoice = {
      id: invId,
      title: `Invoice for New Client`,
      projectName: "",
      clientName: "New Client",
      clientAddress: "",
      clientGstin: "",
      clientPhone: "",
      placeOfSupply: "Gujarat",
      date: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      items: [defaultItem],
      subtotal: 0,
      gstPercentage: 18,
      gstAmount: 0,
      additionalCharges: 0,
      discount: 0,
      roundOff: 0,
      cess: 0,
      total: 0,
      receivedAmount: 0,
      status: "draft",
      workDoneDetail: "",
    };

    setInvoices([newInv, ...invoices]);
    setSelectedInvoice(newInv);
    setShowTrash(false);
    toast.success(`Created draft ${invId}`);

    try {
      const cu = JSON.parse(localStorage.getItem("akmal-current-user") || "{}");
      if (cu?.id) {
        await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoice_no: newInv.id,
            project_name: newInv.projectName || "",
            client_name: newInv.clientName || "",
            date: newInv.date,
            due_date: newInv.dueDate,
            items: newInv.items || [],
            subtotal: newInv.subtotal || 0,
            gst_percentage: newInv.gstPercentage || 18,
            gst_amount: newInv.gstAmount || 0,
            total: newInv.total || 0,
            status: newInv.status || "draft",
            notes: newInv.notes || "",
            user_id: cu.id,
            work_done_detail: newInv.workDoneDetail || ""
          }),
        });
      }
    } catch {}
  };

  const handleUpdateInvoiceField = async (invoiceId: string, fieldName: keyof Invoice, value: any) => {
    const updatedInvoices = invoices.map((inv) => {
      if (inv.id === invoiceId) {
        const updated = { ...inv, [fieldName]: value };
        if (fieldName === "clientName") {
          updated.title = `Invoice for ${value}`;
        }
        return updated;
      }
      return inv;
    });
    setInvoices(updatedInvoices);
    
    const updatedInvoice = updatedInvoices.find((inv) => inv.id === invoiceId);
    if (updatedInvoice && selectedInvoice?.id === invoiceId) {
      setSelectedInvoice(updatedInvoice);
    }

    if (updatedInvoice) {
      try {
        const cu = JSON.parse(localStorage.getItem("akmal-current-user") || "{}");
        await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoice_no: updatedInvoice.id,
            project_name: updatedInvoice.projectName || "",
            client_name: updatedInvoice.clientName || "",
            date: updatedInvoice.date,
            due_date: updatedInvoice.dueDate,
            items: updatedInvoice.items || [],
            subtotal: updatedInvoice.subtotal || 0,
            gst_percentage: updatedInvoice.gstPercentage || 18,
            gst_amount: updatedInvoice.gstAmount || 0,
            total: updatedInvoice.total || 0,
            status: updatedInvoice.status || "draft",
            notes: updatedInvoice.notes || "",
            user_id: cu.id,
            work_done_detail: updatedInvoice.workDoneDetail || ""
          }),
        });
      } catch {}
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    const isAlreadyTrashed = trashedInvoices.some((inv) => inv.id === invoiceId);
    
    if (isAlreadyTrashed) {
      if (confirm("Are you sure you want to permanently delete this invoice?")) {
        setTrashedInvoices(trashedInvoices.filter((inv) => inv.id !== invoiceId));
        if (selectedInvoice?.id === invoiceId) {
          setSelectedInvoice(null);
        }
        toast.success("Invoice permanently deleted");
      }
    } else {
      const invoiceToTrash = invoices.find((inv) => inv.id === invoiceId);
      if (invoiceToTrash) {
        setTrashedInvoices([invoiceToTrash, ...trashedInvoices]);
        setInvoices(invoices.filter((inv) => inv.id !== invoiceId));
        if (selectedInvoice?.id === invoiceId) {
          setSelectedInvoice(null);
        }
        toast.success("Invoice moved to trash");
        
        try {
          await fetch(`/api/invoices/${invoiceId}`, { method: "DELETE" });
        } catch (e) {
          console.error("Failed to delete invoice from server:", e);
        }
      }
    }
  };

  const handleRestoreInvoice = async (invoice: Invoice) => {
    setTrashedInvoices(trashedInvoices.filter((inv) => inv.id !== invoice.id));
    setInvoices([invoice, ...invoices]);
    if (selectedInvoice?.id === invoice.id) {
      setSelectedInvoice(invoice);
    }
    toast.success("Invoice restored");
    
    try {
      const cu = JSON.parse(localStorage.getItem("akmal-current-user") || "{}");
      await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_no: invoice.id,
          project_name: invoice.projectName || "",
          client_name: invoice.clientName || "",
          date: invoice.date,
          due_date: invoice.dueDate,
          items: invoice.items || [],
          subtotal: invoice.subtotal || 0,
          gst_percentage: invoice.gstPercentage || 18,
          gst_amount: invoice.gstAmount || 0,
          total: invoice.total || 0,
          status: invoice.status || "draft",
          notes: invoice.notes || "",
          user_id: cu.id,
          work_done_detail: invoice.workDoneDetail || ""
        }),
      });
    } catch (e) {
      console.error("Failed to restore invoice to server:", e);
    }
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
          <Button 
            onClick={handleCreateDirectInvoice}
            className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Invoices List */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="glass lg:sticky lg:top-8">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Invoices</h2>
                  <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                    <button
                      onClick={() => { setShowTrash(false); setSelectedInvoice(null); }}
                      className={`px-2 py-1 rounded-md transition-colors ${!showTrash ? "bg-white text-indigo-600 shadow-sm font-medium" : "text-slate-600 hover:text-slate-950"}`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => { setShowTrash(true); setSelectedInvoice(null); }}
                      className={`px-2 py-1 rounded-md transition-colors ${showTrash ? "bg-white text-red-600 shadow-sm font-medium" : "text-slate-600 hover:text-slate-950"}`}
                    >
                      Trash ({trashedInvoices.length})
                    </button>
                  </div>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {(() => {
                    const list = showTrash ? trashedInvoices : invoices;
                    if (list.length === 0) {
                      return <p className="text-sm text-slate-500">No {showTrash ? "trashed" : ""} invoices yet</p>;
                    }
                    return list.map((invoice) => (
                      <button
                        key={invoice.id}
                        onClick={() => setSelectedInvoice(invoice)}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          selectedInvoice?.id === invoice.id
                            ? showTrash
                              ? "bg-red-50 border-2 border-red-500"
                              : "bg-indigo-100 border-2 border-indigo-500"
                            : "bg-white border border-slate-200 hover:border-indigo-300"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 text-sm">{invoice.id}</p>
                            <p className="text-xs text-slate-600 truncate">
                              {invoice.clientName}
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
                    ));
                  })()}
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
                    <div className="flex items-start justify-between mb-6 gap-4">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-slate-900 mb-1">
                          {selectedInvoice.title || selectedInvoice.id}
                        </h2>
                        <p className="text-sm text-slate-500">{selectedInvoice.id}</p>
                      </div>
                      <div className="w-48 text-right">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Invoice Date</label>
                        <Input
                          type="date"
                          value={selectedInvoice.date ? selectedInvoice.date.split("T")[0] : ""}
                          onChange={(e) => handleUpdateInvoiceField(selectedInvoice.id, "date", e.target.value)}
                          className="h-9 glass-sm text-right font-medium"
                          disabled={showTrash}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Client Name</label>
                        <Input
                          value={selectedInvoice.clientName || ""}
                          onChange={(e) => handleUpdateInvoiceField(selectedInvoice.id, "clientName", e.target.value)}
                          className="h-9 glass-sm font-medium"
                          disabled={showTrash}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Due Date</label>
                        <Input
                          type="date"
                          value={selectedInvoice.dueDate ? selectedInvoice.dueDate.split("T")[0] : ""}
                          onChange={(e) => handleUpdateInvoiceField(selectedInvoice.id, "dueDate", e.target.value)}
                          className="h-9 glass-sm font-medium"
                          disabled={showTrash}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {showTrash ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                            onClick={() => handleRestoreInvoice(selectedInvoice)}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Restore
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteInvoice(selectedInvoice.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Permanently
                          </Button>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
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
                                  <div>
                                    <label className="text-xs font-semibold text-slate-600">Item Name</label>
                                    <Input
                                      type="text"
                                      value={item.name}
                                      onChange={(e) =>
                                        handleEditItem(
                                          selectedInvoice.id,
                                          item.id,
                                          item.quantity,
                                          item.unitPrice,
                                          item.billingType,
                                          item.description,
                                          item.hsn,
                                          item.discount,
                                          item.cess,
                                          e.target.value
                                        )
                                      }
                                      className="h-9 glass-sm font-medium"
                                    />
                                  </div>
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
                {/* Notes */}
                <Card className="glass">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Invoice Notes</h3>
                    <Input
                      placeholder="Add terms, bank details, or additional notes..."
                      value={selectedInvoice.notes || ""}
                      onChange={(e) => handleUpdateInvoiceField(selectedInvoice.id, "notes", e.target.value)}
                      className="glass-sm font-medium"
                      disabled={showTrash}
                    />
                  </div>
                </Card>

                {/* Work Done in Detail */}
                <Card className="glass">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Work Done in Detail</h3>
                    <div className="text-xs text-slate-500 mb-2">
                      Supports rich text (bold, lists) and copy-pasting images directly.
                    </div>
                    <div
                      contentEditable={!showTrash}
                      suppressContentEditableWarning={true}
                      onBlur={(e) => handleUpdateInvoiceField(selectedInvoice.id, "workDoneDetail", e.currentTarget.innerHTML)}
                      dangerouslySetInnerHTML={{ __html: selectedInvoice.workDoneDetail || "" }}
                      className="min-h-[150px] p-3 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 overflow-y-auto rich-text-editor"
                      style={{ outline: 'none' }}
                    />
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
                    
                    {/* UPI QR Code */}
                    {(() => {
                      const upiId = "8866795230@apl";
                      const outstanding = selectedInvoice ? getOutstandingAmount(selectedInvoice) : 0;
                      const upiLink = `upi://pay?pa=${upiId}&pn=Akmal&am=${outstanding.toFixed(2)}&tn=Payment for ${selectedInvoice?.id || 'Invoice'}&cu=INR`;
                      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=10&data=${encodeURIComponent(upiLink)}`;
                      return (
                        <div className="mt-4 p-4 bg-white/60 rounded-xl border border-green-200 text-center">
                          <p className="text-sm font-medium text-slate-700 mb-2">Scan to Pay via UPI</p>
                          <img src={qrUrl} alt="UPI QR" className="w-40 h-40 mx-auto mb-3 rounded-xl" />
                          <p className="text-xs text-slate-500 mb-1">{upiId}</p>
                          {selectedInvoice && (
                            <p className="text-sm font-semibold text-slate-700 mb-2">Amount: ₹{outstanding.toLocaleString('en-IN')}</p>
                          )}
                          <a href={upiLink} className="inline-block w-full">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white w-full">
                              💳 Pay Now via UPI
                            </Button>
                          </a>
                          <p className="text-xs text-slate-400 mt-2">GPay / PhonePe / Paytm / BHIM</p>
                        </div>
                      );
                    })()}
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

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/30 md:hidden">
        <div className="flex items-center justify-around py-2 px-1">
          <button onClick={() => setLocation("/dashboard")} className="flex flex-col items-center gap-0.5 text-slate-600 p-2 rounded-lg active:bg-slate-50">
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[10px] font-medium">Projects</span>
          </button>
          <button onClick={() => setLocation("/items")} className="flex flex-col items-center gap-0.5 text-slate-600 p-2 rounded-lg active:bg-slate-50">
            <Package className="w-5 h-5" />
            <span className="text-[10px] font-medium">Items</span>
          </button>
          <button onClick={() => setLocation("/clients")} className="flex flex-col items-center gap-0.5 text-slate-600 p-2 rounded-lg active:bg-slate-50">
            <UserRound className="w-5 h-5" />
            <span className="text-[10px] font-medium">Clients</span>
          </button>
          <button onClick={() => setLocation("/services")} className="flex flex-col items-center gap-0.5 text-indigo-600 p-2 rounded-lg active:bg-indigo-50">
            <Receipt className="w-5 h-5" />
            <span className="text-[10px] font-medium">Billing</span>
          </button>
        </div>
      </nav>
      <div className="h-14 md:hidden" />
    </div>
  );
}
