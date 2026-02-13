import Tesseract from 'tesseract.js';
import { DNAAnalysis, RiskIndicator, GeneticMarker } from '@/types/sheep';
import { supabase } from '@/lib/supabase';
import { NotificationService } from '@/lib/NotificationService';

// Genetic Knowledge Base for Sheep
const GENE_RISK_MAP: Record<string, {
    description: string;
    variants: Record<string, {
        risk: number; // 0-100 susceptibility
        label: string;
        recommendation: string;
        impact: 'low' | 'medium' | 'high';
    }>
}> = {
    'PRNP': {
        description: 'Scrapie Resistance (Prion Protein)',
        variants: {
            'ARR/ARR': { risk: 5, label: 'Highly Resistant', impact: 'low', recommendation: 'Excellent for breeding. Group 1 resistance.' },
            'ARR/AHQ': { risk: 20, label: 'Resistant', impact: 'low', recommendation: 'Good for breeding. Group 2 resistance.' },
            'ARR/ARQ': { risk: 20, label: 'Resistant', impact: 'low', recommendation: 'Good for breeding. Group 2 resistance.' },
            'AHQ/AHQ': { risk: 50, label: 'Moderate', impact: 'medium', recommendation: 'Avoid concentrated breeding with susceptible lines.' },
            'ARQ/ARQ': { risk: 50, label: 'Moderate', impact: 'medium', recommendation: 'Avoid concentrated breeding with susceptible lines.' },
            'VRQ/VRQ': { risk: 95, label: 'Highly Susceptible', impact: 'high', recommendation: 'Not recommended for breeding. Group 5. High scrapie risk.' },
            'ARQ/VRQ': { risk: 85, label: 'Susceptible', impact: 'high', recommendation: 'Monitor closely. Not recommended for breeding.' },
        }
    },
    'TMEM154': {
        description: 'Ovine Progressive Pneumonia (OPP)',
        variants: {
            'H1/H1': { risk: 10, label: 'Resistant', impact: 'low', recommendation: 'Highly resistant to OPP infection.' },
            'H1/H2': { risk: 60, label: 'Susceptible', impact: 'medium', recommendation: 'Moderate risk of OPP infection.' },
            'H2/H2': { risk: 90, label: 'Highly Susceptible', impact: 'high', recommendation: 'Avoid contact with infected livestock.' }
        }
    },
    'FECB': {
        description: 'Booroola Fecundity (Litter Size)',
        variants: {
            'B/B': { risk: 10, label: 'High Prolificacy', impact: 'low', recommendation: 'Likely to produce 3+ lambs per birth.' },
            'B/+': { risk: 20, label: 'Increased Prolificacy', impact: 'low', recommendation: 'Likely to produce 2+ lambs per birth.' },
            '+/+': { risk: 50, label: 'Standard', impact: 'medium', recommendation: 'Normal litter size expectation.' }
        }
    }
};

export class DNAIntelligenceService {
    /**
     * Helper to convert File/Blob to Base64 DataURL for Worker safety
     */
    private static async fileToDataUrl(file: File | Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Extracts text from an image or PDF (first page) using OCR
     */
    static async extractTextFromReport(input: string | File | Blob): Promise<string> {
        try {
            let processedInput = input;

            // Convert local file to DataURL to prevent "Read Error" in worker
            if (input instanceof File || input instanceof Blob) {
                console.log(`[DNA Service] Pre-processing local file: ${input instanceof File ? input.name : 'Blob'} (${Math.round(input.size / 1024)}KB)`);
                processedInput = await this.fileToDataUrl(input);
                console.log("[DNA Service] Source converted to DataURL bridge.");
            }

            console.log("[DNA Service] Starting OCR recognition...");

            const result = await Tesseract.recognize(
                processedInput,
                'eng',
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            console.log(`[DNA OCR] Progress: ${Math.round(m.progress * 100)}%`);
                        }
                    }
                }
            );

