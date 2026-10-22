/** Build a recursive, cycle-safe publication plan. */
export async function buildRecursivePublicationPaths(
  rootPaths: string[],
  getReferences: (filePath: string) => Promise<string[]>
): Promise<string[]> {
  const publicationPaths = new Set<string>();
  const queue = [...rootPaths];

  while (queue.length > 0) {
    const filePath = queue.shift()!;
    if (publicationPaths.has(filePath)) continue;

    publicationPaths.add(filePath);
    for (const referencePath of await getReferences(filePath)) {
      if (!publicationPaths.has(referencePath)) queue.push(referencePath);
    }
  }

  return [...publicationPaths];
}

/**
 * Match a vault path against ignored folder names. Matching is
 * case-insensitive and treats spaces, underscores, and hyphens equivalently.
 */
export function isIgnoredVaultPath(
  filePath: string,
  ignoredFolders: string[]
): boolean {
  const ignored = new Set(ignoredFolders.map(normalizeFolderName));
  return filePath.split("/").some((part) => ignored.has(normalizeFolderName(part)));
}

function normalizeFolderName(name: string): string {
  return name.trim().toLowerCase().replace(/[\s_-]+/g, "-");
}
