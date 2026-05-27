import "./styles.css";
import crawl from "./crawl-data.json";

const sectionLabels = {
  "/": "root",
  products: "products",
  "product-list": "product-list",
  profile: "profile",
  "prop-firms": "prop-firms",
  copy: "copy",
  brokers: "brokers",
  download: "download",
  "prop-challenges": "prop-challenges",
  "start-selling": "start-selling",
  indicators: "indicators",
  plugins: "plugins",
  bots: "bots"
};

const sections = ["All", ...crawl.sections.map((item) => item.section)];
const allTypes = [
  "All",
  ...new Set(crawl.patterns.flatMap((pattern) => pattern.buttons.map((button) => button.type)))
].sort((a, b) => (a === "All" ? -1 : b === "All" ? 1 : a.localeCompare(b)));

let activeSection = "All";
let activeType = "All";
let selectedPattern = crawl.patterns[0]?.pattern || "/";

const app = document.querySelector("#app");

function visiblePatterns() {
  return crawl.patterns.filter((pattern) => activeSection === "All" || pattern.section === activeSection);
}

function currentPattern() {
  return crawl.patterns.find((pattern) => pattern.pattern === selectedPattern) || visiblePatterns()[0] || crawl.patterns[0];
}

function filteredButtons(patterns = visiblePatterns()) {
  return patterns.flatMap((pattern) =>
    pattern.buttons
      .filter((button) => activeType === "All" || button.type === activeType)
      .map((button) => ({ ...button, pattern: pattern.pattern, section: pattern.section }))
  );
}

