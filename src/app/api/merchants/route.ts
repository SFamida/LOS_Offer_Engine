import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const records = await prisma.merchant.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(
      records.map((r) => ({ ...r, creditUnionIds: JSON.parse(r.creditUnionIds) }))
    );
  } catch (err) {
    console.error("GET /api/merchants error:", err);
    return NextResponse.json({ error: "Failed to fetch merchants" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const record = await prisma.merchant.create({
      data: {
        name: body.name,
        customConfigId: body.customConfigId,
        creditUnionIds: JSON.stringify(body.creditUnionIds ?? []),
        status: body.status ?? "Active",
      },
    });
    return NextResponse.json(
      { ...record, creditUnionIds: JSON.parse(record.creditUnionIds) },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/merchants error:", err);
    return NextResponse.json({ error: "Failed to create merchant" }, { status: 500 });
  }
}
