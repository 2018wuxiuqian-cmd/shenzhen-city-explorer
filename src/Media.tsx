import { useEffect, useState } from "react";
import {
  sheets,
  tilePosition,
  generationDisclosure,
  type Illustration,
} from "./illustrations";
export function Placeholder({ label }: { label: string }) {
  return (
    <div className="placeholder" role="img" aria-label={label + "：素材待补"}>
      <span>▧</span>
      <strong>真实素材待补</strong>
      <small>{label}</small>
      <small>占位界面 · 不代表实景</small>
    </div>
  );
}
export function IllustratedMedia({
  illustration,
  label,
}: {
  illustration: Illustration;
  label: string;
}) {
  const [bad, setBad] = useState(false);
  useEffect(() => setBad(false), [illustration.sheet, illustration.index]);
  if (bad) return <Placeholder label={label} />;
  return (
    <figure className="illustrated-media">
      <div className="atlas-tile">
        <img
          className="atlas-image"
          src={sheets[illustration.sheet]}
          alt={label + "（AI 生成插画，非实拍）"}
          style={tilePosition(illustration.index)}
          onError={() => setBad(true)}
        />
      </div>
      <figcaption>{generationDisclosure}</figcaption>
    </figure>
  );
}
export default function Media({
  src,
  label,
  illustration,
}: {
  src?: string | null;
  label: string;
  illustration?: Illustration | null;
}) {
  const [bad, setBad] = useState(false);
  useEffect(() => setBad(false), [src]);
  if (src && !bad)
    return (
      <img
        className="photo"
        src={src}
        alt={label}
        onError={() => setBad(true)}
      />
    );
  if (illustration)
    return <IllustratedMedia illustration={illustration} label={label} />;
  return <Placeholder label={label} />;
}
