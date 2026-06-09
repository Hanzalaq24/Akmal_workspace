import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, MessageSquare, ThumbsUp, ThumbsDown, FileText, Download } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";

interface Milestone {
  id: string;
  name: string;
  description: string;
  status: "pending" | "in-review" | "approved" | "rejected";
  dueDate: string;
  deliverables: string[];
  feedback?: string;
}

export default function ClientPortal() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/client/:projectId");
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedback, setFeedback] = useState("");

  // Load project from localStorage
  const savedProjects = (() => {
    try {
      const saved = localStorage.getItem("akmal-projects");
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  })();

  const foundProject = savedProjects?.find((p: any) => p.id === params?.projectId);

  const clientProject = foundProject
    ? {
        id: foundProject.id,
        name: foundProject.name,
        clientName: foundProject.client,
        projectManager: foundProject.team?.[0] || "Project Manager",
        startDate: new Date().toISOString().split("T")[0],
        endDate: foundProject.deadline || "",
        status: foundProject.status === "active" ? "In Progress" : foundProject.status,
        progress: foundProject.progress || 0,
        milestones: [] as Milestone[],
        updates: [] as { id: string; title: string; content: string; date: string; author: string }[],
      }
    : null;

  if (!match) return null;

  if (!clientProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/20 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Project Not Found</h2>
          <p className="text-slate-600 mb-6">The client portal you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleApproveMilestone = () => {
    toast.success("Milestone approved successfully!");
  };

  const handleRejectMilestone = () => {
    toast.success("Feedback submitted. The team will review your comments.");
    setShowFeedbackDialog(false);
  };

  const getMilestoneIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "in-review":
        return <Clock className="w-5 h-5 text-orange-600" />;
      case "rejected":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getMilestoneColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "in-review":
        return "bg-orange-100 text-orange-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
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
              <h1 className="text-2xl font-bold text-slate-900">Client Portal</h1>
              <p className="text-sm text-slate-600">{clientProject.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-600">Project Manager</p>
            <p className="font-semibold text-slate-900">{clientProject.projectManager}</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass rounded-2xl p-6 hover-lift">
            <p className="text-xs text-slate-600 uppercase font-semibold">Status</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{clientProject.status}</p>
          </Card>

          <Card className="glass rounded-2xl p-6 hover-lift">
            <p className="text-xs text-slate-600 uppercase font-semibold">Overall Progress</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{clientProject.progress}%</p>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
              <div 
                className="bg-gradient-to-r from-indigo-600 to-teal-500 h-2 rounded-full"
                style={{ width: `${clientProject.progress}%` }}
              />
            </div>
          </Card>

          <Card className="glass rounded-2xl p-6 hover-lift">
            <p className="text-xs text-slate-600 uppercase font-semibold">Start Date</p>
            <p className="text-lg font-bold text-slate-900 mt-2">{clientProject.startDate}</p>
          </Card>

          <Card className="glass rounded-2xl p-6 hover-lift">
            <p className="text-xs text-slate-600 uppercase font-semibold">End Date</p>
            <p className="text-lg font-bold text-slate-900 mt-2">{clientProject.endDate}</p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="milestones" className="w-full">
          <TabsList className="glass rounded-2xl p-1 mb-6">
            <TabsTrigger value="milestones" className="rounded-lg">Milestones</TabsTrigger>
            <TabsTrigger value="updates" className="rounded-lg">Updates</TabsTrigger>
            <TabsTrigger value="deliverables" className="rounded-lg">Deliverables</TabsTrigger>
          </TabsList>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="space-y-6">
            <div className="space-y-4">
              {clientProject.milestones.map((milestone, idx) => (
                <Card 
                  key={milestone.id} 
                  className="glass rounded-2xl p-6 hover-lift cursor-pointer transition-all"
                  onClick={() => setSelectedMilestone(milestone as Milestone)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="mt-1">
                        {getMilestoneIcon(milestone.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">{milestone.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMilestoneColor(milestone.status)}`}>
                            {milestone.status.replace("-", " ").charAt(0).toUpperCase() + milestone.status.replace("-", " ").slice(1)}
                          </span>
                        </div>
                        <p className="text-slate-600 mb-3">{milestone.description}</p>
                        <div className="flex items-center gap-6 text-sm text-slate-600">
                          <span>Due: {milestone.dueDate}</span>
                          <span>{milestone.deliverables.length} deliverables</span>
                        </div>
                      </div>
                    </div>

                    {milestone.status === "in-review" && (
                      <div className="flex gap-2">
                        <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <ThumbsDown className="w-4 h-4 mr-1" /> Request Changes
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="glass">
                            <DialogHeader>
                              <DialogTitle>Request Changes</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <textarea 
                                placeholder="Please provide your feedback and suggestions..."
                                className="w-full p-3 glass-sm rounded-lg border border-white/20 text-slate-900 placeholder-slate-500"
                                rows={5}
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                              />
                              <Button 
                                onClick={handleRejectMilestone}
                                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700"
                              >
                                Submit Feedback
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          size="sm"
                          className="bg-gradient-to-r from-green-600 to-green-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproveMilestone();
                          }}
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" /> Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Updates Tab */}
          <TabsContent value="updates" className="space-y-6">
            <Card className="glass rounded-2xl p-6 hover-lift">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Project Updates</h3>
              <div className="space-y-6">
                {clientProject.updates.map((update, idx) => (
                  <div key={update.id} className="pb-6 border-b border-white/20 last:border-0 last:pb-0">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-teal-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {update.author.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{update.title}</h4>
                        <p className="text-slate-600 mt-2">{update.content}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                          <span>{update.author}</span>
                          <span>{update.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Deliverables Tab */}
          <TabsContent value="deliverables" className="space-y-6">
            <div className="space-y-4">
              {clientProject.milestones.map(milestone => (
                <div key={milestone.id}>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">{milestone.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {milestone.deliverables.map((deliverable, idx) => (
                      <Card key={idx} className="glass rounded-xl p-4 hover-lift">
                        <div className="flex items-start justify-between mb-3">
                          <FileText className="w-6 h-6 text-indigo-600" />
                          <Button size="sm" variant="ghost">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                        <h4 className="font-semibold text-slate-900 text-sm">{deliverable}</h4>
                        <p className="text-xs text-slate-600 mt-2">
                          Status: <span className="text-green-600 font-medium">Delivered</span>
                        </p>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Contact Section */}
        <Card className="glass rounded-2xl p-8 mt-8 hover-lift">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Need Help?</h3>
          <p className="text-slate-600 mb-4">
            If you have any questions or concerns about the project, please reach out to your project manager.
          </p>
          <div className="flex gap-4">
            <Button className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
              <MessageSquare className="w-4 h-4 mr-2" /> Send Message
            </Button>
            <Button variant="outline">
              Schedule Call
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
