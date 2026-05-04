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

export interface MediaAssetRecord {
  id: string;
  storage: "vercel_blob";
  access: "public";
  url: string;
  downloadUrl: string;
  pathname: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  characterId?: string;
  characterVersion?: string;
  templateId?: string;
  episodeDraftId?: string;
  originalFilename?: string;
  status: "uploaded" | "linked";
}
