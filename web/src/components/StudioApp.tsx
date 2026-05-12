"use client";

import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  FileJson,
  Images,
  MessageCircle,
  Play,
  Plus,
  RotateCcw,
  Save,
  Server,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import type { PutBlobResult } from "@vercel/blob";
import { upload } from "@vercel/blob/client";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { defaultCharacter } from "@/data/sampleCharacter";
import { vlogTemplates } from "@/data/templates";
import {
  EpisodeDraftEdits,
  applyEpisodeDraftEdits,
  buildSubtitleFromVoiceover,
  hasEpisodeDraftEdits,
} from "@/lib/draftEditor";
import { createExportPackage } from "@/lib/exportPackage";
import {
  CharacterProfile,
  CtaGoal,
  EpisodeDraft,
  EpisodeOptions,
  Platform,
  ToneMode,
  generateEpisodeDraft,
} from "@/lib/episodeGenerator";
import type { ExportPackageRecord, MediaAssetRecord, MetricRecord, SavedEpisodeDraft } from "@/lib/persistence";

type ActiveView = "builder" | "queue" | "assets" | "analytics";

const savedDraftsKey = "ai-vlogger.saved-drafts";
const metricsKey = "ai-vlogger.metrics";
const mediaAssetsKey = "ai-vlogger.media-assets";
const exportPackagesKey = "ai-vlogger.export-packages";
const draftEditsKey = "ai-vlogger.draft-edits";
const metricFields: Array<[keyof Omit<MetricRecord, "draftId" | "title" | "platform" | "notes" | "createdAt">, string]> = [
  ["views", "Views"],
  ["likes", "Likes"],
  ["comments", "Comments"],
  ["followers", "Followers"],
  ["paidClicks", "Paid clicks"],
];

