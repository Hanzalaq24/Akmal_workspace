import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, StickyNote, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function NotesPage() {
  const [, setLocation] = useLocation();
  const [notes, setNotes] = useState<Note[]>(() => {
    try { return JSON.parse(localStorage.getItem("akmal-notes") || "[]"); } catch { return []; }
  });
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    localStorage.setItem("akmal-notes", JSON.stringify(notes));
  }, [notes]);

  // Sync from API on mount
  useEffect(() => {
    const sync = async () => {
      const cu = JSON.parse(localStorage.getItem("akmal-current-user") || "{}");
      if (!cu?.id) return;
      try {
        const apiNotes = await (await fetch(`/api/notes?user_id=${cu.id}`)).json();
        if (Array.isArray(apiNotes) && apiNotes.length > 0) {
          const local = JSON.parse(localStorage.getItem("akmal-notes") || "[]");
          let changed = false;
          apiNotes.forEach((an: any) => {
            if (!local.find((ln: any) => ln.id === String(an.id))) {
              local.push({ id: String(an.id), title: an.title, content: an.content || "", createdAt: an.created_at, updatedAt: an.updated_at });
              changed = true;
            }
          });
          if (changed) { localStorage.setItem("akmal-notes", JSON.stringify(local)); setNotes(local); }
        }
      } catch {}
    };
    sync();
  }, []);

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    const cu = JSON.parse(localStorage.getItem("akmal-current-user") || "{}");
    
    if (editingNote) {
      const updated = notes.map(n => n.id === editingNote.id ? { ...n, title: title.trim(), content: content.trim(), updatedAt: new Date().toISOString() } : n);
      setNotes(updated);
      try {
        await fetch(`/api/notes/${editingNote.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: title.trim(), content: content.trim() }) });
      } catch {}
      toast.success("Note updated");
    } else {
      const newNote: Note = { id: String(Date.now()), title: title.trim(), content: content.trim(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      setNotes([newNote, ...notes]);
      try {
        await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: title.trim(), content: content.trim(), user_id: cu?.id }) });
      } catch {}
      toast.success("Note saved");
    }
    setTitle("");
    setContent("");
    setEditingNote(null);
    setShowAddDialog(false);
  };

  const handleDelete = async (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
    if (selectedNote?.id === id) setSelectedNote(null);
    try { await fetch(`/api/notes/${id}`, { method: "DELETE" }); } catch {}
    toast.success("Note deleted");
  };

  const formatDate = (d: string) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/20 to-white">
      <header className="sticky top-0 z-40 glass border-b border-white/20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setLocation("/dashboard")} className="p-2 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Notes</h1>
            <span className="text-sm text-slate-500">{notes.length} notes</span>
          </div>
          <Button onClick={() => { setEditingNote(null); setTitle(""); setContent(""); setShowAddDialog(true); }} className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> New Note
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {notes.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <StickyNote className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium text-slate-500">No notes yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map(note => (
              <Card
                key={note.id}
                className="glass rounded-2xl p-5 hover-lift cursor-pointer"
                onClick={() => { setSelectedNote(note); setEditingNote(note); setTitle(note.title); setContent(note.content); setShowAddDialog(true); }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 text-sm line-clamp-2">{note.title}</h3>
                  <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 -mr-2" onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-600 line-clamp-3 mb-3">{note.content}</p>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  {formatDate(note.updatedAt)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Note Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="glass sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingNote ? "Edit Note" : "New Note"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="noteTitle">Title *</Label>
              <Input id="noteTitle" placeholder="Note title" className="glass-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="noteContent">Content</Label>
              <Textarea id="noteContent" placeholder="Write your note..." className="glass-sm min-h-32" value={content} onChange={(e) => setContent(e.target.value)} />
            </div>
            <Button onClick={handleSave} className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
              <StickyNote className="w-4 h-4 mr-2" /> {editingNote ? "Update Note" : "Save Note"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/30 md:hidden">
        <div className="flex items-center justify-around py-2 px-1">
          <button onClick={() => setLocation("/dashboard")} className="flex flex-col items-center gap-0.5 text-slate-600 p-2 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            <span className="text-[10px] font-medium">Projects</span>
          </button>
          <button onClick={() => setLocation("/items")} className="flex flex-col items-center gap-0.5 text-slate-600 p-2 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            <span className="text-[10px] font-medium">Items</span>
          </button>
          <button onClick={() => setLocation("/notes")} className="flex flex-col items-center gap-0.5 text-indigo-600 p-2 rounded-lg">
            <StickyNote className="w-5 h-5" />
            <span className="text-[10px] font-medium">Notes</span>
          </button>
          <button onClick={() => setLocation("/services")} className="flex flex-col items-center gap-0.5 text-slate-600 p-2 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            <span className="text-[10px] font-medium">Billing</span>
          </button>
        </div>
      </nav>
      <div className="h-14 md:hidden" />
    </div>
  );
}
