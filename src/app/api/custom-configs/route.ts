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
    }))
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const record = await prisma.customConfig.create({
    data: {
      vantageConfig: JSON.stringify(body.vantageConfig ?? {}),
      brackets: JSON.stringify(body.brackets ?? []),
      selectedOfferIds: JSON.stringify(body.selectedOfferIds ?? []),
      status: body.status ?? "Active",
    },
  });
  return NextResponse.json(
    {
      ...record,
      vantageConfig: JSON.parse(record.vantageConfig),
      brackets: JSON.parse(record.brackets),
      selectedOfferIds: JSON.parse(record.selectedOfferIds),
    },
    { status: 201 }
  );
}