export function StudioApp() {
  const [activeView, setActiveView] = useState<ActiveView>("builder");
  const [character, setCharacter] = useState<CharacterProfile>(defaultCharacter);
  const [selectedTemplateId, setSelectedTemplateId] = useState(vlogTemplates[0].id);
  const [options, setOptions] = useState<EpisodeOptions>({
    platform: "youtube",
    tone: "cozy",
    ctaGoal: "comment",
    lengthSeconds: 30,
    calendarSlot: new Date().toISOString().slice(0, 10),
  });
  const [savedDrafts, setSavedDrafts] = useLocalState<SavedEpisodeDraft[]>(savedDraftsKey, []);
  const [metrics, setMetrics] = useLocalState<MetricRecord[]>(metricsKey, []);
  const [mediaAssets, setMediaAssets] = useLocalState<MediaAssetRecord[]>(mediaAssetsKey, []);
  const [exportPackages, setExportPackages] = useLocalState<ExportPackageRecord[]>(exportPackagesKey, []);
  const [draftEdits, setDraftEdits] = useLocalState<Record<string, EpisodeDraftEdits>>(draftEditsKey, {});
  const [atlasStatus, setAtlasStatus] = useState("Checking Atlas");
  const [blobStatus, setBlobStatus] = useState("Checking Blob");
  const [syncStatus, setSyncStatus] = useState("Local first");
  const [uploadStatus, setUploadStatus] = useState("No uploads yet");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const selectedTemplate = useMemo(
    () => vlogTemplates.find((template) => template.id === selectedTemplateId) ?? vlogTemplates[0],
    [selectedTemplateId],
  );

  const generatedDraft = useMemo(
    () => generateEpisodeDraft(character, selectedTemplate, options),
    [character, selectedTemplate, options],
  );

  const activeDraftEdits = draftEdits[generatedDraft.id];
  const draftHasEdits = hasEpisodeDraftEdits(activeDraftEdits);
  const draft = useMemo(() => applyEpisodeDraftEdits(generatedDraft, activeDraftEdits), [generatedDraft, activeDraftEdits]);

  const totalViews = metrics.reduce((sum, item) => sum + item.views, 0);
  const totalPaidClicks = metrics.reduce((sum, item) => sum + item.paidClicks, 0);

  useEffect(() => {
    void loadServerState();
  }, []);

  async function loadServerState() {
    try {
      const health = await fetch("/api/health/atlas", { cache: "no-store" }).then((response) => response.json());
      setAtlasStatus(health.connected ? `Atlas connected: ${health.database}` : "Atlas not configured");

      const [blobHealth, draftResponse, metricResponse, mediaResponse, exportResponse] = await Promise.all([
        fetch("/api/health/blob", { cache: "no-store" }).then((response) => response.json()),
        fetch("/api/drafts", { cache: "no-store" }).then((response) => response.json()),
        fetch("/api/metrics", { cache: "no-store" }).then((response) => response.json()),
        fetch("/api/media-assets", { cache: "no-store" }).then((response) => response.json()),
        fetch("/api/export-packages", { cache: "no-store" }).then((response) => response.json()),
      ]);

      setBlobStatus(blobHealth.configured ? "Blob configured" : "Blob token missing");

      if (draftResponse.persisted && draftResponse.drafts.length > 0) {
        setSavedDrafts(draftResponse.drafts);
      }

      if (metricResponse.persisted && metricResponse.metrics.length > 0) {
        setMetrics(metricResponse.metrics);
      }

      if (mediaResponse.persisted && mediaResponse.assets.length > 0) {
        setMediaAssets(mediaResponse.assets);
      }

      if (exportResponse.persisted && exportResponse.packages.length > 0) {
        setExportPackages(exportResponse.packages);
      }
    } catch {
      setAtlasStatus("Atlas check unavailable");
      setBlobStatus("Blob check unavailable");
    }
  }

  function updateCharacter(field: keyof CharacterProfile, value: string) {
    setCharacter((current) => ({ ...current, [field]: value }));
  }

  function updateOptions<T extends keyof EpisodeOptions>(field: T, value: EpisodeOptions[T]) {
    setOptions((current) => ({ ...current, [field]: value }));
  }

  function updateDraftText(field: "hook" | "shortScript" | "thumbnailTitle" | "thumbnailDirection", value: string) {
    setDraftEdits((current) => ({
      ...current,
      [generatedDraft.id]: {
        ...current[generatedDraft.id],
        [field]: value,
      },
    }));
  }

  function updateDraftCaption(platform: Platform, value: string) {
    setDraftEdits((current) => ({
      ...current,
      [generatedDraft.id]: {
        ...current[generatedDraft.id],
        platformCaptions: {
          ...current[generatedDraft.id]?.platformCaptions,
          [platform]: value,
        },
      },
    }));
  }

  function updateDraftSceneVoiceover(order: number, voiceover: string) {
    setDraftEdits((current) => ({
      ...current,
      [generatedDraft.id]: {
        ...current[generatedDraft.id],
        scenePlan: {
          ...current[generatedDraft.id]?.scenePlan,
          [order]: {
            ...current[generatedDraft.id]?.scenePlan?.[order],
            voiceover,
            subtitle: buildSubtitleFromVoiceover(voiceover),
          },
        },
      },
    }));
  }

  function resetDraftEdits() {
    setDraftEdits((current) => {
      const next = { ...current };
      delete next[generatedDraft.id];
      return next;
    });
  }

  async function saveDraft() {
    const saved: SavedEpisodeDraft = {
      ...draft,
      savedAt: new Date().toISOString(),
      editedAt: draftHasEdits ? new Date().toISOString() : undefined,
      reviewStatus: "Needs review",
    };

    setSavedDrafts((current) => [saved, ...current.filter((item) => item.id !== draft.id)].slice(0, 24));
    setSyncStatus("Saving draft");

    try {
      const result = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saved),
      }).then((response) => response.json());
      setSyncStatus(result.persisted ? "Saved to Atlas" : "Saved locally");
    } catch {
      setSyncStatus("Saved locally");
    }
  }

  function removeDraft(draftId: string) {
    setSavedDrafts((current) => current.filter((item) => item.id !== draftId));
  }

  async function approveDraft(draftId: string) {
    const targetDraft = savedDrafts.find((item) => item.id === draftId);
    if (!targetDraft) return;

    const updatedDraft: SavedEpisodeDraft = {
      ...targetDraft,
      reviewStatus: "Approved",
      savedAt: targetDraft.savedAt || new Date().toISOString(),
    };

    setSavedDrafts((current) => current.map((item) => (item.id === draftId ? updatedDraft : item)));
    setSyncStatus("Saving draft review");

    try {
      const result = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDraft),
      }).then((response) => response.json());
      setSyncStatus(result.persisted ? "Draft review saved to Atlas" : "Draft review saved locally");
    } catch {
      setSyncStatus("Draft review saved locally");
    }
  }

  async function packageDraft(savedDraft: SavedEpisodeDraft) {
    const exportPackage = createExportPackage(savedDraft, mediaAssets);

    setExportPackages((current) => [exportPackage, ...current.filter((item) => item.id !== exportPackage.id)].slice(0, 24));
    setSyncStatus("Saving export package");

    try {
      const result = await fetch("/api/export-packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportPackage),
      }).then((response) => response.json());
      setSyncStatus(result.persisted ? "Export package saved to Atlas" : "Export package saved locally");
    } catch {
      setSyncStatus("Export package saved locally");
    }

    downloadExportPackage(exportPackage);
  }

  async function updateMediaAssetReview(assetId: string, reviewStatus: MediaAssetRecord["reviewStatus"]) {
    const nextReviewedAt = new Date().toISOString();
    const nextAsset = mediaAssets.find((asset) => asset.id === assetId);
    if (!nextAsset) return;

    const updatedAsset: MediaAssetRecord = {
      ...nextAsset,
      reviewStatus,
      reviewedAt: nextReviewedAt,
    };

    setMediaAssets((current) => current.map((asset) => (asset.id === assetId ? updatedAsset : asset)));
    setSyncStatus("Saving asset review");

    try {
      const result = await fetch("/api/media-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedAsset),
      }).then((response) => response.json());
      setSyncStatus(result.persisted ? "Asset review saved to Atlas" : "Asset review saved locally");
    } catch {
      setSyncStatus("Asset review saved locally");
    }
  }

  async function uploadContent(file: File) {
    setUploadStatus("Uploading to Vercel Blob");
    setUploadProgress(0);

    try {
      const blob = await upload(buildBlobPath(draft, file.name), file, {
        access: "public",
        handleUploadUrl: "/api/uploads",
        multipart: file.size > 4.5 * 1024 * 1024,
        clientPayload: JSON.stringify({
          characterId: draft.characterId,
          characterVersion: draft.characterVersion,
          templateId: draft.templateId,
          episodeDraftId: draft.id,
          originalFilename: file.name,
          size: file.size,
        }),
        onUploadProgress: ({ percentage }) => {
          setUploadProgress(Math.round(percentage));
        },
      });

      const asset = buildMediaAssetRecord(blob, draft, file);
      setMediaAssets((current) => [asset, ...current.filter((item) => item.id !== asset.id)].slice(0, 30));

      const result = await fetch("/api/media-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(asset),
      }).then((response) => response.json());

      setUploadStatus(result.persisted ? "Uploaded and saved to Atlas" : "Uploaded to Blob");
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadProgress(null);
    }
  }

  return (
    <div className="app-shell">
      <aside className="side-panel" aria-label="Character profile">
        <div className="brand-row">
          <img src="/virtual-creator.svg" alt="Virtual creator reference" className="avatar-art" />
          <div>
            <p className="eyebrow">Character CMS</p>
            <h1>AI Vlogger Ops</h1>
          </div>
        </div>

        <div className="field-stack">
          <label>
            Display name
            <input value={character.displayName} onChange={(event) => updateCharacter("displayName", event.target.value)} />
          </label>
          <label>
            Disclosure
            <input value={character.disclosure} onChange={(event) => updateCharacter("disclosure", event.target.value)} />
          </label>
          <label>
            Public bio
            <textarea value={character.publicBio} onChange={(event) => updateCharacter("publicBio", event.target.value)} rows={4} />
          </label>
          <label>
            Voice rules
            <textarea value={character.voiceTone} onChange={(event) => updateCharacter("voiceTone", event.target.value)} rows={3} />
          </label>
          <label>
            Visual style
            <textarea value={character.visualStyle} onChange={(event) => updateCharacter("visualStyle", event.target.value)} rows={3} />
          </label>
          <label>
            Content boundaries
            <textarea
              value={character.contentBoundaries}
              onChange={(event) => updateCharacter("contentBoundaries", event.target.value)}
              rows={3}
            />
          </label>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Next.js + MongoDB Atlas + Vercel</p>
            <h2>{draft.thumbnailTitle}</h2>
          </div>
          <div className="topbar-actions">
            <span className="status-pill">
              <Server size={16} />
              {atlasStatus}
            </span>
            <span className="status-pill">
              <ShieldCheck size={16} />
              {syncStatus}
            </span>
            <span className="status-pill">
              <Upload size={16} />
              {blobStatus}
            </span>
            <button className="primary-button" onClick={saveDraft}>
              <Save size={16} />
              Save draft
            </button>
            <button className="icon-button" onClick={() => downloadDraft(draft)} title="Download JSON package">
              <Download size={17} />
            </button>
          </div>
        </header>

        <nav className="tabs" aria-label="Workspace views">
          <TabButton active={activeView === "builder"} onClick={() => setActiveView("builder")} icon={<Sparkles />}>
            Builder
          </TabButton>
          <TabButton active={activeView === "queue"} onClick={() => setActiveView("queue")} icon={<ClipboardList />}>
            Review queue
          </TabButton>
          <TabButton active={activeView === "assets"} onClick={() => setActiveView("assets")} icon={<Images />}>
            Assets
          </TabButton>
          <TabButton active={activeView === "analytics"} onClick={() => setActiveView("analytics")} icon={<BarChart3 />}>
            Analytics
          </TabButton>
        </nav>

        {activeView === "builder" && (
          <BuilderView
            draft={draft}
            selectedTemplateId={selectedTemplateId}
            setSelectedTemplateId={setSelectedTemplateId}
            options={options}
            updateOptions={updateOptions}
            uploadContent={uploadContent}
            uploadStatus={uploadStatus}
            uploadProgress={uploadProgress}
            mediaAssets={mediaAssets}
            draftHasEdits={draftHasEdits}
            updateDraftText={updateDraftText}
            updateDraftCaption={updateDraftCaption}
            updateDraftSceneVoiceover={updateDraftSceneVoiceover}
            resetDraftEdits={resetDraftEdits}
          />
        )}

        {activeView === "queue" && (
          <QueueView
            savedDrafts={savedDrafts}
            mediaAssets={mediaAssets}
            exportPackages={exportPackages}
            approveDraft={approveDraft}
            packageDraft={packageDraft}
            removeDraft={removeDraft}
            downloadDraft={downloadDraft}
          />
        )}

        {activeView === "assets" && <AssetsView mediaAssets={mediaAssets} updateMediaAssetReview={updateMediaAssetReview} />}

        {activeView === "analytics" && (
          <AnalyticsView
            savedDrafts={savedDrafts}
            metrics={metrics}
            setMetrics={setMetrics}
            totalViews={totalViews}
            totalPaidClicks={totalPaidClicks}
            setSyncStatus={setSyncStatus}
          />
        )}
      </main>
    </div>
  );
}

