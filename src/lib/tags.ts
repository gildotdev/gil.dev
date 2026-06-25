export function getTagHref(tag: string) {
  return `/tags/${tag
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

export function getTagPaths(tags: string[]) {
  return [...new Set(tags.flatMap(getTagPathHierarchy))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export function tagMatchesPath(tag: string, path: string) {
  return tag === path || tag.startsWith(`${path}/`);
}

export function getTagPathHierarchy(tag: string) {
  const segments = tag.split("/").filter(Boolean);

  return segments.map((_, index) => segments.slice(0, index + 1).join("/"));
}
