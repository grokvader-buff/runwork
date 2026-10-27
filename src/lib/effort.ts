export const EFFORTS = ["Low", "Medium", "High", "Max"] as const;
export type Effort = (typeof EFFORTS)[number];
export function effortFromIndex(index: number): Effort {
  return EFFORTS[Math.max(0, Math.min(3, Math.round(index)))] ?? "Low";
}