import { useState, useMemo } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import SheepCard from "@/components/sheep/SheepCard";
import { AddSheepDialog } from "@/components/sheep/AddSheepDialog";
import AddSheepChoiceModal from "@/components/sheep/AddSheepChoiceModal";
import BulkRegistrationWizard from "@/components/sheep/BulkRegistrationWizard";
import { supabase } from "@/lib/supabase";
import { Sheep } from "@/types/sheep";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useTranslation } from "@/contexts/LanguageContext";

type FilterType = "all" | "healthy" | "sick" | "pregnant" | "lactating" | "high_risk";

const SheepList = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterType>("all");
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [showSingleDialog, setShowSingleDialog] = useState(false);
  const [showBulkWizard, setShowBulkWizard] = useState(false);

  const queryClient = useQueryClient();

  // Setup Real-time Subscriptions for parity with Dashboard
  useEffect(() => {
    const channel = supabase
      .channel("sheep-list-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sheep" },
        () => {
          console.log("[Sheep Registry] Real-time update detected, invalidating cache...");
          queryClient.invalidateQueries({ queryKey: ["sheep"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Optimized fetch using narrow selection and React Query caching
  const { data: sheep = [], isLoading, error } = useQuery({
    queryKey: ["sheep"],
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from("sheep")
        .select("id, tag_id, name, status, risk_level, breed, gender, weight_kg, health_score, front_image_url")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      return (data as Sheep[]) || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Filter sheep based on selected filter
  const filtered = useMemo(() => {
    return sheep.filter(s => {
      if (filter === "all") return true;
      if (filter === "high_risk") return s.risk_level === "high";
      return s.status === filter;
    });
  }, [sheep, filter]);

  // Calculate filter counts
  const filters: { key: FilterType; label: string; count: number }[] = useMemo(() => [
    { key: "all", label: t('all'), count: sheep.length },
    { key: "healthy", label: t('healthy'), count: sheep.filter(s => s.status === "healthy").length },
    { key: "pregnant", label: t('pregnant'), count: sheep.filter(s => s.status === "pregnant").length },
    { key: "sick", label: t('sick'), count: sheep.filter(s => s.status === "sick").length },
    { key: "lactating", label: t('lactating'), count: sheep.filter(s => s.status === "lactating").length },
    { key: "high_risk", label: t('highRisk'), count: sheep.filter(s => s.risk_level === "high").length },
  ], [sheep, t]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["sheep"] });
  };

  return (
    <PageWrapper
      title={t('sheepRegistry')}
      subtitle={`${sheep.length} ${t('sheepInFlock')}`}
      actions={
        <Button
          onClick={() => setShowChoiceModal(true)}
          className="rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> {t('addSheep')}
        </Button>
      }
    >
      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('errorLoadingSheep')}</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load sheep"}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="ml-4"
            >
              {t('tryAgain')}
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
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && sheep.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">{t('noSheepInFlock')}</p>
          <Button onClick={() => setShowChoiceModal(true)}>
            <Plus className="h-4 w-4 mr-2" /> {t('addFirstSheep')}
          </Button>
        </div>
      )}

      {/* Sheep Grid */}
      {!isLoading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((sheep, i) => (
            <SheepCard key={sheep.id} sheep={sheep} index={i} />
          ))}
        </div>
      )}

      {/* No Results for Filter */}
      {!isLoading && !error && sheep.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('noSheepMatchFilter')}</p>
        </div>
      )}

      {/* Modals */}
      <AddSheepChoiceModal
        open={showChoiceModal}
        onOpenChange={setShowChoiceModal}
        onChooseSingle={() => setShowSingleDialog(true)}
        onChooseBulk={() => setShowBulkWizard(true)}
        onSuccess={handleRefresh}
      />

      <AddSheepDialog
        open={showSingleDialog}
        onOpenChange={setShowSingleDialog}
        onSuccess={handleRefresh}
      />

      <BulkRegistrationWizard
        open={showBulkWizard}
        onOpenChange={setShowBulkWizard}
        onSuccess={handleRefresh}
      />
    </PageWrapper>
  );
};

export default SheepList;
