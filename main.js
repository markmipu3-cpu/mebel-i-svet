/* «Мебель и свет» — каталог: фильтры, поиск, корзина, избранное, кабинет.
   Все обработчики через addEventListener, без инлайнов.
   localStorage обёрнут в try/catch — работает на сайте, не ломает превью. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  var qs = function (s, r) { return (r || document).querySelector(s); };
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0"); }
  function store(key, val) {
    try {
      if (val === undefined) { var v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { return null; }
  }

  var grid, cards;
  var cart = {}, favs = {};
  var filters = { types: [], colors: [], price: "any", stock: false, search: "" };

  document.addEventListener("DOMContentLoaded", function () {
    grid = qs("[data-grid]");
    if (!grid) return;
    cards = qsa(".card", grid);
    initNav();
    initSearch();
    initFilters();
    initSort();
    initFavorites();
    initCart();
    initOverlays();
    initAccount();
    initNewsletter();
    initMore();
    restore();
    applyFilters();
  });

  /* ---------- card helpers ---------- */
  function cardById(id) { return grid.querySelector('.card[data-id="' + id + '"]'); }
  function cardInfo(card) {
    var use = card.querySelector(".fixture use");
    return {
      id: card.getAttribute("data-id"),
      name: card.querySelector(".card-name").textContent,
      type: card.querySelector(".card-type").textContent,
      fx: (use ? use.getAttribute("href") || "" : "").replace("#f-", ""),
      price: parseInt(card.getAttribute("data-price"), 10) || 0
    };
  }
  function thumb(info) {
    return '<div class="line-thumb"><svg class="fixture" viewBox="0 0 120 120" aria-hidden="true"><use href="#f-' + info.fx + '"/></svg></div>';
  }

  /* ---------- nav ---------- */
  function initNav() {
    var toggle = qs(".nav-toggle"), nav = qs(".main-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
    });
  }

  /* ---------- search ---------- */
  function initSearch() {
    var bar = qs("[data-search-bar]"), input = qs("[data-search-input]");
    var open = qs("[data-search-open]"), close = qs("[data-search-close]");
    if (!bar) return;
    if (open) open.addEventListener("click", function () { bar.hidden = false; if (input) input.focus(); });
    function hide() { bar.hidden = true; if (input) input.value = ""; filters.search = ""; applyFilters(); }
    if (close) close.addEventListener("click", hide);
    if (input) {
      input.addEventListener("input", function () { filters.search = input.value.trim().toLowerCase(); applyFilters(); });
      input.addEventListener("keydown", function (e) { if (e.key === "Escape") hide(); });
    }
  }

  /* ---------- filters ---------- */
  function initFilters() {
    qsa(".filter-group").forEach(function (g) {
      var btn = g.querySelector(".chip");
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = g.classList.toggle("open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        qsa(".filter-group").forEach(function (o) {
          if (o !== g) { o.classList.remove("open"); o.querySelector(".chip").setAttribute("aria-expanded", "false"); }
        });
      });
      var pop = g.querySelector(".filter-pop");
      if (pop) pop.addEventListener("click", function (e) { e.stopPropagation(); });
    });
    document.addEventListener("click", function () {
      qsa(".filter-group.open").forEach(function (g) { g.classList.remove("open"); g.querySelector(".chip").setAttribute("aria-expanded", "false"); });
    });

    qsa("[data-f-type], [data-f-color], [data-f-price]").forEach(function (i) { i.addEventListener("change", readFilters); });

    var stockChip = qs('.chip[data-filter="stock"]');
    if (stockChip) stockChip.addEventListener("click", function () {
      filters.stock = !filters.stock; stockChip.classList.toggle("is-on", filters.stock); applyFilters();
    });

    var reset = qs("[data-reset]");
    if (reset) reset.addEventListener("click", resetFilters);
  }

  function readFilters() {
    filters.types = qsa("[data-f-type]:checked").map(function (i) { return i.value; });
    filters.colors = qsa("[data-f-color]:checked").map(function (i) { return i.value; });
    var pr = qs("[data-f-price]:checked");
    filters.price = pr ? pr.value : "any";
    applyFilters();
  }

  function priceOk(p) {
    if (filters.price === "lt10") return p < 10000;
    if (filters.price === "10-30") return p >= 10000 && p <= 30000;
    if (filters.price === "gt30") return p > 30000;
    return true;
  }

  function applyFilters() {
    var visible = 0;
    cards.forEach(function (c) {
      var ok = true;
      if (filters.stock && c.getAttribute("data-stock") !== "in") ok = false;
      if (ok && filters.types.length && filters.types.indexOf(c.getAttribute("data-type")) < 0) ok = false;
      if (ok && filters.colors.length) {
        var cc = (c.getAttribute("data-colors") || "").split(" ");
        if (!filters.colors.some(function (col) { return cc.indexOf(col) >= 0; })) ok = false;
      }
      if (ok && !priceOk(parseInt(c.getAttribute("data-price"), 10) || 0)) ok = false;
      if (ok && filters.search && c.querySelector(".card-name").textContent.toLowerCase().indexOf(filters.search) < 0) ok = false;
      c.classList.toggle("is-hidden", !ok);
      if (ok) visible++;
    });
    var cnt = qs("[data-count]"); if (cnt) cnt.textContent = String(visible);
    var empty = qs("[data-empty]"); if (empty) empty.hidden = visible !== 0;

    setChip("type", filters.types.length > 0);
    setChip("color", filters.colors.length > 0);
    setChip("price", filters.price !== "any");
    var active = filters.stock || filters.types.length || filters.colors.length || filters.price !== "any" || filters.search;
    var reset = qs("[data-reset]"); if (reset) reset.hidden = !active;
  }

  function setChip(group, on) {
    var g = qs('.filter-group[data-group="' + group + '"]');
    if (g) g.querySelector(".chip").classList.toggle("is-on", on);
  }

  function resetFilters() {
    filters = { types: [], colors: [], price: "any", stock: false, search: "" };
    qsa("[data-f-type], [data-f-color]").forEach(function (i) { i.checked = false; });
    var anyP = qs('[data-f-price][value="any"]'); if (anyP) anyP.checked = true;
    var stockChip = qs('.chip[data-filter="stock"]'); if (stockChip) stockChip.classList.remove("is-on");
    var si = qs("[data-search-input]"); if (si) si.value = "";
    applyFilters();
  }

  /* ---------- sort ---------- */
  function initSort() {
    var sel = qs("[data-sort]"); if (!sel) return;
    var original = cards.slice();
    function price(c) { return parseInt(c.getAttribute("data-price"), 10) || 0; }
    sel.addEventListener("change", function () {
      var arr = original.slice();
      if (sel.value === "cheap") arr.sort(function (a, b) { return price(a) - price(b); });
      else if (sel.value === "exp") arr.sort(function (a, b) { return price(b) - price(a); });
      else if (sel.value === "name") arr.sort(function (a, b) {
        return a.querySelector(".card-name").textContent.localeCompare(b.querySelector(".card-name").textContent, "ru");
      });
      arr.forEach(function (c) { grid.appendChild(c); });
    });
  }

  /* ---------- favorites ---------- */
  function initFavorites() {
    cards.forEach(function (c) {
      var btn = c.querySelector("[data-fav]");
      if (btn) btn.addEventListener("click", function () { toggleFav(c.getAttribute("data-id")); });
    });
    var list = qs("[data-fav-list]");
    if (list) list.addEventListener("click", function (e) {
      var add = e.target.closest("[data-fav-add]"), rm = e.target.closest("[data-fav-rm]");
      if (add) addToCart(add.getAttribute("data-fav-add"));
      if (rm) toggleFav(rm.getAttribute("data-fav-rm"));
    });
  }
  function toggleFav(id) {
    if (favs[id]) delete favs[id]; else favs[id] = true;
    syncFavUI(); store("mis_favs", Object.keys(favs));
  }
  function syncFavUI() {
    cards.forEach(function (c) {
      var btn = c.querySelector("[data-fav]");
      if (btn) btn.classList.toggle("is-on", !!favs[c.getAttribute("data-id")]);
    });
    var n = Object.keys(favs).length;
    qsa("[data-fav-count]").forEach(function (e) { e.textContent = String(n); });
    renderFavDrawer();
  }
  function renderFavDrawer() {
    var list = qs("[data-fav-list]"), empty = qs("[data-fav-empty]");
    if (!list) return;
    list.innerHTML = "";
    var ids = Object.keys(favs);
    if (empty) empty.hidden = ids.length > 0;
    ids.forEach(function (id) {
      var c = cardById(id); if (!c) return;
      var info = cardInfo(c);
      var row = document.createElement("div"); row.className = "line-item";
      row.innerHTML = thumb(info) +
        '<div class="line-info"><p class="line-type">' + info.type + '</p><p class="line-name">' + info.name + '</p>' +
        '<p class="line-price">' + fmt(info.price) + '\u00a0\u20bd</p>' +
        '<div class="line-actions"><button class="line-add" type="button" data-fav-add="' + id + '">В корзину</button>' +
        '<button class="line-remove" type="button" data-fav-rm="' + id + '">Убрать</button></div></div>';
      list.appendChild(row);
    });
  }

  /* ---------- cart ---------- */
  function initCart() {
    cards.forEach(function (c) {
      var add = c.querySelector("[data-add]");
      if (add) add.addEventListener("click", function () { addToCart(c.getAttribute("data-id")); openDrawer("cart"); });
    });
    var list = qs("[data-cart-list]");
    if (list) list.addEventListener("click", function (e) {
      var inc = e.target.closest("[data-inc]"), dec = e.target.closest("[data-dec]"), rm = e.target.closest("[data-rm]");
      if (inc) changeQty(inc.getAttribute("data-inc"), 1);
      if (dec) changeQty(dec.getAttribute("data-dec"), -1);
      if (rm) { delete cart[rm.getAttribute("data-rm")]; syncCart(); }
    });
    var checkout = qs("[data-checkout]");
    if (checkout) checkout.addEventListener("click", function () {
      var note = qs("[data-cart-note]");
      if (Object.keys(cart).length === 0) { if (note) note.textContent = "Корзина пуста."; return; }
      if (note) note.textContent = "Заказ оформлен — это демонстрация. Спасибо!";
      cart = {}; syncCart();
    });
  }
  function addToCart(id) {
    var c = cardById(id); if (!c) return;
    var info = cardInfo(c);
    if (cart[id]) cart[id].qty++;
    else cart[id] = { id: id, name: info.name, type: info.type, fx: info.fx, price: info.price, qty: 1 };
    syncCart();
  }
  function changeQty(id, d) {
    if (!cart[id]) return;
    cart[id].qty += d;
    if (cart[id].qty <= 0) delete cart[id];
    syncCart();
  }
  function syncCart() {
    var list = qs("[data-cart-list]"), empty = qs("[data-cart-empty]"), totalEl = qs("[data-cart-total]");
    var ids = Object.keys(cart), total = 0, n = 0;
    if (list) list.innerHTML = "";
    ids.forEach(function (id) {
      var it = cart[id]; total += it.price * it.qty; n += it.qty;
      if (!list) return;
      var row = document.createElement("div"); row.className = "line-item";
      row.innerHTML = thumb(it) +
        '<div class="line-info"><p class="line-type">' + it.type + '</p><p class="line-name">' + it.name + '</p>' +
        '<p class="line-price">' + fmt(it.price) + '\u00a0\u20bd</p>' +
        '<div class="line-actions"><span class="qty">' +
        '<button type="button" data-dec="' + id + '" aria-label="Меньше">\u2212</button>' +
        '<span>' + it.qty + '</span>' +
        '<button type="button" data-inc="' + id + '" aria-label="Больше">+</button></span>' +
        '<button class="line-remove" type="button" data-rm="' + id + '">Убрать</button></div></div>';
      list.appendChild(row);
    });
    if (empty) empty.hidden = ids.length > 0;
    if (totalEl) totalEl.textContent = fmt(total) + "\u00a0\u20bd";
    qsa("[data-cart-count]").forEach(function (e) { e.textContent = String(n); });
    store("mis_cart", cart);
  }

  /* ---------- overlays (drawers / backdrop) ---------- */
  function initOverlays() {
    var cartOpen = qs("[data-cart-open]"), favOpen = qs("[data-fav-open]"), bk = qs("[data-backdrop]");
    if (cartOpen) cartOpen.addEventListener("click", function () { openDrawer("cart"); });
    if (favOpen) favOpen.addEventListener("click", function () { openDrawer("fav"); });
    if (bk) bk.addEventListener("click", function () { closeAll(); });
    qsa("[data-close]").forEach(function (b) { b.addEventListener("click", function () { closeAll(); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeAll(); });
  }
  function openDrawer(name) {
    closeAll(true);
    var d = qs('[data-drawer="' + name + '"]'); if (!d) return;
    if (name === "cart") syncCart(); else if (name === "fav") renderFavDrawer();
    d.classList.add("open"); d.setAttribute("aria-hidden", "false");
    var bk = qs("[data-backdrop]");
    if (bk) { bk.hidden = false; requestAnimationFrame(function () { bk.classList.add("show"); }); }
    document.body.classList.add("no-scroll");
  }
  function openModal() {
    closeAll(true);
    var m = qs("[data-modal]"); if (!m) return;
    m.classList.add("open"); m.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  }
  function closeAll(keepScroll) {
    qsa(".drawer.open").forEach(function (d) { d.classList.remove("open"); d.setAttribute("aria-hidden", "true"); });
    var m = qs("[data-modal]"); if (m) { m.classList.remove("open"); m.setAttribute("aria-hidden", "true"); }
    var bk = qs("[data-backdrop]");
    if (bk) { bk.classList.remove("show"); setTimeout(function () { bk.hidden = true; }, 300); }
    if (!keepScroll) document.body.classList.remove("no-scroll");
  }

  /* ---------- account modal ---------- */
  function initAccount() {
    var openBtn = qs("[data-account-open]");
    if (openBtn) openBtn.addEventListener("click", openModal);
    var modal = qs("[data-modal]");
    if (modal) modal.addEventListener("click", function (e) { if (e.target === modal) closeAll(); });
    qsa(".tab").forEach(function (t) {
      t.addEventListener("click", function () {
        qsa(".tab").forEach(function (x) { x.classList.toggle("is-on", x === t); });
        var which = t.getAttribute("data-tab");
        qsa(".auth-form").forEach(function (f) { f.classList.toggle("is-hidden", f.getAttribute("data-form") !== which); });
        var note = qs("[data-auth-note]"); if (note) note.textContent = "";
      });
    });
    qsa(".auth-form").forEach(function (f) {
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var note = qs("[data-auth-note]");
        var email = f.querySelector('input[type="email"]');
        var val = email ? email.value.trim() : "";
        if (!val || val.indexOf("@") < 1) { if (note) note.textContent = "Введите корректный e-mail."; return; }
        if (note) note.textContent = f.getAttribute("data-form") === "login"
          ? "Вход выполнен (демо)."
          : "Готово — логин и пароль отправлены на почту (демо).";
      });
    });
  }

  /* ---------- newsletter ---------- */
  function initNewsletter() {
    var form = qs(".news-form"), note = qs(".news-note");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector("input");
      var value = input ? input.value.trim() : "";
      if (!note) return;
      if (value && value.indexOf("@") > 0) { note.textContent = "Готово — проверьте почту."; if (input) input.value = ""; }
      else { note.textContent = "Введите корректный e-mail."; }
    });
  }

  /* ---------- load more ---------- */
  function initMore() {
    var btn = qs(".btn-more"); if (!btn) return;
    btn.addEventListener("click", function () {
      btn.textContent = "Показаны все товары категории";
      btn.disabled = true;
      btn.classList.add("is-done");
    });
  }

  /* ---------- restore from storage ---------- */
  function restore() {
    var sc = store("mis_cart"); if (sc && typeof sc === "object") cart = sc;
    var sf = store("mis_favs"); if (sf && sf.length) sf.forEach(function (id) { favs[id] = true; });
    syncCart();
    syncFavUI();
  }
})();
