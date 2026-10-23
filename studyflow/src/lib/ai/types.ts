import type { Grade, SourceRef, TutorMode } from "@/lib/types";

export type TutorAction = "simple" | "example" | "steps" | "compare" | "other";

export interface Material {
  title: string;
  text: string;
  /** Hangi kaydın içeriği (atıf için) */
  recordId?: string;
  type?: "note" | "upload";
}

export interface TutorRequest {
  messages: { role: "user" | "assistant"; content: string }[];
  /** Kaynak getirmede kullanılacak asıl soru/konu ifadesi (eylem düğmelerinde ilk sorudur) */
  query: string;
  mode: TutorMode;
  action: TutorAction | null;
  grade: Grade;
  subjectId: string | null;
  topicId: string | null;
  bookIds: number[];
  materials: Material[];
}

export type Grounding = "textbook" | "user-material" | "mixed" | "general";

export type TutorEvent =
  | { t: "status"; x: string }
  | { t: "meta"; grounding: Grounding; note: string | null; labels: Record<string, SourceRef>; topicId: string | null }
  | { t: "delta"; x: string }
  | { t: "done"; truncated: boolean }
  | { t: "error"; code: string; message: string };
