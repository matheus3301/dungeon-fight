import { trajectory } from "./trajectory";

export type ThrowInput = {
  direction: number;
  power: number;
  loft: number;
  release?: number;
};
export const SHOT_DURATION = 1350;
export const BATTLE_DURATION = 2050;
export const releasePrecision = (release: number) =>
  Math.max(0, 1 - Math.abs(release - 0.62) / 0.62);

/** Shared geometry for practice and authoritative play. Production supplies server entropy. */
export function rollThrow(input: ThrowInput, random: () => number) {
  const precision = releasePrecision(input.release ?? 0.62);
  // Independent triangular scatter: even perfect timing cannot lock a landing point.
  const ricochet = random() < 0.12;
  const spread =
    13 + (1 - precision) * 15 + input.loft * 5 + (ricochet ? 24 : 0);
  const x =
    50 + (input.direction - 0.5) * 105 + (random() + random() - 1) * spread;
  const y =
    68 - input.power * 49 - input.loft * 8 + (random() + random() - 1) * spread;
  const distance = Math.hypot((x - 50) / 35, (y - 43) / 30);
  const hole =
    Math.hypot(x - 32, y - 36) < 2.7 || Math.hypot(x - 68, y - 55) < 2.7;
  const hit = distance <= 1 && !hole;
  const bullseye = hit && distance < 0.095;
  const value = !hit
    ? 0
    : bullseye
      ? 10
      : distance < 0.28
        ? 5
        : distance < 0.5
          ? 4
          : distance < 0.7
            ? 3
            : distance < 0.85
              ? 2
              : 1;
  return {
    x,
    y,
    icon: random() < 1 / 3,
    hit,
    bullseye,
    value,
    bounces: input.loft >= 0.65 ? 2 : 1,
    points: trajectory(x, y, input.loft),
    reason: hole
      ? "O dado caiu em um buraco."
      : !hit
        ? "O dado saiu do alvo."
        : bullseye
          ? "Na mosca!"
          : `Acerto na região ${value}.`,
    precision,
  };
}
