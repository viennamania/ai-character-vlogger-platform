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
  reviewStatus: "Needs review" | "Approved" | "Rejected";
  reviewedAt?: string;
}

export type ExportPackageStatus = "Needs draft approval" | "Needs approved media" | "Ready for publish";

export interface ExportPackageAsset {
  id: string;
  url: string;
  downloadUrl: string;
  pathname: string;
  contentType: string;
  size: number;
  originalFilename?: string;
  reviewedAt?: string;
}

export interface ExportPackageRecord {
  id: string;
  draftId: string;
  title: string;
  packageName: string;
  platform: Platform;
  characterId: string;
  characterVersion: string;
  templateId: string;
  status: ExportPackageStatus;
  createdAt: string;
  approvedAssetCount: number;
  manifest: {
    schemaVersion: "2026-05-04";
    packageName: string;
    generatedAt: string;
    episode: EpisodeDraft;
    requiredDeliverables: string[];
    approvedAssets: ExportPackageAsset[];
    excludedAssets: Array<{
      id: string;
      pathname: string;
      originalFilename?: string;
      reviewStatus: MediaAssetRecord["reviewStatus"];
      reason: string;
    }>;
    review: {
      draftReviewStatus: SavedEpisodeDraft["reviewStatus"];
      approvedAssetCount: number;
      needsReviewAssetCount: number;
      rejectedAssetCount: number;
      checklist: string[];
    };
    publishing: {
      platform: Platform;
      aspectRatio: EpisodeDraft["exportManifest"]["aspectRatio"];
      durationSeconds: number;
      disclosure: string;
      captions: EpisodeDraft["platformCaptions"];
      hashtags: string[];
      checklist: string[];
    };
  };
}
