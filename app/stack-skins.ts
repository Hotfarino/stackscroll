export const stackSkinIds = ["prism", "ion", "terminal", "frost"] as const;
export type StackSkin = typeof stackSkinIds[number];
export const stackSkins: { id: StackSkin; name: string; description: string }[] = [
  { id: "prism", name: "Prism", description: "The original bright layers." },
  { id: "ion", name: "Ion", description: "Electric blue and cool cyan." },
  { id: "terminal", name: "Terminal", description: "Deep green with luminous type." },
  { id: "frost", name: "Frost", description: "Silver, ice, and open space." },
];
