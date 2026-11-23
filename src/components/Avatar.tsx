import { avatarDigits, avatarTone } from "../lib/format";

export function Avatar({ code, size = 28 }: { code: string; size?: number }) {
  return (
    <span
      className={`avatar avatar--${avatarTone(code)}`}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.36) }}
      aria-hidden="true"
    >
      {avatarDigits(code)}
    </span>
  );
}
