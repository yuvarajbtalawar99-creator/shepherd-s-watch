import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sheep, DNAAnalysis } from "@/types/sheep";
import { ShieldCheck, ChevronRight, Dna, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LineageNode {
    sheep: Sheep;
    sire?: LineageNode;
    dam?: LineageNode;
}

interface LineageTreeProps {
    root: LineageNode;
}

export default function LineageTree({ root }: LineageTreeProps) {
    const renderNode = (node: LineageNode, label: string, isRoot = false) => {
        return (
            <div className="flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                        "p-3 rounded-xl border w-40 glass-card relative group transition-all",
                        isRoot ? "border-primary/50 shadow-lg shadow-primary/10" : "border-border/50 hover:border-primary/30"
                    )}
                >
                    <div className="flex flex-col items-center text-center">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl mb-1 shadow-inner">
                            {node.sheep.gender === 'male' ? "🐏" : "🐑"}
                        </div>
                        <Link to={`/sheep/${node.sheep.id}`} className="text-xs font-bold hover:text-primary truncate w-full">
                            {node.sheep.name}
                        </Link>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-tight">{node.sheep.tag_id}</p>

                        <div className="mt-1 flex gap-1">
                            {node.sheep.dna_verified && (
                                <ShieldCheck className="h-3 w-3 text-success" />
                            )}
                            {label && (
                                <span className="text-[8px] font-bold text-muted-foreground/60 uppercase">{label}</span>
                            )}
                        </div>
                    </div>

                    <Link
                        to={`/sheep/${node.sheep.id}`}
                        className="absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-md border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <ChevronRight className="h-3 w-3 text-primary" />
                    </Link>
                </motion.div>
            </div>
        );
    };

    return (
        <div className="p-8 overflow-x-auto min-h-[400px]">
            <div className="flex flex-col items-center gap-12 min-w-max">
                {/* Parents Level */}
                <div className="flex gap-20 relative">
                    {/* Connector lines (simplified) */}
                    <div className="absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-border -z-10" />

                    <div className="flex flex-col items-center gap-4">
                        {root.sire ? renderNode(root.sire, "Sire") : (
                            <div className="w-40 h-24 border-2 border-dashed border-border/30 rounded-xl flex items-center justify-center text-[10px] text-muted-foreground">
                                Sire unknown
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        {root.dam ? renderNode(root.dam, "Dam") : (
                            <div className="w-40 h-24 border-2 border-dashed border-border/30 rounded-xl flex items-center justify-center text-[10px] text-muted-foreground">
                                Dam unknown
                            </div>
                        )}
                    </div>
                </div>

                {/* Root Level */}
                <div className="relative">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-border -z-10" />
                    {renderNode(root, "Root", true)}
                </div>
            </div>
        </div>
    );
}
