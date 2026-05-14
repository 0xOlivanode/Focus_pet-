import { WeatherType } from "@/components/WeatherLayer";

export type PetStage = "egg" | "baby" | "teen" | "adult" | "elder";
export type PetMood = "happy" | "sad" | "sleeping" | "focused";

export const STAGE_THRESHOLD = {
  EGG: 0,
  BABY: 3600, // 1 hour of focus to hatch
  TEEN: 111600, // 30 hours of babyhood (108,000s) + 1 hour egg = 31 hours total
  ADULT: 360000, // 100 hours total
  ELDER: 900000, // 250 hours total
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

const CYBER_DINO_ASSETS: Record<string, string> = {
  egg: "https://res.cloudinary.com/dmpulmnb9/image/upload/v1778777438/egg_sunny_tqcx2g.png",
  baby: "https://res.cloudinary.com/dmpulmnb9/image/upload/v1778777435/baby_sunny_jmplzw.png",
  adult: "https://res.cloudinary.com/dmpulmnb9/image/upload/v1778777434/adult_sunny_g4ards.png",
};

export const getPetAsset = (
  stage: PetStage,
  _weather: WeatherType,
  species: string = "cyber_dino",
): string | null => {
  const stageMap: Record<PetStage, string> = {
    egg: "egg",
    baby: "baby",
    teen: "adult",
    adult: "adult",
    elder: "adult",
  };

  const key = stageMap[stage];
  return CYBER_DINO_ASSETS[key] ?? null;
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
