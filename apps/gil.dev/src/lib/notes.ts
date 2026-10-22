export type NoteStatus = "seed" | "growing" | "evergreen" | "reference";

interface NoteVisibilityData {
  draft?: boolean;
  status?: NoteStatus;
  tags?: readonly string[];
}

export const noteStatusEmoji: Record<NoteStatus, string> = {
  seed: "🌱",
  growing: "🌿",
  evergreen: "🌳",
  reference: "📎",
};

export const noteStatusLabel: Record<NoteStatus, string> = {
  seed: "Seed — early idea, lightly developed",
  growing: "Growing — being actively developed",
  evergreen: "Evergreen — mature and stable",
  reference: "Reference — supporting material for another note",
};

export function isReferenceNote(data: NoteVisibilityData): boolean {
  return (
    data.status === "reference" ||
    (data.tags ?? []).some((tag) => tag.toLowerCase() === "clippings")
  );
}

export function isPublishedNote(data: NoteVisibilityData): boolean {
  return data.draft !== true;
}

export function isDiscoverableNote(data: NoteVisibilityData): boolean {
  return isPublishedNote(data) && !isReferenceNote(data);
}
