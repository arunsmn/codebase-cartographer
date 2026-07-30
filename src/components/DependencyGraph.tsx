"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  type Edge,
  type Node as FlowNode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { DependencyGraph as DependencyGraphData } from "@/core/graph/types";
import { computeLayout } from "@/core/layout/computeLayout";
import { detectGroups } from "@/core/graph/detectGroups";
import { buildCollapsedGraph } from "@/core/graph/buildCollapsedGraph";
import { FileNode, type FileNodeType } from "./FileNode";
import { GroupNode, type GroupNodeType } from "./GroupNode";

interface DependencyGraphProps {
  graph: DependencyGraphData;
}

const nodeTypes = { file: FileNode, group: GroupNode };

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

function Flow({ graph }: DependencyGraphProps) {
  const { fitView } = useReactFlow();

  const groupingResult = useMemo(
    () => detectGroups(graph.nodes.map((n) => n.id)),
    [graph],
  );
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(
    new Set(),
  );

  const collapsedGraph = useMemo(
    () => buildCollapsedGraph(graph, groupingResult.groups, expandedGroupIds),
    [graph, groupingResult, expandedGroupIds],
  );

  const layout = useMemo(() => computeLayout(collapsedGraph), [collapsedGraph]);

  const collapsedNodeById = useMemo(
    () => new Map(collapsedGraph.nodes.map((n) => [n.id, n])),
    [collapsedGraph],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [searchTargetIds, setSearchTargetIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const focusedKeyRef = useRef<string>("");
  const pendingFullFitRef = useRef(false);

  function handleSearchSubmit() {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) {
      setSearchTargetIds(new Set());
      return;
    }

    const matches = graph.nodes.filter((n) =>
      n.id.toLowerCase().includes(trimmed),
    );
    if (matches.length === 0) {
      setSearchTargetIds(new Set());
      return;
    }

    setSelectedNodeId(null);
    focusedKeyRef.current = ""; // force a fresh pan even if this exact target set was focused before

    const groupsToExpand = new Set<string>();
    for (const match of matches) {
      const group = groupingResult.groups.find(
        (g) => !expandedGroupIds.has(g.id) && g.filePaths.includes(match.id),
      );
      if (group) groupsToExpand.add(group.id);
    }
    if (groupsToExpand.size > 0) {
      setExpandedGroupIds(
        (current) => new Set([...current, ...groupsToExpand]),
      );
    }

    setSearchTargetIds(new Set(matches.map((n) => n.id)));
  }

  // Purely imperative viewport control — no setState here except via refs,
  // so this never triggers React's cascading-render warning. Search focus
  // takes priority; a pending full-fit (from manual expand/collapse) only
  // runs when there's no active search.
  useEffect(() => {
    if (searchTargetIds.size > 0) {
      const key = [...searchTargetIds].sort().join(",");
      if (focusedKeyRef.current !== key) {
        const visibleMatches = layout.nodes.filter((n) =>
          searchTargetIds.has(n.id),
        );
        if (visibleMatches.length > 0) {
          focusedKeyRef.current = key;
          fitView({
            nodes: visibleMatches,
            duration: 400,
            maxZoom: 1,
            padding: 0.3,
          });
        }
      }
      return;
    }

    if (pendingFullFitRef.current) {
      pendingFullFitRef.current = false;
      fitView({ duration: 400, padding: 0.2 });
    }
  }, [layout, searchTargetIds, fitView]);

  function handleNodeClick(nodeId: string) {
    const collapsedNode = collapsedNodeById.get(nodeId);

    if (collapsedNode?.isGroup) {
      setExpandedGroupIds((current) => new Set(current).add(nodeId));
      setSearchQuery("");
      setSearchTargetIds(new Set());
      setSelectedNodeId(null);
      pendingFullFitRef.current = true;
      return;
    }

    setSearchQuery("");
    setSearchTargetIds(new Set());
    setSelectedNodeId((current) => (current === nodeId ? null : nodeId));
  }

  function handleCollapseGroup(groupId: string) {
    setExpandedGroupIds((current) => {
      const next = new Set(current);
      next.delete(groupId);
      return next;
    });
    setSearchQuery("");
    setSearchTargetIds(new Set());
    setSelectedNodeId(null);
    pendingFullFitRef.current = true;
  }

  const { connectedNodeIds, connectedEdgeIds } = useMemo(() => {
    if (!selectedNodeId)
      return {
        connectedNodeIds: new Set<string>(),
        connectedEdgeIds: new Set<string>(),
      };

    const nodeIds = new Set<string>([selectedNodeId]);
    const edgeIds = new Set<string>();
    for (const edge of collapsedGraph.edges) {
      if (edge.from === selectedNodeId || edge.to === selectedNodeId) {
        edgeIds.add(`${edge.from}->${edge.to}`);
        nodeIds.add(edge.from);
        nodeIds.add(edge.to);
      }
    }
    return { connectedNodeIds: nodeIds, connectedEdgeIds: edgeIds };
  }, [selectedNodeId, collapsedGraph]);

  const displayNodes: FlowNode[] = layout.nodes.map((n) => {
    const collapsedNode = collapsedNodeById.get(n.id);
    const base = {
      id: n.id,
      position: { x: n.x, y: n.y },
      width: n.width,
      height: n.height,
      style: { width: n.width, height: n.height },
    };

    if (collapsedNode?.isGroup) {
      return {
        ...base,
        type: "group",
        data: { fileCount: collapsedNode.fileCount ?? 0 },
      } satisfies GroupNodeType;
    }

    return {
      ...base,
      type: "file",
      data: {
        path: n.id,
        connected: selectedNodeId ? connectedNodeIds.has(n.id) : false,
        dimmed: selectedNodeId ? !connectedNodeIds.has(n.id) : false,
        searchMatched: !selectedNodeId && searchTargetIds.has(n.id),
      },
    } satisfies FileNodeType;
  });

  const displayEdges: Edge[] = collapsedGraph.edges.map((e) => {
    const id = `${e.from}->${e.to}`;
    if (!selectedNodeId) {
      return {
        id,
        source: e.from,
        target: e.to,
        style: { stroke: "var(--color-edge)", strokeWidth: 1.5 },
      };
    }
    const isConnected = connectedEdgeIds.has(id);
    return {
      id,
      source: e.from,
      target: e.to,
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
      nodesDraggable={false}
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
      <Controls
        position="bottom-left"
        showInteractive={false}
        className="border-node-border! bg-node! [&_button]:border-node-border! [&_button]:bg-node! [&_button]:text-text-primary!"
      />
      <Panel position="top-left">
        <SearchPanel
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={handleSearchSubmit}
        />
      </Panel>
      {expandedGroupIds.size > 0 && (
        <Panel position="top-right" className="flex flex-col gap-1.5">
          {[...expandedGroupIds].map((groupId) => (
            <button
              key={groupId}
              onClick={() => handleCollapseGroup(groupId)}
              className="rounded-md border border-node-border bg-node px-3 py-1.5 font-mono text-xs text-text-secondary hover:border-accent hover:text-text-primary"
            >
              ← collapse {groupId}
            </button>
          ))}
        </Panel>
      )}
      <MiniMap
        position="bottom-right"
        bgColor="#0d1117"
        nodeColor="#7d8590"
        nodeStrokeColor="#30363d"
        maskColor="rgba(13, 17, 23, 0.75)"
        className="border-node-border!"
        pannable
        zoomable
      />
      <Panel
        position="bottom-center"
        className="rounded-md border border-node-border bg-node px-3 py-1.5 font-mono text-xs text-text-secondary"
      >
        Scroll to zoom · drag to pan · click a file to trace its connections
      </Panel>{" "}
    </ReactFlow>
  );
}

export function DependencyGraph({ graph }: DependencyGraphProps) {
  return (
    <div className="h-full w-full bg-canvas">
      <ReactFlowProvider>
        <Flow graph={graph} />
      </ReactFlowProvider>
    </div>
  );
}
