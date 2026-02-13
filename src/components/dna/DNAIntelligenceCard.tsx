import { DNAAnalysis } from "@/types/sheep";
import { motion } from "framer-motion";
import { Shield, Activity, Heart, Clock, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface DNAIntelligenceCardProps {
    analysis: DNAAnalysis;
}

export const DNAIntelligenceCard = ({ analysis }: DNAIntelligenceCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Header: Overview & Confidence */}
            <div className="flex items-start justify-between">
                <div>
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" /> Genetic Risk Profile
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px]">
                        Analysis based on extracted markers from validated lab reports.
                    </p>
                </div>
                <div className="text-right">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1.5 text-[10px] py-1">
                        <Activity className="h-3 w-3" /> {Math.round(analysis.confidence_level * 100)}% Confidence
                    </Badge>
                </div>
            </div>

            {/* Life Expectancy & Summary */}
            <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-3 border-primary/10">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1">
                        <Clock className="h-3 w-3" /> Life Expectancy
                    </div>
                    <p className="text-lg font-bold text-foreground">
                        {analysis.life_expectancy_min}-{analysis.life_expectancy_max} <span className="text-xs font-normal">Years</span>
                    </p>
                </div>
                <div className="glass-card p-3 border-success/10">
                    <div className="flex items-center gap-2 text-[10px] text-success mb-1">
                        <CheckCircle2 className="h-3 w-3" /> Status
                    </div>
                    <p className="text-sm font-bold text-foreground line-clamp-1">
                        {analysis.summary.split('.')[0]}
                    </p>
                </div>
            </div>

            {/* Disease Susceptibility Scores */}
            <div className="space-y-4">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Genetic Risk Indicators</h5>
                <div className="space-y-3">
                    {analysis.risk_indicators.map((risk, i) => (
                        <div key={i} className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold">{risk.disease}</span>
                                <span className={risk.susceptibility > 60 ? "text-destructive" : "text-success"}>
                                    {risk.label} ({risk.susceptibility}%)
                                </span>
                            </div>
                            <Progress
                                value={risk.susceptibility}
                                className="h-1"
                            // custom style via class logic
                            />
                            <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                                "{risk.recommendation}"
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Ethical Disclaimer */}
            <div className="bg-warning/5 border border-warning/20 p-3 rounded-lg flex gap-3">
                <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-[9px] text-warning-foreground leading-normal">
                    <span className="font-bold">Disclaimer:</span> This is a genetic risk assessment, NOT a medical diagnosis. Genetic markers represent probabilities based on current research. Consult a specialized veterinarian for diagnostic procedures.
                </p>
            </div>
        </motion.div>
    );
};
