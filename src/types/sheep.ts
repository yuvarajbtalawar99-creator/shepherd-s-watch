export interface Sheep {
  id: string;
  tag_id: string;
  name: string;
  qr_code?: string;
  breed: string | null;
  date_of_birth: string;
  gender: "male" | "female";
  weight_kg: number;
  health_score: number;
  risk_level: "low" | "medium" | "high";
  status: "healthy" | "sick" | "pregnant" | "lactating";
  image_url?: string;
  front_image_url?: string;
  back_image_url?: string;
  left_image_url?: string;
  right_image_url?: string;
  dna_report_url?: string;
  dna_verified?: boolean;
  latest_analysis_id?: string;
  sire_id?: string;
  dam_id?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface GeneticMarker {
  gene: string;
  alleles: string;
  significance: string;
  impact: 'low' | 'medium' | 'high';
}

export interface RiskIndicator {
  disease: string;
  susceptibility: number; // 0-100
  label: string;
  recommendation: string;
}

export interface DNAAnalysis {
  id: string;
  sheep_id: string;
  markers: Record<string, string>;
  risk_indicators: RiskIndicator[];
  confidence_level: number;
  recommendations: string[];
  life_expectancy_min: number;
  life_expectancy_max: number;
  summary: string;
  created_at: string;
}

export interface HealthEvent {
  id: string;
  sheep_id: string;
  type: "birth" | "vaccination" | "deworming" | "illness" | "pregnancy" | "lambing" | "vet_visit" | "sale" | "weight_check";
  title: string;
  description: string;
  date: string;
  administered_by?: string;
  hash?: string;
  blockchain_hash?: string;
  blockchain_tx?: string;
  verified: boolean;
}

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  type: "vaccination" | "vet_followup" | "lambing" | "high_risk" | "deworming";
  sheep_id: string;
  sheep_name: string;
  due_date: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
}

export interface BreedingCandidate {
  id: string;
  sheep: Sheep;
  compatibility_score: number;
  reasons: string[];
}
