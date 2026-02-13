import { supabase } from "@/lib/supabase";

export interface SearchResult {
    id: string;
    title: string;
    subtitle: string;
    type: 'sheep' | 'task';
    link: string;
}

export class SearchService {
    /**
     * Perform a global fuzzy search across sheep and tasks
     */
    static async globalSearch(query: string): Promise<SearchResult[]> {
        if (!query || query.length < 1) return [];

        const searchTerm = `%${query}%`;
        const results: SearchResult[] = [];

        // 1. Search Sheep
        const { data: sheep, error: sheepError } = await supabase
            .from('sheep')
            .select('id, name, tag_id, breed')
            .or(`name.ilike.${searchTerm},tag_id.ilike.${searchTerm},breed.ilike.${searchTerm}`)
            .limit(5);

        if (!sheepError && sheep) {
            sheep.forEach(s => {
                results.push({
                    id: s.id,
                    title: s.name,
                    subtitle: `Tag: ${s.tag_id} • ${s.breed}`,
                    type: 'sheep',
                    link: `/sheep/${s.id}`
                });
            });
        }

        // 2. Search Tasks
        const { data: tasks, error: taskError } = await supabase
            .from('daily_tasks')
            .select('id, title, sheep_name')
            .or(`title.ilike.${searchTerm},sheep_name.ilike.${searchTerm}`)
            .limit(3);

        if (!taskError && tasks) {
            tasks.forEach(t => {
                results.push({
                    id: t.id,
                    title: t.title,
                    subtitle: `Task for ${t.sheep_name}`,
                    type: 'task',
                    link: `/tasks`
                });
            });
        }

        return results;
    }
}
