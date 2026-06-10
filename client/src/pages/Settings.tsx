import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, Settings2, HardDrive, Shield, Bell, Palette, Save, Key, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { setDriveApiKey, getDriveApiKey, setDriveFolderId, getDriveFolderId, setDriveFolderLink, getDriveFolderLink, extractFolderId, clearDriveConfig } from "@/lib/googleDrive";
import { toast } from "sonner";

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  // Profile
  const [profileName, setProfileName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Google Drive
  const [driveApiKey, setDriveApiKeyState] = useState(getDriveApiKey());
  const [driveFolderLink, setDriveFolderLinkState] = useState(getDriveFolderLink());

  const handleSaveProfile = () => {
    if (!profileName.trim()) { toast.error("Name is required"); return; }
    try {
      const users = JSON.parse(localStorage.getItem("akmal-users") || "[]");
      const idx = users.findIndex((u: any) => u.email === user?.email);
      if (idx !== -1) {
        users[idx].name = profileName.trim();
        localStorage.setItem("akmal-users", JSON.stringify(users));
      }
      // Update current user
      const current = JSON.parse(localStorage.getItem("akmal-current-user") || "{}");
      current.name = profileName.trim();
      localStorage.setItem("akmal-current-user", JSON.stringify(current));
      // Update members
      const members = JSON.parse(localStorage.getItem("akmal-members") || "[]");
      const midx = members.findIndex((m: any) => m.email === user?.email);
      if (midx !== -1) {
        members[midx].name = profileName.trim();
        members[midx].avatar = profileName.trim().split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
        localStorage.setItem("akmal-members", JSON.stringify(members));
      }
      toast.success("Profile updated! Reload page to see changes.");
    } catch { toast.error("Failed to update profile"); }
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword) { toast.error("All fields required"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    if (newPassword.length < 4) { toast.error("Min 4 characters"); return; }
    try {
      const users = JSON.parse(localStorage.getItem("akmal-users") || "[]");
      const idx = users.findIndex((u: any) => u.email === user?.email);
      if (idx === -1) { toast.error("User not found"); return; }
      if (users[idx].password !== currentPassword) { toast.error("Current password is incorrect"); return; }
      users[idx].password = newPassword;
      localStorage.setItem("akmal-users", JSON.stringify(users));
      toast.success("Password changed!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch { toast.error("Failed"); }
  };

  const handleSaveDriveSettings = () => {
    if (!driveApiKey.trim() || !driveFolderLink.trim()) {
      toast.error("Both API Key and Folder Link are required");
      return;
    }
    const folderId = extractFolderId(driveFolderLink.trim());
    if (!folderId) {
      toast.error("Invalid Drive folder link. Paste the full folder URL.");
      return;
    }
    setDriveApiKey(driveApiKey.trim());
    setDriveFolderId(folderId);
    setDriveFolderLink(driveFolderLink.trim());
    toast.success("Google Drive configured! Folder ID: " + folderId);
  };

  const handleClearAllData = () => {
    if (confirm("This will delete ALL projects, invoices, members, chats and users. Are you sure?")) {
      localStorage.clear();
      toast.success("All data cleared");
      logout();
      setLocation("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/20 to-white">
      <header className="sticky top-0 z-40 glass border-b border-white/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setLocation("/dashboard")} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
              <p className="text-sm text-slate-600">Manage your account & system</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="glass rounded-2xl p-1 mb-6 w-full justify-start overflow-x-auto">
            <TabsTrigger value="profile" className="rounded-lg"><User className="w-4 h-4 mr-1" /> Profile</TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg"><Shield className="w-4 h-4 mr-1" /> Security</TabsTrigger>
            <TabsTrigger value="drive" className="rounded-lg"><HardDrive className="w-4 h-4 mr-1" /> Google Drive</TabsTrigger>
            <TabsTrigger value="system" className="rounded-lg"><Settings2 className="w-4 h-4 mr-1" /> System</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="glass rounded-2xl p-8">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-2xl shrink-0">
                  {user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
                  <p className="text-sm text-slate-600">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="pName">Display Name</Label>
                  <Input id="pName" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="glass-sm" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ""} disabled className="glass-sm opacity-60" />
                </div>
                <Button onClick={handleSaveProfile} className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                  <Save className="w-4 h-4 mr-2" /> Save Profile
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="glass rounded-2xl p-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-600" /> Change Password
              </h3>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currPass">Current Password</Label>
                  <Input id="currPass" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="glass-sm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPass">New Password</Label>
                  <Input id="newPass" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="glass-sm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confPass">Confirm New Password</Label>
                  <Input id="confPass" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="glass-sm" />
                </div>
                <Button onClick={handleChangePassword} className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                  <Key className="w-4 h-4 mr-2" /> Update Password
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Google Drive Tab */}
          <TabsContent value="drive" className="space-y-6">
            <Card className="glass rounded-2xl p-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-indigo-600" /> Google Drive Integration
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                Connect <strong>akmal26426@gmail.com</strong>'s Google Drive folder (5TB). No OAuth needed.
              </p>

              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">Google Drive API Key</Label>
                  <Input id="apiKey" placeholder="AIza..." value={driveApiKey} onChange={(e) => setDriveApiKeyState(e.target.value)} className="glass-sm" />
                  <p className="text-xs text-slate-400">
                    From{" "}<a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="text-indigo-600 underline">Google Cloud Console</a> → APIs & Services → Credentials → Create API Key. Restrict it to Drive API.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="folderLink">Drive Folder Link</Label>
                  <Input id="folderLink" placeholder="https://drive.google.com/drive/folders/XXXXX" value={driveFolderLink} onChange={(e) => setDriveFolderLinkState(e.target.value)} className="glass-sm" />
                  <p className="text-xs text-slate-400">
                    Create a folder in akmal26426@gmail.com's Drive → Share → "Anyone with the link can view". Paste the folder URL here.
                  </p>
                </div>

                <Button onClick={handleSaveDriveSettings} className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                  <Save className="w-4 h-4 mr-2" /> Save & Connect
                </Button>

                <Button variant="outline" onClick={() => { clearDriveConfig(); setDriveApiKeyState(""); setDriveFolderLinkState(""); toast.success("Drive config cleared"); }} className="text-red-600">
                  Disconnect Drive
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card className="glass rounded-2xl p-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-indigo-600" /> System Actions
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-white/40 rounded-xl border border-white/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">Clear All Data</p>
                      <p className="text-sm text-slate-500">Delete all projects, invoices, members, chats and users.</p>
                    </div>
                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleClearAllData}>
                      <Shield className="w-4 h-4 mr-1" /> Clear Data
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-white/40 rounded-xl border border-white/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">Logout</p>
                      <p className="text-sm text-slate-500">Sign out of your account.</p>
                    </div>
                    <Button variant="outline" onClick={() => { logout(); setLocation("/"); }}>
                      <LogOut className="w-4 h-4 mr-1" /> Logout
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
