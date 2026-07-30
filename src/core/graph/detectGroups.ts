export interface FileGroup {
  id: string;
  filePaths: string[];
}

export interface GroupingResult {
  groups: FileGroup[];
  ungroupedPaths: string[];
}
const MONOREPO_CONTAINERS = ["apps", "packages", "libs", "services"];
const MIN_SUBDIRECTORIES_TO_GROUP = 2;
const MIN_FILES_PER_GROUP = 2;

export function detectGroups(filePaths: string[]): GroupingResult {
  const containerGroups = new Map<string, Map<string, string[]>>();
  const ungroupedPaths: string[] = [];

  for (const path of filePaths) {
    const segments = path.split("/");
    const container = segments[0];

    if (MONOREPO_CONTAINERS.includes(container) && segments.length > 2) {
      const groupId = `${segments[0]}/${segments[1]}`;
      if (!containerGroups.has(container))
        containerGroups.set(container, new Map());
      const groupMap = containerGroups.get(container)!;
      if (!groupMap.has(groupId)) groupMap.set(groupId, []);
      groupMap.get(groupId)!.push(path);
    } else {
      ungroupedPaths.push(path);
    }
  }

  const groups: FileGroup[] = [];

  for (const groupMap of containerGroups.values()) {
    if (groupMap.size < MIN_SUBDIRECTORIES_TO_GROUP) {
      for (const paths of groupMap.values()) ungroupedPaths.push(...paths);
      continue;
    }
    for (const [groupId, paths] of groupMap) {
      if (paths.length < MIN_FILES_PER_GROUP) {
        ungroupedPaths.push(...paths);
        continue;
      }
      groups.push({ id: groupId, filePaths: paths });
    }
  }

  return { groups, ungroupedPaths };
}
