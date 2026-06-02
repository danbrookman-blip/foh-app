import type { KindnessAward } from "./types";

/**
 * The catalog. In production this is brand-configurable (different brands run
 * different programmes with different limits). For the prototype it's hardcoded.
 *
 * Monthly limits are deliberately tight on the high-value awards — the *point* of
 * the guard rail is to make managers spend the budget on the moments that matter,
 * not blow it in the first week.
 */
export const CATALOG: KindnessAward[] = [
  {
    code: "free_coffee",
    name: "Free coffee",
    description: "Any hot drink on us — espresso to latte.",
    icon: "☕",
    monthlyLimit: 30,
  },
  {
    code: "free_cake",
    name: "Free cake",
    description: "Any slice from the dessert menu.",
    icon: "🍰",
    monthlyLimit: 20,
  },
  {
    code: "free_side",
    name: "Free side",
    description: "Fries, salad, garlic bread — manager's pick.",
    icon: "🥗",
    monthlyLimit: 15,
  },
  {
    code: "free_cocktail",
    name: "Free cocktail",
    description: "One from the signature list, on the house.",
    icon: "🍸",
    monthlyLimit: 10,
  },
  {
    code: "free_house_wine",
    name: "Bottle of house wine",
    description: "House red or white, our shout.",
    icon: "🍷",
    monthlyLimit: 5,
  },
  {
    code: "free_main",
    name: "Free main",
    description: "Comp any single main course on the bill.",
    icon: "🍽️",
    monthlyLimit: 5,
  },
  {
    code: "fifty_off_bill",
    name: "50% off the bill",
    description: "Half the total bill — keep for big moments.",
    icon: "½",
    monthlyLimit: 5,
  },
  {
    code: "round_on_house",
    name: "Round on the house",
    description: "Drinks for the table, anything they're already on.",
    icon: "🥂",
    monthlyLimit: 3,
  },
];

export function findAward(code: string): KindnessAward | undefined {
  return CATALOG.find((a) => a.code === code);
}
