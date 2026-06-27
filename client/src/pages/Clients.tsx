import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, Mail, Phone, Building2, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gstin: string;
  pan: string;
  placeOfSupply: string;
  userId: string;
}

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  gstin: "",
  pan: "",
  placeOfSupply: "Gujarat",
};

export default function Clients() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem("akmal-clients");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showDialog, setShowDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    localStorage.setItem("akmal-clients", JSON.stringify(clients));
  }, [clients]);

  // Sync with PostgreSQL API
  useEffect(() => {
    const syncWithDB = async () => {
      try {
        const apiClients = await (await fetch(`/api/clients${user?.id ? `?user_id=${user.id}` : ''}`)).json();
        if (Array.isArray(apiClients) && apiClients.length > 0) {
          const localClients = JSON.parse(localStorage.getItem("akmal-clients") || "[]");
          let changed = false;
          apiClients.forEach((ac: any) => {
            if (!localClients.find((lc: any) => lc.name?.toLowerCase() === ac.name?.toLowerCase())) {
              localClients.push({ id: String(ac.id), name: ac.name, email: ac.email || "", phone: ac.phone || "", address: ac.address || "", gstin: ac.gstin || "", pan: ac.pan || "", placeOfSupply: ac.place_of_supply || "Gujarat", userId: user?.id || "" });
              changed = true;
            }
          });
          if (changed) { localStorage.setItem("akmal-clients", JSON.stringify(localClients)); setClients(localClients); }
        }
      } catch {}
    };
    syncWithDB();
  }, [user?.id]);

  // Auto-add clients from project creation
  useEffect(() => {
    try {
      const projects = JSON.parse(localStorage.getItem("akmal-projects") || "[]");
      const currentClients = JSON.parse(localStorage.getItem("akmal-clients") || "[]");
      let changed = false;

      projects.forEach((p: any) => {
        if (p.clientName && p.clientName.trim()) {
          const exists = currentClients.some(
            (c: Client) => c.name.toLowerCase() === p.clientName.trim().toLowerCase()
          );
          if (!exists) {
            currentClients.push({
              id: String(Date.now() + Math.random()),
              name: p.clientName.trim(),
              email: p.clientEmail || "",
              phone: p.clientPhone || "",
              address: "",
              gstin: "",
              pan: "",
              placeOfSupply: "Gujarat",
              userId: user?.id || "",
            });
            changed = true;
          }
        }
      });

      if (changed) {
        localStorage.setItem("akmal-clients", JSON.stringify(currentClients));
        setClients(currentClients);
      }
    } catch {}
  }, []);

  // Auto-add clients from invoice creation
  useEffect(() => {
    try {
      const invoices = JSON.parse(localStorage.getItem("akmal-invoices") || "[]");
      const currentClients = JSON.parse(localStorage.getItem("akmal-clients") || "[]");
      let changed = false;

      invoices.forEach((inv: any) => {
        if (inv.clientName && inv.clientName.trim()) {
          const exists = currentClients.some(
            (c: Client) => c.name.toLowerCase() === inv.clientName.trim().toLowerCase()
          );
          if (!exists) {
            currentClients.push({
              id: String(Date.now() + Math.random()),
              name: inv.clientName.trim(),
              email: inv.clientEmail || "",
              phone: inv.clientPhone || "",
              address: inv.clientAddress || "",
              gstin: inv.clientGstin || "",
              pan: "",
              placeOfSupply: "Gujarat",
              userId: user?.id || "",
            });
            changed = true;
          }
        }
      });

      if (changed) {
        localStorage.setItem("akmal-clients", JSON.stringify(currentClients));
        setClients(currentClients);
      }
    } catch {}
  }, []);

  const getProjectCount = (clientName: string) => {
    try {
      const projects = JSON.parse(localStorage.getItem("akmal-projects") || "[]");
      return projects.filter(
        (p: any) => p.clientName?.toLowerCase() === clientName.toLowerCase()
      ).length;
    } catch {
      return 0;
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingClient(null);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setForm({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      gstin: client.gstin,
      pan: client.pan,
      placeOfSupply: client.placeOfSupply,
    });
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Client name is required");
      return;
    }

    if (editingClient) {
      const updated = clients.map((c) =>
        c.id === editingClient.id
          ? {
              ...c,
              name: form.name.trim(),
              email: form.email.trim(),
              phone: form.phone.trim(),
              address: form.address.trim(),
              gstin: form.gstin.trim(),
              pan: form.pan.trim(),
              placeOfSupply: form.placeOfSupply.trim() || "Gujarat",
            }
          : c
      );
      setClients(updated);
      toast.success("Client updated");
      // Sync to API
      try { 
        fetch(`/api/clients/${editingClient.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), address: form.address.trim(), gstin: form.gstin.trim(), pan: form.pan.trim(), place_of_supply: form.placeOfSupply.trim() || "Gujarat" }),
        });
      } catch {}
    } else {
      const exists = clients.some(
        (c) => c.name.toLowerCase() === form.name.trim().toLowerCase()
      );
      if (exists) {
        toast.error("A client with this name already exists");
        return;
      }
      const newClient: Client = {
        id: String(Date.now()),
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        gstin: form.gstin.trim(),
        pan: form.pan.trim(),
        placeOfSupply: form.placeOfSupply.trim() || "Gujarat",
        userId: user?.id || "",
      };
      setClients([...clients, newClient]);
      toast.success("Client added");
      // Sync to API
      try {
        fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), address: form.address.trim(), gstin: form.gstin.trim(), pan: form.pan.trim(), place_of_supply: form.placeOfSupply.trim() || "Gujarat", user_id: user?.id }),
        });
      } catch {}
    }
    resetForm();
    setShowDialog(false);
  };

  const handleDelete = (id: string) => {
    setClients(clients.filter((c) => c.id !== id));
    toast.success("Client removed");
    // Sync to API
    try { fetch(`/api/clients/${id}`, { method: "DELETE" }); } catch {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/20 to-white">
      <header className="sticky top-0 z-40 glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation("/dashboard")}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
              <p className="text-sm text-slate-600">Manage your clients</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-600" />
            <span className="text-sm text-slate-600">
              {clients.length} client{clients.length !== 1 ? "s" : ""}
            </span>
          </div>
          <Dialog
            open={showDialog}
            onOpenChange={(o) => {
              setShowDialog(o);
              if (!o) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg">
                <Plus className="w-4 h-4 mr-2" /> Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="glass sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? "Edit Client" : "Add Client"}
                </DialogTitle>
                <DialogDescription>
                  Add a new client to your business directory.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Name *</Label>
                  <Input
                    id="clientName"
                    placeholder="Client or company name"
                    className="glass-sm"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    placeholder="client@example.com"
                    className="glass-sm"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Phone</Label>
                  <Input
                    id="clientPhone"
                    placeholder="+91 98765 43210"
                    className="glass-sm"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientAddress">Address</Label>
                  <Input
                    id="clientAddress"
                    placeholder="Full address"
                    className="glass-sm"
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="clientGstin">GSTIN</Label>
                    <Input
                      id="clientGstin"
                      placeholder="22AAAAA0000A1Z5"
                      className="glass-sm"
                      value={form.gstin}
                      onChange={(e) =>
                        setForm({ ...form, gstin: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientPan">PAN</Label>
                    <Input
                      id="clientPan"
                      placeholder="AAAAA0000A"
                      className="glass-sm"
                      value={form.pan}
                      onChange={(e) => setForm({ ...form, pan: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPlace">Place of Supply</Label>
                  <Input
                    id="clientPlace"
                    placeholder="Gujarat"
                    className="glass-sm"
                    value={form.placeOfSupply}
                    onChange={(e) =>
                      setForm({ ...form, placeOfSupply: e.target.value })
                    }
                  />
                </div>
                <Button
                  onClick={handleSave}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white"
                >
                  {editingClient ? "Update Client" : "Add Client"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Building2 className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium text-slate-500">No clients yet</p>
            <p className="text-sm mt-1">
              Add a client to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <Card key={client.id} className="glass rounded-2xl p-6 hover-lift">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {client.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {client.name}
                      </h3>
                      {client.gstin && (
                        <p className="text-xs text-slate-500 truncate">
                          GSTIN: {client.gstin}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-500 hover:text-indigo-600"
                      onClick={() => openEdit(client)}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-500 hover:text-red-600"
                      onClick={() => handleDelete(client.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4 space-y-1">
                  {client.email && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {client.email}
                    </p>
                  )}
                  {client.phone && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {client.phone}
                    </p>
                  )}
                  {client.address && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {client.address}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    {getProjectCount(client.name)} project
                    {getProjectCount(client.name) !== 1 ? "s" : ""}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
