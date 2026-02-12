import { useState } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import { mockDailyTasks } from "@/data/mockData";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Circle, AlertTriangle, Syringe, Baby, Stethoscope, Bug } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const typeIcons = {
  vaccination: Syringe,
  vet_followup: Stethoscope,
  lambing: Baby,
  high_risk: AlertTriangle,
  deworming: Bug,
};

const priorityColors = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-border",
};

const DailyTasks = () => {
  const [tasks, setTasks] = useState(mockDailyTasks);
  const [tab, setTab] = useState<"today" | "upcoming">("today");

  const today = "2026-02-12";
  const todayTasks = tasks.filter(t => t.due_date === today);
  const upcomingTasks = tasks.filter(t => t.due_date > today);
  const displayTasks = tab === "today" ? todayTasks : upcomingTasks;

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  return (
    <PageWrapper title="Digital Shepherd Assistant" subtitle="Your daily intelligent task list">
      <div className="max-w-2xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["today", "upcoming"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {t === "today" ? `Today (${todayTasks.length})` : `Upcoming (${upcomingTasks.length})`}
            </button>
          ))}
        </div>

        {/* Tasks */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {displayTasks.map((task, i) => {
              const Icon = typeIcons[task.type];
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 }}
                  className={`glass-card p-4 flex items-start gap-4 transition-opacity ${task.completed ? "opacity-60" : ""}`}
                >
                  <button onClick={() => toggleTask(task.id)} className="mt-0.5 shrink-0">
                    {task.completed ? (
                      <CheckCircle className="h-6 w-6 text-success" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground/40 hover:text-primary transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className={`font-semibold text-sm ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {task.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                        <Link to={`/sheep/${task.sheep_id}`} className="text-xs text-primary hover:underline mt-1 inline-block">
                          🐑 {task.sheep_name}
                        </Link>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge variant="outline" className={priorityColors[task.priority]}>
                          {task.priority}
                        </Badge>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Icon className="h-3.5 w-3.5" />
                          <span className="text-[10px]">
                            {new Date(task.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {displayTasks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-success/40" />
              <p className="font-medium">All caught up!</p>
              <p className="text-sm">No {tab === "today" ? "tasks for today" : "upcoming tasks"}.</p>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default DailyTasks;
