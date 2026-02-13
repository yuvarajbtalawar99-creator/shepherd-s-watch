import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TrustBadgeProps {
    verified: boolean;
    hash?: string;
    className?: string;
}

export default function TrustBadge({ verified, hash, className }: TrustBadgeProps) {
    if (!verified) return null;

    return (
        <div className={cn("inline-flex items-center gap-1.5", className)}>
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.8, 1, 0.8]
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-success/20 shadow-sm shadow-success/20 border border-success/30"
            >
                <ShieldCheck className="h-3 w-3 text-success" />
            </motion.div>
            <Badge variant="outline" className="text-[8px] font-bold tracking-tighter uppercase px-1 py-0 border-success/30 text-success bg-success/5">
                SEALED
            </Badge>
        </div>
    );
}
