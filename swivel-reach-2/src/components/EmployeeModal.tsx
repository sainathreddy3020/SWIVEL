import React, { useState, useEffect } from "react";
import { X, UserPlus, Save, Mail, Briefcase, Calendar, ShieldAlert } from "lucide-react";
import { Employee } from "../types";

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employeeData: any) => Promise<void>;
  employee?: Employee | null; // If editing
}

export default function EmployeeModal({ isOpen, onClose, onSave, employee }: EmployeeModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [designation, setDesignation] = useState("");
  const [dateOfJoining, setDateOfJoining] = useState("");
  const [status, setStatus] = useState<'active' | 'inactive'>("active");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setName(employee.name);
      setEmail(employee.email);
      setDepartment(employee.department);
      setDesignation(employee.designation);
      setDateOfJoining(employee.dateOfJoining);
      setStatus(employee.status);
      setUsername(""); // Cannot update username directly in this simplified model
      setPassword("");
    } else {
      setName("");
      setEmail("");
      setDepartment("Engineering");
      setDesignation("");
      setDateOfJoining(new Date().toISOString().split("T")[0]);
      setStatus("active");
      setUsername("");
      setPassword("");
    }
    setError("");
  }, [employee, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name || !email || !department || !designation || !dateOfJoining) {
      setError("Please complete all required fields");
      setLoading(false);
      return;
    }

    if (!employee && (!username || !password)) {
      setError("Custom login username and password are required for new employees");
      setLoading(false);
      return;
    }

    const payload: any = {
      name,
      email,
      department,
      designation,
      dateOfJoining,
      status
    };

    if (!employee) {
      payload.username = username;
      payload.password = password;
    } else {
      if (password) {
        payload.password = password; // Only update if specified
      }
    }

    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save employee records");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <UserPlus className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              {employee ? "Edit Employee Details" : "Register New Employee"}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border-l-4 border-rose-500 rounded text-rose-800 text-xs flex items-start space-x-2">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-3 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Full name"
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-3 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Email address"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Product">Product</option>
                <option value="Sales">Sales</option>
                <option value="Human Resources">Human Resources</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Designation</label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Designation"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date of Joining</label>
              <input
                type="date"
                required
                value={dateOfJoining}
                onChange={(e) => setDateOfJoining(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {employee && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 mt-4">
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              {employee ? "Update Password (Optional)" : "Setup Login Credentials"}
            </span>

            <div className="grid grid-cols-2 gap-4">
              {!employee && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Username</label>
                  <input
                    type="text"
                    required={!employee}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Username"
                  />
                </div>
              )}
              <div className={employee ? "col-span-2" : ""}>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Password</label>
                <input
                  type="password"
                  required={!employee}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder={employee ? "Leave empty to keep current" : "••••••••"}
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 font-medium text-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? "Saving..." : "Save Employee"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
