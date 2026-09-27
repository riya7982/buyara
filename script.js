let products=[];
let filter="All", budget=null, query="";
let saved=new Set(JSON.parse(localStorage.getItem("buyaraSaved")||"[]"));

const $=s=>document.querySelector(s);
const money=n=>"₹"+Number(n).toLocaleString("en-IN");

function toast(t){
  const x=$("#toast");
  x.textContent=t;
  x.classList.add("show");
  clearTimeout(window.tt);
  window.tt=setTimeout(()=>x.classList.remove("show"),2400);
}

function matchesQuery(p){
  return !query || `${p.name} ${p.cat} ${p.note}`.toLowerCase().includes(query);
}

function render(){
  const list=products.filter(
    p =>
      (filter==="All" || p.cat===filter) &&
      (!budget || p.price<=budget) &&
      matchesQuery(p)
  );

  $("#productGrid").innerHTML=list.length
    ? list.map(p=>`
      <article class="product">
        <div class="product-img">
          <img
            loading="lazy"
            decoding="async"
            src="https://images.unsplash.com/${p.img}?auto=format&fit=crop&w=650&q=78&fm=webp"
            alt="${p.name}"
          >

          <span class="badge">${p.badge}</span>

          <button
            class="save ${saved.has(p.id)?"saved":""}"
            data-save="${p.id}"
            aria-label="Save ${p.name}"
          >
            ${saved.has(p.id)?"♥":"♡"}
          </button>
        </div>

        <div class="product-body">
          <small>${p.cat.toUpperCase()}</small>

          <h3>${p.name}</h3>

          <p>${p.note}</p>

          <div class="product-bottom">
            <strong>${money(p.price)}</strong>
            <button data-check="${p.id}">
              See Shortlist →
            </button>
          </div>
        </div>
      </article>
    `).join("")
    :
    `
      <div class="empty-state">
        <b>We haven't researched a matching pick yet.</b>
        <span>
          Try another budget or need. More verified shortlists
          will be added as BUYARA grows.
        </span>
      </div>
    `;

  $("#savedCount").textContent=saved.size;
}

function applySearch(value){
  query=value.trim().toLowerCase();
  filter="All";
  budget=null;

  document
    .querySelectorAll("[data-filter]")
    .forEach(x =>
      x.classList.toggle("active",x.dataset.filter==="All")
    );

  render();

  $("#popular").scrollIntoView({
    behavior:"smooth"
  });
}

function setBudget(value){
  budget=Number(value);
  filter="All";

  document
    .querySelectorAll("[data-filter]")
    .forEach(x =>
      x.classList.toggle("active",x.dataset.filter==="All")
    );

  render();

  $("#popular").scrollIntoView({
    behavior:"smooth"
  });
}

document.addEventListener("click",e=>{

  const save=e.target.closest("[data-save]");

  if(save){
    const id=Number(save.dataset.save);

    saved.has(id)
      ? saved.delete(id)
      : saved.add(id);

    localStorage.setItem(
      "buyaraSaved",
      JSON.stringify([...saved])
    );

    render();

    toast(
      saved.has(id)
        ? "Saved to your finds ♡"
        : "Removed from saved"
    );
  }

  const check=e.target.closest("[data-check]");

  if(check){
    e.preventDefault();

    toast(
      "This shortlist is being researched. Merchant links will be connected after verification."
    );
  }

  const q=e.target.closest("[data-query]");

  if(q){
    e.preventDefault();
    applySearch(q.dataset.query);
  }

  const b=e.target.closest("[data-budget]");

  if(b){
    e.preventDefault();
    setBudget(b.dataset.budget);
  }

  const db=e.target.closest("[data-decision-budget]");

  if(db){
    setBudget(db.dataset.decisionBudget);
  }
});

document
  .querySelectorAll("[data-filter]")
  .forEach(b =>
    b.addEventListener("click",()=>{
      filter=b.dataset.filter;
      budget=null;

      document
        .querySelectorAll("[data-filter]")
        .forEach(x =>
          x.classList.toggle("active",x===b)
        );

      render();
    })
  );

$("#searchToggle").addEventListener(
  "click",
  ()=>{
    $("#searchRow").classList.toggle("show");

    if($("#searchRow").classList.contains("show")){
      $("#searchInput").focus();
    }
  }
);

$("#searchButton").addEventListener(
  "click",
  ()=>applySearch($("#searchInput").value)
);

$("#searchInput").addEventListener(
  "keydown",
  e=>{
    if(e.key==="Enter"){
      applySearch(e.target.value);
    }
  }
);

$("#needSearchBtn").addEventListener(
  "click",
  ()=>applySearch($("#needInput").value)
);

$("#needInput").addEventListener(
  "keydown",
  e=>{
    if(e.key==="Enter"){
      applySearch(e.target.value);
    }
  }
);

$("#savedToggle").addEventListener(
  "click",
  ()=>toast(
    `${saved.size} saved find${saved.size===1?"":"s"} on this device.`
  )
);

$("#menuToggle").addEventListener(
  "click",
  ()=>$("#mobileNav").classList.toggle("open")
);

$("#newsletter").addEventListener(
  "submit",
  e=>{
    e.preventDefault();

    toast(
      "Newsletter preview — email integration will be connected before launch."
    );

    e.target.reset();
  }
);

fetch("./products.json")
  .then(r=>r.json())
  .then(data=>{
    products=data;
    render();
  })
  .catch(()=>{
    products=[];
    render();
  });
