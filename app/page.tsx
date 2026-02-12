"use client";

import { useMemo, useState } from "react";

/* =====================
   数秘術ユーティリティ
===================== */

const VOWELS = new Set(["A", "E", "I", "O", "U"]);

const letterValue = (ch: string): number => {
  const code = ch.charCodeAt(0);
  if (code < 65 || code > 90) return 0;
  return ((code - 65) % 9) + 1;
};

const sumDigits = (n: number): number =>
  n
    .toString()
    .split("")
    .reduce((a, b) => a + Number(b), 0);

const reduceCore = (n: number): number => {
  while (n > 9 && ![11, 22, 33].includes(n)) {
    n = sumDigits(n);
  }
  return n;
};

const reduceSingle = (n: number): number => {
  while (n > 9) n = sumDigits(n);
  return n;
};

const parseDate = (v: string): { y: number; m: number; d: number } | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const [y, m, d] = v.split("-").map(Number);
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

  // intensity
  intensityDigits: string; // digits used (0 removed)
  counts: Record<number, number>;
  strong: number[];
  missing: number[];

  // cycles
  mm1: number;
  dd1: number;
  yy1: number;
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

    // LP steps
    const yCore = reduceCore(d.y);
    const mCore = reduceCore(d.m);
    const dCore = reduceCore(d.d);
    const lifePath = reduceCore(yCore + mCore + dCore);

    // name-based sums
    const letters = name.toUpperCase().replace(/[^A-Z]/g, "");
    let destinySum = 0;
    let soulSum = 0;
    let personalitySum = 0;

    for (const ch of letters) {
      const v = letterValue(ch);
      destinySum += v;
      if (VOWELS.has(ch)) {
        soulSum += v;
      } else {
        personalitySum += v;
      }
    }

    const destiny = reduceCore(destinySum);
    const soul = reduceCore(soulSum);
    const personality = reduceCore(personalitySum);
    const maturity = reduceCore(lifePath + destiny);

    // intensity
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
    const intensityDigits = `${d.y}${d.m}${d.d}`.replace(/0/g, "");
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

    // cycles
    const mm1 = reduceSingle(d.m);
    const dd1 = reduceSingle(d.d);
    const yy1 = reduceSingle(d.y);

    const pinnacles: [number, number, number, number] = [
      reduceSingle(mm1 + dd1),
      reduceSingle(dd1 + yy1),
      reduceSingle(pinnaclesStep3(mm1, dd1, yy1)),
      reduceSingle(mm1 + yy1),
    ];

    function pinnaclesStep3(mm: number, dd: number, yy: number) {
      const p1 = reduceSingle(mm + dd);
      const p2 = reduceSingle(dd + yy);
      return p1 + p2;
    }

    const challenges: [number, number, number, number] = [
      Math.abs(mm1 - dd1),
      Math.abs(dd1 - yy1),
      Math.abs(Math.abs(mm1 - dd1) - Math.abs(dd1 - yy1)),
      Math.abs(mm1 - yy1),
    ];

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
      mm1,
      dd1,
      yy1,
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
        <div className="mb-6">
          <div className="text-xl font-extrabold">数秘術 計算結果</div>
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
          <div className="print-avoid-break">
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
            <div className="print-avoid-break print-break-before print-avoid-inside">
              <h2 className="font-bold mb-3">インテンシティ</h2>

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
            <div className="print-avoid-break">
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
            </div>
          </div>
        </div>

        {/* 2ページ目：計算ロジック説明（画面でも表示、印刷では次ページ） */}
        <div className="print-page-break mt-10">
          <div className="text-xl font-extrabold mb-3">計算ロジック（確認用）</div>

          <div className="rounded-2xl border border-slate-300 p-4 mb-5">
            <div className="text-sm text-slate-800 font-semibold mb-1">重要：結果の扱いについて</div>
            <p className="text-sm text-slate-700 leading-relaxed">
              本ページの数値は、計算を補助する目的で表示しています。数秘術は流派により定義や縮約ルールが異なり得るため、
              本ページの計算結果をシステムとして保証するものではありません。重要な判断に用いる場合は、
              必ずご自身でも手計算で確認したうえでご利用ください。
            </p>
          </div>

          <div className="rounded-2xl border border-slate-300 p-4 mb-6">
            <div className="text-sm font-semibold text-slate-900 mb-2">
              このページで採用している縮約ルール
            </div>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
              <li>基本は各合計を 1桁になるまで加算して縮約します（例：29 → 2+9=11）。</li>
              <li>主要ナンバー（LP/PN/DP/MP/SP）は 11 / 22 / 33 をマスターナンバーとして保持します。</li>
              <li>ピナクル・チャレンジは 1桁（デジタルルート）として扱います（マスター保持なし）。</li>
            </ul>
          </div>

          {/* 実際の値で説明 */}
          <div className="rounded-2xl border border-slate-300 p-4">
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
                  "生年月日を入力してください。"
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
                    母音（A,E,I,O,U,Y）のみ合計： 合計 {result.soulSum} → 主要縮約して SP ={" "}
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
                    MP = LP + DP：{` ${result.lifePath} + ${result.destiny} = ${result.lifePath + result.destiny}`}
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
                    生年月日の数字を並べ、0を除外： <b>{result.intensityDigits || "—"}</b>
                  </>
                ) : (
                  "生年月日を入力してください。"
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
                  "生年月日を入力してください。"
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
                    月 {result.d.m}→{result.mm1}、日 {result.d.d}→{result.dd1}、年 {result.d.y}→
                    {result.yy1}。P1=月+日→{reduceSingle(result.mm1 + result.dd1)}、P2=日+年→
                    {reduceSingle(result.dd1 + result.yy1)}、P3=P1+P2→{result.pinnacles[2]}、
                    P4=月+年→{result.pinnacles[3]}。結果： <b>{result.pinnacles.join(", ")}</b>
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
                    C1=|月−日|={result.challenges[0]}、C2=|日−年|={result.challenges[1]}、
                    C3=|C1−C2|={result.challenges[2]}、C4=|月−年|={result.challenges[3]}。結果：{" "}
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
            縮約ルールや母音扱い（Y含む/含まない等）を指定してください。
          </div>
        </div>
      </div>
    </div>
  );
}
