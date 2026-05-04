export type Platform = "youtube" | "tiktok" | "instagram";
export type ToneMode = "cozy" | "playful" | "direct" | "premium";
export type CtaGoal = "comment" | "follow" | "poll" | "paid-profile";

export interface CharacterProfile {
  id: string;
  version: string;
  displayName: string;
  disclosure: string;
  publicBio: string;
  language: string;
  voiceTone: string;
  visualStyle: string;
  recurringTopics: string;
  contentBoundaries: string;
}

export interface VlogTemplate {
  id: string;
  name: string;
  format: string;
  hookPattern: string;
  beats: string[];
  thumbnailCue: string;
  cta: string;
  tags: string[];
}

export interface EpisodeOptions {
  platform: Platform;
  tone: ToneMode;
  ctaGoal: CtaGoal;
  lengthSeconds: number;
  calendarSlot: string;
}

export interface ScenePlanItem {
  order: number;
  beat: string;
  durationSeconds: number;
  visualPrompt: string;
  voiceover: string;
  subtitle: string;
}

export interface EpisodeDraft {
  id: string;
  createdAt: string;
  characterId: string;
  characterVersion: string;
  templateId: string;
  templateName: string;
  format: string;
  platform: Platform;
  tone: ToneMode;
  hook: string;
  shortScript: string;
  scenePlan: ScenePlanItem[];
  subtitleCopy: string[];
  thumbnailTitle: string;
  thumbnailDirection: string;
  platformCaptions: Record<Platform, string>;
  hashtags: string[];
  reviewChecklist: string[];
  publishingChecklist: string[];
  exportManifest: {
    aspectRatio: "9:16";
    durationSeconds: number;
    assets: string[];
    disclosure: string;
    packageName: string;
  };
}

const platformRules: Record<Platform, string> = {
  youtube: "YouTube Shorts package: punchy first line, plain disclosure, searchable tags.",
  tiktok: "TikTok package: fast hook, comment bait, clear AI label.",
  instagram: "Instagram Reels package: visual-first caption, clean CTA, creator-safe hashtags.",
};

const toneModifiers: Record<ToneMode, string> = {
  cozy: "soft, specific, and intimate",
  playful: "quick, witty, and fan-aware",
  direct: "clean, practical, and fast",
  premium: "polished, restrained, and behind-the-scenes",
};

const ctaLines: Record<CtaGoal, string> = {
  comment: "Tell me what detail you noticed first.",
  follow: "Follow for the next virtual vlog episode.",
  poll: "Vote in the comments and I will build the next episode around it.",
  "paid-profile": "The longer behind-the-scenes version belongs on the premium feed.",
};

export function generateEpisodeDraft(
  character: CharacterProfile,
  template: VlogTemplate,
  options: EpisodeOptions,
): EpisodeDraft {
  const durationPerScene = Math.max(3, Math.round(options.lengthSeconds / template.beats.length));
  const id = `${character.id}_${template.id}_${options.platform}_${options.lengthSeconds}`;
  const hook = `${character.displayName} ${template.hookPattern}`;
  const scenePlan = template.beats.map((beat, index) => {
    const voiceover = buildVoiceoverLine(character, beat, index, options);
    return {
      order: index + 1,
      beat,
      durationSeconds: durationPerScene,
      visualPrompt: buildVisualPrompt(character, template, beat, options),
      voiceover,
      subtitle: voiceover.length > 74 ? `${voiceover.slice(0, 71)}...` : voiceover,
    };
  });

  const shortScript = [hook, ...scenePlan.map((scene) => scene.voiceover), ctaLines[options.ctaGoal]].join(" ");
  const hashtags = [...new Set([...template.tags, options.platform, "aigenerated", "virtualvlog"])].slice(0, 8);
  const thumbnailTitle = `${character.displayName}: ${template.name}`;
  const thumbnailDirection = `${template.thumbnailCue}. Keep the character visually consistent: ${character.visualStyle}.`;

  return {
    id,
    createdAt: new Date().toISOString(),
    characterId: character.id,
    characterVersion: character.version,
    templateId: template.id,
    templateName: template.name,
    format: template.format,
    platform: options.platform,
    tone: options.tone,
    hook,
    shortScript,
    scenePlan,
    subtitleCopy: scenePlan.map((scene) => scene.subtitle),
    thumbnailTitle,
    thumbnailDirection,
    platformCaptions: buildPlatformCaptions(character, template, options, hashtags),
    hashtags,
    reviewChecklist: [
      "AI/virtual disclosure is present in captions and export manifest.",
      "Public output stays within SFW boundaries.",
      "No celebrity likeness, face cloning, or underage-coded styling requested.",
      "No claim that the character physically attended real events.",
      "Human review required before publishing or paid upsell.",
    ],
    publishingChecklist: [
      "Render or attach vertical 9:16 video.",
      "Burn in subtitles or upload subtitle file.",
      "Add thumbnail title and disclosure text.",
      "Confirm platform caption and hashtags.",
      "Record publish date and first 24-hour performance metrics.",
    ],
    exportManifest: {
      aspectRatio: "9:16",
      durationSeconds: options.lengthSeconds,
      assets: [
        "vertical_video.mp4",
        "subtitles.srt",
        "thumbnail.png",
        "platform_captions.json",
        "review_checklist.md",
      ],
      disclosure: character.disclosure,
      packageName: `${slugify(character.displayName)}-${template.id}-${options.platform}`,
    },
  };
}

function buildVoiceoverLine(
  character: CharacterProfile,
  beat: string,
  index: number,
  options: EpisodeOptions,
): string {
  const intro = index === 0 ? "Today stays inside the virtual studio." : "The next detail is";
  return `${intro} ${beat.toLowerCase()}, kept ${toneModifiers[options.tone]} in ${character.displayName}'s voice.`;
}

function buildVisualPrompt(
  character: CharacterProfile,
  template: VlogTemplate,
  beat: string,
  options: EpisodeOptions,
): string {
  return [
    `Vertical ${options.lengthSeconds}s ${template.format.toLowerCase()} shot for ${options.platform}.`,
    `Beat: ${beat}.`,
    `Character: ${character.displayName}, ${character.visualStyle}.`,
    `Rules: ${character.contentBoundaries}.`,
  ].join(" ");
}

function buildPlatformCaptions(
  character: CharacterProfile,
  template: VlogTemplate,
  options: EpisodeOptions,
  hashtags: string[],
): Record<Platform, string> {
  const base = `${character.displayName} - ${template.name}. ${template.cta} ${character.disclosure}`;
  return {
    youtube: `${base}\n${platformRules.youtube}\n${hashtags.map((tag) => `#${tag}`).join(" ")}`,
    tiktok: `${base}\n${platformRules.tiktok}\n${ctaLines[options.ctaGoal]}`,
    instagram: `${base}\n${platformRules.instagram}\n${hashtags.slice(0, 6).map((tag) => `#${tag}`).join(" ")}`,
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
