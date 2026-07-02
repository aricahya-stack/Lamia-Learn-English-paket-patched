import { MaterialStatus, QuestionType, Skill } from "@prisma/client";
import { NextResponse } from "next/server";
import { parseImportWorkbook } from "@/lib/import-parser";
import { requireRole } from "@/lib/auth";
import { generateMaterialCode, generatePackageCode, generateQuizCode, slugifyCode } from "@/lib/ids";
import { prisma } from "@/lib/prisma";
import { stripHtml } from "@/lib/materials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

function text(row: Row, key: string, fallback = "") {
  return String(row[key] ?? fallback).trim();
}
function num(row: Row, key: string, fallback: number) {
  const value = Number(row[key]);
  return Number.isFinite(value) ? value : fallback;
}
function bool(row: Row, key: string, fallback = true) {
  const value = row[key];
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "").toLowerCase();
  if (["false", "0", "no", "tidak"].includes(normalized)) return false;
  if (["true", "1", "yes", "ya"].includes(normalized)) return true;
  return fallback;
}
function skill(value: string): Skill {
  if (value === "LISTENING") return Skill.LISTENING;
  if (value === "GRAMMAR") return Skill.GRAMMAR;
  return Skill.READING;
}
function status(value: string): MaterialStatus {
  if (value === "PUBLISHED") return MaterialStatus.PUBLISHED;
  if (value === "ARCHIVED") return MaterialStatus.ARCHIVED;
  return MaterialStatus.DRAFT;
}
function questionType(value: string): QuestionType {
  return value in QuestionType ? (value as QuestionType) : QuestionType.MULTIPLE_CHOICE;
}
function normalizedPackageCode(packageName: string) {
  return generatePackageCode(packageName);
}

