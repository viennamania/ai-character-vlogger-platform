import { describe, expect, it } from "vitest";
import { defaultCharacter } from "@/data/sampleCharacter";
import { vlogTemplates } from "@/data/templates";
import { generateEpisodeDraft } from "./episodeGenerator";
import { applyEpisodeDraftEdits, buildSubtitleFromVoiceover, hasEpisodeDraftEdits } from "./draftEditor";

const draft = generateEpisodeDraft(defaultCharacter, vlogTemplates[0], {
  platform: "youtube",
  tone: "cozy",
  ctaGoal: "comment",
  lengthSeconds: 30,
  calendarSlot: "2026-05-13",
});

describe("draft editing", () => {
  it("applies edited copy without changing generated identity fields", () => {
    const edited = applyEpisodeDraftEdits(draft, {
      hook: "Edited hook",
      thumbnailTitle: "Edited title",
      platformCaptions: {
        youtube: "Edited YouTube caption",
      },
      scenePlan: {
        1: {
          voiceover: "Edited scene voiceover",
          subtitle: "Edited scene voiceover",
        },
      },
    });

    expect(edited.id).toBe(draft.id);
    expect(edited.characterVersion).toBe(draft.characterVersion);
    expect(edited.hook).toBe("Edited hook");
    expect(edited.thumbnailTitle).toBe("Edited title");
    expect(edited.platformCaptions.youtube).toBe("Edited YouTube caption");
    expect(edited.scenePlan[0].voiceover).toBe("Edited scene voiceover");
    expect(edited.subtitleCopy[0]).toBe("Edited scene voiceover");
  });

  it("detects empty edit objects and truncates long subtitles", () => {
    expect(hasEpisodeDraftEdits()).toBe(false);
    expect(hasEpisodeDraftEdits({ platformCaptions: {} })).toBe(false);
    expect(hasEpisodeDraftEdits({ shortScript: "" })).toBe(true);
    expect(buildSubtitleFromVoiceover("a".repeat(80))).toHaveLength(74);
  });
});
