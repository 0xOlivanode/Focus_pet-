export type PetStage = "egg" | "baby" | "teen" | "adult" | "elder";
export type PetMood = "happy" | "sad" | "sleeping" | "focused";

export const STAGE_THRESHOLD = {
  EGG: 0,
  BABY: 5, // Reduced from 100 for testing
  TEEN: 500,
  ADULT: 2000,
  ELDER: 5000,
} as const;

export const getPetStage = (xp: number): PetStage => {
  if (xp < STAGE_THRESHOLD.BABY) return "egg";
  if (xp < STAGE_THRESHOLD.TEEN) return "baby";
  if (xp < STAGE_THRESHOLD.ADULT) return "teen";
  if (xp < STAGE_THRESHOLD.ELDER) return "adult";
  return "elder";
};

export const getPetEmoji = (stage: PetStage): string => {
  switch (stage) {
    case "egg":
      return "🥚";
    case "baby":
      return "🐣";
    case "teen":
      return "🦖";
    case "adult":
      return "🐉";
    case "elder":
      return "👑";
    default:
      return "🥚";
  }
};

export const getStageName = (stage: PetStage): string => {
  return stage.charAt(0).toUpperCase() + stage.slice(1);
};