interface BuilderViewProps {
  draft: EpisodeDraft;
  selectedTemplateId: string;
  setSelectedTemplateId: (id: string) => void;
  options: EpisodeOptions;
  updateOptions: <T extends keyof EpisodeOptions>(field: T, value: EpisodeOptions[T]) => void;
  uploadContent: (file: File) => Promise<void>;
  uploadStatus: string;
  uploadProgress: number | null;
  mediaAssets: MediaAssetRecord[];
  draftHasEdits: boolean;
  updateDraftText: (field: "hook" | "shortScript" | "thumbnailTitle" | "thumbnailDirection", value: string) => void;
  updateDraftCaption: (platform: Platform, value: string) => void;
  updateDraftSceneVoiceover: (order: number, voiceover: string) => void;
  resetDraftEdits: () => void;
}

function BuilderView({
  draft,
  selectedTemplateId,
  setSelectedTemplateId,
  options,
  updateOptions,
  uploadContent,
  uploadStatus,
  uploadProgress,
  mediaAssets,
  draftHasEdits,
  updateDraftText,
  updateDraftCaption,
  updateDraftSceneVoiceover,
  resetDraftEdits,
}: BuilderViewProps) {
  return (
    <div className="builder-grid">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Template library</p>
            <h3>Vlog formats</h3>
          </div>
          <span className="count-pill">{vlogTemplates.length} templates</span>
        </div>
        <div className="template-grid">
          {vlogTemplates.map((template) => (
            <button
              key={template.id}
              className={`template-tile ${selectedTemplateId === template.id ? "selected" : ""}`}
              onClick={() => setSelectedTemplateId(template.id)}
            >
              <span>{template.name}</span>
              <small>{template.format}</small>
            </button>
          ))}
        </div>

        <div className="option-row">
          <SegmentedControl<Platform>
            label="Platform"
            value={options.platform}
            options={[
              ["youtube", "YouTube"],
              ["tiktok", "TikTok"],
              ["instagram", "Reels"],
            ]}
            onChange={(value) => updateOptions("platform", value)}
          />
          <SegmentedControl<ToneMode>
            label="Tone"
            value={options.tone}
            options={[
              ["cozy", "Cozy"],
              ["playful", "Playful"],
              ["direct", "Direct"],
              ["premium", "Premium"],
            ]}
            onChange={(value) => updateOptions("tone", value)}
          />
        </div>

        <div className="option-row">
          <label className="range-field">
            Length
            <span>{options.lengthSeconds}s</span>
            <input
              type="range"
              min={15}
              max={45}
              step={5}
              value={options.lengthSeconds}
              onChange={(event) => updateOptions("lengthSeconds", Number(event.target.value))}
            />
          </label>
          <label>
            CTA goal
            <select value={options.ctaGoal} onChange={(event) => updateOptions("ctaGoal", event.target.value as CtaGoal)}>
              <option value="comment">Comment</option>
              <option value="follow">Follow</option>
              <option value="poll">Poll</option>
              <option value="paid-profile">Paid profile</option>
            </select>
          </label>
          <label>
            Calendar slot
            <input type="date" value={options.calendarSlot} onChange={(event) => updateOptions("calendarSlot", event.target.value)} />
          </label>
        </div>

        <DraftEditor
          draft={draft}
          draftHasEdits={draftHasEdits}
          updateDraftText={updateDraftText}
          updateDraftCaption={updateDraftCaption}
          updateDraftSceneVoiceover={updateDraftSceneVoiceover}
          resetDraftEdits={resetDraftEdits}
        />

        <OutputBlock draft={draft} />
      </section>

      <aside className="preview-panel">
        <img src="/episode-board.svg" alt="Episode board preview" className="episode-art" />
        <div className="thumbnail-box">
          <p className="eyebrow">Thumbnail</p>
          <h3>{draft.thumbnailTitle}</h3>
          <p>{draft.thumbnailDirection}</p>
        </div>
        <div className="manifest-list">
          <div>
            <FileJson size={16} />
            <strong>{draft.exportManifest.packageName}</strong>
          </div>
          <span>{draft.exportManifest.aspectRatio}</span>
          <span>{draft.exportManifest.durationSeconds}s</span>
          <span>{draft.exportManifest.assets.length} assets</span>
        </div>
        <UploadPanel
          draft={draft}
          mediaAssets={mediaAssets}
          uploadContent={uploadContent}
          uploadProgress={uploadProgress}
          uploadStatus={uploadStatus}
        />
      </aside>
    </div>
  );
}

