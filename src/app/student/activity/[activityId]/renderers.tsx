"use client";
/*
 * Student-facing block renderers shared by the single-activity page and the
 * adaptive worksheet. StudentBlockRenderer is the public entry point.
 */
import { useMemo, useState } from "react";
import { DrawingCanvas } from "@/components/activity/DrawingCanvas";
import { GraphBuilder } from "@/components/activity/GraphBuilder";
import type {
  TaggedActivityBlock,
  BlockResponse,
  MultipleChoiceBlock,
  WordBankBlock,
  MatchingBlock,
  SortingBlock,
  FieldJournalBlock,
  DrawingBlock,
  GraphBlock,
} from "@/types";

// ─── Word Bank renderer (needs local state) ───────────────────────────────────
function WordBankRenderer({
  block,
  response,
  onChange,
  submitted,
}: {
  block: WordBankBlock;
  response: BlockResponse | undefined;
  onChange: (r: BlockResponse) => void;
  submitted: boolean;
}) {
  const parts = block.text.split("[blank]");
  const blanks = parts.length - 1;
  const initial = (response as Extract<BlockResponse, { type: "word_bank" }> | undefined)?.answers ?? Array(blanks).fill("");
  const [filled, setFilled] = useState<string[]>(initial);

  const usedWords = new Set(filled.filter(Boolean));
  const available = block.words.filter((w) => !usedWords.has(w));

  const fillBlank = (word: string) => {
    const idx = filled.findIndex((f) => !f);
    if (idx === -1) return;
    const next = [...filled];
    next[idx] = word;
    setFilled(next);
    onChange({ blockId: block.id, type: "word_bank", answers: next });
  };

  const clearBlank = (idx: number) => {
    if (submitted) return;
    const next = [...filled];
    next[idx] = "";
    setFilled(next);
    onChange({ blockId: block.id, type: "word_bank", answers: next });
  };

  return (
    <div className="space-y-4">
      <p className="font-semibold text-forest-900">{block.instructions}</p>
      <p className="leading-relaxed">
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <button
                type="button"
                onClick={() => clearBlank(i)}
                disabled={submitted}
                className={`mx-1 inline-block min-w-[80px] rounded-lg border-b-2 px-2 py-0.5 text-center text-sm font-semibold transition ${
                  filled[i]
                    ? "border-forest-600 bg-forest-50 text-forest-900"
                    : "border-sand-dark bg-cream text-charcoal-soft"
                }`}
              >
                {filled[i] || "___"}
              </button>
            )}
          </span>
        ))}
      </p>
      {!submitted && (
        <div className="flex flex-wrap gap-2 pt-2">
          {available.map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => fillBlank(word)}
              className="rounded-full bg-cream px-3 py-1.5 text-sm font-semibold text-charcoal ring-1 ring-sand-dark transition hover:bg-forest-50 hover:text-forest-700 hover:ring-forest-300"
            >
              {word}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sorting renderer (needs local state) ─────────────────────────────────────
function SortingRenderer({
  block,
  response,
  onChange,
  submitted,
}: {
  block: SortingBlock;
  response: BlockResponse | undefined;
  onChange: (r: BlockResponse) => void;
  submitted: boolean;
}) {
  const initial = (response as Extract<BlockResponse, { type: "sorting" }> | undefined)?.sorted ??
    Object.fromEntries(block.categories.map((c) => [c, [] as string[]]));
  const [buckets, setBuckets] = useState<Record<string, string[]>>(initial);

  const placed = new Set(Object.values(buckets).flat());
  const unsorted = block.items.filter((item) => !placed.has(item));

  const moveItem = (item: string, toCategory: string) => {
    if (submitted) return;
    const next = { ...buckets };
    for (const cat of block.categories) {
      next[cat] = (next[cat] ?? []).filter((i) => i !== item);
    }
    next[toCategory] = [...(next[toCategory] ?? []), item];
    setBuckets(next);
    onChange({ blockId: block.id, type: "sorting", sorted: next });
  };

  const returnItem = (item: string) => {
    if (submitted) return;
    const next = { ...buckets };
    for (const cat of block.categories) {
      next[cat] = (next[cat] ?? []).filter((i) => i !== item);
    }
    setBuckets(next);
    onChange({ blockId: block.id, type: "sorting", sorted: next });
  };

  const [activeCategory, setActiveCategory] = useState(block.categories[0]);

  return (
    <div className="space-y-4">
      <p className="font-semibold text-forest-900">{block.prompt}</p>

      {/* Unsorted items */}
      {unsorted.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-charcoal-soft">Tap to sort into:</p>
          <div className="flex flex-wrap gap-2">
            {block.categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${activeCategory === cat ? "bg-forest-700 text-cream" : "bg-cream text-charcoal-soft ring-1 ring-sand-dark hover:bg-forest-50"}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {unsorted.map((item) => (
              <button
                key={item}
                type="button"
                disabled={submitted}
                onClick={() => moveItem(item, activeCategory)}
                className="rounded-2xl bg-cream px-4 py-2 text-sm font-medium text-charcoal ring-1 ring-sand-dark transition hover:bg-forest-50 hover:text-forest-900"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category buckets */}
      <div className="grid gap-3 sm:grid-cols-2">
        {block.categories.map((cat) => (
          <div key={cat} className="min-h-[80px] rounded-2xl border-2 border-dashed border-sand-dark p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-forest-700">{cat}</p>
            <div className="flex flex-wrap gap-1.5">
              {(buckets[cat] ?? []).map((item) => (
                <button
                  key={item}
                  type="button"
                  disabled={submitted}
                  onClick={() => returnItem(item)}
                  className="rounded-full bg-forest-100 px-3 py-1 text-xs font-semibold text-forest-800 transition hover:bg-clay-100 hover:text-clay-700"
                  title="Tap to return"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Matching renderer (needs useMemo for stable shuffle) ─────────────────────
function MatchingRenderer({
  block,
  response,
  onChange,
  submitted,
}: {
  block: MatchingBlock;
  response: BlockResponse | undefined;
  onChange: (r: BlockResponse) => void;
  submitted: boolean;
}) {
  const r = response as Extract<BlockResponse, { type: "matching" }> | undefined;
  const matches = r?.matches ?? block.pairs.map(() => -1);

  const shuffledRights = useMemo(
    () => [...block.pairs.map((p, i) => ({ text: p.right, idx: i }))].sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [block.id]
  );

  return (
    <div className="space-y-3">
      <p className="font-semibold text-forest-900">{block.prompt}</p>
      {block.pairs.map((pair, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="min-w-0 flex-1 rounded-2xl bg-forest-50 px-4 py-2.5 text-sm font-medium text-forest-900">
            {pair.left}
          </span>
          <span className="text-charcoal-soft">→</span>
          <select
            disabled={submitted}
            value={matches[i] ?? -1}
            onChange={(e) => {
              const next = [...matches];
              next[i] = Number(e.target.value);
              onChange({ blockId: block.id, type: "matching", matches: next });
            }}
            className="flex-1 rounded-2xl border border-sand-dark bg-white px-3 py-2.5 text-sm focus:border-forest-500 focus:outline-none"
          >
            <option value={-1}>Choose…</option>
            {shuffledRights.map(({ text, idx }) => (
              <option key={idx} value={idx}>
                {text}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

// ─── Field Journal renderer (needs helper) ────────────────────────────────────
function FieldJournalRenderer({
  block,
  response,
  onChange,
  submitted,
}: {
  block: FieldJournalBlock;
  response: BlockResponse | undefined;
  onChange: (r: BlockResponse) => void;
  submitted: boolean;
}) {
  const r = response as Extract<BlockResponse, { type: "field_journal" }> | undefined;

  const build = (patch: Partial<Extract<BlockResponse, { type: "field_journal" }>>) =>
    onChange({
      blockId: block.id,
      type: "field_journal",
      location: "",
      weather: "",
      observations: "",
      noticed: "",
      wondering: "",
      ...r,
      ...patch,
    });

  return (
    <div className="space-y-4">
      {block.context && (
        <p className="rounded-2xl bg-mist-100/50 px-4 py-3 text-sm text-mist-700">{block.context}</p>
      )}
      {block.includeWeather && (
        <div>
          <label className="block text-sm font-semibold text-charcoal-soft">Weather</label>
          <input
            disabled={submitted}
            value={r?.weather ?? ""}
            onChange={(e) => build({ weather: e.target.value })}
            className="mt-1 w-full rounded-2xl border border-sand-dark px-4 py-2 text-sm focus:border-forest-500 focus:outline-none"
            placeholder="Sunny, cloudy, windy…"
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-semibold text-charcoal-soft">{block.prompts.observations}</label>
        <textarea
          disabled={submitted}
          rows={3}
          value={r?.observations ?? ""}
          onChange={(e) => build({ observations: e.target.value })}
          className="mt-1 w-full resize-none rounded-2xl border border-sand-dark px-4 py-2.5 text-sm focus:border-forest-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-charcoal-soft">{block.prompts.noticed}</label>
        <textarea
          disabled={submitted}
          rows={2}
          value={r?.noticed ?? ""}
          onChange={(e) => build({ noticed: e.target.value })}
          className="mt-1 w-full resize-none rounded-2xl border border-sand-dark px-4 py-2.5 text-sm focus:border-forest-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-charcoal-soft">{block.prompts.wondering}</label>
        <textarea
          disabled={submitted}
          rows={2}
          value={r?.wondering ?? ""}
          onChange={(e) => build({ wondering: e.target.value })}
          className="mt-1 w-full resize-none rounded-2xl border border-sand-dark px-4 py-2.5 text-sm focus:border-forest-500 focus:outline-none"
        />
      </div>
    </div>
  );
}

// ─── Block content switch ─────────────────────────────────────────────────────
function BlockContent({
  block,
  response,
  onChange,
  submitted,
}: {
  block: TaggedActivityBlock;
  response: BlockResponse | undefined;
  onChange: (r: BlockResponse) => void;
  submitted: boolean;
}) {
  // Concept map UI interaction state (only used when block.type === "concept_map")
  const [cmInput, setCmInput] = useState("");
  const [cmSelectedNode, setCmSelectedNode] = useState<string | null>(null);
  const [cmEdgeLabel, setCmEdgeLabel] = useState("");

  switch (block.type) {
    case "instruction":
      return <p className="leading-relaxed text-charcoal whitespace-pre-wrap">{block.content}</p>;

    case "image":
      return (
        <div>
          <img src={block.url} alt={block.caption ?? "Activity image"} className="w-full rounded-2xl object-cover" />
          {block.caption && <p className="mt-2 text-center text-xs text-charcoal-soft">{block.caption}</p>}
        </div>
      );

    case "q_and_a": {
      const r = response as Extract<BlockResponse, { type: "q_and_a" }> | undefined;
      return (
        <div>
          <p className="font-semibold text-forest-900">{block.question}</p>
          {block.hint && <p className="mt-1 text-xs italic text-charcoal-soft">💡 {block.hint}</p>}
          <textarea
            className="mt-3 w-full resize-none rounded-2xl border border-sand-dark px-4 py-3 text-sm focus:border-forest-500 focus:outline-none"
            rows={3}
            disabled={submitted}
            value={r?.answer ?? ""}
            onChange={(e) => onChange({ blockId: block.id, type: "q_and_a", answer: e.target.value })}
            placeholder="Type your answer…"
          />
        </div>
      );
    }

    case "multiple_choice": {
      const r = response as Extract<BlockResponse, { type: "multiple_choice" }> | undefined;
      const b = block as MultipleChoiceBlock;
      const sel = Array.isArray(r?.selectedIndex)
        ? (r.selectedIndex as number[])
        : r?.selectedIndex !== undefined
        ? [r.selectedIndex as number]
        : [];
      return (
        <div>
          <p className="font-semibold text-forest-900">{b.question}</p>
          {b.hint && <p className="mt-1 text-xs italic text-charcoal-soft">💡 {b.hint}</p>}
          <div className="mt-3 space-y-2">
            {b.options.map((opt, i) => {
              const isSelected = sel.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={submitted}
                  onClick={() => {
                    const next: number | number[] = b.allowMultiple
                      ? isSelected ? sel.filter((x) => x !== i) : [...sel, i]
                      : i;
                    onChange({ blockId: block.id, type: "multiple_choice", selectedIndex: next });
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm transition ${
                    isSelected
                      ? "border-forest-600 bg-forest-50 font-semibold text-forest-900"
                      : "border-sand hover:border-forest-300"
                  }`}
                >
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                      isSelected ? "border-forest-600 bg-forest-600" : "border-sand-dark"
                    }`}
                  >
                    {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    case "writing": {
      const r = response as Extract<BlockResponse, { type: "writing" }> | undefined;
      const words = (r?.text ?? "").trim().split(/\s+/).filter(Boolean).length;
      return (
        <div>
          <p className="font-semibold text-forest-900">{block.prompt}</p>
          <textarea
            className="mt-3 w-full resize-none rounded-2xl border border-sand-dark px-4 py-3 text-sm focus:border-forest-500 focus:outline-none"
            rows={5}
            disabled={submitted}
            value={r?.text ?? ""}
            onChange={(e) => onChange({ blockId: block.id, type: "writing", text: e.target.value })}
            placeholder="Write your response here…"
          />
          {block.wordGuide && (
            <div className="mt-1.5 flex items-center justify-between text-xs text-charcoal-soft">
              <span>
                {words} word{words !== 1 ? "s" : ""}
              </span>
              <span>Target: ~{block.wordGuide} words</span>
            </div>
          )}
        </div>
      );
    }

    case "fill_blanks": {
      const r = response as Extract<BlockResponse, { type: "fill_blanks" }> | undefined;
      const parts = block.text.split("[blank]");
      const answers = r?.answers ?? Array(parts.length - 1).fill("");
      return (
        <div>
          <p className="mb-3 font-semibold text-forest-900">{block.instructions}</p>
          <p className="leading-relaxed">
            {parts.map((part, i) => (
              <span key={i}>
                {part}
                {i < parts.length - 1 && (
                  <input
                    type="text"
                    disabled={submitted}
                    value={answers[i] ?? ""}
                    onChange={(e) => {
                      const next = [...answers];
                      next[i] = e.target.value;
                      onChange({ blockId: block.id, type: "fill_blanks", answers: next });
                    }}
                    className="mx-1 inline-block w-28 rounded-lg border-b-2 border-forest-400 bg-forest-50/40 px-2 py-0.5 text-center text-sm font-semibold text-forest-900 focus:border-forest-600 focus:outline-none"
                  />
                )}
              </span>
            ))}
          </p>
        </div>
      );
    }

    case "word_bank":
      return (
        <WordBankRenderer
          block={block as WordBankBlock}
          response={response}
          onChange={onChange}
          submitted={submitted}
        />
      );

    case "matching":
      return (
        <MatchingRenderer
          block={block as MatchingBlock}
          response={response}
          onChange={onChange}
          submitted={submitted}
        />
      );

    case "label_diagram": {
      const r = response as Extract<BlockResponse, { type: "label_diagram" }> | undefined;
      const labelAnswers = r?.labels ?? Array(block.labels.length).fill("");
      return (
        <div>
          <p className="mb-3 font-semibold text-forest-900">{block.prompt}</p>
          {block.imageUrl && (
            <img src={block.imageUrl} alt="Diagram" className="mb-4 w-full rounded-2xl object-contain" />
          )}
          <div className="space-y-2">
            {block.labels.map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-forest-100 text-xs font-bold text-forest-700">
                  {i + 1}
                </span>
                <input
                  disabled={submitted}
                  value={labelAnswers[i] ?? ""}
                  onChange={(e) => {
                    const next = [...labelAnswers];
                    next[i] = e.target.value;
                    onChange({ blockId: block.id, type: "label_diagram", labels: next });
                  }}
                  placeholder={`Label ${i + 1}…`}
                  className="flex-1 rounded-2xl border border-sand-dark px-4 py-2 text-sm focus:border-forest-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "table": {
      const r = response as Extract<BlockResponse, { type: "table" }> | undefined;
      const cells =
        r?.cells ?? Array(block.rows).fill(null).map(() => Array(block.headers.length).fill(""));
      return (
        <div>
          <p className="mb-3 font-semibold text-forest-900">{block.prompt}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-forest-800 text-cream">
                  {block.headers.map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cells.map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-cream/50"}>
                    {row.map((cell: string, ci: number) => (
                      <td key={ci} className="px-2 py-1">
                        {block.prefilled?.[ri]?.[ci] ? (
                          <span className="px-2 text-charcoal-soft">{block.prefilled[ri][ci]}</span>
                        ) : (
                          <input
                            disabled={submitted}
                            value={cell}
                            onChange={(e) => {
                              const next = cells.map((rw: string[]) => [...rw]);
                              next[ri][ci] = e.target.value;
                              onChange({ blockId: block.id, type: "table", cells: next });
                            }}
                            className="w-full rounded-lg border border-sand px-2 py-1.5 focus:border-forest-500 focus:outline-none"
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    case "research": {
      const r = response as Extract<BlockResponse, { type: "research" }> | undefined;
      return (
        <div>
          <p className="mb-3 font-semibold text-forest-900">{block.prompt}</p>
          <div className="space-y-3">
            {block.fields.map((field) => (
              <div key={field}>
                <label className="mb-1 block text-sm font-semibold text-charcoal-soft">{field}</label>
                <textarea
                  disabled={submitted}
                  rows={2}
                  value={r?.fieldValues?.[field] ?? ""}
                  onChange={(e) =>
                    onChange({
                      blockId: block.id,
                      type: "research",
                      fieldValues: { ...(r?.fieldValues ?? {}), [field]: e.target.value },
                    })
                  }
                  className="w-full resize-none rounded-2xl border border-sand-dark px-4 py-2.5 text-sm focus:border-forest-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "sorting":
      return (
        <SortingRenderer
          block={block as SortingBlock}
          response={response}
          onChange={onChange}
          submitted={submitted}
        />
      );

    case "stem_challenge": {
      const r = response as Extract<BlockResponse, { type: "stem_challenge" }> | undefined;
      return (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gold-300 bg-gold-300/20 p-4">
            <h3 className="font-bold text-clay-700">{block.title}</h3>
            <p className="mt-1 text-sm text-charcoal">{block.challenge}</p>
            {block.materials && (
              <ul className="mt-2 space-y-1">
                {block.materials.map((m) => (
                  <li key={m} className="text-xs text-charcoal-soft">
                    • {m}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="font-semibold text-forest-900">{block.photoPrompt}</p>
            <textarea
              disabled={submitted}
              rows={2}
              value={r?.photoUrl ?? ""}
              onChange={(e) =>
                onChange({ blockId: block.id, type: "stem_challenge", photoUrl: e.target.value, text: r?.text ?? "" })
              }
              className="mt-2 w-full resize-none rounded-2xl border border-sand-dark px-4 py-2.5 text-sm focus:border-forest-500 focus:outline-none"
              placeholder="Describe what you photographed…"
            />
          </div>
          <div>
            <p className="font-semibold text-forest-900">{block.textPrompt}</p>
            <textarea
              disabled={submitted}
              rows={3}
              value={r?.text ?? ""}
              onChange={(e) =>
                onChange({ blockId: block.id, type: "stem_challenge", photoUrl: r?.photoUrl ?? "", text: e.target.value })
              }
              className="mt-2 w-full resize-none rounded-2xl border border-sand-dark px-4 py-2.5 text-sm focus:border-forest-500 focus:outline-none"
              placeholder="Type your reflection…"
            />
          </div>
        </div>
      );
    }

    case "field_journal":
      return (
        <FieldJournalRenderer
          block={block as FieldJournalBlock}
          response={response}
          onChange={onChange}
          submitted={submitted}
        />
      );

    case "storyboard": {
      const r = response as Extract<BlockResponse, { type: "storyboard" }> | undefined;
      const frames =
        r?.frames ?? block.frameLabels.map(() => ({ scene: "", onScreen: "", narration: "" }));
      return (
        <div>
          <p className="mb-3 font-semibold text-forest-900">{block.prompt}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {block.frameLabels.map((label, i) => (
              <div key={i} className="space-y-2 rounded-2xl border border-sand-dark p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-charcoal-soft">{label}</p>
                <textarea
                  disabled={submitted}
                  rows={2}
                  placeholder="Scene description…"
                  value={frames[i]?.scene ?? ""}
                  onChange={(e) => {
                    const next = frames.map((f) => ({ ...f }));
                    next[i] = { ...(next[i] ?? { scene: "", onScreen: "", narration: "" }), scene: e.target.value };
                    onChange({ blockId: block.id, type: "storyboard", frames: next });
                  }}
                  className="w-full resize-none rounded-xl border border-sand px-3 py-2 text-xs focus:border-forest-500 focus:outline-none"
                />
                <textarea
                  disabled={submitted}
                  rows={2}
                  placeholder="Narration…"
                  value={frames[i]?.narration ?? ""}
                  onChange={(e) => {
                    const next = frames.map((f) => ({ ...f }));
                    next[i] = { ...(next[i] ?? { scene: "", onScreen: "", narration: "" }), narration: e.target.value };
                    onChange({ blockId: block.id, type: "storyboard", frames: next });
                  }}
                  className="w-full resize-none rounded-xl border border-sand px-3 py-2 text-xs focus:border-forest-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "concept_map": {
      const r = response as Extract<BlockResponse, { type: "concept_map" }> | undefined;
      const nodes = r?.nodes ?? [];
      const edges = r?.edges ?? [];

      const addNode = () => {
        const label = cmInput.trim();
        if (!label || nodes.find((n) => n.label.toLowerCase() === label.toLowerCase())) return;
        onChange({ blockId: block.id, type: "concept_map", nodes: [...nodes, { id: `n-${Date.now()}`, label }], edges });
        setCmInput("");
      };

      const handleNodeClick = (toId: string) => {
        if (!cmSelectedNode) { setCmSelectedNode(toId); return; }
        if (cmSelectedNode === toId) { setCmSelectedNode(null); setCmEdgeLabel(""); return; }
        const label = cmEdgeLabel.trim() || "→";
        onChange({ blockId: block.id, type: "concept_map", nodes, edges: [...edges, { from: cmSelectedNode, to: toId, label }] });
        setCmSelectedNode(null);
        setCmEdgeLabel("");
      };

      const removeNode = (id: string) => {
        onChange({ blockId: block.id, type: "concept_map", nodes: nodes.filter((n) => n.id !== id), edges: edges.filter((e) => e.from !== id && e.to !== id) });
        if (cmSelectedNode === id) setCmSelectedNode(null);
      };

      return (
        <div>
          <p className="mb-3 font-semibold text-forest-900">{block.prompt}</p>

          {block.starterNodes.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-charcoal-soft">Suggested concepts:</span>
              {block.starterNodes.map((n) => (
                <button
                  key={n}
                  disabled={submitted || !!nodes.find((x) => x.label === n)}
                  onClick={() => {
                    if (!nodes.find((x) => x.label === n))
                      onChange({ blockId: block.id, type: "concept_map", nodes: [...nodes, { id: `n-${n}`, label: n }], edges });
                  }}
                  className="rounded-full bg-forest-100 px-3 py-1 text-xs font-semibold text-forest-700 hover:bg-forest-200 disabled:opacity-40"
                >
                  + {n}
                </button>
              ))}
            </div>
          )}

          {!submitted && (
            <div className="mb-3 flex gap-2">
              <input
                value={cmInput}
                onChange={(e) => setCmInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addNode()}
                placeholder="Type a concept and press Enter…"
                className="flex-1 rounded-2xl border border-sand-dark px-4 py-2.5 text-sm focus:border-forest-500 focus:outline-none"
              />
              <button onClick={addNode} className="rounded-2xl bg-forest-700 px-4 py-2 text-sm font-semibold text-cream hover:bg-forest-800">
                Add
              </button>
            </div>
          )}

          {nodes.length > 0 && (
            <div className="mb-3">
              <p className="mb-2 text-xs text-charcoal-soft">
                {submitted
                  ? "Concepts:"
                  : cmSelectedNode
                  ? `Connect "${nodes.find((n) => n.id === cmSelectedNode)?.label}" to…`
                  : "Tap two concepts to connect them:"}
              </p>
              <div className="flex flex-wrap gap-2">
                {nodes.map((n) => (
                  <div key={n.id} className="flex items-center gap-1">
                    <button
                      disabled={submitted}
                      onClick={() => handleNodeClick(n.id)}
                      className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
                        cmSelectedNode === n.id
                          ? "bg-forest-700 text-cream ring-2 ring-forest-400"
                          : "bg-forest-100 text-forest-800 hover:bg-forest-200"
                      }`}
                    >
                      {n.label}
                    </button>
                    {!submitted && (
                      <button onClick={() => removeNode(n.id)} className="text-xs text-charcoal/30 hover:text-clay-500">×</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!submitted && cmSelectedNode && (
            <div className="mb-3 flex items-center gap-2 rounded-2xl bg-forest-50 p-3">
              <span className="text-xs text-charcoal-soft shrink-0">Connection label:</span>
              <input
                value={cmEdgeLabel}
                onChange={(e) => setCmEdgeLabel(e.target.value)}
                placeholder="e.g. feeds on, lives in…"
                className="flex-1 rounded-xl border border-sand-dark px-3 py-1.5 text-sm focus:border-forest-500 focus:outline-none"
              />
              <button onClick={() => { setCmSelectedNode(null); setCmEdgeLabel(""); }} className="text-xs text-charcoal-soft hover:text-charcoal shrink-0">Cancel</button>
            </div>
          )}

          {edges.length > 0 && (
            <div className="rounded-2xl bg-cream/60 p-3">
              <p className="mb-2 text-xs font-semibold text-charcoal-soft">Connections:</p>
              <div className="space-y-1.5">
                {edges.map((e, i) => {
                  const fromLabel = nodes.find((n) => n.id === e.from)?.label ?? e.from;
                  const toLabel = nodes.find((n) => n.id === e.to)?.label ?? e.to;
                  return (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="rounded-full bg-forest-100 px-2 py-0.5 text-xs font-semibold text-forest-700">{fromLabel}</span>
                      <span className="text-xs text-charcoal-soft">{e.label}</span>
                      <span className="rounded-full bg-forest-100 px-2 py-0.5 text-xs font-semibold text-forest-700">{toLabel}</span>
                      {!submitted && (
                        <button
                          onClick={() => onChange({ blockId: block.id, type: "concept_map", nodes, edges: edges.filter((_, j) => j !== i) })}
                          className="ml-auto text-xs text-charcoal/30 hover:text-clay-500"
                        >×</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {nodes.length === 0 && submitted && (
            <p className="text-sm italic text-charcoal-soft">No concept map submitted.</p>
          )}
        </div>
      );
    }

    case "drawing_canvas": {
      const dr = response as Extract<BlockResponse, { type: "drawing_canvas" }> | undefined;
      return (
        <DrawingCanvas
          prompt={(block as DrawingBlock).prompt}
          backgroundImageUrl={(block as DrawingBlock).backgroundImageUrl}
          value={dr?.dataUrl}
          disabled={submitted}
          onChange={(dataUrl) => onChange({ blockId: block.id, type: "drawing_canvas", dataUrl })}
        />
      );
    }

    case "graph": {
      const gr = response as Extract<BlockResponse, { type: "graph" }> | undefined;
      return (
        <GraphBuilder
          block={block as GraphBlock}
          value={gr ? { dataPoints: gr.dataPoints, dataUrl: gr.dataUrl } : undefined}
          disabled={submitted}
          onChange={({ dataPoints, dataUrl }) =>
            onChange({ blockId: block.id, type: "graph", dataPoints, dataUrl })
          }
        />
      );
    }

    default:
      return null;
  }
}

// ─── Block wrapper ─────────────────────────────────────────────────────────────
export function StudentBlockRenderer({
  block,
  index,
  response,
  onChange,
  submitted,
}: {
  block: TaggedActivityBlock;
  index: number;
  response: BlockResponse | undefined;
  onChange: (r: BlockResponse) => void;
  submitted: boolean;
}) {
  const isDisplay = block.type === "instruction" || block.type === "image";
  return (
    <div
      className={`space-y-4 rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5 ${
        submitted && !isDisplay ? "opacity-75" : ""
      }`}
    >
      {!isDisplay && (
        <span className="grid h-7 w-7 place-items-center rounded-full bg-forest-700 text-xs font-bold text-cream">
          {index + 1}
        </span>
      )}
      <BlockContent block={block} response={response} onChange={onChange} submitted={submitted} />
    </div>
  );
}
