/* «Мебель и свет» — рендер страниц. Диспетчеризация по <main data-page>.
   Использует ядро из app.js (window.MIS.core). Без инлайнов. */
(function () {
  "use strict";
  var C = window.MIS.core, D = window.MIS.data;
  var link = C.link, money = C.money, fx = C.fixtureSvg, qs = C.qs, qsa = C.qsa;
  function param(n) { return new URLSearchParams(location.search).get(n); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ---------- card ---------- */
  function card(p) {
    var badge = p.badge ? '<span class="badge badge--' + p.badge.cls + '">' + p.badge.t + "</span>" : "";
    var sw = p.colors.map(function (c) { return '<span class="swatch sw-' + c + '"></span>'; }).join("");
    var price = (p.old ? "<del>" + money(p.old) + "</del> " : "") + "<b>" + money(p.price) + "</b>";
    var href = link("tovar/?id=" + p.id);
    return (
      '<article class="card" data-id="' + p.id + '">' +
        '<a class="card-media" href="' + href + '" aria-label="' + esc(p.name) + '">' + badge + fx(p.fx) + "</a>" +
        '<div class="card-body">' +
          '<p class="card-type">' + p.type + "</p>" +
          '<h3 class="card-name"><a href="' + href + '">' + esc(p.name) + "</a></h3>" +
          '<div class="swatches">' + sw + "</div>" +
          '<p class="price">' + price + "</p>" +
          '<button class="add-cart" type="button" data-add="' + p.id + '">В корзину</button>' +
        "</div>" +
      "</article>"
    );
  }
  function wireGrid(root) {
    qsa("[data-add]", root).forEach(function (b) {
      b.addEventListener("click", function () {
        C.addToCart(b.getAttribute("data-add"), 1);
        var t = b.textContent; b.textContent = "Добавлено ✓"; b.classList.add("is-done");
        setTimeout(function () { b.textContent = t; b.classList.remove("is-done"); }, 1100);
      });
    });
  }

  /* ---------- catalog (home / category / sale) ---------- */
  function sortList(list, mode) {
    var a = list.slice();
    if (mode === "cheap") a.sort(function (x, y) { return x.price - y.price; });
    else if (mode === "exp") a.sort(function (x, y) { return y.price - x.price; });
    else if (mode === "name") a.sort(function (x, y) { return x.name.localeCompare(y.name, "ru"); });
    return a;
  }
  function catalog(scope, main) {
    var base, typeChips = "", colorChips = "", crumb, title, desc, q = "";
    if (scope === "home") {
      base = D.all(); q = (param("q") || "").toLowerCase();
      crumb = '<a href="' + link("") + '">Главная</a> / <span>Каталог</span>';
      title = "Каталог"; desc = "Люстры, лампы, бра и мебель — всё для света и уюта в доме.";
      typeChips = Object.keys(window.MIS_CATS).map(function (slug) {
        return '<button class="chip" type="button" data-type="' + window.MIS_CATS[slug].key + '">' + window.MIS_CATS[slug].title + "</button>";
      }).join("");
    } else if (scope === "sale") {
      base = D.sale();
      crumb = '<a href="' + link("") + '">Главная</a> / <span>Распродажа</span>';
      title = "Распродажа"; desc = "Товары со скидкой. Количество ограничено.";
    } else {
      var slug = main.getAttribute("data-category"); var meta = window.MIS_CATS[slug];
      base = D.byCat(meta.key);
      crumb = '<a href="' + link("") + '">Главная</a> / <span>' + meta.title + "</span>";
      title = meta.title; desc = meta.desc;
      var cols = {}; base.forEach(function (p) { p.colors.forEach(function (c) { cols[c] = 1; }); });
      colorChips = Object.keys(cols).map(function (c) {
        return '<button class="chip" type="button" data-color="' + c + '"><i class="dot sw-' + c + '"></i>' + window.MIS_COLORS[c].name + "</button>";
      }).join("");
    }

    var tilesHtml = "";
    if (scope === "home") {
      tilesHtml = '<section class="subcats" aria-label="Категории"><div class="subcat-row">' +
        Object.keys(window.MIS_CATS).map(function (slug) {
          var m = window.MIS_CATS[slug], rep = D.byCat(m.key)[0];
          return '<a class="subcat" href="' + link(slug + "/") + '">' + fx(rep ? rep.fx : "flush") + "<span>" + m.title + "</span></a>";
        }).join("") + "</div></section>";
    }

    var filtersHtml = (typeChips || colorChips)
      ? '<div class="filters" data-filters>' + typeChips + colorChips + '<button class="chip chip--reset" type="button" data-reset hidden>Сбросить</button></div>'
      : '<div class="filters"></div>';

    main.innerHTML =
      '<div class="container">' +
        '<nav class="crumbs" aria-label="Хлебные крошки">' + crumb + "</nav>" +
        '<div class="page-head"><h1>' + title + "</h1><p>" + desc + "</p></div>" +
        tilesHtml +
        '<div class="toolbar">' + filtersHtml +
          '<div class="toolbar-right"><span class="count"><b data-count>0</b> товаров</span>' +
          '<label class="sort"><span class="sr-only">Сортировка</span><select data-sort>' +
            '<option value="popular">Популярные</option><option value="cheap">Сначала дешевле</option>' +
            '<option value="exp">Сначала дороже</option><option value="name">По названию</option></select></label></div>' +
        "</div>" +
        '<section class="product-grid" data-grid aria-label="Товары"></section>' +
        '<p class="grid-empty" data-empty hidden>Ничего не найдено. Попробуйте изменить фильтры.</p>' +
      "</div>";

    var state = { type: null, color: null, sort: "popular", q: q };
    var grid = qs("[data-grid]", main), empty = qs("[data-empty]", main), count = qs("[data-count]", main);
    var reset = qs("[data-reset]", main);

    function render() {
      var list = base.slice();
      if (state.type) list = list.filter(function (p) { return p.cat === state.type; });
      if (state.color) list = list.filter(function (p) { return p.colors.indexOf(state.color) >= 0; });
      if (state.q) list = list.filter(function (p) { return (p.name + " " + p.type).toLowerCase().indexOf(state.q) >= 0; });
      list = sortList(list, state.sort);
      grid.innerHTML = list.map(card).join("");
      count.textContent = String(list.length);
      empty.hidden = list.length > 0;
      if (reset) reset.hidden = !(state.type || state.color || state.q);
      wireGrid(grid);
    }
    qsa("[data-type]", main).forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.getAttribute("data-type"); state.type = state.type === v ? null : v;
        qsa("[data-type]", main).forEach(function (o) { o.classList.toggle("is-on", o === b && state.type); });
        render();
      });
    });
    qsa("[data-color]", main).forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.getAttribute("data-color"); state.color = state.color === v ? null : v;
        qsa("[data-color]", main).forEach(function (o) { o.classList.toggle("is-on", o === b && state.color); });
        render();
      });
    });
    var sortSel = qs("[data-sort]", main);
    if (sortSel) sortSel.addEventListener("change", function () { state.sort = sortSel.value; render(); });
    if (reset) reset.addEventListener("click", function () {
      state.type = null; state.color = null; state.q = "";
      qsa(".chip.is-on", main).forEach(function (o) { o.classList.remove("is-on"); });
      render();
    });
    render();
  }

  /* ---------- product ---------- */
  function product(main) {
    var p = D.byId(param("id"));
    if (!p) {
      main.innerHTML = '<div class="container section center"><p class="muted">Товар не найден.</p><p class="mt1"><a class="btn btn-ghost" href="' + link("") + '">В каталог</a></p></div>';
      return;
    }
    document.title = p.name + " — " + window.MIS_CAT_NAME[p.cat] + " | Мебель и свет";
    var slug = window.MIS_CAT_SLUG[p.cat], meta = window.MIS_CATS[slug];
    var swatches = p.colors.map(function (c) { return '<span class="swatch-lg sw-' + c + '" title="' + window.MIS_COLORS[c].name + '"></span>'; }).join("");
    var price = (p.old ? "<del>" + money(p.old) + "</del> " : "") + "<b>" + money(p.price) + "</b>";
    var specs = p.specs.map(function (s) { return "<tr><td>" + s[0] + "</td><td>" + s[1] + "</td></tr>"; }).join("");
    main.innerHTML =
      '<div class="container">' +
        '<nav class="crumbs"><a href="' + link("") + '">Главная</a> / <a href="' + link(slug + "/") + '">' + meta.title + "</a> / <span>" + esc(p.name) + "</span></nav>" +
        '<div class="product">' +
          '<div class="product-media">' + fx(p.fx) + "</div>" +
          '<div class="product-info">' +
            '<p class="product-eyebrow">' + p.type + "</p><h1>" + esc(p.name) + "</h1>" +
            '<div class="product-price">' + price + "</div>" +
            '<p class="product-desc">' + esc(p.desc) + "</p>" +
            '<div class="swatch-row"><span class="label">Цвет:</span>' + swatches + "</div>" +
            '<div class="buy-row">' +
              '<div class="qty"><button type="button" data-q="-1" aria-label="Меньше">−</button><span data-qv>1</span><button type="button" data-q="1" aria-label="Больше">+</button></div>' +
              '<button class="btn btn-gold" type="button" data-buy>В корзину</button>' +
              '<a class="btn btn-ghost" href="' + link("korzina/") + '" data-tocart hidden>В корзину →</a>' +
            "</div>" +
            '<div class="specs"><h3>Характеристики</h3><table><tbody>' + specs + "</tbody></table></div>" +
          "</div>" +
        "</div>" +
      "</div>";
    C.track("product_view", { id: p.id });
    var q = 1, qv = qs("[data-qv]", main);
    qsa("[data-q]", main).forEach(function (b) {
      b.addEventListener("click", function () { q = Math.max(1, q + parseInt(b.getAttribute("data-q"), 10)); qv.textContent = String(q); });
    });
    var buy = qs("[data-buy]", main), toCart = qs("[data-tocart]", main);
    buy.addEventListener("click", function () {
      C.addToCart(p.id, q); buy.textContent = "Добавлено ✓"; toCart.hidden = false;
      setTimeout(function () { buy.textContent = "В корзину"; }, 1100);
    });
  }

  /* ---------- cart ---------- */
  function cartRow(it) {
    return (
      '<div class="cart-row" data-row="' + it.id + '">' +
        '<div class="cart-thumb">' + fx(it.fx) + "</div>" +
        "<div><p class=\"type\">" + it.type + '</p><p class="name">' + esc(it.name) + '</p><p class="line-price">' + money(it.price) + " / шт.</p></div>" +
        '<div class="right"><div class="qty"><button type="button" data-dec aria-label="Меньше">−</button><span>' + it.qty + '</span><button type="button" data-inc aria-label="Больше">+</button></div>' +
        '<button class="cart-remove" type="button" data-rm>Удалить</button></div>' +
      "</div>"
    );
  }
  function cart(main) {
    var c = C.getCart(), ids = Object.keys(c);
    var head = '<div class="container"><nav class="crumbs"><a href="' + link("") + '">Главная</a> / <span>Корзина</span></nav><div class="page-head"><h1>Корзина</h1></div>';
    if (!ids.length) {
      main.innerHTML = head + '<div class="cart-empty">Корзина пуста.<br><a class="btn btn-ghost mt1" href="' + link("") + '">Перейти в каталог</a></div></div>';
      return;
    }
    var rows = ids.map(function (id) { return cartRow(c[id]); }).join("");
    var total = C.cartTotal();
    main.innerHTML = head +
      '<div class="cart-grid"><div class="cart-list">' + rows + "</div>" +
      '<aside class="summary"><h2>Итого</h2>' +
        '<div class="summary-row"><span>Товары (' + C.cartCount() + ")</span><span>" + money(total) + "</span></div>" +
        '<div class="summary-row total"><span>К оплате</span><b>' + money(total) + "</b></div>" +
        '<a class="btn btn-gold btn-block mt1" href="' + link("oformlenie/") + '">Оформить заказ</a>' +
        '<p class="pay-note">Доставка добавится на шаге оформления.</p>' +
      "</aside></div></div>";
    ids.forEach(function (id) {
      var row = qs('[data-row="' + id + '"]', main);
      qs("[data-inc]", row).addEventListener("click", function () { C.setQty(id, c[id].qty + 1); cart(main); });
      qs("[data-dec]", row).addEventListener("click", function () { C.setQty(id, c[id].qty - 1); cart(main); });
      qs("[data-rm]", row).addEventListener("click", function () { C.removeItem(id); cart(main); });
    });
  }

  /* ---------- checkout ---------- */
  var DELIVERY = [
    { id: "auto", name: "Авто (ПВЗ)", sub: "Самовывоз из пункта выдачи, 2–4 дня", price: 1500 },
    { id: "courier", name: "Курьер", sub: "До двери, 1–2 дня по Москве", price: 700 },
    { id: "rail", name: "Ж/д доставка", sub: "В регионы, 4–7 дней", price: 1200 }
  ];
  function checkout(main) {
    var c = C.getCart(), ids = Object.keys(c);
    if (!ids.length) {
      main.innerHTML = '<div class="container"><div class="page-head"><h1>Оформление</h1></div><div class="cart-empty">Корзина пуста — оформлять нечего.<br><a class="btn btn-ghost mt1" href="' + link("") + '">В каталог</a></div></div>';
      return;
    }
    var st = { step: 1, contact: {}, delivery: null };
    var user = C.currentUser();
    if (user) st.contact.email = user.email;

    function goods() { return C.cartTotal(); }
    function delPrice() { return st.delivery ? (DELIVERY.filter(function (d) { return d.id === st.delivery; })[0].price) : 0; }
    function total() { return goods() + delPrice(); }

    function summary() {
      var lines = ids.map(function (id) { var it = c[id]; return '<div class="summary-row"><span>' + esc(it.name) + " × " + it.qty + "</span><span>" + money(it.price * it.qty) + "</span></div>"; }).join("");
      var del = st.delivery ? '<div class="summary-row"><span>Доставка</span><span>' + money(delPrice()) + "</span></div>" : '<div class="summary-row"><span>Доставка</span><span class="muted">не выбрана</span></div>';
      return '<aside class="summary"><h2>Заказ</h2>' + lines + del +
        '<div class="summary-row total"><span>К оплате</span><b>' + money(total()) + "</b></div></aside>";
    }
    function steps() {
      function tab(n, label) {
        var cls = "step-tab" + (st.step === n ? " active" : "") + (st.step > n ? " done" : "");
        return '<div class="' + cls + '"><span class="num">' + (st.step > n ? "✓" : n) + "</span>" + label + "</div>";
      }
      return '<div class="steps">' + tab(1, "Контакты") + tab(2, "Доставка") + tab(3, "Оплата") + "</div>";
    }

    function panelContacts() {
      return '<div class="panel"><h2>Контактные данные</h2><div class="form-grid">' +
        field("name", "Имя и фамилия", "text", st.contact.name) +
        field("email", "E-mail", "email", st.contact.email) +
        field("phone", "Телефон", "tel", st.contact.phone) +
        field("addr", "Адрес доставки", "text", st.contact.addr) +
        '</div><div class="buy-row mt2"><button class="btn btn-navy" type="button" data-next>Далее — доставка</button></div></div>';
    }
    function panelDelivery() {
      var opts = DELIVERY.map(function (d) {
        return '<label class="delivery-opt"><input type="radio" name="delivery" value="' + d.id + '"' + (st.delivery === d.id ? " checked" : "") + '>' +
          '<span class="d-name">' + d.name + '</span><span class="d-sub">' + d.sub + '</span><span class="d-price">' + money(d.price) + "</span></label>";
      }).join("");
      return '<div class="panel"><h2>Способ доставки</h2>' + opts +
        '<div class="buy-row mt2"><button class="btn btn-ghost" type="button" data-back>Назад</button><button class="btn btn-navy" type="button" data-next>Далее — оплата</button></div></div>';
    }
    function panelPayment() {
      return '<div class="panel"><h2>Оплата картой</h2>' +
        '<div class="card-icons"><span>VISA</span><span>MASTERCARD</span><span>МИР</span></div>' +
        '<div class="form-grid">' +
          field("ccnum", "Номер карты", "text", "", "0000 0000 0000 0000") +
          '<div class="form-grid cols2">' + field("ccexp", "Срок (ММ/ГГ)", "text", "", "12/29") + field("cccvc", "CVC", "text", "", "123") + "</div>" +
          field("ccname", "Имя на карте", "text", "") +
        "</div>" +
        '<p class="pay-note">Оплата — демонстрационная: реальное списание не производится.</p>' +
        '<div class="buy-row mt2"><button class="btn btn-ghost" type="button" data-back>Назад</button><button class="btn btn-gold" type="button" data-pay>Оплатить ' + money(total()) + "</button></div></div>";
    }
    function field(name, label, type, val, ph) {
      return '<div class="field" data-field="' + name + '"><label for="f-' + name + '">' + label + "</label>" +
        '<input id="f-' + name + '" type="' + type + '" name="' + name + '" value="' + (val ? esc(val) : "") + '"' + (ph ? ' placeholder="' + ph + '"' : "") + '><span class="err"></span></div>';
    }

    function render() {
      var body = st.step === 1 ? panelContacts() : st.step === 2 ? panelDelivery() : st.step === 3 ? panelPayment() : "";
      main.innerHTML = '<div class="container"><nav class="crumbs"><a href="' + link("korzina/") + '">Корзина</a> / <span>Оформление</span></nav>' +
        '<div class="page-head"><h1>Оформление заказа</h1></div>' + steps() +
        '<div class="checkout-grid"><div>' + body + "</div>" + summary() + "</div></div>";
      wire();
    }
    function invalid(name, msg) {
      var f = qs('[data-field="' + name + '"]', main); if (!f) return;
      f.classList.add("invalid"); qs(".err", f).textContent = msg;
    }
    function readContacts() {
      var ok = true; ["name", "email", "phone", "addr"].forEach(function (n) {
        var el = qs('[name="' + n + '"]', main); var v = (el.value || "").trim(); st.contact[n] = v;
        var f = qs('[data-field="' + n + '"]', main); f.classList.remove("invalid"); qs(".err", f).textContent = "";
        if (!v) { invalid(n, "Заполните поле"); ok = false; }
        else if (n === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { invalid(n, "Неверный e-mail"); ok = false; }
      });
      return ok;
    }
    function wire() {
      var next = qs("[data-next]", main), back = qs("[data-back]", main);
      if (next) next.addEventListener("click", function () {
        if (st.step === 1) { if (!readContacts()) return; st.step = 2; }
        else if (st.step === 2) {
          var sel = qs('[name="delivery"]:checked', main);
          if (!sel) { alert("Выберите способ доставки"); return; }
          st.delivery = sel.value; st.step = 3;
        }
        render();
      });
      if (back) back.addEventListener("click", function () { st.step -= 1; render(); });
      qsa('[name="delivery"]', main).forEach(function (r) { r.addEventListener("change", function () { st.delivery = r.value; }); });
      var pay = qs("[data-pay]", main);
      if (pay) pay.addEventListener("click", function () {
        var num = (qs('[name="ccnum"]', main).value || "").replace(/\s/g, "");
        if (num.length < 12) { invalid("ccnum", "Введите номер карты"); return; }
        var items = ids.map(function (id) { return { name: c[id].name, qty: c[id].qty, price: c[id].price }; });
        var rec = C.placeOrder({ total: total(), items: items, delivery: DELIVERY.filter(function (d) { return d.id === st.delivery; })[0], contact: st.contact });
        done(rec);
      });
    }
    function done(rec) {
      main.innerHTML = '<div class="container"><div class="order-done">' +
        '<div class="ok">' + C.IC.check + "</div>" +
        "<h1>Заказ оформлен</h1>" +
        '<p class="order-num">№ ' + rec.num + "</p>" +
        '<p class="muted">Это демонстрация — реальная оплата не производится.<br>Мы «отправили» подтверждение на ' + esc(rec.contact.email) + ".</p>" +
        '<div class="buy-row mt2 row-center"><a class="btn btn-gold" href="' + link("") + '">В каталог</a>' +
        (C.currentUser() ? '<a class="btn btn-ghost" href="' + link("cabinet/") + '">Мои заказы</a>' : "") + "</div>" +
      "</div></div>";
    }
    render();
  }

  /* ---------- account (emulation) ---------- */
  function account(main) {
    var user = C.currentUser();
    if (user) return accountView(main, user);
    main.innerHTML =
      '<div class="container"><nav class="crumbs"><a href="' + link("") + '">Главная</a> / <span>Личный кабинет</span></nav>' +
        '<div class="page-head"><h1>Личный кабинет</h1></div>' +
        '<div class="auth-wrap"><div class="auth-card">' +
          '<div class="tabs"><button class="tab is-on" type="button" data-tab="login">Вход</button><button class="tab" type="button" data-tab="register">Регистрация</button></div>' +
          '<div class="tab-pane is-on" data-pane="login"><div class="form-grid">' +
            '<div class="field"><label for="li-email">E-mail</label><input id="li-email" type="email" autocomplete="email"></div>' +
            '<div class="field"><label for="li-pass">Пароль</label><input id="li-pass" type="password" autocomplete="current-password"></div>' +
            '<button class="btn btn-navy btn-block" type="button" data-login>Войти</button>' +
          '</div><p class="note" data-note-login></p></div>' +
          '<div class="tab-pane" data-pane="register"><div class="form-grid">' +
            '<div class="field"><label for="rg-email">E-mail</label><input id="rg-email" type="email" autocomplete="email"></div>' +
            '<button class="btn btn-gold btn-block" type="button" data-register>Зарегистрироваться</button>' +
          '</div><p class="note muted mt1">Логин и пароль «придут на почту» — в демо мы покажем их здесь. Потом пароль можно сменить в кабинете.</p><div data-cred></div><p class="note" data-note-reg></p></div>' +
        "</div></div></div>";

    qsa("[data-tab]", main).forEach(function (t) {
      t.addEventListener("click", function () {
        qsa("[data-tab]", main).forEach(function (o) { o.classList.toggle("is-on", o === t); });
        qsa("[data-pane]", main).forEach(function (p) { p.classList.toggle("is-on", p.getAttribute("data-pane") === t.getAttribute("data-tab")); });
      });
    });
    qs("[data-login]", main).addEventListener("click", function () {
      var r = C.login(qs("#li-email", main).value, qs("#li-pass", main).value);
      var note = qs("[data-note-login]", main);
      if (r.ok) { location.href = link("cabinet/"); }
      else { note.textContent = r.msg; note.className = "note bad"; }
    });
    qs("[data-register]", main).addEventListener("click", function () {
      var r = C.register(qs("#rg-email", main).value);
      var note = qs("[data-note-reg]", main), cred = qs("[data-cred]", main);
      if (r.ok) {
        cred.innerHTML = '<div class="cred-box">Письмо отправлено (демо).<br>Логин: <b>' + esc(r.login) + "</b><br>Пароль: <b>" + r.pass + "</b></div>";
        note.textContent = "Готово — вы вошли. Обновляем кабинет…"; note.className = "note ok";
        setTimeout(function () { location.href = link("cabinet/"); }, 1400);
      } else { note.textContent = r.msg; note.className = "note bad"; }
    });
  }
  function accountView(main, user) {
    var orders = C.ordersForUser();
    var ordersHtml = orders.length
      ? orders.map(function (o) {
          var d = new Date(o.date).toLocaleDateString("ru-RU");
          return '<div class="order-item"><div class="top"><span>№ ' + o.num + " · " + d + '</span><span class="sum">' + money(o.total) + "</span></div></div>";
        }).join("")
      : '<p class="muted">Заказов пока нет.</p>';
    main.innerHTML =
      '<div class="container"><nav class="crumbs"><a href="' + link("") + '">Главная</a> / <span>Личный кабинет</span></nav>' +
        '<div class="account-head"><div class="page-head m0"><h1>Личный кабинет</h1><p>' + esc(user.email) + "</p></div>" +
          '<button class="btn btn-ghost" type="button" data-logout>Выйти</button></div>' +
        '<div class="checkout-grid"><div class="panel"><h2>Сменить пароль</h2><div class="form-grid">' +
          '<div class="field"><label for="np">Новый пароль</label><input id="np" type="password" autocomplete="new-password"></div>' +
          '<button class="btn btn-navy" type="button" data-chpass>Сохранить</button></div><p class="note" data-note-pass></p></div>' +
          '<div class="panel"><h2>Мои заказы</h2>' + ordersHtml + "</div>" +
        "</div></div>";
    qs("[data-logout]", main).addEventListener("click", function () { C.logout(); location.href = link("cabinet/"); });
    qs("[data-chpass]", main).addEventListener("click", function () {
      var r = C.changePassword(qs("#np", main).value); var note = qs("[data-note-pass]", main);
      note.textContent = r.msg; note.className = "note " + (r.ok ? "ok" : "bad");
      if (r.ok) qs("#np", main).value = "";
    });
  }

  /* ---------- dispatch ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    var main = qs("main[data-page]"); if (!main) return;
    var page = main.getAttribute("data-page");
    if (page === "home") catalog("home", main);
    else if (page === "category") catalog("category", main);
    else if (page === "sale") catalog("sale", main);
    else if (page === "product") product(main);
    else if (page === "cart") cart(main);
    else if (page === "checkout") checkout(main);
    else if (page === "account") account(main);
  });
})();
