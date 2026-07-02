import { MaterialStatus, QuestionType, Skill } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { generateMaterialCode, generatePackageCode, generateQuizCode, slugifyCode } from "@/lib/ids";
import { prisma } from "@/lib/prisma";
import { stripHtml } from "@/lib/materials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readIndexed(formData: FormData, prefix: string, max = 50) {
  return Array.from({ length: max }, (_, index) => String(formData.get(`${prefix}_${index + 1}`) ?? "").trim()).filter(Boolean);
}

function safeSkill(value: string): Skill {
  if (value === "LISTENING") return Skill.LISTENING;
  if (value === "GRAMMAR") return Skill.GRAMMAR;
  return Skill.READING;
}

function safeQuestionType(value: string): QuestionType {
  if (value && value in QuestionType) return value as QuestionType;
  return QuestionType.READ_ALOUD;
}

function safeStatus(value: string): MaterialStatus {
  if (value === "DRAFT") return MaterialStatus.DRAFT;
  if (value === "ARCHIVED") return MaterialStatus.ARCHIVED;
  return MaterialStatus.PUBLISHED;
}

async function resolvePackage(formData: FormData, userId: string) {
  const packageId = String(formData.get("packageId") ?? "").trim();
  if (packageId) {
    const row = await prisma.learningPackage.findUnique({ where: { id: packageId }, select: { id: true } });
    if (row) return row.id;
  }

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
    return {
      orderNo: index + 1,
      type: safeQuestionType(String(formData.get(`speaking_type_${index + 1}`) ?? "READ_ALOUD")),
      questionText: `Read aloud: ${targetText}`,
      targetText,
      correctAnswer: targetText,
      pronunciationMode: "SENTENCE",
      minPronunciationScore: Number(formData.get(`speaking_min_score_${index + 1}`) ?? 70),
      maxAttempts: Number(formData.get(`speaking_max_attempt_${index + 1}`) ?? 3),
      score: 10
    };
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));

  return { objectives, subMaterials, speakingQuestions };
}

export async function POST(request: Request) {
  const user = await requireRole(["TEACHER", "SUPER_ADMIN"]);
  const formData = await request.formData();
  const skill = safeSkill(String(formData.get("skill") ?? "READING"));
  const level = String(formData.get("level") ?? "Beginner");
  const contentHtml = String(formData.get("contentHtml") ?? "");
  const title = String(formData.get("title") ?? "Untitled").trim();
  const packageId = await resolvePackage(formData, user.id);
  const materialCode = String(formData.get("materialCode") ?? "").trim() || generateMaterialCode(skill, level);
  const { objectives, subMaterials, speakingQuestions } = buildNestedData(formData);

  const material = await prisma.material.create({
    data: {
      materialCode,
      title,
      skill,
      level,
      theme: String(formData.get("theme") ?? "General"),
      description: String(formData.get("description") ?? ""),
      instruction: String(formData.get("instruction") ?? ""),
      contentHtml,
      contentText: stripHtml(contentHtml),
      imageUrl: String(formData.get("imageUrl") ?? "") || null,
      audioUrl: String(formData.get("audioUrl") ?? "") || null,
      status: safeStatus(String(formData.get("status") ?? "PUBLISHED")),
      packageId,
      createdById: user.id,
      objectives: objectives.length ? { create: objectives } : undefined,
      subMaterials: subMaterials.length ? { create: subMaterials } : undefined,
      quizzes: speakingQuestions.length ? {
        create: {
          quizCode: generateQuizCode(skill),
          title: `${title} - Speaking Practice`,
          instruction: "Kerjakan latihan speaking berikut.",
          passScore: 70,
          questions: { create: speakingQuestions }
        }
      } : undefined
    }
  });

  return NextResponse.json({ ok: true, id: material.id, redirectTo: "/dashboard/teacher/materials?created=1" });
}
