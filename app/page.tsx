"use client";

import Dagre from "dagre";

import React, { useEffect, useCallback } from "react";
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

import configData from "./config.json";

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

function processGraph(graph: Action[], setNodes: any, setEdges: any) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  graph.forEach((node) => {
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
      default:
        additionalClasses = "";
    }

    nodes.push({
      id: node.name,
      type: "pncNode",
      position: { x: 0, y: 0 },
      data: {
        name: node.name,
        url: `${configData.pnc_base_url}/${node.name}`,
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

  setNodes([...layoutedNodes]);
  setEdges([...layoutedEdges]);
}

function LayoutFlow() {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // "http://<server>/rest/tasks",
  useEffect(() => {
    fetch(
      "/rest/tasks",
    )
      .then((response) => response.json())
      .then((data) => processGraph(data, setNodes, setEdges))
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
          <button type="button" onClick={() => onLayout("TB")}>vertical layout</button>
          <button type="button" onClick={() => onLayout("LR")}>horizontal layout</button>
        </Panel>
      </ReactFlow>
    </div>
  );
};


export default function Home() {
  return (
    <ReactFlowProvider>
      <LayoutFlow />
    </ReactFlowProvider>
  );
}
