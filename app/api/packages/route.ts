import { MaterialStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { generatePackageCode, slugifyCode } from "@/lib/ids";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const packageSchema = z.object({
  name: z.string().trim().min(2, "Nama paket minimal 2 karakter."),
  packageCode: z.string().trim().optional(),
  description: z.string().trim().optional(),
  level: z.string().trim().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("PUBLISHED")
});

function normalizeCode(name: string, raw?: string) {
  return raw ? slugifyCode(raw, "PKG") : generatePackageCode(name);
}

export async function POST(request: Request) {
  const user = await requireRole(["TEACHER", "SUPER_ADMIN"]);
  const json = await request.json().catch(() => null);
  const parsed = packageSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message || "Data paket tidak valid." }, { status: 400 });
  }

  const packageCode = normalizeCode(parsed.data.name, parsed.data.packageCode);
  const existing = await prisma.learningPackage.findUnique({ where: { packageCode }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ ok: false, message: "Kode paket sudah dipakai. Gunakan nama/kode paket lain." }, { status: 409 });
  }

  const row = await prisma.learningPackage.create({
    data: {
      packageCode,
      name: parsed.data.name,
      description: parsed.data.description || null,
      level: parsed.data.level || null,
      status: parsed.data.status as MaterialStatus,
      createdById: user.id
    }
  });

  return NextResponse.json({ ok: true, package: row });
}