async function saveParsedImport(parsed: ReturnType<typeof parseImportWorkbook>, createdById: string) {
  const data = parsed.data as {
    materials: Row[];
    subMaterials: Row[];
    objectives: Row[];
    questions: Row[];
    options: Row[];
    matchingPairs: Row[];
  };

  let savedMaterials = 0;
  let overwrittenMaterials = 0;
  let savedQuestions = 0;

  for (const materialRow of data.materials) {
    const tempId = text(materialRow, "temp_material_id");
    const packageName = text(materialRow, "package", "Paket Umum");
    const materialSkill = skill(text(materialRow, "skill", "READING"));
    const level = text(materialRow, "level", "Beginner");
    const materialCode = text(materialRow, "material_code") || text(materialRow, "temp_material_id") || generateMaterialCode(materialSkill, level);
    const contentHtml = text(materialRow, "content_html");
    const contentText = text(materialRow, "content_text") || stripHtml(contentHtml);

    const packageRow = await prisma.learningPackage.upsert({
      where: { packageCode: normalizedPackageCode(packageName) },
      update: { name: packageName, level, status: MaterialStatus.PUBLISHED },
      create: { packageCode: normalizedPackageCode(packageName), name: packageName, level, status: MaterialStatus.PUBLISHED, createdById },
      select: { id: true }
    });

    const existingMaterial = await prisma.material.findUnique({ where: { packageId_materialCode: { packageId: packageRow.id, materialCode } }, select: { id: true } });

    const objectiveCreates = data.objectives
      .filter((row) => text(row, "temp_material_id") === tempId)
      .map((row, index) => ({ orderNo: num(row, "order_no", index + 1), objective: text(row, "objective") }))
      .filter((row) => row.objective);

    const subMaterialCreates = data.subMaterials
      .filter((row) => text(row, "temp_material_id") === tempId)
      .map((row, index) => {
        const html = text(row, "content_html");
        return { orderNo: num(row, "order_no", index + 1), title: text(row, "title", `Sub Materi ${index + 1}`), contentHtml: html, contentText: text(row, "content_text") || stripHtml(html), imageUrl: text(row, "image_file_or_url") || null, audioUrl: text(row, "audio_file_or_url") || null };
      });

    const material = await prisma.material.upsert({
      where: { packageId_materialCode: { packageId: packageRow.id, materialCode } },
      update: {
        title: text(materialRow, "title", "Untitled"),
        skill: materialSkill,
        level,
        theme: text(materialRow, "theme", "General"),
        description: text(materialRow, "description"),
        instruction: text(materialRow, "instruction"),
        contentText,
        contentHtml: contentHtml || `<p>${contentText}</p>`,
        imageUrl: text(materialRow, "image_file_or_url") || null,
        audioUrl: text(materialRow, "audio_file_or_url") || null,
        defaultVoiceType: text(materialRow, "default_voice_type", "female"),
        defaultLanguage: text(materialRow, "default_language", "en-US"),
        defaultSpeechRate: num(materialRow, "default_speech_rate", 0.85),
        status: status(text(materialRow, "status", "DRAFT")),
        createdById,
        objectives: { deleteMany: {}, ...(objectiveCreates.length ? { create: objectiveCreates } : {}) },
        subMaterials: { deleteMany: {}, ...(subMaterialCreates.length ? { create: subMaterialCreates } : {}) },
        quizzes: { deleteMany: {} }
      },
      create: {
        packageId: packageRow.id,
        materialCode,
        title: text(materialRow, "title", "Untitled"),
        skill: materialSkill,
        level,
        theme: text(materialRow, "theme", "General"),
        description: text(materialRow, "description"),
        instruction: text(materialRow, "instruction"),
        contentText,
        contentHtml: contentHtml || `<p>${contentText}</p>`,
        imageUrl: text(materialRow, "image_file_or_url") || null,
        audioUrl: text(materialRow, "audio_file_or_url") || null,
        defaultVoiceType: text(materialRow, "default_voice_type", "female"),
        defaultLanguage: text(materialRow, "default_language", "en-US"),
        defaultSpeechRate: num(materialRow, "default_speech_rate", 0.85),
        status: status(text(materialRow, "status", "DRAFT")),
        createdById,
        objectives: objectiveCreates.length ? { create: objectiveCreates } : undefined,
        subMaterials: subMaterialCreates.length ? { create: subMaterialCreates } : undefined
      }
    });
    savedMaterials += 1;
    if (existingMaterial) overwrittenMaterials += 1;

    const materialQuestions = data.questions.filter((row) => text(row, "temp_material_id") === tempId);
    const quizTitles = Array.from(new Set(materialQuestions.map((row) => text(row, "quiz_title", `${material.title} Quiz`))));

    for (const quizTitle of quizTitles) {
      const quiz = await prisma.quiz.create({ data: { quizCode: generateQuizCode(materialSkill), materialId: material.id, title: quizTitle, instruction: "Kerjakan soal dengan teliti.", passScore: 70 } });
      const quizQuestions = materialQuestions.filter((row) => text(row, "quiz_title", `${material.title} Quiz`) === quizTitle);
      for (const questionRow of quizQuestions) {
        const questionNo = num(questionRow, "question_no", savedQuestions + 1);
        const question = await prisma.question.create({
          data: {
            quizId: quiz.id,
            orderNo: questionNo,
            type: questionType(text(questionRow, "question_type")),
            questionText: text(questionRow, "question_text"),
            questionHtml: text(questionRow, "question_html"),
            questionImageUrl: text(questionRow, "question_image_file_or_url") || null,
            questionAudioUrl: text(questionRow, "question_audio_file_or_url") || null,
            correctAnswer: text(questionRow, "correct_answer"),
            targetText: text(questionRow, "target_text"),
            pronunciationMode: text(questionRow, "pronunciation_mode") || "SENTENCE",
            minPronunciationScore: num(questionRow, "min_score", 70),
            allowRetry: bool(questionRow, "allow_retry", true),
            maxAttempts: num(questionRow, "max_attempts", 3),
            sampleAudioUrl: text(questionRow, "sample_text"),
            useBrowserTts: bool(questionRow, "use_browser_tts", true),
            score: num(questionRow, "score", 10),
            explanation: text(questionRow, "explanation")
          }
        });
        savedQuestions += 1;

        const relatedOptions = data.options.filter((row) => text(row, "temp_material_id") === tempId && num(row, "question_no", 0) === questionNo);
        for (const optionRow of relatedOptions) {
          await prisma.questionOption.create({ data: { questionId: question.id, optionLabel: text(optionRow, "option_label", "A"), optionText: text(optionRow, "option_text"), optionImageUrl: text(optionRow, "option_image_file_or_url") || null, optionAudioUrl: text(optionRow, "option_audio_file_or_url") || null, isCorrect: bool(optionRow, "is_correct", false) } });
        }

        const relatedPairs = data.matchingPairs.filter((row) => text(row, "temp_material_id") === tempId && num(row, "question_no", 0) === questionNo);
        for (const pairRow of relatedPairs) {
          await prisma.matchingPair.create({ data: { questionId: question.id, leftItem: text(pairRow, "left_item"), rightItem: text(pairRow, "right_item"), leftMediaUrl: text(pairRow, "left_media_file_or_url") || null, rightMediaUrl: text(pairRow, "right_media_file_or_url") || null } });
        }
      }
    }
  }

  return { savedMaterials, overwrittenMaterials, savedQuestions };
}

export async function POST(request: Request) {
  const user = await requireRole(["TEACHER", "SUPER_ADMIN"]);
  const formData = await request.formData();
  const file = formData.get("file");
  const save = formData.get("save") === "true";

  if (!(file instanceof File)) {
    return NextResponse.json({ valid: false, summary: {}, issues: [{ sheet: "Upload", row: 0, level: "ERROR", message: "File Excel belum dipilih." }] }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parseImportWorkbook(buffer);

  if (save && parsed.valid) {
    const result = await saveParsedImport(parsed, user.id);
    return NextResponse.json({ ...parsed, saved: true, ...result, message: `${result.savedMaterials} materi berhasil disimpan. ${result.overwrittenMaterials} materi ditimpakan. ${result.savedQuestions} soal tersimpan.` });
  }

  return NextResponse.json({ ...parsed, saved: false });
}
