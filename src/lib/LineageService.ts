import { supabase } from "./supabase";
import { Sheep } from "@/types/sheep";

export interface LineageNode {
    sheep: Sheep;
    sire?: LineageNode;
    dam?: LineageNode;
    level: number;
}

export class LineageService {
    /**
     * Fetch a sheep with its ancestors up to a specified depth
     */
    static async getAncestry(sheepId: string, depth = 3): Promise<LineageNode | null> {
        const { data: sheep, error } = await supabase
            .from('sheep')
            .select('*')
            .eq('id', sheepId)
            .single();

        if (error || !sheep) return null;

        return {
            sheep: sheep as Sheep,
            level: 0,
            sire: sheep.sire_id && depth > 0
                ? (await this.getAncestry(sheep.sire_id, depth - 1)) || undefined
                : undefined,
            dam: sheep.dam_id && depth > 0
                ? (await this.getAncestry(sheep.dam_id, depth - 1)) || undefined
                : undefined
        };
    }

    /**
     * Fetch direct children of a sheep
     */
    static async getDescendants(sheepId: string): Promise<Sheep[]> {
        const { data, error } = await supabase
            .from('sheep')
            .select('*')
            .or(`sire_id.eq.${sheepId},dam_id.eq.${sheepId}`);

        if (error) return [];
        return (data || []) as Sheep[];
    }

    /**
     * Batch update ancestry for multiple sheep
     */
    static async updateAncestry(sheepId: string, sireId?: string | null, damId?: string | null) {
        const { error } = await supabase
            .from('sheep')
            .update({
                sire_id: sireId || null,
                dam_id: damId || null
            })
            .eq('id', sheepId);

        if (error) throw error;
    }
}
