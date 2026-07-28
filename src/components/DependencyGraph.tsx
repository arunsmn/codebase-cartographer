"use client";

import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { LayoutResult } from "@/core/layout/computeLayout";
import { FileNode, type FileNodeType } from "./FileNode";

interface DependencyGraphProps {
  layout: LayoutResult;
}

const nodeTypes = { file: FileNode };

export function DependencyGraph({ layout }: DependencyGraphProps) {
  const nodes: FileNodeType[] = layout.nodes.map((n) => ({
    id: n.id,
    type: "file",
    position: { x: n.x, y: n.y },
    data: { path: n.id },
    style: { width: n.width, height: n.height },
  }));

  const edges: Edge[] = layout.edges.map((e) => ({
    id: `${e.from}->${e.to}`,
    source: e.from,
    target: e.to,
    style: { stroke: "var(--color-edge)", strokeWidth: 1.5 },
  }));

  return (
    <div className="h-screen w-full bg-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="#30363d"
          gap={24}
          size={1}
        />
        <Controls className="border-node-border! bg-node! [&_button]:border-node-border! [&_button]:bg-node! [&_button]:fill-text-primary!" />
      </ReactFlow>
    </div>
  );
}