function typeClass(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function countButtons(type) {
  return visiblePatterns().reduce((total, pattern) => {
    return total + pattern.buttons.filter((button) => type === "All" || button.type === type).length;
  }, 0);
}

function sectionCount(section) {
  if (section === "All") return crawl.source.exactUrls;
  return crawl.sections.find((item) => item.section === section)?.exactUrlCount || 0;
}

function renderSectionTabs() {
  return sections.map((section) => `
    <button class="chip ${section === activeSection ? "is-active" : ""}" data-section="${section}">
      <span>${sectionLabels[section] || section}</span>
      <b>${sectionCount(section)}</b>
    </button>
  `).join("");
}

function renderPatternList() {
  return visiblePatterns().map((pattern) => `
    <button class="surface-item ${pattern.pattern === selectedPattern ? "is-selected" : ""}" data-pattern="${pattern.pattern}">
      <span>
        <strong>${pattern.pattern}</strong>
        <small>${pattern.crawledPages} crawled · ${pattern.buttons.length} button labels</small>
      </span>
      <b>${pattern.exactUrlCount}</b>
    </button>
  `).join("");
}

function renderTypeFilters() {
  return allTypes.map((type) => `
    <button class="filter ${type === activeType ? "is-active" : ""}" data-type="${type}">
      ${type}
      <span>${countButtons(type)}</span>
    </button>
  `).join("");
}

function renderExamples(pattern) {
  const examples = pattern.examples?.length ? pattern.examples : crawl.pages
    .filter((page) => page.pattern === pattern.pattern)
    .map((page) => page.path)
    .slice(0, 8);

  if (!examples.length) {
    return `<div class="route-badge">No fetched HTML sample for this pattern yet</div>`;
  }

  return examples.map((path) => `
    <a class="route-badge" href="https://ctrader.com${path}" target="_blank" rel="noreferrer">${path}</a>
  `).join("");
}

function renderButtonShowcase(pattern) {
  const buttons = pattern.buttons
    .filter((button) => activeType === "All" || button.type === activeType)
    .slice(0, 12);

  if (!buttons.length) {
    return `<div class="empty">No buttons found for this filter.</div>`;
  }

  return buttons.map((button) => `
    <button class="sample-button ${typeClass(button.type)}">
      <span>${button.label}</span>
      <small>${button.type} · ${button.count} page samples</small>
    </button>
  `).join("");
}

function renderPortalMap() {
  return visiblePatterns().slice(0, 24).map((pattern) => `
    <button class="map-node ${pattern.pattern === selectedPattern ? "is-selected" : ""}" data-pattern="${pattern.pattern}">
      <span>${pattern.section}</span>
      <strong>${pattern.pattern}</strong>
      <small>${pattern.exactUrlCount} URLs · ${pattern.crawledPages} crawled</small>
    </button>
  `).join("");
}

function renderRows(rows) {
  if (!rows.length) return `<div class="empty">No matching buttons in this section.</div>`;

  return rows.map((button) => `
    <div class="table-row">
      <div>
        <strong>${button.label}</strong>
        <small>${button.pattern} · examples: ${button.examples?.slice(0, 2).join(", ") || "n/a"}</small>
      </div>
      <span>${button.element}</span>
      <em class="type-pill ${typeClass(button.type)}">${button.type}</em>
      <p>${button.count} occurrences in crawled page samples</p>
    </div>
  `).join("");
}

function renderPagesPreview(pattern) {
  const pages = crawl.pages.filter((page) => page.pattern === pattern.pattern).slice(0, 10);
  if (!pages.length) return `<div class="empty">This pattern is counted from links/sitemap, but no HTML page was fetched.</div>`;

  return pages.map((page) => `
    <div class="table-row">
      <div>
        <strong>${page.path}</strong>
        <small>${page.title || "Untitled"}</small>
      </div>
      <span>${page.status}</span>
      <em class="type-pill">${page.buttonCount} surfaces</em>
      <p>${page.buttons.slice(0, 5).map((button) => button.label).join(", ")}</p>
    </div>
  `).join("");
}

function render() {
  const pattern = currentPattern();
  const rows = filteredButtons();
  const fetchedAt = new Date(crawl.generatedAt).toLocaleString();

  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar" aria-label="cTrader crawled sections">
        <a class="brand" href="https://ctrader.com/" target="_blank" rel="noreferrer">
          <span class="brand-mark">c</span>
          <span>
            <strong>cTrader Crawl Atlas</strong>
            <small>real sections after /</small>
          </span>
        </a>

        <div class="metric-strip">
          <div><strong>${crawl.source.sitemapUrls}</strong><span>sitemap URLs</span></div>
          <div><strong>${crawl.source.exactUrls}</strong><span>unique URLs</span></div>
          <div><strong>${crawl.source.crawledPages}</strong><span>HTML pages</span></div>
        </div>

        <div class="sidebar-section">
          <h2>Sections after /</h2>
          <div class="chip-list">${renderSectionTabs()}</div>
        </div>

        <div class="sidebar-section">
          <h2>Route patterns</h2>
          <div class="surface-list">${renderPatternList()}</div>
        </div>
      </aside>

      <main class="workspace">
        <header class="topbar">
          <div>
            <p>Fetched ${fetchedAt} · sitemap + internal links</p>
            <h1>Реальный crawl map кнопок cTrader</h1>
          </div>
          <a class="source-link" href="https://ctrader.com/sitemap-store.xml" target="_blank" rel="noreferrer">Sitemap source</a>
        </header>

        <section class="focus-grid">
          <article class="focus-panel">
            <div class="panel-head">
              <span>${pattern.section}</span>
              <h2>${pattern.pattern}</h2>
              <p>${pattern.exactUrlCount} exact URLs found. ${pattern.crawledPages} HTML pages fetched for this pattern. ${pattern.buttons.length} unique button/link-surface labels extracted.</p>
            </div>
            <div class="example-routes">${renderExamples(pattern)}</div>
            <div class="showcase">${renderButtonShowcase(pattern)}</div>
          </article>

          <article class="map-panel">
            <div class="panel-head compact">
              <span>Route map</span>
              <h2>Patterns inside selected section</h2>
            </div>
            <div class="map-grid">${renderPortalMap()}</div>
          </article>
        </section>

        <section class="inventory-section">
          <div class="inventory-head">
            <div>
              <span>Button inventory</span>
              <h2>${rows.length} labels visible across selected section</h2>
            </div>
            <div class="filter-row">${renderTypeFilters()}</div>
          </div>

          <div class="table" role="table" aria-label="Extracted button inventory">
            <div class="table-header">
              <span>Label</span>
              <span>Element</span>
              <span>Type</span>
              <span>Evidence</span>
            </div>
            ${renderRows(rows)}
          </div>
        </section>

        <section class="inventory-section">
          <div class="inventory-head">
            <div>
              <span>Fetched pages</span>
              <h2>HTML examples for ${pattern.pattern}</h2>
            </div>
          </div>
          <div class="table">
            <div class="table-header">
              <span>Page</span>
              <span>Status</span>
              <span>Surfaces</span>
              <span>First labels</span>
            </div>
            ${renderPagesPreview(pattern)}
          </div>
        </section>
      </main>
    </div>
  `;
}

app.addEventListener("click", (event) => {
  const section = event.target.closest("[data-section]");
  if (section) {
    activeSection = section.dataset.section;
    selectedPattern = visiblePatterns()[0]?.pattern || crawl.patterns[0].pattern;
    render();
    return;
  }

  const type = event.target.closest("[data-type]");
  if (type) {
    activeType = type.dataset.type;
    render();
    return;
  }

  const pattern = event.target.closest("[data-pattern]");
  if (pattern) {
    selectedPattern = pattern.dataset.pattern;
    render();
  }
});

render();
