export interface GenotypeProbability {
    genotype: string;
    probability: number;
}

export interface GeneticPrediction {
    marker: string;
    probabilities: GenotypeProbability[];
    recommendation: string;
    impact: 'low' | 'medium' | 'high';
}

export class GeneticLogic {
    /**
     * Predicts offspring genotype probabilities based on parental alleles
     */
    static predictOffspring(damGenotype: string, sireGenotype: string): GenotypeProbability[] {
        if (!damGenotype || !sireGenotype) return [];

        const damAlleles = damGenotype.split('/');
        const sireAlleles = sireGenotype.split('/');

        if (damAlleles.length !== 2 || sireAlleles.length !== 2) return [];

        const combinations: string[] = [];
        damAlleles.forEach(d => {
            sireAlleles.forEach(s => {
                // Sort alleles to keep genotype representation consistent (e.g., ARR/ARQ instead of ARQ/ARR)
                const pair = [d, s].sort().join('/');
                combinations.push(pair);
            });
        });

        const counts: Record<string, number> = {};
        combinations.forEach(c => {
            counts[c] = (counts[c] || 0) + 1;
        });

        return Object.entries(counts).map(([genotype, count]) => ({
            genotype,
            probability: (count / combinations.length) * 100
        }));
    }

    /**
     * Scrapie-specific resistance grading (UK Grouping)
     */
    static getScrapieGroup(genotype: string): { group: number; labelKey: string; riskKey: string } {
        const groups: Record<string, { group: number; labelKey: string; riskKey: string }> = {
            'ARR/ARR': { group: 1, labelKey: 'highlyResistant', riskKey: 'lowestRisk' },
            'ARR/AHQ': { group: 2, labelKey: 'resistant', riskKey: 'lowRisk' },
            'ARR/ARH': { group: 2, labelKey: 'resistant', riskKey: 'lowRisk' },
            'ARR/ARQ': { group: 2, labelKey: 'resistant', riskKey: 'lowRisk' },
            'AHQ/AHQ': { group: 3, labelKey: 'moderate', riskKey: 'mediumRisk' },
            'ARH/ARH': { group: 3, labelKey: 'moderate', riskKey: 'mediumRisk' },
            'ARQ/ARQ': { group: 3, labelKey: 'moderate', riskKey: 'mediumRisk' },
            'AHQ/ARH': { group: 3, labelKey: 'moderate', riskKey: 'mediumRisk' },
            'AHQ/ARQ': { group: 3, labelKey: 'moderate', riskKey: 'mediumRisk' },
            'ARH/ARQ': { group: 3, labelKey: 'moderate', riskKey: 'mediumRisk' },
            'ARR/VRQ': { group: 4, labelKey: 'susceptible', riskKey: 'highRisk' },
            'AHQ/VRQ': { group: 5, labelKey: 'highlySusceptible', riskKey: 'criticalRisk' },
            'ARH/VRQ': { group: 5, labelKey: 'highlySusceptible', riskKey: 'criticalRisk' },
            'ARQ/VRQ': { group: 5, labelKey: 'highlySusceptible', riskKey: 'criticalRisk' },
            'VRQ/VRQ': { group: 5, labelKey: 'highlySusceptible', riskKey: 'criticalRisk' }
        };

        return groups[genotype] || { group: 0, labelKey: 'unknown', riskKey: 'unknown' };
    }

    /**
     * Calculates a compatibility score (0-100) for a match
     */
    static calculateCompatibilityScore(
        ramGenotype: Record<string, string>,
        eweGenotype: Record<string, string>
    ): { score: number; statusKey: string } {
        let score = 70; // Base score

        // Scrapie Impact (PRNP)
        const ramScrapie = this.getScrapieGroup(ramGenotype['PRNP']);
        const eweScrapie = this.getScrapieGroup(eweGenotype['PRNP']);

        if (ramScrapie.group === 1 && eweScrapie.group === 1) score += 20;
        else if (ramScrapie.group <= 2 && eweScrapie.group <= 2) score += 15;
        else if (ramScrapie.group >= 4 || eweScrapie.group >= 4) score -= 30;

        // Fecundity Impact (FECB)
        const ramFec = ramGenotype['FECB'];
        const eweFec = eweGenotype['FECB'];

        if (ramFec === 'B/B' || eweFec === 'B/B') score += 10;
        else if (ramFec === 'B/+' && eweFec === 'B/+') score += 5;

        // Clamp score
        score = Math.min(100, Math.max(0, score));

        let statusKey = 'goodMatch';
        if (score >= 90) statusKey = 'excellentMatch';
        else if (score >= 75) statusKey = 'veryGoodMatch';
        else if (score < 50) statusKey = 'advisoryMatch';

        return { score, statusKey };
    }

    /**
     * Derives key genetic strengths for an animal
     */
    static getParentStrengths(genotype: Record<string, string>, gender: 'male' | 'female'): string[] {
        const strengths: string[] = [];

        // Scrapie Resistance
        const scrapie = this.getScrapieGroup(genotype['PRNP']);
        if (scrapie.group === 1) strengths.push('highestScrapieResistance');
        else if (scrapie.group === 2) strengths.push('highScrapieResistance');

        // Fecundity
        const fec = genotype['FECB'];
        if (fec === 'B/B') strengths.push('exceptionalFecundity');
        else if (fec === 'B/+') strengths.push('increasedFecundity');

        // Simulated/Default strengths if DNA is present
        if (Object.keys(genotype).length > 0) {
            strengths.push('lowParasiteRisk');
            if (gender === 'female') strengths.push('strongMaternalInstinct');
            else strengths.push('robustGrowthMarkers');
        }

        return strengths.slice(0, 3);
    }

    /**
     * Predicts extended traits based on parent genotypes
     */
    static predictExtendedTraits(ramGenotype: Record<string, string>, eweGenotype: Record<string, string>) {
        // In a real system, these would have specific markers.
        // For this implementation, we derive them from overall genetic quality.
        const comp = this.calculateCompatibilityScore(ramGenotype, eweGenotype);

        const getLevel = (base: number) => {
            const val = base + (comp.score - 70) / 5;
            if (val > 80) return 'High';
            if (val > 40) return 'Medium';
            return 'Low';
        };

        return {
            parasiteResistance: getLevel(75),
            growthRate: getLevel(65),
            heatTolerance: getLevel(80),
            diseaseRisk: comp.score > 75 ? 'Low' : comp.score > 50 ? 'Moderate' : 'High'
        };
    }

    /**
     * Fecundity (Litter Size) prediction based on FECB marker
     */
    static getFecundityOutcome(genotype: string): { labelKey: string; expectationKey: string } {
        const outcomes: Record<string, { labelKey: string; expectationKey: string }> = {
            'B/B': { labelKey: 'hyperProlific', expectationKey: 'likely3Lambs' },
            'B/+': { labelKey: 'increasedProlificacy', expectationKey: 'likely2Lambs' },
            '+/+': { labelKey: 'standard', expectationKey: 'normalBirth' }
        };
        return outcomes[genotype] || { labelKey: 'standard', expectationKey: 'normalBirth' };
    }

    /**
     * Educational content for traits
     */
    static getTraitExplanations(): Record<string, string> {
        return {
            'PRNP': 'scrapieExplanation',
            'FECB': 'fecundityExplanation'
        };
    }
}
