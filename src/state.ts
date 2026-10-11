import { allPlaces } from "./data";
export const KEY = "shenzhen-explorer-v1";
export type Recommendation = {
  placeId: string;
  type: string;
  activity: string;
  reason: string;
};
export type State = {
  version: 1;
  currentPage: number;
  currentStep: number;
  steps: Record<number, number>;
  discoveredPlaceIds: string[];
  mentions: Record<string, number>;
  placeCategories: Record<string, string[]>;
  selectedRecommendationPlaceIds: string[];
  recommendations: Recommendation[];
  teacherSettings: {
    reducedMotion: boolean;
    largeFont: boolean;
    quickMode: boolean;
  };
};
export function initial(): State {
  return {
    version: 1,
    currentPage: 1,
    currentStep: 0,
    steps: {},
    discoveredPlaceIds: [],
    mentions: {},
    placeCategories: {},
    selectedRecommendationPlaceIds: [],
    recommendations: [],
    teacherSettings: {
      reducedMotion: false,
      largeFont: false,
      quickMode: true,
    },
  };
}
export function discover(s: State, id: string): State {
  if (!allPlaces.some((p) => p.id === id)) return s;
  return {
    ...s,
    discoveredPlaceIds: s.discoveredPlaceIds.includes(id)
      ? s.discoveredPlaceIds
      : [...s.discoveredPlaceIds, id],
    mentions: { ...s.mentions, [id]: (s.mentions[id] || 0) + 1 },
  };
}
export function tag(s: State, id: string, t: string): State {
  if (!s.discoveredPlaceIds.includes(id)) return s;
  const a = s.placeCategories[id] || [];
  return {
    ...s,
    placeCategories: {
      ...s.placeCategories,
      [id]: a.includes(t) ? a.filter((x) => x !== t) : [...a, t],
    },
  };
}
export function select(s: State, id: string): State {
  if (!s.discoveredPlaceIds.includes(id)) return s;
  return {
    ...s,
    selectedRecommendationPlaceIds: s.selectedRecommendationPlaceIds.includes(
      id,
    )
      ? s.selectedRecommendationPlaceIds.filter((x) => x !== id)
      : [...s.selectedRecommendationPlaceIds, id],
  };
}
const limits = [0, 3, 3, 3, 3, 1, 1, 1, 4, 1, 2, 2, 1];
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
export function decode(raw: string): State {
  const x = JSON.parse(raw);
  const ids = allPlaces.map((p) => p.id);
  const list = (v: unknown): v is string[] =>
    Array.isArray(v) && v.every((t) => typeof t === "string");
  const fail = () => {
    throw Error("课堂 JSON 格式不正确");
  };
  if (
    !object(x) ||
    x.version !== 1 ||
    !Number.isInteger(x.currentPage) ||
    !Number.isInteger(x.currentStep)
  )
    return fail();
  const p = x.currentPage as number,
    k = x.currentStep as number;
  if (
    p < 1 ||
    p > 12 ||
    k < 0 ||
    k > limits[p] ||
    !list(x.discoveredPlaceIds) ||
    x.discoveredPlaceIds.some((id) => !ids.includes(id)) ||
    new Set(x.discoveredPlaceIds).size !== x.discoveredPlaceIds.length
  )
    return fail();
  const found = x.discoveredPlaceIds;
  if (
    !object(x.steps) ||
    Object.entries(x.steps).some(
      ([page, n]) =>
        !/^([1-9]|1[0-2])$/.test(page) ||
        !Number.isInteger(n) ||
        (n as number) < 0 ||
        (n as number) > limits[Number(page)],
    )
  )
    return fail();
  if (
    !object(x.mentions) ||
    Object.entries(x.mentions).some(
      ([id, n]) =>
        !found.includes(id) || !Number.isInteger(n) || (n as number) < 1,
    ) ||
    found.some((id) => !Object.hasOwn(x.mentions as object, id))
  )
    return fail();
  if (
    !object(x.placeCategories) ||
    Object.entries(x.placeCategories).some(
      ([id, tags]) =>
        !found.includes(id) ||
        !list(tags) ||
        tags.some((t) => !t.trim() || t.length > 100) ||
        new Set(tags).size !== tags.length,
    )
  )
    return fail();
  if (
    !list(x.selectedRecommendationPlaceIds) ||
    x.selectedRecommendationPlaceIds.some((id) => !found.includes(id)) ||
    new Set(x.selectedRecommendationPlaceIds).size !==
      x.selectedRecommendationPlaceIds.length
  )
    return fail();
  if (
    !Array.isArray(x.recommendations) ||
    x.recommendations.some(
      (r) =>
        !object(r) ||
        !found.includes(r.placeId as string) ||
        typeof r.type !== "string" ||
        typeof r.activity !== "string" ||
        typeof r.reason !== "string",
    )
  )
    return fail();
  if (
    !object(x.teacherSettings) ||
    ["reducedMotion", "largeFont", "quickMode"].some(
      (key) =>
        typeof (x.teacherSettings as Record<string, unknown>)[key] !==
        "boolean",
    )
  )
    return fail();
  return {
    version: 1,
    currentPage: p,
    currentStep: k,
    steps: x.steps as State["steps"],
    discoveredPlaceIds: found,
    mentions: x.mentions as State["mentions"],
    placeCategories: x.placeCategories as State["placeCategories"],
    selectedRecommendationPlaceIds: x.selectedRecommendationPlaceIds,
    recommendations: x.recommendations as State["recommendations"],
    teacherSettings: x.teacherSettings as State["teacherSettings"],
  };
}
export function load(): State {
  try {
    return decode(localStorage.getItem(KEY) || "");
  } catch {
    return initial();
  }
}
