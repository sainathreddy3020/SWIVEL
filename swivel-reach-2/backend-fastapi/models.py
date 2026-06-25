import datetime
from sqlalchemy import Column, String, Integer, ForeignKey, Enum, DateTime, Float, Text
from sqlalchemy.orm import relationship
from database import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255), nullable=True)

class User(Base):
    __tablename__ = "users"

    id = Column(String(100), primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="employee") # admin or employee
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    employee_profile = relationship("Employee", back_populates="user", uselist=False, cascade="all, delete-orphan")

class Employee(Base):
    __tablename__ = "employees"

    id = Column(String(100), primary_key=True, index=True)
    user_id = Column(String(100), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    department = Column(String(100), nullable=False)
    designation = Column(String(100), nullable=False)
    date_of_joining = Column(String(50), nullable=False)
    status = Column(String(50), default="active") # active or inactive

    # Relationships
    user = relationship("User", back_populates="employee_profile")
    tasks = relationship("Task", back_populates="assignee", cascade="all, delete")
    updates = relationship("TaskUpdate", back_populates="submitter", cascade="all, delete")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(100), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    assigned_to = Column(String(100), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    priority = Column(String(50), nullable=False) # low, medium, high
    due_date = Column(String(50), nullable=False)
    status = Column(String(50), default="pending") # pending, in_progress, completed
    created_by = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    assignee = relationship("Employee", back_populates="tasks")
    updates = relationship("TaskUpdate", back_populates="task", cascade="all, delete")

class TaskUpdate(Base):
    __tablename__ = "task_updates"

    id = Column(String(100), primary_key=True, index=True)
    task_id = Column(String(100), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(String(100), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    update_date = Column(DateTime, default=datetime.datetime.utcnow)
    comments = Column(Text, nullable=False)
    progress_percentage = Column(Integer, nullable=False)
    attachment_name = Column(String(255), nullable=True)
    attachment_size = Column(String(50), nullable=True)
    attachment_data = Column(Text, nullable=True) # Base64 string for file persistence

    # Relationships
    task = relationship("Task", back_populates="updates")
    submitter = relationship("Employee", back_populates="updates")
