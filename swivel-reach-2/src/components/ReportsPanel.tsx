import React, { useState, useEffect } from "react";
import { 
  FileSpreadsheet, 
  Printer, 
  Filter, 
  RefreshCw, 
  ChevronRight, 
  User, 
  CheckCircle2, 
  Clock, 
  AlertTriangle 
} from "lucide-react";
import { Employee } from "../types";

interface ReportsPanelProps {
  token: string;
  employees: Employee[];
}

export default function ReportsPanel({ token, employees }: ReportsPanelProps) {
  const [reportType, setReportType] = useState<'task' | 'employee'>("task");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchReport = async () => {
    setLoading(true);
    setError("");
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("type", reportType);
      if (selectedEmployee) queryParams.append("employeeId", selectedEmployee);
      if (selectedStatus) queryParams.append("status", selectedStatus);
      if (selectedPriority) queryParams.append("priority", selectedPriority);
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);

      const response = await fetch(`/api/reports/export?${queryParams.toString()}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch report data");
      }

      const reportData = await response.json();
      setData(reportData);
    } catch (err: any) {
      setError(err.message || "Failed to load report. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedEmployee, selectedStatus, selectedPriority, startDate, endDate]);

  const exportCSV = () => {
    if (!data.length) return;

    let headers: string[] = [];
    let rows: string[][] = [];

    if (reportType === "task") {
      headers = ["Task ID", "Title", "Assigned Employee", "Department", "Priority", "Status", "Due Date", "Progress (%)"];
      rows = data.map(item => [
        item.id,
        item.title,
        item.assignedToName,
        item.department,
        item.priority,
        item.status,
        item.dueDate,
        `${item.progress}%`
      ]);
    } else {
      headers = ["Employee Name", "Email", "Department", "Designation", "Total Tasks", "Completed Tasks", "In Progress", "Productivity Score (%)"];
      rows = data.map(item => [
        item.name,
        item.email,
        item.department,
        item.designation,
        item.totalTasks,
        item.completedTasks,
        item.inProgressTasks,
        `${item.productivityScore}%`
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Swivel_Reach_${reportType}_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Printable Header - Hidden on screen, shown in print */}
      <div className="hidden print:block text-center space-y-2 mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Swivel Reach - Executive Summary</h1>
        <p className="text-sm text-slate-500">Report Type: {reportType === 'task' ? 'Task Allocations & Progress' : 'Employee Performance Metrics'}</p>
        <p className="text-xs text-slate-400">Generated on: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Control Actions Panel */}
      <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Report Selector Toggles */}
          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl self-start">
            <button
              onClick={() => setReportType("task")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                reportType === "task" 
                  ? "bg-white text-slate-950 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Task-wise Reports
            </button>
            <button
              onClick={() => setReportType("employee")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                reportType === "employee" 
                  ? "bg-white text-slate-950 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Employee Performance
            </button>
          </div>

          {/* Export Toggles */}
          <div className="flex items-center space-x-2">
            <button
              onClick={exportCSV}
              disabled={!data.length}
              className="flex items-center space-x-2 px-4 py-2 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-xl text-xs font-medium transition-all cursor-pointer disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-transparent disabled:hover:text-slate-600"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Export Excel (CSV)</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={!data.length}
              className="flex items-center space-x-2 px-4 py-2 border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-xl text-xs font-medium transition-all cursor-pointer disabled:opacity-40"
            >
              <Printer className="h-4 w-4" />
              <span>Print PDF Report</span>
            </button>
            <button
              onClick={fetchReport}
              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition-all cursor-pointer"
              title="Refresh Report Data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-5 pt-5 border-t border-slate-100">
          {reportType === "task" && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Employee</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                <option value="">All Employees</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          )}

          {reportType === "task" && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          )}

          {reportType === "task" && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Priority</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Report Data Display Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-sm text-slate-500">Generating report summary tables...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-600 space-y-2">
            <p className="font-semibold">Failed to process report</p>
            <p className="text-xs">{error}</p>
          </div>
        ) : !data.length ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Filter className="h-8 w-8 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-500 text-sm">No Matching Logs Found</p>
            <p className="text-xs">Adjust your criteria or filter parameters above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              {reportType === "task" ? (
                <>
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Task Title</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Assignee</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Dept</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Completion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.map((task) => (
                      <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900 text-sm">{task.title}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{task.description}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{task.assignedToName}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">{task.department}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            task.priority === 'high' ? 'bg-rose-50 text-rose-700' :
                            task.priority === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            task.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                            task.status === 'in_progress' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {task.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                            {task.status === 'in_progress' && <Clock className="h-3 w-3" />}
                            {task.status === 'pending' && <AlertTriangle className="h-3 w-3" />}
                            <span className="capitalize">{task.status.replace('_', ' ')}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">{task.dueDate}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <span className="text-xs font-bold text-slate-700">{task.progress}%</span>
                            <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${task.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              ) : (
                <>
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Info</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tasks</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Completed</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Pending/In-Prog</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Productivity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900 text-sm flex items-center space-x-2">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <span>{emp.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">{emp.designation}</div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600">{emp.email}</td>
                        <td className="px-6 py-4 text-xs text-slate-500 font-medium">{emp.department}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">{emp.totalTasks}</td>
                        <td className="px-6 py-4 text-sm text-emerald-600 font-semibold">{emp.completedTasks}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {emp.pendingTasks} Pending / {emp.inProgressTasks} Progress
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <span className="text-xs font-bold text-slate-800">{emp.productivityScore}%</span>
                            <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${emp.productivityScore}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
