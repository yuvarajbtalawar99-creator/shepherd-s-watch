import { useState, useEffect } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import SheepCard from "@/components/sheep/SheepCard";
import { AddSheepDialog } from "@/components/sheep/AddSheepDialog";
import { supabase } from "@/lib/supabase";
import { Sheep } from "@/types/sheep";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type FilterType = "all" | "healthy" | "sick" | "pregnant" | "lactating" | "high_risk";

const SheepList = () => {
  const [filter, setFilter] = useState<FilterType>("all");
  const [sheep, setSheep] = useState<Sheep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sheep from Supabase
  const fetchSheep = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("sheep")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setSheep(data || []);
    } catch (err) {
      console.error("Error fetching sheep:", err);
      setError(err instanceof Error ? err.message : "Failed to load sheep");
    } finally {
      setLoading(false);
    }
  };

  // Load sheep on component mount
  useEffect(() => {
    fetchSheep();
  }, []);

  // Filter sheep based on selected filter
  const filtered = sheep.filter(s => {
    if (filter === "all") return true;
    if (filter === "high_risk") return s.risk_level === "high";
    return s.status === filter;
  });

  // Calculate filter counts
  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: "All", count: sheep.length },
    { key: "healthy", label: "Healthy", count: sheep.filter(s => s.status === "healthy").length },
    { key: "pregnant", label: "Pregnant", count: sheep.filter(s => s.status === "pregnant").length },
    { key: "sick", label: "Sick", count: sheep.filter(s => s.status === "sick").length },
    { key: "lactating", label: "Lactating", count: sheep.filter(s => s.status === "lactating").length },
    { key: "high_risk", label: "High Risk", count: sheep.filter(s => s.risk_level === "high").length },
  ];

  return (
    <PageWrapper
      title="Sheep Registry"
      subtitle={`${sheep.length} sheep in your flock`}
      actions={
        <AddSheepDialog onSuccess={fetchSheep}>
          <Button className="rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Add Sheep
          </Button>
        </AddSheepDialog>
      }
    >
      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading sheep</AlertTitle>
          <AlertDescription>
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSheep}
              className="ml-4"
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${filter === f.key
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

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && sheep.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No sheep in your flock yet</p>
          <AddSheepDialog onSuccess={fetchSheep}>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Add Your First Sheep
            </Button>
          </AddSheepDialog>
        </div>
      )}

      {/* Sheep Grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((sheep, i) => (
            <SheepCard key={sheep.id} sheep={sheep} index={i} />
          ))}
        </div>
      )}

      {/* No Results for Filter */}
      {!loading && !error && sheep.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No sheep match the selected filter</p>
        </div>
      )}
    </PageWrapper>
  );
};

export default SheepList;