            const text = result.data.text;
            console.log("[DNA Service] OCR Recognition successful. Length:", text.length);
            return text || "";
        } catch (err: any) {
            console.error("[DNA Service] CRITICAL OCR Error:", err);
            const errorDetail = err?.message || String(err) || "Unknown failure during worker initialization";
            throw new Error(`OCR Processing failed: ${errorDetail}`);
        }
    }

    /**
     * Cleans OCR text from common misreads and formatting artifacts
     */
    private static normalizeOCRText(text: string): string {
        return text.toUpperCase()
            .replace(/[|\]\[}{]/g, '/') // Common misreads of slash
            .replace(/[^A-Z0-9/+\s]/g, ' ') // Remove noise
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/([A-Z])0([A-Z])/g, '$1O$2') // Fix O vs 0 in text
            .replace(/([0-9])O([0-9])/g, '$10$2'); // Fix 0 vs O in numbers
    }

    /**
     * Advanced Hub-based fuzzy parsing with expanded knowledge
     */
    static parseMarkers(text: string): Record<string, string> {
        const markers: Record<string, string> = {};
        const cleaned = this.normalizeOCRText(text);

        console.log("[Genetic Intelligence] Hub Analysis starting...");

        const GENE_HUBS = [
            { key: 'PRNP', terms: ['PRNP', 'PRION', 'SCRAPIE', 'GENOTYPE', 'CODON 171', 'RESISTANCE', 'G-TYPE'] },
            { key: 'TMEM154', terms: ['TMEM154', 'TMEM', 'OVINE PROGRESSIVE', 'OPP', 'PNEUMONIA', 'PNEU'] },
            { key: 'FECB', terms: ['FECB', 'BOOROOLA', 'LITTER SIZE', 'FECUNDITY', 'PROLIFICACY'] }
        ];

        const GENOTYPE_PATTERNS = {
            'PRNP': /(ARR|ARQ|VRQ|AHQ|ARH)\s*[\/\\]\s*(ARR|ARQ|VRQ|AHQ|ARH)/,
            'TMEM154': /H\s*[12]\s*[\/\\]\s*H\s*[12]/,
            'FECB': /(B|\+)\s*[\/\\]\s*(B|\+)/
        };

        GENE_HUBS.forEach(hub => {
            // 1. Find the hub in the text
            let hubPos = -1;
            for (const term of hub.terms) {
                const termUpper = term.toUpperCase();
                hubPos = cleaned.indexOf(termUpper);
                if (hubPos !== -1) {
                    console.log(`[Genetic Intelligence] Hub hit: "${term}" for gene ${hub.key}`);
                    break;
                }
            }

            if (hubPos !== -1) {
                // 2. Scan a window around the hub for the pattern (~250 chars window for complex layouts)
                const windowStart = Math.max(0, hubPos - 100);
                const windowEnd = Math.min(cleaned.length, hubPos + 250);
                const windowText = cleaned.substring(windowStart, windowEnd);

                const pattern = GENOTYPE_PATTERNS[hub.key as keyof typeof GENOTYPE_PATTERNS];
                const match = windowText.match(pattern);

                if (match) {
                    markers[hub.key] = match[0].replace(/\s+/g, '').replace(/\\/g, '/');
                    console.log(`[Genetic Intelligence] Resolved Result for ${hub.key}: ${markers[hub.key]}`);
                }
            }
        });

        // 3. Fallback: Full text global hunt if hubs failed
        if (Object.keys(markers).length === 0) {
            console.log("[Genetic Intelligence] Hubs failed. Falling back to global pattern hunt...");
            Object.entries(GENOTYPE_PATTERNS).forEach(([key, pattern]) => {
                const match = cleaned.match(pattern);
                if (match) markers[key] = match[0].replace(/\s+/g, '').replace(/\\/g, '/');
            });
        }

        return markers;
    }

    /**
     * Maps markers to risks and health indicators
     */
    static analyzeGenetics(markers: Record<string, string>): {
        riskIndicators: RiskIndicator[];
        summary: string;
        lifeExpectancy: [number, number];
        confidence: number;
    } {
        const riskIndicators: RiskIndicator[] = [];
        let totalImpact = 0;
        let foundMarkersCount = 0;

        Object.entries(markers).forEach(([gene, allele]) => {
            const geneInfo = GENE_RISK_MAP[gene];
            if (geneInfo && geneInfo.variants[allele]) {
                const variant = geneInfo.variants[allele];
                riskIndicators.push({
                    disease: geneInfo.description,
                    susceptibility: variant.risk,
                    label: variant.label,
                    recommendation: variant.recommendation
                });
                totalImpact += variant.risk;
                foundMarkersCount++;
            }
        });

        // Heuristic life expectancy base
        let minAge = 8;
        let maxAge = 12;

        if (foundMarkersCount > 0 && totalImpact / foundMarkersCount > 70) {
            minAge -= 2;
            maxAge -= 1;
        }

        const confidence = foundMarkersCount > 0 ? Math.min(0.95, foundMarkersCount * 0.3) : 0.05;

        return {
            riskIndicators,
            summary: foundMarkersCount > 0
                ? `Mapped ${foundMarkersCount} genetic markers. Overall health profile is ${totalImpact / foundMarkersCount > 60 ? 'Susceptible' : 'Resilient'}.`
                : "Insufficient genetic data found in report.",
            lifeExpectancy: [minAge, maxAge],
            confidence
        };
    }

    /**
     * Process full report from either a URL or a local File
     */
    static async processReport(sheepId: string, source: string | File) {
        console.log(`[DNA Service] Processing report for sheep: ${sheepId}`);
        try {
            const text = await this.extractTextFromReport(source);
            console.log("[DNA Service] OCR Extraction complete. Text length:", text.length);

            const markers = this.parseMarkers(text);
            const { riskIndicators, summary, lifeExpectancy, confidence } = this.analyzeGenetics(markers);

            const analysisData = {
                sheep_id: sheepId,
                markers,
                risk_indicators: riskIndicators,
                confidence_level: confidence,
                recommendations: riskIndicators.map(r => r.recommendation),
                life_expectancy_min: lifeExpectancy[0],
                life_expectancy_max: lifeExpectancy[1],
                summary
            };

            console.log("[DNA Service] Inserting analysis data into Supabase...");
            const { data: analysis, error } = await supabase
                .from('dna_analysis')
                .insert(analysisData)
                .select()
                .single();

            if (error) {
                console.error("[DNA Service] Supabase Insert Error:", error);
                throw error;
            }

            console.log("[DNA Service] Analysis saved successfully. ID:", analysis.id);

            // Update sheep with latest analysis
            const { error: updateError } = await supabase
                .from('sheep')
                .update({ latest_analysis_id: analysis.id, dna_verified: true })
                .eq('id', sheepId);

            if (updateError) {
                console.error("[DNA Service] Sheep Update Error:", updateError);
                throw updateError;
            }

            console.log("[DNA Service] Sheep record updated with analysis link.");

            // Send Notification
            await NotificationService.sendNotification({
                title: "DNA Analysis Complete",
                message: `Genetic markers for ${analysisData.markers['PRNP'] ? 'PRNP and others' : 'sheep'} have been successfully mapped and analyzed.`,
                type: 'dna_analysis',
                link: `/sheep/${sheepId}`
            });

            return analysis as DNAAnalysis;
        } catch (err) {
            console.error("[DNA Service] CRITICAL PROCESSING ERROR:", err);
            throw err;
        }
    }
}
