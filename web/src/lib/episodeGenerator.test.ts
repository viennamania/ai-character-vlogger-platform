import { describe, expect, it } from "vitest";
import { defaultCharacter } from "@/data/sampleCharacter";
import { vlogTemplates } from "@/data/templates";
import { generateEpisodeDraft } from "./episodeGenerator";

describe("generateEpisodeDraft", () => {
  it("injects disclosure into captions and manifest", () => {
    const draft = generateEpisodeDraft(defaultCharacter, vlogTemplates[0], {
      platform: "youtube",
      tone: "cozy",
      ctaGoal: "comment",
      lengthSeconds: 30,
      calendarSlot: "2026-05-04",
    });

    expect(draft.platformCaptions.youtube).toContain(defaultCharacter.disclosure);
    expect(draft.exportManifest.disclosure).toBe(defaultCharacter.disclosure);
  });

  it("keeps one scene per template beat", () => {
    const template = vlogTemplates.find((item) => item.id === "fan-qa")!;
    const draft = generateEpisodeDraft(defaultCharacter, template, {
      platform: "tiktok",
      tone: "playful",
      ctaGoal: "poll",
      lengthSeconds: 45,
      calendarSlot: "2026-05-04",
    });

    expect(draft.scenePlan).toHaveLength(template.beats.length);
    expect(draft.scenePlan[0].order).toBe(1);
  });
});
