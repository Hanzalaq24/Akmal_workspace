import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, MessageSquare, Paperclip, Calendar, User, DollarSign, Flag, CheckCircle2, Circle, AlertCircle, Download, Upload, Share2, MoreVertical, Zap, Layers } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "completed";
  priority: "high" | "medium" | "low";
  assignee: string;
  dueDate: string;
  comments: Comment[];
  attachments: Attachment[];
}

interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface Asset {
  id: string;
  name: string;
  type: "image" | "document" | "video";
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  preview?: string;
}

export default function ProjectDetail() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/project/:id");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddPhase, setShowAddPhase] = useState(false);

  // New task form state
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as "high" | "medium" | "low",
    assignee: "",
    dueDate: "",
    phaseId: "",
  });

  // New phase form state
  const [newPhaseName, setNewPhaseName] = useState("");

  // Load projects from localStorage
  const savedProjects = (() => {
    try {
      const saved = localStorage.getItem("akmal-projects");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  })();

  // Find the project by ID from saved projects
  const foundProject = savedProjects.find((p: any) => p.id === params?.id);

  // Build initial project data
  const buildProject = (found: any) => ({
    id: found.id,
    name: found.name,
    client: found.client,
    type: (found.types || []).join(" / ") || found.type || "",
    description: found.description || "",
    status: found.status || "active",
    progress: found.progress || 0,
    deadline: found.deadline || "",
    budget: found.budget || 0,
    spent: found.spent || 0,
    team: (found.team || []).map((name: string, i: number) => ({
      id: String(i + 1),
      name,
      role: "",
      avatar: name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
    })),
    phases: (found.phases || []) as { id: string; name: string; tasks: Task[] }[],
    assets: (found.assets || []) as Asset[],
    activity: (found.activity || []) as { id: string; action: string; user: string; time: string; icon: string }[],
  });

  const [project, setProject] = useState<any | null>(() => {
    if (!foundProject) return null;
    return buildProject(foundProject);
  });

  // Sync project changes back to localStorage
  const saveProjectToStorage = (updatedProject: any) => {
    try {
      const idx = savedProjects.findIndex((p: any) => p.id === updatedProject.id);
      if (idx !== -1) {
        savedProjects[idx] = {
          ...savedProjects[idx],
          phases: updatedProject.phases,
          progress: updatedProject.progress,
          spent: updatedProject.spent,
        };
        localStorage.setItem("akmal-projects", JSON.stringify(savedProjects));
      }
    } catch {}
  };

  const handleAddPhase = () => {
    if (!newPhaseName.trim()) {
      toast.error("Phase name is required");
      return;
    }
    const phase = {
      id: String(Date.now()),
      name: newPhaseName.trim(),
      tasks: [] as Task[],
    };
    const updated = { ...project, phases: [...project.phases, phase] };
    setProject(updated);
    saveProjectToStorage(updated);
    setNewPhaseName("");
    setShowAddPhase(false);
    toast.success("Phase added");
  };

  const handleAddTask = () => {
    if (!newTask.title.trim()) {
      toast.error("Task title is required");
      return;
    }
    const task: Task = {
      id: String(Date.now()),
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      status: "todo",
      priority: newTask.priority,
      assignee: newTask.assignee.trim(),
      dueDate: newTask.dueDate,
      comments: [],
      attachments: [],
    };
    const phaseId = newTask.phaseId || (project.phases[0]?.id);
    const updatedPhases = project.phases.map((p: any) => {
      if (p.id === phaseId) {
        return { ...p, tasks: [...p.tasks, task] };
      }
      return p;
    });
    const updated = { ...project, phases: updatedPhases };
    setProject(updated);
    saveProjectToStorage(updated);
    setNewTask({ title: "", description: "", priority: "medium", assignee: "", dueDate: "", phaseId: "" });
    setShowAddTask(false);
    toast.success("Task added");
  };

  const handleDeleteTask = (taskId: string, phaseId: string) => {
    const updatedPhases = project.phases.map((p: any) => {
      if (p.id === phaseId) {
        return { ...p, tasks: p.tasks.filter((t: Task) => t.id !== taskId) };
      }
      return p;
    });
    const updated = { ...project, phases: updatedPhases };
    setProject(updated);
    saveProjectToStorage(updated);
    toast.success("Task deleted");
  };

  const handleDeletePhase = (phaseId: string) => {
    const updated = { ...project, phases: project.phases.filter((p: any) => p.id !== phaseId) };
    setProject(updated);
    saveProjectToStorage(updated);
    toast.success("Phase deleted");
  };

  const formatDeadline = (dateStr: string) => {
    if (!dateStr) return "Not set";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }; 

  if (!match) return null;

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/20 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Project Not Found</h2>
          <p className="text-slate-600 mb-6">The project you're looking for doesn't exist or has been deleted.</p>
          <Button onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleAddComment = () => {
    if (newComment.trim()) {
      toast.success("Comment added successfully");
      setNewComment("");
      setShowCommentDialog(false);
    }
  };

  const handleTaskStatusChange = (taskId: string, newStatus: string) => {
    toast.success(`Task status updated to ${newStatus}`);
  };

  const handleDownloadAsset = (assetName: string) => {
    toast.success(`Downloading ${assetName}...`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/20 to-white">
      {/* Header */}
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
              <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
              <p className="text-sm text-slate-600">{project.client}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation("/services")}
              className="text-slate-600 hover:text-indigo-600"
            >
              💰 Billing
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass rounded-2xl p-4 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 uppercase font-semibold">Status</p>
                <p className="text-lg font-bold text-slate-900 mt-1 capitalize">{project.status}</p>
              </div>
              <Zap className="w-6 h-6 text-indigo-600/20" />
            </div>
          </Card>

          <Card className="glass rounded-2xl p-4 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 uppercase font-semibold">Progress</p>
                <p className="text-lg font-bold text-slate-900 mt-1">{project.progress}%</p>
              </div>
              <CheckCircle2 className="w-6 h-6 text-green-600/20" />
            </div>
          </Card>

          <Card className="glass rounded-2xl p-4 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 uppercase font-semibold">Budget</p>
                <p className="text-lg font-bold text-slate-900 mt-1">₹{(project.spent / 1000).toFixed(0)}k / {(project.budget / 1000).toFixed(0)}k</p>
              </div>
              <DollarSign className="w-6 h-6 text-orange-600/20" />
            </div>
          </Card>

          <Card className="glass rounded-2xl p-4 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 uppercase font-semibold">Deadline</p>
                <p className="text-lg font-bold text-slate-900 mt-1">{formatDeadline(project.deadline)}</p>
              </div>
              <Calendar className="w-6 h-6 text-blue-600/20" />
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="glass rounded-2xl p-1 mb-6">
            <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-lg">Tasks</TabsTrigger>
            <TabsTrigger value="assets" className="rounded-lg">Assets</TabsTrigger>
            <TabsTrigger value="team" className="rounded-lg">Team</TabsTrigger>
            <TabsTrigger value="activity" className="rounded-lg">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="glass rounded-2xl p-8 hover-lift">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Project Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Description</p>
                  <p className="text-slate-900 mt-2">{project.description}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Type</p>
                  <p className="text-slate-900 mt-2">{project.type}</p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass rounded-2xl p-6 hover-lift">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Progress Overview</h3>
                <div className="space-y-4">
                  {project.phases.map((phase: any) => {
                    const phaseTasks = phase.tasks;
                    const completedCount = phaseTasks.filter((t: any) => t.status === "completed").length;
                    const phaseProgress = Math.round((completedCount / phaseTasks.length) * 100);
                    return (
                      <div key={phase.id}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium text-slate-900">{phase.name}</span>
                          <span className="text-slate-600">{phaseProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-indigo-600 to-teal-500 h-2 rounded-full transition-all"
                            style={{ width: `${phaseProgress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="glass rounded-2xl p-6 hover-lift">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Team Members</h3>
                <div className="space-y-3">
                  {project.team.map((member: { id: string; name: string; role: string; avatar: string }) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 bg-white/30 rounded-lg">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {member.avatar}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-600">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Dialog open={showAddPhase} onOpenChange={setShowAddPhase}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-slate-600">
                    <Layers className="w-4 h-4 mr-2" /> Add Phase
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Phase</DialogTitle>
                    <DialogDescription>Create a new phase to organize tasks.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phaseName">Phase Name *</Label>
                      <Input
                        id="phaseName"
                        placeholder="e.g. Design, Development, Testing"
                        className="glass-sm"
                        value={newPhaseName}
                        onChange={(e) => setNewPhaseName(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleAddPhase} className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                      <Plus className="w-4 h-4 mr-2" /> Create Phase
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {project.phases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Layers className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium text-slate-500">No phases yet</p>
                <p className="text-xs mt-1">Add a phase to start organizing tasks.</p>
              </div>
            ) : (
              project.phases.map((phase: any) => (
                <div key={phase.id}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <span className="w-1 h-6 bg-gradient-to-b from-indigo-600 to-teal-500 rounded-full"></span>
                      {phase.name}
                      <span className="text-sm font-normal text-slate-500 ml-2">({phase.tasks.length} tasks)</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                            <Plus className="w-4 h-4 mr-1" /> Add Task
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="glass sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Add Task</DialogTitle>
                            <DialogDescription>Create a new task for this project.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="taskTitle">Task Title *</Label>
                              <Input
                                id="taskTitle"
                                placeholder="Enter task title"
                                className="glass-sm"
                                value={newTask.title}
                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="taskDesc">Description</Label>
                              <Textarea
                                id="taskDesc"
                                placeholder="Task description..."
                                className="glass-sm"
                                value={newTask.description}
                                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v as any })}>
                                  <SelectTrigger className="glass-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Phase</Label>
                                <Select
                                  value={newTask.phaseId || (project.phases[0]?.id || "")}
                                  onValueChange={(v) => setNewTask({ ...newTask, phaseId: v })}
                                >
                                  <SelectTrigger className="glass-sm">
                                    <SelectValue placeholder="Select phase" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {project.phases.map((p: any) => (
                                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="assignee">Assignee</Label>
                                <Input
                                  id="assignee"
                                  placeholder="Team member name"
                                  className="glass-sm"
                                  value={newTask.assignee}
                                  onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="dueDate">Due Date</Label>
                                <Input
                                  id="dueDate"
                                  type="date"
                                  className="glass-sm"
                                  value={newTask.dueDate}
                                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                />
                              </div>
                            </div>
                            <Button onClick={handleAddTask} className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                              <Plus className="w-4 h-4 mr-2" /> Add Task
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeletePhase(phase.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {phase.tasks.length === 0 ? (
                      <p className="text-sm text-slate-400 py-4 text-center">No tasks in this phase</p>
                    ) : (
                      phase.tasks.map((task: Task) => (
                        <Card 
                          key={task.id} 
                          className="glass rounded-xl p-4 hover-lift cursor-pointer transition-all"
                          onClick={() => {
                            setSelectedTask(task);
                            setShowTaskDialog(true);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                {task.status === "completed" ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                ) : task.status === "in-progress" ? (
                                  <Circle className="w-5 h-5 text-orange-600" />
                                ) : (
                                  <Circle className="w-5 h-5 text-slate-400" />
                                )}
                                <h4 className="font-semibold text-slate-900">{task.title}</h4>
                              </div>
                              <p className="text-sm text-slate-600 ml-8">{task.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                task.priority === "high" ? "bg-red-100 text-red-700" :
                                task.priority === "medium" ? "bg-orange-100 text-orange-700" :
                                "bg-blue-100 text-blue-700"
                              }`}>
                                {task.priority}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTask(task.id, phase.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-3 text-xs text-slate-600 ml-8">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" /> {task.assignee || "Unassigned"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {task.dueDate || "No date"}
                            </span>
                            {task.comments.length > 0 && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" /> {task.comments.length}
                              </span>
                            )}
                            {task.attachments.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Paperclip className="w-3 h-3" /> {task.attachments.length}
                              </span>
                            )}
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900">Project Assets</h3>
              <Button className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                <Upload className="w-4 h-4 mr-2" /> Upload Asset
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.assets.map((asset: any) => (
                <Card key={asset.id} className="glass rounded-xl p-4 hover-lift">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{asset.preview}</div>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm">{asset.name}</h4>
                  <p className="text-xs text-slate-600 mt-1">{asset.size}</p>
                  <p className="text-xs text-slate-600">by {asset.uploadedBy}</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full mt-3"
                    onClick={() => handleDownloadAsset(asset.name)}
                  >
                    <Download className="w-3 h-3 mr-1" /> Download
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card className="glass rounded-2xl p-6 hover-lift">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Team Members</h3>
              <div className="space-y-4">
                {project.team.map((member: { id: string; name: string; role: string; avatar: string }) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-white/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                        {member.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{member.name}</p>
                        <p className="text-sm text-slate-600">{member.role}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      View Profile
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card className="glass rounded-2xl p-6 hover-lift">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {[
                  { action: "Task completed", detail: "Homepage Design marked as done", time: "2 hours ago", user: "Designer" },
                  { action: "Comment added", detail: "Product Catalog - 80% complete", time: "4 hours ago", user: "Developer" },
                  { action: "Asset uploaded", detail: "Brand Guidelines document", time: "1 day ago", user: "Designer" },
                  { action: "Project created", detail: "Rifaah Perfumes Website", time: "5 days ago", user: "Hanzala" },
                ].map((activity, idx) => (
                  <div key={idx} className="flex gap-4 pb-4 border-b border-white/20 last:border-0">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{activity.action}</p>
                      <p className="text-sm text-slate-600">{activity.detail}</p>
                      <p className="text-xs text-slate-500 mt-1">{activity.user} • {activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Task Detail Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="glass max-w-2xl">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedTask.status === "completed" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400" />
                  )}
                  {selectedTask.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-slate-600 font-medium mb-2">Description</p>
                  <p className="text-slate-900">{selectedTask.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 font-medium mb-1">Assignee</p>
                    <p className="text-slate-900">{selectedTask.assignee}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 font-medium mb-1">Due Date</p>
                    <p className="text-slate-900">{selectedTask.dueDate}</p>
                  </div>
                </div>

                {selectedTask.attachments.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-600 font-medium mb-2">Attachments</p>
                    <div className="space-y-2">
                      {selectedTask.attachments.map(att => (
                        <div key={att.id} className="flex items-center justify-between p-2 bg-white/30 rounded">
                          <span className="text-sm text-slate-900">{att.name}</span>
                          <Button size="sm" variant="ghost">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm text-slate-600 font-medium mb-2">Comments ({selectedTask.comments.length})</p>
                  <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
                    {selectedTask.comments.map(comment => (
                      <div key={comment.id} className="p-3 bg-white/30 rounded">
                        <p className="font-medium text-sm text-slate-900">{comment.author}</p>
                        <p className="text-sm text-slate-700 mt-1">{comment.text}</p>
                        <p className="text-xs text-slate-500 mt-1">{comment.timestamp}</p>
                      </div>
                    ))}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowCommentDialog(true)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" /> Add Comment
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
