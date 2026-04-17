import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const record = await prisma.customConfig.update({
    where: { id: params.id },
    data: {
      vantageConfig: JSON.stringify(body.vantageConfig ?? {}),
      brackets: JSON.stringify(body.brackets ?? []),
      selectedOfferIds: JSON.stringify(body.selectedOfferIds ?? []),
      status: body.status,
    },
  });
  return NextResponse.json({
    ...record,
    vantageConfig: JSON.parse(record.vantageConfig),
    brackets: JSON.parse(record.brackets),
    selectedOfferIds: JSON.parse(record.selectedOfferIds),
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  await prisma.customConfig.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
