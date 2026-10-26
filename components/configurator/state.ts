import type { ColorZone, CustomLogo, DesignConfig, FinishSettings, Hex, PatternId, PlayerText } from "@/lib/configurator/types";
import { LOGO_SCALE_MAX, LOGO_SCALE_MIN } from "@/lib/configurator/layout";
import { cleanPlayerName, cleanPlayerNumber } from "@/lib/configurator/validate";

/**
 * État du design. Les actions disponibles définissent exactement ce que le
 * client peut faire : aucune ne porte sur les emplacements Lemnos — seule
 * `lemnosColor` existe, et elle s'applique aux trois logos à la fois.
 */
export type DesignAction =
  | { type: "color"; zone: ColorZone; hex: Hex }
  | { type: "lemnosColor"; hex: Hex }
  | { type: "pattern"; id: PatternId }
  | { type: "patternScale"; scale: number }
  | { type: "finish"; patch: Partial<FinishSettings> }
  | { type: "addLogo"; logo: CustomLogo }
  | { type: "updateLogo"; id: string; patch: Partial<Pick<CustomLogo, "scale" | "offsetX" | "offsetY" | "kind">> }
  | { type: "removeLogo"; id: string }
  | { type: "text"; patch: Partial<PlayerText> }
  | { type: "load"; design: DesignConfig };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function designReducer(state: DesignConfig, action: DesignAction): DesignConfig {
  const next = (patch: Partial<DesignConfig>): DesignConfig => ({ ...state, ...patch, updatedAt: new Date().toISOString() });
  switch (action.type) {
    case "color":
      return next({ colors: { ...state.colors, [action.zone]: action.hex } });
    case "lemnosColor":
      return next({ lemnosLogoColor: action.hex });
    case "pattern":
      return next({ pattern: { ...state.pattern, id: action.id } });
    case "patternScale":
      return next({ pattern: { ...state.pattern, scale: clamp(action.scale, 0.5, 2) } });
    case "finish":
      return next({ finish: { ...state.finish, ...action.patch } });
    case "addLogo":
      // Un logo par zone : un nouvel import remplace l'ancien.
      return next({ customLogos: [...state.customLogos.filter((l) => l.zone !== action.logo.zone), action.logo] });
    case "updateLogo":
      return next({
        customLogos: state.customLogos.map((l) =>
          l.id === action.id
            ? {
                ...l,
                ...action.patch,
                scale: clamp(action.patch.scale ?? l.scale, LOGO_SCALE_MIN, LOGO_SCALE_MAX),
                offsetX: clamp(action.patch.offsetX ?? l.offsetX, -1, 1),
                offsetY: clamp(action.patch.offsetY ?? l.offsetY, -1, 1),
              }
            : l,
        ),
      });
    case "removeLogo":
      return next({ customLogos: state.customLogos.filter((l) => l.id !== action.id) });
    case "text": {
      const patch = { ...action.patch };
      if (patch.name !== undefined) patch.name = cleanPlayerName(patch.name);
      if (patch.number !== undefined) patch.number = cleanPlayerNumber(patch.number);
      return next({ playerText: { ...state.playerText, ...patch } });
    }
    case "load":
      return action.design;
  }
}
