import { WeatherType } from "@/components/WeatherLayer";

export type PetStage = "egg" | "baby" | "teen" | "adult" | "elder";
export type PetMood = "happy" | "sad" | "sleeping" | "focused";

export const STAGE_THRESHOLD = {
  EGG: 0,
  BABY: 0, // Hatch instantly (interactive reveal)
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

export const getPetAsset = (
  stage: PetStage,
  weather: WeatherType,
  species: string = "cyber_dino",
): string | null => {
  // Map internal stages to file names
  const stageMap: Record<PetStage, string> = {
    egg: "egg",
    baby: "baby",
    teen: "adult", // Using adult for teen/elder for now
    adult: "adult",
    elder: "adult",
  };

  const fileName = stageMap[stage];

  // For now, the user only has 'sunny' variants
  // We'll fall back to 'sunny' if requested weather is not available
  // In the future, this would be: `${fileName}_${weather}.png`
  return `/assets/pets/${species}/${fileName}_sunny.png`;
};

export const getStageName = (stage: PetStage): string => {
  return stage.charAt(0).toUpperCase() + stage.slice(1);
};

export interface StageInfo {
  nextStage: PetStage | "none";
  targetXp: number;
  currentStageXp: number;
  progress: number;
  remaining: number;
}

export const getNextStageInfo = (xp: number): StageInfo => {
  if (xp < STAGE_THRESHOLD.BABY) {
    return {
      nextStage: "baby",
      targetXp: STAGE_THRESHOLD.BABY,
      currentStageXp: STAGE_THRESHOLD.EGG,
      progress: (xp / STAGE_THRESHOLD.BABY) * 100,
      remaining: STAGE_THRESHOLD.BABY - xp,
    };
  }
  if (xp < STAGE_THRESHOLD.TEEN) {
    const range = STAGE_THRESHOLD.TEEN - STAGE_THRESHOLD.BABY;
    const current = xp - STAGE_THRESHOLD.BABY;
    return {
      nextStage: "teen",
      targetXp: STAGE_THRESHOLD.TEEN,
      currentStageXp: STAGE_THRESHOLD.BABY,
      progress: (current / range) * 100,
      remaining: STAGE_THRESHOLD.TEEN - xp,
    };
  }
  if (xp < STAGE_THRESHOLD.ADULT) {
    const range = STAGE_THRESHOLD.ADULT - STAGE_THRESHOLD.TEEN;
    const current = xp - STAGE_THRESHOLD.TEEN;
    return {
      nextStage: "adult",
      targetXp: STAGE_THRESHOLD.ADULT,
      currentStageXp: STAGE_THRESHOLD.TEEN,
      progress: (current / range) * 100,
      remaining: STAGE_THRESHOLD.ADULT - xp,
    };
  }
  if (xp < STAGE_THRESHOLD.ELDER) {
    const range = STAGE_THRESHOLD.ELDER - STAGE_THRESHOLD.ADULT;
    const current = xp - STAGE_THRESHOLD.ADULT;
    return {
      nextStage: "elder",
      targetXp: STAGE_THRESHOLD.ELDER,
      currentStageXp: STAGE_THRESHOLD.ADULT,
      progress: (current / range) * 100,
      remaining: STAGE_THRESHOLD.ELDER - xp,
    };
  }
  return {
    nextStage: "none",
    targetXp: xp,
    currentStageXp: STAGE_THRESHOLD.ELDER,
    progress: 100,
    remaining: 0,
  };
};
