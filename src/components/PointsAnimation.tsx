import { useEffect, useState } from "react";

interface PointsAnimationProps {
  points: number;
  show: boolean;
}

export function PointsAnimation({ points, show }: PointsAnimationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none z-50">
      <div className="animate-float-up text-2xl font-bold text-primary drop-shadow-lg">
        +{points} puntos 🎉
      </div>
    </div>
  );
}