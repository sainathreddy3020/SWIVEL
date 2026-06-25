import React, { useState, useEffect } from "react";
import { 
  Users, 
  CheckSquare, 
  Clock, 
  Activity, 
  TrendingUp, 
  UserPlus, 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  RefreshCw, 
  Search,
  Briefcase,
  AlertTriangle,
  UserCheck,
  Calendar
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Employee, Task, DashboardStats } from "../types";
import EmployeeModal from "./EmployeeModal";
import TaskModal from "./TaskModal";

interface AdminDashboardProps {
  token: string;
  onLogout: () => void;
  adminName: string;
  employees: Employee[];
  tasks: Task[];
  onRefreshData: () => Promise<void>;
}

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AdminDashboard({ 
  token, 
  onLogout, 
  adminName, 
  employees, 
  tasks,
  onRefreshData 
}: AdminDashboardProps) {
  
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'tasks'>("overview");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Search and Filters
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeDeptFilter, setEmployeeDeptFilter] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState("");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState("");

  // Modals state
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await fetch("/api/dashboard/stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token, employees, tasks]);

  const handleSaveEmployee = async (employeeData: any) => {
    const url = editingEmployee ? `/api/employees/${editingEmployee.id}` : "/api/employees";
    const method = editingEmployee ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(employeeData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to register employee info");
    }

    await onRefreshData();
    fetchStats();
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error("Failed to delete employee profile");
      }

      setEmployeeToDelete(null);
      await onRefreshData();
      fetchStats();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveTask = async (taskData: any) => {
    const url = editingTask ? `/api/tasks/${editingTask.id}` : "/api/tasks";
    const method = editingTask ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(taskData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to assign task context");
    }

    await onRefreshData();
    fetchStats();
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error("Failed to remove task");
      }

      setTaskToDelete(null);
      await onRefreshData();
      fetchStats();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openAddEmployee = () => {
    setEditingEmployee(null);
    setIsEmployeeModalOpen(true);
  };

  const openEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setIsEmployeeModalOpen(true);
  };

  const openAddTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  // Filter lists
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) || 
                          emp.email.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                          emp.designation.toLowerCase().includes(employeeSearch.toLowerCase());
    const matchesDept = employeeDeptFilter ? emp.department === employeeDeptFilter : true;
    return matchesSearch && matchesDept;
  });

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(taskSearch.toLowerCase()) || 
                          t.description.toLowerCase().includes(taskSearch.toLowerCase());
    const matchesStatus = taskStatusFilter ? t.status === taskStatusFilter : true;
    const matchesPriority = taskPriorityFilter ? t.priority === taskPriorityFilter : true;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Unique departments for filtering
  const departments = Array.from(new Set(employees.map(e => e.department)));

  const productivityPct = stats && stats.totalTasks 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;

  // Dynamic calculation of top performers based on real tasks & employees
  const computedPerformers = employees.map(emp => {
    const empTasks = tasks.filter(t => t.assignedTo === emp.id);
    const total = empTasks.length;
    const completed = empTasks.filter(t => t.status === "completed").length;
    const score = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      id: emp.id,
      name: emp.name,
      score: score
    };
  }).filter(perf => perf.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);

  const topPerformers = computedPerformers;

  // Dynamic priority task queue from actual tasks
  const realPriorityTasks = tasks.filter(t => t.status !== "completed");
  const priorityTasks = realPriorityTasks.length > 0 
    ? [...realPriorityTasks]
        .sort((a, b) => {
          const w = { high: 3, medium: 2, low: 1 };
          return w[b.priority] - w[a.priority];
        })
        .slice(0, 3)
    : [...tasks]
        .sort((a, b) => {
          const w = { high: 3, medium: 2, low: 1 };
          return w[b.priority] - w[a.priority];
        })
        .slice(0, 3);

  return (
    <div className="space-y-6">
      
      {/* Overview Dashboard Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Dashboard Stats Cards: Beautiful Bento Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between h-[130px] hover:shadow-md hover:border-slate-300 transition-all">
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Total Employees</span>
                <span className="block text-3xl font-extrabold text-[#0F172A] tracking-tight">{stats?.totalEmployees ?? employees.length}</span>
              </div>
              <div className="text-[11px] text-[#10B981] font-semibold mt-auto flex items-center gap-1">
                ↑ 4% this month
              </div>
            </div>

            <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between h-[130px] hover:shadow-md hover:border-slate-300 transition-all">
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Active Tasks</span>
                <span className="block text-3xl font-extrabold text-[#0F172A] tracking-tight">
                  {((stats?.inProgressTasks ?? 0) + (stats?.pendingTasks ?? 0)) || tasks.filter(t => t.status !== 'completed').length}
                </span>
              </div>
              <div className="text-[11px] text-[#64748B] font-semibold mt-auto">
                Across {departments.length || 3} departments
              </div>
            </div>

            <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between h-[130px] hover:shadow-md hover:border-slate-300 transition-all">
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Completion Rate</span>
                <span className="block text-3xl font-extrabold text-[#3B82F6] tracking-tight">{productivityPct}%</span>
              </div>
              <div className="text-[11px] text-[#3B82F6] font-semibold mt-auto">
                Target: 90%
              </div>
            </div>

            <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between h-[130px] hover:shadow-md hover:border-slate-300 transition-all">
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Avg Velocity</span>
                <span className="block text-3xl font-extrabold text-[#F59E0B] tracking-tight">
                  {stats?.completedTasks ? (stats.completedTasks * 1.2 || 4.2).toFixed(1) : "4.2"}
                </span>
              </div>
              <div className="text-[11px] text-[#F59E0B] font-semibold mt-auto">
                Pts per day
              </div>
            </div>

          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            
            {/* Box 1: Productivity Trends (Span-2 Columns, Row Span-2 equivalent on big screen) */}
            <div className="lg:col-span-2 bg-white p-5 border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Productivity Trends</span>
                    <h3 className="text-base font-extrabold text-[#0F172A]">Weekly Task Performance</h3>
                  </div>
                  <button onClick={fetchStats} className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="h-56 mt-4">
                  {stats?.productivityTrend ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.productivityTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0F172A" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#0F172A" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                        <Area type="monotone" dataKey="completed" name="Completed Tasks" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCompleted)" />
                        <Area type="monotone" dataKey="created" name="Created Tasks" stroke="#0F172A" strokeWidth={2} fillOpacity={1} fill="url(#colorCreated)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">Generating trends...</div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-[#94A3B8] font-semibold border-t border-slate-100 pt-3 mt-4">
                <span>Created vs Completed cycles</span>
                <span className="text-[#3B82F6] flex items-center gap-1">● Active Tracker</span>
              </div>
            </div>

            {/* Box 2: Recent Activity */}
            <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Recent Activity</span>
                <h3 className="text-base font-extrabold text-[#0F172A] mb-4">Operations Feed</h3>
                
                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                  {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                    stats.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex gap-3">
                        <div className={`mt-1.5 min-w-[8px] h-2 rounded-full ${
                          activity.type === 'employee_added' ? 'bg-[#10B981]' :
                          activity.type === 'task_created' ? 'bg-[#3B82F6]' :
                          activity.type === 'report_submitted' ? 'bg-[#F59E0B]' : 'bg-slate-400'
                        }`} />
                        <div className="flex-1">
                          <p className="text-xs text-slate-700 leading-normal font-medium">
                            <b>{activity.user}</b> {activity.description.replace(activity.user, "").trim()}
                          </p>
                          <span className="block text-[11px] text-slate-400 mt-1 font-mono">
                            {activity.time.includes('T') ? new Date(activity.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : activity.time}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-slate-400 text-xs">No recent log entries detected</div>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-semibold border-t border-slate-100 pt-3 mt-4 flex items-center justify-between">
                <span>System health online</span>
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              </div>
            </div>

            {/* Box 3: Top Performers */}
            <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Top Performers</span>
                <h3 className="text-base font-extrabold text-[#0F172A] mb-4">Productivity Standing</h3>
                
                <div className="space-y-4">
                  {topPerformers.length > 0 ? (
                    topPerformers.map((perf) => (
                      <div key={perf.id} className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#F1F5F9] border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
                          {perf.name.split(" ").map(n=>n[0]).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-800 truncate">{perf.name}</span>
                            <span className="text-[10px] font-bold text-[#3B82F6]">{perf.score}%</span>
                          </div>
                          <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full mt-1 overflow-hidden">
                            <div 
                              className="bg-[#3B82F6] h-full rounded-full transition-all"
                              style={{ width: `${perf.score}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-slate-400 text-xs font-medium">
                      No productivity standings registered yet
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-semibold border-t border-slate-100 pt-3 mt-4">
                Based on active task outcomes
              </div>
            </div>

            {/* Box 4: Priority Task Queue (Span-3 Columns) */}
            <div className="lg:col-span-3 bg-white p-5 border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Priority Task Queue</span>
              <h3 className="text-base font-extrabold text-[#0F172A] mb-4">Critical Pending Workflows</h3>
              
              <div className="divide-y divide-slate-100">
                {priorityTasks.length > 0 ? (
                  priorityTasks.map((t) => (
                    <div key={t.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-[#0F172A] truncate">{t.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-1">Assignee: {t.assignedToName || "Unassigned"}</p>
                      </div>
                      <div>
                        <span className={`status-chip px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          t.priority === 'high' ? 'bg-[#FEE2E2] text-[#EF4444]' :
                          t.priority === 'medium' ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-[#DCFCE7] text-[#16A34A]'
                        }`}>
                          {t.priority}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] text-[#64748B] font-medium">Due: {t.dueDate}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-slate-400 text-xs">No active priority tasks found</div>
                )}
              </div>
            </div>

            {/* Box 5: Department Allocations Pie / Quick Shortcuts Combined (Span-1) */}
            <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Department Allocation</span>
                
                <div className="h-28 flex items-center justify-center relative my-1">
                  {stats?.departmentDistribution ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.departmentDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={45}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {stats.departmentDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-slate-400 text-[10px]">No allocations</div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 mt-2">
                <button 
                  onClick={openAddEmployee}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold text-[11px] transition-colors cursor-pointer"
                >
                  <span>+ Add Team Member</span>
                </button>
                <button 
                  onClick={openAddTask}
                  className="w-full flex items-center justify-between px-3 py-2 bg-[#3B82F6] hover:bg-blue-700 text-white rounded-xl font-bold text-[11px] transition-colors cursor-pointer"
                >
                  <span>+ Assign Task</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Employees Administration Tab */}
      {activeTab === "employees" && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          
          {/* Filters Bar */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/70">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Users className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">Registered Employees</h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search team..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 w-full sm:w-56 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs bg-white"
                />
              </div>

              <select
                value={employeeDeptFilter}
                onChange={(e) => setEmployeeDeptFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs bg-white"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              <button 
                onClick={openAddEmployee}
                className="flex items-center justify-center space-x-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-100 transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Employee</span>
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/40">
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Name & Designation</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Date of Joining</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-xs uppercase">
                            {emp.name.split(" ").map(n=>n[0]).join("")}
                          </div>
                          <div>
                            <span className="block text-sm font-semibold text-slate-900">{emp.name}</span>
                            <span className="block text-xs text-slate-400">{emp.designation}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-600">{emp.department}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{emp.email}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{emp.dateOfJoining}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          emp.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{emp.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button 
                            onClick={() => openEditEmployee(emp)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => setEmployeeToDelete(emp)}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-xs">
                      No employees registered matching current criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tasks Board Administration Tab */}
      {activeTab === "tasks" && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          
          {/* Filters Bar */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/70">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <CheckSquare className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">Allocated Tasks List</h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search task board..."
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 w-full sm:w-48 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs bg-white"
                />
              </div>

              <select
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs bg-white"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>

              <select
                value={taskPriorityFilter}
                onChange={(e) => setTaskPriorityFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs bg-white"
              >
                <option value="">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>

              <button 
                onClick={openAddTask}
                className="flex items-center justify-center space-x-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-100 transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Assign Task</span>
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/40">
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Task Context</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <span className="block text-sm font-semibold text-slate-900">{t.title}</span>
                          <span className="block text-xs text-slate-400 truncate max-w-sm">{t.description}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-slate-600 flex items-center space-x-1.5">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          <span>{t.assignedToName || "Unassigned"}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          t.priority === 'high' ? 'bg-rose-50 text-rose-700' :
                          t.priority === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">{t.dueDate}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          t.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                          t.status === 'in_progress' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button 
                            onClick={() => openEditTask(t)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => setTaskToDelete(t)}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-xs">
                      No tasks allocated matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Embedded Navigation Bar inside view */}
      <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm flex items-center justify-between mt-6">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "overview" ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            Dashboard Overview
          </button>
          <button
            onClick={() => setActiveTab("employees")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "employees" ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            Team Registry ({employees.length})
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "tasks" ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            Tasks Directory ({tasks.length})
          </button>
        </div>

        <div className="flex items-center space-x-3 text-slate-400 text-xs">
          <span className="hidden sm:inline font-medium text-slate-600">Admin: {adminName}</span>
          <button 
            onClick={onLogout}
            className="px-3.5 py-1.5 border border-slate-200 hover:border-slate-300 rounded-xl hover:bg-slate-50 text-slate-600 font-semibold transition-all cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Employee Modal */}
      <EmployeeModal 
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        onSave={handleSaveEmployee}
        employee={editingEmployee}
      />

      {/* Task Modal */}
      <TaskModal 
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        employees={employees}
      />

      {/* Custom Delete Confirmation Modal for Employees */}
      {employeeToDelete && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6">
              <div className="flex items-center space-x-3 text-rose-600 mb-4">
                <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Delete Employee Profile</h3>
              </div>
              <p className="text-sm text-slate-500 mb-2 leading-relaxed">
                Are you sure you want to remove <span className="font-semibold text-slate-800">{employeeToDelete.name}</span>?
              </p>
              <p className="text-xs text-rose-500 bg-rose-50/50 p-2.5 rounded-xl border border-rose-100 mb-6">
                This will permanently deactivate their login credentials (<span className="font-mono">{employeeToDelete.email}</span>) and set any of their currently assigned tasks to unassigned. This action cannot be undone.
              </p>
              <div className="flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setEmployeeToDelete(null)}
                  className="px-4 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteEmployee(employeeToDelete.id)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Confirm Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal for Tasks */}
      {taskToDelete && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6">
              <div className="flex items-center space-x-3 text-rose-600 mb-4">
                <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Remove Task Assignment</h3>
              </div>
              <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                Are you sure you want to remove the task <span className="font-semibold text-slate-800">"{taskToDelete.title}"</span>?
              </p>
              <div className="flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setTaskToDelete(null)}
                  className="px-4 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTask(taskToDelete.id)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Confirm Remove</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
