import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const records = await prisma.offer.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(records);
}

export async function POST(request: Request) {
  const body = await request.json();
  const record = await prisma.offer.create({
    data: {
      name: body.name,
      description: body.description,
      isPromo: body.isPromo ?? false,
      status: body.status ?? "Active",
    },
  });
  return NextResponse.json(record, { status: 201 });
}
