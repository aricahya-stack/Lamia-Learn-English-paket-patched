import { MaterialStatus, QuestionType, Skill, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type SkillSlug = "reading" | "listening" | "grammar";

export type QuestionView = {
  id: string;
  type: string;
  text: string;
  correctAnswer?: string;
  targetText?: string;
  sampleText?: string;
  minScore?: number;
  maxAttempts?: number;
  options?: { label: string; text: string; imageUrl?: string; audioUrl?: string }[];
  pairs?: { left: string; right: string }[];
  score: number;
};

export type MaterialCardData = {
  id: string;
  code: string;
  title: string;
  skill: SkillSlug;
  level: string;
  theme: string;
  description: string;
  status?: string;
  packageId?: string | null;
  packageName?: string | null;
  questionCount: number;
};

export type MaterialDetail = MaterialCardData & {
  instruction: string;
  contentHtml: string;
  contentText: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  objectives: string[];
  subMaterials: { title: string; contentHtml: string; contentText: string }[];
  quizId?: string;
  quizTitle?: string;
  questions: QuestionView[];
};

export type PackageCardData = {
  id: string;
  code: string;
  name: string;
  description: string;
  level?: string | null;
  status?: string;
  materialCount: number;
  questionCount: number;
  createdByName?: string;
};

export const skillMap: Record<SkillSlug, { label: string; description: string; accent: string }> = {
  reading: {
    label: "Reading",
    description: "Teks pendek, cerita bergambar, tombol baca dengan suara browser, dan kuis pemahaman.",
    accent: "Baca"
  },
  listening: {
    label: "Listening",
    description: "Audio, gambar, latihan mendengar kata/kalimat, listen and choose, dan listen and type.",
    accent: "Dengar"
  },
  grammar: {
    label: "Grammar",
    description: "Pola kalimat sederhana, fill blank, word arrangement, dan latihan tata bahasa dasar.",
    accent: "Latihan"
  }
};

export function skillToSlug(skill: Skill): SkillSlug {
  if (skill === Skill.LISTENING) return "listening";
  if (skill === Skill.GRAMMAR) return "grammar";
  return "reading";
}

export function slugToSkill(slug: SkillSlug): Skill {
  if (slug === "listening") return Skill.LISTENING;
  if (slug === "grammar") return Skill.GRAMMAR;
  return Skill.READING;
}

export function stripHtml(html = "") {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

const materialInclude = {
  package: { select: { id: true, name: true, packageCode: true } },
  quizzes: {
    select: {
      id: true,
      _count: { select: { questions: true } }
    }
  }
} satisfies Prisma.MaterialInclude;

type MaterialListRow = Prisma.MaterialGetPayload<{ include: typeof materialInclude }>;

function mapCard(row: MaterialListRow): MaterialCardData {
  const questionCount = row.quizzes.reduce((sum: number, quiz: any) => sum + quiz._count.questions, 0);
  return {
    id: row.id,
    code: row.materialCode,
    title: row.title,
    skill: skillToSlug(row.skill),
    level: row.level,
    theme: row.theme,
    description: row.description || row.instruction || stripHtml(row.contentHtml || row.contentText || ""),
    status: row.status,
    packageId: row.packageId,
    packageName: row.package?.name ?? null,
    questionCount
  };
}

export async function getMaterialCards(options: { skill?: SkillSlug; includeDraft?: boolean; createdById?: string; packageId?: string } = {}) {
  const where: Prisma.MaterialWhereInput = {
    ...(options.skill ? { skill: slugToSkill(options.skill) } : {}),
    ...(options.packageId ? { packageId: options.packageId } : {}),
    ...(options.includeDraft ? {} : { status: MaterialStatus.PUBLISHED }),
    ...(options.createdById ? { createdById: options.createdById } : {})
  };

  const rows = await prisma.material.findMany({
    where,
    include: materialInclude,
    orderBy: [{ package: { name: "asc" } }, { materialCode: "asc" }, { updatedAt: "desc" }]
  });

  return rows.map(mapCard);
}

const packageInclude = {
  createdBy: { select: { name: true } },
  materials: {
    where: { status: { not: MaterialStatus.ARCHIVED } },
    include: { quizzes: { select: { _count: { select: { questions: true } } } } }
  }
} satisfies Prisma.LearningPackageInclude;

type PackageRow = Prisma.LearningPackageGetPayload<{ include: typeof packageInclude }>;

export function mapPackage(row: PackageRow): PackageCardData {
  return {
    id: row.id,
    code: row.packageCode,
    name: row.name,
    description: row.description || "Paket belajar berisi kumpulan materi yang disusun berurutan.",
    level: row.level,
    status: row.status,
    materialCount: row.materials.length,
    questionCount: row.materials.reduce((sum: number, material: any) => sum + material.quizzes.reduce((qSum: number, quiz: any) => qSum + quiz._count.questions, 0), 0),
    createdByName: row.createdBy?.name
  };
}

export async function getPackages(options: { includeDraft?: boolean; createdById?: string } = {}) {
  const rows = await prisma.learningPackage.findMany({
    where: {
      ...(options.includeDraft ? {} : { status: MaterialStatus.PUBLISHED }),
      ...(options.createdById ? { createdById: options.createdById } : {})
    },
    include: packageInclude,
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }]
  });
  return rows.map(mapPackage);
}

export async function getPackageWithMaterials(id: string, options: { includeDraft?: boolean; createdById?: string } = {}) {
  const row = await prisma.learningPackage.findFirst({
    where: {
      id,
      ...(options.includeDraft ? {} : { status: MaterialStatus.PUBLISHED }),
      ...(options.createdById ? { createdById: options.createdById } : {})
    },
    include: packageInclude
  });
  if (!row) return null;
  const materials = await getMaterialCards({ packageId: id, includeDraft: options.includeDraft, createdById: options.createdById });
  return { ...mapPackage(row), materials };
}

