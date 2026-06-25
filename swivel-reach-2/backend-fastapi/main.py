import datetime
import uuid
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models, schemas, auth, database
from database import get_db, engine

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Employee Work Tracking API", version="1.0.0")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup DB Seeding
@app.on_event("startup")
def seed_database():
    db = next(get_db())
    # Seed only if empty
    if db.query(models.User).count() == 0:
        admin_id = "u_admin"
        admin_pwd = auth.get_password_hash("admin123")
        admin = models.User(
            id=admin_id,
            username="admin",
            password_hash=admin_pwd,
            role="admin",
            name="Sainath Reddy",
            email="sainathreddy1313@gmail.com"
        )
        
        john_id = "u_john"
        john_pwd = auth.get_password_hash("john123")
        john = models.User(
            id=john_id,
            username="john_doe",
            password_hash=john_pwd,
            role="employee",
            name="John Doe",
            email="john.doe@company.com"
        )
        
        jane_id = "u_jane"
        jane_pwd = auth.get_password_hash("jane123")
        jane = models.User(
            id=jane_id,
            username="jane_smith",
            password_hash=jane_pwd,
            role="employee",
            name="Jane Smith",
            email="jane.smith@company.com"
        )
        
        db.add_all([admin, john, jane])
        db.commit()

        # Seed employees linked to users
        emp_john = models.Employee(
            id="emp_john",
            user_id=john_id,
            name="John Doe",
            email="john.doe@company.com",
            department="Engineering",
            designation="Senior Software Engineer",
            date_of_joining="2025-01-15",
            status="active"
        )
        
        emp_jane = models.Employee(
            id="emp_jane",
            user_id=jane_id,
            name="Jane Smith",
            email="jane.smith@company.com",
            department="Design",
            designation="Lead Product Designer",
            date_of_joining="2025-03-10",
            status="active"
        )
        
        db.add_all([emp_john, emp_jane])
        db.commit()

        # Seed tasks
        t_1 = models.Task(
            id="t_1",
            title="Implement Auth Module",
            description="Develop and test JWT and role-based authentication flows.",
            assigned_to="emp_john",
            priority="high",
            due_date="2026-06-28",
            status="completed",
            created_by="Sainath Reddy"
        )
        
        t_2 = models.Task(
            id="t_2",
            title="Design UI Wireframes",
            description="Create layouts for Employee Details, Tasks list and Reports widgets.",
            assigned_to="emp_jane",
            priority="medium",
            due_date="2026-06-30",
            status="in_progress",
            created_by="Sainath Reddy"
        )
        
        t_3 = models.Task(
            id="t_3",
            title="Database Scale and Indexing",
            description="Optimize database indexes and write standard PostgreSQL migration scripts.",
            assigned_to="emp_john",
            priority="high",
            due_date="2026-07-05",
            status="pending",
            created_by="Sainath Reddy"
        )
        
        db.add_all([t_1, t_2, t_3])
        db.commit()

        # Seed updates
        up_1 = models.TaskUpdate(
            id="up_1",
            task_id="t_1",
            employee_id="emp_john",
            comments="JWT login and session expiration completed. Unit tests passing.",
            progress_percentage=100
        )
        
        up_2 = models.TaskUpdate(
            id="up_2",
            task_id="t_2",
            employee_id="emp_jane",
            comments="Dashboard visual charts are designed. Implementing mobile layout elements.",
            progress_percentage=65
        )
        
        db.add_all([up_1, up_2])
        db.commit()


# --- REST API ROUTING ---

# 1. Login
@app.post("/api/auth/login")
def login(username: str = Query(...), password: str = Query(...), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user or not auth.verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    employee_id = ""
    if user.role == "employee":
        emp = db.query(models.Employee).filter(models.Employee.user_id == user.id).first()
        if emp:
            employee_id = emp.id

    access_token = auth.create_access_token(
        data={"id": user.id, "username": user.username, "role": user.role, "name": user.name, "employee_id": employee_id}
    )
    return {
        "token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "name": user.name,
            "email": user.email,
            "employeeId": employee_id
        }
    }


