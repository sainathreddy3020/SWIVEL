export type Role = 'admin' | 'employee';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: Role;
}

export interface Employee {
  id: string;
  userId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  dateOfJoining: string;
  status: 'active' | 'inactive';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // employeeId
  assignedToName?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdBy: string;
  createdAt: string;
}

export interface TaskUpdate {
  id: string;
  taskId: string;
  employeeId: string;
  employeeName?: string;
  updateDate: string;
  comments: string;
  progressPercentage: number;
  attachmentName?: string;
  attachmentSize?: string;
  attachmentData?: string; // base64 representation or URL
}

export interface DashboardStats {
  totalEmployees: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  recentActivity: {
    id: string;
    type: 'task_created' | 'task_updated' | 'report_submitted' | 'employee_added';
    user: string;
    description: string;
    time: string;
  }[];
  productivityTrend: {
    name: string;
    completed: number;
    created: number;
  }[];
  departmentDistribution: {
    name: string;
    value: number;
  }[];
}
