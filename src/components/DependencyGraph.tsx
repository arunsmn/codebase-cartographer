"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
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

// SearchPanel stays exactly as it was — no changes needed there.
function SearchPanel({
  nodes,
  onHighlight,
}: {
  nodes: FileNodeType[];
  onHighlight: (matchIds: Set<string>) => void;
}) {
  const { setCenter } = useReactFlow();
  const [query, setQuery] = useState("");
  const nodesRef = useRef(nodes);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      onHighlight(new Set());
      return;
    }

    const matches = nodesRef.current.filter((n) =>
      n.id.toLowerCase().includes(trimmed),
    );
    onHighlight(new Set(matches.map((n) => n.id)));

    const first = matches[0];
    if (first) {
      const width =
        typeof first.style?.width === "number" ? first.style.width : 180;
      const height =
        typeof first.style?.height === "number" ? first.style.height : 56;
      setCenter(first.position.x + width / 2, first.position.y + height / 2, {
        zoom: 1,
        duration: 400,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search files…"
      className="w-56 rounded-md border border-node-border bg-node px-3 py-1.5 font-mono text-xs text-text-primary outline-none focus:border-accent"
    />
  );
}

export function DependencyGraph({ layout }: DependencyGraphProps) {
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

  const [nodes, setNodes, onNodesChange] =
    useNodesState<FileNodeType>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const [searchHighlightedIds, setSearchHighlightedIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

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
    data: selectedNodeId
      ? {
          path: n.data.path,
          highlighted: connectedNodeIds.has(n.id),
          dimmed: !connectedNodeIds.has(n.id),
        }
      : {
          path: n.data.path,
          highlighted: searchHighlightedIds.has(n.id),
          dimmed: false,
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
    <div className="h-full w-full bg-canvas">
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) =>
          setSelectedNodeId((current) => (current === node.id ? null : node.id))
        }
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
          <SearchPanel nodes={nodes} onHighlight={setSearchHighlightedIds} />
        </Panel>
        <Panel
          position="bottom-right"
          className="rounded-md border border-node-border bg-node px-3 py-1.5 font-mono text-xs text-text-secondary"
        >
          Scroll to zoom · drag to pan · click a file to trace its connections
        </Panel>
      </ReactFlow>
    </div>
  );
}
