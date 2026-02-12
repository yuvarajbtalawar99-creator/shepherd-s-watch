export interface Sheep {
  id: string;
  tag_id: string;
  name: string;
  breed: string;
  date_of_birth: string;
  gender: "male" | "female";
  weight_kg: number;
  health_score: number;
  risk_level: "low" | "medium" | "high";
  status: "healthy" | "sick" | "pregnant" | "lactating";
  image_url?: string;
  owner_id: string;
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
