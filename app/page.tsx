"use client";

import { useMemo, useState } from "react";

/* =====================
   数秘術ユーティリティ
===================== */

const VOWELS = new Set(["A", "E", "I", "O", "U"]); // Yは母音に含めない流派

const letterValue = (ch: string): number => {
  const code = ch.charCodeAt(0);
  if (code < 65 || code > 90) return 0;
  // Pythagorean: A=1..I=9, J=1..R=9, S=1..Z=8
  return ((code - 65) % 9) + 1;
};

const sumDigits = (n: number): number =>
  n
    .toString()
    .split("")
    .reduce((a, b) => a + Number(b), 0);

// マスターナンバー保持（11/22/33で止める）
const reduceCore = (n: number): number => {
  while (n > 9 && ![11, 22, 33].includes(n)) {
    n = sumDigits(n);
  }
  return n;
};

// 1桁化（マスター保持なし）
const reduceSingle = (n: number): number => {
  while (n > 9) n = sumDigits(n);
  return n;
};

const isValidDate = (y: number, m: number, d: number): boolean => {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;

  // JS Dateで実在日付チェック（うるう年含む）
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
};

const parseDate = (v: string): { y: number; m: number; d: number } | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const [y, m, d] = v.split("-").map(Number);
  if (!isValidDate(y, m, d)) return null;
  return { y, m, d };
};

/* =====================
   UI
===================== */

function NumCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-4 text-center",
        highlight ? "border-pink-300 bg-pink-50" : "border-amber-200 bg-white",
      ].join(" ")}
    >
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-extrabold">{value || "-"}</div>
    </div>
  );
}

function Chip({
  children,
  pink = false,
}: {
  children: React.ReactNode;
  pink?: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-xs",
        pink
          ? "border-pink-200 bg-pink-50 text-pink-700"
          : "border-slate-200 bg-slate-50 text-slate-600",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function KeyValueRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3 py-2 border-b border-slate-200">
      <div className="text-sm font-semibold text-slate-800">{k}</div>
      <div className="text-sm text-slate-700 leading-relaxed">{v}</div>
    </div>
  );
}

/* =====================
   Page
===================== */

type Result = {
  d: { y: number; m: number; d: number };

  // core numbers
  lifePath: number; // LP
  destiny: number; // DP
  soul: number; // SP
  personality: number; // PN
  maturity: number; // MP

  // life path steps
  yCore: number;
  mCore: number;
  dCore: number;

  // name sums (before reduction)
  letters: string;
  destinySum: number;
  soulSum: number;
  personalitySum: number;

  // intensity (name-based)
  intensityDigits: string; // digits used (name letters -> values -> concatenated)
  counts: Record<number, number>;
  strong: number[];
  missing: number[];

  // cycles
  mmRaw: number; // month raw (1-12)
  ddRaw: number; // day raw (1-31)
  yyRaw: number; // year raw (YYYY)
  pinnacles: [number, number, number, number];
  challenges: [number, number, number, number];
  end1: number;
  ages: [string, string, string, string];
};

