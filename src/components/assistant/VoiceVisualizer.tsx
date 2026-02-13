import { motion } from "framer-motion";

interface VoiceVisualizerProps {
    isListening: boolean;
}

export const VoiceVisualizer = ({ isListening }: VoiceVisualizerProps) => {
    if (!isListening) return null;

    return (
        <div className="flex items-center justify-center gap-1 h-12">
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    className="w-2 bg-primary rounded-full"
                    animate={{
                        height: ["20%", "100%", "20%"],
                    }}
                    transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: i * 0.1,
                    }}
                    style={{
                        height: "40%",
                    }}
                />
            ))}
        </div>
    );
};
