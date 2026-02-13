import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLine, X, AlertCircle, Syringe, Activity, Baby, Stethoscope, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import HealthScoreGauge from "@/components/sheep/HealthScoreGauge";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Sheep } from "@/types/sheep";

const statusConfig: Record<string, { label: string; className: string }> = {
  healthy: { label: "Healthy", className: "bg-success/10 text-success border-success/20" },
  sick: { label: "Sick", className: "bg-destructive/10 text-destructive border-destructive/20" },
  pregnant: { label: "Pregnant", className: "bg-primary/10 text-primary border-primary/20" },
  lactating: { label: "Lactating", className: "bg-accent/10 text-accent border-accent/20" },
};

interface QRScannerProps {
  onClose: () => void;
  onSelect?: (sheep: Sheep) => void;
  autoSelect?: boolean;
}

const QRScanner = ({ onClose, onSelect, autoSelect }: QRScannerProps) => {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedSheep, setScannedSheep] = useState<Sheep | null>(null);

  const checkDbForSheep = async (code: string) => {
    // Stop scanning while we check the DB
    if (scannerRef.current) {
      try {
        await scannerRef.current.pause();
      } catch (e) {
        console.warn("Failed to pause scanner", e);
      }
    }

    setChecking(true);

    // Expected format handling
    let sheepId = code;
    if (code.includes("sheep/")) {
      sheepId = code.split("sheep/").pop() || "";
    }

    // Clean up if it's a URL
    try {
      if (sheepId.includes("http")) {
        const url = new URL(sheepId);
        const pathParts = url.pathname.split('/');
        // assume last part is ID
        sheepId = pathParts[pathParts.length - 1];
      }
    } catch (e) {
      // Not a URL, proceed as ID
    }

    try {
      const { data, error } = await supabase
        .from('sheep')
        .select('*')
        .or(`id.eq.${sheepId},tag_id.eq.${sheepId}`)
        .single();

      if (error || !data) {
        setError(`No sheep found for code: ${sheepId}`);
        if (scannerRef.current) scannerRef.current.resume();
      } else {
        setScannedSheep(data as Sheep);
        toast.success(`Found: ${data.name} (${data.tag_id})`);

        // Fully stop scanner on success
        if (scannerRef.current) {
          scannerRef.current.stop().catch(() => { });
        }
        setScanning(false);

        // If autoSelect is enabled, trigger selection immediately
        if (autoSelect && onSelect) {
          onSelect(data as Sheep);
          onClose();
        }
      }
    } catch (err) {
      console.error("DB Error", err);
      setError("Database connection failed. Check your internet.");
      if (scannerRef.current) scannerRef.current.resume();
    } finally {
      setChecking(false);
    }
  };

  const startScanner = async () => {
    try {
      setError(null);
      // If already running, clean up first
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }

      const html5Qrcode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5Qrcode;

      await html5Qrcode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          checkDbForSheep(decodedText);
        },
        () => { } // ignore scan failures
      );
      setScanning(true);
    } catch (err) {
      console.error(err);
      setError("Camera access denied. Please allow camera permissions.");
    }
  };

  useEffect(() => {
    startScanner();
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => { });
      }
    };
  }, []);

  const handleGoToProfile = () => {
    if (scannedSheep) {
      if (onSelect) {
        onSelect(scannedSheep);
        onClose();
      } else {
        onClose();
        navigate(`/sheep/${scannedSheep.id}`);
      }
    }
  };

  const handleScanAgain = () => {
    setScannedSheep(null);
    setError(null);
    startScanner();
  };

  const handleQuickAction = async (type: 'vaccination' | 'sick' | 'pregnant' | 'vet_visit') => {
    if (!scannedSheep) return;

    try {
      setChecking(true);

      // 1. Update sheep status if needed
      if (type === 'sick' || type === 'pregnant') {
        const { error: updateError } = await supabase
          .from('sheep')
          .update({ status: type })
          .eq('id', scannedSheep.id);

        if (updateError) throw updateError;

        // Update local state to reflect change immediately
        setScannedSheep({ ...scannedSheep, status: type });
      }

      // 2. Create health event
      const eventTitle = {
        vaccination: "Quick Vaccination",
        sick: "Marked as Sick",
        pregnant: "Confirmed Pregnancy",
        vet_visit: "Vet Checkup"
      }[type];

      const { error: eventError } = await supabase
        .from('health_events')
        .insert({
          sheep_id: scannedSheep.id,
          type: type === 'sick' ? 'illness' : (type === 'pregnant' ? 'pregnancy' : type),
          title: eventTitle,
          description: `Action recorded directly from QR scan on ${new Date().toLocaleDateString()}`,
          date: new Date().toISOString().split('T')[0],
          verified: type === 'vet_visit'
        });

      if (eventError) throw eventError;

      toast.success(`${eventTitle} recorded successfully!`, {
        icon: <CheckCircle2 className="h-4 w-4 text-success" />,
      });
    } catch (err: any) {
      console.error("Quick Action Error:", err);
      toast.error(`Failed to record ${type}: ${err.message}`);
    } finally {
      setChecking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 rounded-xl z-10"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2 mb-4">
          <ScanLine className="h-5 w-5 text-primary" />
          <h3 className="font-heading font-bold text-lg text-foreground">Scan Sheep QR</h3>
        </div>

        <AnimatePresence mode="wait">
          {!scannedSheep && !error && (
            <motion.div key="scanner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div
                id="qr-reader"
                className="w-full rounded-2xl overflow-hidden bg-foreground/5 min-h-[280px]"
              />
              {checking && <p className="text-center text-primary font-bold mt-2 animate-pulse">Checking Registry...</p>}
              <p className="text-xs text-muted-foreground text-center mt-3">
                Point camera at a sheep QR code
              </p>
            </motion.div>
          )}

          {error && (
            <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-destructive/40 mx-auto mb-3" />
              <p className="text-sm text-foreground font-medium mb-1">Scan Error</p>
              <p className="text-xs text-muted-foreground mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" className="rounded-xl" onClick={handleScanAgain}>
                  Try Again
                </Button>
              </div>
            </motion.div>
          )}

          {scannedSheep && (
            <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl mb-4">
                <HealthScoreGauge score={scannedSheep.health_score} size={80} />
                <div className="text-left flex-1">
                  <h4 className="font-heading font-bold text-lg text-foreground">{scannedSheep.name}</h4>
                  <p className="text-sm text-muted-foreground font-mono">{scannedSheep.tag_id}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {scannedSheep.breed} · {scannedSheep.gender === "female" ? "♀" : "♂"} · {scannedSheep.weight_kg}kg
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className={statusConfig[scannedSheep.status]?.className}>
                      {statusConfig[scannedSheep.status]?.label}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 text-xs py-5"
                  onClick={() => handleQuickAction('vaccination')}
                  disabled={checking}
                >
                  <Syringe className="mr-2 h-4 w-4 text-primary" /> Vaccine
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-dashed border-destructive/30 hover:border-destructive hover:bg-destructive/5 text-xs py-5"
                  onClick={() => handleQuickAction('sick')}
                  disabled={checking}
                >
                  <Activity className="mr-2 h-4 w-4 text-destructive" /> Sick
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 text-xs py-5"
                  onClick={() => handleQuickAction('pregnant')}
                  disabled={checking}
                >
                  <Baby className="mr-2 h-4 w-4 text-primary" /> Pregnant
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-dashed border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/5 text-xs py-5"
                  onClick={() => handleQuickAction('vet_visit')}
                  disabled={checking}
                >
                  <Stethoscope className="mr-2 h-4 w-4 text-blue-500" /> Vet visit
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={handleScanAgain}>
                  Scan Another
                </Button>
                <Button className="flex-1 rounded-xl bg-primary text-primary-foreground" onClick={handleGoToProfile}>
                  {onSelect ? "Select & Continue" : "View Full Profile →"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default QRScanner;
