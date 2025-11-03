import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

interface TaskCardProps {
  task: Task;
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export const TaskCard = ({ task, onToggle, onEdit, onDelete }: TaskCardProps) => {
  return (
    <Card 
      className={cn(
        "p-4 transition-all duration-300 shadow-card hover:shadow-hover",
        "border-border bg-card animate-fade-in",
        task.completed && "opacity-60"
      )}
    >
      <div className="flex items-start gap-4">
        <Checkbox
          checked={task.completed}
          onCheckedChange={(checked) => onToggle(task.id, checked as boolean)}
          className="mt-1"
        />
        
        <div className="flex-1 min-w-0">
          <h3 
            className={cn(
              "font-semibold text-lg mb-1 text-card-foreground",
              task.completed && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </h3>
          {task.description && (
            <p 
              className={cn(
                "text-sm text-muted-foreground",
                task.completed && "line-through"
              )}
            >
              {task.description}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(task)}
            className="hover:bg-secondary"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(task.id)}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
