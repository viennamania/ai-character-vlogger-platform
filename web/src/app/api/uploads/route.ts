import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getDb, isAtlasConfigured } from "@/lib/mongodb";
import type { MediaAssetRecord } from "@/lib/persistence";

export const dynamic = "force-dynamic";

const allowedContentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "audio/mpeg",
  "audio/wav",
  "application/pdf",
];

const maximumSizeInBytes = 500 * 1024 * 1024;

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = safeParsePayload(clientPayload);
        return {
          allowedContentTypes,
          maximumSizeInBytes,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            pathname,
            ...payload,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        if (!isAtlasConfigured()) return;

        const payload = safeParsePayload(tokenPayload);
        const record: MediaAssetRecord = {
          id: blob.url,
          storage: "vercel_blob",
          access: "public",
          url: blob.url,
          downloadUrl: blob.downloadUrl,
          pathname: blob.pathname,
          contentType: blob.contentType,
          size: typeof payload.size === "number" ? payload.size : 0,
          uploadedAt: new Date().toISOString(),
          characterId: payload.characterId,
          characterVersion: payload.characterVersion,
          templateId: payload.templateId,
          episodeDraftId: payload.episodeDraftId,
          originalFilename: payload.originalFilename,
          status: "uploaded",
        };

        const db = await getDb();
        await db.collection<MediaAssetRecord>("media_assets").updateOne(
          { id: record.id },
          {
            $set: record,
          },
          { upsert: true },
        );
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload token request failed.",
      },
      { status: 400 },
    );
  }
}

function safeParsePayload(value: string | null | undefined): Partial<MediaAssetRecord> {
  if (!value) return {};

  try {
    return JSON.parse(value) as Partial<MediaAssetRecord>;
  } catch {
    return {};
  }
}
