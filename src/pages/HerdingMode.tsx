import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Syringe,
  ThermometerSnowflake,
  Heart,
  Stethoscope,
  Check,
  Wifi,
  WifiOff,
  ArrowLeft,
  ScanLine
} from "lucide-react";
import QRScanner from "@/components/scanner/QRScanner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { offlineQueue } from "@/lib/herding/offlineQueue";
import { speak } from "@/lib/ai/voice";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Sheep } from "@/types/sheep";
import { useTranslation } from "@/contexts/LanguageContext";

type ActionType = 'vaccinated' | 'sick' | 'pregnant' | 'vet';

export default function HerdingMode() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [sheep, setSheep] = useState<Sheep[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<ActionType | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Load Sheep
  useEffect(() => {
    loadSheep();

    const handleOnline = () => {
      setIsOffline(false);
      attemptSync();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadSheep = async () => {
    const { data } = await supabase.from('sheep').select('*').order('tag_id');
    if (data) setSheep(data as Sheep[]);
  };

  const attemptSync = async () => {
    toast(t('syncingData'), { icon: "🔄" });
    const result = await offlineQueue.sync();
    if (result.success) {
      toast.success(t('syncedOffline'));
    }
  };

  // Interaction Handlers
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
      triggerHaptic();
    }
    setSelectedIds(newSet);
  };

  const triggerHaptic = () => {
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const handleActionSelect = (act: ActionType) => {
    if (action === act) setAction(null); // toggle off
    else {
      setAction(act);
      triggerHaptic();
    }
  };

  const handleScan = (scannedSheep: Sheep) => {
    toggleSelection(scannedSheep.id);
  };

  const handleLogEvent = async () => {
    if (!action || selectedIds.size === 0) return;

    setIsProcessing(true);
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]); // Success pattern

    const count = selectedIds.size;
    const date = new Date().toISOString();

    try {
      // Queue events
      Array.from(selectedIds).forEach(id => {
        offlineQueue.add({
          sheep_id: id,
          event_type: action,
          date: date,
          created_at: date
        });
      });

      // Attempt immediate sync if online
      if (!isOffline) {
        await offlineQueue.sync();
      }

      // Voice Feedback
      const actionText = {
        'vaccinated': "Vaccination",
        'sick': "Sickness",
        'pregnant': "Pregnancy",
        'vet': "Vet visit"
      }[action];

      if (language === 'en') {
        await speak(`${actionText} recorded for ${count} sheep.`, 'en-IN');
      }

      // Reset UI
      setSelectedIds(new Set());
      setAction(null);
      toast.success(t('successLogging'));

    } catch (e) {
      console.error(e);
      toast.error(t('errorLogging'));
    } finally {
      setIsProcessing(false);
    }
  };

  const herdingActions = [
    { id: 'vaccinated', icon: Syringe, label: t('vaccine'), color: 'bg-blue-500' },
    { id: 'sick', icon: ThermometerSnowflake, label: t('sick'), color: 'bg-red-500' },
    { id: 'pregnant', icon: Heart, label: t('pregnant'), color: 'bg-pink-500' },
    { id: 'vet', icon: Stethoscope, label: t('vet'), color: 'bg-amber-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* 1. Header (High Visibility) */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 bg-slate-800 rounded-full active:scale-95 transition-transform">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold tracking-wide text-emerald-400">{t('herdingMode').toUpperCase()}</h1>
        </div>
        <div className="flex items-center gap-2">
          {isOffline ? (
            <div className="flex items-center gap-1 text-amber-500 bg-amber-950/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <WifiOff className="h-4 w-4" /> {t('offline')}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-emerald-500 bg-emerald-950/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Wifi className="h-4 w-4" /> {t('online')}
            </div>
          )}

          <button
            onClick={() => setShowScanner(true)}
            className="p-2 bg-slate-800 rounded-full active:scale-95 transition-transform text-emerald-400"
            title={t('scanQR')}
          >
            <ScanLine className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 2. Main Grid (Scrollable) */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-3 gap-3 pb-32">
          {sheep.map(s => {
            const isSelected = selectedIds.has(s.id);
            return (
              <motion.div
                key={s.id}
                initial={false}
                animate={{
                  scale: isSelected ? 1.05 : 1,
                  backgroundColor: isSelected ? "#10b981" : "#1e293b"
                }}
                onClick={() => toggleSelection(s.id)}
                className={cn(
                  "aspect-square rounded-2xl flex flex-col items-center justify-center relative shadow-lg touch-manipulation border-2 transition-colors",
                  isSelected ? "border-emerald-400" : "border-slate-700"
                )}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-white text-emerald-600 rounded-full p-0.5">
                    <Check className="h-4 w-4 stroke-[4]" />
                  </div>
                )}
                <span className={cn("text-3xl font-bold mb-1", isSelected ? "text-white" : "text-slate-200")}>
                  {s.tag_id}
                </span>
                <span className={cn("text-xs uppercase font-semibold", isSelected ? "text-emerald-100" : "text-slate-500")}>
                  {s.breed}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 3. Action Panel (Fixed Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-4 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">

        {/* Action Selectors */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {herdingActions.map((btn) => (
            <button
              key={btn.id}
              onClick={() => handleActionSelect(btn.id as ActionType)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all active:scale-95",
                action === btn.id ? `${btn.color} text-white shadow-lg scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900` : "bg-slate-800 text-slate-400"
              )}
            >
              <btn.icon className="h-6 w-6" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{btn.label}</span>
            </button>
          ))}
        </div>

        {/* Submit Button */}
        <button
          disabled={!action || selectedIds.size === 0 || isProcessing}
          onClick={handleLogEvent}
          className={cn(
            "w-full h-16 rounded-2xl flex items-center justify-center gap-3 text-lg font-bold shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100",
            action === 'vaccinated' ? "bg-blue-600 hover:bg-blue-500" :
              action === 'sick' ? "bg-red-600 hover:bg-red-500" :
                action === 'pregnant' ? "bg-pink-600 hover:bg-pink-500" :
                  action === 'vet' ? "bg-amber-600 hover:bg-amber-500" :
                    "bg-slate-700"
          )}
        >
          {isProcessing ? (
            <span className="animate-pulse">{t('saving')}</span>
          ) : (
            <>
              {action ? (
                <> {t('logSheep')} {selectedIds.size} {language === 'en' ? 'SHEEP' : 'ಕುರಿಗಳು'} &rarr; <span className="uppercase">{t(action as any)}</span></>
              ) : (
                t('selectAction')
              )}
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {showScanner && (
          <QRScanner
            onClose={() => setShowScanner(false)}
            onSelect={handleScan}
            autoSelect={true}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
