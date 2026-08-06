import { ReactNode } from "react";

const SPINE_CLASS = "left-4 sm:left-5";
const LINE_COLOR = "bg-gray-400 dark:bg-[#717171]";
const BORDER_COLOR = "border-gray-400 dark:border-[#717171]";

export const ThreadTrunk = ({
  children,
  topClassName = "top-0",
  showLine = true,
  className = "",
}: {
  children: ReactNode;
  topClassName?: string;
  showLine?: boolean;
  className?: string;
}) => (
  <div className={`relative ${className}`}>
    {showLine && (
      <div
        className={`absolute ${SPINE_CLASS} bottom-0 w-px ${LINE_COLOR} pointer-events-none ${topClassName}`}
      />
    )}
    {children}
  </div>
);

export const ThreadBranch = ({
  cornerClass = "h-4 w-7 sm:w-6",
}: {
  cornerClass?: string;
}) => (
  <div
    className={`absolute ${SPINE_CLASS} top-0 border-l ${BORDER_COLOR} border-b ${BORDER_COLOR} rounded-bl-2xl pointer-events-none ${cornerClass}`}
  />
);

export const ThreadLine = ({
  topClassName = "top-0",
  className = "",
}: {
  topClassName?: string;
  className?: string;
}) => (
  <div
    className={`absolute ${SPINE_CLASS} bottom-0 w-px ${LINE_COLOR} pointer-events-none ${topClassName} ${className}`}
  />
);