import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, BarChart3, Kanban, Users, Zap, FileText, Bell, LogIn } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-teal-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AH</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Akmal Creative Hub</h1>
          </div>
          <div className="flex gap-3 items-center">
            {user ? (
              <>
                <span className="text-sm text-slate-600 hidden sm:inline">{user.name}</span>
                <Button onClick={() => setLocation("/dashboard")} className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                  Dashboard
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { logout(); setLocation("/"); }}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setLocation("/login")}>
                  <LogIn className="w-4 h-4 mr-2" /> Sign In
                </Button>
                <Button onClick={() => setLocation("/signup")} className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
              ✨ AI-Powered Project Management
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
              Manage Projects Like a Pro
            </h2>
            <p className="text-xl text-slate-600 leading-relaxed">
              Advanced project management with AI assistance, real-time analytics, Kanban boards, and seamless team collaboration. Built for modern teams.
            </p>
            <div className="flex gap-4 pt-4">
              <Button 
                onClick={() => setLocation("/dashboard")}
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all"
              >
                Launch Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Learn More
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-teal-400/20 rounded-3xl blur-3xl"></div>
            <div className="relative glass rounded-3xl p-8 space-y-4">
              <div className="space-y-3">
                <div className="h-3 bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full w-2/3"></div>
                <div className="h-2 bg-slate-200 rounded-full w-full"></div>
                <div className="h-2 bg-slate-200 rounded-full w-5/6"></div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4">
                <div className="h-20 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-lg"></div>
                <div className="h-20 bg-gradient-to-br from-teal-100 to-teal-50 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold text-slate-900 mb-4">Powerful Features</h3>
          <p className="text-xl text-slate-600">Everything you need to manage projects efficiently</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="glass rounded-2xl p-8 hover-lift group">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900 mb-2">Advanced Analytics</h4>
            <p className="text-slate-600">Visual insights into project progress, team workload, and budget utilization with interactive charts.</p>
          </div>

          {/* Feature 2 */}
          <div className="glass rounded-2xl p-8 hover-lift group">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-teal-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Kanban className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900 mb-2">Kanban Board</h4>
            <p className="text-slate-600">Drag-and-drop workflow with visual priority indicators. Move tasks seamlessly between stages.</p>
          </div>

          {/* Feature 3 */}
          <div className="glass rounded-2xl p-8 hover-lift group">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900 mb-2">AI Assistant</h4>
            <p className="text-slate-600">Smart project summaries and automated task generation. Get AI-powered insights instantly.</p>
          </div>

          {/* Feature 4 */}
          <div className="glass rounded-2xl p-8 hover-lift group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900 mb-2">Client Portal</h4>
            <p className="text-slate-600">Restricted access for clients to track milestones and approve deliverables securely.</p>
          </div>

          {/* Feature 5 */}
          <div className="glass rounded-2xl p-8 hover-lift group">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900 mb-2">Asset Management</h4>
            <p className="text-slate-600">Centralized storage for logos, wireframes, and documents with preview thumbnails.</p>
          </div>

          {/* Feature 6 */}
          <div className="glass rounded-2xl p-8 hover-lift group">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-pink-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900 mb-2">Notifications</h4>
            <p className="text-slate-600">Real-time updates for task assignments, deadlines, and client feedback with activity feed.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="glass rounded-3xl p-12 md:p-16 text-center">
          <h3 className="text-4xl font-bold text-slate-900 mb-4">Ready to Transform Your Workflow?</h3>
          <p className="text-xl text-slate-600 mb-8">Start managing projects with AI-powered insights and real-time collaboration.</p>
          <Button 
            onClick={() => setLocation("/dashboard")}
            size="lg"
            className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all"
          >
            Get Started Now <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-600">
          <p>&copy; 2026 Akmal Creative Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
