import { NextResponse } from "next/server";
import { getDb, isAtlasConfigured } from "@/lib/mongodb";
import type { ExportPackageRecord } from "@/lib/persistence";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAtlasConfigured()) {
    return NextResponse.json({ persisted: false, packages: [] });
  }

  const db = await getDb();
  const packages = await db.collection<ExportPackageRecord>("export_packages").find({}).sort({ createdAt: -1 }).limit(50).toArray();
  return NextResponse.json({ persisted: true, packages });
}

export async function POST(request: Request) {
  const exportPackage = (await request.json()) as ExportPackageRecord;

  if (!isAtlasConfigured()) {
    return NextResponse.json({ persisted: false, package: exportPackage, message: "Atlas is not configured." }, { status: 202 });
  }

  const db = await getDb();
  await db.collection<ExportPackageRecord>("export_packages").updateOne(
    { id: exportPackage.id },
    {
      $set: {
        ...exportPackage,
        createdAt: exportPackage.createdAt || new Date().toISOString(),
      },
    },
    { upsert: true },
  );

  return NextResponse.json({ persisted: true, package: exportPackage });
}
