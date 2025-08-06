import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useState } from "react";
import { tokenService } from "../../lib/api/apiClient";
import AIAssistant from "../ai/AIAssistant";


const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    
    tokenService.logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {}
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} onLogout={handleLogout} />
      <Sidebar 
        open={sidebarOpen} 
        setOpen={setSidebarOpen} 
        onAIAssistantOpen={() => setIsAIAssistantOpen(true)}
      />
      <main className="pt-16 p-6 lg:pl-72">
        <Outlet />
      </main>
      
      {}
      <AIAssistant 
        isOpen={isAIAssistantOpen} 
        onClose={() => setIsAIAssistantOpen(false)} 
      />
    </div>
  );
};

export default DashboardLayout;
