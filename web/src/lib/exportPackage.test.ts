import { describe, expect, it } from "vitest";
import { defaultCharacter } from "@/data/sampleCharacter";
import { vlogTemplates } from "@/data/templates";
import { generateEpisodeDraft } from "./episodeGenerator";
import { createExportPackage } from "./exportPackage";
import type { MediaAssetRecord, SavedEpisodeDraft } from "./persistence";

const savedDraft: SavedEpisodeDraft = {
  ...generateEpisodeDraft(defaultCharacter, vlogTemplates[0], {
    platform: "youtube",
    tone: "cozy",
    ctaGoal: "comment",
    lengthSeconds: 30,
    calendarSlot: "2026-05-04",
  }),
  savedAt: "2026-05-04T00:00:00.000Z",
  reviewStatus: "Approved",
};

function asset(reviewStatus: MediaAssetRecord["reviewStatus"], id: string): MediaAssetRecord {
  return {
    id,
    storage: "vercel_blob",
    access: "public",
    url: `https://blob.example/${id}`,
    downloadUrl: `https://blob.example/${id}?download=1`,
    pathname: `uploads/${id}.png`,
    contentType: "image/png",
    size: 2048,
    uploadedAt: "2026-05-04T00:00:00.000Z",
    episodeDraftId: savedDraft.id,
    status: "linked",
    reviewStatus,
    reviewedAt: reviewStatus === "Needs review" ? undefined : "2026-05-04T01:00:00.000Z",
  };
}

describe("createExportPackage", () => {
  it("includes only approved media assets in the package manifest", () => {
    const exportPackage = createExportPackage(
      savedDraft,
      [asset("Approved", "approved"), asset("Rejected", "rejected"), asset("Needs review", "pending")],
      "2026-05-04T02:00:00.000Z",
    );

    expect(exportPackage.status).toBe("Ready for publish");
    expect(exportPackage.manifest.approvedAssets).toHaveLength(1);
    expect(exportPackage.manifest.approvedAssets[0].id).toBe("approved");
    expect(exportPackage.manifest.excludedAssets.map((item) => item.id)).toEqual(["rejected", "pending"]);
  });

  it("marks packages without approved media as incomplete", () => {
    const exportPackage = createExportPackage(savedDraft, [asset("Needs review", "pending")], "2026-05-04T02:00:00.000Z");

    expect(exportPackage.status).toBe("Needs approved media");
    expect(exportPackage.approvedAssetCount).toBe(0);
  });
});
