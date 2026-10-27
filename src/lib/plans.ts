export const PLANS = [
  { name: "Starter", usd: 0, php: 0, credits: 1000, cadence: "daily", description: "Great for everyday tasks", billing: "forever" },
  { name: "High", usd: 3.5, php: 50, credits: 3000, cadence: "", description: "Better at research, coding, and reliability", billing: "monthly" },
  { name: "Max", usd: 100, php: 4999, credits: 10000, cadence: "", description: "Best at advance generations", billing: "monthly" },
  { name: "Lifetime", usd: 300, php: 6998, credits: 35000, cadence: "monthly", description: "Secure, more seats, and for team support", billing: "once" },
] as const;
export function nextStarterReset(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));
}