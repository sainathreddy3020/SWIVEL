import React, { useState, useEffect } from "react";
import { 
  Users, 
  CheckSquare, 
  LogOut, 
  Shield, 
  User, 
  BarChart3, 
  Briefcase,
  Layers,
  RefreshCw
} from "lucide-react";
import LoginPanel from "./components/LoginPanel";
import AdminDashboard from "./components/AdminDashboard";
import EmployeeDashboard from "./components/EmployeeDashboard";
import ReportsPanel from "./components/ReportsPanel";
import { User as UserType, Employee, Task } from "./types";

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  // Navigation for Admin
  const [adminSection, setAdminSection] = useState<'dashboard' | 'reports'>("dashboard");

  // Check login on load
  useEffect(() => {
    const storedToken = localStorage.getItem("work_tracker_token");
    const storedUser = localStorage.getItem("work_tracker_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLoginSuccess = (newToken: string, newUser: UserType) => {
    localStorage.setItem("work_tracker_token", newToken);
    localStorage.setItem("work_tracker_user", JSON.stringify(newUser));
    setToken(newToken);
    setCurrentUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("work_tracker_token");
    localStorage.removeItem("work_tracker_user");
    setToken(null);
    setCurrentUser(null);
    setEmployees([]);
    setTasks([]);
  };

  const loadData = async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    try {
      // Load employees list
      const empRes = await fetch("/api/employees", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData);
      }

      // Load tasks list
      const taskRes = await fetch("/api/tasks", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (taskRes.ok) {
        const taskData = await taskRes.json();
        setTasks(taskData);
      }
    } catch (err) {
      console.error("Failed to load full-stack datasets:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
      
      // Real-time background sync interval every 4 seconds
      const syncInterval = setInterval(() => {
        loadData(true);
      }, 4000);

      return () => clearInterval(syncInterval);
    }
  }, [token]);

  if (!token || !currentUser) {
    return <LoginPanel onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col font-sans">
      
      {/* Primary Portal Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3.5">
              <div className="h-9 w-9 rounded-xl bg-[#3B82F6] flex items-center justify-center text-white shadow-md shadow-blue-100">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <span className="font-extrabold text-[#0F172A] tracking-tight text-sm block">Swivel Reach</span>
                <span className="text-[10px] text-[#3B82F6] font-bold uppercase tracking-wider block">Enterprise Workspace</span>
              </div>
            </div>

            {/* Admin Header Section Controls */}
            {currentUser.role === "admin" && (
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setAdminSection("dashboard")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    adminSection === "dashboard" 
                      ? "bg-slate-100 text-[#2563EB]" 
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  <span>Admin Workspace</span>
                </button>

                <button
                  onClick={() => setAdminSection("reports")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    adminSection === "reports" 
                      ? "bg-slate-100 text-[#2563EB]" 
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytical Reports</span>
                </button>
              </div>
            )}

            {/* User Badging */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => loadData(false)}
                disabled={loading}
                className="p-2 border border-slate-200 hover:border-blue-200 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-xl transition-all cursor-pointer flex items-center space-x-1"
                title="Refresh datasets manually"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
                <span className="hidden md:inline text-[10px] font-bold uppercase tracking-wider px-0.5">Sync</span>
              </button>

              <div className="flex items-center space-x-2.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
                {currentUser.role === "admin" ? (
                  <Shield className="h-4 w-4 text-[#3B82F6] shrink-0" />
                ) : (
                  <User className="h-4 w-4 text-emerald-600 shrink-0" />
                )}
                <div className="text-left leading-tight">
                  <span className="block text-xs font-bold text-slate-900">{currentUser.name}</span>
                  <span className="block text-[10px] text-slate-400 capitalize font-medium">{currentUser.role} Portal</span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl transition-all cursor-pointer"
                title="Sign out of sessions"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Container Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentUser.role === "admin" ? (
          adminSection === "dashboard" ? (
            <AdminDashboard 
              token={token}
              onLogout={handleLogout}
              adminName={currentUser.name}
              employees={employees}
              tasks={tasks}
              onRefreshData={loadData}
            />
          ) : (
            <ReportsPanel 
              token={token}
              employees={employees}
            />
          )
        ) : (
          <EmployeeDashboard 
            token={token}
            onLogout={handleLogout}
            employeeName={currentUser.name}
            employeeId={currentUser.employeeId || ""}
            tasks={tasks}
            onRefreshData={loadData}
          />
        )}
      </main>

    </div>
  );
}
