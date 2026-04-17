import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const records = await prisma.merchant.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(
    records.map((r) => ({ ...r, offers: JSON.parse(r.offers) }))
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const record = await prisma.merchant.create({
    data: {
      name: body.name,
      minLoanAmount: body.minLoanAmount,
      maxLoanAmount: body.maxLoanAmount,
      vantageMin: body.vantageMin,
      vantageMax: body.vantageMax,
      minTerm: body.minTerm,
      maxTerm: body.maxTerm,
      offers: JSON.stringify(body.offers ?? []),
      excelFileName: body.excelFileName ?? null,
      status: body.status ?? "Active",
    },
  });
  return NextResponse.json(
    { ...record, offers: JSON.parse(record.offers) },
    { status: 201 }
  );
}
