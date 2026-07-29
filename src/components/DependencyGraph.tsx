"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { LayoutResult } from "@/core/layout/computeLayout";
import { FileNode, type FileNodeType } from "./FileNode";

interface DependencyGraphProps {
  layout: LayoutResult;
}

const nodeTypes = { file: FileNode };

function SearchPanel({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") onSubmit();
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Search files, press Enter…"
      className="w-56 rounded-md border border-node-border bg-node px-3 py-1.5 font-mono text-xs text-text-primary outline-none focus:border-accent"
    />
  );
}

function Flow({ layout }: DependencyGraphProps) {
  const initialNodes: FileNodeType[] = layout.nodes.map((n) => ({
    id: n.id,
    type: "file",
    position: { x: n.x, y: n.y },
    data: { path: n.id },
    style: { width: n.width, height: n.height },
  }));

  const initialEdges: Edge[] = layout.edges.map((e) => ({
    id: `${e.from}->${e.to}`,
    source: e.from,
    target: e.to,
    style: { stroke: "var(--color-edge)", strokeWidth: 1.5 },
  }));

  const [nodes, , onNodesChange] = useNodesState<FileNodeType>(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState<Edge>(initialEdges);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatchId, setSearchMatchId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const { setCenter } = useReactFlow();

  function handleSearchSubmit() {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) {
      setSearchMatchId(null);
      return;
    }

    const match = nodes.find((n) => n.id.toLowerCase().includes(trimmed));
    setSearchMatchId(match?.id ?? null);
    if (!match) return;

    setSelectedNodeId(null);
    const width =
      typeof match.style?.width === "number" ? match.style.width : 180;
    const height =
      typeof match.style?.height === "number" ? match.style.height : 56;
    setCenter(match.position.x + width / 2, match.position.y + height / 2, {
      zoom: 1,
      duration: 400,
    });
  }

  function handleNodeClick(nodeId: string) {
    setSearchQuery("");
    setSearchMatchId(null);
    setSelectedNodeId((current) => (current === nodeId ? null : nodeId));
  }

  const { connectedNodeIds, connectedEdgeIds } = useMemo(() => {
    if (!selectedNodeId)
      return {
        connectedNodeIds: new Set<string>(),
        connectedEdgeIds: new Set<string>(),
      };

    const nodeIds = new Set<string>([selectedNodeId]);
    const edgeIds = new Set<string>();
    for (const edge of edges) {
      if (edge.source === selectedNodeId || edge.target === selectedNodeId) {
        edgeIds.add(edge.id);
        nodeIds.add(edge.source);
        nodeIds.add(edge.target);
      }
    }
    return { connectedNodeIds: nodeIds, connectedEdgeIds: edgeIds };
  }, [selectedNodeId, edges]);

  const displayNodes: FileNodeType[] = nodes.map((n) => ({
    ...n,
    data: {
      path: n.data.path,
      connected: selectedNodeId ? connectedNodeIds.has(n.id) : false,
      dimmed: selectedNodeId ? !connectedNodeIds.has(n.id) : false,
      searchMatched: !selectedNodeId && searchMatchId === n.id,
    },
  }));

  const displayEdges: Edge[] = edges.map((e) => {
    if (!selectedNodeId) return e;
    const isConnected = connectedEdgeIds.has(e.id);
    return {
      ...e,
      style: {
        stroke: isConnected ? "var(--color-accent)" : "var(--color-edge)",
        strokeWidth: isConnected ? 2 : 1.5,
        opacity: isConnected ? 1 : 0.15,
      },
    };
  });

  return (
    <ReactFlow
      nodes={displayNodes}
      edges={displayEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={(_, node) => handleNodeClick(node.id)}
      onPaneClick={() => setSelectedNodeId(null)}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ minZoom: 0.5, maxZoom: 1 }}
      minZoom={0.05}
      proOptions={{ hideAttribution: true }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        color="#30363d"
        gap={24}
        size={1}
      />
      <Controls className="border-node-border! bg-node! [&_button]:border-node-border! [&_button]:bg-node! [&_button]:fill-text-primary!" />
      <Panel position="top-left">
        <SearchPanel
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={handleSearchSubmit}
        />
      </Panel>
      <Panel
        position="bottom-right"
        className="rounded-md border border-node-border bg-node px-3 py-1.5 font-mono text-xs text-text-secondary"
      >
        Scroll to zoom · drag to pan · click a file to trace its connections
      </Panel>
    </ReactFlow>
  );
}

export function DependencyGraph({ layout }: DependencyGraphProps) {
  return (
    <div className="h-full w-full bg-canvas">
      <ReactFlowProvider>
        <Flow layout={layout} />
      </ReactFlowProvider>
    </div>
  );
}
