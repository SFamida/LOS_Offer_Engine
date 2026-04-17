import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const records = await prisma.creditUnion.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(records);
}

export async function POST(request: Request) {
  const body = await request.json();
  const record = await prisma.creditUnion.create({
    data: {
      name: body.name,
      minLoanAmount: body.minLoanAmount,
      maxLoanAmount: body.maxLoanAmount,
      vantageMin: body.vantageMin,
      vantageMax: body.vantageMax,
      minTerm: body.minTerm,
      maxTerm: body.maxTerm,
      status: body.status ?? "Active",
    },
  });
  return NextResponse.json(record, { status: 201 });
}
