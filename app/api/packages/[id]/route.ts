import { MaterialStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { slugifyCode } from "@/lib/ids";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().trim().min(2).optional(),
  packageCode: z.string().trim().optional(),
  description: z.string().trim().optional(),
  level: z.string().trim().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional()
});

async function canEditPackage(id: string, user: { id: string; role: string }) {
  const row = await prisma.learningPackage.findUnique({ where: { id }, select: { id: true, createdById: true } });
  if (!row) return null;
  if (user.role !== "SUPER_ADMIN" && row.createdById !== user.id) return false;
  return row;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["TEACHER", "SUPER_ADMIN"]);
  const { id } = await params;
  const permission = await canEditPackage(id, user);
  if (permission === null) return NextResponse.json({ ok: false, message: "Paket tidak ditemukan." }, { status: 404 });
  if (permission === false) return NextResponse.json({ ok: false, message: "Anda tidak berhak mengubah paket ini." }, { status: 403 });

  const json = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false, message: "Data paket tidak valid." }, { status: 400 });

  const nextCode = parsed.data.packageCode ? slugifyCode(parsed.data.packageCode, "PKG") : undefined;
  if (nextCode) {
    const duplicate = await prisma.learningPackage.findFirst({ where: { packageCode: nextCode, NOT: { id } }, select: { id: true } });
    if (duplicate) return NextResponse.json({ ok: false, message: "Kode paket sudah dipakai." }, { status: 409 });
  }

  const row = await prisma.learningPackage.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(nextCode !== undefined ? { packageCode: nextCode } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description || null } : {}),
      ...(parsed.data.level !== undefined ? { level: parsed.data.level || null } : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status as MaterialStatus } : {})
    }
  });

  return NextResponse.json({ ok: true, package: row });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["TEACHER", "SUPER_ADMIN"]);
  const { id } = await params;
  const permission = await canEditPackage(id, user);
  if (permission === null) return NextResponse.json({ ok: false, message: "Paket tidak ditemukan." }, { status: 404 });
  if (permission === false) return NextResponse.json({ ok: false, message: "Anda tidak berhak menghapus paket ini." }, { status: 403 });

  await prisma.material.updateMany({ where: { packageId: id }, data: { packageId: null } });
  await prisma.learningPackage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
