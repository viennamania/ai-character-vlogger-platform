import type { EpisodeDraft, Platform, ScenePlanItem } from "@/lib/episodeGenerator";

export interface EpisodeDraftEdits {
  hook?: string;
  shortScript?: string;
  thumbnailTitle?: string;
  thumbnailDirection?: string;
  platformCaptions?: Partial<Record<Platform, string>>;
  scenePlan?: Record<number, Partial<Pick<ScenePlanItem, "voiceover" | "subtitle">>>;
}

export function applyEpisodeDraftEdits(draft: EpisodeDraft, edits?: EpisodeDraftEdits): EpisodeDraft {
  if (!hasEpisodeDraftEdits(edits)) return draft;

  const scenePlan = draft.scenePlan.map((scene) => {
    const sceneEdits = edits?.scenePlan?.[scene.order];
    return sceneEdits ? { ...scene, ...sceneEdits } : scene;
  });

  return {
    ...draft,
    hook: edits?.hook ?? draft.hook,
    shortScript: edits?.shortScript ?? draft.shortScript,
    thumbnailTitle: edits?.thumbnailTitle ?? draft.thumbnailTitle,
    thumbnailDirection: edits?.thumbnailDirection ?? draft.thumbnailDirection,
    scenePlan,
    subtitleCopy: scenePlan.map((scene) => scene.subtitle),
    platformCaptions: {
      ...draft.platformCaptions,
      ...edits?.platformCaptions,
    },
  };
}

export function hasEpisodeDraftEdits(edits?: EpisodeDraftEdits): boolean {
  if (!edits) return false;
  return [
    edits.hook,
    edits.shortScript,
    edits.thumbnailTitle,
    edits.thumbnailDirection,
    ...Object.values(edits.platformCaptions ?? {}),
    ...Object.values(edits.scenePlan ?? {}).flatMap((sceneEdits) => [sceneEdits.voiceover, sceneEdits.subtitle]),
  ].some((value) => value !== undefined);
}

export function buildSubtitleFromVoiceover(voiceover: string): string {
  return voiceover.length > 74 ? `${voiceover.slice(0, 71)}...` : voiceover;
}