const detailInclude = {
  package: { select: { id: true, name: true, packageCode: true } },
  objectives: { orderBy: { orderNo: "asc" as const } },
  subMaterials: { orderBy: { orderNo: "asc" as const } },
  quizzes: {
    orderBy: { createdAt: "asc" as const },
    include: {
      questions: {
        orderBy: { orderNo: "asc" as const },
        include: {
          options: { orderBy: { optionLabel: "asc" as const } },
          matchingPairs: true
        }
      }
    }
  }
} satisfies Prisma.MaterialInclude;

type MaterialDetailRow = Prisma.MaterialGetPayload<{ include: typeof detailInclude }>;

function mapQuestion(question: MaterialDetailRow["quizzes"][number]["questions"][number]): QuestionView {
  return {
    id: question.id,
    type: question.type,
    text: question.questionText || stripHtml(question.questionHtml || "") || question.targetText || "Pertanyaan",
    correctAnswer: question.correctAnswer || undefined,
    targetText: question.targetText || undefined,
    sampleText: question.sampleAudioUrl || question.targetText || undefined,
    minScore: question.minPronunciationScore || undefined,
    maxAttempts: question.maxAttempts || undefined,
    score: question.score,
    options: question.options.map((option: any) => ({
      label: option.optionLabel,
      text: option.optionText || option.optionLabel,
      imageUrl: option.optionImageUrl || undefined,
      audioUrl: option.optionAudioUrl || undefined
    })),
    pairs: question.matchingPairs.map((pair: any) => ({ left: pair.leftItem, right: pair.rightItem }))
  };
}

export async function getMaterialDetail(id: string): Promise<MaterialDetail | null> {
  const row = await prisma.material.findUnique({ where: { id }, include: detailInclude });
  if (!row || row.status === MaterialStatus.ARCHIVED) return null;
  const firstQuiz = row.quizzes[0];
  const questions = firstQuiz?.questions.map(mapQuestion) ?? [];

  return {
    ...mapCard({ ...row, quizzes: row.quizzes.map((quiz: any) => ({ id: quiz.id, _count: { questions: quiz.questions.length } })) }),
    instruction: row.instruction || "Pelajari materi lalu kerjakan kuis.",
    contentHtml: row.contentHtml || `<p>${row.contentText || "Materi belum memiliki konten."}</p>`,
    contentText: row.contentText || stripHtml(row.contentHtml || ""),
    imageUrl: row.imageUrl,
    audioUrl: row.audioUrl,
    objectives: row.objectives.map((item: any) => item.objective),
    subMaterials: row.subMaterials.map((item: any) => ({
      title: item.title,
      contentHtml: item.contentHtml || `<p>${item.contentText || ""}</p>`,
      contentText: item.contentText || stripHtml(item.contentHtml || "")
    })),
    quizId: firstQuiz?.id,
    quizTitle: firstQuiz?.title,
    questions
  };
}

export async function getAdminStats() {
  const [users, teachers, students, packages, materials, quizzes, attempts] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.learningPackage.count({ where: { status: { not: MaterialStatus.ARCHIVED } } }),
    prisma.material.count({ where: { status: { not: MaterialStatus.ARCHIVED } } }),
    prisma.quiz.count(),
    prisma.studentAttempt.count({ where: { status: "SUBMITTED" } })
  ]);
  return { users, teachers, students, packages, materials, quizzes, attempts };
}

export async function getTeacherStats(teacherId: string) {
  const [packages, materials, published, quizzes, attempts] = await Promise.all([
    prisma.learningPackage.count({ where: { createdById: teacherId } }),
    prisma.material.count({ where: { createdById: teacherId } }),
    prisma.material.count({ where: { createdById: teacherId, status: MaterialStatus.PUBLISHED } }),
    prisma.quiz.count({ where: { material: { createdById: teacherId } } }),
    prisma.studentAttempt.count({ where: { quiz: { material: { createdById: teacherId } }, status: "SUBMITTED" } })
  ]);
  return { packages, materials, published, quizzes, attempts };
}

export async function getStudentProgress(studentId: string) {
  const attempts = await prisma.studentAttempt.findMany({
    where: { studentId, status: "SUBMITTED" },
    include: { quiz: { include: { material: { include: { package: true } } } } },
    orderBy: { submittedAt: "desc" },
    take: 30
  });

  const openedMaterials = new Set(attempts.map((attempt: any) => attempt.quiz.materialId)).size;
  const averageScore = attempts.length ? Math.round(attempts.reduce((sum: number, attempt: any) => sum + (attempt.maxScore ? (attempt.totalScore / attempt.maxScore) * 100 : 0), 0) / attempts.length) : 0;
  return { attempts, openedMaterials, averageScore };
}

export async function getReportRows(options: { teacherId?: string } = {}) {
  return prisma.studentAttempt.findMany({
    where: {
      status: "SUBMITTED",
      ...(options.teacherId ? { quiz: { material: { createdById: options.teacherId } } } : {})
    },
    include: {
      student: { select: { name: true, email: true } },
      quiz: { include: { material: { include: { package: true } } } }
    },
    orderBy: { submittedAt: "desc" },
    take: 100
  });
}

export const speakingQuestionTypes: QuestionType[] = [
  QuestionType.PRONUNCIATION_CHECK,
  QuestionType.LISTEN_AND_REPEAT,
  QuestionType.READ_ALOUD,
  QuestionType.SPEAKING_PROMPT
];
