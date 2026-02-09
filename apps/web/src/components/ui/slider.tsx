"use client";

import * as React from "react";

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min: number;
  max: number;
  step: number;
  className?: string;
}

export function Slider({
  value,
  onValueChange,
  min,
  max,
  step,
  className = "",
}: SliderProps) {
  const [isDragging, setIsDragging] = React.useState<number | null>(null);
  const sliderRef = React.useRef<HTMLDivElement>(null);

  const getPercentage = (val: number) => {
    return ((val - min) / (max - min)) * 100;
  };

  const getValueFromPosition = (clientX: number) => {
    if (!sliderRef.current) return min;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawValue = min + percentage * (max - min);
    const steppedValue = Math.round(rawValue / step) * step;

    return Math.max(min, Math.min(max, steppedValue));
  };

  const handleMouseDown = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(index);
  };

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (isDragging === null) return;

      const newValue = getValueFromPosition(e.clientX);
      const newValues = [...value];

      if (isDragging === 0) {
        // Déplacement du curseur gauche (min)
        newValues[0] = Math.min(newValue, value[1] - step);
      } else {
        // Déplacement du curseur droit (max)
        newValues[1] = Math.max(newValue, value[0] + step);
      }

      onValueChange(newValues);
    },
    [isDragging, value, step, onValueChange]
  );

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(null);
  }, []);

  React.useEffect(() => {
    if (isDragging !== null) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const leftPercentage = getPercentage(value[0]);
  const rightPercentage = getPercentage(value[1]);

  return (
    <div className={`relative w-full ${className}`}>
      {/* Track */}
      <div
        ref={sliderRef}
        className="relative h-2 w-full rounded-full bg-gray-200 cursor-pointer"
        onClick={(e) => {
          const newValue = getValueFromPosition(e.clientX);
          const distToMin = Math.abs(newValue - value[0]);
          const distToMax = Math.abs(newValue - value[1]);

          if (distToMin < distToMax) {
            onValueChange([newValue, value[1]]);
          } else {
            onValueChange([value[0], newValue]);
          }
        }}
      >
        {/* Active range */}
        <div
          className="absolute h-2 rounded-full bg-gray-900"
          style={{
            left: `${leftPercentage}%`,
            right: `${100 - rightPercentage}%`,
          }}
        />

        {/* Left thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-white border-2 border-gray-900 shadow-md cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
          style={{ left: `${leftPercentage}%` }}
          onMouseDown={handleMouseDown(0)}
        />

        {/* Right thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-white border-2 border-gray-900 shadow-md cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
          style={{ left: `${rightPercentage}%` }}
          onMouseDown={handleMouseDown(1)}
        />
      </div>
    </div>
  );
}
