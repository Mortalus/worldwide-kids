import { HAIR_HEX, SKIN_HEX, TOP_HEX, type Avatar } from "@/lib/avatar";

/** The guide child's face, assembled from the parts chosen for them. Always a drawing, never a photo. */
export function GuideAvatar({ avatar, size = 48, label }: { avatar: Avatar; size?: number; label?: string }) {
  const skin = SKIN_HEX[avatar.skin];
  const hair = HAIR_HEX[avatar.hairColor];
  const top = TOP_HEX[avatar.top];
  const style = avatar.hairStyle;
  const cap = "M16 29c-1-13 7-19 16-19s17 6 16 19c-3-7-7-10-16-10s-13 3-16 10z";

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={label ?? "Guide"} className="shrink-0">
      <circle cx="32" cy="32" r="32" fill="#ffe9b8" />
      {style === "long" && <path d="M15 28c-2 12-1 20 2 25h30c3-5 4-13 2-25z" fill={hair} />}
      {style === "braids" && (
        <>
          <path d="M14 30c-2 8-1 16 1 21l5-1c-1-6-1-13 0-20zM50 30c2 8 1 16-1 21l-5-1c1-6 1-13 0-20z" fill={hair} />
          <circle cx="17" cy="52" r="2.5" fill={top} />
          <circle cx="47" cy="52" r="2.5" fill={top} />
        </>
      )}
      {style === "bun" && <circle cx="32" cy="9" r="6" fill={hair} />}
      <path d="M12 62c2-12 10-17 20-17s18 5 20 17z" fill={top} />
      <circle cx="32" cy="29" r="15" fill={skin} />
      {style === "headscarf" ? (
        <path d="M14 33c-3-15 6-24 18-24s21 9 18 24c-1 7-4 12-7 15 3-9 2-20-11-20S18 39 21 48c-3-3-6-8-7-15z" fill={top} />
      ) : style === "curly" ? (
        <g fill={hair}>
          <circle cx="19" cy="22" r="6" />
          <circle cx="26" cy="15" r="6.5" />
          <circle cx="35" cy="13" r="6.5" />
          <circle cx="43" cy="17" r="6" />
          <circle cx="47" cy="25" r="5" />
          <circle cx="17" cy="29" r="4" />
        </g>
      ) : (
        <path d={cap} fill={hair} />
      )}
      {style === "bob" && <path d="M17 27v14c-3-3-4-9-3-14zM47 27v14c3-3 4-9 3-14z" fill={hair} />}
      <circle cx="26" cy="31" r="1.8" fill="#2b2320" />
      <circle cx="38" cy="31" r="1.8" fill="#2b2320" />
      {avatar.glasses && (
        <g fill="none" stroke="#3a3a4a" strokeWidth="1.4">
          <circle cx="26" cy="31" r="4.5" />
          <circle cx="38" cy="31" r="4.5" />
          <path d="M30.5 31h3" />
        </g>
      )}
      <path d="M27 37c3 3 7 3 10 0" stroke="#b5553c" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}
