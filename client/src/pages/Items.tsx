import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Trash2, Search, Camera, Settings, Package, Image as ImageIcon, Hash, Bell, FileText, DollarSign, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface Item {
  id: string;
  name: string;
  itemType: "Product" | "Service";
  unit: string;
  salesPrice: number;
  salesPriceTax: "With Tax" | "Without Tax";
  purchasePrice: number;
  purchasePriceTax: "With Tax" | "Without Tax";
  gst: number;
  hsnOrSac: string;
  discount: number;
  openingStock: number;
  asOfDate: string;
  itemCode: string;
  barcode: string;
  lowStockAlert: boolean;
  category: string;
  description: string;
  showInStore: boolean;
  image: string;
  customFields: { label: string; value: string }[];
  partyWisePrices: { clientId: string; clientName: string; price: number }[];
}

const CATEGORIES = ["No Category", "Visiting Card", "Stickers Job", "Brochures", "Flyers", "Banners", "Wedding Cards", "Gift Items"];

const GST_OPTIONS = ["None", "0%", "5%", "12%", "18%", "28%"];

export default function ItemsPage() {
  const [, setLocation] = useLocation();
  const [items, setItems] = useState<Item[]>(() => {
    try {
      const saved = localStorage.getItem("akmal-items");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [activeTab, setActiveTab] = useState("pricing");
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("akmal-item-categories");
      return saved ? JSON.parse(saved) : CATEGORIES;
    } catch { return CATEGORIES; }
  });
  const [newCategory, setNewCategory] = useState("");
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [selectedParty, setSelectedParty] = useState("");
  const [partyPrice, setPartyPrice] = useState("");

  const [form, setForm] = useState({
    name: "",
    itemType: "Product" as "Product" | "Service",
    unit: "PCS",
    salesPrice: "",
    salesPriceTax: "Without Tax" as "With Tax" | "Without Tax",
    purchasePrice: "",
    purchasePriceTax: "Without Tax" as "With Tax" | "Without Tax",
    gst: "None",
    hsnOrSac: "",
    discount: "",
    openingStock: "",
    asOfDate: "",
    itemCode: "",
    barcode: "",
    lowStockAlert: false,
    category: "No Category",
    description: "",
    showInStore: true,
    image: "",
    customFields: [] as { label: string; value: string }[],
    partyWisePrices: [] as { clientId: string; clientName: string; price: number }[],
  });

  useEffect(() => {
    localStorage.setItem("akmal-items", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("akmal-item-categories", JSON.stringify(categories));
  }, [categories]);

  // One-time sync localStorage items to API
  useEffect(() => {
    const sync = async () => {
      const cu = JSON.parse(localStorage.getItem("akmal-current-user") || "{}");
      if (!cu?.id) return;
      try {
        const apiItems = await (await fetch(`/api/items?user_id=${cu.id}`)).json();
        const localItems = JSON.parse(localStorage.getItem("akmal-items") || "[]");
        for (const item of localItems) {
          try {
            const exists = Array.isArray(apiItems) && apiItems.find((ai: any) => ai.name?.toLowerCase() === item.name?.toLowerCase());
            if (!exists) {
              await fetch("/api/items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: item.name, item_type: item.itemType, unit: item.unit, sales_price: item.salesPrice, purchase_price: item.purchasePrice || 0, gst: item.gst || 0, hsn_or_sac: item.hsnOrSac || "", discount: item.discount || 0, opening_stock: item.openingStock || 0, item_code: item.itemCode || "", barcode: item.barcode || "", category: item.category || "No Category", description: item.description || "", show_in_store: item.showInStore !== false, image: item.image || "", custom_fields: item.customFields || [], user_id: cu.id }),
              });
            }
          } catch {}
        }
      } catch {}
    };
    sync();
  }, []);

  useEffect(() => {
    if (showAddDialog) {
      try {
        const saved = localStorage.getItem("akmal-clients");
        if (saved) setClients(JSON.parse(saved));
      } catch { /* ignore */ }
    }
  }, [showAddDialog]);

  const resetForm = () => {
    setForm({
      name: "", itemType: "Product", unit: "PCS", salesPrice: "", salesPriceTax: "Without Tax",
      purchasePrice: "", purchasePriceTax: "Without Tax", gst: "None", hsnOrSac: "",
      discount: "", openingStock: "", asOfDate: "", itemCode: "", barcode: "",
      lowStockAlert: false, category: "No Category", description: "", showInStore: true,
      image: "", customFields: [], partyWisePrices: [],
    });
    setEditingItem(null);
    setActiveTab("pricing");
    setSelectedParty("");
    setPartyPrice("");
  };

  const openEdit = (item: Item) => {
    setEditingItem(item);
    setForm({
      name: item.name, itemType: item.itemType, unit: item.unit,
      salesPrice: String(item.salesPrice || ""), salesPriceTax: item.salesPriceTax,
      purchasePrice: String(item.purchasePrice || ""), purchasePriceTax: item.purchasePriceTax,
      gst: item.gst ? `${item.gst}%` : "None", hsnOrSac: item.hsnOrSac,
      discount: String(item.discount || ""), openingStock: String(item.openingStock || ""),
      asOfDate: item.asOfDate, itemCode: item.itemCode, barcode: item.barcode,
      lowStockAlert: item.lowStockAlert, category: item.category, description: item.description,
      showInStore: item.showInStore, image: item.image, customFields: item.customFields || [], partyWisePrices: item.partyWisePrices || [],
    });
    setShowAddDialog(true);
  };

  const generateBarcode = () => {
    const code = String(Date.now()).slice(-12);
    setForm({ ...form, barcode: code });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm({ ...form, image: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (saveAndNew = false) => {
    if (!form.name.trim()) {
      toast.error("Item name is required");
      return;
    }

    const gstValue = form.gst === "None" ? 0 : parseInt(form.gst.replace("%", ""));

    if (editingItem) {
      setItems(items.map(item => item.id === editingItem.id ? {
        ...item, ...form, name: form.name.trim(), gst: gstValue,
        salesPrice: Number(form.salesPrice) || 0,
        purchasePrice: Number(form.purchasePrice) || 0,
        discount: Number(form.discount) || 0,
        openingStock: Number(form.openingStock) || 0,
      } : item));
      toast.success("Item updated");
    } else {
      const newItem: Item = {
        id: String(Date.now()),
        name: form.name.trim(),
        itemType: form.itemType,
        unit: form.unit,
        salesPrice: Number(form.salesPrice) || 0,
        salesPriceTax: form.salesPriceTax,
        purchasePrice: Number(form.purchasePrice) || 0,
        purchasePriceTax: form.purchasePriceTax,
        gst: gstValue,
        hsnOrSac: form.hsnOrSac,
        discount: Number(form.discount) || 0,
        openingStock: Number(form.openingStock) || 0,
        asOfDate: form.asOfDate,
        itemCode: form.itemCode,
        barcode: form.barcode,
        lowStockAlert: form.lowStockAlert,
        category: form.category,
        description: form.description,
        showInStore: form.showInStore,
        image: form.image,
        customFields: form.customFields,
        partyWisePrices: form.partyWisePrices,
      };
      setItems([newItem, ...items]);
      toast.success("Item saved");
      // Sync to API
      try {
        const cu = JSON.parse(localStorage.getItem("akmal-current-user") || "{}");
        fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newItem.name, item_type: newItem.itemType, unit: newItem.unit, sales_price: newItem.salesPrice, purchase_price: newItem.purchasePrice, gst: newItem.gst, hsn_or_sac: newItem.hsnOrSac, discount: newItem.discount, opening_stock: newItem.openingStock, item_code: newItem.itemCode, barcode: newItem.barcode, category: newItem.category, description: newItem.description, show_in_store: newItem.showInStore, image: newItem.image, custom_fields: newItem.customFields, user_id: cu?.id || null }),
        });
      } catch {}
    }

    if (saveAndNew) {
      resetForm();
    } else {
      setShowAddDialog(false);
      resetForm();
    }
  };

  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    toast.success("Item deleted");
    try { fetch(`/api/items/${id}`, { method: "DELETE" }); } catch {}
  };

  const formatPrice = (n: number) => n ? `₹${n.toLocaleString('en-IN')}` : "-";

  const addPartyPrice = () => {
    const client = clients.find(c => c.id === selectedParty);
    if (!client || !partyPrice) { toast.error("Select a party and enter a price"); return; }
    if (form.partyWisePrices.some(pp => pp.clientId === selectedParty)) { toast.error("Party already added"); return; }
    setForm({ ...form, partyWisePrices: [...form.partyWisePrices, { clientId: client.id, clientName: client.name, price: Number(partyPrice) }] });
    setSelectedParty(""); setPartyPrice("");
    toast.success("Party-wise price added");
  };

  const removePartyPrice = (idx: number) => {
    setForm({ ...form, partyWisePrices: form.partyWisePrices.filter((_, i) => i !== idx) });
    toast.success("Removed");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/20 to-white">
      <header className="sticky top-0 z-40 glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setLocation("/dashboard")} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Items / Products</h1>
              <p className="text-sm text-slate-600">Manage your inventory</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-slate-600" />
            <span className="text-sm text-slate-600">{items.length} items</span>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={() => setShowCategoryDialog(true)} className="flex-1 sm:flex-none justify-center">
              <Settings className="w-4 h-4 mr-1" /> Categories
            </Button>
            <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex-1 sm:flex-none justify-center">
              <Plus className="w-4 h-4 mr-2" /> New Item
            </Button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Package className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium text-slate-500">No items yet</p>
            <p className="text-sm mt-1">Create your first product or service.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {items.map(item => (
              <Card key={item.id} className="glass rounded-2xl p-4 sm:p-5 hover-lift">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {item.image ? (
                      <img src={item.image} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                        {item.itemType === "Product" ? <Package className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" /> : <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 text-sm truncate">{item.name}</h3>
                      <p className="text-xs text-slate-500 truncate">{item.category} • {item.itemType}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 shrink-0" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1 text-xs text-slate-600">
                  <p>Sales: {formatPrice(item.salesPrice)} {item.salesPriceTax === "With Tax" ? "(incl. tax)" : ""}</p>
                  {item.itemType === "Product" && (
                    <>
                      <p>Stock: {item.openingStock} {item.unit}</p>
                      {item.lowStockAlert && <p className="text-orange-500 flex items-center gap-1"><Bell className="w-3 h-3" /> Low stock alert</p>}
                    </>
                  )}
                  {item.discount > 0 && <p className="text-green-600">Discount: {item.discount}%</p>}
                </div>
                <Button size="sm" variant="outline" className="w-full mt-3 h-9" onClick={() => openEdit(item)}>
                  <FileText className="w-3 h-3 mr-1" /> Edit
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(o) => { setShowAddDialog(o); if (!o) resetForm(); }}>
        <DialogContent className="glass w-[calc(100vw-1rem)] sm:w-full sm:max-w-xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg sm:text-xl">{editingItem ? "Edit Item" : "Create New Item"}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">Fill in the details for your product or service.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="itemName" className="text-sm">Item Name *</Label>
              <Input id="itemName" placeholder="Ex: Kissan Fruit Jam 500 gm" className="glass-sm h-10" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Item Type</Label>
              <div className="flex gap-2">
                {(["Product", "Service"] as const).map(type => (
                  <button key={type} onClick={() => setForm({ ...form, itemType: type, openingStock: "", barcode: "", itemCode: "", lowStockAlert: false })}
                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-full text-sm font-medium border-2 transition-all ${form.itemType === type ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full h-auto flex-wrap sm:flex-nowrap justify-start gap-1 bg-slate-100/50 p-1">
                <TabsTrigger value="pricing" className="text-xs sm:text-sm flex-1 sm:flex-none">Pricing</TabsTrigger>
                {form.itemType === "Product" && <TabsTrigger value="stock" className="text-xs sm:text-sm flex-1 sm:flex-none">Stock</TabsTrigger>}
                <TabsTrigger value="other" className="text-xs sm:text-sm flex-1 sm:flex-none">Other</TabsTrigger>
                <TabsTrigger value="partywise" className="text-xs sm:text-sm flex-1 sm:flex-none">Party Wise</TabsTrigger>
              </TabsList>

              {/* Pricing Tab */}
              <TabsContent value="pricing" className="space-y-3 sm:space-y-4 mt-2">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm">Unit</Label>
                  <Input placeholder="PCS" className="glass-sm h-10" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm">Sales Price</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input type="number" placeholder="0" className="glass-sm flex-1 h-10" value={form.salesPrice} onChange={(e) => setForm({ ...form, salesPrice: e.target.value })} />
                    <Select value={form.salesPriceTax} onValueChange={(v) => setForm({ ...form, salesPriceTax: v as any })}>
                      <SelectTrigger className="w-full sm:w-36 glass-sm h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Without Tax">Without Tax</SelectItem>
                        <SelectItem value="With Tax">With Tax</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {form.itemType === "Product" && (
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-sm">Purchase Price</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input type="number" placeholder="0" className="glass-sm flex-1 h-10" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} />
                      <Select value={form.purchasePriceTax} onValueChange={(v) => setForm({ ...form, purchasePriceTax: v as any })}>
                        <SelectTrigger className="w-full sm:w-36 glass-sm h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Without Tax">Without Tax</SelectItem>
                          <SelectItem value="With Tax">With Tax</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm">GST</Label>
                  <Select value={form.gst} onValueChange={(v) => setForm({ ...form, gst: v })}>
                    <SelectTrigger className="glass-sm h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GST_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm">{form.itemType === "Product" ? "HSN" : "SAC"}</Label>
                  <Input placeholder="Ex: 6704" className="glass-sm h-10" value={form.hsnOrSac} onChange={(e) => setForm({ ...form, hsnOrSac: e.target.value })} />
                </div>
                {form.itemType === "Product" && (
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-sm">Discount on Sales Price %</Label>
                    <div className="relative">
                      <Input type="number" placeholder="10%" className="glass-sm pr-8 h-10" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Stock Tab */}
              <TabsContent value="stock" className="space-y-3 sm:space-y-4 mt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-sm">Opening Stock</Label>
                    <div className="flex items-center gap-1">
                      <Input type="number" placeholder="35" className="glass-sm flex-1 h-10" value={form.openingStock} onChange={(e) => setForm({ ...form, openingStock: e.target.value })} />
                      <span className="text-sm text-slate-500 whitespace-nowrap">/{form.unit || "PCS"}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-sm">As of Date</Label>
                    <Input type="date" className="glass-sm h-10" value={form.asOfDate} onChange={(e) => setForm({ ...form, asOfDate: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm">Item Code</Label>
                  <Input placeholder="Ex: 1189993849345" className="glass-sm h-10" value={form.itemCode} onChange={(e) => setForm({ ...form, itemCode: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <Button variant="outline" onClick={generateBarcode} className="gap-2 h-10"><Hash className="w-4 h-4" /> Generate Barcode</Button>
                  <Button variant="outline" onClick={() => toast.info("Barcode scanner coming soon")} className="gap-2 h-10">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h2v4m-4-4h8m-4 0v-6m0 0V4m0 4h4" /></svg>
                    Scan Barcode
                  </Button>
                </div>
                {form.barcode && <p className="text-xs text-slate-500">Barcode: <span className="font-mono">{form.barcode}</span></p>}
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-slate-500" />
                    <Label className="text-sm">Low stock alert</Label>
                  </div>
                  <Switch checked={form.lowStockAlert} onCheckedChange={(v) => setForm({ ...form, lowStockAlert: v })} />
                </div>
              </TabsContent>

              {/* Other Tab */}
              <TabsContent value="other" className="space-y-3 sm:space-y-4 mt-2">
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Add Image</label>
                  <label className="block border-2 border-dashed border-slate-200 rounded-xl p-6 sm:p-8 text-center cursor-pointer hover:border-indigo-300 transition-colors">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    {form.image ? (
                      <img src={form.image} alt="" className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-lg object-cover" />
                    ) : (
                      <>
                        <Camera className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-slate-400 mb-2" />
                        <p className="text-xs sm:text-sm text-slate-500">Add Image</p>
                      </>
                    )}
                  </label>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm">Item Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger className="glass-sm h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm">Custom Fields</Label>
                  {form.customFields.map((field, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-2 mb-2">
                      <Input placeholder="Label" className="glass-sm flex-1 h-10" value={field.label} onChange={(e) => {
                        const newFields = [...form.customFields]; newFields[idx] = { ...field, label: e.target.value }; setForm({ ...form, customFields: newFields });
                      }} />
                      <Input placeholder="Value" className="glass-sm flex-1 h-10" value={field.value} onChange={(e) => {
                        const newFields = [...form.customFields]; newFields[idx] = { ...field, value: e.target.value }; setForm({ ...form, customFields: newFields });
                      }} />
                      <Button size="sm" variant="ghost" className="text-red-500 h-10 w-full sm:w-auto" onClick={() => {
                        setForm({ ...form, customFields: form.customFields.filter((_, i) => i !== idx) });
                      }}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" className="w-full sm:w-auto h-10" onClick={() => setForm({ ...form, customFields: [...form.customFields, { label: "", value: "" }] })}>
                    <Plus className="w-3 h-3 mr-1" /> Add Fields to Item
                  </Button>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm">Item Description</Label>
                  <Textarea placeholder="Ex: 100% Real Mixed Fruit Jam" className="glass-sm min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="flex items-center gap-2 py-1">
                  <Checkbox checked={form.showInStore} onCheckedChange={(v) => setForm({ ...form, showInStore: v as boolean })} />
                  <Label className="text-sm">Show in Online Store</Label>
                </div>
              </TabsContent>

              {/* Party Wise Prices Tab */}
              <TabsContent value="partywise" className="space-y-3 sm:space-y-4 mt-2">
                {!editingItem ? (
                  <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-slate-400">
                    <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 mb-3 opacity-20" />
                    <p className="text-xs sm:text-sm text-center max-w-xs px-4">
                      To enable Party Wise Prices and set custom prices for parties, please save the item first.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                      <div className="flex-1 space-y-1.5 sm:space-y-2">
                        <Label className="text-sm">Select Party</Label>
                        <Select value={selectedParty} onValueChange={setSelectedParty}>
                          <SelectTrigger className="glass-sm h-10"><SelectValue placeholder="Select a party" /></SelectTrigger>
                          <SelectContent>
                            {clients.length === 0 && <SelectItem value="-" disabled>No parties available</SelectItem>}
                            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-full sm:w-28 space-y-1.5 sm:space-y-2">
                        <Label className="text-sm">Price (₹)</Label>
                        <Input type="number" placeholder="0" className="glass-sm h-10" value={partyPrice} onChange={(e) => setPartyPrice(e.target.value)} />
                      </div>
                      <Button type="button" variant="outline" className="h-10 w-full sm:w-auto" onClick={addPartyPrice}><Plus className="w-4 h-4" /></Button>
                    </div>

                    {form.partyWisePrices.length === 0 ? (
                      <p className="text-xs sm:text-sm text-slate-400 text-center py-4">No custom prices set yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {form.partyWisePrices.map((pp, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2.5 sm:p-3 bg-slate-50 rounded-lg">
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{pp.clientName}</p>
                              <p className="text-xs text-slate-500">₹{pp.price.toLocaleString("en-IN")}</p>
                            </div>
                            <Button size="sm" variant="ghost" className="text-red-500 shrink-0" onClick={() => removePartyPrice(idx)}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-0 pt-4 border-t border-slate-200">
              <Button variant="ghost" className="w-full sm:w-auto h-11" onClick={() => handleSave(true)}>
                Save & New
              </Button>
              <Button onClick={() => handleSave(false)} className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-8 w-full sm:w-auto h-11">
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="glass w-[calc(100vw-1rem)] sm:w-full sm:max-w-md p-4 sm:p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg sm:text-xl">Select Item Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <Button variant="outline" className="w-full justify-center gap-2 h-10" onClick={() => { if (newCategory.trim()) { setCategories([...categories, newCategory.trim()]); setNewCategory(""); toast.success("Category added"); } }}>
              <Plus className="w-4 h-4" /> Add Category
            </Button>
            <Input placeholder="New category name" className="glass-sm h-10" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => e.key === "Enter" && document.querySelector<HTMLButtonElement>('[data-add-cat]')?.click()} />
            <div className="divide-y">
              {categories.map((cat, idx) => (
                <div key={cat} className="flex items-center justify-between py-2.5 sm:py-3 px-1">
                  <label className="flex items-center gap-2 cursor-pointer text-sm min-w-0">
                    <input type="radio" name="cat" className="w-4 h-4 accent-indigo-600 shrink-0" checked={form.category === cat} onChange={() => setForm({ ...form, category: cat })} />
                    <span className="truncate">{cat}</span>
                  </label>
                  {idx > 2 && (
                    <Button size="sm" variant="ghost" className="text-red-500 shrink-0" onClick={() => {
                      if (form.category === cat) setForm({ ...form, category: "No Category" });
                      setCategories(categories.filter((_, i) => i !== idx));
                    }}><Trash2 className="w-3 h-3" /></Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
