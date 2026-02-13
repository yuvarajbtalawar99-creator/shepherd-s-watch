import { useState, useEffect } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import { supabase } from "@/lib/supabase";
import { DailyTask } from "@/types/sheep";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Circle, AlertTriangle, Syringe, Baby, Stethoscope, Bug, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "@/contexts/LanguageContext";

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
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [tab, setTab] = useState<"today" | "upcoming">("today");
  const [loading, setLoading] = useState(true);

  // Fetch tasks from Supabase
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("daily_tasks")
      .select("*")
      .order("due_date", { ascending: true });

    if (error) {
      console.error("Error fetching tasks:", error);
      toast.error(t('failedToLoadTasks'));
    } else {
      setTasks(data || []);
    }
  };

  // Initial fetch and real-time subscription
  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      await fetchTasks();
      setLoading(false);
    };

    loadTasks();

    // Set up real-time subscription
    const subscription = supabase
      .channel('tasks-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'daily_tasks' },
        () => {
          console.log('Tasks changed, refreshing...');
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.due_date === todayStr);
  const upcomingTasks = tasks.filter(t => t.due_date > todayStr);
  const displayTasks = tab === "today" ? todayTasks : upcomingTasks;

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));

    // Update in database
    const { error } = await supabase
      .from("daily_tasks")
      .update({ completed: !task.completed })
      .eq("id", id);

    if (error) {
      console.error("Error updating task:", error);
      toast.error(t('failedToUpdateTask'));
      // Revert optimistic update
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: task.completed } : t));
    } else {
      toast.success(task.completed ? t('taskMarkedIncomplete') : t('taskCompleted'));
    }
  };

  if (loading) {
    return (
      <PageWrapper title={t('dailyAssistantTitle')} subtitle={t('loadingTasks')}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title={t('dailyAssistantTitle')} subtitle={t('dailyTaskSubtitle')}>
      <div className="max-w-2xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["today", "upcoming"] as const).map(tabKey => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === tabKey ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
            >
              {tabKey === "today" ? `${t('today')} (${todayTasks.length})` : `${t('upcoming')} (${upcomingTasks.length})`}
            </button>
          ))}
        </div>

        {/* Tasks */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {displayTasks.map((task, i) => {
              const Icon = (typeIcons as any)[task.type] || Circle;
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
                        <Badge variant="outline" className={(priorityColors as any)[task.priority]}>
                          {t(task.priority as any)}
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
              <p className="font-medium">{t('allCaughtUp')}</p>
              <p className="text-sm">{tab === "today" ? t('noTasksToday') : t('noUpcomingTasks')}.</p>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default DailyTasks;
