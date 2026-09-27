let products = [];

let activeFilter = "All";
let activeBudget = null;
let searchQuery = "";

let saved = new Set(
  JSON.parse(localStorage.getItem("buyaraSaved") || "[]")
);


/* -----------------------------
   HELPERS
----------------------------- */

const $ = (selector) => document.querySelector(selector);

const money = (number) =>
  "₹" + Number(number).toLocaleString("en-IN");


function showToast(message) {

  const toast = $("#toast");

  if (!toast) return;

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(window.buyaraToast);

  window.buyaraToast = setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}


/* -----------------------------
   PRODUCT FILTERING
----------------------------- */

function productMatches(product) {

  const categoryMatch =
    activeFilter === "All" ||
    product.cat === activeFilter;


  const budgetMatch =
    !activeBudget ||
    Number(product.price) <= Number(activeBudget);


  const text =
    `${product.name} ${product.cat} ${product.note} ${product.searchTerms || ""}`
      .toLowerCase();


  const searchMatch =
    !searchQuery ||
    text.includes(searchQuery);


  return categoryMatch &&
         budgetMatch &&
         searchMatch;
}


/* -----------------------------
   RENDER PRODUCTS
----------------------------- */

function renderProducts() {

  const grid = $("#productGrid");

  if (!grid) return;


  const filteredProducts =
    products.filter(productMatches);


  if (!filteredProducts.length) {

    grid.innerHTML = `
      <div class="empty-state">

        <div>
          <b>No matching picks yet.</b>

          <span>
            Try another need or a slightly different budget.
          </span>
        </div>

      </div>
    `;

    return;
  }


  grid.innerHTML =
    filteredProducts
      .map(product => {

        const isSaved =
          saved.has(String(product.id)) ||
          saved.has(Number(product.id));


        return `

          <article class="product">

            <div class="product-img">

              <img
                src="${product.image}"
                alt="${escapeHTML(product.name)}"
                loading="lazy"
                decoding="async"
              >

              <span class="badge">
                ${escapeHTML(product.badge)}
              </span>


              <button
                class="save ${isSaved ? "saved" : ""}"
                data-save="${product.id}"
                aria-label="Save ${escapeHTML(product.name)}"
              >
                ${isSaved ? "♥" : "♡"}
              </button>

            </div>


            <div class="product-body">

              <small>
                ${escapeHTML(product.cat)}
              </small>


              <h3>
                ${escapeHTML(product.name)}
              </h3>


              <p>
                ${escapeHTML(product.note)}
              </p>


              <div class="product-bottom">

                <strong>
                  ${money(product.price)}
                </strong>


                <button
                  data-check="${product.id}"
                >
                  Check Price →
                </button>

              </div>

            </div>

          </article>

        `;

      })
      .join("");
}


/* -----------------------------
   SEARCH
----------------------------- */

function performSearch(value) {

  searchQuery =
    value
      .trim()
      .toLowerCase();


  activeFilter = "All";
  activeBudget = null;


  document
    .querySelectorAll("[data-filter]")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.filter === "All"
      );

    });


  renderProducts();


  const popular =
    $("#popular");

  if (popular) {

    popular.scrollIntoView({
      behavior: "smooth"
    });

  }

}


/* -----------------------------
   BUDGET
----------------------------- */

function selectBudget(value) {

  activeBudget = Number(value);

  activeFilter = "All";

  searchQuery = "";


  document
    .querySelectorAll("[data-filter]")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.filter === "All"
      );

    });


  renderProducts();


  const popular =
    $("#popular");

  if (popular) {

    popular.scrollIntoView({
      behavior: "smooth"
    });

  }

}


/* -----------------------------
   ESCAPE HTML
----------------------------- */

