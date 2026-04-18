import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const record = await prisma.merchant.update({
      where: { id: params.id },
      data: {
        name: body.name,
        customConfigId: body.customConfigId,
        creditUnionIds: JSON.stringify(body.creditUnionIds ?? []),
        status: body.status,
      },
    });
    return NextResponse.json({ ...record, creditUnionIds: JSON.parse(record.creditUnionIds) });
  } catch (err) {
    console.error("PUT /api/merchants error:", err);
    return NextResponse.json({ error: "Failed to update merchant" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.merchant.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("DELETE /api/merchants error:", err);
    return NextResponse.json({ error: "Failed to delete merchant" }, { status: 500 });
  }
}
