import { describe, it, expect } from "vitest";
import { initial, discover, tag, select, decode } from "./state";
import { places, districts, questions } from "./data";
describe("classroom state", () => {
  it("repeated mentions keep one marker and increment mentions", () => {
    let s = initial();
    for (let i = 0; i < 20; i++) s = discover(s, "window");
    expect(s.discoveredPlaceIds).toEqual(["window"]);
    expect(s.mentions.window).toBe(20);
  });
  it("never invents unknown place ids", () =>
    expect(discover(initial(), "fake")).toEqual(initial()));
  it("allows multiple categories including student categories", () => {
    let s = discover(initial(), "nantou");
    s = tag(tag(s, "nantou", "historic place"), "nantou", "our memories");
    expect(s.placeCategories.nantou).toEqual([
      "historic place",
      "our memories",
    ]);
    expect(tag(s, "nantou", "historic place").placeCategories.nantou).toEqual([
      "our memories",
    ]);
  });
  it("uses discovered ids for recommendations only", () => {
    expect(select(initial(), "window").selectedRecommendationPlaceIds).toEqual(
      [],
    );
    const s = select(discover(initial(), "window"), "window");
    expect(s.selectedRecommendationPlaceIds).toEqual(["window"]);
    expect(select(s, "window").selectedRecommendationPlaceIds).toEqual([]);
  });
  it("round trips the entire lesson including recommendations", () => {
    let s = select(
      tag(discover(initial(), "window"), "window", "amusement park"),
      "window",
    );
    s.recommendations = [
      {
        placeId: "window",
        type: "amusement park",
        activity: "see replicas",
        reason: "learn about the world",
      },
    ];
    expect(decode(JSON.stringify(s))).toEqual(s);
  });
  it("rejects invalid and foreign JSON", () => {
    expect(() => decode("{}")).toThrow();
    expect(() =>
      decode(JSON.stringify({ ...initial(), currentPage: 13 })),
    ).toThrow();
    expect(() =>
      decode(JSON.stringify({ ...initial(), discoveredPlaceIds: ["fake"] })),
    ).toThrow();
    expect(() =>
      decode(
        JSON.stringify({
          ...initial(),
          discoveredPlaceIds: ["window", "window"],
        }),
      ),
    ).toThrow();
  });
  it("reset creates a fresh, empty classroom", () => {
    const s = initial();
    discover(s, "window");
    expect(initial().discoveredPlaceIds).toEqual([]);
    expect(initial().recommendations).toEqual([]);
  });
});
describe("source and data safeguards", () => {
  it("covers ten districts without inventing geographic coordinates", () => {
    expect(new Set(places.map((p) => p.district)).size).toBe(districts.length);
    expect(
      places.every(
        (p) => p.coordinates === null && p.verificationStatus === "pending",
      ),
    ).toBe(true);
  });
  it("does not describe historic areas or shopping streets as single buildings", () => {
    for (const id of ["nantou", "gankeng", "huaqiang"])
      expect(places.find((p) => p.id === id)?.textbookCategory).toBeNull();
  });
  it("preserves four questions checked from supplied textbook pages", () =>
    expect(questions.map((q) => q.page)).toEqual([62, 66, 68, 72]));
});
describe("safe recovery", () => {
  it("rejects malformed saved steps and settings instead of crashing navigation", () => {
    for (const field of [
      { steps: null },
      { steps: { 6: 999 } },
      { teacherSettings: {} },
      { mentions: { window: -1 } },
      { discoveredPlaceIds: ["window"], mentions: {} },
    ])
      expect(() =>
        decode(JSON.stringify({ ...initial(), ...field })),
      ).toThrow();
  });
});
