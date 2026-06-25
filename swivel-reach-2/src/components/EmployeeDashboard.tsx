import React, { useState, useEffect } from "react";
import { 
  CheckSquare, 
  Clock, 
  Send, 
  Paperclip, 
  FileCheck, 
  Folder, 
  Calendar, 
  TrendingUp, 
  ListTodo,
  RefreshCw,
  X,
  PlusCircle,
  FileText,
  AlertCircle
} from "lucide-react";
import { Task, TaskUpdate } from "../types";

interface EmployeeDashboardProps {
  token: string;
  onLogout: () => void;
  employeeName: string;
  employeeId: string;
  tasks: Task[];
  onRefreshData: () => Promise<void>;
}

export default function EmployeeDashboard({ 
  token, 
  onLogout, 
  employeeName, 
  employeeId, 
  tasks,
  onRefreshData 
}: EmployeeDashboardProps) {

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskUpdates, setTaskUpdates] = useState<TaskUpdate[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);

  // Form Fields
  const [comments, setComments] = useState("");
  const [progressPct, setProgressPct] = useState(50);
  const [attachment, setAttachment] = useState<{ name: string; size: string; data: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filter Tasks
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>("all");

  const fetchTaskUpdates = async (taskId: string) => {
    setLoadingUpdates(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/updates`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTaskUpdates(data);
      }
    } catch (err) {
      console.error("Failed to fetch task updates:", err);
    } finally {
      setLoadingUpdates(false);
    }
  };

  useEffect(() => {
    if (selectedTask) {
      fetchTaskUpdates(selectedTask.id);
    } else {
      setTaskUpdates([]);
    }
    setFormError("");
    setFormSuccess(false);
  }, [selectedTask]);

  const selectTask = (task: Task) => {
    setSelectedTask(task);
    setProgressPct(task.status === "completed" ? 100 : task.status === "in_progress" ? 50 : 0);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileSelected = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        data: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess(false);

    if (!selectedTask) {
      setFormError("Please select an active task from your panel to submit a report.");
      return;
    }

    if (!comments.trim()) {
      setFormError("Please enter detailed comments describing your work progress.");
      return;
    }

    setSubmitting(true);

    try {
      const payload: any = {
        comments,
        progressPercentage: Number(progressPct)
      };

      if (attachment) {
        payload.attachmentName = attachment.name;
        payload.attachmentSize = attachment.size;
        payload.attachmentData = attachment.data;
      }

      const response = await fetch(`/api/tasks/${selectedTask.id}/updates`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit work update.");
      }

      setFormSuccess(true);
      setComments("");
      setAttachment(null);
      
      // Refresh local tasks & updates
      await onRefreshData();
      await fetchTaskUpdates(selectedTask.id);
      
      // Update the active task object reference in state to reflect the new progress
      const updatedTask = tasks.find(t => t.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    } catch (err: any) {
      setFormError(err.message || "An error occurred during submission.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (taskFilter === "pending") return t.status === "pending";
    if (taskFilter === "in_progress") return t.status === "in_progress";
    if (taskFilter === "completed") return t.status === "completed";
    return true;
  });

  // Calculate status counts for simple metrics
  const myTotal = tasks.length;
  const myCompleted = tasks.filter(t => t.status === "completed").length;
  const myInProgress = tasks.filter(t => t.status === "in_progress").length;
  const myPending = tasks.filter(t => t.status === "pending").length;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Metric Cards Banner: Beautiful Bento Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between h-[120px] hover:shadow-md hover:border-slate-300 transition-all">
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">My Assigned Tasks</span>
            <span className="block text-3xl font-extrabold text-[#0F172A] tracking-tight">{myTotal}</span>
          </div>
          <div className="text-[11px] text-[#64748B] font-semibold mt-auto">
            Active deliverables
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between h-[120px] hover:shadow-md hover:border-slate-300 transition-all">
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Completed Tasks</span>
            <span className="block text-3xl font-extrabold text-emerald-600 tracking-tight">{myCompleted}</span>
          </div>
          <div className="text-[11px] text-[#10B981] font-semibold mt-auto">
            Target tracking
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between h-[120px] hover:shadow-md hover:border-slate-300 transition-all">
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">In Progress</span>
            <span className="block text-3xl font-extrabold text-[#3B82F6] tracking-tight">{myInProgress}</span>
          </div>
          <div className="text-[11px] text-[#3B82F6] font-semibold mt-auto">
            Active workspace cycle
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between h-[120px] hover:shadow-md hover:border-slate-300 transition-all">
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Pending Start</span>
            <span className="block text-3xl font-extrabold text-[#F59E0B] tracking-tight">{myPending}</span>
          </div>
          <div className="text-[11px] text-[#F59E0B] font-semibold mt-auto">
            Awaiting kickoff
          </div>
        </div>

      </div>

      {/* Main interactive grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Tasks selector list (5 columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden max-h-[70vh]">
          
          {/* Header & filters */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
              <CheckSquare className="h-4.5 w-4.5 text-[#3B82F6]" />
              <span>Assigned Work Board</span>
            </h3>

            {/* Micro Filter Selector */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pr-1">
              {(['all', 'pending', 'in_progress', 'completed'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTaskFilter(filter)}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-lg capitalize shrink-0 cursor-pointer transition-colors ${
                    taskFilter === filter 
                      ? "bg-[#3B82F6] text-white shadow-sm" 
                      : "bg-white text-slate-500 hover:text-slate-700 border border-slate-200"
                  }`}
                >
                  {filter.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* List display */}
          <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((t) => (
                <div 
                  key={t.id} 
                  onClick={() => selectTask(t)}
                  className={`p-4 hover:bg-slate-50/50 cursor-pointer transition-all border-l-4 ${
                    selectedTask?.id === t.id ? "bg-blue-50/30 border-[#3B82F6]" : "border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      t.priority === 'high' ? 'bg-rose-100 text-rose-700' :
                      t.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {t.priority}
                    </span>
                    <span className={`text-[10px] font-semibold ${
                      t.status === 'completed' ? 'text-emerald-600' :
                      t.status === 'in_progress' ? 'text-[#3B82F6]' : 'text-amber-600'
                    } capitalize`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{t.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{t.description}</p>
                  
                  <div className="flex items-center space-x-3.5 mt-3 text-[10px] text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>Due: {t.dueDate}</span>
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No active tasks matching this criteria
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detail & Submit Progress Report (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {selectedTask ? (
            <>
              {/* Task Header & Details Card */}
              <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between border-b border-slate-200 pb-4 mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Active Working Task Context</span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedTask.title}</h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase ${
                    selectedTask.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                    selectedTask.status === 'in_progress' ? 'bg-blue-50 text-[#3B82F6]' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {selectedTask.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-xs text-slate-600 leading-relaxed mb-4 whitespace-pre-wrap">
                  {selectedTask.description}
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Priority Status</span>
                    <span className="font-semibold text-slate-800 capitalize mt-0.5 block">{selectedTask.priority}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Target Due Date</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">{selectedTask.dueDate}</span>
                  </div>
                </div>
              </div>

              {/* Submit Progress Report Form */}
              <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
                  <PlusCircle className="h-4.5 w-4.5 text-[#3B82F6]" />
                  <span>Log Daily Progress Report</span>
                </h3>

                {formError && (
                  <div className="p-3 bg-rose-50 border-l-4 border-rose-500 rounded text-rose-800 text-xs flex items-start space-x-2 mb-4">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {formSuccess && (
                  <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded text-emerald-800 text-xs flex items-start space-x-2 mb-4">
                    <FileCheck className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Work report submitted successfully! Task details updated.</span>
                  </div>
                )}

                <form onSubmit={handleSubmitReport} className="space-y-4">
                  
                  {/* Progress slider percentage */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                      <span>Task Progress Completion</span>
                      <span className="text-[#3B82F6] font-bold">{progressPct}%</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={progressPct}
                        onChange={(e) => setProgressPct(Number(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#3B82F6]"
                      />
                      <div className="flex space-x-1">
                        <button type="button" onClick={() => setProgressPct(25)} className="px-1.5 py-0.5 text-[9px] bg-slate-50 border border-slate-200 rounded text-slate-600 hover:bg-slate-100">25%</button>
                        <button type="button" onClick={() => setProgressPct(50)} className="px-1.5 py-0.5 text-[9px] bg-slate-50 border border-slate-200 rounded text-slate-600 hover:bg-slate-100">50%</button>
                        <button type="button" onClick={() => setProgressPct(75)} className="px-1.5 py-0.5 text-[9px] bg-slate-50 border border-slate-200 rounded text-slate-600 hover:bg-slate-100">75%</button>
                        <button type="button" onClick={() => setProgressPct(100)} className="px-1.5 py-0.5 text-[9px] bg-blue-50 border border-blue-100 rounded text-[#3B82F6] font-bold hover:bg-indigo-100">100%</button>
                      </div>
                    </div>
                  </div>

                  {/* Work update comments */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">What did you accomplish today?</label>
                    <textarea
                      required
                      rows={3}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="List clear bullet points, implemented modules, or dependencies resolved..."
                    />
                  </div>

                  {/* Drag and Drop Attachment Selection */}
                  <div 
                    onDragEnter={handleDrag} 
                    onDragOver={handleDrag} 
                    onDragLeave={handleDrag} 
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                      dragActive ? "border-indigo-500 bg-indigo-50/20" : "border-slate-200 bg-slate-50 hover:bg-slate-100/50"
                    }`}
                  >
                    <input 
                      type="file" 
                      id="file-upload" 
                      className="hidden" 
                      onChange={handleFileInput}
                    />
                    
                    {attachment ? (
                      <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 max-w-sm mx-auto text-xs">
                        <div className="flex items-center space-x-2 text-slate-600">
                          <FileText className="h-4 w-4 text-[#3B82F6] shrink-0" />
                          <span className="font-semibold truncate max-w-xs">{attachment.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium shrink-0">({attachment.size})</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setAttachment(null)}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label htmlFor="file-upload" className="cursor-pointer block">
                        <Paperclip className="h-5 w-5 text-slate-400 mx-auto mb-1.5" />
                        <span className="block text-xs font-semibold text-[#3B82F6] hover:text-[#2563EB]">Attach file log (Optional)</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">Drag & drop files or click to scan directories</span>
                      </label>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center space-x-2 px-5 py-2 bg-[#3B82F6] hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-100 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{submitting ? "Submitting Work Log..." : "Submit Log Report"}</span>
                    </button>
                  </div>

                </form>
              </div>

              {/* Task Update logs history list */}
              <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Task Update Logs History</h3>
                
                {loadingUpdates ? (
                  <div className="py-6 text-center space-y-2">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto text-[#3B82F6]" />
                    <p className="text-[11px] text-slate-400">Loading log history...</p>
                  </div>
                ) : taskUpdates.length > 0 ? (
                  <div className="space-y-4">
                    {taskUpdates.map(up => (
                      <div key={up.id} className="text-xs border-l-2 border-blue-200 pl-3.5 py-1 relative">
                        <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-[#3B82F6] border-2 border-white" />
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                          <span className="font-semibold text-slate-700 text-[11px]">{up.employeeName}</span>
                          <span>{new Date(up.updateDate).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-600 mt-1">{up.comments}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="inline-flex px-1.5 py-0.5 bg-blue-50 text-[#3B82F6] rounded text-[10px] font-bold">
                            Progress: {up.progressPercentage}%
                          </span>
                          {up.attachmentName && (
                            <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                              <Paperclip className="h-3 w-3" />
                              <span className="underline truncate max-w-[120px]">{up.attachmentName}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No progress reports logged for this task yet.</p>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3 min-h-[50vh] hover:shadow-md transition-all">
              <ListTodo className="h-10 w-10 text-slate-300" />
              <p className="font-semibold text-slate-600 text-sm">Select Assigned Work to Begin</p>
              <p className="text-xs max-w-xs leading-relaxed">Choose an assigned task card from the left panel to review goals, track timelines, submit report logs and attach documents.</p>
            </div>
          )}

        </div>
      </div>

      {/* Nav footer */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between mt-6">
        <span className="text-xs text-slate-500 font-semibold">Logged in as Employee: <strong className="text-slate-900">{employeeName}</strong></span>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={onRefreshData}
            className="p-1.5 border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            title="Refresh Tasks Board"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button 
            onClick={onLogout}
            className="px-3.5 py-1.5 border border-slate-200 hover:border-slate-300 rounded-xl hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-all cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>

    </div>
  );
}
