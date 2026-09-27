let products = [];

let filter = "All";
let budget = null;
let query = "";

let saved = new Set();

try {
  saved = new Set(
    JSON.parse(localStorage.getItem("buyaraSaved") || "[]")
  );
} catch {
  saved = new Set();
}


/* =========================================
   HELPERS
========================================= */

const $ = (selector) =>
  document.querySelector(selector);


function money(number) {
  return "₹" + Number(number).toLocaleString("en-IN");
}


function toast(message) {

  const element = $("#toast");

  if (!element) return;

  element.textContent = message;

  element.classList.add("show");

  clearTimeout(window.buyaraToast);

  window.buyaraToast = setTimeout(() => {
    element.classList.remove("show");
  }, 2200);
}


/* =========================================
   PRODUCT IMAGE
========================================= */

function productImage(id, width = 520) {

  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=78&fm=webp`;

}


/* =========================================
   LOAD PRODUCTS FROM JSON
========================================= */

async function loadProducts() {

  try {

    const response =
      await fetch("./products.json", {
        cache: "no-cache"
      });

    if (!response.ok) {
      throw new Error("Could not load products.json");
    }

    products = await response.json();

    renderProducts();

    renderPopularProducts();

    updateSavedCount();

  } catch (error) {

    console.error("BUYARA product loading error:", error);

    const productGrid =
      $("#productGrid");

    if (productGrid) {

      productGrid.innerHTML = `
        <div class="no-results">

          <strong>
            Products couldn't be loaded.
          </strong>

          <span>
            Make sure products.json is in the same folder as index.html.
          </span>

        </div>
      `;

    }

  }

}


/* =========================================
   GET FILTERED PRODUCTS
========================================= */

function getVisibleProducts() {

  return products.filter(product => {

    const matchesCategory =
      filter === "All" ||
      product.category === filter;

    const matchesBudget =
      !budget ||
      (
        budget === "premium"
          ? Number(product.price) >= 5000
          : Number(product.price) <= budget
      );

    const searchableText = `
      ${product.name}
      ${product.category}
      ${product.note}
      ${product.badge}
    `.toLowerCase();

    const matchesSearch =
      !query ||
      searchableText.includes(query);

    return (
      matchesCategory &&
      matchesBudget &&
      matchesSearch
    );

  });

}


/* =========================================
   RENDER PRODUCTS
========================================= */

function renderProducts() {

  const productGrid =
    $("#productGrid");

  if (!productGrid) return;

  const visibleProducts =
    getVisibleProducts();


  if (!visibleProducts.length) {

    productGrid.innerHTML = `

      <div class="no-results">

        <strong>
          No matching finds yet.
        </strong>

        <span>
          Try another category or search.
        </span>

      </div>

    `;

    updateSavedCount();

    return;
  }


  productGrid.innerHTML =
    visibleProducts.map(product => {

      const isSaved =
        saved.has(Number(product.id));

      return `

        <article class="product">

          <div class="product-img">

            <img
              loading="lazy"
              decoding="async"
              src="${productImage(product.image)}"
              alt="${product.name}"
              width="520"
              height="520"
            >

            <span class="badge">
              ${product.badge}
            </span>

            <button
              class="save ${isSaved ? "saved" : ""}"
              data-save="${product.id}"
              aria-label="Save ${product.name}"
              type="button"
            >
              ${isSaved ? "♥" : "♡"}
            </button>

          </div>


          <div class="product-body">

            <small>
              ${product.category.toUpperCase()}
            </small>

            <h3>
              ${product.name}
            </h3>

            <div class="rating">

              <b>
                ★ ${product.rating}
              </b>

              <span>
                (${product.reviews})
              </span>

            </div>


            <div class="product-bottom">

              <strong>
                ${money(product.price)}
              </strong>

              <button
                type="button"
                data-check="${product.id}"
              >
                Check Price →
              </button>

            </div>

          </div>

        </article>

      `;

    }).join("");


  updateSavedCount();

}


/* =========================================
   SAVED COUNT
========================================= */

function updateSavedCount() {

  const savedCount =
    $("#savedCount");

  if (savedCount) {

    savedCount.textContent =
      saved.size;

  }

}


/* =========================================
   POPULAR PRODUCTS
========================================= */

function renderPopularProducts() {

  const popularList =
    $("#popularList");

  if (!popularList || !products.length) {
    return;
  }


  const popularProducts =
    products.slice(1, 4);


  popularList.innerHTML =
    popularProducts.map(
      (product, index) => `

        <div class="popular-item">

          <span>
            ${index + 1}
          </span>

          <img
            loading="lazy"
            decoding="async"
            src="${productImage(product.image, 180)}"
            alt="${product.name}"
            width="90"
            height="90"
          >

          <div>

            <b>
              ${product.name}
            </b>

            <small>
              ★ ${product.rating}
              |
              ${money(product.price)}
            </small>

          </div>

        </div>

      `
    ).join("");

}


/* =========================================
   SAVE PRODUCT
========================================= */

document.addEventListener(
  "click",
  function(event) {

    const saveButton =
      event.target.closest("[data-save]");

    if (!saveButton) return;


    const productId =
      Number(saveButton.dataset.save);


    if (saved.has(productId)) {

      saved.delete(productId);

      toast(
        "Removed from saved finds."
      );

    } else {

      saved.add(productId);

      toast(
        "Saved to your finds ♡"
      );

    }


    localStorage.setItem(
      "buyaraSaved",
      JSON.stringify([...saved])
    );


    renderProducts();

  }
);


/* =========================================
   CHECK PRICE
========================================= */

document.addEventListener(
  "click",
  function(event) {

    const checkButton =
      event.target.closest("[data-check]");

    if (!checkButton) return;


    event.preventDefault();


    const productId =
      Number(checkButton.dataset.check);


    const product =
      products.find(
        item => Number(item.id) === productId
      );


    if (
      product &&
      product.affiliateLink &&
      product.affiliateLink !== "#"
    ) {

      window.open(
        product.affiliateLink,
        "_blank",
        "noopener,noreferrer"
      );

      return;
    }


    toast(
      "Demo link — verified affiliate merchant link will be connected before launch."
    );

  }
);


/* =========================================
   CATEGORY FILTER
========================================= */

document
  .querySelectorAll("[data-filter]")
  .forEach(button => {

    button.addEventListener(
      "click",
      function() {

        filter =
          this.dataset.filter;

        budget = null;


        document
          .querySelectorAll("[data-filter]")
          .forEach(item => {

            item.classList.toggle(
              "active",
              item === this
            );

          });


        renderProducts();

      }
    );

  });


/* =========================================
   BUDGET FILTER
========================================= */

document
  .querySelectorAll("[data-budget]")
  .forEach(button => {

    button.addEventListener(
      "click",
      function() {

        const selectedBudget =
          this.dataset.budget;


        budget =
          selectedBudget === "premium"
            ? "premium"
            : Number(selectedBudget);


        filter = "All";


        document
          .querySelectorAll("[data-filter]")
          .forEach(item => {

            item.classList.toggle(
              "active",
              item.dataset.filter === "All"
            );

          });


        renderProducts();


        const productsSection =
          $("#products");


        if (productsSection) {

          productsSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });

        }

      }
    );

  });


/* =========================================
   SEARCH
========================================= */

function performSearch(value) {

  query =
    value
      .trim()
      .toLowerCase();


  filter = "All";

  budget = null;


  document
    .querySelectorAll("[data-filter]")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.filter === "All"
      );

    });


  renderProducts();


  const productsSection =
    $("#products");


  if (productsSection) {

    productsSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }

}


/* =========================================
   TOP SEARCH
========================================= */

const searchToggle =
  $("#searchToggle");

const searchRow =
  $("#searchRow");

const searchInput =
  $("#searchInput");

const searchButton =
  $("#searchButton");


if (searchToggle) {

  searchToggle.addEventListener(
    "click",
    function() {

      if (!searchRow) return;


      searchRow.classList.toggle(
        "show"
      );


      if (
        searchRow.classList.contains(
          "show"
        ) &&
        searchInput
      ) {

        setTimeout(
          () => searchInput.focus(),
          100
        );

      }

    }
  );

}


if (searchButton) {

  searchButton.addEventListener(
    "click",
    function() {

      if (searchInput) {

        performSearch(
          searchInput.value
        );

      }

    }
  );

}


if (searchInput) {

  searchInput.addEventListener(
    "keydown",
    function(event) {

      if (event.key === "Enter") {

        performSearch(
          this.value
        );

      }

    }
  );

}


/* =========================================
   HERO SEARCH
========================================= */

const heroSearch =
  $("#heroSearch");

const heroSearchButton =
  $("#heroSearchBtn");


if (heroSearchButton) {

  heroSearchButton.addEventListener(
    "click",
    function() {

      if (heroSearch) {

        performSearch(
          heroSearch.value
        );

      }

    }
  );

}


if (heroSearch) {

  heroSearch.addEventListener(
    "keydown",
    function(event) {

      if (event.key === "Enter") {

        performSearch(
          this.value
        );

      }

    }
  );

}


/* =========================================
   SAVED BUTTON
========================================= */

const savedToggle =
  $("#savedToggle");


if (savedToggle) {

  savedToggle.addEventListener(
    "click",
    function() {

      if (saved.size === 0) {

        toast(
          "You haven't saved any finds yet."
        );

      } else {

        toast(
          `${saved.size} saved find${
            saved.size === 1 ? "" : "s"
          } on this device.`
        );

      }

    }
  );

}


/* =========================================
   MOBILE MENU
========================================= */

const menuToggle =
  $("#menuToggle");

const mobileNav =
  $("#mobileNav");


if (menuToggle && mobileNav) {

  menuToggle.addEventListener(
    "click",
    function() {

      mobileNav.classList.toggle(
        "open"
      );


      menuToggle.setAttribute(
        "aria-expanded",
        mobileNav.classList.contains(
          "open"
        )
      );

    }
  );


  mobileNav
    .querySelectorAll("a")
    .forEach(link => {

      link.addEventListener(
        "click",
        function() {

          mobileNav.classList.remove(
            "open"
          );


          menuToggle.setAttribute(
            "aria-expanded",
            "false"
          );

        }
      );

    });

}


/* =========================================
   NEWSLETTER
========================================= */

const newsletter =
  $("#newsletter");


if (newsletter) {

  newsletter.addEventListener(
    "submit",
    function(event) {

      event.preventDefault();


      toast(
        "Preview only — newsletter integration will be connected before launch."
      );


      newsletter.reset();

    }
  );

}


/* =========================================
   START BUYARA
========================================= */

loadProducts();