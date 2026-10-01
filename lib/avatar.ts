export const SKINS = ["porcelain", "fair", "tan", "olive", "brown", "deep"] as const;
export const HAIR_COLORS = ["black", "darkbrown", "brown", "blonde", "red"] as const;
export const HAIR_STYLES = ["short", "bob", "long", "curly", "braids", "bun", "headscarf"] as const;
export const TOPS = ["blue", "green", "red", "yellow", "purple", "orange"] as const;

export type Avatar = {
  skin: (typeof SKINS)[number];
  hairColor: (typeof HAIR_COLORS)[number];
  hairStyle: (typeof HAIR_STYLES)[number];
  top: (typeof TOPS)[number];
  glasses: boolean;
};

export const SKIN_HEX: Record<Avatar["skin"], string> = {
  porcelain: "#fbe3cf",
  fair: "#f3cfa6",
  tan: "#e0ac7e",
  olive: "#c68e5e",
  brown: "#9a6239",
  deep: "#6b3f22",
};

export const HAIR_HEX: Record<Avatar["hairColor"], string> = {
  black: "#2b2320",
  darkbrown: "#45302a",
  brown: "#7a4f2e",
  blonde: "#e2b75a",
  red: "#b5522a",
};

export const TOP_HEX: Record<Avatar["top"], string> = {
  blue: "#4b8fd6",
  green: "#2f9e6e",
  red: "#e2574c",
  yellow: "#f2b632",
  purple: "#8a63d2",
  orange: "#f08a3c",
};

/** Pictures a learner can choose for their own profile. */
export const KID_AVATARS = ["🦊", "🦖", "🚀", "🐼", "🦄", "🐙", "🦁", "🐸"];
