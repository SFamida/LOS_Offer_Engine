import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const record = await prisma.creditUnion.update({
    where: { id: params.id },
    data: {
      name: body.name,
      minLoanAmount: body.minLoanAmount,
      maxLoanAmount: body.maxLoanAmount,
      vantageMin: body.vantageMin,
      vantageMax: body.vantageMax,
      minTerm: body.minTerm,
      maxTerm: body.maxTerm,
      status: body.status,
    },
  });
  return NextResponse.json(record);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  await prisma.creditUnion.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
