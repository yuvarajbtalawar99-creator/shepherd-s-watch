import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface HealthScoreGaugeProps {
  score: number;
  size?: number;
  label?: string;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "hsl(152, 50%, 45%)";
  if (score >= 60) return "hsl(152, 35%, 55%)";
  if (score >= 40) return "hsl(38, 80%, 55%)";
  return "hsl(4, 70%, 58%)";
};

const getScoreLabel = (score: number) => {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Moderate";
  return "At Risk";
};

const HealthScoreGauge = ({ score, size = 140, label }: HealthScoreGaugeProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;
  const color = getScoreColor(score);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 200);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-2xl font-heading font-bold"
            style={{ color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {animatedScore}
          </motion.span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
            {getScoreLabel(score)}
          </span>
        </div>
      </div>
      {label && <p className="text-sm text-muted-foreground font-medium">{label}</p>}
    </div>
  );
};

export default HealthScoreGauge;
