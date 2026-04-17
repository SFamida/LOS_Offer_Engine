import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const record = await prisma.offer.update({
    where: { id: params.id },
    data: {
      name: body.name,
      description: body.description,
      isPromo: body.isPromo,
      status: body.status,
    },
  });
  return NextResponse.json(record);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  await prisma.offer.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
