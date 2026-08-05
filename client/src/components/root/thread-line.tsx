import { ReactNode } from "react";

export const THREAD_SPINE = 19;

export const ThreadTrunk = ({
  children,
  /** Tailwind class(es) for where the line starts, e.g. "top-8 sm:top-10" to start at an avatar's bottom edge. */
  topClassName = "top-0",
  /** Set false when there's nothing to connect (e.g. repliesCount === 0) so no stray line renders. */
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
        className={`absolute bottom-0 w-[1.5px] bg-gray-400 dark:bg-[#717171] pointer-events-none ${topClassName}`}
        style={{ left: THREAD_SPINE }}
      />
    )}
    {children}
  </div>
);

export const ThreadBranch = ({
  /** Tailwind height/width classes for the elbow curve; height should match this row's avatar/icon center. */
  className = "top-0 h-[14px] w-[26px]",
}: {
  className?: string;
}) => (
  <div
    className={`absolute border-l-[1.5px] border-b-[1.5px] border-gray-400 dark:border-[#717171] rounded-bl-2xl pointer-events-none ${className}`}
    style={{ left: THREAD_SPINE }}
  />
);