function DraftEditor({
  draft,
  draftHasEdits,
  updateDraftText,
  updateDraftCaption,
  updateDraftSceneVoiceover,
  resetDraftEdits,
}: {
  draft: EpisodeDraft;
  draftHasEdits: boolean;
  updateDraftText: (field: "hook" | "shortScript" | "thumbnailTitle" | "thumbnailDirection", value: string) => void;
  updateDraftCaption: (platform: Platform, value: string) => void;
  updateDraftSceneVoiceover: (order: number, voiceover: string) => void;
  resetDraftEdits: () => void;
}) {
  return (
    <section className="editor-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Editorial pass</p>
          <h3>Draft copy</h3>
        </div>
        <div className="editor-actions">
          <span className="count-pill">{draftHasEdits ? "Edited" : "Generated"}</span>
          <button className="icon-button" onClick={resetDraftEdits} title="Reset generated copy" disabled={!draftHasEdits}>
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="editor-grid">
        <label className="wide-input">
          Hook
          <textarea value={draft.hook} onChange={(event) => updateDraftText("hook", event.target.value)} rows={2} />
        </label>
        <label className="wide-input">
          Short script
          <textarea value={draft.shortScript} onChange={(event) => updateDraftText("shortScript", event.target.value)} rows={5} />
        </label>
        <label>
          Thumbnail title
          <input value={draft.thumbnailTitle} onChange={(event) => updateDraftText("thumbnailTitle", event.target.value)} />
        </label>
        <label>
          Thumbnail direction
          <textarea
            value={draft.thumbnailDirection}
            onChange={(event) => updateDraftText("thumbnailDirection", event.target.value)}
            rows={3}
          />
        </label>
      </div>

      <div className="scene-edit-list">
        {draft.scenePlan.map((scene) => (
          <label key={scene.order}>
            Scene {String(scene.order).padStart(2, "0")} voiceover
            <textarea value={scene.voiceover} onChange={(event) => updateDraftSceneVoiceover(scene.order, event.target.value)} rows={2} />
          </label>
        ))}
      </div>

      <div className="caption-edit-list">
        {(["youtube", "tiktok", "instagram"] as Platform[]).map((platform) => (
          <label key={platform}>
            {platform} caption
            <textarea value={draft.platformCaptions[platform]} onChange={(event) => updateDraftCaption(platform, event.target.value)} rows={4} />
          </label>
        ))}
      </div>
    </section>
  );
}

