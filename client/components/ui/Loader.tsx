import React from "react";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  text?: string;
}

const sizeMap = {
  sm: "h-6 w-6 border-2",
  md: "h-10 w-10 border-2",
  lg: "h-16 w-16 border-[3px]",
};

const Loader: React.FC<LoaderProps> = ({
  size = "md",
  fullScreen = false,
  text,
}) => {
  const spinner = (
    <div className="flex flex-col items-center gap-3">
      {/* Blood drop spinner */}
      <div className="relative">
        <div
          className={[
            "rounded-full border-red-200 dark:border-red-950 border-t-red-700 animate-spin",
            sizeMap[size],
          ].join(" ")}
        />
        {/* Heartbeat dot */}
        <span
          className="absolute inset-0 flex items-center justify-center text-red-700"
          aria-hidden="true"
        >
          {size === "lg" ? "🩸" : ""}
        </span>
      </div>

      {text && (
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        role="status"
        aria-label={text ?? "Loading…"}
        className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm"
      >
        {spinner}
      </div>
    );
  }

  return (
    <div role="status" aria-label={text ?? "Loading…"} className="flex items-center justify-center py-8">
      {spinner}
    </div>
  );
};

export default Loader;
