import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";

type Data = {
  name: string;
  url: string;
  additional_classes: string;
};

function PncNode({ data }: NodeProps<Data>) {
  return (
    <div
      className={
        `px-4 py-2 shadow-md rounded-md border-2 border-stone-400 ${data.additional_classes}`
      }
    >
      <div className="flex">
        <div className="ml-2">
          <a href={data.url} target="_blank" rel="noreferrer">
            {data.name}
          </a>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="w-16 !bg-teal-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-16 !bg-teal-500"
      />
    </div>
  );
}

export default memo(PncNode);
