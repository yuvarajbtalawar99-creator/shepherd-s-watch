import { useState, useEffect, useRef } from "react";
import { Mic, X, Globe, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { startListening, stopListening, speak, SupportedLanguage, isSpeechSupported } from "@/lib/ai/voice";
import { processQuery } from "@/lib/ai/brain";
import { VoiceVisualizer } from "./VoiceVisualizer";
import { cn } from "@/lib/utils";

export const ShepherdAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [lang, setLang] = useState<SupportedLanguage>('kn-IN');

    // Chat State
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const toggleOpen = () => {
        if (isOpen) {
            stopListening();
            window.speechSynthesis.cancel();
            setIsOpen(false);
        } else {
            setIsOpen(true);
            if (messages.length === 0) {
                // Add initial welcome message
                setMessages([{
                    role: 'assistant',
                    text: lang === 'kn-IN' ? "ನಮಸ್ಕಾರ! ಕುರಿಗಳ ಬಗ್ಗೆ ಏನು ಸಲಹೆ ಬೇಕು?" : "Hello! How can I help you today?"
                }]);
            }
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleStartListening = () => {
        setIsListening(true);
        window.speechSynthesis.cancel();

        startListening({
            lang,
            onResult: async (text) => {
                setIsListening(false);
                await handleSendMessage(text);
            },
            onError: (err) => {
                console.error("Voice error:", err);
                setIsListening(false);
            },
            onEnd: () => setIsListening(false)
        });
    };

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return;

        // 1. Add User Message
        const userMsg = { role: 'user' as const, text };
        setMessages(prev => [...prev, userMsg]);

        setIsTyping(true);

        // 2. Process AI Response
        try {
            const result = await processQuery(text, lang);
            setIsTyping(false);

            // 3. Add AI Message
            const aiMsg = { role: 'assistant' as const, text: result.text };
            setMessages(prev => [...prev, aiMsg]);

            // Speak
            await speak(result.text, lang);
        } catch (error) {
            setIsTyping(false);
            console.error(error);
        }
    };

    // Cleanup
    useEffect(() => {
        return () => {
            stopListening();
            window.speechSynthesis.cancel();
        };
    }, []);

    if (!isSpeechSupported()) return null;

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                className="fixed bottom-6 right-6 h-16 w-16 bg-primary text-primary-foreground rounded-full shadow-lg z-50 flex items-center justify-center hover:bg-primary/90 hover:scale-105 transition-all"
                whileTap={{ scale: 0.95 }}
                onClick={toggleOpen}
            >
                <Mic className="h-8 w-8" />
                <span className="sr-only">Ask Shepherd</span>
            </motion.button>

            {/* Assistant Modal/Sheet */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        className="fixed bottom-24 right-4 md:right-6 w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] bg-background/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
                            <div className="flex items-center gap-2">
                                <div className="bg-primary/10 p-2 rounded-full">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Shepherd AI</h3>
                                    <p className="text-xs text-muted-foreground">Smart Assistant</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 gap-1 px-2 text-xs"
                                    onClick={() => setLang(lang === 'kn-IN' ? 'en-IN' : 'kn-IN')}
                                >
                                    <Globe className="h-3.5 w-3.5" />
                                    {lang === 'kn-IN' ? 'ಕನ್ನಡ' : 'English'}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleOpen}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Chat History Area */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "flex w-full",
                                        msg.role === 'user' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                                            msg.role === 'user'
                                                ? "bg-primary text-primary-foreground rounded-tr-sm"
                                                : "bg-muted/80 text-foreground rounded-tl-sm border border-border/50"
                                        )}
                                    >
                                        <p className="whitespace-pre-wrap">{msg.text}</p>
                                    </div>
                                </div>
                            ))}

                            {/* Typing Indicator */}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-muted/50 p-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                                        <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Controls */}
                        <div className="p-4 bg-background border-t border-border flex flex-col gap-3">
                            {/* Suggestions */}
                            {messages.length < 2 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                    {["How many sheep?", "Sick sheep?", "Feed advice?"].map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSendMessage(s)}
                                            className="whitespace-nowrap bg-muted hover:bg-muted/80 text-xs px-3 py-1.5 rounded-full transition-colors"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Input Area */}
                            <div className="flex items-center gap-2">
                                <Button
                                    size="icon"
                                    className={cn(
                                        "rounded-full h-10 w-10 shrink-0 transition-all",
                                        isListening ? "bg-destructive animate-pulse" : "bg-muted text-muted-foreground hover:bg-muted/80"
                                    )}
                                    onClick={isListening ? stopListening : handleStartListening}
                                >
                                    <Mic className={cn("h-5 w-5", isListening && "text-white")} />
                                </Button>

                                <form
                                    className="flex-1 flex gap-2"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const form = e.target as HTMLFormElement;
                                        const input = form.elements.namedItem('query') as HTMLInputElement;
                                        handleSendMessage(input.value);
                                        input.value = "";
                                    }}
                                >
                                    <input
                                        name="query"
                                        placeholder={lang === 'kn-IN' ? "ಪ್ರಶ್ನೆಯನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ..." : "Type a message..."}
                                        className="flex-1 bg-muted/30 border border-border rounded-full px-4 text-sm h-10 focus:outline-none focus:ring-1 focus:ring-primary"
                                        autoComplete="off"
                                    />
                                    <Button type="submit" size="icon" className="h-10 w-10 rounded-full shrink-0">
                                        <Sparkles className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
