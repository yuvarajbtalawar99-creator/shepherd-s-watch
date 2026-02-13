import Papa from 'papaparse';

/**
 * Production-ready CSV Parser for Shepherd's Watch
 * Uses PapaParse for robust handling of quotes, escaping, and line endings.
 */

export interface CSVParsedSheep {
    name: string;
    tag_id?: string;
    breed?: string;
    date_of_birth?: string | null;
    gender?: 'male' | 'female';
    weight_kg?: number | null;
}

export function parseSheepCSV(text: string): CSVParsedSheep[] {
    const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.toLowerCase().trim()
    });

    if (!parsed.data || parsed.data.length === 0) return [];

    return (parsed.data as any[]).map(row => {
        const sheep: any = {};

        // Find name (required)
        const nameKey = Object.keys(row).find(k => k.includes('name'));
        if (nameKey) sheep.name = row[nameKey];

        // Normalization & AI-like Matching
        Object.entries(row).forEach(([key, val]) => {
            if (!val) return;
            const value = String(val).trim();

            if (key.includes('tag')) {
                sheep.tag_id = value;
            } else if (key.includes('breed')) {
                sheep.breed = value;
            } else if (key.includes('gender') || key.includes('sex')) {
                const lower = value.toLowerCase();
                if (lower.startsWith('m')) sheep.gender = 'male';
                else if (lower.startsWith('f')) sheep.gender = 'female';
            } else if (key.includes('weight')) {
                const num = parseFloat(value);
                sheep.weight_kg = !isNaN(num) ? num : null;
            } else if (key.includes('dob') || key.includes('birth')) {
                try {
                    const date = new Date(value);
                    sheep.date_of_birth = !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : null;
                } catch {
                    sheep.date_of_birth = null;
                }
            }
        });

        return sheep;
    }).filter(s => s.name); // Filter out rows without a name
}
