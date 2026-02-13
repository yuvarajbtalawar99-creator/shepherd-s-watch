// Utilities for Web Speech API (Speech-to-Text & Text-to-Speech)

// Type definitions for Web Speech API (if not available in lib.dom.d.ts)
interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
}

export type SupportedLanguage = 'kn-IN' | 'en-IN';

interface VoiceOptions {
    lang: SupportedLanguage;
    onResult: (text: string) => void;
    onError: (error: any) => void;
    onEnd: () => void;
}

let recognition: any = null;

export const startListening = ({ lang, onResult, onError, onEnd }: VoiceOptions) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
        onError("Speech recognition not supported in this browser.");
        return;
    }

    if (recognition) {
        recognition.stop();
    }

    recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        onResult(text);
    };

    recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        onError(event.error);
    };

    recognition.onend = () => {
        onEnd();
    };

    try {
        recognition.start();
    } catch (e) {
        console.error("Error starting recognition:", e);
    }
};

export const stopListening = () => {
    if (recognition) {
        recognition.stop();
        recognition = null;
    }
};

export const speak = (text: string, lang: SupportedLanguage) => {
    return new Promise<void>((resolve, reject) => {
        if (!('speechSynthesis' in window)) {
            console.warn("Text-to-speech not supported");
            resolve(); // Fail silently/gracefully
            return;
        }

        // Cancel any current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;

        // Adjust rate/pitch for a more natural feel
        utterance.rate = 0.9;
        utterance.pitch = 1.0;

        // Try to find a specific voice for the language
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang === lang);
        if (voice) {
            utterance.voice = voice;
        }

        utterance.onend = () => resolve();
        utterance.onerror = (e) => reject(e);

        window.speechSynthesis.speak(utterance);
    });
};

export const isSpeechSupported = () => {
    return 'speechSynthesis' in window &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
};
