import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";

export type GroupNodeType = Node<{ fileCount: number }>;

export function GroupNode({ id, data }: NodeProps<GroupNodeType>) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-md border border-dashed border-node-border bg-node px-3 py-2 font-mono">
      <Handle
        type="target"
        position={Position.Left}
        className="h-1.5! w-1.5! border-none! bg-node-border!"
      />
      <span className="truncate text-sm font-semibold text-text-primary">
        {id}
      </span>
      <span className="text-xs text-text-secondary">
        {data.fileCount} files · click to expand
      </span>
      <Handle
        type="source"
        position={Position.Right}
        className="h-1.5! w-1.5! border-none! bg-node-border!"
      />
    </div>
  );
}
