import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { mockSheep } from "@/data/mockData";
import { ScanLine, X, Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import HealthScoreGauge from "@/components/sheep/HealthScoreGauge";
import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; className: string }> = {
  healthy: { label: "Healthy", className: "bg-success/10 text-success border-success/20" },
  sick: { label: "Sick", className: "bg-destructive/10 text-destructive border-destructive/20" },
  pregnant: { label: "Pregnant", className: "bg-primary/10 text-primary border-primary/20" },
  lactating: { label: "Lactating", className: "bg-accent/10 text-accent border-accent/20" },
};

interface QRScannerProps {
  onClose: () => void;
}

const QRScanner = ({ onClose }: QRScannerProps) => {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedSheep, setScannedSheep] = useState<typeof mockSheep[0] | null>(null);

  const startScanner = async () => {
    try {
      setError(null);
      const html5Qrcode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5Qrcode;

      await html5Qrcode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // Expected format: shepherdcare://sheep/{id} or just sheep ID
          let sheepId = decodedText;
          if (decodedText.includes("sheep/")) {
            sheepId = decodedText.split("sheep/").pop() || "";
          }

          const found = mockSheep.find(s => s.id === sheepId || s.tag_id === sheepId);
          if (found) {
            html5Qrcode.stop().catch(() => {});
            setScanning(false);
            setScannedSheep(found);
            toast.success(`Found: ${found.name} (${found.tag_id})`);
          } else {
            html5Qrcode.stop().catch(() => {});
            setScanning(false);
            setError(`No sheep found for code: ${decodedText}`);
          }
        },
        () => {} // ignore scan failures
      );
      setScanning(true);
    } catch (err) {
      setError("Camera access denied or not available. Please allow camera permissions.");
    }
  };

  useEffect(() => {
    startScanner();
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  const handleGoToProfile = () => {
    if (scannedSheep) {
      onClose();
      navigate(`/sheep/${scannedSheep.id}`);
    }
  };

  const handleScanAgain = () => {
    setScannedSheep(null);
    setError(null);
    startScanner();
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
                {/* Demo: allow manual entry */}
                <Button
                  className="rounded-xl bg-primary text-primary-foreground"
                  onClick={() => {
                    const found = mockSheep[0];
                    setScannedSheep(found);
                    setError(null);
                  }}
                >
                  Demo: Scan Bella
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
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={handleScanAgain}>
                  Scan Another
                </Button>
                <Button className="flex-1 rounded-xl bg-primary text-primary-foreground" onClick={handleGoToProfile}>
                  View Full Profile →
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Demo buttons when scanner is active but no camera */}
        {scanning && !scannedSheep && !error && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 text-center">Demo: Quick Scan</p>
            <div className="grid grid-cols-3 gap-2">
              {mockSheep.slice(0, 3).map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    scannerRef.current?.stop().catch(() => {});
                    setScanning(false);
                    setScannedSheep(s);
                    toast.success(`Scanned: ${s.name} (${s.tag_id})`);
                  }}
                  className="p-2 rounded-xl bg-muted/50 hover:bg-muted text-xs font-medium text-foreground transition-colors"
                >
                  🐑 {s.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default QRScanner;
