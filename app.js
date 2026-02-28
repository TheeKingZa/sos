/* app.js
  - Loads product data from ./items.json using fetch()
  - Renders product cards into #itemsGrid
  - Supports: search, category filter, sorting, qty updates, subtotal calculation
  - Image fallback:
      - If imageUrl is empty => use ./assets/imgs/logo.png
      - If image fails to load => swap to ./assets/imgs/logo.png

  + NEW:
    - Copy Tupperware self-register link to clipboard
    - Share buttons: WhatsApp, Facebook, X, Instagram
*/

const FALLBACK_IMAGE = "./assets/imgs/logo.png";
const DATA_URL = "./items.json";

/* IMPORTANT:
   This must match the link shown in your HTML input value.
*/
const REGISTER_LINK = "https://amp.tuppafrica.co.za/register/160191/368";

const els = {
  itemsGrid: document.getElementById("itemsGrid"),
  resultsMeta: document.getElementById("resultsMeta"),
  searchInput: document.getElementById("searchInput"),
  categorySelect: document.getElementById("categorySelect"),
  sortSelect: document.getElementById("sortSelect"),
  cartCount: document.getElementById("cartCount"),
  cartSubtotal: document.getElementById("cartSubtotal"),
  clearCartBtn: document.getElementById("clearCartBtn"),
};

let items = [];

const state = {
  query: "",
  category: "__all__",
  sort: "name-asc",
  qtyBySku: {} // sku -> qty
};

function safeText(v) {
  return (v ?? "").toString();
}
function normalize(str) {
  return safeText(str).trim().toLowerCase();
}
function formatMoney(amount, currency = "R") {
  const n = Number(amount || 0);
  return `${currency} ${n.toFixed(2)}`;
}

/* ---------------------------------------------
   Register link: Copy + Share
---------------------------------------------- */

/* Sets up the "Copy link" button:
   - Copies the register link from #registerLink input to clipboard
   - Writes a short success message into #copyStatus
*/
function setupRegisterCopy() {
  const input = document.getElementById("registerLink");
  const btn = document.getElementById("copyRegisterBtn");
  const status = document.getElementById("copyStatus");
  if (!input || !btn || !status) return;

  // Ensure the input has the correct link (helps if HTML changes)
  input.value = REGISTER_LINK;

  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(input.value);
      status.textContent = "Link copied to clipboard.";
    } catch {
      // Fallback for older browsers
      input.focus();
      input.select();
      document.execCommand("copy");
      status.textContent = "Link copied. (fallback)";
    }
    window.setTimeout(() => (status.textContent = ""), 2500);
  });
}

/* Sets up the Share buttons:
   - WhatsApp: opens wa.me with a pre-filled message + link
   - Facebook: opens sharer with the URL
   - X: opens tweet intent with text + url
   - Instagram: can't prefill via browser; best we can do is copy the link and open Instagram
*/
function setupShareButtons() {
  const input = document.getElementById("registerLink");
  const status = document.getElementById("copyStatus");
  const buttons = document.querySelectorAll(".share-btn");
  if (!input || !status || !buttons.length) return;

  input.value = REGISTER_LINK;

  // Your share message. Edit this wording anytime.
  const baseText = "Register to Tupperware using my self-register link:";

  function openShare(url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function copyLink(message) {
    try {
      await navigator.clipboard.writeText(input.value);
      status.textContent = message;
    } catch {
      input.focus();
      input.select();
      document.execCommand("copy");
      status.textContent = message + " (fallback)";
    }
    window.setTimeout(() => (status.textContent = ""), 3000);
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const link = input.value.trim();
      const platform = btn.dataset.platform;

      if (platform === "whatsapp") {
        const text = encodeURIComponent(`${baseText} ${link}`);
        openShare(`https://wa.me/?text=${text}`);
        return;
      }

      if (platform === "facebook") {
        // Facebook share typically uses only the URL
        const u = encodeURIComponent(link);
        openShare(`https://www.facebook.com/sharer/sharer.php?u=${u}`);
        return;
      }

      if (platform === "x") {
        const text = encodeURIComponent(baseText);
        const url = encodeURIComponent(link);
        openShare(`https://twitter.com/intent/tweet?text=${text}&url=${url}`);
        return;
      }

      if (platform === "instagram") {
        // No direct “share with prefilled link” from a normal website
        await copyLink("Link copied. Paste it into Instagram (bio/story/DM).");
        openShare("https://www.instagram.com/");
        return;
      }
    });
  });
}

/* ---------------------------------------------
   Data loading from items.json
---------------------------------------------- */

/* Load items from items.json
   NOTE: This requires running via http:// (local server or hosted site). */
