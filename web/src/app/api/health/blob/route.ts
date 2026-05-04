import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    provider: "vercel_blob",
  });
}
