import { describe, it, expect } from "vitest";
import {
  cityClueIndices,
  tilePosition,
  vocabPlaceIndices,
} from "./illustrations";
import { places } from "./data";
import { localMediaPath } from "./MediaViewer";
import { clampPitch } from "./Panorama";
describe("illustration and source contracts", () => {
  it("maps all cities and all fifteen places to available tiles", () => {
    expect(cityClueIndices.map((a) => a.length)).toEqual([3, 3, 3, 4]);
    expect(places.every((p, i) => p.illustration?.index === i)).toBe(true);
    [...cityClueIndices.flat(), ...vocabPlaceIndices].forEach((i) =>
      expect(() => tilePosition(i)).not.toThrow(),
    );
  });
  it("does not turn generated illustrations into verified photos or coordinates", () => {
    expect(
      places.every(
        (p) =>
          p.coordinates === null &&
          p.image === null &&
          p.panorama === null &&
          p.panoramaVerified !== true &&
          p.verificationStatus === "pending",
      ),
    ).toBe(true);
  });
  it("rejects remote URLs and directory traversal for offline video and panorama", () => {
    expect(localMediaPath("assets/places/photo.jpg")).toBe(true);
    for (const path of [
      "https://site.example/video.mp4",
      "//site.example/image.jpg",
      "assets/../outside.jpg",
      "javascript:alert(1)",
      null,
    ])
      expect(localMediaPath(path)).toBe(false);
  });
  it("caps rotation pitch to prevent flipping the view", () => {
    expect(clampPitch(-90)).toBe(-75);
    expect(clampPitch(120)).toBe(75);
    expect(clampPitch(30)).toBe(30);
  });
});
