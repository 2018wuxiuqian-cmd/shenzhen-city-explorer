import { useCallback, useState } from "react";
import type { Place } from "./data";
import Media from "./Media";
import Panorama from "./Panorama";
export function localMediaPath(path: string | null | undefined) {
  return (
    !!path &&
    /^assets\/[A-Za-z0-9_\-./\u4e00-\u9fff ]+$/.test(path) &&
    !path.split("/").includes("..")
  );
}
export default function MediaViewer({ place }: { place: Place }) {
  const [mode, setMode] = useState<"photo" | "video" | "panorama">("photo"),
    [scale, setScale] = useState(1),
    [highlight, setHighlight] = useState(false),
    [point, setPoint] = useState<{ x: number; y: number } | null>(null),
    [error, setError] = useState("");
  const unavailable = useCallback(() => {
    setMode("photo");
    setError("全景不可用或图片不是 2:1 球面格式，已回退静态素材。");
  }, []);
  const panoramaReady =
    place.panoramaVerified === true && localMediaPath(place.panorama);
  return (
    <div className="media-viewer">
      <div className="actions">
        <button
          aria-pressed={mode === "photo"}
          onClick={() => setMode("photo")}
        >
          静态素材
        </button>
        {localMediaPath(place.video) && (
          <button
            aria-pressed={mode === "video"}
            onClick={() => {
              setError("");
              setMode("video");
            }}
          >
            播放本地短视频
          </button>
        )}
        {panoramaReady && (
          <button
            aria-pressed={mode === "panorama"}
            onClick={() => {
              setError("");
              setMode("panorama");
            }}
          >
            查看已核验 360 全景
          </button>
        )}
      </div>
      {mode === "video" ? (
        <video
          controls
          preload="metadata"
          src={place.video!}
          aria-label="按需播放本地短视频"
          onError={() => {
            setMode("photo");
            setError("视频加载失败，已回退静态素材。");
          }}
        />
      ) : mode === "panorama" ? (
        <Panorama src={place.panorama!} onUnavailable={unavailable} />
      ) : (
        <>
          <div className="media-scroll">
            <div
              className={"media-stage " + (highlight ? "highlight-mode" : "")}
              style={{ width: `${scale * 100}%` }}
              onClick={(e) => {
                if (!highlight) return;
                const rect = e.currentTarget.getBoundingClientRect();
                setPoint({
                  x: ((e.clientX - rect.left) / rect.width) * 100,
                  y: ((e.clientY - rect.top) / rect.height) * 100,
                });
              }}
            >
              <Media
                src={place.image}
                illustration={place.illustration}
                label={place.nameEn}
              />
              {point && (
                <span
                  className="media-highlight"
                  aria-label="教师手动高亮区域"
                  style={{ left: point.x + "%", top: point.y + "%" }}
                />
              )}
            </div>
          </div>
          <div className="actions">
            <label>
              局部放大
              <input
                aria-label="素材缩放"
                type="range"
                min="1"
                max="3"
                step="0.25"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
              />
            </label>
            <button
              aria-pressed={highlight}
              onClick={() => setHighlight((v) => !v)}
            >
              手动高亮
            </button>
            <button
              onClick={() => {
                setScale(1);
                setPoint(null);
                setHighlight(false);
              }}
            >
              还原完整素材
            </button>
          </div>
          <small>先看完整上下文，再按需放大。高亮不改写原图。</small>
        </>
      )}
      {error && (
        <p role="status" className="warning">
          {error}
        </p>
      )}
      {!panoramaReady && (
        <p>真实 360 媒体尚未核验或未提供；当前可查看静态素材。</p>
      )}
      {place.illustration && (
        <p>生成插画用于教学提示，不证明现场细节或准确位置。</p>
      )}
    </div>
  );
}
