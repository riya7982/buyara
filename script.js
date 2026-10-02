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

  toggle.addEventListener("click", () => {
    links.classList.toggle("open");
  });

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

  if(section){
    section.scrollIntoView({ behavior: "smooth" });
  }

  const searchState = {
    query: (query || "").toLowerCase(),
    budget: state.budget
  };

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
        c.classList.toggle(
          "active",
          c.dataset.group === state.activeGroup
        );
      });

      const section = document.getElementById("popular");

      if(section){
        section.scrollIntoView({ behavior: "smooth" });
      }

      renderProducts({});
    });
  });
}

/* ---------- Category filter chips ---------- */
function wireFilterChips(){
  document.querySelectorAll(".filter-chip").forEach(chip => {

    chip.addEventListener("click", () => {

      document
        .querySelectorAll(".filter-chip")
        .forEach(c => c.classList.remove("active"));

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

    const res = await fetch("./products.json", {
      cache: "no-store"
    });

    if(!res.ok){
      throw new Error("HTTP " + res.status);
    }

    state.data = await res.json();

    renderProducts({});
    renderGuides();

  }catch(err){

    console.error(
      "BUYARA: failed to load products.json",
      err
    );

    grid.innerHTML = `
      <p class="state-msg">
        Couldn't load product picks right now.
        Make sure products.json sits in the same folder as index.html
        and that you're viewing this over http(s), not a local file:// path.
      </p>
    `;
  }
}

/* ---------- Render product grid ---------- */
function renderProducts(searchState){

  const grid = document.getElementById("product-grid");

  if(!grid || !state.data) return;

  const catMap = {};

  state.data.categories.forEach(category => {
    catMap[category.id] = category;
  });

  let items = state.data.products.slice();

  /* Group filter */
  if(
    state.activeGroup &&
    state.activeGroup !== "All"
  ){

    items = items.filter(product => {

      const category = catMap[product.category];

      return category &&
             category.group === state.activeGroup;

    });
  }

  /* Budget filter */
  if(searchState.budget){

    items = items.filter(product =>
      Number(product.price) <= searchState.budget
    );

  }

  /* Search filter */
  if(searchState.query){

    items = items.filter(product => {

      const searchableText = [
        product.name,
        product.searchTerms,
        product.bestFor,
        product.whyPicked,
        catMap[product.category]?.label || ""
      ]
      .join(" ")
      .toLowerCase();

      return searchableText.includes(searchState.query);

    });
  }

  /* No results */
  if(items.length === 0){

    grid.innerHTML = `
      <p class="state-msg">
        No picks match that yet — try a different need or budget.
        Product research for BUYARA is still in progress.
      </p>
    `;

    return;
  }

  grid.innerHTML = items
    .map(product => productCardHTML(product, catMap))
    .join("");
}

/* ---------- Product card ---------- */
function productCardHTML(product, catMap){

  const category = catMap[product.category] || {};

  /* Product image */
  const thumb = product.image
    ? `
      <img
        src="${escapeAttr(product.image)}"
        alt="${escapeAttr(product.name)}"
        loading="lazy"
      >
    `
    : `
      <div class="product-placeholder">
        ${category.icon || "🛍️"}
      </div>
    `;

  /* Rating */
  const ratingLine = product.rating
    ? `
      <div class="rating">
        <span>★ ${escapeText(product.rating)}</span>
        ${
          product.reviewCount
            ? `<span> · ${formatNumber(product.reviewCount)} ratings</span>`
            : ""
        }
      </div>
    `
    : "";

  /* Badge */
  const badge = product.badge
    ? `
      <span class="product-badge">
        ${escapeText(product.badge)}
      </span>
    `
    : "";

  /* Features */
  const features = Array.isArray(product.features) &&
                   product.features.length
    ? `
      <ul class="product-features">
        ${product.features
          .slice(0, 4)
          .map(feature => `
            <li>${escapeText(feature)}</li>
          `)
          .join("")}
      </ul>
    `
    : "";

  return `
    <article class="product-card">

      <div class="thumb">

        ${badge}

        ${thumb}

      </div>

      <div class="price-row">

        <span class="price">
          ₹${formatNumber(product.price)}
        </span>

        <span class="merchant">
          ${escapeText(product.merchant)}
        </span>

      </div>

      ${ratingLine}

      <h4>
        ${escapeText(product.name)}
      </h4>

      <p class="best-for">
        Best for: ${escapeText(product.bestFor)}
      </p>

      <p class="why">
        ${escapeText(product.whyPicked)}
      </p>

      ${features}

      <p class="know">
        Things to know:
        ${escapeText(product.thingsToKnow)}
      </p>

      <a
        class="cta"
        href="${escapeAttr(product.affiliateLink)}"
        target="_blank"
        rel="noopener sponsored"
      >
        Check Price
      </a>

    </article>
  `;
}

/* ---------- Render buying guides ---------- */
function renderGuides(){

  const wrap = document.getElementById("guide-grid");

  if(
    !wrap ||
    !state.data ||
    !state.data.guides
  ){
    return;
  }

  wrap.innerHTML = state.data.guides
    .map((guide, index) => `
      <div class="guide-card">

        <span class="num">
          ${String(index + 1).padStart(2, "0")}
        </span>

        <div class="eyebrow">
          ${
            guide.status === "draft"
              ? "In progress"
              : "Guide"
          }
        </div>

        <h3>
          ${escapeText(guide.title)}
        </h3>

        <p>
          ${escapeText(guide.blurb)}
        </p>

        <a href="#popular">
          Explore shortlist →
        </a>

      </div>
    `)
    .join("");
}

/* ---------- Number formatting ---------- */
function formatNumber(number){

  if(
    number === null ||
    number === undefined ||
    number === ""
  ){
    return "";
  }

  return Number(number).toLocaleString("en-IN");
}

/* ---------- Escape text ---------- */
function escapeText(str){

  if(
    str === null ||
    str === undefined
  ){
    return "";
  }

  return String(str).replace(
    /[&<>]/g,
    character => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;"
    }[character])
  );
}

/* ---------- Escape attribute ---------- */
function escapeAttr(str){

  if(!str){
    return "#";
  }

  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
