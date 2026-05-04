import { NextResponse } from "next/server";
import { getDb, isAtlasConfigured } from "@/lib/mongodb";
import type { MetricRecord } from "@/lib/persistence";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAtlasConfigured()) {
    return NextResponse.json({ persisted: false, metrics: [] });
  }

  const db = await getDb();
  const metrics = await db.collection<MetricRecord>("platform_metrics").find({}).sort({ createdAt: -1 }).limit(100).toArray();
  return NextResponse.json({ persisted: true, metrics });
}

export async function POST(request: Request) {
  const metric = (await request.json()) as MetricRecord;
  const record = {
    ...metric,
    createdAt: metric.createdAt || new Date().toISOString(),
  };

  if (!isAtlasConfigured()) {
    return NextResponse.json({ persisted: false, metric: record, message: "Atlas is not configured." }, { status: 202 });
  }

  const db = await getDb();
  await db.collection<MetricRecord>("platform_metrics").insertOne(record);

  return NextResponse.json({ persisted: true, metric: record });
}
