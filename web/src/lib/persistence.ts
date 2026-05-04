import type { EpisodeDraft, Platform } from "@/lib/episodeGenerator";

export interface SavedEpisodeDraft extends EpisodeDraft {
  savedAt: string;
  reviewStatus: "Needs review" | "Approved";
}

export interface MetricRecord {
  draftId: string;
  title: string;
  platform: Platform;
  views: number;
  likes: number;
  comments: number;
  followers: number;
  paidClicks: number;
  notes: string;
  createdAt?: string;
}
