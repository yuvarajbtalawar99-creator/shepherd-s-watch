import { useState } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import { motion } from "framer-motion";
import { Syringe, Thermometer, Heart, Stethoscope, CheckCircle, Zap } from "lucide-react";
import { toast } from "sonner";

const actions = [
  { id: "vaccinated", label: "Vaccinated Today", icon: Syringe, color: "bg-accent text-accent-foreground" },
  { id: "sick", label: "Sick Today", icon: Thermometer, color: "bg-destructive text-destructive-foreground" },
  { id: "pregnant", label: "Pregnant Confirmed", icon: Heart, color: "bg-primary text-primary-foreground" },
  { id: "vet", label: "Vet Visited", icon: Stethoscope, color: "bg-success text-success-foreground" },
];

const recentSheep = [
  { id: "1", name: "Bella", tag: "SC-001" },
  { id: "2", name: "Luna", tag: "SC-002" },
  { id: "3", name: "Thor", tag: "SC-003" },
  { id: "4", name: "Daisy", tag: "SC-004" },
  { id: "5", name: "Rocky", tag: "SC-005" },
  { id: "6", name: "Nala", tag: "SC-006" },
];

const HerdingMode = () => {
  const [selectedSheep, setSelectedSheep] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [logged, setLogged] = useState<string[]>([]);

  const handleLog = () => {
    if (!selectedSheep || !selectedAction) return;
    const sheep = recentSheep.find(s => s.id === selectedSheep);
    const action = actions.find(a => a.id === selectedAction);
    if (sheep && action) {
      const key = `${sheep.id}-${action.id}`;
      setLogged(prev => [...prev, key]);
      toast.success(`${action.label} logged for ${sheep.name}`, {
        icon: <CheckCircle className="h-4 w-4" />,
      });
      setSelectedSheep(null);
      setSelectedAction(null);
    }
  };

  return (
    <PageWrapper
      title="Herding Mode"
      subtitle="Quick one-tap logging — optimized for outdoor use"
    >
      <div className="max-w-lg mx-auto">
        {/* Step 1: Select Sheep */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">1</span>
            Select Sheep
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {recentSheep.map(sheep => (
              <button
                key={sheep.id}
                onClick={() => setSelectedSheep(sheep.id)}
                className={`p-4 rounded-2xl text-left transition-all duration-200 active:scale-95 ${
                  selectedSheep === sheep.id
                    ? "bg-primary text-primary-foreground shadow-soft-lg ring-2 ring-primary/30"
                    : "glass-card hover:shadow-soft-lg"
                }`}
              >
                <p className="font-heading font-bold text-lg">{sheep.name}</p>
                <p className={`text-xs font-mono ${selectedSheep === sheep.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{sheep.tag}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Step 2: Select Action */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">2</span>
            Quick Action
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {actions.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => setSelectedAction(action.id)}
                  className={`action-button flex flex-col items-center gap-2 ${
                    selectedAction === action.id
                      ? `${action.color} ring-2 ring-offset-2 ring-offset-background`
                      : "glass-card text-foreground"
                  }`}
                >
                  <Icon className="h-7 w-7" />
                  <span className="text-sm font-semibold">{action.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Log Button */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <button
            onClick={handleLog}
            disabled={!selectedSheep || !selectedAction}
            className={`w-full action-button flex items-center justify-center gap-3 text-xl ${
              selectedSheep && selectedAction
                ? "bg-primary text-primary-foreground shadow-soft-lg"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            <Zap className="h-6 w-6" />
            Log Event
          </button>
        </motion.div>

        {/* Recent Logs */}
        {logged.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Logs</h3>
            <div className="space-y-2">
              {logged.map((log, i) => {
                const [sheepId, actionId] = log.split("-");
                const sheep = recentSheep.find(s => s.id === sheepId);
                const action = actions.find(a => a.id === actionId);
                return (
                  <div key={i} className="glass-card p-3 flex items-center gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-success shrink-0" />
                    <span className="text-foreground font-medium">{sheep?.name}</span>
                    <span className="text-muted-foreground">— {action?.label}</span>
                    <span className="text-xs text-muted-foreground/60 ml-auto">Just now</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </PageWrapper>
  );
};

export default HerdingMode;
