import { motion } from "framer-motion";
import { HealthEvent } from "@/types/sheep";
import {
  Baby,
  Syringe,
  Bug,
  Stethoscope,
  Heart,
  Scale,
  ShoppingCart,
  Shield,
  CheckCircle,
} from "lucide-react";

const eventConfig: Record<HealthEvent["type"], { icon: typeof Baby; color: string; bg: string }> = {
  birth: { icon: Baby, color: "text-success", bg: "bg-success/10" },
  vaccination: { icon: Syringe, color: "text-accent", bg: "bg-accent/10" },
  deworming: { icon: Bug, color: "text-warning", bg: "bg-warning/10" },
  illness: { icon: Stethoscope, color: "text-destructive", bg: "bg-destructive/10" },
  pregnancy: { icon: Heart, color: "text-primary", bg: "bg-primary/10" },
  lambing: { icon: Baby, color: "text-success", bg: "bg-success/10" },
  vet_visit: { icon: Stethoscope, color: "text-accent", bg: "bg-accent/10" },
  sale: { icon: ShoppingCart, color: "text-muted-foreground", bg: "bg-muted" },
  weight_check: { icon: Scale, color: "text-primary", bg: "bg-primary/10" },
};

interface HealthTimelineProps {
  events: HealthEvent[];
}

const HealthTimeline = ({ events }: HealthTimelineProps) => {
  const sorted = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
      <div className="space-y-1">
        {sorted.map((event, i) => {
          const config = eventConfig[event.type];
          const Icon = config.icon;
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              className="relative flex items-start gap-4 pl-0"
            >
              <div className={`relative z-10 w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-5 w-5 ${config.color}`} />
              </div>
              <div className="glass-card flex-1 p-4 mb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{event.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                    {event.administered_by && (
                      <p className="text-xs text-muted-foreground/70 mt-1">By: {event.administered_by}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {event.verified && (
                      <div className="flex items-center gap-1 text-success">
                        <CheckCircle className="h-3 w-3" />
                        <span className="text-[10px] font-medium">Verified</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default HealthTimeline;
