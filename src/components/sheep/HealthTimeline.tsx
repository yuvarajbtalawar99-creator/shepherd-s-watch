import { useState } from "react";
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
  ExternalLink,
  ShieldAlert,
  Loader2
} from "lucide-react";
import TrustBadge from "../shared/TrustBadge";
import VerificationModal from "../shared/VerificationModal";
import { BlockchainNotaryService } from "@/lib/BlockchainNotaryService";
import { toast } from "sonner";

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
  const [activeVerification, setActiveVerification] = useState<{ id: string; name: string } | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'scanning' | 'verifying' | 'success' | 'failed'>('scanning');

  const handleVerify = async (event: HealthEvent) => {
    setActiveVerification({ id: event.id, name: event.title });
    setVerificationStatus('scanning');

    // Simulate real blockchain latency for premium feel
    await new Promise(r => setTimeout(r, 1500));
    setVerificationStatus('verifying');
    await new Promise(r => setTimeout(r, 2000));

    try {
      if (!event.blockchain_hash) {
        setVerificationStatus('failed');
        toast.error("Integrity Error: No blockchain anchor found for this record.");
        return;
      }

      // Verify logic: we use the new production verification method
      const status = await BlockchainNotaryService.verifyIntegrity(event.sheep_id, event);

      setVerificationStatus(status === 'verified' ? 'success' : 'failed');
      if (status === 'tampered') {
        toast.error("Security Alert: Local record does not match blockchain footprint!");
      } else if (status === 'not_anchored') {
        toast.error("Record not yet anchored on blockchain.");
      }
    } catch (err) {
      setVerificationStatus('failed');
      toast.error("Blockchain network error. Please check your connection.");
    }
  };

  const sorted = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
      <div className="space-y-1">
        {sorted.map((event, i) => {
          const config = eventConfig[event.type] || { icon: Stethoscope, color: "text-muted-foreground", bg: "bg-muted" };
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
              <div className="glass-card flex-1 p-4 mb-3 hover:border-primary/20 transition-colors group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-foreground">{event.title}</h4>
                      <TrustBadge verified={event.verified} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{event.description}</p>

                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      {event.administered_by && (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="h-3 w-3 text-success" />
                          <p className="text-[10px] font-medium text-muted-foreground/80">
                            {event.administered_by}
                          </p>
                        </div>
                      )}

                      <p className="text-[10px] font-medium text-muted-foreground/60">
                        {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>

                      {event.blockchain_tx && (
                        <a
                          href={`https://amoy.polygonscan.com/tx/${event.blockchain_tx}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] text-primary hover:underline"
                        >
                          <ExternalLink className="h-2.5 w-2.5" />
                          On-Chain Proof
                        </a>
                      )}
                    </div>
                  </div>

                  {event.verified ? (
                    <button
                      onClick={() => handleVerify(event)}
                      className="shrink-0 p-2 rounded-lg bg-muted/50 hover:bg-primary/5 hover:text-primary transition-all flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100"
                    >
                      <Shield className="h-3 w-3" />
                      <span className="text-[8px] font-bold uppercase">Audit</span>
                    </button>
                  ) : (
                    <div className="shrink-0 text-[10px] text-muted-foreground flex flex-col items-end">
                      <span>{new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <VerificationModal
        isOpen={!!activeVerification}
        onClose={() => setActiveVerification(null)}
        status={verificationStatus}
        recordName={activeVerification?.name || ""}
      />
    </div>
  );
};

export default HealthTimeline;
