import { NextResponse } from "next/server";
import { getDb, isAtlasConfigured } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAtlasConfigured()) {
    return NextResponse.json({
      configured: false,
      connected: false,
      message: "MONGODB_URI is not configured. The app will use browser local storage fallback.",
    });
  }

  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    return NextResponse.json({
      configured: true,
      connected: true,
      database: db.databaseName,
    });
  } catch (error) {
    return NextResponse.json(
      {
        configured: true,
        connected: false,
        message: error instanceof Error ? error.message : "Atlas connection failed.",
      },
      { status: 503 },
    );
  }
}
