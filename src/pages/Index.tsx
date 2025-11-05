import { useState, useEffect } from "react";
import { Plus, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/TaskCard";
import { TaskDialog } from "@/components/TaskDialog";
import { toast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string; // "active" or "completed"
  createdAt?: string;
}

//  Change #1 — use environment variable instead of hardcoding IP
// This makes deployment safer and works with .env (VITE_API_BASE_URL)
const API_BASE = import.meta.env.VITE_API_BASE;

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  //  Fetch all tasks from backend (DynamoDB)
  const fetchTasks = async () => {
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load tasks from server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  //  Create or update task (POST / PUT)
  const handleSave = async (title: string, description: string) => {
    try {
      if (editingTask) {
        // Update existing task
        const res = await fetch(`${API_BASE}/${editingTask.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description }),
        });

        if (!res.ok) throw new Error("Update failed");
        toast({ title: "Success", description: "Task updated successfully" });
      } else {
        // Create new task
        const newTask = {
          id: crypto.randomUUID(),
          title,
          description,
          status: "active",
        };

        const res = await fetch(API_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newTask),
        });

        if (!res.ok) throw new Error("Create failed");
        toast({ title: "Success", description: "Task added successfully" });
      }

      fetchTasks();
      setEditingTask(null);
    } catch (error) {
      console.error("Error saving task:", error);
      toast({
        title: "Error",
        description: "Failed to save task",
        variant: "destructive",
      });
    }
  };

  //  Toggle task status (PUT /status)
  const handleToggle = async (id: string, completed: boolean) => {
    try {
      const newStatus = completed ? "completed" : "active";

      const res = await fetch(`${API_BASE}/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Status update failed");
      fetchTasks();
    } catch (error) {
      console.error("Error toggling task:", error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  //  Delete task (DELETE)
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast({ title: "Success", description: "Task deleted successfully" });
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  //  Edit task
  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  //  Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (filter === "active") return task.status === "active";
    if (filter === "completed") return task.status === "completed";
    return true;
  });

  const stats = {
    total: tasks.length,
    active: tasks.filter((t) => t.status === "active").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              TaskFlow
            </h1>
            <Button
              onClick={() => {
                setEditingTask(null);
                setDialogOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-lg p-6 shadow-card border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Tasks</p>
                <p className="text-3xl font-bold text-card-foreground">{stats.total}</p>
              </div>
              <Circle className="h-10 w-10 text-primary" />
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 shadow-card border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Active</p>
                <p className="text-3xl font-bold text-accent">{stats.active}</p>
              </div>
              <Circle className="h-10 w-10 text-accent" />
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 shadow-card border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Completed</p>
                <p className="text-3xl font-bold text-success">{stats.completed}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 bg-card rounded-lg p-2 shadow-card border border-border w-fit">
          <Button variant={filter === "all" ? "default" : "ghost"} onClick={() => setFilter("all")} size="sm">
            All
          </Button>
          <Button variant={filter === "active" ? "default" : "ghost"} onClick={() => setFilter("active")} size="sm">
            Active
          </Button>
          <Button variant={filter === "completed" ? "default" : "ghost"} onClick={() => setFilter("completed")} size="sm">
            Completed
          </Button>
        </div>

        {/* Task List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg shadow-card border border-border">
            <p className="text-muted-foreground mb-4">
              {filter === "all"
                ? "No tasks yet. Create your first task to get started!"
                : `No ${filter} tasks.`}
            </p>
            {filter === "all" && (
              <Button
                onClick={() => {
                  setEditingTask(null);
                  setDialogOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Task
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* Dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        task={editingTask}
        onSave={handleSave}
      />
    </div>
  );
};

export default Index;
