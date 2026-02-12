export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    farm_name: string | null
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    farm_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    farm_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            sheep: {
                Row: {
                    id: string
                    tag_id: string
                    name: string
                    breed: string
                    date_of_birth: string
                    gender: 'male' | 'female'
                    weight_kg: number
                    health_score: number
                    risk_level: 'low' | 'medium' | 'high'
                    status: 'healthy' | 'sick' | 'pregnant' | 'lactating'
                    image_url: string | null
                    owner_id: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    tag_id: string
                    name: string
                    breed: string
                    date_of_birth: string
                    gender: 'male' | 'female'
                    weight_kg: number
                    health_score?: number
                    risk_level?: 'low' | 'medium' | 'high'
                    status?: 'healthy' | 'sick' | 'pregnant' | 'lactating'
                    image_url?: string | null
                    owner_id: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    tag_id?: string
                    name?: string
                    breed?: string
                    date_of_birth?: string
                    gender?: 'male' | 'female'
                    weight_kg?: number
                    health_score?: number
                    risk_level?: 'low' | 'medium' | 'high'
                    status?: 'healthy' | 'sick' | 'pregnant' | 'lactating'
                    image_url?: string | null
                    owner_id?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "sheep_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            health_events: {
                Row: {
                    id: string
                    sheep_id: string
                    type: 'birth' | 'vaccination' | 'deworming' | 'illness' | 'pregnancy' | 'lambing' | 'vet_visit' | 'sale' | 'weight_check'
                    title: string
                    description: string
                    date: string
                    administered_by: string | null
                    hash: string | null
                    verified: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    sheep_id: string
                    type: 'birth' | 'vaccination' | 'deworming' | 'illness' | 'pregnancy' | 'lambing' | 'vet_visit' | 'sale' | 'weight_check'
                    title: string
                    description: string
                    date: string
                    administered_by?: string | null
                    hash?: string | null
                    verified?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    sheep_id?: string
                    type?: 'birth' | 'vaccination' | 'deworming' | 'illness' | 'pregnancy' | 'lambing' | 'vet_visit' | 'sale' | 'weight_check'
                    title?: string
                    description?: string
                    date?: string
                    administered_by?: string | null
                    hash?: string | null
                    verified?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "health_events_sheep_id_fkey"
                        columns: ["sheep_id"]
                        referencedRelation: "sheep"
                        referencedColumns: ["id"]
                    }
                ]
            }
            daily_tasks: {
                Row: {
                    id: string
                    title: string
                    description: string
                    type: 'vaccination' | 'vet_followup' | 'lambing' | 'high_risk' | 'deworming'
                    sheep_id: string
                    sheep_name: string
                    due_date: string
                    completed: boolean
                    priority: 'low' | 'medium' | 'high'
                    owner_id: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description: string
                    type: 'vaccination' | 'vet_followup' | 'lambing' | 'high_risk' | 'deworming'
                    sheep_id: string
                    sheep_name: string
                    due_date: string
                    completed?: boolean
                    priority?: 'low' | 'medium' | 'high'
                    owner_id: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string
                    type?: 'vaccination' | 'vet_followup' | 'lambing' | 'high_risk' | 'deworming'
                    sheep_id?: string
                    sheep_name?: string
                    due_date?: string
                    completed?: boolean
                    priority?: 'low' | 'medium' | 'high'
                    owner_id?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "daily_tasks_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "daily_tasks_sheep_id_fkey"
                        columns: ["sheep_id"]
                        referencedRelation: "sheep"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
