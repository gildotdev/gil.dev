/**
 * Build a one-hop publication plan.
 *
 * Every root is published along with the notes it references directly. Links
 * found inside those related notes do not expand the plan unless that note is
 * itself one of the roots (as it can be during a full-folder publish).
 */
export function buildDirectPublicationPaths(
  rootPaths: string[],
  referencesByRoot: Map<string, string[]>
): string[] {
  const publicationPaths = new Set(rootPaths);

  for (const rootPath of rootPaths) {
    for (const referencePath of referencesByRoot.get(rootPath) ?? []) {
      publicationPaths.add(referencePath);
    }
  }

  return [...publicationPaths];
}
