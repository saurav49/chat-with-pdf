import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

function TooltipWrapper({
  trigger,
  content,
}: {
  trigger: React.ReactNode;
  content: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger>{trigger}</TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </Tooltip>
  );
}

export default TooltipWrapper;