async function loadItems() {
  const res = await fetch(DATA_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${DATA_URL} (${res.status})`);
  const data = await res.json();

  if (!Array.isArray(data)) {
    throw new Error("items.json must contain a JSON array of products.");
  }
  return data;
}

function ensureQtyInitialized() {
  for (const it of items) {
    const sku = safeText(it.sku);
    if (!(sku in state.qtyBySku)) {
      const q = Number.isFinite(Number(it.qty)) ? Number(it.qty) : 0;
      state.qtyBySku[sku] = Math.max(0, Math.floor(q));
    }
  }
}

function itemMatches(item, query) {
  if (!query) return true;
  const q = normalize(query);

  const hay = [
    item.sku,
    item.name,
    item.brand,
    item.category,
    item.description
  ].map(normalize).join(" ");

  return hay.includes(q);
}

function getCategories(list) {
  const set = new Set();
  for (const it of list) if (it.category) set.add(it.category);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function populateCategorySelect() {
  const cats = getCategories(items);
  for (const c of cats) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    els.categorySelect.appendChild(opt);
  }
}

function applyFiltersAndSort() {
  let list = [...items];

  // search
  list = list.filter(it => itemMatches(it, state.query));

  // category
  if (state.category !== "__all__") {
    list = list.filter(it => safeText(it.category) === state.category);
  }

  // sort
  const byName = (a, b) => safeText(a.name).localeCompare(safeText(b.name));
  const bySku = (a, b) => safeText(a.sku).localeCompare(safeText(b.sku));
  const byPrice = (a, b) => Number(a.priceExVat) - Number(b.priceExVat);

  switch (state.sort) {
    case "name-desc": list.sort((a, b) => -byName(a, b)); break;
    case "price-asc": list.sort(byPrice); break;
    case "price-desc": list.sort((a, b) => -byPrice(a, b)); break;
    case "sku-asc": list.sort(bySku); break;
    case "sku-desc": list.sort((a, b) => -bySku(a, b)); break;
    case "name-asc":
    default: list.sort(byName); break;
  }

  return list;
}

function computeCart() {
  let count = 0;
  let subtotal = 0;
  let currency = "R";

  for (const it of items) {
    const sku = safeText(it.sku);
    const qty = Number(state.qtyBySku[sku] || 0);

    if (qty > 0) {
      count += qty;
      subtotal += qty * Number(it.priceExVat || 0);
      currency = it.currency || currency;
    }
  }

  return { count, subtotal, currency };
}

function renderCard(it) {
  const sku = safeText(it.sku);
  const name = safeText(it.name);
  const brand = safeText(it.brand || "");
  const category = safeText(it.category || "");
  const description = safeText(it.description || "");
  const currency = safeText(it.currency || "R");

  const qty = Number(state.qtyBySku[sku] || 0);
  const price = formatMoney(it.priceExVat, currency);

  // fallback if blank
  const src = safeText(it.imageUrl).trim() ? it.imageUrl : FALLBACK_IMAGE;

  return `
    <article class="card" data-sku="${sku}">
      <div class="card-inner">
        <img class="product-img"
             src="${src}"
             alt="${name}"
             loading="lazy"
             data-fallback="1" />

        <div>
          <h2 class="product-title">${name}</h2>

          <div class="product-meta">
            <span class="badge">SKU: ${sku}</span>
            ${brand ? `<span class="badge">${brand}</span>` : ""}
            ${category ? `<span class="badge">${category}</span>` : ""}
          </div>

          ${description ? `<p class="product-desc">${description}</p>` : ""}
        </div>
      </div>

      <div class="card-bottom">
        <div class="price-line">
          <div class="price">Price: ${price}</div>
          <div class="vat-note">(excl vat)</div>
        </div>

        <div class="qty-row">
          <label for="qty-${sku}">Qty</label>
          <input id="qty-${sku}"
                 class="qty-input"
                 type="number"
                 min="0"
                 step="1"
                 value="${qty}"
                 inputmode="numeric" />
        </div>
      </div>
    </article>
  `;
}

function wireEvents(renderedList) {
  // qty inputs
  for (const it of renderedList) {
    const sku = safeText(it.sku);
    const input = document.getElementById(`qty-${sku}`);
    if (!input) continue;

    input.addEventListener("input", () => {
      const next = Math.max(0, Math.floor(Number(input.value || 0)));
      state.qtyBySku[sku] = next;

      // normalize field (no negatives/decimals)
      if (input.value !== String(next)) input.value = String(next);

      render();
    });
  }

  // image error fallback
  document.querySelectorAll('img[data-fallback="1"]').forEach(img => {
    img.addEventListener("error", () => {
      img.src = FALLBACK_IMAGE;
    }, { once: true });
  });
}

function render() {
  const list = applyFiltersAndSort();
  const { count, subtotal, currency } = computeCart();

  els.cartCount.textContent = String(count);
  els.cartSubtotal.textContent = formatMoney(subtotal, currency);
  els.resultsMeta.textContent = `${list.length} product(s) shown`;

  els.itemsGrid.innerHTML = list.map(renderCard).join("");
  wireEvents(list);
}

async function init() {
  // NEW: wire up register link copy + share buttons (needs the HTML section to exist)
  setupRegisterCopy();
  setupShareButtons();

  // 1) Load data
  items = await loadItems();

  // 2) Prepare state + UI
  ensureQtyInitialized();
  populateCategorySelect();

  // 3) Wire header controls
  els.searchInput.addEventListener("input", (e) => {
    state.query = e.target.value;
    render();
  });

  els.categorySelect.addEventListener("change", (e) => {
    state.category = e.target.value;
    render();
  });

  els.sortSelect.addEventListener("change", (e) => {
    state.sort = e.target.value;
    render();
  });

  els.clearCartBtn.addEventListener("click", () => {
    for (const sku of Object.keys(state.qtyBySku)) state.qtyBySku[sku] = 0;
    render();
  });

  // 4) First render
  render();
}

init().catch(err => {
  console.error(err);
  els.resultsMeta.textContent = "Could not load products.";
  els.itemsGrid.innerHTML = `
    <div class="card" style="padding:14px">
      <p><strong>Error:</strong> ${safeText(err.message)}</p>
      <p class="muted">
        Tip: open this site via <strong>http://</strong> (not file://) so fetch() can read items.json.
      </p>
    </div>
  `;
});