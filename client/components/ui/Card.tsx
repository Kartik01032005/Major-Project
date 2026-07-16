import React from "react";
import { CardProps } from "@/types";

const paddingMap = {
  sm: "p-4",
  md: "p-5",
  lg: "p-7",
};

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hover = false,
  glass = false,
  padding = "md",
}) => {
  const base = "rounded-2xl border transition-all duration-300";

  const surface = glass
    ? "glass"
    : [
        "bg-white dark:bg-slate-900",
        "border-slate-200 dark:border-slate-800",
        "shadow-[0_1px_3px_0_rgb(0_0_0_/_0.06),_0_1px_2px_-1px_rgb(0_0_0_/_0.04)]",
      ].join(" ");

  const hoverClass = hover
    ? [
        "hover:-translate-y-1.5",
        "hover:shadow-[0_12px_24px_-4px_rgb(0_0_0_/_0.1),_0_4px_8px_-2px_rgb(0_0_0_/_0.06)]",
        "hover:border-slate-300 dark:hover:border-slate-700",
        "cursor-pointer",
      ].join(" ")
    : "";

  const classes = [base, surface, paddingMap[padding], hoverClass, className]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
};

export default Card;
