import { motion } from "framer-motion";
import { ShieldCheck, Info } from "lucide-react";

interface TrustStatsCardProps {
    onChainCount: number;
    totalCount: number;
}

export default function TrustStatsCard({ onChainCount, totalCount }: TrustStatsCardProps) {
    const percentage = totalCount > 0 ? Math.round((onChainCount / totalCount) * 100) : 0;

    let tier = "Standard";
    let tierColor = "text-muted-foreground";
    if (percentage > 90) { tier = "Platinum Immutable"; tierColor = "text-primary italic"; }
    else if (percentage > 60) { tier = "Gold Trusted"; tierColor = "text-warning"; }
    else if (percentage > 0) { tier = "Verified Entry"; tierColor = "text-success"; }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-4 border-success/20 bg-gradient-to-br from-success/5 to-transparent relative overflow-hidden"
        >
            <div className="absolute -right-4 -top-4 opacity-5">
                <ShieldCheck className="h-24 w-24" />
            </div>

            <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4 text-success" />
                </div>
                <div>
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Guardian Trust Rating</h4>
                    <p className={cn("text-sm font-black", tierColor)}>{tier}</p>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-end justify-between">
                    <span className="text-2xl font-black text-foreground">{percentage}%</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{onChainCount}/{totalCount} SECURED</span>
                </div>

                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className="h-full bg-success shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                    />
                </div>

                <p className="text-[9px] text-muted-foreground flex items-center gap-1 mt-2">
                    <Info className="h-2.5 w-2.5" />
                    Cryptographically notarized on Polygon layer.
                </p>
            </div>
        </motion.div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
