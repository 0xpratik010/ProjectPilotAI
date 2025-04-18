import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import SettingsPage from "@/pages/SettingsPage";
import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <TooltipProvider>
      <Toaster />
      <div className="min-h-screen flex">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        
        <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
          <TopNav toggleSidebar={toggleSidebar} />
          
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/analytics" component={AnalyticsPage} />
            <Route path="/settings" component={SettingsPage} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default App;
