/* «Мебель и свет» — ядро сайта.
   Авто-определение корня (работает на project-страницах GitHub Pages),
   общие шапка/подвал (правятся здесь, в одном месте), корзина, трекер,
   эмуляция регистрации/ЛК, заказы. Всё через addEventListener, без инлайнов. */
(function () {
  "use strict";

  /* ---------- base path (works under /mebel-i-svet/ project page) ---------- */
  function detectRoot() {
    var s = document.currentScript;
    if (!s) {
      var ss = document.getElementsByTagName("script");
      for (var i = 0; i < ss.length; i++) {
        if (ss[i].src && ss[i].src.indexOf("assets/js/app.js") >= 0) { s = ss[i]; break; }
      }
    }
    var src = s ? s.src : location.href;
    var i = src.indexOf("assets/js/app.js");
    return i >= 0 ? src.slice(0, i) : (location.origin + "/");
  }
  var ROOT = detectRoot();
  function link(path) { return ROOT + (path || ""); }
  function asset(path) { return ROOT + "assets/" + path; }

  /* ---------- helpers ---------- */
  function qs(s, r) { return (r || document).querySelector(s); }
  function qsa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0"); }
  function money(n) { return fmt(n) + "\u00a0\u20bd"; }
  function get(key, def) { try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
  function set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
  function fixtureSvg(fx, cls) { return '<svg class="fixture ' + (cls || "") + '" viewBox="0 0 120 120" aria-hidden="true"><use href="#f-' + fx + '"/></svg>'; }

  /* ---------- SVG sprite (all fixtures + furniture) ---------- */
  var SPRITE =
    '<svg class="sprite" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
    '<symbol id="f-pendant" viewBox="0 0 120 120"><path d="M42 18 H78"/><path d="M60 18 V42"/><path d="M46 64 Q46 42 60 42 Q74 42 74 64"/><path d="M44 64 H76"/><circle cx="60" cy="72" r="5"/></symbol>' +
    '<symbol id="f-chandelier" viewBox="0 0 120 120"><path d="M60 16 V26"/><circle cx="60" cy="29" r="3.4"/><path d="M60 32 V50"/><path d="M60 35 C46 37 40 44 40 52"/><path d="M60 35 C74 37 80 44 80 52"/><path d="M37 52 H43"/><path d="M57 50 H63"/><path d="M77 52 H83"/><circle cx="40" cy="56" r="4.6"/><circle cx="60" cy="54" r="4.6"/><circle cx="80" cy="56" r="4.6"/></symbol>' +
    '<symbol id="f-floor" viewBox="0 0 120 120"><path d="M46 28 H74 L70 46 H50 Z"/><path d="M60 46 V94"/><path d="M48 96 Q60 100 72 96"/></symbol>' +
    '<symbol id="f-table" viewBox="0 0 120 120"><path d="M48 38 H72 L68 56 H52 Z"/><path d="M60 56 V76"/><path d="M52 80 Q60 84 68 80"/></symbol>' +
    '<symbol id="f-sconce" viewBox="0 0 120 120"><path d="M32 34 V86"/><circle cx="32" cy="60" r="4.4"/><path d="M36 60 H58"/><path d="M58 60 V53"/><path d="M50 53 H66 L62 45 H54 Z"/><circle cx="58" cy="50" r="1.6"/></symbol>' +
    '<symbol id="f-flush" viewBox="0 0 120 120"><path d="M38 38 H82"/><path d="M46 38 Q60 60 74 38"/><path d="M52 38 Q60 51 68 38"/><circle cx="60" cy="50" r="2.4"/></symbol>' +
    '<symbol id="f-sofa" viewBox="0 0 120 120"><path d="M30 58 Q30 50 38 50 H82 Q90 50 90 58 V78 H30 Z"/><path d="M30 64 H90"/><path d="M30 64 V58"/><path d="M90 64 V58"/><path d="M40 78 V86"/><path d="M80 78 V86"/></symbol>' +
    '<symbol id="f-cabinet" viewBox="0 0 120 120"><path d="M36 32 H84 V92 H36 Z"/><path d="M36 52 H84"/><path d="M36 72 H84"/><path d="M55 42 H65"/><path d="M55 62 H65"/><path d="M55 82 H65"/><path d="M42 92 V98"/><path d="M78 92 V98"/></symbol>' +
    '<symbol id="f-ftable" viewBox="0 0 120 120"><path d="M28 50 H92 V55 H28 Z"/><path d="M38 55 V92"/><path d="M82 55 V92"/><path d="M38 84 H82"/></symbol>' +
    '<symbol id="f-chair" viewBox="0 0 120 120"><path d="M46 36 Q46 32 50 32 H70 Q74 32 74 36 V68 H46 Z"/><path d="M46 68 H82 V74"/><path d="M50 74 V92"/><path d="M78 74 V92"/></symbol>' +
    '<symbol id="f-shelf" viewBox="0 0 120 120"><path d="M40 30 V96"/><path d="M80 30 V96"/><path d="M40 30 H80"/><path d="M40 47 H80"/><path d="M40 64 H80"/><path d="M40 81 H80"/><path d="M40 96 H80"/></symbol>' +
    "</svg>";

  /* ---------- icons ---------- */
  var IC = {
    menu: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    search: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/></svg>',
    user: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/></svg>',
    cart: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12l-1 12H7L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>',
    x: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    tg: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 5L3 12l5 2 2 5 3-4 5 4 3-14z"/></svg>',
    vk: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8c1 6 5 9 9 9h1v-3c1 0 2 1 3 2l1 1h3c-1-2-2-3-3-4 1-1 2-2 3-4h-3c-1 2-2 3-3 3V8h-3v4c-2 0-4-2-4-4H4z"/></svg>',
    mail: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M4 7l8 6 8-6"/></svg>',
    check: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 13l4 4L19 7"/></svg>'
  };

  /* ---------- header / footer (edit here — one place) ---------- */
  var NAV = [
    { href: "", label: "Освещение" },
    { href: "lyustry/", label: "Люстры" },
    { href: "lampy/", label: "Лампы" },
    { href: "bra/", label: "Бра" },
    { href: "mebel/", label: "Мебель" },
    { href: "sale/", label: "Распродажа" }
  ];
  function headerHtml() {
    var navItems = NAV.map(function (n) {
      return '<li><a href="' + link(n.href) + '" data-nav="' + n.href + '">' + n.label + "</a></li>";
    }).join("");
    var user = currentUser();
    var acc = '<a class="icon-btn" href="' + link("cabinet/") + '" aria-label="Личный кабинет">' + IC.user + "</a>";
    return (
      '<div class="promo">Летняя распродажа — <strong>скидки до 50%</strong> на освещение · Бесплатная доставка от 30 000 ₽</div>' +
      '<div class="site-header"><div class="container header-inner">' +
        '<button class="icon-btn nav-toggle" type="button" aria-label="Меню" aria-expanded="false" aria-controls="main-nav">' + IC.menu + "</button>" +
        '<a class="logo" href="' + link("") + '"><img class="logo-img" src="' + asset("logo.png") + '" alt="Мебель и свет"></a>' +
        '<nav class="main-nav" id="main-nav" aria-label="Основное меню"><ul>' + navItems + "</ul></nav>" +
        '<div class="header-actions">' +
          '<button class="icon-btn" type="button" data-search-open aria-label="Поиск">' + IC.search + "</button>" +
          (user ? '<span class="user-chip">' + user.email.split("@")[0] + "</span>" : "") +
          acc +
          '<a class="icon-btn" href="' + link("korzina/") + '" aria-label="Корзина">' + IC.cart + '<span class="count-badge" data-cart-count>0</span></a>' +
        "</div>" +
      "</div></div>" +
      '<div class="search-bar" data-search-bar hidden><div class="container search-inner">' + IC.search +
        '<input type="search" data-search-input placeholder="Поиск по каталогу: «люстра», «диван»…" aria-label="Поиск по каталогу">' +
        '<button class="icon-btn" type="button" data-search-close aria-label="Закрыть">' + IC.x + "</button>" +
      "</div></div>"
    );
  }
  function footerHtml() {
    return (
      '<div class="container"><div class="footer-grid">' +
        '<div class="footer-brand"><a class="logo" href="' + link("") + '">Мебель и свет</a>' +
          "<p>Люстры, лампы и мебель для дома. Розничная продажа с доставкой по России.</p>" +
          '<div class="socials"><a href="' + link("") + '" aria-label="Telegram">' + IC.tg + "</a>" +
            '<a href="' + link("") + '" aria-label="ВКонтакте">' + IC.vk + "</a>" +
            '<a href="mailto:shop@mebel-i-svet.ru" aria-label="Почта">' + IC.mail + "</a></div></div>" +
        '<div class="footer-col"><h3>Каталог</h3><ul>' +
          '<li><a href="' + link("lyustry/") + '">Люстры</a></li>' +
          '<li><a href="' + link("lampy/") + '">Лампы</a></li>' +
          '<li><a href="' + link("bra/") + '">Бра</a></li>' +
          '<li><a href="' + link("mebel/") + '">Мебель</a></li>' +
          '<li><a href="' + link("sale/") + '">Распродажа</a></li></ul></div>' +
        '<div class="footer-col"><h3>Покупателям</h3><ul>' +
          '<li><a href="' + link("dostavka/") + '">Доставка</a></li>' +
          '<li><a href="' + link("oplata/") + '">Оплата</a></li>' +
          '<li><a href="' + link("vozvrat/") + '">Возврат</a></li>' +
          '<li><a href="' + link("garantiya/") + '">Гарантия</a></li></ul></div>' +
        '<div class="footer-col"><h3>Контакты</h3><ul>' +
          "<li>г. Москва, ул. Светотехническая, 14</li>" +
          '<li><a href="tel:+74951204567">+7 (495) 120-45-67</a></li>' +
          '<li><a href="mailto:shop@mebel-i-svet.ru">shop@mebel-i-svet.ru</a></li>' +
          '<li><a href="' + link("kontakty/") + '">О компании</a></li>' +
          "<li>Ежедневно 10:00–21:00</li></ul></div>" +
      "</div></div>" +
      '<div class="footer-bottom">© 2026 «Мебель и свет» · Розничная продажа света и мебели</div>'
    );
  }

  /* ---------- cart ---------- */
  function getCart() { return get("mis_cart", {}); }
  function saveCart(c) { set("mis_cart", c); updateBadges(); }
  function addToCart(id, qty) {
    var p = window.MIS.data.byId(id); if (!p) return;
    qty = qty || 1;
    var c = getCart();
    if (c[id]) c[id].qty += qty;
    else c[id] = { id: id, name: p.name, type: p.type, price: p.price, fx: p.fx, qty: qty };
    saveCart(c);
    track("add_to_cart", { id: id, qty: qty });
  }
  function setQty(id, q) { var c = getCart(); if (!c[id]) return; c[id].qty = q; if (c[id].qty <= 0) delete c[id]; saveCart(c); }
  function removeItem(id) { var c = getCart(); delete c[id]; saveCart(c); }
  function clearCart() { saveCart({}); }
  function cartCount() { var c = getCart(), n = 0; for (var k in c) n += c[k].qty; return n; }
  function cartTotal() { var c = getCart(), t = 0; for (var k in c) t += c[k].price * c[k].qty; return t; }
  function updateBadges() { var n = cartCount(); qsa("[data-cart-count]").forEach(function (e) { e.textContent = String(n); }); }

  /* ---------- visitor tracker (client-side buffer; no backend on static) ---------- */
  function visitorId() {
    var v = get("mis_vid", null);
    if (!v) { v = "v" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); set("mis_vid", v); }
    return v;
  }
  function track(type, payload) {
    var ev = get("mis_events", []);
    ev.push({ t: new Date().toISOString(), type: type, page: location.pathname + location.search, ref: document.referrer || "", vid: visitorId(), data: payload || {} });
    if (ev.length > 500) ev = ev.slice(ev.length - 500);
    set("mis_events", ev);
  }

  /* ---------- account (emulation, localStorage) ---------- */
  function users() { return get("mis_users", {}); }
  function currentUser() {
    var email = get("mis_session", null); if (!email) return null;
    var u = users()[email]; return u ? { email: u.email } : null;
  }
  function genPass() {
    var a = "abcdefghijkmnpqrstuvwxyz23456789", s = "";
    for (var i = 0; i < 8; i++) s += a[Math.floor(Math.random() * a.length)];
    return s;
  }
  function validEmail(e) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e); }
  function register(email) {
    email = (email || "").trim().toLowerCase();
    if (!validEmail(email)) return { ok: false, msg: "Введите корректный e-mail." };
    var us = users();
    if (us[email]) return { ok: false, msg: "Такой e-mail уже зарегистрирован — войдите." };
    var pass = genPass();
    us[email] = { email: email, pass: pass };
    set("mis_users", us); set("mis_session", email);
    track("register", { email: email });
    return { ok: true, login: email, pass: pass };
  }
  function login(email, pass) {
    email = (email || "").trim().toLowerCase();
    var u = users()[email];
    if (!u || u.pass !== pass) return { ok: false, msg: "Неверный e-mail или пароль." };
    set("mis_session", email); track("login", { email: email });
    return { ok: true };
  }
  function logout() { set("mis_session", null); }
  function changePassword(np) {
    var email = get("mis_session", null); if (!email) return { ok: false, msg: "Сначала войдите." };
    if (!np || np.length < 4) return { ok: false, msg: "Пароль — минимум 4 символа." };
    var us = users(); if (!us[email]) return { ok: false, msg: "Профиль не найден." };
    us[email].pass = np; set("mis_users", us);
    return { ok: true, msg: "Пароль обновлён." };
  }

  /* ---------- orders ---------- */
  function placeOrder(order) {
    var list = get("mis_orders", []);
    var num = "MS-" + (100000 + Math.floor(Math.random() * 899999));
    var rec = { num: num, date: new Date().toISOString(), total: order.total, items: order.items, delivery: order.delivery, contact: order.contact };
    var email = get("mis_session", null); if (email) rec.email = email;
    list.unshift(rec); set("mis_orders", list);
    track("order", { num: num, total: order.total });
    clearCart();
    return rec;
  }
  function ordersForUser() {
    var email = get("mis_session", null); var list = get("mis_orders", []);
    if (!email) return [];
    return list.filter(function (o) { return o.email === email; });
  }

  /* ---------- mount header/footer/sprite + wiring ---------- */
  function mount() {
    if (!qs(".sprite")) {
      var holder = document.createElement("div");
      holder.innerHTML = SPRITE;
      document.body.insertBefore(holder.firstChild, document.body.firstChild);
    }
    var h = qs("[data-header]"); if (h) h.innerHTML = headerHtml();
    var f = qs("[data-footer]"); if (f) f.innerHTML = footerHtml();
    updateBadges();
    markActive();
    wireHeader();
  }
  function markActive() {
    var path = location.pathname;
    qsa("[data-nav]").forEach(function (a) {
      var seg = a.getAttribute("data-nav");
      var isHome = seg === "" && /\/(index\.html)?$/.test(path) && path.indexOf("/lyustry/") < 0;
      if ((seg && path.indexOf("/" + seg) >= 0) || isHome) a.classList.add("is-active");
    });
  }
  function wireHeader() {
    var toggle = qs(".nav-toggle"), nav = qs(".main-nav");
    if (toggle && nav) toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open"); toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    var bar = qs("[data-search-bar]"), input = qs("[data-search-input]");
    var open = qs("[data-search-open]"), close = qs("[data-search-close]");
    if (open && bar) open.addEventListener("click", function () { bar.hidden = false; if (input) input.focus(); });
    if (close && bar) close.addEventListener("click", function () { bar.hidden = true; });
    function go() { var q = (input && input.value || "").trim(); location.href = link("") + (q ? "?q=" + encodeURIComponent(q) : ""); }
    if (input) input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); go(); } });
  }

  /* ---------- expose ---------- */
  window.MIS = window.MIS || {};
  window.MIS.core = {
    ROOT: ROOT, link: link, asset: asset, qs: qs, qsa: qsa, fmt: fmt, money: money,
    fixtureSvg: fixtureSvg, IC: IC, COLORS: window.MIS_COLORS, CATS: window.MIS_CATS,
    CAT_SLUG: window.MIS_CAT_SLUG, CAT_NAME: window.MIS_CAT_NAME,
    addToCart: addToCart, setQty: setQty, removeItem: removeItem, clearCart: clearCart,
    getCart: getCart, cartCount: cartCount, cartTotal: cartTotal, updateBadges: updateBadges,
    track: track, currentUser: currentUser, register: register, login: login, logout: logout,
    changePassword: changePassword, placeOrder: placeOrder, ordersForUser: ordersForUser,
    get: get, set: set
  };

  document.addEventListener("DOMContentLoaded", function () {
    mount();
    track("pageview", {});
  });
})();
