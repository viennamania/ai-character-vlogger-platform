import { NextResponse } from "next/server";
import { getDb, isAtlasConfigured } from "@/lib/mongodb";
import type { MediaAssetRecord } from "@/lib/persistence";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAtlasConfigured()) {
    return NextResponse.json({ persisted: false, assets: [] });
  }

  const db = await getDb();
  const assets = await db.collection<MediaAssetRecord>("media_assets").find({}).sort({ uploadedAt: -1 }).limit(50).toArray();
  return NextResponse.json({ persisted: true, assets });
}

export async function POST(request: Request) {
  const asset = (await request.json()) as MediaAssetRecord;

  if (!isAtlasConfigured()) {
    return NextResponse.json({ persisted: false, asset, message: "Atlas is not configured." }, { status: 202 });
  }

  const db = await getDb();
  await db.collection<MediaAssetRecord>("media_assets").updateOne(
    { id: asset.id },
    {
      $set: {
        ...asset,
        uploadedAt: asset.uploadedAt || new Date().toISOString(),
      },
    },
    { upsert: true },
  );

  return NextResponse.json({ persisted: true, asset });
}
