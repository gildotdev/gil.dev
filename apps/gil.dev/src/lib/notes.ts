export type NoteStatus = "seed" | "growing" | "evergreen" | "reference";

interface NoteVisibilityData {
  draft?: boolean;
  status?: NoteStatus;
  tags?: readonly string[];
}

export interface GardenNoteLike {
  id: string;
  body?: string;
  data: NoteVisibilityData & {
    title: string;
    slug?: string;
    description?: string;
    topics?: readonly string[];
  };
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

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed: string): () => number {
  let state = hashSeed(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const shuffled = [...items];
  const random = createSeededRandom(seed);

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }

  return shuffled;
}

export function getDailyGardenSeed(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function selectGardenNotes<T extends GardenNoteLike>(
  notes: readonly T[],
  count: number,
  seed: string,
): T[] {
  const candidates = seededShuffle(
    [...notes].sort((a, b) => a.id.localeCompare(b.id)),
    seed,
  );
  const selected: T[] = [];
  const seenStatuses = new Set<string>();
  const seenTopics = new Set<string>();

  while (selected.length < count && candidates.length > 0) {
    let bestIndex = 0;
    let bestScore = -1;

    candidates.forEach((note, index) => {
      const status = note.data.status ?? "unstaged";
      const newTopics = (note.data.topics ?? []).filter(
        (topic) => !seenTopics.has(topic),
      ).length;
      const score = (seenStatuses.has(status) ? 0 : 3) + newTopics * 2;
      if (score > bestScore) {
        bestIndex = index;
        bestScore = score;
      }
    });

    const [note] = candidates.splice(bestIndex, 1);
    selected.push(note);
    seenStatuses.add(note.data.status ?? "unstaged");
    for (const topic of note.data.topics ?? []) seenTopics.add(topic);
  }

  return selected;
}

export function selectRelatedNotes<T extends GardenNoteLike>(
  notes: readonly T[],
  current: T,
  count: number,
  seed: string,
): T[] {
  const currentTopics = new Set(current.data.topics ?? []);
  const currentTags = new Set(current.data.tags ?? []);

  return seededShuffle(
    notes.filter((note) => note.id !== current.id),
    seed,
  )
    .map((note) => ({
      note,
      score:
        (note.data.topics ?? []).filter((topic) => currentTopics.has(topic))
          .length * 3 +
        (note.data.tags ?? []).filter((tag) => currentTags.has(tag)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(({ note }) => note);
}

export function getNoteSummary(
  description?: string,
  body = "",
  maxLength = 150,
): string {
  const source = description || body;
  const summary = source
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[#*_`>~|]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (summary.length <= maxLength) return summary;
  return `${summary.slice(0, maxLength).replace(/\s+\S*$/, "")}…`;
}
