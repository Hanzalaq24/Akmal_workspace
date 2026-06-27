import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, Search, Bell, Settings, LogOut, Kanban, LayoutGrid, Activity, TrendingUp, Users, AlertCircle, CheckCircle2, Trash2, Eye, MessageSquare, Paperclip, Zap, DollarSign } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { AkmalLogo } from "@/components/AkmalLogo";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "completed";
  priority: "high" | "medium" | "low";
  assignee?: string;
  dueDate?: string;
  comments: number;
  attachments: number;
}

interface Project {
  id: string;
  name: string;
  client: string;
  types: string[];
  description: string;
  progress: number;
  status: "active" | "completed" | "on-hold";
  deadline: string;
  budget: number;
  spent: number;
  team: string[];
  tasks: Task[];
}


const statusColors = {
  completed: "#10b981",
  "in-progress": "#f59e0b",
  todo: "#6b7280",
};

const priorityColors = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#3b82f6",
};

const CHART_COLORS = ["#4f46e5", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem("akmal-projects");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clear old mock data (ids "1", "2", "3")
        if (Array.isArray(parsed) && parsed.length === 3 && parsed.every((p: any) => ["1","2","3"].includes(p.id))) {
          localStorage.removeItem("akmal-projects");
          return [];
        }
        return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem("akmal-projects", JSON.stringify(projects));
  }, [projects]);

  // One-time sync existing projects to API
  useEffect(() => {
    const sync = async () => {
      const cu = JSON.parse(localStorage.getItem("akmal-current-user") || "{}");
      if (!cu?.id) return;
      try {
        const apiProjects = await (await fetch(`/api/projects?user_id=${cu.id}`)).json();
        const localProjects = JSON.parse(localStorage.getItem("akmal-projects") || "[]");
        for (const p of localProjects) {
          try {
            const exists = Array.isArray(apiProjects) && apiProjects.find((ap: any) => ap.name?.toLowerCase() === p.name?.toLowerCase());
            if (!exists) {
              fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: p.name, client: p.client, types: p.types, description: p.description, status: p.status, deadline: p.deadline, budget: p.budget, spent: p.spent, team: p.team, user_id: cu.id }),
              });
            }
          } catch {}
        }
      } catch {}
    };
    sync();
  }, []);
  const [view, setView] = useState<"grid" | "kanban">("grid");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const projectTypes = [
    "Web Development",
    "Mobile App",
    "Branding",
    "UI/UX Design",
    "SEO",
    "Content Writing",
    "Social Media",
    "Video Editing",
    "Graphic Design",
    "E-Commerce",
    "API Development",
    "Consulting",
  ];

  // New project form state
  const [newProject, setNewProject] = useState({
    name: "",
    client: "",
    types: [] as string[],
    description: "",
    budget: "",
    deadline: "",
    status: "active" as "active" | "completed" | "on-hold",
    team: "",
  });

  const resetNewProjectForm = () => {
    setNewProject({
      name: "",
      client: "",
      types: [],
      description: "",
      budget: "",
      deadline: "",
      status: "active",
      team: "",
    });
  };

  const handleAddProject = () => {
    if (!newProject.name.trim() || !newProject.client.trim()) {
      toast.error("Project name and client name are required");
      return;
    }
    if (newProject.types.length === 0) {
      toast.error("Select at least one project type");
      return;
    }

    const project: Project = {
      id: String(Date.now()),
      name: newProject.name.trim(),
      client: newProject.client.trim(),
      types: newProject.types,
      description: newProject.description.trim(),
      progress: 0,
      status: newProject.status,
      deadline: newProject.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      budget: Number(newProject.budget) || 0,
      spent: 0,
      team: newProject.team.split(",").map(s => s.trim()).filter(Boolean),
      tasks: [],
    };

    setProjects([project, ...projects]);
    
    // Auto-save client
    if (newProject.client.trim()) {
      try {
        const savedClients = JSON.parse(localStorage.getItem("akmal-clients") || "[]");
        if (!savedClients.find((c: any) => c.name?.toLowerCase() === newProject.client.trim().toLowerCase())) {
          savedClients.push({ id: String(Date.now()), name: newProject.client.trim(), email: "", phone: "", address: "" });
          localStorage.setItem("akmal-clients", JSON.stringify(savedClients));
        }
      } catch {}
    }
    
    // Sync project to API
    try {
      const cu = JSON.parse(localStorage.getItem("akmal-current-user") || "{}");
      fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: project.name, client: project.client, types: project.types, description: project.description, status: project.status, deadline: project.deadline, budget: project.budget, spent: project.spent, team: project.team, user_id: cu?.id || null }),
      });
    } catch {}
    
    resetNewProjectForm();
    setShowNewProjectDialog(false);
    toast.success("Project created successfully!");
  };

  const toggleProjectType = (type: string) => {
    setNewProject(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type],
    }));
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
  const avgProgress = projects.length ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length) : 0;
  const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0);
  const completedTasks = projects.reduce((sum, p) => sum + p.tasks.filter(t => t.status === "completed").length, 0);
  const inProgressTasks = projects.reduce((sum, p) => sum + p.tasks.filter(t => t.status === "in-progress").length, 0);
  const pendingTasks = projects.reduce((sum, p) => sum + p.tasks.filter(t => t.status === "todo").length, 0);
  const teamCount = (() => {
    try {
      const saved = localStorage.getItem("akmal-members");
      return saved ? JSON.parse(saved).length : 0;
    } catch { return 0; }
  })();

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}k`;
    return `₹${amount}`;
  };

  // Compute analytics data from projects
  const analyticsData = [
    { name: "Completed", value: completedTasks, fill: "#10b981" },
    { name: "In Progress", value: inProgressTasks, fill: "#f59e0b" },
    { name: "Pending", value: pendingTasks, fill: "#6b7280" },
  ];

  // Compute budget data from projects  
  const budgetData = projects.map(p => ({
    name: p.name.length > 15 ? p.name.slice(0, 15) + "..." : p.name,
    value: p.spent,
    budget: p.budget,
  }));

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
    toast.success("Project deleted successfully");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/20 to-white">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <AkmalLogo className="shrink-0" width={130} />
            <h1 className="text-2xl font-bold text-slate-900">Akmal Creative Hub</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
            <span className="text-sm text-slate-600 hidden md:inline shrink-0">{user?.name}</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/items")}
              className="text-slate-600 hover:text-indigo-600 shrink-0"
            >
              📦 <span className="hidden sm:inline">Items</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/clients")}
              className="text-slate-600 hover:text-indigo-600 shrink-0"
            >
              🧑‍💼 <span className="hidden sm:inline">Clients</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/purchase-orders")}
              className="text-slate-600 hover:text-indigo-600 shrink-0"
            >
              📋 <span className="hidden sm:inline">PO</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/services")}
              className="text-slate-600 hover:text-indigo-600 shrink-0"
            >
              💰 <span className="hidden sm:inline">Billing</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/members")}
              className="text-slate-600 hover:text-indigo-600 shrink-0"
            >
              👥 <span className="hidden sm:inline">Team</span>
            </Button>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-slate-600" />
            </button>
            <button 
              onClick={() => setLocation("/settings")}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 text-slate-600" />
            </button>
            <button 
              onClick={() => { logout(); setLocation("/"); }}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="glass rounded-2xl p-6 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Active Projects</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{projects.filter(p => p.status === "active").length}</p>
              </div>
              <LayoutGrid className="w-8 h-8 text-indigo-600/20" />
            </div>
          </Card>

          <Card className="glass rounded-2xl p-6 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Avg Progress</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{avgProgress}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-teal-600/20" />
            </div>
          </Card>

          <Card className="glass rounded-2xl p-6 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Total Tasks</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{completedTasks}/{totalTasks}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600/20" />
            </div>
          </Card>

          <Card className="glass rounded-2xl p-6 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Budget Used</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 0}%</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600/20" />
            </div>
          </Card>

          <Card className="glass rounded-2xl p-6 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Team Members</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{teamCount}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600/20" />
            </div>
          </Card>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="glass rounded-2xl p-6 lg:col-span-2 hover-lift">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Task Status Overview</h3>
            {totalTasks > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {analyticsData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-400">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No tasks yet. Create a project to see analytics.</p>
                </div>
              </div>
            )}
          </Card>

          <Card className="glass rounded-2xl p-6 hover-lift">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Budget Allocation</h3>
            {budgetData.length > 0 && totalSpent > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={budgetData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name }) => name}>
                    {budgetData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-400">
                <div className="text-center">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No budget data yet.</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Projects Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-900">Projects</h2>
            <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg">
                  <Plus className="w-4 h-4 mr-2" /> New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="glass max-h-[85vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>Fill in the details to create a new project.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="projectName">Project Name *</Label>
                      <Input
                        id="projectName"
                        placeholder="Enter project name"
                        className="glass-sm"
                        value={newProject.name}
                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientName">Client Name *</Label>
                      <Input
                        id="clientName"
                        placeholder="Enter client name"
                        className="glass-sm"
                        value={newProject.client}
                        onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Project Types * (select multiple)</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-white/40 rounded-lg border border-white/30">
                      {projectTypes.map((type) => (
                        <label
                          key={type}
                          className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors text-sm ${
                            newProject.types.includes(type)
                              ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                              : "hover:bg-white/50 border border-transparent"
                          }`}
                        >
                          <Checkbox
                            checked={newProject.types.includes(type)}
                            onCheckedChange={() => toggleProjectType(type)}
                          />
                          {type}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief project description..."
                      className="glass-sm min-h-20"
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="budget">Budget (₹)</Label>
                      <Input
                        id="budget"
                        type="number"
                        placeholder="e.g. 50000"
                        className="glass-sm"
                        value={newProject.budget}
                        onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deadline">Deadline</Label>
                      <Input
                        id="deadline"
                        type="date"
                        className="glass-sm"
                        value={newProject.deadline}
                        onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={newProject.status}
                        onValueChange={(val) => setNewProject({ ...newProject, status: val as "active" | "completed" | "on-hold" })}
                      >
                        <SelectTrigger className="glass-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="on-hold">On Hold</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="team">Team Members</Label>
                      <Input
                        id="team"
                        placeholder="Names, comma separated"
                        className="glass-sm"
                        value={newProject.team}
                        onChange={(e) => setNewProject({ ...newProject, team: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button onClick={handleAddProject} className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Create Project
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search projects..." 
                className="pl-10 glass-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 glass-sm">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 bg-white/50 rounded-lg p-1 border border-white/20">
              <button 
                onClick={() => setView("grid")}
                className={`p-2 rounded transition-colors ${view === "grid" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-white/50"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setView("kanban")}
                className={`p-2 rounded transition-colors ${view === "kanban" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-white/50"}`}
              >
                <Kanban className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Projects Grid View */}
          {view === "grid" && (
            <>
              {filteredProjects.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
                  <LayoutGrid className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium text-slate-500">No projects found</p>
                  <p className="text-sm mt-1">Click "New Project" to create your first project.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <Card 
                  key={project.id} 
                  className="glass rounded-2xl p-6 hover-lift cursor-pointer transition-all"
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-slate-900">{project.name}</h3>
                        <p className="text-sm text-slate-600">{project.client}</p>
                        <div className="flex flex-wrap gap-1">
                          {project.types.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-200">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${
                        project.status === "active" ? "bg-green-100 text-green-700" : 
                        project.status === "completed" ? "bg-blue-100 text-blue-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Progress</span>
                        <span className="font-semibold text-slate-900">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-indigo-600 to-teal-500 h-2 rounded-full transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">Budget</p>
                        <p className="font-semibold text-slate-900">{formatCurrency(project.spent)} / {formatCurrency(project.budget)}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Tasks</p>
                        <p className="font-semibold text-slate-900">{project.tasks.filter(t => t.status === "completed").length}/{project.tasks.length}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/project/${project.id}`);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" /> View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
                </div>
              )}
            </>
          )}

          {/* Kanban View */}
          {view === "kanban" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {["todo", "in-progress", "completed"].map((status) => (
                <div key={status} className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-3 h-3 rounded-full ${
                      status === "todo" ? "bg-slate-400" :
                      status === "in-progress" ? "bg-orange-400" :
                      "bg-green-400"
                    }`} />
                    <h3 className="font-semibold text-slate-900 capitalize">{status.replace("-", " ")}</h3>
                  </div>
                  <div className="space-y-3">
                    {filteredProjects.flatMap(p => 
                      p.tasks.filter(t => t.status === status).map(task => (
                        <Card key={task.id} className="glass rounded-xl p-4 hover-lift cursor-move">
                          <p className="font-medium text-slate-900 text-sm">{task.title}</p>
                          <div className="flex items-center gap-2 mt-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              task.priority === "high" ? "bg-red-100 text-red-700" :
                              task.priority === "medium" ? "bg-orange-100 text-orange-700" :
                              "bg-blue-100 text-blue-700"
                            }`}>
                              {task.priority}
                            </span>
                            {task.assignee && (
                              <span className="text-xs text-slate-600 ml-auto">{task.assignee}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                            {task.comments > 0 && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" /> {task.comments}
                              </span>
                            )}
                            {task.attachments > 0 && (
                              <span className="flex items-center gap-1">
                                <Paperclip className="w-3 h-3" /> {task.attachments}
                              </span>
                            )}
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Assistant Panel */}
      <div className="fixed bottom-6 right-6 z-40">
        <button 
          onClick={() => setShowAIAssistant(!showAIAssistant)}
          className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-teal-500 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all hover:scale-110"
        >
          <Zap className="w-6 h-6" />
        </button>
        {showAIAssistant && (
          <div className="absolute bottom-20 right-0 w-80 glass rounded-2xl p-6 shadow-2xl">
            <h3 className="font-semibold text-slate-900 mb-3">AI Assistant</h3>
            <p className="text-sm text-slate-600 mb-4">
              Your projects are on track! 65% of tasks completed across all active projects. Next deadline: Rifaah Perfumes Website on July 15th.
            </p>
            <div className="space-y-2">
              <Button size="sm" className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                <Zap className="w-3 h-3 mr-2" /> Generate Task Breakdown
              </Button>
              <Button size="sm" variant="outline" className="w-full">
                View Recommendations
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
