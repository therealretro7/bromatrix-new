import React from "react";
import { NeuformIsolatedEffects } from "../neuform-isolated/NeuformIsolatedEffects";

export interface RectangleButtonsProps {
  variant?: "glassmorphism-cta" | string;
  mode?: "dark" | "light";
  hue?: number;
  saturation?: number;
  brightness?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function RectangleButtons({
  variant = "glassmorphism-cta",
  mode = "dark",
  hue = 0,
  saturation = 1.0,
  brightness = 1.0,
  className = "",
  style,
}: RectangleButtonsProps) {
  return (
    <NeuformIsolatedEffects
      variant={variant as any}
      mode={mode}
      hue={hue}
      saturation={saturation}
      brightness={brightness}
      className={`rectangle-buttons rectangle-buttons--${variant} ${className}`}
      style={style}
    />
  );
}

export default RectangleButtons;
