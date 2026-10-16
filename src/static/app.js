(() => {
  const LABEL_NAMES = {
    PERSON: "Orang",
    ORG: "Organisasi",
    GPE: "Negara / kota",
    LOC: "Lokasi",
    DATE: "Tanggal",
    EVENT: "Peristiwa",
    NORP: "Kelompok",
    MONEY: "Uang",
  };

  const TITLE_MIN = 3;
  const TITLE_MAX = 500;
  const BODY_MIN = 10;

  const SAMPLES = {
    hockey: {
      title: "MHC reschedules Deepavali Day matches after public backlash",
      body:
        "The public and clubs expressed annoyance over Malaysian Hockey League (MHL) matches scheduled for Deepavali Day, 8 November. " +
        "Two matches, Terengganu Hockey Team vs Armed Forces and TNB Thunderbolts vs Maybank, were set. " +
        "The Malaysian Hockey Confederation confirmed changes.",
    },
    bank: {
      title: "RHB Bank opens new branch in Kuching",
      body:
        "RHB Bank opened a new branch in Kuching on 12 October, with a RM2 million investment in the Sarawak market. " +
        "Chief executive Mohd Rashid said the branch will serve small businesses in the city.",
    },
  };

  const $ = (id) => document.getElementById(id);
  const els = {
    title: $("title"),
    body: $("body"),
    titleCount: $("title-count"),
    bodyCount: $("body-count"),
    error: $("error"),
    analyze: $("analyze"),
    clear: $("clear"),
    empty: $("empty"),
    result: $("result"),
    summary: $("summary"),
    chips: $("chips"),
    note: $("note"),
    text: $("text"),
    rows: $("rows"),
    server: $("server-status"),
  };

  const state = { fullText: "", entities: [], active: new Set() };

  /* ---------- Status server ---------- */

  async function checkServer() {
    try {
      const res = await fetch("/health");
      if (!res.ok) throw new Error();
      const data = await res.json().catch(() => ({}));
      const model = [data.model, data.model_name, data.model_loaded].find((v) => typeof v === "string");
      els.server.textContent = model ? `Server aktif · ${model}` : "Server aktif";
      els.server.className = "server ok";
    } catch {
      els.server.textContent = "Server tidak terjangkau";
      els.server.className = "server down";
    }
  }

  /* ---------- Input ---------- */

  function updateCounts() {
    els.titleCount.textContent = `${els.title.value.length} / ${TITLE_MAX}`;
    els.bodyCount.textContent = `${els.body.value.length} karakter`;
  }

  function showError(message) {
    els.error.textContent = message;
    els.error.hidden = !message;
  }

  function loadSample(key) {
    const sample = SAMPLES[key];
    if (!sample) return;
    els.title.value = sample.title;
    els.body.value = sample.body;
    showError("");
    updateCounts();
  }

  function clearAll() {
    els.title.value = "";
    els.body.value = "";
    showError("");
    updateCounts();
    els.result.hidden = true;
    els.empty.hidden = false;
    els.title.focus();
  }

  function validate(title, body) {
    if (title.length < TITLE_MIN) return `Judul minimal ${TITLE_MIN} karakter.`;
    if (title.length > TITLE_MAX) return `Judul maksimal ${TITLE_MAX} karakter.`;
    if (body.length < BODY_MIN) return `Isi berita minimal ${BODY_MIN} karakter.`;
    return "";
  }

  function readError(data, status) {
    const detail = data && (data.detail || data.error || data.message);
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail.map((d) => d.msg || JSON.stringify(d)).join("; ");
    }
    return `Server mengembalikan status ${status}.`;
  }

  /* ---------- Analisis ---------- */

  async function analyze() {
    const title = els.title.value.trim();
    const body = els.body.value.trim();

    const problem = validate(title, body);
    if (problem) {
      showError(problem);
      return;
    }
    showError("");

    els.analyze.disabled = true;
    els.analyze.textContent = "Menganalisis…";

    try {
      const res = await fetch("/extract-entities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(readError(data, res.status));
      showResult(title, body, data);
    } catch (err) {
      const offline = err instanceof TypeError;
      showError(offline ? "Tidak bisa menghubungi server. Pastikan uvicorn sedang berjalan." : err.message);
    } finally {
      els.analyze.disabled = false;
      els.analyze.textContent = "Cari entitas";
    }
  }

  // Server menghitung posisi dari "judul\n\nisi". Pilih versi teks yang cocok dengan semua posisi.
  function pickFullText(title, body, entities) {
    const candidates = [`${title}\n\n${body}`, `${els.title.value}\n\n${els.body.value}`];
    let best = candidates[0];
    let bestScore = -1;
    for (const text of candidates) {
      const score = entities.filter((e) => text.slice(e.start, e.end) === e.text).length;
      if (score > bestScore) {
        best = text;
        bestScore = score;
      }
    }
    return best;
  }

  function showResult(title, body, data) {
    const raw = Array.isArray(data && data.entities) ? data.entities : [];
    const fullText = pickFullText(title, body, raw);

    const entities = raw
      .map((e) => ({ ...e, valid: fullText.slice(e.start, e.end) === e.text }))
      .sort((a, b) => a.start - b.start || b.end - a.end);

    state.fullText = fullText;
    state.entities = entities;
    state.active = new Set(entities.map((e) => e.label));

    const skipped = entities.filter((e) => !e.valid).length;
    els.note.hidden = skipped === 0;
    els.note.textContent = skipped ? `${skipped} entitas tidak disorot karena posisinya tidak cocok dengan teks.` : "";

    els.empty.hidden = true;
    els.result.hidden = false;

    renderChips();
    renderText();
    renderRows();
  }

  /* ---------- Tampilan hasil ---------- */

  function labelName(label) {
    return LABEL_NAMES[label] || label;
  }

  function renderChips() {
    els.chips.replaceChildren();
    const counts = new Map();
    for (const e of state.entities) counts.set(e.label, (counts.get(e.label) || 0) + 1);

    els.summary.textContent = state.entities.length
      ? `${state.entities.length} entitas ditemukan dalam ${state.fullText.length} karakter.`
      : "Tidak ada entitas yang ditemukan di artikel ini.";

    for (const [label, count] of counts) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.dataset.label = label;
      chip.setAttribute("aria-pressed", String(state.active.has(label)));

      const name = document.createTextNode(labelName(label));
      const n = document.createElement("span");
      n.className = "n";
      n.textContent = count;
      chip.append(name, n);

      chip.addEventListener("click", () => {
        if (state.active.has(label)) state.active.delete(label);
        else state.active.add(label);
        chip.setAttribute("aria-pressed", String(state.active.has(label)));
        renderText();
        renderRows();
      });
      els.chips.append(chip);
    }
  }

  function renderText() {
    const visible = state.entities.filter((e) => e.valid && state.active.has(e.label));
    const frag = document.createDocumentFragment();
    let pos = 0;

    for (const e of visible) {
      if (e.start < pos) continue; // lewati span yang tumpang tindih
      if (e.start > pos) frag.append(state.fullText.slice(pos, e.start));
      const mark = document.createElement("mark");
      mark.className = "ent";
      mark.dataset.label = e.label;
      mark.title = `${labelName(e.label)} (${e.start}–${e.end})`;
      mark.textContent = state.fullText.slice(e.start, e.end);
      frag.append(mark);
      pos = e.end;
    }
    frag.append(state.fullText.slice(pos));
    els.text.replaceChildren(frag);
  }

  function renderRows() {
    const frag = document.createDocumentFragment();
    for (const e of state.entities) {
      if (!state.active.has(e.label)) continue;
      const tr = document.createElement("tr");

      const tdText = document.createElement("td");
      tdText.textContent = e.text;

      const tdLabel = document.createElement("td");
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.dataset.label = e.label;
      tdLabel.append(dot, labelName(e.label));

      const tdPos = document.createElement("td");
      tdPos.className = "pos";
      tdPos.textContent = `${e.start}–${e.end}`;

      tr.append(tdText, tdLabel, tdPos);
      frag.append(tr);
    }
    els.rows.replaceChildren(frag);
  }

  /* ---------- Event ---------- */

  els.title.addEventListener("input", updateCounts);
  els.body.addEventListener("input", updateCounts);
  els.analyze.addEventListener("click", analyze);
  els.clear.addEventListener("click", clearAll);

  document.querySelectorAll("[data-sample]").forEach((btn) => {
    btn.addEventListener("click", () => loadSample(btn.dataset.sample));
  });

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") analyze();
  });

  updateCounts();
  checkServer();
})();