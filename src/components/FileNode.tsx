import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";

export type FileNodeType = Node<{ path: string }>;

export function FileNode({ data }: NodeProps<FileNodeType>) {
  const lastSlash = data.path.lastIndexOf("/");
  const basename =
    lastSlash === -1 ? data.path : data.path.slice(lastSlash + 1);
  const dirname = lastSlash === -1 ? "" : data.path.slice(0, lastSlash);

  return (
    <div
      className="flex h-full w-full flex-col justify-center overflow-hidden rounded-md border border-node-border bg-node px-3 py-2 font-mono"
      title={data.path}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="h-1.5! w-1.5! border-none! bg-node-border!"
      />

      <span className="truncate text-sm font-semibold text-text-primary">
        {basename}
      </span>
      {dirname && (
        <span className="truncate text-xs text-text-secondary">{dirname}</span>
      )}
      <Handle
        type="source"
        position={Position.Right}
        className="h-1.5! w-1.5! border-none! bg-node-border!"
      />
    </div>
  );
}