# 2. Me
@app.get("/api/auth/me")
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role,
        "name": current_user.name,
        "email": current_user.email,
        "employeeId": current_user.employee_id
    }


# 3. Employee Management (Admin Only CRUD)
@app.get("/api/employees", response_model=List[schemas.EmployeeResponse])
def get_employees(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Employee).all()

@app.get("/api/employees/{emp_id}", response_model=schemas.EmployeeResponse)
def get_employee(emp_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    emp = db.query(models.Employee).filter(models.Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp

@app.post("/api/employees", status_code=210)
def create_employee(
    payload: schemas.EmployeeCreate, 
    db: Session = Depends(get_db), 
    admin: models.User = Depends(auth.require_admin)
):
    # Check duplicate username
    if db.query(models.User).filter(models.User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    # Check duplicate email
    if db.query(models.Employee).filter(models.Employee.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = "u_" + str(uuid.uuid4())[:8]
    emp_id = "emp_" + str(uuid.uuid4())[:8]
    hashed_pwd = auth.get_password_hash(payload.password)

    new_user = models.User(
        id=user_id,
        username=payload.username,
        password_hash=hashed_pwd,
        role="employee",
        name=payload.name,
        email=payload.email
    )

    new_emp = models.Employee(
        id=emp_id,
        user_id=user_id,
        name=payload.name,
        email=payload.email,
        department=payload.department,
        designation=payload.designation,
        date_of_joining=payload.date_of_joining,
        status="active"
    )

    db.add(new_user)
    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)
    return new_emp

@app.put("/api/employees/{emp_id}", response_model=schemas.EmployeeResponse)
def update_employee(
    emp_id: str,
    payload: schemas.EmployeeUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.require_admin)
):
    emp = db.query(models.Employee).filter(models.Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    user = db.query(models.User).filter(models.User.id == emp.user_id).first()

    # Update email, check duplicate
    if payload.email and payload.email != emp.email:
        if db.query(models.Employee).filter(models.Employee.email == payload.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")
        emp.email = payload.email
        if user:
            user.email = payload.email

    if payload.name:
        emp.name = payload.name
        if user:
            user.name = payload.name

    if payload.department:
        emp.department = payload.department
    if payload.designation:
        emp.designation = payload.designation
    if payload.date_of_joining:
        emp.date_of_joining = payload.date_of_joining
    if payload.status:
        emp.status = payload.status

    if payload.password and user:
        user.password_hash = auth.get_password_hash(payload.password)

    db.commit()
    db.refresh(emp)
    return emp

@app.delete("/api/employees/{emp_id}")
def delete_employee(
    emp_id: str,
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.require_admin)
):
    emp = db.query(models.Employee).filter(models.Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    user_id = emp.user_id
    db.delete(emp)
    
    # Delete connected user profile
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        db.delete(user)

    db.commit()
    return {"message": "Employee successfully deleted"}


# 4. Task Management CRUD
@app.get("/api/tasks")
def get_tasks(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.Task)
    if current_user.role == "employee":
        query = query.filter(models.Task.assigned_to == current_user.employee_id)
    
    tasks = query.all()
    results = []
    for t in tasks:
        emp_name = "Unassigned"
        if t.assigned_to:
            emp = db.query(models.Employee).filter(models.Employee.id == t.assigned_to).first()
            if emp:
                emp_name = emp.name
        results.append({
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "assignedTo": t.assigned_to,
            "assignedToName": emp_name,
            "priority": t.priority,
            "dueDate": t.due_date,
            "status": t.status,
            "createdBy": t.created_by,
            "createdAt": t.created_at
        })
    return results

@app.get("/api/tasks/{task_id}")
def get_task(task_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    t = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")

    if current_user.role == "employee" and t.assigned_to != current_user.employee_id:
        raise HTTPException(status_code=403, detail="Unauthorized task access")

    emp_name = "Unassigned"
    if t.assigned_to:
        emp = db.query(models.Employee).filter(models.Employee.id == t.assigned_to).first()
        if emp:
            emp_name = emp.name

    return {
        "id": t.id,
        "title": t.title,
        "description": t.description,
        "assignedTo": t.assigned_to,
        "assignedToName": emp_name,
        "priority": t.priority,
        "dueDate": t.due_date,
        "status": t.status,
        "createdBy": t.created_by,
        "createdAt": t.created_at
    }

@app.post("/api/tasks", status_code=201)
def create_task(
    payload: schemas.TaskCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.require_admin)
):
    task_id = "t_" + str(uuid.uuid4())[:8]
    new_task = models.Task(
        id=task_id,
        title=payload.title,
        description=payload.description,
        assigned_to=payload.assigned_to,
        priority=payload.priority,
        due_date=payload.due_date,
        status="pending",
        created_by=admin.name
    )
    db.add(new_task)
    db.commit()
    return new_task

@app.put("/api/tasks/{task_id}")
def update_task(
    task_id: str,
    payload: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if current_user.role == "employee":
        if task.assigned_to != current_user.employee_id:
            raise HTTPException(status_code=403, detail="Unauthorized")
        # Employee can ONLY update status
        if payload.status:
            task.status = payload.status
    else:
        # Admin can update everything
        if payload.title:
            task.title = payload.title
        if payload.description:
            task.description = payload.description
        if payload.assigned_to:
            task.assigned_to = payload.assigned_to
        if payload.priority:
            task.priority = payload.priority
        if payload.due_date:
            task.due_date = payload.due_date
        if payload.status:
            task.status = payload.status

    db.commit()
    return task

@app.delete("/api/tasks/{task_id}")
def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.require_admin)
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Delete updates linked
    db.query(models.TaskUpdate).filter(models.TaskUpdate.task_id == task_id).delete()
    db.delete(task)
    db.commit()
    return {"message": "Task successfully deleted"}


# 5. Task Daily Report Updates
@app.post("/api/tasks/{task_id}/updates", status_code=201)
def submit_task_update(
    task_id: str,
    payload: schemas.TaskUpdateCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if current_user.role == "employee" and task.assigned_to != current_user.employee_id:
        raise HTTPException(status_code=403, detail="Unauthorized progress submission")

    emp_id = task.assigned_to if current_user.role == "admin" else current_user.employee_id

    update_id = "up_" + str(uuid.uuid4())[:8]
    new_update = models.TaskUpdate(
        id=update_id,
        task_id=task_id,
        employee_id=emp_id,
        comments=payload.comments,
        progress_percentage=payload.progress_percentage,
        attachment_name=payload.attachment_name,
        attachment_size=payload.attachment_size,
        attachment_data=payload.attachment_data
    )

    db.add(new_update)

    # Auto update task status
    if payload.progress_percentage >= 100:
        task.status = "completed"
    elif payload.progress_percentage > 0:
        task.status = "in_progress"

    db.commit()
    return new_update

@app.get("/api/tasks/{task_id}/updates")
def get_task_updates(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if current_user.role == "employee" and task.assigned_to != current_user.employee_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    updates = db.query(models.TaskUpdate).filter(models.TaskUpdate.task_id == task_id).order_by(models.TaskUpdate.update_date.desc()).all()
    results = []
    for up in updates:
        emp = db.query(models.Employee).filter(models.Employee.id == up.employee_id).first()
        results.append({
            "id": up.id,
            "taskId": up.task_id,
            "employeeId": up.employee_id,
            "employeeName": emp.name if emp else "System",
            "updateDate": up.update_date,
            "comments": up.comments,
            "progressPercentage": up.progress_percentage,
            "attachmentName": up.attachment_name,
            "attachmentSize": up.attachment_size
        })
    return results


# 6. Dashboard Stats
@app.get("/api/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Calculate counts
    total_employees = db.query(models.Employee).count()
    
    task_query = db.query(models.Task)
    if current_user.role == "employee":
        task_query = task_query.filter(models.Task.assigned_to == current_user.employee_id)

    total_tasks = task_query.count()
    completed = task_query.filter(models.Task.status == "completed").count()
    pending = task_query.filter(models.Task.status == "pending").count()
    in_progress = task_query.filter(models.Task.status == "in_progress").count()

    # Generate trends for last 7 days
    days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    productivity_trend = []
    for i in range(7):
        d = datetime.date.today() - datetime.timedelta(days=6 - i)
        day_name = days[d.weekday()]
        
        # Simulate active values for visualization
        seed_created = 1 if i in [0, 2, 4] else 0
        seed_completed = 1 if i in [1, 4, 5] else 0
        
        productivity_trend.append({
            "name": day_name,
            "completed": seed_completed,
            "created": seed_created
        })

    # Department distribution
    depts = db.query(models.Employee.department).distinct().all()
    dept_distribution = []
    for dept in depts:
        name = dept[0]
        count = db.query(models.Employee).filter(models.Employee.department == name).count()
        dept_distribution.append({"name": name, "value": count})

    # Fallback if empty depts
    if not dept_distribution:
        dept_distribution = [{"name": "Engineering", "value": 1}]

    # Recent Activity (Mock or structured log entries)
    recent_activity = [
        {"id": "act_1", "type": "employee_added", "user": "Admin", "description": "Added John Doe as Senior Software Engineer", "time": "1 hour ago"},
        {"id": "act_2", "type": "task_created", "user": "Admin", "description": "Assigned Task 'Implement Auth Module' to John Doe", "time": "2 hours ago"},
        {"id": "act_3", "type": "report_submitted", "user": "John Doe", "description": "Updated 'Implement Auth Module' progress to 100%", "time": "1 day ago"}
    ]

    return {
        "totalEmployees": total_employees,
        "totalTasks": total_tasks,
        "completedTasks": completed,
        "pendingTasks": pending,
        "inProgressTasks": in_progress,
        "recentActivity": recent_activity,
        "productivityTrend": productivity_trend,
        "departmentDistribution": dept_distribution
    }


# 7. Reports
@app.get("/api/reports/export")
def get_reports(
    type: str = "task",
    employeeId: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if type == "employee":
        employees = db.query(models.Employee).all()
        results = []
        for emp in employees:
            emp_tasks = db.query(models.Task).filter(models.Task.assigned_to == emp.id).all()
            total = len(emp_tasks)
            completed = len([t for t in emp_tasks if t.status == "completed"])
            in_progress = len([t for t in emp_tasks if t.status == "in_progress"])
            pending = len([t for t in emp_tasks if t.status == "pending"])
            
            results.append({
                "id": emp.id,
                "name": emp.name,
                "email": emp.email,
                "department": emp.department,
                "designation": emp.designation,
                "joiningDate": emp.date_of_joining,
                "status": emp.status,
                "totalTasks": total,
                "completedTasks": completed,
                "pendingTasks": pending,
                "inProgressTasks": in_progress,
                "productivityScore": Math.round((completed / total) * 100) if total else 0
            })
        return results

    # Task report filtering
    query = db.query(models.Task)
    if employeeId:
        query = query.filter(models.Task.assigned_to == employeeId)
    if status:
        query = query.filter(models.Task.status == status)
    if priority:
        query = query.filter(models.Task.priority == priority)

    tasks = query.all()
    results = []
    for t in tasks:
        emp = db.query(models.Employee).filter(models.Employee.id == t.assigned_to).first() if t.assigned_to else None
        results.append({
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "assignedToName": emp.name if emp else "Unassigned",
            "department": emp.department if emp else "N/A",
            "priority": t.priority,
            "status": t.status,
            "dueDate": t.due_date,
            "progress": 100 if t.status == "completed" else 0
        })
    return results


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
