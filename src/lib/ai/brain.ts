import { supabase } from "@/lib/supabase";
import { SupportedLanguage } from "./voice";

interface AssistantResponse {
    text: string;
    action?: string;
    data?: any;
}

// Simple deterministic intent engine
export const processQuery = async (text: string, lang: SupportedLanguage): Promise<AssistantResponse> => {
    const lowerText = text.toLowerCase();

    // 1. GREETING
    if (checkKeywords(lowerText, ["hello", "hi", "namaste", "namaskara", "ನಮಸ್ಕಾರ", "ಹಲೋ"])) {
        return {
            text: lang === 'kn-IN'
                ? "ನಮಸ್ಕಾರ! ಕುರಿಗಳ ಬಗ್ಗೆ ಏನು ತಿಳಿಯಬೇಕು?"
                : "Hello! How can I help you with your herd today?"
        };
    }

    // 2. COUNT / TOTAL
    if (checkKeywords(lowerText, ["count", "total", "how many", "number", "ಎಷ್ಟು", "ಸಂಖ್ಯೆ", "ಮಂದೆ"])) {
        return await getSheepCount(lang);
    }

    // 3. SICK / HEALTH
    if (checkKeywords(lowerText, ["sick", "ill", "unhealthy", "problem", "risk", "ಹುಷಾರಿಲ್ಲ", "ಕಾಯಿಲೆ", "ಆರೋಗ್ಯ", "ತೊಂದರೆ"])) {
        return await getSickSheep(lang);
    }

    // 4. VACCINATION
    if (checkKeywords(lowerText, ["vaccine", "vaccination", "shot", "injection", "dose", "ಲಸಿಕೆ", "ಇಂಜೆಕ್ಷನ್"])) {
        return await getVaccinationInfo(lang);
    }

    // 5. PREGNANT
    if (checkKeywords(lowerText, ["pregnant", "birth", "lambing", "expecting", "ಗರ್ಭಿಣಿ", "ಮರಿ", "ಹೇರಿಗೆ"])) {
        return await getPregnantSheep(lang);
    }

    // Fallback
    return {
        text: lang === 'kn-IN'
            ? "ಕ್ಷಮಿಸಿ, ನನಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಇನ್ನೊಮ್ಮೆ ಹೇಳಿ."
            : "I didn't quite catch that. Could you ask about sheep count, health, or vaccinations?"
    };
};

// Helper: Check if string contains any of the keywords
const checkKeywords = (text: string, keywords: string[]) => {
    return keywords.some(keyword => text.includes(keyword));
};

// --- DATA FETCHERS ---

const getSheepCount = async (lang: SupportedLanguage): Promise<AssistantResponse> => {
    const { count, error } = await supabase
        .from('sheep')
        .select('*', { count: 'exact', head: true });

    if (error) {
        return {
            text: lang === 'kn-IN' ? "ದತ್ತಾಂಶ ಪಡೆಯಲು ಸಮಸ್ಯೆಯಾಗಿದೆ." : "Sorry, I had trouble checking the database."
        };
    }

    const num = count || 0;
    return {
        text: lang === 'kn-IN'
            ? `ನಿಮ್ಮ ಬಳಿ ಒಟ್ಟು ${num} ಕುರಿಗಳಿವೆ.`
            : `You have a total of ${num} sheep in your herd.`,
        data: { count: num }
    };
};

const getSickSheep = async (lang: SupportedLanguage): Promise<AssistantResponse> => {
    // Fetch high risk or sick sheep
    const { data, error } = await supabase
        .from('sheep')
        .select('tag_id, risk_level')
        .or('risk_level.eq.high,status.eq.sick');

    if (error) {
        return { text: "Error fetching data." };
    }

    if (!data || data.length === 0) {
        return {
            text: lang === 'kn-IN'
                ? "ಎಲ್ಲಾ ಕುರಿಗಳು ಆರೋಗ್ಯವಾಗಿವೆ! ಯಾವ ತೊಂದರೆಯೂ ಇಲ್ಲ."
                : "Great news! All your sheep seem healthy right now."
        };
    }

    const count = data.length;
    const ids = data.map(s => s.tag_id).join(", ");

    return {
        text: lang === 'kn-IN'
            ? `${count} ಕುರಿಗಳಿಗೆ ಆರೋಗ್ಯದ ಸಮಸ್ಯೆ ಇರಬಹುದು. ಟ್ಯಾಗ್ ನಂಬರ್: ${ids}.`
            : `Attention needed. ${count} sheep are marked as high risk or sick. Tags: ${ids}.`,
        action: "SHOW_SICK_SHEEP"
    };
};

const getVaccinationInfo = async (lang: SupportedLanguage): Promise<AssistantResponse> => {
    // Check daily tasks for pending vaccinations
    const { data, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('type', 'vaccination')
        .eq('completed', false);

    if (error) return { text: "Error checking tasks." };

    const count = data?.length || 0;

    if (count === 0) {
        return {
            text: lang === 'kn-IN'
                ? "ಯಾವುದೇ ಲಸಿಕೆ ಬಾಕಿ ಇಲ್ಲ."
                : "No vaccinations are due right now."
        };
    }

    return {
        text: lang === 'kn-IN'
            ? `ಒಟ್ಟು ${count} ಕುರಿಗಳಿಗೆ ಲಸಿಕೆ ಹಾಕಬೇಕಿದೆ.`
            : `You have ${count} vaccination tasks pending.`
    };
};

const getPregnantSheep = async (lang: SupportedLanguage): Promise<AssistantResponse> => {
    const { count, error } = await supabase
        .from('sheep')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pregnant');

    if (error) return { text: "Error." };

    const num = count || 0;

    return {
        text: lang === 'kn-IN'
            ? `ಈಗ ${num} ಕುರಿಗಳು ಗರ್ಭಿಣಿಯಾಗಿವೆ.`
            : `There are ${num} pregnant sheep in the flock.`
    };
};
