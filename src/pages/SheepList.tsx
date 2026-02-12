import { useState } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import SheepCard from "@/components/sheep/SheepCard";
import { mockSheep } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type FilterType = "all" | "healthy" | "sick" | "pregnant" | "high_risk";

const SheepList = () => {
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = mockSheep.filter(s => {
    if (filter === "all") return true;
    if (filter === "high_risk") return s.risk_level === "high";
    return s.status === filter;
  });

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: "All", count: mockSheep.length },
    { key: "healthy", label: "Healthy", count: mockSheep.filter(s => s.status === "healthy").length },
    { key: "pregnant", label: "Pregnant", count: mockSheep.filter(s => s.status === "pregnant").length },
    { key: "sick", label: "Sick", count: mockSheep.filter(s => s.status === "sick").length },
    { key: "high_risk", label: "High Risk", count: mockSheep.filter(s => s.risk_level === "high").length },
  ];

  return (
    <PageWrapper
      title="Sheep Registry"
      subtitle={`${mockSheep.length} sheep in your flock`}
      actions={
        <Button className="rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Sheep
        </Button>
      }
    >
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f.label}
            <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${filter === f.key ? "bg-primary-foreground/20 text-primary-foreground" : ""}`}>
              {f.count}
            </Badge>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((sheep, i) => (
          <SheepCard key={sheep.id} sheep={sheep} index={i} />
        ))}
      </div>
    </PageWrapper>
  );
};

export default SheepList;
