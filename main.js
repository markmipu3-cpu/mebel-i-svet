/* «Мебель и свет» — каталог. Все обработчики через addEventListener. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initCatalog();
    initFavorites();
    initNewsletter();
    initMore();
  });

  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".main-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  function initCatalog() {
    var grid = document.querySelector("[data-grid]");
    if (!grid) return;
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".card"));
    var original = cards.slice();
    var countEl = document.querySelector("[data-count]");
    var stockOnly = false;

    function applyStock() {
      cards.forEach(function (c) {
        var hide = stockOnly && c.getAttribute("data-stock") !== "in";
        c.classList.toggle("is-hidden", hide);
      });
    }
    function updateCount() {
      if (!countEl) return;
      var visible = cards.filter(function (c) { return !c.classList.contains("is-hidden"); }).length;
      countEl.textContent = String(visible);
    }
    function sortBy(mode) {
      var arr = original.slice();
      if (mode === "cheap") arr.sort(function (a, b) { return num(a) - num(b); });
      else if (mode === "exp") arr.sort(function (a, b) { return num(b) - num(a); });
      else if (mode === "name") arr.sort(function (a, b) {
        return a.getAttribute("data-name").localeCompare(b.getAttribute("data-name"), "ru");
      });
      arr.forEach(function (c) { grid.appendChild(c); });
    }
    function num(c) { return parseInt(c.getAttribute("data-price"), 10) || 0; }

    var stockChip = document.querySelector('.chip[data-filter="stock"]');
    if (stockChip) {
      stockChip.addEventListener("click", function () {
        stockOnly = !stockOnly;
        stockChip.classList.toggle("is-on", stockOnly);
        applyStock();
        updateCount();
      });
    }
    // other chips: visual toggle only (demo)
    document.querySelectorAll(".chip:not([data-filter])").forEach(function (chip) {
      if (chip.textContent.trim() === "Фильтры") return;
      chip.addEventListener("click", function () { chip.classList.toggle("is-on"); });
    });

    var sortSel = document.querySelector("[data-sort]");
    if (sortSel) sortSel.addEventListener("change", function () { sortBy(sortSel.value); });

    updateCount();
  }

  function initFavorites() {
    var counter = document.querySelector("[data-fav-count]");
    var count = 0;
    document.querySelectorAll(".fav").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var on = btn.classList.toggle("is-on");
        count += on ? 1 : -1;
        if (count < 0) count = 0;
        if (counter) counter.textContent = String(count);
      });
    });
  }

  function initNewsletter() {
    var form = document.querySelector(".news-form");
    var note = document.querySelector(".news-note");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector("input");
      var value = input ? input.value.trim() : "";
      if (!note) return;
      if (value && value.indexOf("@") > 0) {
        note.textContent = "Готово — проверьте почту.";
        if (input) input.value = "";
      } else {
        note.textContent = "Введите корректный e-mail.";
      }
    });
  }

  function initMore() {
    var btn = document.querySelector(".btn-more");
    if (!btn) return;
    btn.addEventListener("click", function () {
      btn.textContent = "Показаны все товары категории";
      btn.disabled = true;
      btn.classList.add("is-done");
    });
  }
})();
