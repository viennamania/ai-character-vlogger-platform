import { NextResponse } from "next/server";
import { getDb, isAtlasConfigured } from "@/lib/mongodb";
import type { SavedEpisodeDraft } from "@/lib/persistence";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAtlasConfigured()) {
    return NextResponse.json({ persisted: false, drafts: [] });
  }

  const db = await getDb();
  const drafts = await db.collection<SavedEpisodeDraft>("episode_drafts").find({}).sort({ savedAt: -1 }).limit(50).toArray();
  return NextResponse.json({ persisted: true, drafts });
}

export async function POST(request: Request) {
  const draft = (await request.json()) as SavedEpisodeDraft;

  if (!isAtlasConfigured()) {
    return NextResponse.json({ persisted: false, draft, message: "Atlas is not configured." }, { status: 202 });
  }

  const db = await getDb();
  await db.collection<SavedEpisodeDraft>("episode_drafts").updateOne(
    { id: draft.id },
    {
      $set: {
        ...draft,
        savedAt: draft.savedAt || new Date().toISOString(),
      },
    },
    { upsert: true },
  );

  return NextResponse.json({ persisted: true, draft });
}
