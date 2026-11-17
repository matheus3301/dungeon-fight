import { useEffect, useState } from "react";
export function Sprite({
  src,
  size = 64,
  className = "",
  action = "idle",
}: {
  src: string;
  size?: number;
  className?: string;
  action?: "idle" | "run";
}) {
  const [frame, setFrame] = useState(0);
  const animatedSrc = src.replace("_idle_anim_", `_${action}_anim_`);
  useEffect(() => {
    if (
      !src.includes("/0x72/") ||
      !src.includes("_idle_anim_f0") ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const timer = setInterval(() => setFrame((f) => (f + 1) % 4), 220);
    return () => clearInterval(timer);
  }, [src]);
  return (
    <img
      className={`sprite ${className}`}
      src={animatedSrc.replace(
        /_(idle|run)_anim_f0/,
        `_${action}_anim_f${frame}`,
      )}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  );
}
