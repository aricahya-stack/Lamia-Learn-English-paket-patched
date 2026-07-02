import { PrismaClient, Role, Skill, MaterialStatus, QuestionType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function code(prefix: string, n: number) {
  return `${prefix}-${String(n).padStart(4, "0")}`;
}

async function main() {
  const adminPass = process.env.SEED_SUPERADMIN_PASSWORD ?? "Admin12345!";
  const teacherPass = process.env.SEED_TEACHER_PASSWORD ?? "Guru12345!";
  const studentPass = process.env.SEED_STUDENT_PASSWORD ?? "Murid12345!";

  const admin = await prisma.user.upsert({
    where: { email: process.env.SEED_SUPERADMIN_EMAIL ?? "admin@lamia.local" },
    update: {},
    create: {
      name: "Super Admin",
      email: process.env.SEED_SUPERADMIN_EMAIL ?? "admin@lamia.local",
      role: Role.SUPER_ADMIN,
      passwordHash: await bcrypt.hash(adminPass, 10)
    }
  });

  const teacher = await prisma.user.upsert({
    where: { email: process.env.SEED_TEACHER_EMAIL ?? "guru@lamia.local" },
    update: {},
    create: {
      name: "Guru Lamia",
      email: process.env.SEED_TEACHER_EMAIL ?? "guru@lamia.local",
      role: Role.TEACHER,
      passwordHash: await bcrypt.hash(teacherPass, 10)
    }
  });

  const student = await prisma.user.upsert({
    where: { email: process.env.SEED_STUDENT_EMAIL ?? "murid@lamia.local" },
    update: {},
    create: {
      name: "Murid Lamia",
      email: process.env.SEED_STUDENT_EMAIL ?? "murid@lamia.local",
      role: Role.STUDENT,
      passwordHash: await bcrypt.hash(studentPass, 10)
    }
  });

  const classRoom = await prisma.classRoom.upsert({
    where: { code: "KIDS-A1" },
    update: {},
    create: { name: "Kids A1", code: "KIDS-A1", grade: "Beginner", teacherId: teacher.id }
  });

  await prisma.enrollment.upsert({
    where: { classId_studentId: { classId: classRoom.id, studentId: student.id } },
    update: {},
    create: { classId: classRoom.id, studentId: student.id }
  });

  const seedPackage = await prisma.learningPackage.upsert({
    where: { packageCode: "PKG-DEMO-KELAS-2" },
    update: {},
    create: {
      packageCode: "PKG-DEMO-KELAS-2",
      name: "Demo English Practice Kelas 2",
      description: "Paket contoh berisi materi awal untuk mencoba aplikasi.",
      level: "Kelas 2 SD",
      status: MaterialStatus.PUBLISHED,
      createdById: teacher.id
    }
  });

  const materials = [
    {
      materialCode: code("ENG-RD-BEG", 1),
      quizCode: code("QZ-RD", 1),
      title: "My Pet Cat",
      skill: Skill.READING,
      level: "Beginner",
      theme: "Animals",
      instruction: "Read the text carefully. Use the Read button to listen to each sentence.",
      contentText: "I have a cat. Its name is Mimi. Mimi is white. Mimi likes fish.",
      contentHtml: "<p>I have a cat.</p><p>Its name is <strong>Mimi</strong>.</p><p>Mimi is white.</p><p>Mimi likes fish.</p>",
      questions: [
        { type: QuestionType.MULTIPLE_CHOICE, questionText: "What animal is in the story?", correctAnswer: "Cat", options: ["Cat", "Dog", "Bird"] },
        { type: QuestionType.TRUE_FALSE, questionText: "Mimi likes fish.", correctAnswer: "true", options: ["True", "False"] },
        { type: QuestionType.SHORT_ANSWER, questionText: "What is the cat's name?", correctAnswer: "Mimi" }
      ]
    },
    {
      materialCode: code("ENG-LS-BEG", 2),
      quizCode: code("QZ-LS", 2),
      title: "Listen to Colors",
      skill: Skill.LISTENING,
      level: "Beginner",
      theme: "Colors",
      instruction: "Listen to the audio and choose the correct answer.",
      contentText: "Listen and choose the color you hear.",
      contentHtml: "<p>Listen and choose the color you hear.</p>",
      questions: [
        { type: QuestionType.LISTEN_AND_CHOOSE, questionText: "The color is red.", correctAnswer: "Red", options: ["Red", "Blue", "Green"] },
        { type: QuestionType.PICTURE_CHOICE, questionText: "Choose the yellow object.", correctAnswer: "Banana", options: ["Banana", "Apple", "Book"] }
      ]
    },
    {
      materialCode: code("ENG-GR-BEG", 3),
      quizCode: code("QZ-GR", 3),
      title: "This is / These are",
      skill: Skill.GRAMMAR,
      level: "Beginner",
      theme: "Simple Grammar",
      instruction: "Learn how to use this is and these are.",
      contentText: "Use 'This is' for one object. Use 'These are' for many objects.",
      contentHtml: "<p>Use <strong>This is</strong> for one object.</p><p>Use <strong>These are</strong> for many objects.</p>",
      questions: [
        { type: QuestionType.FILL_BLANK, questionText: "____ is a pencil.", correctAnswer: "This", options: ["This", "These", "They"] },
        { type: QuestionType.WORD_ARRANGEMENT, questionText: "Arrange the words: a / this / book / is", correctAnswer: "This is a book" }
      ]
    }
  ];

  for (const [index, item] of materials.entries()) {
    const material = await prisma.material.upsert({
      where: { packageId_materialCode: { packageId: seedPackage.id, materialCode: item.materialCode } },
      update: {},
      create: {
        packageId: seedPackage.id,
        materialCode: item.materialCode,
        title: item.title,
        skill: item.skill,
        level: item.level,
        theme: item.theme,
        instruction: item.instruction,
        contentText: item.contentText,
        contentHtml: item.contentHtml,
        status: MaterialStatus.PUBLISHED,
        createdById: teacher.id,
        objectives: {
          create: [
            { orderNo: 1, objective: "Murid memahami kosakata dan kalimat sederhana sesuai tema." },
            { orderNo: 2, objective: "Murid mampu menjawab pertanyaan berdasarkan materi." }
          ]
        },
        subMaterials: {
          create: [
            { orderNo: 1, title: "Warm Up", contentHtml: "<p>Look, listen, and repeat.</p>" },
            { orderNo: 2, title: "Practice", contentHtml: item.contentHtml }
          ]
        }
      }
    });

    const quiz = await prisma.quiz.upsert({
      where: { quizCode: item.quizCode },
      update: {},
      create: {
        quizCode: item.quizCode,
        materialId: material.id,
        title: `${item.title} Quiz`,
        instruction: "Answer the questions carefully.",
        passScore: 70
      }
    });

    for (const [qIndex, q] of item.questions.entries()) {
      const question = await prisma.question.upsert({
        where: { quizId_orderNo: { quizId: quiz.id, orderNo: qIndex + 1 } },
        update: {},
        create: {
          quizId: quiz.id,
          orderNo: qIndex + 1,
          type: q.type,
          questionText: q.questionText,
          correctAnswer: q.correctAnswer,
          score: 10
        }
      });
      if (q.options?.length) {
        for (const [oIndex, option] of q.options.entries()) {
          await prisma.questionOption.upsert({
            where: { questionId_optionLabel: { questionId: question.id, optionLabel: String.fromCharCode(65 + oIndex) } },
            update: {},
            create: {
              questionId: question.id,
              optionLabel: String.fromCharCode(65 + oIndex),
              optionText: option,
              isCorrect: option.toLowerCase() === q.correctAnswer.toLowerCase()
            }
          });
        }
      }
    }
  }

  console.log("Seed selesai", { admin: admin.email, teacher: teacher.email, student: student.email });
}

main().finally(async () => prisma.$disconnect());
