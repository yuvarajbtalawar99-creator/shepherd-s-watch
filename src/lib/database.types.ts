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
                    front_image_url: string | null
                    back_image_url: string | null
                    left_image_url: string | null
                    right_image_url: string | null
                    qr_code: string | null
                    dna_report_url: string | null
                    dna_verified: boolean
                    latest_analysis_id: string | null
                    sire_id: string | null
                    dam_id: string | null
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
                    front_image_url?: string | null
                    back_image_url?: string | null
                    left_image_url?: string | null
                    right_image_url?: string | null
                    qr_code?: string | null
                    dna_report_url?: string | null
                    dna_verified?: boolean
                    latest_analysis_id?: string | null
                    sire_id?: string | null
                    dam_id?: string | null
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
                    front_image_url?: string | null
                    back_image_url?: string | null
                    left_image_url?: string | null
                    right_image_url?: string | null
                    qr_code?: string | null
                    dna_report_url?: string | null
                    dna_verified?: boolean
                    latest_analysis_id?: string | null
                    sire_id?: string | null
                    dam_id?: string | null
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
                    blockchain_hash: string | null
                    blockchain_tx: string | null
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
            dna_analysis: {
                Row: {
                    id: string
                    sheep_id: string
                    markers: Json
                    risk_indicators: Json
                    confidence_level: number
                    recommendations: string[]
                    life_expectancy_min: number
                    life_expectancy_max: number
                    summary: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    sheep_id: string
                    markers: Json
                    risk_indicators: Json
                    confidence_level: number
                    recommendations: string[]
                    life_expectancy_min: number
                    life_expectancy_max: number
                    summary: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    sheep_id?: string
                    markers?: Json
                    risk_indicators?: Json
                    confidence_level?: number
                    recommendations?: string[]
                    life_expectancy_min?: number
                    life_expectancy_max?: number
                    summary?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "dna_analysis_id_fkey"
                        columns: ["id"]
                        referencedRelation: "dna_analysis"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "dna_analysis_sheep_id_fkey"
                        columns: ["sheep_id"]
                        referencedRelation: "sheep"
                        referencedColumns: ["id"]
                    }
                ]
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    message: string
                    type: 'health_alert' | 'task_reminder' | 'dna_analysis' | 'system' | 'bulk_import'
                    read: boolean
                    link: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    message: string
                    type: 'health_alert' | 'task_reminder' | 'dna_analysis' | 'system' | 'bulk_import'
                    read?: boolean
                    link?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    message?: string
                    type?: 'health_alert' | 'task_reminder' | 'dna_analysis' | 'system' | 'bulk_import'
                    read?: boolean
                    link?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "notifications_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "profiles"
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
