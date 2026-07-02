import { MaterialStatus, QuestionType, Skill } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { generatePackageCode, generateQuizCode, slugifyCode } from "@/lib/ids";
import { prisma } from "@/lib/prisma";
import { stripHtml } from "@/lib/materials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeSkill(value: string): Skill {
  if (value === "LISTENING") return Skill.LISTENING;
  if (value === "GRAMMAR") return Skill.GRAMMAR;
  return Skill.READING;
}
function safeStatus(value: string): MaterialStatus {
  if (value === "DRAFT") return MaterialStatus.DRAFT;
  if (value === "ARCHIVED") return MaterialStatus.ARCHIVED;
  return MaterialStatus.PUBLISHED;
}
function safeQuestionType(value: string): QuestionType {
  if (value && value in QuestionType) return value as QuestionType;
  return QuestionType.READ_ALOUD;
}
async function canEditMaterial(id: string, user: { id: string; role: string }) {
  const row = await prisma.material.findUnique({ where: { id }, select: { id: true, createdById: true } });
  if (!row) return null;
  if (user.role !== "SUPER_ADMIN" && row.createdById !== user.id) return false;
  return row;
}
async function resolvePackage(formData: FormData, userId: string) {
  const packageId = String(formData.get("packageId") ?? "").trim();
  if (packageId) return packageId;
  const packageName = String(formData.get("package") ?? formData.get("packageName") ?? "").trim();
  if (!packageName) return null;
  const packageCode = String(formData.get("packageCode") ?? "").trim() || generatePackageCode(packageName);
  const normalizedCode = slugifyCode(packageCode, "PKG").startsWith("PKG-") ? slugifyCode(packageCode, "PKG") : `PKG-${slugifyCode(packageCode, "LAMIA")}`;
  const row = await prisma.learningPackage.upsert({
    where: { packageCode: normalizedCode },
    update: { name: packageName, status: MaterialStatus.PUBLISHED },
    create: { packageCode: normalizedCode, name: packageName, level: String(formData.get("level") ?? "Beginner"), status: MaterialStatus.PUBLISHED, createdById: userId },
    select: { id: true }
  });
  return row.id;
}
function readIndexed(formData: FormData, prefix: string, max = 50) {
  return Array.from({ length: max }, (_, index) => String(formData.get(`${prefix}_${index + 1}`) ?? "").trim()).filter(Boolean);
}
function buildNestedData(formData: FormData) {
  const objectives = readIndexed(formData, "objective").map((objective, index) => ({ orderNo: index + 1, objective }));
  const subMaterials = Array.from({ length: 50 }, (_, index) => {
    const title = String(formData.get(`sub_title_${index + 1}`) ?? "").trim();
    const contentHtml = String(formData.get(`sub_content_${index + 1}`) ?? "").trim();
    if (!title && !contentHtml) return null;
    return { orderNo: index + 1, title: title || `Sub Materi ${index + 1}`, contentHtml, contentText: stripHtml(contentHtml) };
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const speakingQuestions = Array.from({ length: 20 }, (_, index) => {
    const targetText = String(formData.get(`speaking_target_${index + 1}`) ?? "").trim();
    if (!targetText) return null;
    return { orderNo: index + 1, type: safeQuestionType(String(formData.get(`speaking_type_${index + 1}`) ?? "READ_ALOUD")), questionText: `Read aloud: ${targetText}`, targetText, correctAnswer: targetText, pronunciationMode: "SENTENCE", minPronunciationScore: Number(formData.get(`speaking_min_score_${index + 1}`) ?? 70), maxAttempts: Number(formData.get(`speaking_max_attempt_${index + 1}`) ?? 3), score: 10 };
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));
  return { objectives, subMaterials, speakingQuestions };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["TEACHER", "SUPER_ADMIN"]);
  const { id } = await params;
  const permission = await canEditMaterial(id, user);
  if (!permission) return NextResponse.json({ ok: false, message: "Materi tidak ditemukan." }, { status: 404 });
  if (permission === false) return NextResponse.json({ ok: false, message: "Anda tidak berhak mengubah materi ini." }, { status: 403 });

  const formData = await request.formData();
  const skill = safeSkill(String(formData.get("skill") ?? "READING"));
  const contentHtml = String(formData.get("contentHtml") ?? "");
  const packageId = await resolvePackage(formData, user.id);
  const { objectives, subMaterials, speakingQuestions } = buildNestedData(formData);

  await prisma.material.update({
    where: { id },
    data: {
      materialCode: String(formData.get("materialCode") ?? "").trim(),
      title: String(formData.get("title") ?? "Untitled").trim(),
      skill,
      level: String(formData.get("level") ?? "Beginner"),
      theme: String(formData.get("theme") ?? "General"),
      description: String(formData.get("description") ?? ""),
      instruction: String(formData.get("instruction") ?? ""),
      contentHtml,
      contentText: stripHtml(contentHtml),
      imageUrl: String(formData.get("imageUrl") ?? "") || null,
      audioUrl: String(formData.get("audioUrl") ?? "") || null,
      status: safeStatus(String(formData.get("status") ?? "PUBLISHED")),
      packageId
    }
  });
  await prisma.learningObjective.deleteMany({ where: { materialId: id } });
  if (objectives.length) await prisma.learningObjective.createMany({ data: objectives.map((item) => ({ ...item, materialId: id })) });
  await prisma.subMaterial.deleteMany({ where: { materialId: id } });
  if (subMaterials.length) await prisma.subMaterial.createMany({ data: subMaterials.map((item) => ({ ...item, materialId: id })) });
  if (speakingQuestions.length) {
    await prisma.quiz.deleteMany({ where: { materialId: id } });
    await prisma.quiz.create({ data: { quizCode: generateQuizCode(skill), materialId: id, title: `${String(formData.get("title") ?? "Materi")} - Speaking Practice`, instruction: "Kerjakan latihan speaking berikut.", passScore: 70, questions: { create: speakingQuestions } } });
  }

  return NextResponse.json({ ok: true, redirectTo: "/dashboard/teacher/materials?updated=1" });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["TEACHER", "SUPER_ADMIN"]);
  const { id } = await params;
  const permission = await canEditMaterial(id, user);
  if (!permission) return NextResponse.json({ ok: false, message: "Materi tidak ditemukan." }, { status: 404 });
  if (permission === false) return NextResponse.json({ ok: false, message: "Anda tidak berhak menghapus materi ini." }, { status: 403 });

  await prisma.material.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
