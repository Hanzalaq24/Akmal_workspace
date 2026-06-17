import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import { Redirect, Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import ProjectDetail from "./pages/ProjectDetail";
import ClientPortal from "./pages/ClientPortal";
import Landing from "./pages/Landing";
import Services from "./pages/Services";
import Members from "./pages/Members";
import SettingsPage from "./pages/Settings";
import ItemsPage from "./pages/Items";
import ClientsPage from "./pages/Clients";

function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>; path?: string }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    return <Redirect to="/login" />;
  }
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Landing} />
      <Route path={"/login"} component={Login} />
      <Route path={"/signup"} component={Signup} />
      <Route path={"/client/:projectId"} component={ClientPortal} />
      <Route path={"/dashboard"}>
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path={"/project/:id"}>
        <ProtectedRoute component={ProjectDetail} />
      </Route>
      <Route path={"/services"}>
        <ProtectedRoute component={Services} />
      </Route>
      <Route path={"/members"}>
        <ProtectedRoute component={Members} />
      </Route>
      <Route path={"/settings"}>
        <ProtectedRoute component={SettingsPage} />
      </Route>
      <Route path={"/items"}>
        <ProtectedRoute component={ItemsPage} />
      </Route>
      <Route path={"/clients"}>
        <ProtectedRoute component={ClientsPage} />
      </Route>
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
