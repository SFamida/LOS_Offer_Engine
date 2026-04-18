import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const records = await prisma.customConfig.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(
    records.map((r) => ({
      ...r,
      vantageConfig: JSON.parse(r.vantageConfig),
      brackets: JSON.parse(r.brackets),
      selectedOfferIds: JSON.parse(r.selectedOfferIds),
      promoOfferMonths: r.promoOfferMonths ? JSON.parse(r.promoOfferMonths) : {},
    }))
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const record = await prisma.customConfig.create({
      data: {
        name: body.name ?? null,
        vantageConfig: JSON.stringify(body.vantageConfig ?? {}),
        brackets: JSON.stringify(body.brackets ?? []),
        selectedOfferIds: JSON.stringify(body.selectedOfferIds ?? []),
        promoOfferMonths: JSON.stringify(body.promoOfferMonths ?? {}),
        status: body.status ?? "Active",
      },
    });
    return NextResponse.json(
      {
        ...record,
        vantageConfig: JSON.parse(record.vantageConfig),
        brackets: JSON.parse(record.brackets),
        selectedOfferIds: JSON.parse(record.selectedOfferIds),
        promoOfferMonths: record.promoOfferMonths ? JSON.parse(record.promoOfferMonths) : {},
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/custom-configs error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
