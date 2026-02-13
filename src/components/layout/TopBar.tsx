import { Bell, Search, LogOut, User, Check, Trash2, Clock, Info, ShieldAlert, BrainCircuit, Activity, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import { Notification, NotificationService } from "@/lib/NotificationService";
import { SearchResult, SearchService } from "@/lib/SearchService";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/contexts/LanguageContext";
import { Languages } from "lucide-react";

const TopBar = () => {
  const { user, signOut } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    const list = await NotificationService.getUnreadNotifications();
    setNotifications(list);
    setUnreadCount(list.length);
  }, []);

  useEffect(() => {
    supabase.removeChannel(supabase.channel("global-notifications"));
    const channel = supabase
      .channel("global-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user?.id}` },
        (payload) => {
          console.log("[TopBar] Notification payload received:", payload);
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchNotifications]);

  // Handle Search Debouncing
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        setIsSearching(true);
        const results = await SearchService.globalSearch(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleMarkAsRead = async (id: string) => {
    const success = await NotificationService.markAsRead(id);
    if (success) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllRead = async () => {
    const success = await NotificationService.markAllAsRead();
    if (success) {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'health_alert': return <ShieldAlert className="h-4 w-4 text-destructive" />;
      case 'dna_analysis': return <BrainCircuit className="h-4 w-4 text-primary" />;
      case 'task_reminder': return <Activity className="h-4 w-4 text-warning" />;
      case 'bulk_import': return <Info className="h-4 w-4 text-accent" />;
      default: return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "?";
    const name = user.user_metadata?.full_name || user.email || "";
    if (name.includes("@")) {
      return name.charAt(0).toUpperCase();
    }
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="h-16 border-b border-border/50 bg-card/60 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 shrink-0 z-50">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground" />

        {/* Google-style Omnisearch */}
        <div className="relative" ref={searchRef}>
          <div className="hidden sm:flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2 w-64 focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-muted transition-all duration-200">
            <Search className={`h-4 w-4 ${isSearching ? "animate-pulse text-primary" : "text-muted-foreground"}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length > 0 && setShowSearchResults(true)}
              placeholder={t('searchPlaceholder')}
              className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground/60"
            />
          </div>

          <AnimatePresence>
            {showSearchResults && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-12 left-0 w-[300px] sm:w-[400px] glass-card shadow-soft-xl border border-border/50 overflow-hidden z-[100]"
              >
                <div className="p-2 border-b border-border/30 bg-muted/20 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                    {t('searchResultsLabel')}
                  </span>
                  {isSearching && <Loader2 className="h-3 w-3 animate-spin text-primary mr-2" />}
                </div>

                <ScrollArea className="max-h-[400px]">
                  {searchResults.length === 0 ? (
                    <div className="p-8 text-center">
                      <Search className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{t('noMatchesFound')} "{searchQuery}"</p>
                    </div>
                  ) : (
                    <div className="p-1">
                      {searchResults.map((result) => (
                        <Link
                          key={`${result.type}-${result.id}`}
                          to={result.link}
                          onClick={() => {
                            setShowSearchResults(false);
                            setSearchQuery("");
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                        >
                          <div className={`p-2 rounded-lg ${result.type === 'sheep' ? "bg-primary/10" : "bg-warning/10"}`}>
                            {result.type === 'sheep' ? (
                              <User className="h-4 w-4 text-primary" />
                            ) : (
                              <Activity className="h-4 w-4 text-warning" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {result.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate italic">
                              {result.subtitle}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <div className="p-2 bg-muted/10 border-t border-border/30 text-[10px] text-center text-muted-foreground">
                  {language === 'en' ? "Press" : ""} <kbd className="px-1 py-0.5 rounded bg-muted border border-border/50 font-mono">Esc</kbd> {t('pressEscToClose')}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* Language Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLanguage(language === 'en' ? 'ka' : 'en')}
          className="rounded-xl gap-2 font-bold text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{language === 'en' ? "EN" : "KA"}</span>
        </Button>

        {/* Real-time Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-xl relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 mr-4" align="end">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <h4 className="font-heading font-bold text-sm">{t('notifications')}</h4>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-auto p-0 text-xs text-primary hover:bg-transparent">
                  <Check className="h-3 w-3 mr-1" /> {t('markAllRead')}
                </Button>
              )}
            </div>
            <ScrollArea className="h-[350px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/20 mb-2" />
                  <p className="text-xs text-muted-foreground">{t('allCaughtUp')}</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-4 hover:bg-muted/30 transition-colors group">
                      <div className="flex gap-3">
                        <div className="mt-1">{getIcon(n.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-foreground leading-tight">{n.title}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMarkAsRead(n.id)}
                              className="h-5 w-5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1 leading-normal line-clamp-2">
                            {n.message}
                          </p>
                          <div className="flex items-center gap-1.5 mt-2">
                            <Clock className="h-3 w-3 text-muted-foreground/40" />
                            <span className="text-[10px] text-muted-foreground/60">
                              {formatDistanceToNow(new Date(n.created_at))} {language === 'en' ? 'ago' : 'ಹಿಂದೆ'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm hover:bg-primary/20 transition-colors">
              {getUserInitials()}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.user_metadata?.full_name || "User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>{t('profile') || "Profile"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default TopBar;
