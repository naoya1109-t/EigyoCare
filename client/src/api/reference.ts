import { apiFetch } from "./client";

export interface Rep {
  repCode: number;
  repName: string;
}

export interface Prefecture {
  prefectureCode: number;
  prefectureName: string;
}

export function fetchReps(): Promise<Rep[]> {
  return apiFetch<Rep[]>("/reps");
}

export function fetchPrefectures(): Promise<Prefecture[]> {
  return apiFetch<Prefecture[]>("/prefectures");
}
