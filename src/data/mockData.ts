import { Sheep, HealthEvent, DailyTask } from "@/types/sheep";

export const mockSheep: Sheep[] = [
  {
    id: "1", tag_id: "SC-001", name: "Bella", breed: "Merino",
    date_of_birth: "2022-03-15", gender: "female", weight_kg: 45,
    health_score: 88, risk_level: "low", status: "healthy",
    owner_id: "u1", created_at: "2022-03-15",
  },
  {
    id: "2", tag_id: "SC-002", name: "Luna", breed: "Dorper",
    date_of_birth: "2021-08-20", gender: "female", weight_kg: 52,
    health_score: 72, risk_level: "medium", status: "pregnant",
    owner_id: "u1", created_at: "2021-08-20",
  },
  {
    id: "3", tag_id: "SC-003", name: "Thor", breed: "Suffolk",
    date_of_birth: "2023-01-10", gender: "male", weight_kg: 68,
    health_score: 95, risk_level: "low", status: "healthy",
    owner_id: "u1", created_at: "2023-01-10",
  },
  {
    id: "4", tag_id: "SC-004", name: "Daisy", breed: "Corriedale",
    date_of_birth: "2020-11-05", gender: "female", weight_kg: 40,
    health_score: 45, risk_level: "high", status: "sick",
    owner_id: "u1", created_at: "2020-11-05",
  },
  {
    id: "5", tag_id: "SC-005", name: "Rocky", breed: "Merino",
    date_of_birth: "2022-06-22", gender: "male", weight_kg: 60,
    health_score: 82, risk_level: "low", status: "healthy",
    owner_id: "u1", created_at: "2022-06-22",
  },
  {
    id: "6", tag_id: "SC-006", name: "Nala", breed: "Dorper",
    date_of_birth: "2021-12-01", gender: "female", weight_kg: 48,
    health_score: 63, risk_level: "medium", status: "lactating",
    owner_id: "u1", created_at: "2021-12-01",
  },
];

export const mockHealthEvents: HealthEvent[] = [
  { id: "e1", sheep_id: "1", type: "birth", title: "Born", description: "Healthy birth, single lamb", date: "2022-03-15", verified: true },
  { id: "e2", sheep_id: "1", type: "vaccination", title: "CDT Vaccination", description: "Clostridium perfringens Types C & D + Tetanus", date: "2022-05-20", administered_by: "Dr. Rao", verified: true },
  { id: "e3", sheep_id: "1", type: "deworming", title: "Deworming", description: "Ivermectin administered", date: "2022-08-10", administered_by: "Dr. Rao", verified: true },
  { id: "e4", sheep_id: "1", type: "weight_check", title: "Weight Check", description: "Weight: 32kg — good growth rate", date: "2022-11-01", verified: true },
  { id: "e5", sheep_id: "1", type: "vaccination", title: "Annual Vaccination", description: "Annual booster CDT", date: "2023-05-20", administered_by: "Dr. Rao", verified: true },
  { id: "e6", sheep_id: "1", type: "vet_visit", title: "Routine Checkup", description: "All vitals normal. Healthy condition.", date: "2023-09-15", administered_by: "Dr. Rao", verified: true },
  { id: "e7", sheep_id: "1", type: "pregnancy", title: "Pregnancy Confirmed", description: "Ultrasound confirmed — single lamb expected", date: "2024-01-10", administered_by: "Dr. Rao", verified: true },
  { id: "e8", sheep_id: "1", type: "lambing", title: "Lambing", description: "Healthy single lamb delivered", date: "2024-06-05", verified: true },
  { id: "e9", sheep_id: "2", type: "illness", title: "Foot Rot Detected", description: "Treated with zinc sulphate foot bath", date: "2024-02-14", administered_by: "Dr. Rao", verified: true },
  { id: "e10", sheep_id: "2", type: "pregnancy", title: "Pregnancy Confirmed", description: "Twins expected", date: "2024-10-20", administered_by: "Dr. Rao", verified: true },
];

export const mockDailyTasks: DailyTask[] = [
  { id: "t1", title: "CDT Booster Due", description: "Annual CDT vaccination booster", type: "vaccination", sheep_id: "2", sheep_name: "Luna", due_date: "2026-02-12", completed: false, priority: "high" },
  { id: "t2", title: "Lambing Watch", description: "Luna due for lambing within 5 days", type: "lambing", sheep_id: "2", sheep_name: "Luna", due_date: "2026-02-15", completed: false, priority: "high" },
  { id: "t3", title: "Vet Follow-up", description: "Follow-up on Daisy's treatment", type: "vet_followup", sheep_id: "4", sheep_name: "Daisy", due_date: "2026-02-12", completed: false, priority: "high" },
  { id: "t4", title: "Deworming Due", description: "Quarterly deworming schedule", type: "deworming", sheep_id: "5", sheep_name: "Rocky", due_date: "2026-02-14", completed: false, priority: "medium" },
  { id: "t5", title: "Weight Check", description: "Monthly weight monitoring", type: "vet_followup", sheep_id: "3", sheep_name: "Thor", due_date: "2026-02-13", completed: true, priority: "low" },
];
