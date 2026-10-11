import { useEffect, useState } from "react";
import {
  allPlaces,
  places,
  districts,
  categories,
  questions,
  titles,
  timings,
  cities,
  type Place,
} from "./data";
import {
  initial,
  load,
  decode,
  discover,
  tag,
  select,
  KEY,
  type State,
} from "./state";

function Media({ src, label }: { src?: string | null; label: string }) {
  const [bad, setBad] = useState(false);
  useEffect(() => setBad(false), [src]);
  return src && !bad ? (
    <img className="photo" src={src} alt={label} onError={() => setBad(true)} />
  ) : (
    <div className="placeholder" role="img" aria-label={label + "：素材待补"}>
      <span>▧</span>
      <strong>真实素材待补</strong>
      <small>{label}</small>
      <small>占位界面 · 不代表实景</small>
    </div>
  );
}
function Map({
  state,
  onPlace,
  compact = false,
}: {
  state: State;
  onPlace?: (p: Place) => void;
  compact?: boolean;
}) {
  return (
    <div className={"map-wrap " + (compact ? "compact" : "")}>
      <div className="map-note">
        示意 / 待替换 · 分区布局不代表行政边界、比例或准确坐标
      </div>
      <svg
        viewBox="0 0 900 530"
        role="img"
        aria-label="深圳地点分区示意，非精确地图"
      >
        <defs>
          <pattern
            id="dots"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1" fill="#a8c9bf" />
          </pattern>
        </defs>
        <rect width="900" height="530" fill="url(#dots)" />
        {districts.map((d, i) => {
          const x = 20 + (i % 5) * 176,
            y = 36 + Math.floor(i / 5) * 218;
          return (
            <g key={d}>
              <rect
                x={x}
                y={y}
                width="162"
                height="194"
                rx="24"
                fill="#e7eee8"
                stroke="#c5d4c9"
                strokeDasharray="5 5"
              />
              <text x={x + 16} y={y + 29} className="district-label">
                {d}
              </text>
              {places
                .filter((p) => p.districts.includes(d))
                .map((p, j) => {
                  const active = state.discoveredPlaceIds.includes(p.id),
                    px = x + 28 + (j % 2) * 70,
                    py = y + 70 + Math.floor(j / 2) * 67;
                  return (
                    <g
                      key={p.id}
                      className={active ? "map-marker active" : "map-marker"}
                      role="button"
                      tabIndex={onPlace ? 0 : undefined}
                      aria-label={active ? p.nameZh + "详情" : "未点亮地点"}
                      onClick={() => active && onPlace?.(p)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && active) onPlace?.(p);
                      }}
                    >
                      <circle
                        cx={px}
                        cy={py}
                        r={
                          active
                            ? Math.min(18, 10 + (state.mentions[p.id] || 1) * 2)
                            : 7
                        }
                        fill={active ? "#f2a646" : "#94a59e"}
                        stroke={active ? "#fff" : "none"}
                        strokeWidth="3"
                      />
                      {active && (
                        <text
                          x={px}
                          y={py + 30}
                          textAnchor="middle"
                          className="place-label"
                        >
                          {p.nameZh.length > 7
                            ? p.nameZh.slice(0, 7)
                            : p.nameZh}
                        </text>
                      )}
                    </g>
                  );
                })}
            </g>
          );
        })}
        <text x="28" y="507" className="sea-label">
          SHENZHEN · OUR SHARED DISCOVERIES
        </text>
      </svg>
      {state.discoveredPlaceIds.includes("another") && (
        <div className="another">Another Place! · 学生口头补充 · 未定位</div>
      )}
    </div>
  );
}
const stepsMax: Record<number, number> = {
  1: 3,
  2: 3,
  3: 3,
  4: 3,
  5: 1,
  6: 1,
  7: 1,
  8: 4,
  9: 1,
  10: 2,
  11: 2,
  12: 1,
};
export default function App() {
  const [s, setS] = useState<State>(load),
    [hint, setHint] = useState(0),
    [revealed, setRevealed] = useState(false),
    [clue, setClue] = useState(0),
    [district, setDistrict] = useState("全部"),
    [preview, setPreview] = useState<Place | null>(null),
    [zoom, setZoom] = useState(false),
    [extracted, setExtracted] = useState<number[]>([]),
    [customTag, setCustomTag] = useState(""),
    [notice, setNotice] = useState(""),
    [settings, setSettings] = useState(false),
    [resetPending, setResetPending] = useState(false),
    [cardLevel, setCardLevel] = useState("Standard"),
    [card, setCard] = useState({
      placeId: "",
      type: "",
      activity: "",
      reason: "",
    }),
    [planB, setPlanB] = useState(false),
    [practiceRevealed, setPracticeRevealed] = useState(false),
    [offlineReady, setOfflineReady] = useState(false);
  useEffect(() => {
    if (import.meta.env.PROD && "serviceWorker" in navigator)
      navigator.serviceWorker.ready.then(() => setOfflineReady(true));
  }, []);
  const page = s.currentPage,
    step = s.currentStep,
    city = Math.min(step, 3),
    discovered = allPlaces.filter((p) => s.discoveredPlaceIds.includes(p.id));
  useEffect(() => {
    setClue(0);
    setRevealed(false);
  }, [page, city]);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      setNotice("浏览器未允许保存，请导出 JSON 保留课堂状态。");
    }
  }, [s]);
  function go(n: number) {
    const p = Math.max(1, Math.min(12, n));
    setS((v) => ({ ...v, currentPage: p, currentStep: v.steps[p] || 0 }));
    setHint(0);
    setRevealed(false);
    setZoom(false);
  }
  function advance() {
    setS((v) => {
      const k = Math.min(v.currentStep + 1, stepsMax[v.currentPage]);
      return {
        ...v,
        currentStep: k,
        steps: { ...v.steps, [v.currentPage]: k },
      };
    });
    setRevealed(false);
  }
  useEffect(() => {
    function keyboard(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (
        ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(t.tagName) ||
        t.isContentEditable ||
        preview ||
        settings ||
        resetPending ||
        zoom
      )
        return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(page + 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(page - 1);
      }
      if (e.key === " ") {
        e.preventDefault();
        advance();
      }
      if (e.key.toLowerCase() === "h") setHint((v) => Math.min(3, v + 1));
      if (e.key.toLowerCase() === "r") setRevealed((v) => !v);
    }
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  });
  useEffect(() => {
    if (!preview && !zoom && !settings && !resetPending) return;
    const prev = document.activeElement as HTMLElement;
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    const focusables = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, [tabindex="0"]',
        ) || [],
      );
    focusables()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreview(null);
        setZoom(false);
        setSettings(false);
        setResetPending(false);
      }
      if (e.key === "Tab") {
        const a = focusables();
        if (!a.length) return;
        const first = a[0],
          last = a[a.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      prev?.focus();
    };
  }, [preview, zoom, settings, resetPending]);
  function exportState() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(s, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "shenzhen-classroom.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function setCity(n: number | ((v: number) => number)) {
    setS((v) => {
      const k = typeof n === "function" ? n(v.currentStep) : n;
      return { ...v, currentStep: k, steps: { ...v.steps, 1: k } };
    });
  }
  const q = questions[Math.min(step, 3)];
  function textbook() {
    return (
      <div className="textbook-layout">
        <div className="book">
          <img
            src={`assets/textbook/page-${q.file}.jpg`}
            alt={`用户提供教材 P${q.page}`}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              setNotice("教材图片缺失，请检查 assets/textbook。");
            }}
          />
          <button
            className="question-hotspot"
            style={q.region}
            aria-label={`放大 P${q.page} 大问题`}
            onClick={() => setZoom(true)}
          >
            ⌕ 找到问题后点击
          </button>
        </div>
        <div className="book-side">
          <span className="eyebrow">TEXTBOOK · P{q.page}</span>
          <h2>
            Look first.
            <br />
            Find the question.
          </h2>
          <p>先请学生找到 Think 问题，再点击教材上的区域。</p>
          <div className="actions">
            <button
              onClick={() => {
                setZoom(true);
              }}
            >
              放大问题
            </button>
            <button
              onClick={() => {
                setExtracted((v) => (v.includes(q.page) ? v : [...v, q.page]));
                setRevealed(true);
              }}
            >
              提取问题卡
            </button>
          </div>
          {revealed && <blockquote>{q.question}</blockquote>}
          <div className="actions">
            <button
              disabled={step === 0}
              onClick={() =>
                setS((v) => ({
                  ...v,
                  currentStep: v.currentStep - 1,
                  steps: { ...v.steps, [page]: v.currentStep - 1 },
                }))
              }
            >
              ← 前一教材页
            </button>
            <button disabled={step === 3} onClick={advance}>
              后一教材页 →
            </button>
          </div>
          <small>来源：用户上传 U6 教材扫描件；授权范围待确认。</small>
        </div>
      </div>
    );
  }
  const support =
    hint > 0 ? (
      <aside className="support" data-testid="support">
        <strong>按需支架 {hint}/3</strong>
        <p>
          {hint === 1
            ? "🏞 Places · 🍜 Food · 🎡 Activities · 🏙 Buildings"
            : hint === 2
              ? "Where can I…? / What can I…?"
              : "教师示例：Where can I see interesting buildings? / What can I do in Shenzhen?"}
        </p>
        <button onClick={() => setHint(0)}>隐藏支架 / 图片提示</button>
      </aside>
    ) : null;
  function needs() {
    return (
      <aside className="needs">
        <span className="eyebrow">VISITOR NEEDS</span>
        <h3>Listen to the evidence.</h3>
        <p>
          游客家庭人数、停留时间、孩子年龄、科技兴趣和具体问题均待原帖截图核实。
        </p>
        <p className="warning">
          没有真实证据：请学生口头提出假设并明确说 “If…”。不把假设当作 Karishma
          的原话。
        </p>
        <blockquote>
          You can go to…
          <br />
          It is a…
          <br />
          You can… there.
          <br />
          We recommend it because…
        </blockquote>
      </aside>
    );
  }
  let content;
  switch (page) {
    case 1:
      content = (
        <div className="split">
          <div>
            <span className="eyebrow">01 / NOTICE · GUESS · REVISE</span>
            <h2>
              Which city
              <br />
              could it be?
            </h2>
            <p>先猜测，再说证据；新的线索可以改变你的想法。</p>
            <div className="clue">
              <Media
                src={`assets/cities/${cities[city].name.toLowerCase().replaceAll(" ", "-")}-${clue + 1}.jpg`}
                label={cities[city].clues[clue]}
              />
            </div>
            {city !== 3 && (
              <p className="clue-text">{cities[city].clues[clue]}</p>
            )}
            <div className="actions">
              <button
                onClick={() => {
                  setClue((v) =>
                    Math.min(v + 1, cities[city].clues.length - 1),
                  );
                  setRevealed(false);
                }}
                disabled={clue === cities[city].clues.length - 1}
              >
                Next Clue
              </button>
              <button onClick={() => setRevealed(true)}>Reveal city</button>
              <button
                onClick={() => {
                  if (city === 3) go(2);
                  else {
                    setCity((v) => v + 1);
                    setClue(0);
                    setRevealed(false);
                  }
                }}
              >
                {city === 3 ? "Continue" : "Skip / Next City"}
              </button>
            </div>
          </div>
          <div className="hero">
            <span className="big-icon">⌕</span>
            {revealed ? (
              <>
                <h2>
                  {cities[city].flag} {cities[city].name}
                </h2>
                {city === 3 && (
                  <p>
                    世界之窗的复制建筑会改变我们的猜测。实拍照片待补，不能以巴黎照片替代。
                  </p>
                )}
              </>
            ) : (
              <>
                <h2>I think it is…</h2>
                <p>because I can see…</p>
              </>
            )}
            <div className="pills">
              {cities.map((c, i) => (
                <button
                  aria-label={`切换城市 ${i + 1}`}
                  key={c.name}
                  className={city === i ? "selected" : ""}
                  onClick={() => {
                    setCity(i);
                    setClue(0);
                    setRevealed(false);
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <small>图片占位不能替代正式猜图素材；补齐实拍后使用。</small>
          </div>
        </div>
      );
      break;
    case 2:
      content = (
        <>
          <div className="scenario-grid">
            {["🧳", "🌉", "🌐"]
              .slice(0, Math.min(step + 1, 3))
              .map((icon, i) => (
                <article key={icon}>
                  <span className="scenario-icon">{icon}</span>
                  <h3>
                    {
                      [
                        "More visitors can come to China now.",
                        "Shenzhen is next to Hong Kong.",
                        "Shenzhen is welcoming the world.",
                      ][i]
                    }
                  </h3>
                  <p>
                    {
                      [
                        "入境旅行便利化情境；具体政策与适用条件需课前核实。",
                        "深圳毗邻香港。",
                        "国际交流 / APEC 具体年份和事件待官方资料核实；本页不宣称未经核实事件。",
                      ][i]
                    }
                  </p>
                </article>
              ))}
          </div>
          {step >= 2 && (
            <h2 className="center">Shenzhen is welcoming the world.</h2>
          )}
          {step >= 2 && (
            <div className="process">
              <span>1 Think · 独立想</span>
              <span>2 Pair · 两人说</span>
              <span>3 Share · 全班分享</span>
            </div>
          )}
          {step >= 2 && (
            <p className="center">
              What do you want to know about Shenzhen?
              把学生的问题写在实体黑板上。
            </p>
          )}
          {support}
        </>
      );
      break;
    case 3:
    case 4:
      content = textbook();
      break;
    case 5:
      content = (
        <>
          <div className="question-grid">
            {questions.map((x) => (
              <article key={x.page}>
                <span className="eyebrow">
                  P{x.page} {extracted.includes(x.page) ? "· 已提取" : ""}
                </span>
                <h3>{x.question}</h3>
              </article>
            ))}
          </div>
          <div className="focus-question">
            <span>TODAY’S QUESTION</span>
            <h2>What interesting places can you find in Shenzhen?</h2>
            <p>
              口头对照实体黑板：哪些问题与本课有关？后续课还将探索建筑、水域与城市变化。
            </p>
          </div>
        </>
      );
      break;
    case 6:
      content = (
        <div className="discovery-layout">
          <div>
            <Map state={s} onPlace={setPreview} />
            <div className="map-stats">
              <strong>{discovered.length} places discovered</strong>
              <span>重复提及只增加提及次数，不表示票数或人数。</span>
            </div>
            {support && (
              <div className="picture-hints">
                {support}
                <Media label="无名称深圳实景提示照片，待补" />
              </div>
            )}
          </div>
          <aside className="quick">
            <span className="eyebrow">TEACHER QUICK MODE · 默认</span>
            <h3>
              Students speak.
              <br />
              Teacher lights up.
            </h3>
            <label>
              行政区筛选
              <select
                aria-label="行政区筛选"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              >
                <option>全部</option>
                {districts.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            {discovered.length > 0 && (
              <>
                <small>常用已点亮地点</small>
                <div className="recent">
                  {[...discovered]
                    .sort(
                      (a, b) =>
                        (s.mentions[b.id] || 0) - (s.mentions[a.id] || 0),
                    )
                    .slice(0, 4)
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setS((v) => discover(v, p.id))}
                      >
                        {p.nameZh}
                      </button>
                    ))}
                </div>
              </>
            )}
            <div className="quick-list">
              {districts
                .filter((d) => district === "全部" || d === district)
                .map((d) => (
                  <section key={d}>
                    <h4>{d}</h4>
                    {places
                      .filter((p) => p.districts.includes(d))
                      .map((p) => (
                        <button
                          key={p.id}
                          className={
                            s.discoveredPlaceIds.includes(p.id)
                              ? "discovered"
                              : ""
                          }
                          onClick={() => setS((v) => discover(v, p.id))}
                        >
                          <span>
                            {p.nameZh}
                            <small>{p.nameEn}</small>
                          </span>
                          <b>{s.mentions[p.id] || "＋"}</b>
                        </button>
                      ))}
                  </section>
                ))}
            </div>
            <button
              className="another-button"
              onClick={() => setS((v) => discover(v, "another"))}
            >
              ＋ Another Place!（无须输入）
            </button>
          </aside>
        </div>
      );
      break;
    case 7:
      content = (
        <>
          <h2>Your categories first.</h2>
          <p>
            先口头说自己的分类，再用按钮添加多标签。华强北是商业街区；南头古城、甘坑古镇是历史街区
            / 古镇。
          </p>
          <div className="actions">
            <input
              aria-label="学生提出的类别"
              placeholder="可选：学生提出的新类别"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
            />
            <button onClick={() => setRevealed(true)}>
              桥接教材五类 / Reveal
            </button>
          </div>
          {discovered.length === 0 ? (
            <Empty go={() => go(6)} />
          ) : (
            <div className="sort-grid">
              {discovered.map((p) => (
                <article key={p.id}>
                  <h3>{p.nameZh}</h3>
                  <p>{p.nameEn}</p>
                  <div className="tags">
                    {[
                      ...(revealed ? categories : categories.slice(5)),
                      ...(customTag.trim() ? [customTag.trim()] : []),
                    ].map((t) => (
                      <button
                        key={t}
                        aria-pressed={(s.placeCategories[p.id] || []).includes(
                          t,
                        )}
                        className={
                          (s.placeCategories[p.id] || []).includes(t)
                            ? "selected"
                            : ""
                        }
                        onClick={() => setS((v) => tag(v, p.id, t))}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <p className="sentence">It is a… / We can… there.</p>
                </article>
              ))}
            </div>
          )}
          {support}
        </>
      );
      break;
    case 8: {
      const vocab = categories.slice(0, 5),
        examples = [
          "大鹏所城内历史建筑（具体建筑待核实）",
          "平安金融中心",
          "欢乐谷",
          "深圳美术馆（龙华新馆，馆址待官方复核）",
          "COCO Park（福田）",
        ];
      content = (
        <div className="vocab-layout">
          <div>
            <span className="eyebrow">GUESS → REVEAL → USE</span>
            <Media label={examples[step]} />
            <h3>{examples[step]}</h3>
            {revealed ? (
              <h2>{vocab[step]}</h2>
            ) : (
              <h2>What kind of place is it?</h2>
            )}
            <div className="actions">
              <button onClick={() => setRevealed(true)}>Reveal word</button>
              <button disabled={step === 4} onClick={advance}>
                Next word
              </button>
            </div>
            <blockquote>It is a… / We can… there.</blockquote>
            <p>
              再次描述我们点亮的地点：
              {discovered.map((p) => p.nameZh).join("、") ||
                "先去 P06 激活学生经验。"}
            </p>
          </div>
          <div>
            <span className="eyebrow">P62 B · READ AND COMPLETE</span>
            <img
              className="practice-page"
              src="assets/textbook/page-02.jpg"
              alt="真实教材 P62 B 三道填空"
            />
            <ol>
              <li>
                The Xi’an Bell Tower is a{" "}
                {practiceRevealed ? (
                  <strong>historic building</strong>
                ) : (
                  "________"
                )}
                . It has a history of over 600 years.
              </li>
              <li>
                The Canton Tower is a{" "}
                {practiceRevealed ? (
                  <strong>modern building</strong>
                ) : (
                  "________"
                )}
                . It is about 600 metres tall.
              </li>
              <li>
                The China Art Museum is a{" "}
                {practiceRevealed ? <strong>art gallery</strong> : "________"}.
                It is a quiet place for art lovers.
              </li>
            </ol>
            <button onClick={() => setPracticeRevealed((v) => !v)}>
              显示 / 隐藏教材答案
            </button>
          </div>
        </div>
      );
      break;
    }
    case 9:
      content = (
        <div className="split">
          <div>
            <span className="eyebrow">REAL VISITOR · KARISHMA</span>
            <Media
              src="assets/visitor/karishma-full-post.png"
              label="Tripadvisor 全帖上下文截图；家庭信息待核实"
            />
            <p className="warning">
              原帖截图缺失：不提供编造引语、人数、年龄或停留时间。
            </p>
            <a
              href="https://www.tripadvisor.com/ShowTopic-g294211-i642-k15565909-First_trip_itinerary_help-China.html"
              target="_blank"
              rel="noreferrer"
            >
              原帖来源（联网可选；核心课堂不依赖它）
            </a>
            <p>补入完整截图后可点击放大，保留上下文。</p>
            <button
              onClick={() =>
                setPreview({
                  ...allPlaces[0],
                  nameZh: "Karishma 原帖完整截图",
                  image: "assets/visitor/karishma-full-post.png",
                })
              }
            >
              放大原帖截图
            </button>
          </div>
          <div>
            <div className="scenario-icon">👨‍👩‍👧‍👦　📅　🤖</div>
            <h2>
              What do they
              <br />
              want to know?
            </h2>
            <ul className="questions">
              <li>How many people are there in this family?</li>
              <li>What does the boy want to know?</li>
              <li>What does Karishma want to know?</li>
            </ul>
            <p>
              当前全部待核实。可转为明确标注的假设讨论：If visitors like
              technology, where can they go?
            </p>
            {support}
          </div>
        </div>
      );
      break;
    case 10:
      content = (
        <>
          <div className="process">
            <span className={step === 0 ? "selected" : ""}>Think</span>
            <span className={step === 1 ? "selected" : ""}>Pair</span>
            <span className={step === 2 ? "selected" : ""}>Group</span>
          </div>
          <div className="choice-layout">
            {needs()}
            <div>
              <Map state={s} compact />
              {discovered.length === 0 ? (
                <Empty go={() => go(6)} />
              ) : (
                <div className="choice-grid">
                  {discovered.map((p) => (
                    <button
                      key={p.id}
                      className={
                        s.selectedRecommendationPlaceIds.includes(p.id)
                          ? "selected"
                          : ""
                      }
                      aria-pressed={s.selectedRecommendationPlaceIds.includes(
                        p.id,
                      )}
                      onClick={() => setS((v) => select(v, p.id))}
                    >
                      {p.nameZh}
                      <small>{p.nameEn}</small>
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => {
                  setS((v) => discover(v, "another"));
                }}
              >
                补充库外地点 · Another Place!
              </button>
              <p>没有唯一正确答案。先口头选择并解释理由，再由教师点选展示。</p>
            </div>
          </div>
          {support}
        </>
      );
      break;
    case 11:
      content = (
        <div className="card-layout">
          <div>
            <span className="eyebrow">PAPER FIRST · GROUP TASK</span>
            <h2>Make a recommendation.</h2>
            <p>每组至少一张纸质推荐卡。电子卡仅为投屏示范，无须逐组录入。</p>
            <div className="actions">
              {["Basic", "Standard", "Challenge"].map((l) => (
                <button
                  key={l}
                  className={cardLevel === l ? "selected" : ""}
                  onClick={() => setCardLevel(l)}
                >
                  {l}
                </button>
              ))}
            </div>
            <blockquote>
              {cardLevel === "Basic"
                ? "Place: ___ / Type: ___ / We can ___ / Because ___"
                : cardLevel === "Standard"
                  ? "You can go to… It is a… You can… there. We recommend it because…"
                  : "Use your own words. Compare Plan A and Plan B for different needs."}
            </blockquote>
            <p>
              展示候选：
              {s.selectedRecommendationPlaceIds
                .map((id) => allPlaces.find((p) => p.id === id)?.nameZh)
                .join("、") || "未点选：可以口头选择，照常进行纸质任务。"}
            </p>
            <button onClick={() => setPlanB((v) => !v)}>
              {planB ? "收起" : "提前完成？比较 Plan A / Plan B"}
            </button>
            {planB && (
              <p>
                Plan A: ___ / Plan B: ___
                <br />
                Which plan fits their needs better? Why?
              </p>
            )}
            <h3>Peer feedback</h3>
            <p>✓ 地点清晰　✓ 匹配需求　✓ 推荐理由　✓ 英语可理解</p>
            <button onClick={() => window.print()}>打印空白小组推荐卡</button>
          </div>
          <form
            className="recommendation-card"
            onSubmit={(e) => {
              e.preventDefault();
              if (
                !card.placeId ||
                !card.type.trim() ||
                !card.activity.trim() ||
                !card.reason.trim()
              ) {
                setNotice("示范卡请填写四项；纸质任务不受影响。");
                return;
              }
              setS((v) => ({
                ...v,
                recommendations: [...v.recommendations, { ...card }],
              }));
              setNotice("已保存投屏示范卡。");
            }}
          >
            <span className="eyebrow">OPTIONAL · SCREEN EXAMPLE</span>
            <label>
              Place
              <select
                aria-label="Place"
                value={card.placeId}
                onChange={(e) => setCard({ ...card, placeId: e.target.value })}
              >
                <option value="">选择已点亮地点</option>
                {discovered.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nameZh} / {p.nameEn}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Type
              <input
                aria-label="Type"
                value={card.type}
                onChange={(e) => setCard({ ...card, type: e.target.value })}
              />
            </label>
            <label>
              What visitors can do
              <textarea
                aria-label="What visitors can do"
                value={card.activity}
                onChange={(e) => setCard({ ...card, activity: e.target.value })}
              />
            </label>
            <label>
              Why we recommend it
              <textarea
                aria-label="Why we recommend it"
                value={card.reason}
                onChange={(e) => setCard({ ...card, reason: e.target.value })}
              />
            </label>
            <button type="submit">保存一张示范卡（可跳过）</button>
          </form>
        </div>
      );
      break;
    case 12:
      content = (
        <div className="reflection">
          <div>
            <Map state={s} compact />
            <div className="summary-tags">
              {discovered.map((p) => (
                <span key={p.id}>
                  {p.nameZh}
                  <small>
                    {(s.placeCategories[p.id] || []).join(" · ") ||
                      "学生口头描述"}
                  </small>
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="eyebrow">TODAY’S DISCOVERIES</span>
            <h2>What interesting places can you find in Shenzhen?</h2>
            <blockquote>
              A city has many interesting places for different people.
            </blockquote>
            <p>
              推荐方案：
              {s.selectedRecommendationPlaceIds
                .map((id) => allPlaces.find((p) => p.id === id)?.nameZh)
                .join("、") || "口头与纸质推荐卡展示"}
            </p>
            {s.recommendations.map((r, i) => (
              <article key={i}>
                <h3>{allPlaces.find((p) => p.id === r.placeId)?.nameEn}</h3>
                <p>
                  {r.type} · {r.activity}
                </p>
                <p>Because {r.reason}</p>
              </article>
            ))}
            <p>
              下一课：建筑、水域、过去与现在。今天完成的是本课探索，单元还在继续。
            </p>
            <button onClick={exportState}>导出本课发现 JSON</button>
          </div>
        </div>
      );
      break;
  }
  return (
    <div
      className={`app ${s.teacherSettings.largeFont ? "large-font" : ""} ${s.teacherSettings.reducedMotion ? "reduce-motion" : ""}`}
    >
      <header>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go(1);
          }}
        >
          <span className="brand-mark">深</span>
          <span>
            SHENZHEN<small>CITY EXPLORER · UNIT 6</small>
          </span>
        </a>
        <div className="header-right">
          <span>
            GRADE 6 · 40 MIN{" "}
            <small className="offline-status">
              {offlineReady ? "离线缓存就绪" : "本地资源 · 无 CDN"}
            </small>
          </span>
          <button onClick={() => setSettings(true)} aria-label="课堂设置">
            ⚙ 设置
          </button>
        </div>
      </header>
      <nav className="page-nav" aria-label="教学页面">
        {titles.map((t, i) => (
          <button
            key={t}
            aria-label={`P${String(i + 1).padStart(2, "0")} ${t}`}
            aria-current={page === i + 1 ? "page" : undefined}
            className={page === i + 1 ? "current" : ""}
            onClick={() => go(i + 1)}
          >
            {String(i + 1).padStart(2, "0")}
          </button>
        ))}
      </nav>
      <main>
        <div className="page-heading">
          <div>
            <span className="eyebrow">
              P{String(page).padStart(2, "0")} · {timings[page - 1]}
            </span>
            <h1>{titles[page - 1]}</h1>
          </div>
          <span className="lesson-label">学生先表达 · 课件后支持</span>
        </div>
        {content}
      </main>
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button onClick={() => setNotice("")}>关闭</button>
        </div>
      )}
      <footer>
        <div>
          <span className="page-count">
            {String(page).padStart(2, "0")} / 12
          </span>
          <button onClick={() => go(page - 1)} disabled={page === 1}>
            ← Back
          </button>
          <button onClick={() => go(page + 1)} disabled={page === 12}>
            Next →
          </button>
        </div>
        <div>
          <button
            onClick={() => {
              if (page === 1) {
                setClue((v) => Math.min(v + 1, cities[city].clues.length - 1));
                setRevealed(false);
              } else advance();
            }}
          >
            Step {step + 1}
          </button>
          <button onClick={() => setHint((v) => Math.min(3, v + 1))}>
            Hint
          </button>
          <button onClick={() => setRevealed((v) => !v)}>Reveal</button>
          <button onClick={() => go(page + 1)} disabled={page === 12}>
            Skip
          </button>
          <button
            onClick={() => {
              if (document.fullscreenElement)
                document
                  .exitFullscreen()
                  .catch(() => setNotice("退出全屏失败"));
              else
                document.documentElement
                  .requestFullscreen?.()
                  .catch(() => setNotice("浏览器不支持全屏，请使用 F11。"));
            }}
          >
            Fullscreen
          </button>
        </div>
      </footer>
      {preview && (
        <div className="overlay">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="素材预览"
          >
            <button className="close" onClick={() => setPreview(null)}>
              关闭 ×
            </button>
            <h2>{preview.nameZh}</h2>
            <Media src={preview.image} label={preview.nameEn} />
            <p>当前仅静态照片接口；未提供真实 360 媒体，不标称 360。</p>
            <small>
              {preview.source} · {preview.license}
            </small>
          </section>
        </div>
      )}
      {zoom && (
        <div className="overlay">
          <section
            className="modal book-zoom"
            role="dialog"
            aria-modal="true"
            aria-label="教材问题放大"
          >
            <button onClick={() => setZoom(false)}>缩回教材 ×</button>
            <div
              className="crop"
              style={{
                height: "auto",
                aspectRatio: `${parseFloat(q.region.width) * 990}/${parseFloat(q.region.height) * 1400}`,
              }}
            >
              <img
                src={`assets/textbook/page-${q.file}.jpg`}
                alt={`P${q.page} 原教材问题区域`}
                style={{
                  width: `${(100 / parseFloat(q.region.width)) * 100}%`,
                  left: `-${(parseFloat(q.region.left) / parseFloat(q.region.width)) * 100}%`,
                  top: `-${(parseFloat(q.region.top) / parseFloat(q.region.height)) * 100}%`,
                }}
              />
            </div>
            <blockquote>{q.question}</blockquote>
            <button
              onClick={() => {
                setExtracted((v) => (v.includes(q.page) ? v : [...v, q.page]));
                setRevealed(true);
                setZoom(false);
              }}
            >
              提取问题卡并返回
            </button>
          </section>
        </div>
      )}
      {settings && (
        <div className="overlay">
          <section
            className="modal settings"
            role="dialog"
            aria-modal="true"
            aria-label="课堂设置"
          >
            <button className="close" onClick={() => setSettings(false)}>
              关闭 ×
            </button>
            <h2>课堂设置</h2>
            <p>状态自动保存在当前浏览器。无需学生设备或手机。</p>
            {(["reducedMotion", "largeFont"] as const).map((k, i) => (
              <label key={k}>
                <input
                  type="checkbox"
                  checked={s.teacherSettings[k]}
                  onChange={(e) =>
                    setS((v) => ({
                      ...v,
                      teacherSettings: {
                        ...v.teacherSettings,
                        [k]: e.target.checked,
                      },
                    }))
                  }
                />
                {["减少动画", "较大字体"][i]}
              </label>
            ))}
            <div className="actions">
              <button onClick={exportState}>导出 JSON</button>
              <label className="import">
                恢复 JSON
                <input
                  aria-label="恢复 JSON"
                  type="file"
                  accept="application/json"
                  onChange={async (e) => {
                    try {
                      const f = e.target.files?.[0];
                      if (f) {
                        setS(decode(await f.text()));
                        setNotice("课堂状态已恢复。");
                      }
                    } catch {
                      setNotice("无法恢复：JSON 不符合课堂状态格式。");
                    }
                  }}
                />
              </label>
              <button
                onClick={() => {
                  setSettings(false);
                  setResetPending(true);
                }}
              >
                重置课堂
              </button>
            </div>
            <p>
              LAN 手机遥控未启用；本版本只使用一体机操作。未核实素材均明确标记。
            </p>
          </section>
        </div>
      )}
      {resetPending && (
        <div className="overlay">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="重置确认"
          >
            <h2>重置本课记录？</h2>
            <p>清空点亮地点、分类、推荐与页面进度。请先导出需要保留的 JSON。</p>
            <div className="actions">
              <button onClick={() => setResetPending(false)}>取消</button>
              <button
                onClick={() => {
                  setS(initial());
                  setCity(0);
                  setClue(0);
                  setHint(0);
                  setRevealed(false);
                  setExtracted([]);
                  setPracticeRevealed(false);
                  setPlanB(false);
                  setCard({ placeId: "", type: "", activity: "", reason: "" });
                  setResetPending(false);
                  setNotice("课堂状态已重置。");
                }}
              >
                确认重置
              </button>
            </div>
          </section>
        </div>
      )}
      <div className="print-card">
        <h1>Shenzhen City Explorer · Group Recommendation</h1>
        <p>Group: __________　Plan A / Plan B</p>
        {["Place", "Type", "What visitors can do", "Why we recommend it"].map(
          (t) => (
            <div key={t}>
              <h2>{t}</h2>
              <p>________________________________________________</p>
              <p>________________________________________________</p>
            </div>
          ),
        )}
        <p>
          Feedback: □ clear place □ fits needs □ reason □ understandable English
        </p>
      </div>
    </div>
  );
}
function Empty({ go }: { go: () => void }) {
  return (
    <div className="empty">
      <h3>等待学生的真实发现</h3>
      <p>尚未点亮任何地点，不填入虚构的课堂反馈。</p>
      <button onClick={go}>去 P06 点亮地点</button>
    </div>
  );
}