export default function SinglePage() {
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");

  const result: Result | null = useMemo(() => {
    const d = parseDate(birth);
    if (!d) return null;

    // LP steps（従来どおり：年/月/日を reduceCore して足す）
    const yCore = reduceCore(d.y);
    const mCore = reduceCore(d.m);
    const dCore = reduceCore(d.d);
    const lifePath = reduceCore(yCore + mCore + dCore);

    // name-based sums
    const letters = name.toUpperCase().replace(/[^A-Z]/g, "");
    let destinySum = 0;
    let soulSum = 0;
    let personalitySum = 0;

    // インテンシティ（名前由来）用：各文字の数値（1-9）を並べた文字列
    let nameDigits = "";

    for (const ch of letters) {
      const v = letterValue(ch);
      if (v <= 0) continue;

      destinySum += v;
      nameDigits += String(v);

      if (VOWELS.has(ch)) soulSum += v;
      else personalitySum += v;
    }

    const destiny = reduceCore(destinySum);
    const soul = reduceCore(soulSum);
    const personality = reduceCore(personalitySum);
    const maturity = reduceCore(lifePath + destiny);

    // intensity (name-based)
    const counts: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
      8: 0,
      9: 0,
    };

    const intensityDigits = nameDigits;

    intensityDigits.split("").forEach((n) => {
      const num = Number(n);
      if (num >= 1 && num <= 9) counts[num]++;
    });

    const strong = Object.keys(counts)
      .map(Number)
      .filter((n) => counts[n] >= 3);

    const missing = Object.keys(counts)
      .map(Number)
      .filter((n) => counts[n] === 0);

    // =====================
    // 4つの時期（未縮約で計算）
    // =====================
    const mmRaw = d.m; // 1-12
    const ddRaw = d.d; // 1-31
    const yyRaw = d.y; // YYYY

    // ピナクル（未縮約 -> マスター保持で縮約）
    // P1 = 月 + 日
    // P2 = 日 + 年
    // P3 = P1 + P2
    // P4 = 月 + 年
    const p1 = reduceCore(mmRaw + ddRaw);
    const p2 = reduceCore(ddRaw + yyRaw);
    const p3 = reduceCore(p1 + p2);
    const p4 = reduceCore(mmRaw + yyRaw);

    const pinnacles: [number, number, number, number] = [p1, p2, p3, p4];

    // チャレンジ（未縮約の差 -> マスター保持で縮約）
    // C1 = |月 - 日|
    // C2 = |日 - 年|
    // C3 = |C1 - C2|
    // C4 = |月 - 年|
    const c1 = reduceCore(Math.abs(mmRaw - ddRaw));
    const c2 = reduceCore(Math.abs(ddRaw - yyRaw));
    const c3 = reduceCore(Math.abs(c1 - c2));
    const c4 = reduceCore(Math.abs(mmRaw - yyRaw));

    const challenges: [number, number, number, number] = [c1, c2, c3, c4];

    // 年齢帯（ここは従来通り：LPを1桁化して使う）
    const end1 = 36 - reduceSingle(lifePath);
    const ages: [string, string, string, string] = [
      `0〜${end1}`,
      `${end1 + 1}〜${end1 + 9}`,
      `${end1 + 10}〜${end1 + 18}`,
      `${end1 + 19}〜`,
    ];

    return {
      d,
      lifePath,
      destiny,
      soul,
      personality,
      maturity,
      yCore,
      mCore,
      dCore,
      letters,
      destinySum,
      soulSum,
      personalitySum,
      intensityDigits,
      counts,
      strong,
      missing,
      mmRaw,
      ddRaw,
      yyRaw,
      pinnacles,
      challenges,
      end1,
      ages,
    };
  }, [name, birth]);

  const nameLabel = name.trim() ? name : "—";
  const birthLabel = birth ? birth : "—";

  return (
    <div className="min-h-screen bg-white px-2 sm:px-4 lg:px-6 py-10">
      <div className="mx-auto max-w-screen-2xl">
        {/* 画面用ヘッダー（印刷では非表示） */}
        <div className="print-hidden flex items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold">数秘術 計算ページ</h1>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl border px-4 py-2 text-sm font-semibold"
          >
            印刷する
          </button>
        </div>

        {/* 入力欄（印刷では非表示） */}
        <div className="print-hidden grid sm:grid-cols-2 gap-4 mb-8">
          <input
            className="rounded-xl border px-4 py-3"
            placeholder="名前（英字推奨）"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="date"
            className="rounded-xl border px-4 py-3"
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
          />
        </div>

        {/* 印刷物に載せる：名前・生年月日（画面でも表示してOK） */}
        <div className="mb-6 print-avoid-inside">
          <div className="text-xl font-bold">数秘術 計算結果</div>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div className="rounded-xl border px-4 py-3">
              <div className="text-xs text-slate-500">名前</div>
              <div className="mt-1 font-semibold">{nameLabel}</div>
            </div>
            <div className="rounded-xl border px-4 py-3">
              <div className="text-xs text-slate-500">生年月日</div>
              <div className="mt-1 font-semibold">{birthLabel}</div>
            </div>
          </div>
        </div>

        {/* 1ページ目：結果（印刷対象） */}
        <div className="grid gap-8 lg:grid-cols-2 items-start print-grid">
          {/* 左：十字（北=PN 西=LP 中央=DP 東=MP 南=SP） */}
          <div className="print-avoid-inside">
            <h2 className="font-bold mb-4">主要ナンバー（十字）</h2>

            <div className="grid grid-cols-3 gap-4">
              <div />
              <NumCard label="PN (Personality)" value={result?.personality ?? 0} />
              <div />

              <NumCard label="LP (Life Path)" value={result?.lifePath ?? 0} highlight />
              <NumCard label="DP (Destiny)" value={result?.destiny ?? 0} />
              <NumCard label="MP (Maturity)" value={result?.maturity ?? 0} />

              <div />
              <NumCard label="SP (Soul)" value={result?.soul ?? 0} />
              <div />
            </div>
          </div>

          {/* 右：インテンシティ + 4つの時期 */}
          <div className="space-y-8">
            {/* インテンシティ */}
            <div className="print-avoid-inside">
              <h2 className="font-bold mb-3">インテンシティ（名前ベース）</h2>

              <div className="grid grid-cols-9 gap-2 mb-4">
                {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                  <div key={n} className="rounded-lg border p-2 text-center">
                    <div className="text-xs text-slate-500">#{n}</div>
                    <div className="font-bold">{result?.counts[n] ?? 0}</div>
                  </div>
                ))}
              </div>

              <div className="mb-2">
                <div className="font-semibold mb-1">強いエネルギー（3回以上）</div>
                <div className="flex gap-2 flex-wrap">
                  {result?.strong.length ? (
                    result.strong.map((n) => (
                      <Chip key={`strong-${n}`} pink>
                        {n}
                      </Chip>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">なし</span>
                  )}
                </div>
              </div>

              <div>
                <div className="font-semibold mb-1">欠けているエネルギー（0回）</div>
                <div className="flex gap-2 flex-wrap">
                  {result?.missing.length ? (
                    result.missing.map((n) => <Chip key={`miss-${n}`}>{n}</Chip>)
                  ) : (
                    <span className="text-sm text-slate-500">なし</span>
                  )}
                </div>
              </div>
            </div>

            {/* 4つの時期：横スクロール無しでフィット */}
            <div className="print-avoid-inside print-break-after">
              <h2 className="font-bold mb-3">4つの時期</h2>

              <div className="w-full">
                <table className="w-full table-fixed border-collapse border border-slate-300 text-[11px] leading-tight">
                  <colgroup>
                    <col className="w-[80px]" />
                    <col className="w-[calc((100%-80px)/4)]" />
                    <col className="w-[calc((100%-80px)/4)]" />
                    <col className="w-[calc((100%-80px)/4)]" />
                    <col className="w-[calc((100%-80px)/4)]" />
                  </colgroup>

                  <tbody>
                    <tr className="bg-slate-50">
                      <th className="border border-slate-300 px-2 py-1 text-left">時期</th>
                      {(result?.ages ?? ["—", "—", "—", "—"]).map((a, i) => (
                        <th
                          key={`age-${i}`}
                          className="border border-slate-300 px-2 py-1 text-left whitespace-normal break-words"
                        >
                          {a}
                        </th>
                      ))}
                    </tr>

                    <tr>
                      <th className="border border-slate-300 px-2 py-1 text-left bg-amber-50">
                        ピナクル
                      </th>
                      {(result?.pinnacles ?? [0, 0, 0, 0]).map((n, i) => (
                        <td
                          key={`pin-${i}`}
                          className="border border-slate-300 px-2 py-1 font-bold text-center"
                        >
                          {result ? n : "—"}
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <th className="border border-slate-300 px-2 py-1 text-left bg-pink-50">
                        チャレンジ
                      </th>
                      {(result?.challenges ?? [0, 0, 0, 0]).map((n, i) => (
                        <td
                          key={`cha-${i}`}
                          className="border border-slate-300 px-2 py-1 font-bold text-center"
                        >
                          {result ? n : "—"}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-2 text-[11px] text-slate-600">
                ※ ピナクル・チャレンジともに「未縮約の月/日/年」から計算し、11/22/33を保持します。
              </div>
            </div>
          </div>
        </div>

        {/* 2ページ目：計算ロジック説明（画面でも表示、印刷では次ページ） */}
        <div className="print-page-break mt-10 print-break-before">
          <div className="text-xl font-extrabold mb-3">計算ロジック（確認用）</div>

          <div className="rounded-2xl border border-slate-300 p-4 mb-5 print-avoid-inside">
            <div className="text-sm text-slate-800 font-semibold mb-1">重要：結果の扱いについて</div>
            <p className="text-sm text-slate-700 leading-relaxed">
              本ページの数値は、計算を補助する目的で表示しています。数秘術は流派により定義や縮約ルールが異なり得るため、
              本ページの計算結果をシステムとして保証するものではありません。重要な判断に用いる場合は、
              必ずご自身でも手計算で確認したうえでご利用ください。
            </p>
          </div>

          <div className="rounded-2xl border border-slate-300 p-4 mb-6 print-avoid-inside">
            <div className="text-sm font-semibold text-slate-900 mb-2">
              このページで採用している縮約ルール
            </div>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
              <li>基本は各合計を 1桁になるまで加算して縮約します（例：29 → 2+9=11）。</li>
              <li>主要ナンバー（LP/PN/DP/MP/SP）は 11 / 22 / 33 をマスターナンバーとして保持します。</li>
              <li>ピナクル・チャレンジは未縮約の月/日/年から算出し、11 / 22 / 33 を保持します。</li>
              <li>母音は A/E/I/O/U のみ（Yは母音に含めません）。</li>
              <li>インテンシティは「名前（英字）」を数値化した 1〜9 の出現回数で集計します。</li>
            </ul>
          </div>

          {/* 実際の値で説明 */}
          <div className="rounded-2xl border border-slate-300 p-4 print-avoid-inside">
            <div className="text-lg font-bold mb-3">主要ナンバー（この入力での計算）</div>

            <KeyValueRow
              k="入力値"
              v={
                <div className="flex flex-wrap gap-2">
                  <Chip>名前: {nameLabel}</Chip>
                  <Chip>生年月日: {birthLabel}</Chip>
                </div>
              }
            />

            <KeyValueRow
              k="LP（Life Path）"
              v={
                result ? (
                  <>
                    年 {result.d.y} → {result.yCore}、月 {result.d.m} → {result.mCore}、日{" "}
                    {result.d.d} → {result.dCore} を合計：
                    {` ${result.yCore} + ${result.mCore} + ${result.dCore} = ${
                      result.yCore + result.mCore + result.dCore
                    }`}
                    。これを主要縮約（11/22/33保持）して LP = <b>{result.lifePath}</b>。
                  </>
                ) : (
                  "生年月日を入力してください（実在しない日付は無効になります）。"
                )
              }
            />

            <KeyValueRow
              k="DP（Destiny）"
              v={
                result ? (
                  <>
                    名前（英字）: <b>{result.letters || "—"}</b> を Pythagorean（A=1…I=9, J=1…）で合計：
                    合計 {result.destinySum} → 主要縮約して DP = <b>{result.destiny}</b>。
                  </>
                ) : (
                  "名前と生年月日を入力してください（DPは名前依存）。"
                )
              }
            />

            <KeyValueRow
              k="SP（Soul）"
              v={
                result ? (
                  <>
                    母音（A,E,I,O,U）のみ合計： 合計 {result.soulSum} → 主要縮約して SP ={" "}
                    <b>{result.soul}</b>。
                  </>
                ) : (
                  "名前を入力してください。"
                )
              }
            />

            <KeyValueRow
              k="PN（Personality）"
              v={
                result ? (
                  <>
                    子音（母音以外）のみ合計： 合計 {result.personalitySum} → 主要縮約して PN ={" "}
                    <b>{result.personality}</b>。
                  </>
                ) : (
                  "名前を入力してください。"
                )
              }
            />

            <KeyValueRow
              k="MP（Maturity）"
              v={
                result ? (
                  <>
                    MP = LP + DP：
                    {` ${result.lifePath} + ${result.destiny} = ${result.lifePath + result.destiny}`}
                    → 主要縮約して MP = <b>{result.maturity}</b>。
                  </>
                ) : (
                  "入力してください。"
                )
              }
            />
          </div>

          <div className="rounded-2xl border border-slate-300 p-4 mt-6">
            <div className="text-lg font-bold mb-3">インテンシティ（この入力での計算）</div>

            <KeyValueRow
              k="対象の数字列"
              v={
                result ? (
                  <>
                    名前（英字）を数値化して連結： <b>{result.intensityDigits || "—"}</b>
                  </>
                ) : (
                  "生年月日（実在日付）を入力してください。"
                )
              }
            />

            <KeyValueRow
              k="強い/欠け"
              v={
                result ? (
                  <div className="flex flex-wrap gap-2">
                    <Chip pink>強い: {result.strong.length ? result.strong.join(", ") : "なし"}</Chip>
                    <Chip>欠け: {result.missing.length ? result.missing.join(", ") : "なし"}</Chip>
                  </div>
                ) : (
                  "入力してください。"
                )
              }
            />
          </div>

          <div className="rounded-2xl border border-slate-300 p-4 mt-6">
            <div className="text-lg font-bold mb-3">4つの時期（この入力での計算）</div>

            <KeyValueRow
              k="年齢帯"
              v={
                result ? (
                  <>
                    第1期の終わり = 36 − LP(1桁)。LP {result.lifePath} → 1桁{" "}
                    {reduceSingle(result.lifePath)}。36 − {reduceSingle(result.lifePath)} ={" "}
                    <b>{result.end1}</b>。年齢帯は「{result.ages.join(" / ")}」。
                  </>
                ) : (
                  "入力してください。"
                )
              }
            />

            <KeyValueRow
              k="ピナクル"
              v={
                result ? (
                  <>
                    未縮約：月 {result.mmRaw}、日 {result.ddRaw}、年 {result.yyRaw}。P1=月+日→
                    {result.pinnacles[0]}、P2=日+年→{result.pinnacles[1]}、P3=P1+P2→
                    {result.pinnacles[2]}、P4=月+年→{result.pinnacles[3]}。結果：{" "}
                    <b>{result.pinnacles.join(", ")}</b>
                  </>
                ) : (
                  "入力してください。"
                )
              }
            />

            <KeyValueRow
              k="チャレンジ"
              v={
                result ? (
                  <>
                    未縮約：C1=|月−日|→{result.challenges[0]}、C2=|日−年|→{result.challenges[1]}、
                    C3=|C1−C2|→{result.challenges[2]}、C4=|月−年|→{result.challenges[3]}。結果：{" "}
                    <b>{result.challenges.join(", ")}</b>
                  </>
                ) : (
                  "入力してください。"
                )
              }
            />
          </div>

          <div className="text-xs text-slate-600 mt-6">
            ※ ここに記載しているのは「このページで採用しているルール」と「この入力で実際に出た計算過程」です。別流派に合わせる場合は、
            縮約ルールやインテンシティの対象（生年月日/名前/両方）を指定してください。
          </div>
        </div>
      </div>
    </div>
  );
}