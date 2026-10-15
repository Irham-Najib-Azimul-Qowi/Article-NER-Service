document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const form = document.getElementById("ner-form");
  const titleIn = document.getElementById("title");
  const bodyIn = document.getElementById("body");
  const titleCounter = document.getElementById("title-counter");
  const bodyCounter = document.getElementById("body-counter");
  const sampleSelect = document.getElementById("sample-select");

  const btnSubmit = document.getElementById("btn-submit");
  const btnLabel = document.getElementById("btn-label");
  const btnIcon = document.getElementById("btn-icon");
  const spinner = document.getElementById("spinner");
  const btnReset = document.getElementById("btn-reset");

  const errorBox = document.getElementById("error-box");
  const errorMessage = document.getElementById("error-message");
  const systemStatus = document.getElementById("system-status");
  const statusText = document.getElementById("status-text");

  const emptyState = document.getElementById("empty-state");
  const metaBadges = document.getElementById("meta-badges");
  const badgeCount = document.getElementById("badge-count");
  const badgeModel = document.getElementById("badge-model");
  const badgeChars = document.getElementById("badge-chars");

  const filterWrapper = document.getElementById("filter-wrapper");
  const filterChips = document.getElementById("filter-chips");
  const highlightWrapper = document.getElementById("highlight-wrapper");
  const highlightBox = document.getElementById("highlight-box");
  const tableWrapper = document.getElementById("table-wrapper");
  const tableBody = document.getElementById("table-body");
  const tableCountLabel = document.getElementById("table-count-label");
  const jsonWrapper = document.getElementById("json-wrapper");
  const jsonCode = document.getElementById("json-code");

  // State
  let currentEntities = [];
  let currentFullText = "";
  let activeFilter = "ALL";

  // Pre-configured Sample Articles based on Malaysia News Dataset
  const sampleArticles = {
    sample_sports: {
      title: "MHC reschedules Deepavali Day matches after public backlash",
      body: "The public and clubs expressed annoyance over Malaysian Hockey League (MHL) matches scheduled for Deepavali Day, 8 November. Two matches, Terengganu Hockey Team vs Armed Forces and TNB Thunderbolts vs Maybank, were originally set for 8 November. The Malaysian Hockey Confederation confirmed these matches would be rescheduled to 9 November and 14 November, respectively."
    },
    sample_banking: {
      title: "Bursa Malaysia dijangka bergerak mendatar minggu ini",
      body: "Remisier Maybank Investment Bank, Jeffry Azizi Jaafar berkata, tekanan pasaran datang daripada Rizab Persekutuan (Fed) Amerika Syarikat. Justeru itu, Indeks Komposit Kuala Lumpur (FBM KLCI) dijangka bergerak dalam julat tertentu. Sektor perbankan seperti Malayan Banking Berhad (Maybank), CIMB Group Holdings Berhad, Public Bank Berhad dan RHB Bank Berhad kekal stabil, sementara Bank Negara Malaysia (BNM) memantau kadar faedah."
    },
    sample_govt: {
      title: "AG Cautions on Use of AI, Effective Human Oversight Is Still Essential",
      body: "Attorney General Tan Sri Mohd Dusuki Mokhtar cautioned for human oversight in AI at the Financial Lines Forum in Kuala Lumpur. Also present were Lembaga Tabung Haji chairman and RHB Bank founder Tan Sri Abdul Rashid Hussin on 15 October."
    },
    sample_empty: {
      title: "General Reflections on Modern Literature and Art",
      body: "It is always fascinating how artistic philosophy evolves throughout the centuries across various aesthetic schools without centralized control or single authority guidance."
    }
  };

  // Health check on startup
  async function checkHealth() {
    try {
      const res = await fetch("/health");
      if (res.ok) {
        const data = await res.json();
        systemStatus.classList.add("online");
        statusText.textContent = `Online (${data.model || "Aktif"})`;
      } else {
        statusText.textContent = "Server Error";
      }
    } catch {
      statusText.textContent = "Offline";
    }
  }
  checkHealth();

  // Character counter updates
  function updateCounters() {
    titleCounter.textContent = `${titleIn.value.length} / 500`;
    bodyCounter.textContent = `${bodyIn.value.length.toLocaleString()} / 50,000`;
  }
  titleIn.addEventListener("input", updateCounters);
  bodyIn.addEventListener("input", updateCounters);

  // Sample picker handler
  sampleSelect.addEventListener("change", (e) => {
    const key = e.target.value;
    if (sampleArticles[key]) {
      titleIn.value = sampleArticles[key].title;
      bodyIn.value = sampleArticles[key].body;
      updateCounters();
      clearError();
    }
  });

  // Reset handler
  btnReset.addEventListener("click", () => {
    form.reset();
    sampleSelect.value = "";
    updateCounters();
    resetResultsView();
    clearError();
  });

  function showError(msg) {
    errorMessage.textContent = msg;
    errorBox.classList.remove("hidden");
  }

  function clearError() {
    errorMessage.textContent = "";
    errorBox.classList.add("hidden");
  }

  function resetResultsView() {
    emptyState.classList.remove("hidden");
    metaBadges.classList.add("hidden");
    filterWrapper.classList.add("hidden");
    highlightWrapper.classList.add("hidden");
    tableWrapper.classList.add("hidden");
    jsonWrapper.classList.add("hidden");
    tableBody.innerHTML = "";
    highlightBox.innerHTML = "";
    jsonCode.textContent = "";
    currentEntities = [];
    currentFullText = "";
    activeFilter = "ALL";
    resetFilterChips();
  }

  function resetFilterChips() {
    document.querySelectorAll(".chip").forEach(chip => {
      if (chip.getAttribute("data-filter") === "ALL") {
        chip.classList.add("active");
      } else {
        chip.classList.remove("active");
      }
    });
  }

  // Filter chips click handling
  filterChips.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    activeFilter = chip.getAttribute("data-filter");
    applyFilter();
  });

  function applyFilter() {
    renderTable();
    renderHighlights();
  }

  // Form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();

    const title = titleIn.value.trim();
    const body = bodyIn.value.trim();

    // Client-side quick checks
    if (!title || !body) {
      showError("Harap isi kedua kolom judul dan teks artikel berita.");
      return;
    }
    if (title.length < 3) {
      showError("Judul artikel minimal terdiri dari 3 karakter.");
      return;
    }
    if (body.length < 10) {
      showError("Isi artikel minimal terdiri dari 10 karakter.");
      return;
    }

    // Set loading state
    btnSubmit.disabled = true;
    spinner.classList.remove("hidden");
    btnIcon.classList.add("hidden");
    btnLabel.textContent = "Mengekstrak...";

    try {
      const res = await fetch("/extract-entities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Gagal memproses ekstraksi entitas.");
      }

      currentEntities = data.entities || [];
      currentFullText = `${title}\n\n${body}`;

      displayResults(data);
    } catch (err) {
      showError(err.message);
      resetResultsView();
    } finally {
      btnSubmit.disabled = false;
      spinner.classList.add("hidden");
      btnIcon.classList.remove("hidden");
      btnLabel.textContent = "Ekstrak Entitas";
    }
  });

  function displayResults(data) {
    emptyState.classList.add("hidden");
    metaBadges.classList.remove("hidden");
    filterWrapper.classList.remove("hidden");
    highlightWrapper.classList.remove("hidden");
    tableWrapper.classList.remove("hidden");
    jsonWrapper.classList.remove("hidden");

    badgeCount.textContent = `${data.meta.entity_count} Entitas Ditemukan`;
    badgeModel.textContent = `Model: ${data.meta.model}`;
    badgeChars.textContent = `${data.meta.char_count} Karakter`;

    jsonCode.textContent = JSON.stringify(data, null, 2);

    renderTable();
    renderHighlights();
  }

  function getBadgeClass(label) {
    const valid = ["PERSON", "ORG", "GPE", "LOC", "DATE", "EVENT", "NORP", "MONEY"];
    return valid.includes(label) ? `tag-${label}` : "tag-DEFAULT";
  }

  function renderTable() {
    tableBody.innerHTML = "";
    const filtered = activeFilter === "ALL" 
      ? currentEntities 
      : currentEntities.filter(ent => ent.label === activeFilter);

    tableCountLabel.textContent = `Menampilkan ${filtered.length} dari ${currentEntities.length} entitas`;

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 24px; color:#64748b;">Tidak ada entitas yang sesuai dengan filter '${activeFilter}'.</td></tr>`;
      return;
    }

    filtered.forEach(ent => {
      const tr = document.createElement("tr");
      const badgeClass = getBadgeClass(ent.label);

      tr.innerHTML = `
        <td><strong>${escapeHtml(ent.text)}</strong></td>
        <td><span class="tag-badge ${badgeClass}">${escapeHtml(ent.label)}</span></td>
        <td><code>${ent.start}</code></td>
        <td><code>${ent.end}</code></td>
      `;
      tableBody.appendChild(tr);
    });
  }

  function renderHighlights() {
    if (!currentEntities || currentEntities.length === 0) {
      highlightBox.textContent = currentFullText;
      return;
    }

    const filtered = activeFilter === "ALL"
      ? currentEntities
      : currentEntities.filter(ent => ent.label === activeFilter);

    if (filtered.length === 0) {
      highlightBox.textContent = currentFullText;
      return;
    }

    // Sort spans by start offset ascending
    const sorted = [...filtered].sort((a, b) => a.start - b.start);
    let html = "";
    let cursor = 0;

    sorted.forEach(ent => {
      if (ent.start >= cursor) {
        html += escapeHtml(currentFullText.slice(cursor, ent.start));
        const badgeClass = getBadgeClass(ent.label);
        const entitySubstring = currentFullText.slice(ent.start, ent.end);
        html += `<mark class="ent-mark ${badgeClass}" title="${ent.label}: [${ent.start}:${ent.end}]">${escapeHtml(entitySubstring)}<span class="ent-sub">${ent.label}</span></mark>`;
        cursor = ent.end;
      }
    });

    if (cursor < currentFullText.length) {
      html += escapeHtml(currentFullText.slice(cursor));
    }

    highlightBox.innerHTML = html.replace(/\n\n/g, "<br><br>");
  }

  function escapeHtml(str) {
    if (!str) return "";
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }
});
