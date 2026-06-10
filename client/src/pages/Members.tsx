import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Mail, User, Briefcase, Users, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

const defaultRoles = ["Lead Developer", "UI/UX Designer", "Developer", "SEO Analyst", "Content Writer", "Project Manager", "QA Tester", "Marketing"];

export default function Members() {
  const [, setLocation] = useLocation();
  const { user, isAdmin } = useAuth();
  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const saved = localStorage.getItem("akmal-members");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("akmal-members", JSON.stringify(members));
  }, [members]);

  // Admin sees all, others see themselves + admin
  const ADMIN_EMAIL = "hanzalaq63@gmail.com";
  const visibleMembers = isAdmin
    ? members
    : members.filter((m: Member) =>
        m.email?.toLowerCase() === user?.email?.toLowerCase() || m.email?.toLowerCase() === ADMIN_EMAIL
      );

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "" });
  const [customRole, setCustomRole] = useState("");

  const syncUsersToMembers = () => {
    try {
      const users = JSON.parse(localStorage.getItem("akmal-users") || "[]");
      const currentMembers = JSON.parse(localStorage.getItem("akmal-members") || "[]");
      let added = 0;
      users.forEach((u: any) => {
        if (!currentMembers.find((m: Member) => m.email?.toLowerCase() === u.email?.toLowerCase())) {
          currentMembers.push({
            id: String(Date.now() + Math.random()),
            name: u.name,
            email: u.email,
            role: "Team Member",
            avatar: u.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
          });
          added++;
        }
      });
      if (added > 0) {
        localStorage.setItem("akmal-members", JSON.stringify(currentMembers));
        setMembers(currentMembers);
        toast.success(`${added} new member(s) synced`);
      } else {
        toast.success("All users already in members list");
      }
    } catch (e) {
      toast.error("Sync failed");
    }
  };

  // Auto-sync on mount for admin
  useEffect(() => {
    if (isAdmin) {
      try {
        const users = JSON.parse(localStorage.getItem("akmal-users") || "[]");
        const currentMembers = JSON.parse(localStorage.getItem("akmal-members") || "[]");
        let changed = false;
        users.forEach((u: any) => {
          if (!currentMembers.find((m: Member) => m.email?.toLowerCase() === u.email?.toLowerCase())) {
            currentMembers.push({
              id: String(Date.now() + Math.random()),
              name: u.name,
              email: u.email,
              role: "Team Member",
              avatar: u.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
            });
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem("akmal-members", JSON.stringify(currentMembers));
          setMembers(currentMembers);
        }
      } catch {}
    }
  }, [isAdmin]);

  const getAvatar = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const resetForm = () => {
    setForm({ name: "", email: "", role: "" });
    setCustomRole("");
    setEditingMember(null);
  };

  const openEdit = (m: Member) => {
    setEditingMember(m);
    setForm({ name: m.name, email: m.email, role: m.role });
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim() || !form.role.trim()) {
      toast.error("All fields are required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      toast.error("Please enter a valid email");
      return;
    }

    if (editingMember) {
      const updated = members.map(m =>
        m.id === editingMember.id
          ? { ...m, name: form.name.trim(), email: form.email.trim(), role: form.role.trim() }
          : m
      );
      setMembers(updated);
      toast.success("Member updated");
    } else {
      const existing = members.find(m => m.email.toLowerCase() === form.email.trim().toLowerCase());
      if (existing) {
        toast.error("A member with this email already exists");
        return;
      }
      const newMember: Member = {
        id: String(Date.now()),
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role.trim(),
        avatar: getAvatar(form.name.trim()),
      };
      setMembers([...members, newMember]);
      toast.success("Member added");
    }
    resetForm();
    setShowAddDialog(false);
  };

  const handleDelete = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
    toast.success("Member removed");
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
              <h1 className="text-2xl font-bold text-slate-900">Team Members</h1>
              <p className="text-sm text-slate-600">Manage your team</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-600" />
            <span className="text-sm text-slate-600">{isAdmin ? members.length : visibleMembers.length} member{visibleMembers.length !== 1 ? "s" : ""}</span>
          </div>
          {isAdmin && (
            <Dialog open={showAddDialog} onOpenChange={(o) => { setShowAddDialog(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg">
                  <Plus className="w-4 h-4 mr-2" /> Add Member
                </Button>
              </DialogTrigger>
            <DialogContent className="glass sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingMember ? "Edit Member" : "Add Team Member"}</DialogTitle>
                <DialogDescription>Add members by email to assign them to projects.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="memName">Name *</Label>
                  <Input id="memName" placeholder="Full name" className="glass-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memEmail">Email *</Label>
                  <Input id="memEmail" type="email" placeholder="member@example.com" className="glass-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                    <SelectTrigger className="glass-sm">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {defaultRoles.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2 mt-1">
                    <Input placeholder="Or type custom role..." className="glass-sm text-sm" value={customRole} onChange={(e) => setCustomRole(e.target.value)} />
                    <Button size="sm" variant="outline" onClick={() => { if (customRole.trim()) { setForm({ ...form, role: customRole.trim() }); setCustomRole(""); } }}>Set</Button>
                  </div>
                </div>
                <Button onClick={handleSave} className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                  {editingMember ? "Update Member" : "Add Member"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          )}
        </div>

        {visibleMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Users className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium text-slate-500">No team members</p>
            <p className="text-sm mt-1">{isAdmin ? "Add members by email to get started." : "Contact the admin to be added to the team."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleMembers.map(member => (
              <Card key={member.id} className="glass rounded-2xl p-6 hover-lift">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {member.avatar}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{member.name}</h3>
                      <p className="text-sm text-slate-500">{member.role}</p>
                    </div>
                  </div>
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={syncUsersToMembers} className="text-indigo-600 border-indigo-200">
              <RefreshCw className="w-4 h-4 mr-1" /> Sync Users
            </Button>
          )}
          {isAdmin && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="text-slate-500 hover:text-indigo-600" onClick={() => openEdit(member)}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </Button>
                      <Button size="sm" variant="ghost" className="text-slate-500 hover:text-red-600" onClick={() => handleDelete(member.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="mt-4 space-y-1">
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {member.email}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Briefcase className="w-3 h-3" /> {member.role}
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
