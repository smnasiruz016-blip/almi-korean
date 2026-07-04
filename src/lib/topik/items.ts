// AlmiKorean — item-bank types + Zod schema. Shared by the builder and validate-seed (Phase 2).
// Buckets = {track × section}. Listening/Reading are objective (questions); Writing (TOPIK II)
// is constructed-response (Tasks 51–54) with an official character band on 53/54. Hangul throughout,
// NO romanization in items, NO furigana rule (Korean is one script — specs §7).
import { z } from "zod";

export const TOPIK_TRACKS = ["TOPIK_I", "TOPIK_II"] as const;
export const TOPIK_SKILLS = ["LISTENING", "READING", "WRITING"] as const;
export const TOPIK_TASK_TYPES = ["MCQ", "MATCHING", "ORDERING", "CLOZE", "WRITING"] as const;
export const TOPIK_DIFFICULTIES = ["FOUNDATION", "CORE", "STRETCH"] as const;

// Character bands for the essay-style Writing tasks (specs §6). 51/52 are short completion (no band).
export const WRITING_CHAR_BANDS: Record<number, { min: number; max: number }> = {
  53: { min: 200, max: 300 },
  54: { min: 600, max: 700 },
};

const optionSchema = z.object({ id: z.string().min(1), text: z.string().min(1) });

const questionSchema = z.object({
  id: z.string().min(1),
  stem: z.string().min(1),
  options: z.array(optionSchema).min(2),
  answer: z.string().min(1), // must equal one option id — enforced in refine below
});

const passageSchema = z.object({ id: z.string().min(1), body: z.string().min(1) });
const speakerSchema = z.object({ role: z.string().min(1), voice: z.string().min(1) });

const writingSchema = z.object({
  taskNumber: z.number().int().min(51).max(54), // TOPIK II Writing Tasks 51–54
  prompt: z.string().min(1),
  charMin: z.number().int().positive().optional(),
  charMax: z.number().int().positive().optional(),
  guidance: z.string().optional(),
});

// payload shape is section-dependent; validated structurally then cross-checked in refine.
const payloadSchema = z.object({
  passages: z.array(passageSchema).optional(), //  READING
  audioScript: z.string().optional(), //           LISTENING
  speakers: z.array(speakerSchema).optional(), //  LISTENING
  questions: z.array(questionSchema).optional(), // LISTENING / READING
  writing: writingSchema.optional(), //            WRITING
});

export const itemSchema = z
  .object({
    track: z.enum(TOPIK_TRACKS),
    section: z.enum(TOPIK_SKILLS),
    taskType: z.enum(TOPIK_TASK_TYPES),
    difficulty: z.enum(TOPIK_DIFFICULTIES),
    title: z.string().min(3),
    prompt: z.string().optional(),
    topicTag: z.string().optional(),
    guidanceNote: z.string().optional(),
    payload: payloadSchema,
  })
  .superRefine((item, ctx) => {
    const issue = (message: string, path: (string | number)[]) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, message, path });

    // Writing exists only in TOPIK II.
    if (item.section === "WRITING" && item.track !== "TOPIK_II") {
      issue("WRITING items belong to TOPIK_II only", ["track"]);
    }

    if (item.section === "LISTENING" || item.section === "READING") {
      // Objective sections must carry valid questions.
      if (!item.payload.questions || item.payload.questions.length === 0) {
        issue(`${item.section} item needs payload.questions`, ["payload", "questions"]);
      }
      item.payload.questions?.forEach((q, i) => {
        if (!q.options.some((o) => o.id === q.answer)) {
          issue(`question ${q.id} answer "${q.answer}" is not one of its option ids`, ["payload", "questions", i, "answer"]);
        }
        const ids = q.options.map((o) => o.id);
        if (new Set(ids).size !== ids.length) issue(`question ${q.id} has duplicate option ids`, ["payload", "questions", i]);
      });
      if (item.section === "READING" && !(item.payload.passages && item.payload.passages.length)) {
        issue("READING item needs payload.passages", ["payload", "passages"]);
      }
      if (item.section === "LISTENING" && !item.payload.audioScript) {
        issue("LISTENING item needs payload.audioScript", ["payload", "audioScript"]);
      }
    }

    if (item.section === "WRITING") {
      const w = item.payload.writing;
      if (!w) {
        issue("WRITING item needs payload.writing", ["payload", "writing"]);
      } else {
        // Tasks 53/54 must declare the official character band and match it exactly.
        const band = WRITING_CHAR_BANDS[w.taskNumber];
        if (band && (w.charMin !== band.min || w.charMax !== band.max)) {
          issue(`Task ${w.taskNumber} character band must be ${band.min}–${band.max}`, ["payload", "writing"]);
        }
      }
    }
  });

export type TopikItem = z.infer<typeof itemSchema>;
