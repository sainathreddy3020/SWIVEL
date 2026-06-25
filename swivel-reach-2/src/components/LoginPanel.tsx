import React, { useState } from "react";
import { Lock, User, Shield, Briefcase, ChevronRight, Mail, UserPlus, ArrowLeft } from "lucide-react";
import { User as UserType } from "../types";

interface LoginPanelProps {
  onLoginSuccess: (token: string, user: UserType) => void;
}

export default function LoginPanel({ onLoginSuccess }: LoginPanelProps) {
  const [isEmployeeMode, setIsEmployeeMode] = useState(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname.toLowerCase();
      return path.includes("/employee") || window.location.hash === "#employee";
    }
    return false;
  });

  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [recoveryUserOrEmail, setRecoveryUserOrEmail] = useState("");
  const [recoveryNewPassword, setRecoveryNewPassword] = useState("");
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      setIsEmployeeMode(path.includes("/employee") || window.location.hash === "#employee");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const toggleEmployeeMode = (val: boolean) => {
    setIsEmployeeMode(val);
    setError("");
    setSuccess("");
    setIsRegistering(false);
    setIsForgotPassword(false);
    if (typeof window !== "undefined") {
      if (val) {
        window.history.pushState({}, "", "/employee/login");
      } else {
        window.history.pushState({}, "", "/");
      }
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!recoveryUserOrEmail || !recoveryNewPassword || !recoveryConfirmPassword) {
      setError("Please complete all recovery fields");
      setLoading(false);
      return;
    }

    if (recoveryNewPassword !== recoveryConfirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernameOrEmail: recoveryUserOrEmail,
          newPassword: recoveryNewPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Reset password request failed");
      }

      setSuccess("Your password has been reset successfully! Please sign in with your new credentials.");
      
      setTimeout(() => {
        setIsForgotPassword(false);
        setUsername(recoveryUserOrEmail);
        setPassword("");
        setRecoveryUserOrEmail("");
        setRecoveryNewPassword("");
        setRecoveryConfirmPassword("");
        setSuccess("");
      }, 2500);

    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const targetUser = customUser || username;
    const targetPass = customPass || password;

    if (!targetUser || !targetPass) {
      setError("Please provide both Username/Email and password");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: targetUser, password: targetPass })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "Failed to connect to authentication server");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!name || !email || !regUsername || !regPassword) {
      setError("Please fill in all fields to create an Admin account");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          username: regUsername,
          password: regPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Admin registration failed");
      }

      setSuccess("Administrator account created successfully! Signing you in...");
      setTimeout(() => {
        onLoginSuccess(data.token, data.user);
      }, 1500);

    } catch (err: any) {
      setError(err.message || "Failed to register Admin account");
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-all ${
            isEmployeeMode ? 'bg-emerald-600 shadow-emerald-200' : 'bg-[#3B82F6] shadow-blue-200'
          }`}>
            {isEmployeeMode ? <User className="h-6 w-6" /> : <Briefcase className="h-6 w-6" />}
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-[#0F172A]">
          {isEmployeeMode ? "Employee Portal" : "Swivel Reach"}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          {isEmployeeMode 
            ? "Secure staff sign-in to access assignments and log progress reports" 
            : "Employee Work Tracking & Productivity Suite"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          
          {error && (
            <div className="mb-4 bg-rose-50 border-l-4 border-rose-500 p-4 text-rose-800 text-xs font-semibold rounded-lg">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-emerald-50 border-l-4 border-emerald-500 p-4 text-emerald-800 text-xs font-semibold rounded-lg">
              <p className="font-bold">Success</p>
              <p>{success}</p>
            </div>
          )}

          {isForgotPassword ? (
            /* FORGOT PASSWORD VIEW */
            <>
              <form className="space-y-4" onSubmit={handlePasswordReset}>
                <div className="flex items-center space-x-2 text-slate-500 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setError("");
                      setSuccess("");
                    }}
                    className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Password Recovery</span>
                </div>

                <div>
                  <label htmlFor="recovery-username" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Username or Registered Email
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4.5 w-4.5" />
                    </div>
                    <input
                      id="recovery-username"
                      type="text"
                      required
                      value={recoveryUserOrEmail}
                      onChange={(e) => setRecoveryUserOrEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs font-semibold placeholder-slate-400 text-slate-800"
                      placeholder="Username or registered email address"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="recovery-new-password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Choose New Password
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4.5 w-4.5" />
                    </div>
                    <input
                      id="recovery-new-password"
                      type="password"
                      required
                      value={recoveryNewPassword}
                      onChange={(e) => setRecoveryNewPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs font-semibold placeholder-slate-400 text-slate-800"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="recovery-confirm-password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4.5 w-4.5" />
                    </div>
                    <input
                      id="recovery-confirm-password"
                      type="password"
                      required
                      value={recoveryConfirmPassword}
                      onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs font-semibold placeholder-slate-400 text-slate-800"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md shadow-blue-100 text-xs font-bold text-white bg-[#3B82F6] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {loading ? "Updating Password..." : "Reset Password"}
                  </button>
                </div>
              </form>

              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setError("");
                    setSuccess("");
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Remember password? <span className="text-[#3B82F6] hover:underline">Sign In</span>
                </button>
              </div>
            </>
          ) : !isRegistering ? (
            /* SIGN IN VIEW */
            <>
              <form className="space-y-5" onSubmit={(e) => handleLogin(e)}>
                <div>
                  <label htmlFor="username" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Username or Email
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4.5 w-4.5" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 text-xs font-semibold placeholder-slate-400 text-slate-800 ${
                        isEmployeeMode 
                          ? 'focus:ring-emerald-500 focus:border-emerald-500' 
                          : 'focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="Username or registered email address"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Password
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4.5 w-4.5" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 text-xs font-semibold placeholder-slate-400 text-slate-800 ${
                        isEmployeeMode 
                          ? 'focus:ring-emerald-500 focus:border-emerald-500' 
                          : 'focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError("");
                      setSuccess("");
                    }}
                    className={`font-bold cursor-pointer hover:underline ${
                      isEmployeeMode ? 'text-emerald-600 hover:text-emerald-700' : 'text-[#3B82F6] hover:text-[#2563EB]'
                    }`}
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-xs font-bold text-white transition-all disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      isEmployeeMode 
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 focus:ring-emerald-500' 
                        : 'bg-[#3B82F6] hover:bg-blue-700 shadow-blue-100 focus:ring-blue-500'
                    }`}
                  >
                    {loading ? "Authenticating..." : "Sign In"}
                  </button>
                </div>
              </form>

              {/* Portal switcher & Register Admin options */}
              <div className="mt-5 flex flex-col space-y-3.5 items-center justify-center border-t border-slate-100 pt-4">
                {isEmployeeMode ? (
                  <button
                    type="button"
                    onClick={() => toggleEmployeeMode(false)}
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#3B82F6] hover:text-[#2563EB] cursor-pointer hover:underline"
                  >
                    <ArrowLeft className="h-4 w-4 text-[#3B82F6]" />
                    <span>Go to Administrator Portal</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleEmployeeMode(true)}
                      className="inline-flex items-center space-x-2 text-xs font-extrabold text-emerald-600 hover:text-emerald-700 cursor-pointer bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100/50 hover:bg-emerald-100/50 transition-all"
                    >
                      <User className="h-4.5 w-4.5 text-emerald-500" />
                      <span>Are you an Employee? Go to Employee Login</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistering(true);
                        setError("");
                        setSuccess("");
                      }}
                      className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#3B82F6] hover:text-[#2563EB] cursor-pointer"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Register as New Admin</span>
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            /* REGISTER ADMIN VIEW */
            <>
              <form className="space-y-4" onSubmit={handleAdminRegister}>
                <div className="flex items-center space-x-2 text-slate-500 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(false);
                      setError("");
                      setSuccess("");
                    }}
                    className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Admin Registration Portal</span>
                </div>

                <div>
                  <label htmlFor="reg-name" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4.5 w-4.5" />
                    </div>
                    <input
                      id="reg-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs font-semibold placeholder-slate-400 text-slate-800"
                      placeholder="Full name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Email Address (Admin Mail)
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4.5 w-4.5" />
                    </div>
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs font-semibold placeholder-slate-400 text-slate-800"
                      placeholder="Email address"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-username" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Choose Username
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4.5 w-4.5" />
                    </div>
                    <input
                      id="reg-username"
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs font-semibold placeholder-slate-400 text-slate-800"
                      placeholder="Choose username"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Choose Password
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4.5 w-4.5" />
                    </div>
                    <input
                      id="reg-password"
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs font-semibold placeholder-slate-400 text-slate-800"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md shadow-blue-100 text-xs font-bold text-white bg-[#3B82F6] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {loading ? "Creating Account..." : "Register Admin Account"}
                  </button>
                </div>
              </form>

              {/* Switch back to sign in */}
              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(false);
                    setError("");
                    setSuccess("");
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Already have an account? <span className="text-[#3B82F6] hover:underline">Sign In</span>
                </button>
              </div>
            </>
          )}

          {/* Safe Workspace Area */}

        </div>
      </div>
    </div>
  );
}