function escapeHTML(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* -----------------------------
   CLICK HANDLER
----------------------------- */

document.addEventListener("click", (event) => {


  /* SAVE */

  const saveButton =
    event.target.closest("[data-save]");


  if (saveButton) {

    const id =
      String(saveButton.dataset.save);


    if (saved.has(id)) {

      saved.delete(id);

      showToast("Removed from saved");

    } else {

      saved.add(id);

      showToast("Saved to your finds ♥");

    }


    localStorage.setItem(
      "buyaraSaved",
      JSON.stringify([...saved])
    );


    updateSavedCount();

    renderProducts();

    return;
  }


  /* CHECK PRICE */

  const checkButton =
    event.target.closest("[data-check]");


  if (checkButton) {

    const id =
      String(checkButton.dataset.check);


    const product =
      products.find(
        item => String(item.id) === id
      );


    if (!product) return;


    if (
      product.affiliateLink &&
      product.affiliateLink !== "#"
    ) {

      window.open(
        product.affiliateLink,
        "_blank",
        "noopener,noreferrer"
      );

    } else {

      showToast(
        "Merchant link will be connected after product verification."
      );

    }

    return;
  }


  /* NEED CARDS */

  const queryButton =
    event.target.closest("[data-query]");


  if (queryButton) {

    const query =
      queryButton.dataset.query;


    const input =
      $("#needInput");


    if (input) {
      input.value = query;
    }


    performSearch(query);

    return;
  }


  /* BUDGET */

  const budgetButton =
    event.target.closest("[data-decision-budget]");


  if (budgetButton) {

    selectBudget(
      budgetButton.dataset.decisionBudget
    );

    return;
  }

});


/* -----------------------------
   FILTER BUTTONS
----------------------------- */

document
  .querySelectorAll("[data-filter]")
  .forEach(button => {

    button.addEventListener("click", () => {

      activeFilter =
        button.dataset.filter;

      activeBudget = null;

      searchQuery = "";


      document
        .querySelectorAll("[data-filter]")
        .forEach(item => {

          item.classList.toggle(
            "active",
            item === button
          );

        });


      renderProducts();

    });

  });


/* -----------------------------
   SEARCH TOGGLE
----------------------------- */

const searchToggle =
  $("#searchToggle");


if (searchToggle) {

  searchToggle.addEventListener(
    "click",
    () => {

      const row =
        $("#searchRow");


      if (!row) return;


      row.classList.toggle("show");


      if (row.classList.contains("show")) {

        const input =
          $("#searchInput");

        if (input) input.focus();

      }

    }
  );

}


/* -----------------------------
   SEARCH BUTTON
----------------------------- */

const searchButton =
  $("#searchButton");


if (searchButton) {

  searchButton.addEventListener(
    "click",
    () => {

      performSearch(
        $("#searchInput").value
      );

    }
  );

}


/* -----------------------------
   SEARCH ENTER
----------------------------- */

const searchInput =
  $("#searchInput");


if (searchInput) {

  searchInput.addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {

        performSearch(
          event.target.value
        );

      }

    }
  );

}


/* -----------------------------
   HERO SEARCH
----------------------------- */

const needSearchButton =
  $("#needSearchBtn");


if (needSearchButton) {

  needSearchButton.addEventListener(
    "click",
    () => {

      performSearch(
        $("#needInput").value
      );

    }
  );

}


const needInput =
  $("#needInput");


if (needInput) {

  needInput.addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {

        performSearch(
          event.target.value
        );

      }

    }
  );

}


/* -----------------------------
   SAVED COUNT
----------------------------- */

function updateSavedCount() {

  const count =
    $("#savedCount");

  if (count) {

    count.textContent =
      saved.size;

  }

}


updateSavedCount();


/* -----------------------------
   SAVED BUTTON
----------------------------- */

const savedToggle =
  $("#savedToggle");


if (savedToggle) {

  savedToggle.addEventListener(
    "click",
    () => {

      if (!saved.size) {

        showToast(
          "You haven't saved anything yet."
        );

      } else {

        showToast(
          `${saved.size} saved find${saved.size === 1 ? "" : "s"} on this device.`
        );

      }

    }
  );

}


/* -----------------------------
   MOBILE MENU
----------------------------- */

const menuToggle =
  $("#menuToggle");


if (menuToggle) {

  menuToggle.addEventListener(
    "click",
    () => {

      const nav =
        $("#mobileNav");

      if (nav) {
        nav.classList.toggle("open");
      }

    }
  );

}


/* -----------------------------
   NEWSLETTER
----------------------------- */

const newsletter =
  $("#newsletter");


if (newsletter) {

  newsletter.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      showToast(
        "Newsletter signup will be connected before launch."
      );

      newsletter.reset();

    }
  );

}


/* -----------------------------
   LOAD PRODUCTS
----------------------------- */

async function loadProducts() {

  const grid =
    $("#productGrid");


  try {

    const response =
      await fetch("./products.json", {
        cache: "no-store"
      });


    if (!response.ok) {
      throw new Error(
        `products.json returned ${response.status}`
      );
    }


    const data =
      await response.json();


    if (!Array.isArray(data)) {
      throw new Error(
        "products.json must contain an array"
      );
    }


    products = data;


    renderProducts();


  } catch (error) {

    console.error(
      "BUYARA product loading error:",
      error
    );


    if (grid) {

      grid.innerHTML = `

        <div class="empty-state">

          <div>

            <b>Products are loading incorrectly.</b>

            <span>
              Please make sure products.json is uploaded
              in the same folder as index.html.
            </span>

          </div>

        </div>

      `;

    }

  }

}


loadProducts();
