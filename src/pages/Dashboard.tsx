import { useMemo, useState } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import StatCard from "@/components/dashboard/StatCard";
import { supabase } from "@/lib/supabase";
import { Sheep, DailyTask, HealthEvent } from "@/types/sheep";
import { Heart, AlertTriangle, Syringe, Baby, ListChecks, TrendingUp, ScanLine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import QRScanner from "@/components/scanner/QRScanner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

import { format, subMonths, isSameMonth, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useTranslation } from "@/contexts/LanguageContext";

const Dashboard = () => {
  const { t } = useTranslation();
  const [showScanner, setShowScanner] = useState(false);
  const queryClient = useQueryClient();

  // Setup Real-time Subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sheep" },
        () => {
          console.log("[Dashboard] Real-time sheep update detected...");
          queryClient.invalidateQueries({ queryKey: ["sheep"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_tasks" },
        () => queryClient.invalidateQueries({ queryKey: ["daily_tasks"] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "health_events" },
        () => queryClient.invalidateQueries({ queryKey: ["health_events"] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // 1. Fetch Sheep (Vital for Stats)
  const { data: sheep = [], isLoading: isLoadingSheep } = useQuery({
    queryKey: ['sheep'],
    queryFn: async () => {
      const { data } = await supabase
        .from("sheep")
        .select("id, status, risk_level, health_score");
      return (data as Sheep[]) || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // 2. Fetch Tasks (For Compliance Chart)
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['daily_tasks'],
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_tasks")
        .select("id, type, due_date, completed");
      return (data as DailyTask[]) || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // 3. Fetch Health Events (For Trends)
  const { data: healthEvents = [], isLoading: isLoadingHealth } = useQuery({
    queryKey: ['health_events'],
    queryFn: async () => {
      const { data } = await supabase
        .from("health_events")
        .select("id, type, date");
      return (data as HealthEvent[]) || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Recalculate charts only when data changes
  const months = useMemo(() => {
    const monthsList = [];
    for (let i = 5; i >= 0; i--) {
      // Normalize to start of month for consistent matching
      const d = subMonths(new Date(), i);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      monthsList.push(d);
    }
    return monthsList;
  }, []);

  const monthlyVacc = useMemo(() => {
    return months.map(monthDate => {
      // Count actual vaccinations from health_events
      const completedCount = healthEvents.filter(e =>
        e.type === 'vaccination' &&
        e.date &&
        isSameMonth(parseISO(e.date), monthDate)
      ).length;

      // Count pending tasks from daily_tasks
      const dueCount = tasks.filter(t =>
        t.type === 'vaccination' &&
        !t.completed &&
        t.due_date &&
        isSameMonth(parseISO(t.due_date), monthDate)
      ).length;

      return {
        month: format(monthDate, 'MMM'),
        completed: completedCount,
        due: dueCount
      };
    });
  }, [tasks, healthEvents, months]);

  const illnessTrend = useMemo(() => {
    return months.map(monthDate => {
      const monthIllnesses = healthEvents.filter(e =>
        e.type === 'illness' &&
        e.date &&
        isSameMonth(parseISO(e.date), monthDate)
      );
      return {
        month: format(monthDate, 'MMM'),
        cases: monthIllnesses.length
      };
    });
  }, [healthEvents, months]);

  // Derived Stats
  const totalSheep = sheep.length;
  const pregnant = sheep.filter(s => s.status === "pregnant").length;
  const highRisk = sheep.filter(s => s.risk_level === "high").length;
  const pendingTasks = tasks.filter(t => !t.completed).length;

  const healthDist = [
    { name: `${t('excellent')} (80+)`, value: sheep.filter(s => s.health_score >= 80).length, color: "hsl(152,50%,45%)" },
    { name: `${t('good')} (60-79)`, value: sheep.filter(s => s.health_score >= 60 && s.health_score < 80).length, color: "hsl(152,35%,55%)" },
    { name: `${t('moderate')} (40-59)`, value: sheep.filter(s => s.health_score >= 40 && s.health_score < 60).length, color: "hsl(38,80%,55%)" },
    { name: `${t('atRisk')} (<40)`, value: sheep.filter(s => s.health_score < 40).length, color: "hsl(4,70%,58%)" },
  ];

  return (
    <PageWrapper
      title={t('dashboard')}
      subtitle={t('welcome')}
      actions={
        <Button onClick={() => setShowScanner(true)} className="rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft">
          <ScanLine className="h-5 w-5" /> {t('scanQR')}
        </Button>
      }
    >
      {/* 1. KEY STATS (Priority Loading) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {isLoadingSheep ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : (
          <>
            <StatCard title={t('totalSheep')} value={totalSheep} icon={ListChecks} color="primary" delay={0} trend={{ value: 8, positive: true }} />
            <StatCard title={t('pregnant')} value={pregnant} icon={Baby} color="accent" delay={0.1} />
            <StatCard title={t('highRisk')} value={highRisk} icon={AlertTriangle} color="destructive" delay={0.2} subtitle={t('needsAttention')} />
            {isLoadingTasks ? <Skeleton className="h-32 rounded-xl" /> : <StatCard title={t('tasksDue')} value={pendingTasks} icon={Syringe} color="warning" delay={0.3} />}
          </>
        )}
      </div>

      {/* 2. CHARTS (Secondary Loading) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Health Distribution */}
        {isLoadingSheep ? (
          <Skeleton className="h-[300px] rounded-xl" />
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
            <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" /> {t('healthDist')}
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={healthDist} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                  {healthDist.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Vaccination Compliance */}
        {isLoadingTasks ? (
          <Skeleton className="h-[300px] rounded-xl" />
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
            <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
              <Syringe className="h-4 w-4 text-accent" /> {t('vaccineComp')}
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyVacc}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
                <Bar dataKey="completed" fill="hsl(152,45%,45%)" radius={[6, 6, 0, 0]} name={t('completed')} />
                <Bar dataKey="due" fill="hsl(var(--muted))" radius={[6, 6, 0, 0]} name={t('due')} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

      {/* 3. TRENDS (Lowest Priority) */}
      {
        isLoadingHealth ? (
          <Skeleton className="h-[250px] rounded-xl" />
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
            <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-warning" /> {t('illnessTrends')}
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={illnessTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
                <Line type="monotone" dataKey="cases" stroke="hsl(4,70%,58%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(4,70%,58%)" }} name={t('illnessCases')} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )
      }

      <AnimatePresence>
        {showScanner && <QRScanner onClose={() => setShowScanner(false)} />}
      </AnimatePresence>
    </PageWrapper >
  );
};

export default Dashboard;
