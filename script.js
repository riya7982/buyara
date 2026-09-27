/* ===========================================================
   BUYARA — script.js
   =========================================================== */

const state = {
  data: null,
  activeGroup: "All",
  budget: null
};

document.addEventListener("DOMContentLoaded", () => {
  wireMobileMenu();
  wireDecisionForm();
  wireBudgetCards();
  wireFilterChips();
  wireCategoryStrip();
  loadProducts();
});

/* ---------- Mobile menu ---------- */
function wireMobileMenu(){
  const toggle = document.querySelector(".menu-toggle");
  const links = document.querySelector(".nav-links");
  if(!toggle || !links) return;
  toggle.addEventListener("click", () => links.classList.toggle("open"));
  links.querySelectorAll("a").forEach(a =>
    a.addEventListener("click", () => links.classList.remove("open"))
  );
}

/* ---------- Hero decision form ---------- */
function wireDecisionForm(){
  const form = document.getElementById("decision-form");
  if(!form) return;
  const chips = form.querySelectorAll(".budget-chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      state.budget = parseInt(chip.dataset.budget, 10);
    });
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = document.getElementById("need-input").value.trim();
    goToPopularSection(query);
  });
}

function goToPopularSection(query){
  const section = document.getElementById("popular");
  if(section) section.scrollIntoView({ behavior: "smooth" });
  const searchState = { query: (query || "").toLowerCase(), budget: state.budget };
  renderProducts(searchState);
}

/* ---------- Budget section cards ---------- */
function wireBudgetCards(){
  document.querySelectorAll(".budget-card").forEach(card => {
    card.addEventListener("click", () => {
      state.budget = parseInt(card.dataset.budget, 10);
      goToPopularSection("");
    });
  });
}

/* ---------- Shop by category strip ---------- */
function wireCategoryStrip(){
  document.querySelectorAll("#cat-strip .cat-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      state.activeGroup = pill.dataset.group || "All";
      document.querySelectorAll(".filter-chip").forEach(c => {
        c.classList.toggle("active", c.dataset.group === state.activeGroup);
      });
      const section = document.getElementById("popular");
      if(section) section.scrollIntoView({ behavior: "smooth" });
      renderProducts({});
    });
  });
}

/* ---------- Category filter chips on Popular Right Now ---------- */
function wireFilterChips(){
  document.querySelectorAll(".filter-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      state.activeGroup = chip.dataset.group;
      renderProducts({});
    });
  });
}

/* ---------- Load products.json ---------- */
async function loadProducts(){
  const grid = document.getElementById("product-grid");
  if(!grid) return;
  try{
    const res = await fetch("./products.json", { cache: "no-store" });
    if(!res.ok) throw new Error("HTTP " + res.status);
    state.data = await res.json();
    renderProducts({});
    renderGuides();
  }catch(err){
    console.error("BUYARA: failed to load products.json", err);
    grid.innerHTML = `<p class="state-msg">
      Couldn't load product picks right now (products.json failed to load).
      Make sure products.json sits in the same folder as index.html and that
      you're viewing this over http(s), not a local file:// path.
    </p>`;
  }
}

/* ---------- Render product grid ---------- */
function renderProducts(searchState){
  const grid = document.getElementById("product-grid");
  if(!grid || !state.data) return;

  const catMap = {};
  state.data.categories.forEach(c => catMap[c.id] = c);

  let items = state.data.products.slice();

  if(state.activeGroup && state.activeGroup !== "All"){
    items = items.filter(p => catMap[p.category] && catMap[p.category].group === state.activeGroup);
  }
  if(searchState.budget){
    items = items.filter(p => p.price <= searchState.budget);
  }
  if(searchState.query){
    items = items.filter(p =>
      (p.name + " " + p.searchTerms + " " + (catMap[p.category]?.label || ""))
        .toLowerCase().includes(searchState.query)
    );
  }

  if(items.length === 0){
    grid.innerHTML = `<p class="state-msg">No picks match that yet — try a different need or budget. (Product research for BUYARA is still in progress.)</p>`;
    return;
  }

  grid.innerHTML = items.map(p => productCardHTML(p, catMap)).join("");
}

function productCardHTML(p, catMap){
  const cat = catMap[p.category] || {};
  const thumb = p.image
    ? `<img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.name)}">`
    : (cat.icon || "🛍️");
  const ratingLine = p.rating
    ? `<span>${p.rating}★${p.reviewCount ? " · " + p.reviewCount + " ratings" : ""}</span>`
    : "";
  return `
  <article class="product-card">
    <div class="thumb">${thumb}</div>
    <div class="price-row">
      <span class="price">₹${p.price}</span>
      <span class="merchant">${escapeText(p.merchant)}</span>
    </div>
    <h4>${escapeText(p.name)}</h4>
    <p class="best-for">Best for: ${escapeText(p.bestFor)}</p>
    <p class="why">${escapeText(p.whyPicked)}</p>
    <p class="know">Things to know: ${escapeText(p.thingsToKnow)}</p>
    <a class="cta" href="${escapeAttr(p.affiliateLink)}" target="_blank" rel="noopener sponsored">Check Price</a>
  </article>`;
}

/* ---------- Render buying guides ---------- */
function renderGuides(){
  const wrap = document.getElementById("guide-grid");
  if(!wrap || !state.data || !state.data.guides) return;
  wrap.innerHTML = state.data.guides.map((g, i) => `
    <div class="guide-card">
      <span class="num">${String(i + 1).padStart(2, "0")}</span>
      <div class="eyebrow">${g.status === "draft" ? "In progress" : "Guide"}</div>
      <h3>${escapeText(g.title)}</h3>
      <p>${escapeText(g.blurb)}</p>
      <a href="#popular">Explore shortlist →</a>
    </div>
  `).join("");
}

/* ---------- Small helpers ---------- */
function escapeText(str){
  if(str === null || str === undefined) return "";
  return String(str).replace(/[&<>]/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[m]));
}
function escapeAttr(str){
  if(!str) return "#";
  return String(str).replace(/"/g, "&quot;");
}
