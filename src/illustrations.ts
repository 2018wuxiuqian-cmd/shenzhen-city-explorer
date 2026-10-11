export type Illustration = { sheet: "places" | "cities"; index: number };
export const sheets = {
  places: "assets/generated/shenzhen-places-atlas.png",
  cities: "assets/generated/city-clues-atlas.png",
};
export const generationDisclosure = "AI 生成教学插画 · 非实拍 · 非精确复原";
export function tilePosition(index: number) {
  if (!Number.isInteger(index) || index < 0 || index > 15)
    throw Error("Invalid illustration tile");
  return {
    left: `${-(index % 4) * 100}%`,
    top: `${-Math.floor(index / 4) * 100}%`,
  };
}
export const cityClueIndices = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [9, 10, 11, 12],
];
export const vocabPlaceIndices = [8, 3, 1, 10, 6];
// Only files actually present at build time are treated as supplied photographs.
const suppliedFiles = new Set(
  Object.keys(import.meta.glob("/public/assets/cities/*.{png,jpg,jpeg,webp}")),
);
export function suppliedCityPhoto(city: string, clue: number) {
  const stem = `assets/cities/${city.toLowerCase().replaceAll(" ", "-")}-${clue + 1}`;
  for (const ext of ["jpg", "jpeg", "png", "webp"])
    if (suppliedFiles.has(`/public/${stem}.${ext}`)) return `${stem}.${ext}`;
  return null;
}
