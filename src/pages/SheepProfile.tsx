import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import PageWrapper from "@/components/layout/PageWrapper";
import HealthScoreGauge from "@/components/sheep/HealthScoreGauge";
import HealthTimeline from "@/components/sheep/HealthTimeline";
import { supabase } from "@/lib/supabase";
import { Sheep, HealthEvent, DNAAnalysis } from "@/types/sheep";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, QrCode, Shield, Calendar, Weight, Tag, X, Loader2, FileText, Edit,
  Heart, AlertTriangle, Syringe, Baby, Download, Trash2, Camera, Info, BrainCircuit,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { generateHealthReport } from "@/lib/HealthReportGenerator";
import { EditSheepSheet } from "@/components/sheep/EditSheepSheet";
import { useQuery } from "@tanstack/react-query";
import { DNAIntelligenceCard } from "@/components/dna/DNAIntelligenceCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineageService } from "@/lib/LineageService";
import LineageTree from "@/components/sheep/LineageTree";
import AncestryCertificate from "@/components/sheep/AncestryCertificate";
import TrustStatsCard from "@/components/sheep/TrustStatsCard";

const statusConfig = {
  healthy: { label: "Healthy", className: "bg-success/10 text-success border-success/20" },
  sick: { label: "Sick", className: "bg-destructive/10 text-destructive border-destructive/20" },
  pregnant: { label: "Pregnant", className: "bg-primary/10 text-primary border-primary/20" },
  lactating: { label: "Lactating", className: "bg-accent/10 text-accent border-accent/20" },
};

const riskExplanation = {
  low: "All health metrics are within normal range. Keep up the good care!",
  medium: "Some indicators need attention. Check vaccination schedule and recent health events.",
  high: "Immediate attention required. Multiple health factors are concerning.",
};

const SheepProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showQR, setShowQR] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: sheep, isLoading: isLoadingSheep, error: sheepError, refetch: refetchSheep } = useQuery({
    queryKey: ["sheep", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sheep")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Sheep;
    },
  });

  const { data: analysis, isLoading: isLoadingAnalysis } = useQuery({
    queryKey: ["dna-analysis", id],
    queryFn: async () => {
      if (!sheep?.latest_analysis_id) return null;
      const { data, error } = await supabase
        .from("dna_analysis")
        .select("*")
        .eq("id", sheep.latest_analysis_id)
        .single();
      if (error) throw error;
      return data as unknown as DNAAnalysis;
    },
    enabled: !!sheep?.latest_analysis_id,
  });

  const { data: events = [], isLoading: isLoadingEvents, refetch: refetchEvents } = useQuery({
    queryKey: ["health-events", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_events")
        .select("*")
        .eq("sheep_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as HealthEvent[];
    },
  });

  const { data: ancestry, isLoading: isLoadingAncestry } = useQuery({
    queryKey: ["ancestry", id],
    queryFn: () => LineageService.getAncestry(id!),
    enabled: !!id,
  });

  const { data: descendants = [] } = useQuery({
    queryKey: ["descendants", id],
    queryFn: () => LineageService.getDescendants(id!),
    enabled: !!id,
  });

  const loading = isLoadingSheep || isLoadingEvents;
  const error = sheepError;

  const handleDelete = async () => {
    if (!sheep) return;
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('sheep')
        .delete()
        .eq('id', sheep.id);

      if (error) throw error;

      toast.success(`${sheep.name} has been removed from the registry`);
      navigate('/sheep');
    } catch (err) {
      console.error("Error deleting sheep:", err);
      toast.error("Failed to delete sheep record");
    } finally {
      setIsDeleting(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!sheep) return;
    toast.info("Generating Health Report...");
    try {
      await generateHealthReport(sheep, events);
      toast.success("Health Report downloaded!");
    } catch (err) {
      console.error("Error generating report:", err);
      toast.error("Failed to generate report");
    }
  };

  const handleDownloadQR = async () => {
    if (!sheep) return;
    try {
      const qrDataUrl = await QRCode.toDataURL(sheep.qr_code || sheep.id, {
        width: 1024,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff"
        }
      });

      const link = document.createElement("a");
      link.href = qrDataUrl;
      link.download = `QR_${sheep.tag_id}_${sheep.name}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("QR Code downloaded!");
    } catch (err) {
      console.error("Error downloading QR:", err);
      toast.error("Failed to download QR code");
    }
  };

  const onUpdate = () => {
    refetchSheep();
    refetchEvents();
  };

  if (loading) {
    return (
      <PageWrapper title="" subtitle="">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageWrapper>
    );
  }

  if (error || !sheep) {
    return (
      <PageWrapper title="Sheep Not Found" subtitle="This sheep ID does not exist.">
        <div className="text-center p-12">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-4">Sheep Not Found</h2>
          <Button onClick={() => navigate("/sheep")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Registry
          </Button>
        </div>
      </PageWrapper>
    );
  }

  // Smart Health Score Override Logic
  const displayScore = useMemo(() => {
    if (!sheep) return 0;
    // If sick or high risk, score should NEVER be "Excellent"
    if (sheep.status === 'sick' || sheep.risk_level === 'high') {
      return Math.min(sheep.health_score, 45); // Cap at 45 (Moderate/Risk)
    }
    return sheep.health_score;
  }, [sheep]);

  // Background Data Correction Sync - with stable dependency
  const lastSyncedId = useMemo(() => `${sheep?.id}-${sheep?.status}-${sheep?.health_score}`, [sheep]);
  const [syncId, setSyncId] = useState<string>("");

  useEffect(() => {
    const syncHealthData = async () => {
      if (!sheep || syncId === lastSyncedId) return;

      const needsSync =
        (sheep.status === 'sick' && (sheep.health_score > 45 || (sheep.risk_level || 'high') !== 'high')) ||
        (sheep.status === 'healthy' && (sheep.health_score || 0) < 60 && (sheep.risk_level || 'low') === 'high');

      if (needsSync) {
        console.log(`[HealthSync] Correction needed for ${sheep.name} (${sheep.id})`);
        setSyncId(lastSyncedId); // Mark as syncing to prevent immediate re-run

        const corrections: Partial<Sheep> = {};

        if (sheep.status === 'sick') {
          corrections.health_score = 35;
          corrections.risk_level = 'high';
        } else if (sheep.status === 'healthy') {
          corrections.health_score = 85;
          corrections.risk_level = 'low';
        }

        const { error } = await supabase
          .from('sheep')
          .update(corrections)
          .eq('id', sheep.id);

        if (!error) {
          console.log("[HealthSync] DB entry synchronized successfully.");
        }
      }
    };

    syncHealthData();
  }, [sheep, lastSyncedId, syncId]);

  const age = sheep.date_of_birth ? Math.max(0, new Date().getFullYear() - new Date(sheep.date_of_birth).getFullYear()) : "??";
  const statusCfg = (statusConfig as any)[sheep.status] || { label: "Unknown", className: "bg-muted text-muted-foreground" };
  const riskLevel = sheep.risk_level || "low";

  return (
    <PageWrapper
      title={sheep.name}
      subtitle={`Tag: ${sheep.tag_id} • ${sheep.breed || 'Unknown Breed'}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/sheep")} className="rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadReport} className="rounded-xl">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button size="sm" onClick={() => setIsEditOpen(true)} className="rounded-xl">
            <Edit className="h-4 w-4 mr-2" /> Edit Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteConfirmOpen(true)}
            className="rounded-xl text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <div className="glass-card p-6 text-center">
            {/* Main Image or Avatar */}
            {sheep.front_image_url ? (
              <div className="w-32 h-32 rounded-2xl mx-auto mb-4 overflow-hidden shadow-md border-2 border-border">
                <img src={sheep.front_image_url} alt={sheep.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🐑</span>
              </div>
            )}

            <h2 className="text-xl font-heading font-bold text-foreground">{sheep.name}</h2>
            <p className="text-sm text-muted-foreground font-mono">{sheep.tag_id}</p>
            <div className="flex justify-center gap-2 mt-3">
              <Badge variant="outline" className={statusCfg.className}>{statusCfg.label}</Badge>
            </div>

            <div className="my-6">
              <HealthScoreGauge score={displayScore} size={160} label="Health Credit Score" />
            </div>

            {/* Risk Level */}
            <div className={`rounded-xl p-3 text-left ${riskLevel === "high" ? "bg-destructive/10" : riskLevel === "medium" ? "bg-warning/10" : "bg-success/10"}`}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{
                color: riskLevel === "high" ? "hsl(4,70%,58%)" : riskLevel === "medium" ? "hsl(38,80%,55%)" : "hsl(152,50%,45%)"
              }}>
                {riskLevel.toUpperCase()} RISK
              </p>
              <p className="text-xs text-foreground/80">{(riskExplanation as any)[riskLevel] || "No risk data available."}</p>
            </div>

            {/* Details */}
            <div className="mt-5 space-y-3 text-left">
              {[
                { icon: Tag, label: "Breed", value: sheep.breed || "Unknown" },
                { icon: Calendar, label: "Age", value: `${age} years` },
                { icon: Weight, label: "Weight", value: sheep.weight_kg ? `${sheep.weight_kg} kg` : "N/A" },
                { icon: Shield, label: "Gender", value: sheep.gender ? (sheep.gender === "female" ? "Female ♀" : "Male ♂") : "Unknown" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">{item.label}</p>
                    <p className="text-sm font-medium text-foreground">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-border/50 pt-6">
              <TrustStatsCard
                onChainCount={events.filter(e => e.verified).length}
                totalCount={events.length}
              />
            </div>

            <Button variant="outline" className="w-full mt-6 gap-2 rounded-xl" onClick={() => setShowQR(true)}>
              <QrCode className="h-4 w-4" /> View QR Code
            </Button>

            {/* QR Modal */}
            <AnimatePresence>
              {showQR && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4"
                  onClick={() => setShowQR(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.9 }}
                    className="glass-card p-6 text-center relative max-w-xs w-full"
                    onClick={e => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 rounded-xl" onClick={() => setShowQR(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                    <h4 className="font-heading font-bold text-foreground mb-1">{sheep.name}</h4>
                    <p className="text-xs text-muted-foreground font-mono mb-4">{sheep.tag_id}</p>
                    <div className="bg-card p-4 rounded-2xl inline-block mb-4">
                      <QRCodeSVG value={sheep.qr_code || sheep.id} size={180} level="H" />
                    </div>
                    <Button
                      variant="outline"
                      className="w-full gap-2 rounded-xl mb-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadQR();
                      }}
                    >
                      <Download className="h-4 w-4" /> Download QR Image
                    </Button>
                    <p className="text-xs text-muted-foreground">Scan to view health passport</p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Tabs defaultValue="health" className="w-full">
            <TabsList className="bg-muted/50 p-1 rounded-xl mb-4">
              <TabsTrigger value="health" className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Health Passport</TabsTrigger>
              <TabsTrigger value="lineage" className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Lineage & Trust</TabsTrigger>
            </TabsList>

            <TabsContent value="health">
              <div className="glass-card p-6 h-full">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="section-title">Digital DNA — Health Passport</h3>
                  {sheep.dna_report_url && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-success text-white border-0 gap-1.5 px-2">
                        <Shield className="h-3 w-3" /> VERIFIED DNA
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] font-bold uppercase tracking-wider"
                        onClick={() => window.open(sheep.dna_report_url, '_blank')}
                      >
                        View Report
                      </Button>
                    </div>
                  )}
                </div>

                {analysis && (
                  <div className="mt-6 border-t border-border/50 pt-6">
                    <DNAIntelligenceCard analysis={analysis} />
                  </div>
                )}

                {events.length > 0 ? (
                  <div className={analysis ? "mt-8" : "mt-0"}>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-4">Health Timeline</h4>
                    <HealthTimeline events={events} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-muted-foreground text-sm mb-4">No health events recorded yet.</p>
                    {!sheep.dna_report_url && (
                      <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)} className="gap-2">
                        <Shield className="h-4 w-4" /> Add DNA Report
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="lineage">
              <div className="space-y-6">
                <div className="glass-card p-6">
                  <h3 className="section-title mb-1">Family Tree</h3>
                  <p className="text-xs text-muted-foreground mb-6">Interactive ancestry mapping and DNA-verified parentage.</p>

                  {isLoadingAncestry ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                    </div>
                  ) : ancestry ? (
                    <LineageTree root={ancestry} />
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-sm text-muted-foreground">No lineage data available for this sheep.</p>
                    </div>
                  )}
                </div>

                <AncestryCertificate
                  sheep={sheep}
                  sire={ancestry?.sire?.sheep}
                  dam={ancestry?.dam?.sheep}
                  analysis={analysis || undefined}
                />

                {descendants.length > 0 && (
                  <div className="glass-card p-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Direct Offspring</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {descendants.map(child => (
                        <Link
                          key={child.id}
                          to={`/sheep/${child.id}`}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 border border-border/40 transition-all group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                            {child.gender === 'male' ? "🐏" : "🐑"}
                          </div>
                          <div>
                            <p className="text-sm font-bold group-hover:text-primary transition-colors">{child.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{child.tag_id}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground/40 group-hover:text-primary" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card max-w-sm w-full p-6 shadow-2xl border-destructive/20"
            >
              <div className="flex items-center gap-3 text-destructive mb-4">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Trash2 className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">Delete Record?</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to delete <strong>{sheep.name}</strong>? This action is permanent and will remove all health history and DNA records.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 rounded-xl"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Sheet */}
      <EditSheepSheet
        sheep={sheep}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onUpdate={onUpdate}
      />
    </PageWrapper>
  );
};

export default SheepProfile;