function UploadPanel({
  draft,
  mediaAssets,
  uploadContent,
  uploadProgress,
  uploadStatus,
}: {
  draft: EpisodeDraft;
  mediaAssets: MediaAssetRecord[];
  uploadContent: (file: File) => Promise<void>;
  uploadProgress: number | null;
  uploadStatus: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const episodeAssets = mediaAssets.filter((asset) => asset.episodeDraftId === draft.id);

  async function submitUpload(event: FormEvent) {
    event.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    await uploadContent(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <section className="upload-panel">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Content storage</p>
          <h3>Vercel Blob upload</h3>
        </div>
      </div>
      <form className="upload-form" onSubmit={submitUpload}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,audio/mpeg,audio/wav,application/pdf"
          required
        />
        <button className="primary-button">
          <Upload size={16} />
          Upload
        </button>
      </form>
      <p className="upload-status">
        {uploadStatus}
        {uploadProgress !== null ? ` (${uploadProgress}%)` : ""}
      </p>
      <div className="asset-list">
        {episodeAssets.length === 0 && <p className="muted">No content files linked to this episode yet.</p>}
        {episodeAssets.map((asset) => (
          <a href={asset.url} target="_blank" rel="noreferrer" key={asset.id} className="asset-link">
            <strong>{asset.originalFilename || asset.pathname}</strong>
            <small>
              {asset.contentType} - {formatFileSize(asset.size)} - {asset.reviewStatus}
            </small>
          </a>
        ))}
      </div>
    </section>
  );
}

function OutputBlock({ draft }: { draft: EpisodeDraft }) {
  return (
    <div className="output-grid">
      <section className="output-section">
        <div className="section-heading compact">
          <h3>Episode draft</h3>
          <span className="status-pill">
            <Play size={15} />
            {draft.platform}
          </span>
        </div>
        <p className="hook-line">{draft.hook}</p>
        <p className="script-box">{draft.shortScript}</p>
      </section>

      <section className="output-section">
        <h3>Scene plan</h3>
        <div className="scene-list">
          {draft.scenePlan.map((scene) => (
            <article key={scene.order} className="scene-item">
              <span>{String(scene.order).padStart(2, "0")}</span>
              <div>
                <strong>{scene.beat}</strong>
                <p>{scene.voiceover}</p>
              </div>
              <small>{scene.durationSeconds}s</small>
            </article>
          ))}
        </div>
      </section>

      <section className="output-section">
        <h3>Caption package</h3>
        <div className="caption-stack">
          {Object.entries(draft.platformCaptions).map(([platform, caption]) => (
            <details key={platform} open={platform === draft.platform}>
              <summary>{platform}</summary>
              <p>{caption}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="output-section">
        <h3>Review gates</h3>
        <Checklist items={draft.reviewChecklist} icon="check" />
      </section>

      <section className="output-section">
        <h3>Publishing checklist</h3>
        <Checklist items={draft.publishingChecklist} icon="upload" />
      </section>
    </div>
  );
}

function Checklist({ items, icon }: { items: string[]; icon: "check" | "upload" }) {
  const Icon = icon === "check" ? CheckCircle2 : Upload;
  return (
    <ul className="check-list">
      {items.map((item) => (
        <li key={item}>
          <Icon size={16} />
          {item}
        </li>
      ))}
    </ul>
  );
}

function QueueView({
  savedDrafts,
  mediaAssets,
  exportPackages,
  approveDraft,
  packageDraft,
  removeDraft,
  downloadDraft,
}: {
  savedDrafts: SavedEpisodeDraft[];
  mediaAssets: MediaAssetRecord[];
  exportPackages: ExportPackageRecord[];
  approveDraft: (draftId: string) => Promise<void>;
  packageDraft: (draft: SavedEpisodeDraft) => Promise<void>;
  removeDraft: (draftId: string) => void;
  downloadDraft: (draft: EpisodeDraft) => void;
}) {
  if (savedDrafts.length === 0) {
    return (
      <section className="empty-state">
        <ClipboardList size={34} />
        <h3>No saved drafts</h3>
        <p>Saved episode packages will appear here for approval and export.</p>
      </section>
    );
  }

  return (
    <div className="queue-grid">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Human review</p>
            <h3>Draft queue</h3>
          </div>
          <span className="count-pill">{savedDrafts.length} drafts</span>
        </div>
        <div className="draft-table" role="table">
          <div className="draft-row header" role="row">
            <span>Episode</span>
            <span>Platform</span>
            <span>Version</span>
            <span>Media</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {savedDrafts.map((draft) => {
            const assetSummary = summarizeDraftAssets(draft.id, mediaAssets);
            const canPackage = draft.reviewStatus === "Approved";

            return (
              <div className="draft-row" role="row" key={`${draft.id}-${draft.savedAt}`}>
                <span>
                  <strong>{draft.thumbnailTitle}</strong>
                  <small>
                    {formatDate(draft.savedAt)}
                    {draft.editedAt ? ` - edited ${formatDate(draft.editedAt)}` : ""}
                  </small>
                </span>
                <span>{draft.platform}</span>
                <span>{draft.characterVersion}</span>
                <span>
                  <strong>{assetSummary.approved} approved</strong>
                  <small>{assetSummary.total} linked</small>
                </span>
                <span>
                  <mark className={draft.reviewStatus === "Approved" ? "approved" : ""}>{draft.reviewStatus}</mark>
                </span>
                <span className="row-actions">
                  <button className="icon-button" onClick={() => void approveDraft(draft.id)} title="Approve draft">
                    <CheckCircle2 size={16} />
                  </button>
                  <button className="icon-button" onClick={() => downloadDraft(draft)} title="Download draft JSON">
                    <Download size={16} />
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => void packageDraft(draft)}
                    title="Export approved asset package"
                    disabled={!canPackage}
                  >
                    <FileJson size={16} />
                  </button>
                  <button className="icon-button danger" onClick={() => removeDraft(draft.id)} title="Remove">
                    <Trash2 size={16} />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Export packages</p>
            <h3>Approved asset manifests</h3>
          </div>
          <span className="count-pill">{exportPackages.length} packages</span>
        </div>
        <div className="package-list">
          {exportPackages.length === 0 && <p className="muted">Approved draft packages will appear here after export.</p>}
          {exportPackages.map((item) => (
            <article className="package-row" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <small>
                  {item.packageName} - {formatDate(item.createdAt)}
                </small>
              </div>
              <span>
                {item.approvedAssetCount} assets
                <mark className={item.status === "Ready for publish" ? "approved" : ""}>{item.status}</mark>
                <button className="icon-button" onClick={() => downloadExportPackage(item)} title="Download manifest">
                  <Download size={16} />
                </button>
              </span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function AssetsView({
  mediaAssets,
  updateMediaAssetReview,
}: {
  mediaAssets: MediaAssetRecord[];
  updateMediaAssetReview: (assetId: string, reviewStatus: MediaAssetRecord["reviewStatus"]) => Promise<void>;
}) {
  const needsReviewCount = mediaAssets.filter((asset) => asset.reviewStatus === "Needs review").length;

  if (mediaAssets.length === 0) {
    return (
      <section className="empty-state">
        <Images size={34} />
        <h3>No uploaded content</h3>
        <p>Vercel Blob uploads will appear here for media review and episode packaging.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Asset review</p>
          <h3>Media library</h3>
        </div>
        <span className="count-pill">{needsReviewCount} needs review</span>
      </div>
      <div className="asset-review-grid">
        {mediaAssets.map((asset) => (
          <article className="asset-review-card" key={asset.id}>
            <div className="asset-preview">
              {asset.contentType.startsWith("image/") ? (
                <img src={asset.url} alt={asset.originalFilename || asset.pathname} />
              ) : (
                <div>
                  <FileJson size={24} />
                  <span>{asset.contentType}</span>
                </div>
              )}
            </div>
            <div className="asset-review-body">
              <div className="section-heading compact">
                <div>
                  <strong>{asset.originalFilename || asset.pathname}</strong>
                  <small>{asset.pathname}</small>
                </div>
                <mark className={asset.reviewStatus === "Approved" ? "approved" : asset.reviewStatus === "Rejected" ? "rejected" : ""}>
                  {asset.reviewStatus}
                </mark>
              </div>
              <dl className="asset-meta">
                <div>
                  <dt>Size</dt>
                  <dd>{formatFileSize(asset.size)}</dd>
                </div>
                <div>
                  <dt>Episode</dt>
                  <dd>{asset.episodeDraftId || "Unlinked"}</dd>
                </div>
                <div>
                  <dt>Uploaded</dt>
                  <dd>{formatDate(asset.uploadedAt)}</dd>
                </div>
              </dl>
              <div className="asset-actions">
                <a className="secondary-link" href={asset.url} target="_blank" rel="noreferrer">
                  Open
                </a>
                <button className="primary-button" onClick={() => updateMediaAssetReview(asset.id, "Approved")}>
                  <CheckCircle2 size={16} />
                  Approve
                </button>
                <button className="icon-button danger" onClick={() => updateMediaAssetReview(asset.id, "Rejected")} title="Reject">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AnalyticsView({
  savedDrafts,
  metrics,
  setMetrics,
  totalViews,
  totalPaidClicks,
  setSyncStatus,
}: {
  savedDrafts: SavedEpisodeDraft[];
  metrics: MetricRecord[];
  setMetrics: React.Dispatch<React.SetStateAction<MetricRecord[]>>;
  totalViews: number;
  totalPaidClicks: number;
  setSyncStatus: (value: string) => void;
}) {
  const [selectedDraftId, setSelectedDraftId] = useState(savedDrafts[0]?.id ?? "");
  const [form, setForm] = useState({
    views: 0,
    likes: 0,
    comments: 0,
    followers: 0,
    paidClicks: 0,
    notes: "",
  });

  const selectedDraft = savedDrafts.find((draft) => draft.id === selectedDraftId) ?? savedDrafts[0];
  const averageEngagement =
    metrics.length === 0 ? 0 : metrics.reduce((sum, item) => sum + item.likes + item.comments, 0) / Math.max(1, metrics.length);

  useEffect(() => {
    if (!selectedDraftId && savedDrafts[0]) setSelectedDraftId(savedDrafts[0].id);
  }, [savedDraftIdKey(savedDrafts), selectedDraftId, savedDrafts]);

  async function submitMetric(event: FormEvent) {
    event.preventDefault();
    if (!selectedDraft) return;

    const record: MetricRecord = {
      draftId: selectedDraft.id,
      title: selectedDraft.thumbnailTitle,
      platform: selectedDraft.platform,
      ...form,
      createdAt: new Date().toISOString(),
    };

    setMetrics((current) => [record, ...current].slice(0, 30));
    setForm({ views: 0, likes: 0, comments: 0, followers: 0, paidClicks: 0, notes: "" });
    setSyncStatus("Saving metrics");

    try {
      const result = await fetch("/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      }).then((response) => response.json());
      setSyncStatus(result.persisted ? "Metrics saved to Atlas" : "Metrics saved locally");
    } catch {
      setSyncStatus("Metrics saved locally");
    }
  }

  return (
    <div className="analytics-grid">
      <section className="metric-strip">
        <Metric label="Tracked views" value={formatNumber(totalViews)} icon={<BarChart3 />} />
        <Metric label="Paid clicks" value={formatNumber(totalPaidClicks)} icon={<Upload />} />
        <Metric label="Avg engagement" value={averageEngagement.toFixed(1)} icon={<MessageCircle />} />
        <Metric label="Saved drafts" value={String(savedDrafts.length)} icon={<CalendarDays />} />
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Manual import</p>
            <h3>Performance entry</h3>
          </div>
        </div>
        <form className="metrics-form" onSubmit={submitMetric}>
          <label className="wide-input">
            Episode
            <select value={selectedDraftId} onChange={(event) => setSelectedDraftId(event.target.value)}>
              {savedDrafts.length === 0 && <option value="">No drafts saved</option>}
              {savedDrafts.map((draft) => (
                <option value={draft.id} key={draft.id}>
                  {draft.thumbnailTitle}
                </option>
              ))}
            </select>
          </label>
          {metricFields.map(([field, label]) => (
            <label key={field}>
              {label}
              <input
                type="number"
                min={0}
                value={form[field]}
                onChange={(event) => setForm((current) => ({ ...current, [field]: Number(event.target.value) }))}
              />
            </label>
          ))}
          <label className="wide-input">
            Notes
            <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={3} />
          </label>
          <button className="primary-button" disabled={!selectedDraft}>
            <Plus size={16} />
            Add metrics
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Feedback loop</p>
            <h3>Recent performance</h3>
          </div>
        </div>
        <div className="metric-list">
          {metrics.length === 0 && <p className="muted">No performance records yet.</p>}
          {metrics.map((item, index) => (
            <article className="metric-row" key={`${item.draftId}-${index}`}>
              <div>
                <strong>{item.title}</strong>
                <small>
                  {item.platform} - {formatNumber(item.views)} views - {formatNumber(item.paidClicks)} paid clicks
                </small>
              </div>
              <span>{item.likes + item.comments} engagement</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function TabButton({
  active,
  children,
  icon,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  icon: React.ReactElement;
  onClick: () => void;
}) {
  return (
    <button className={`tab ${active ? "active" : ""}`} onClick={onClick}>
      {icon}
      {children}
    </button>
  );
}

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="segmented-control">
      <legend>{label}</legend>
      <div>
        {options.map(([optionValue, optionLabel]) => (
          <button type="button" key={optionValue} className={value === optionValue ? "active" : ""} onClick={() => onChange(optionValue)}>
            {optionLabel}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactElement }) {
  return (
    <article className="metric-tile">
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function useLocalState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return fallback;
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : fallback;
    } catch {
      return fallback;
    }
  });

  function setStoredValue(next: React.SetStateAction<T>) {
    setValue((current) => {
      const resolved = typeof next === "function" ? (next as (previous: T) => T)(current) : next;
      window.localStorage.setItem(key, JSON.stringify(resolved));
      return resolved;
    });
  }

  return [value, setStoredValue] as const;
}

function downloadDraft(draft: EpisodeDraft) {
  const blob = new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${draft.exportManifest.packageName}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadExportPackage(exportPackage: ExportPackageRecord) {
  const blob = new Blob([JSON.stringify(exportPackage.manifest, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${exportPackage.packageName}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: value >= 10000 ? "compact" : "standard" }).format(value);
}

function savedDraftIdKey(drafts: SavedEpisodeDraft[]) {
  return drafts.map((draft) => draft.id).join("|");
}

function summarizeDraftAssets(draftId: string, mediaAssets: MediaAssetRecord[]) {
  const draftAssets = mediaAssets.filter((asset) => asset.episodeDraftId === draftId);
  return {
    total: draftAssets.length,
    approved: draftAssets.filter((asset) => asset.reviewStatus === "Approved").length,
  };
}

function buildBlobPath(draft: EpisodeDraft, filename: string) {
  return `uploads/${draft.characterId}/${draft.templateId}/${sanitizeFilename(filename)}`;
}

function sanitizeFilename(filename: string) {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildMediaAssetRecord(blob: PutBlobResult, draft: EpisodeDraft, file: File): MediaAssetRecord {
  return {
    id: blob.url,
    storage: "vercel_blob",
    access: "public",
    url: blob.url,
    downloadUrl: blob.downloadUrl,
    pathname: blob.pathname,
    contentType: blob.contentType,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    characterId: draft.characterId,
    characterVersion: draft.characterVersion,
    templateId: draft.templateId,
    episodeDraftId: draft.id,
    originalFilename: file.name,
    status: "linked",
    reviewStatus: "Needs review",
  };
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
