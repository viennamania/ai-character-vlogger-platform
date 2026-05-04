import type { ExportPackageRecord, MediaAssetRecord, SavedEpisodeDraft } from "@/lib/persistence";

export function createExportPackage(
  draft: SavedEpisodeDraft,
  mediaAssets: MediaAssetRecord[],
  createdAt = new Date().toISOString(),
): ExportPackageRecord {
  const episodeAssets = mediaAssets.filter((asset) => asset.episodeDraftId === draft.id);
  const approvedAssets = episodeAssets.filter((asset) => asset.reviewStatus === "Approved");
  const needsReviewAssetCount = episodeAssets.filter((asset) => asset.reviewStatus === "Needs review").length;
  const rejectedAssetCount = episodeAssets.filter((asset) => asset.reviewStatus === "Rejected").length;
  const status =
    draft.reviewStatus !== "Approved" ? "Needs draft approval" : approvedAssets.length === 0 ? "Needs approved media" : "Ready for publish";

  return {
    id: `export_${draft.id}_${Date.parse(createdAt) || 0}`,
    draftId: draft.id,
    title: draft.thumbnailTitle,
    packageName: `${draft.exportManifest.packageName}-approved-assets`,
    platform: draft.platform,
    characterId: draft.characterId,
    characterVersion: draft.characterVersion,
    templateId: draft.templateId,
    status,
    createdAt,
    approvedAssetCount: approvedAssets.length,
    manifest: {
      schemaVersion: "2026-05-04",
      packageName: `${draft.exportManifest.packageName}-approved-assets`,
      generatedAt: createdAt,
      episode: draft,
      requiredDeliverables: draft.exportManifest.assets,
      approvedAssets: approvedAssets.map((asset) => ({
        id: asset.id,
        url: asset.url,
        downloadUrl: asset.downloadUrl,
        pathname: asset.pathname,
        contentType: asset.contentType,
        size: asset.size,
        originalFilename: asset.originalFilename,
        reviewedAt: asset.reviewedAt,
      })),
      excludedAssets: episodeAssets
        .filter((asset) => asset.reviewStatus !== "Approved")
        .map((asset) => ({
          id: asset.id,
          pathname: asset.pathname,
          originalFilename: asset.originalFilename,
          reviewStatus: asset.reviewStatus,
          reason: asset.reviewStatus === "Rejected" ? "Rejected during human review" : "Awaiting human review",
        })),
      review: {
        draftReviewStatus: draft.reviewStatus,
        approvedAssetCount: approvedAssets.length,
        needsReviewAssetCount,
        rejectedAssetCount,
        checklist: draft.reviewChecklist,
      },
      publishing: {
        platform: draft.platform,
        aspectRatio: draft.exportManifest.aspectRatio,
        durationSeconds: draft.exportManifest.durationSeconds,
        disclosure: draft.exportManifest.disclosure,
        captions: draft.platformCaptions,
        hashtags: draft.hashtags,
        checklist: draft.publishingChecklist,
      },
    },
  };
}
