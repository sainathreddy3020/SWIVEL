import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(), // 'admin' | 'employee'
  name: text("name").notNull(),
  email: text("email").notNull(),
});

export const employees = pgTable("employees", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  department: text("department").notNull(),
  designation: text("designation").notNull(),
  dateOfJoining: text("date_of_joining").notNull(),
  status: text("status").notNull(), // 'active' | 'inactive'
});

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  assignedTo: text("assigned_to").notNull(), // employeeId
  priority: text("priority").notNull(), // 'low' | 'medium' | 'high'
  dueDate: text("due_date").notNull(),
  status: text("status").notNull(), // 'pending' | 'in_progress' | 'completed'
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
});

export const taskUpdates = pgTable("task_updates", {
  id: text("id").primaryKey(),
  taskId: text("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  employeeId: text("employee_id").notNull(),
  updateDate: text("update_date").notNull(),
  comments: text("comments").notNull(),
  progressPercentage: integer("progress_percentage").notNull(),
  attachmentName: text("attachment_name"),
  attachmentSize: text("attachment_size"),
  attachmentData: text("attachment_data"), // base64 string
});

export const activities = pgTable("activities", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // 'task_created' | 'task_updated' | 'report_submitted' | 'employee_added'
  user: text("user").notNull(),
  description: text("description").notNull(),
  time: text("time").notNull(),
});
