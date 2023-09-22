"use client";

import Dagre from "dagre";

import React, { useEffect, useState, useCallback } from "react";
import ReactFlow, {
  ReactFlowProvider,
  Panel,
  useReactFlow,
  useNodesState,
  useEdgesState,
  Node,
  NodeTypes,
  Edge,
} from "reactflow";

import "reactflow/dist/style.css";

import PncNode from "./pnc_node";

type Action = {
  name: string;
  dependants: string[];
  dependencies: string[];
  state: string;
};

type Option = {
  direction: string;
};

const nodeTypes: NodeTypes = {
  pncNode: PncNode,
};

const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[], options: Option) => {
  g.setGraph({ rankdir: options.direction });

  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  nodes.forEach((node) => g.setNode(node.id, node));

  Dagre.layout(g);

  return {
    nodes: nodes.map((node) => {
      const { x, y } = g.node(node.id);

      return { ...node, position: { x, y } };
    }),
    edges,
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const fakeData = [
  { name: "abeeeeee", dependants: ["cdeeeeee", "efeeeeee"] },
  { name: "cdeeeeee", dependants: ["efeeeeee"], state: "UP" },
  { name: "efeeeeee", dependants: [] },
  { name: "11eeeeee", dependants: ["22eeeeee"] },
  { name: "22eeeeee", dependants: [] },
];

function processGraph(
  graph: Action[],
  setNodes: any,
  setEdges: any,
  setStats: any,
) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const map = new Map();

  graph.forEach((node) => {
    if (map.has(node.state)) {
      const currentCount = map.get(node.state);
      map.set(node.state, currentCount + 1);
    } else {
      map.set(node.state, 1);
    }

    let additionalClasses = "";

    switch (node.state) {
      case "SUCCESSFUL":
        additionalClasses = "bg-green-500 text-white";
        break;
      case "UP":
        additionalClasses = "animate-pulse text-white bg-blue-700";
        break;
      case "WAITING":
        additionalClasses = "bg-white text-slate-300";
        break;
      case "FAILED":
      case "START_FAILED":
      case "STOP_FAILED":
        additionalClasses = "bg-red-600 text-white";
        break;
      default:
        additionalClasses = "";
    }

    nodes.push({
      id: node.name,
      type: "pncNode",
      position: { x: 0, y: 0 },
      data: {
        name: node.name,
        url: `${process.env.NEXT_PUBLIC_PNC_BASE_URL}/pnc-web/#/builds/${node.name}`,
        additional_classes: additionalClasses,
      },
      width: 150,
      height: 42,
    });

    node.dependants.forEach((connection) => {
      edges.push({
        id: `${node.name}-${connection}`,
        source: node.name,
        target: connection,
        animated: true,
      });
    });
  });

  // initial layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
    nodes,
    edges,
    { direction: "TB" },
  );

  // calculate all the items held in rex
  map.set("Total", graph.length);
  setStats(map);
  setNodes([...layoutedNodes]);
  setEdges([...layoutedEdges]);
}

function LayoutFlow() {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [stats, setStats] = useState(new Map());

  // "http://<server>/rest/tasks",
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_REX_URL}/rest/tasks`)
      .then((response) => response.json())
      .then((data) => processGraph(data, setNodes, setEdges, setStats))
      .catch((error) => console.error(error));
  }, [setNodes, setEdges]);

  const onLayout = useCallback(
    (direction: string) => {
      const layouted = getLayoutedElements(nodes, edges, { direction });

      setNodes([...layouted.nodes]);
      setEdges([...layouted.edges]);

      window.requestAnimationFrame(() => {
        fitView();
      });
    },
    [nodes, edges, setNodes, setEdges, fitView],
  );

  return (
    <>
      <div style={{ width: "100vw", height: "100vh" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
        >
          <Panel position="top-right">
            <button type="button" onClick={() => onLayout("TB")}>
              vertical layout
            </button>
            <button type="button" onClick={() => onLayout("LR")}>
              horizontal layout
            </button>
          </Panel>
        </ReactFlow>
      </div>
      <div className="absolute bottom-0 left-0 h-32 w-64 ...">
        <table className="border border-collapse border-slate-400 table-auto">
          <thead>
            <tr>
              <th className="border border-slate-300">State</th>
              <th className="border border-slate-300">Count</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(stats.keys()).map((item) => (
              <tr key={item}>
                <td className="border border-slate-300">{item}</td>
                <td className="border border-slate-300 text-right">
                  {stats.get(item)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function Home() {
  return (
    <ReactFlowProvider>
      <LayoutFlow />
    </ReactFlowProvider>
  );
}
