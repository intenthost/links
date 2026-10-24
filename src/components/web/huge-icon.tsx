import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";

export function HugeIcon({
  icon,
  className = "h-4 w-4",
  size = 18,
  strokeWidth = 1.5,
}: {
  icon: IconSvgElement;
  className?: string;
  size?: number;
  strokeWidth?: number;
}) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={strokeWidth}
      className={className}
    />
  );
}

export function createHugeIcon(icon: IconSvgElement) {
  return function IconWrapper(props: {
    className?: string;
    size?: number;
    strokeWidth?: number;
  }) {
    return <HugeIcon icon={icon} {...props} />;
  };
}
