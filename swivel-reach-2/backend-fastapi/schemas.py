from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    employee_id: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    username: str
    name: str
    email: EmailStr
    role: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    class Config:
        from_attributes = True

# Employee Schemas
class EmployeeBase(BaseModel):
    name: str
    email: EmailStr
    department: str
    designation: str
    date_of_joining: str
    status: Optional[str] = "active"

class EmployeeCreate(EmployeeBase):
    username: str
    password: str

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    date_of_joining: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None

class EmployeeResponse(EmployeeBase):
    id: str
    user_id: str
    class Config:
        from_attributes = True

# Task Schemas
class TaskBase(BaseModel):
    title: str
    description: str
    assigned_to: str
    priority: str
    due_date: str

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    status: Optional[str] = None

class TaskResponse(TaskBase):
    id: str
    status: str
    created_by: str
    created_at: datetime
    assigned_to_name: Optional[str] = "Unassigned"
    class Config:
        from_attributes = True

# Task Progress Update Schemas
class TaskUpdateCreate(BaseModel):
    comments: str
    progress_percentage: int = Field(..., ge=0, le=100)
    attachment_name: Optional[str] = None
    attachment_size: Optional[str] = None
    attachment_data: Optional[str] = None

class TaskUpdateResponse(BaseModel):
    id: str
    task_id: str
    employee_id: str
    update_date: datetime
    comments: str
    progress_percentage: int
    attachment_name: Optional[str] = None
    employee_name: Optional[str] = None
    class Config:
        from_attributes = True

# Dashboard Stat Schemas
class ActivitySchema(BaseModel):
    id: str
    type: str
    user: str
    description: str
    time: str

class TrendSchema(BaseModel):
    name: str
    completed: int
    created: int

class DeptDistSchema(BaseModel):
    name: str
    value: int

class DashboardStatsResponse(BaseModel):
    total_employees: int
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    in_progress_tasks: int
    recent_activity: List[ActivitySchema]
    productivity_trend: List[TrendSchema]
    department_distribution: List[DeptDistSchema]
