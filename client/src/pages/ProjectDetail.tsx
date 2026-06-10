import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, MessageSquare, MessagesSquare, Paperclip, Calendar, User, DollarSign, Flag, CheckCircle2, Circle, AlertCircle, Download, Upload, Share2, MoreVertical, Zap, Layers, FileText, Link2, X, Send, HardDrive } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { isGoogleConnected, connectGoogleDrive, clearGoogleToken, uploadToDrive, listDriveFiles, deleteDriveFile, setGoogleClientId, getGoogleClientId } from "@/lib/googleDrive";

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
  const { isAdmin } = useAuth();
  const [match, params] = useRoute("/project/:id");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddPhase, setShowAddPhase] = useState(false);
  const [showAssetUpload, setShowAssetUpload] = useState(false);
  const [uploadMode, setUploadMode] = useState<"local" | "drive">("local");
  const [driveLink, setDriveLink] = useState("");
  const [googleDriveConnected, setGoogleDriveConnected] = useState(isGoogleConnected());
  const [googleConnecting, setGoogleConnecting] = useState(false);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [showDriveSettings, setShowDriveSettings] = useState(false);
  const [driveClientId, setDriveClientId] = useState(getGoogleClientId());
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [pendingCompletePhases, setPendingCompletePhases] = useState<any>(null);
  const [showTeamChat, setShowTeamChat] = useState(false);
  const [teamChatInput, setTeamChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  interface ChatMessage {
    id: string;
    projectId: string;
    text: string;
    sender: string;
    role: "client" | "team";
    timestamp: string;
  }

  const loadMessages = (): ChatMessage[] => {
    try {
      const saved = localStorage.getItem("akmal-chats");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  };

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const pid = params?.id || "";

  useEffect(() => {
    const allMessages = loadMessages();
    setChatMessages(allMessages.filter((m: ChatMessage) => m.projectId === pid));
  }, [pid]);

  const saveChatMessages = (msgs: ChatMessage[]) => {
    try {
      const allMessages = loadMessages();
      const other = allMessages.filter((m: ChatMessage) => m.projectId !== pid);
      const updated = [...other, ...msgs];
      localStorage.setItem("akmal-chats", JSON.stringify(updated));
    } catch {}
  };

  const handleTeamSend = () => {
    if (!teamChatInput.trim()) return;
    const msg: ChatMessage = {
      id: String(Date.now()),
      projectId: pid,
      text: teamChatInput.trim(),
      sender: "Team",
      role: "team",
      timestamp: new Date().toISOString(),
    };
    const updated = [...chatMessages, msg];
    setChatMessages(updated);
    saveChatMessages(updated);
    setTeamChatInput("");
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const loadAllMembers = (): { id: string; name: string; email: string; role: string; avatar: string }[] => {
    try {
      const saved = localStorage.getItem("akmal-members");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  };

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

  const allMembers = loadAllMembers();
  const displayTeam = isAdmin
    ? allMembers
    : (allMembers.length > 0 ? allMembers.filter((m: any) => (project?.team || []).some((t: any) => typeof t === "string" ? t === m.name : t.name === m.name)) : (project?.team || []));

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

  const handleTaskStatusToggle = (taskId: string, phaseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let newStatus: "todo" | "in-progress" | "completed" = "todo";
    const updatedPhases = project.phases.map((p: any) => {
      if (p.id === phaseId) {
        return {
          ...p,
          tasks: p.tasks.map((t: Task) => {
            if (t.id === taskId) {
              newStatus = t.status === "todo" ? "in-progress" : t.status === "in-progress" ? "completed" : "todo";
              return { ...t, status: newStatus };
            }
            return t;
          }),
        };
      }
      return p;
    });
    
    let allTasks: Task[] = [];
    updatedPhases.forEach((p: any) => { allTasks = allTasks.concat(p.tasks); });
    const completedCount = allTasks.filter(t => t.status === "completed").length;
    const newProgress = allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 100) : 0;
    const allCompleted = allTasks.length > 0 && completedCount === allTasks.length;
    
    let updated = { ...project, phases: updatedPhases, progress: newProgress };
    
    if (allCompleted && project.status !== "completed") {
      // Store pending state and show confirmation
      setPendingCompletePhases(updatedPhases);
      setShowCompleteConfirm(true);
    } else {
      setProject(updated);
      saveProjectToStorage(updated);
      toast.success(`Task marked ${newStatus.replace("-", " ")}`);
    }
  };

  const handleConfirmComplete = () => {
    const updatedPhases = pendingCompletePhases;
    let allTasks: Task[] = [];
    updatedPhases.forEach((p: any) => { allTasks = allTasks.concat(p.tasks); });
    const newProgress = 100;
    
    const invoice = {
      id: `INV-${String(Date.now()).slice(-6)}`,
      projectName: project.name,
      clientName: project.client,
      date: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      items: [{ id: "1", name: `${project.name} - Complete Project`, quantity: 1, unitPrice: project.budget, total: project.budget }],
      subtotal: project.budget,
      gstPercentage: 18,
      gstAmount: Math.round(project.budget * 0.18),
      total: project.budget + Math.round(project.budget * 0.18),
      status: "draft",
      notes: "Auto-generated upon project completion",
    };
    try {
      const savedInvoices = JSON.parse(localStorage.getItem("akmal-invoices") || "[]");
      savedInvoices.unshift(invoice);
      localStorage.setItem("akmal-invoices", JSON.stringify(savedInvoices));
    } catch {}
    
    const updated = { ...project, phases: updatedPhases, progress: newProgress, status: "completed" };
    setProject(updated);
    saveProjectToStorage(updated);
    setShowCompleteConfirm(false);
    setPendingCompletePhases(null);
    toast.success("Project completed! Invoice generated.");
  };

  const handleCancelComplete = () => {
    // Still update the task status but don't mark project complete
    const updated = { ...project, phases: pendingCompletePhases, progress: 99 };
    setProject(updated);
    saveProjectToStorage(updated);
    setShowCompleteConfirm(false);
    setPendingCompletePhases(null);
    toast.success("Task marked completed");
  };

  const handleDriveLinkUpload = () => {
    if (!driveLink.trim()) {
      toast.error("Please enter a Google Drive link");
      return;
    }
    const asset: Asset = {
      id: String(Date.now()),
      name: `Drive File - ${driveLink.slice(0, 30)}...`,
      type: "document" as const,
      size: "N/A",
      uploadedBy: "Google Drive",
      uploadedAt: new Date().toISOString().split("T")[0],
      preview: "🔗",
    };
    const updated = { ...project, assets: [...project.assets, { ...asset, link: driveLink }] };
    setProject(updated);
    saveProjectToStorage({ ...updated });
    setDriveLink("");
    setShowAssetUpload(false);
    toast.success("Google Drive link added");
  };

  const handleConnectDrive = async () => {
    setGoogleConnecting(true);
    const result = await connectGoogleDrive();
    setGoogleConnecting(false);
    if (result.success) {
      setGoogleDriveConnected(true);
      toast.success("Google Drive connected!");
      loadDriveFiles();
    } else {
      toast.error(result.error || "Failed to connect Google Drive");
      if (result.error?.includes("Client ID")) {
        setShowDriveSettings(true);
      }
    }
  };

  const handleDisconnectDrive = () => {
    clearGoogleToken();
    setGoogleDriveConnected(false);
    setDriveFiles([]);
    toast.success("Google Drive disconnected");
  };

  const loadDriveFiles = async () => {
    if (!isGoogleConnected()) return;
    const files = await listDriveFiles();
    setDriveFiles(files);
  };

  const handleSaveClientId = () => {
    if (!driveClientId.trim()) {
      toast.error("Please enter a Client ID");
      return;
    }
    setGoogleClientId(driveClientId.trim());
    setShowDriveSettings(false);
    toast.success("Client ID saved");
  };

  // Load Drive files on mount
  useEffect(() => {
    loadDriveFiles();
  }, []);

  const handleDriveUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (googleDriveConnected) {
      const result = await uploadToDrive(file);
      if (result.success) {
        toast.success("Uploaded to Google Drive");
        loadDriveFiles();
      } else {
        toast.error(result.error || "Drive upload failed");
      }
    } else {
      // Local upload fallback
      const asset: Asset = {
        id: String(Date.now()),
        name: file.name,
        type: file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "document",
        size: file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`,
        uploadedBy: "You",
        uploadedAt: new Date().toISOString().split("T")[0],
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : file.type.startsWith("video/") ? "🎬" : "📄",
      };
      const updated = { ...project, assets: [...project.assets, asset] };
      setProject(updated);
      saveProjectToStorage({ ...updated });
      toast.success("Asset uploaded");
    }
    setShowAssetUpload(false);
  };

  // Format currency (handle amounts less than 1000 properly)
  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}k`;
    return `₹${amount}`;
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
                <p className="text-lg font-bold text-slate-900 mt-1">{formatCurrency(project.spent)} / {formatCurrency(project.budget)}</p>
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
                  {displayTeam.map((member: { id: string; name: string; role: string; avatar: string; email?: string }) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 bg-white/30 rounded-lg">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {member.avatar}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-600">{member.role}</p>
                        {member.email && <p className="text-[10px] text-slate-400">{member.email}</p>}
                      </div>
                    </div>
                  ))}
                  {displayTeam.length === 0 && (
                    <p className="text-sm text-slate-400 py-4 text-center">No team members assigned</p>
                  )}
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
                                <button
                                  onClick={(e) => handleTaskStatusToggle(task.id, phase.id, e)}
                                  className="hover:scale-110 transition-transform cursor-pointer"
                                  title={`Status: ${task.status}. Click to change.`}
                                >
                                  {task.status === "completed" ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                  ) : task.status === "in-progress" ? (
                                    <Circle className="w-5 h-5 text-orange-600 fill-orange-600" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-slate-400" />
                                  )}
                                </button>
                                <h4 className={`font-semibold text-slate-900 ${task.status === "completed" ? "line-through text-slate-500" : ""}`}>{task.title}</h4>
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
            {/* Google Drive Integration Banner */}
            <Card className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${googleDriveConnected ? "bg-green-100" : "bg-slate-100"}`}>
                    <HardDrive className={`w-5 h-5 ${googleDriveConnected ? "text-green-600" : "text-slate-400"}`} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">
                      {googleDriveConnected ? "Google Drive Connected" : "Google Drive Not Connected"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {googleDriveConnected
                        ? "Assets are automatically backed up to Google Drive"
                        : "Connect to store assets in Google Drive"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!googleDriveConnected ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setShowDriveSettings(true)}>
                        ⚙️
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleConnectDrive}
                        disabled={googleConnecting}
                        className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white"
                      >
                        {googleConnecting ? "Connecting..." : "Connect Drive"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={loadDriveFiles}>
                        🔄 Refresh
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleDisconnectDrive} className="text-red-600 hover:text-red-700">
                        Disconnect
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>

            {/* Drive Settings Dialog */}
            <Dialog open={showDriveSettings} onOpenChange={setShowDriveSettings}>
              <DialogContent className="glass sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Google Drive Settings</DialogTitle>
                  <DialogDescription>
                    Enter your Google Cloud OAuth 2.0 Client ID.{" "}
                    <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="text-indigo-600 underline">Get one here</a>
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client ID</Label>
                    <Input
                      id="clientId"
                      placeholder="123456789-xxxxx.apps.googleusercontent.com"
                      className="glass-sm"
                      value={driveClientId}
                      onChange={(e) => setDriveClientId(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleSaveClientId} className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                    Save & Connect
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900">Assets</h3>
              <Dialog open={showAssetUpload} onOpenChange={setShowAssetUpload}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                    <Upload className="w-4 h-4 mr-2" /> Upload Asset
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload Asset</DialogTitle>
                    <DialogDescription>
                      {googleDriveConnected ? "Files will be uploaded to your Google Drive" : "Choose upload method"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        variant={uploadMode === "local" ? "default" : "outline"}
                        className={`flex-1 ${uploadMode === "local" ? "bg-indigo-600 text-white" : ""}`}
                        onClick={() => setUploadMode("local")}
                      >
                        <Upload className="w-4 h-4 mr-2" /> Local Device
                      </Button>
                      <Button
                        variant={uploadMode === "drive" ? "default" : "outline"}
                        className={`flex-1 ${uploadMode === "drive" ? "bg-indigo-600 text-white" : ""}`}
                        onClick={() => setUploadMode("drive")}
                      >
                        <Link2 className="w-4 h-4 mr-2" /> Drive Link
                      </Button>
                    </div>

                    {uploadMode === "local" ? (
                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer">
                          <label className="cursor-pointer">
                            <Upload className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                            <p className="text-sm font-medium text-slate-600">Click to browse files</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {googleDriveConnected ? "Auto-uploads to Google Drive" : "All file types supported, no quality loss"}
                            </p>
                            <input
                              type="file"
                              className="hidden"
                              onChange={handleDriveUpload}
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="driveLink">Google Drive Share Link</Label>
                          <Input
                            id="driveLink"
                            placeholder="https://drive.google.com/file/d/..."
                            className="glass-sm"
                            value={driveLink}
                            onChange={(e) => setDriveLink(e.target.value)}
                          />
                        </div>
                        <Button onClick={handleDriveLinkUpload} className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                          <Link2 className="w-4 h-4 mr-2" /> Add Drive Link
                        </Button>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Google Drive Files */}
            {googleDriveConnected && driveFiles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
                  <HardDrive className="w-4 h-4" /> Google Drive Files
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {driveFiles.map((file: any) => (
                    <Card key={file.id} className="glass rounded-xl p-4 hover-lift border-green-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-3xl">📄</div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-600"
                          onClick={async () => {
                            const ok = await deleteDriveFile(file.id);
                            if (ok) { loadDriveFiles(); toast.success("File deleted from Drive"); }
                            else toast.error("Failed to delete");
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <h4 className="font-semibold text-slate-900 text-sm truncate">{file.name}</h4>
                      <p className="text-xs text-slate-600 mt-1">{file.size}</p>
                      <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => window.open(file.webViewLink, "_blank")}>
                        <HardDrive className="w-3 h-3 mr-1" /> Open in Drive
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Local Assets / Empty State */}
            {project.assets.length === 0 && driveFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <FileText className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium text-slate-500">No assets uploaded</p>
                <p className="text-xs mt-1">Upload files or connect Google Drive.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.assets.map((asset: any) => (
                  <Card key={asset.id} className="glass rounded-xl p-4 hover-lift">
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl">
                        {asset.preview?.startsWith("http") ? (
                          <img src={asset.preview} alt={asset.name} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          asset.preview || "📄"
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-600"
                        onClick={() => {
                          const updated = { ...project, assets: project.assets.filter((a: any) => a.id !== asset.id) };
                          setProject(updated);
                          saveProjectToStorage({ ...updated });
                          toast.success("Asset removed");
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <h4 className="font-semibold text-slate-900 text-sm truncate">{asset.name}</h4>
                    <p className="text-xs text-slate-600 mt-1">{asset.size}</p>
                    <p className="text-xs text-slate-600">by {asset.uploadedBy}</p>
                    <div className="flex gap-2 mt-3">
                      {asset.link ? (
                        <Button size="sm" variant="outline" className="w-full" onClick={() => window.open(asset.link, "_blank")}>
                          <Link2 className="w-3 h-3 mr-1" /> Open in Drive
                        </Button>
                      ) : asset.preview?.startsWith("http") ? (
                        <Button size="sm" variant="outline" className="w-full" onClick={() => window.open(asset.preview, "_blank")}>
                          <Download className="w-3 h-3 mr-1" /> View
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="w-full" onClick={() => handleDownloadAsset(asset.name)}>
                          <Download className="w-3 h-3 mr-1" /> Download
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card className="glass rounded-2xl p-6 hover-lift">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Team Members</h3>
              <div className="space-y-4">
                {displayTeam.map((member: { id: string; name: string; role: string; avatar: string; email?: string }) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-white/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                        {member.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{member.name}</p>
                        <p className="text-sm text-slate-600">{member.role}</p>
                        {member.email && <p className="text-xs text-slate-400">{member.email}</p>}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setLocation("/members")}>
                      View Profile
                    </Button>
                  </div>
                ))}
                {displayTeam.length === 0 && (
                  <p className="text-sm text-slate-400 py-4 text-center">No team members assigned</p>
                )}
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

      {/* Team Chat Floating Panel */}
      <div className="fixed bottom-6 right-6 z-30">
        {!showTeamChat ? (
          <button
            onClick={() => setShowTeamChat(true)}
            className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-teal-500 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all hover:scale-110"
          >
            <MessagesSquare className="w-6 h-6" />
          </button>
        ) : (
          <Card className="glass rounded-2xl shadow-2xl w-80 sm:w-96 overflow-hidden">
            <div className="p-3 border-b border-white/20 bg-white/40 flex justify-between items-center">
              <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                <MessagesSquare className="w-4 h-4 text-indigo-600" />
                Client Chat
              </h4>
              <button
                onClick={() => setShowTeamChat(false)}
                className="p-1 hover:bg-white/50 rounded transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="h-72 overflow-y-auto p-3 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  No messages from client yet.
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "team" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${
                        msg.role === "team"
                          ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-br-sm"
                          : "bg-white/70 text-slate-900 rounded-bl-sm border border-white/30"
                      }`}
                    >
                      <p className="font-medium opacity-75 mb-0.5">{msg.sender}</p>
                      <p>{msg.text}</p>
                      <p className="text-[10px] opacity-60 mt-1 text-right">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-white/20 bg-white/30 flex gap-2">
              <Input
                placeholder="Reply to client..."
                className="glass-sm flex-1 text-xs h-8"
                value={teamChatInput}
                onChange={(e) => setTeamChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleTeamSend();
                  }
                }}
              />
              <Button size="sm" onClick={handleTeamSend} className="bg-gradient-to-r from-teal-500 to-teal-600 text-white h-8 px-3">
                <Send className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        )}
      </div>

      <AlertDialog open={showCompleteConfirm} onOpenChange={setShowCompleteConfirm}>
        <AlertDialogContent className="glass">
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              All tasks are completed! Would you like to mark <strong>{project.name}</strong> as completed and generate a bill?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelComplete}>Not Yet</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmComplete} className="bg-gradient-to-r from-indigo-600 to-indigo-700">
              Yes, Complete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
