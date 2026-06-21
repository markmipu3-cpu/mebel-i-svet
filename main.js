/* «Мебель и свет» — поведение макета. Все обработчики через addEventListener. */
(function () {
  "use strict";

  // Включаем стартовое скрытое состояние reveal только при работающем JS
  document.documentElement.classList.add("js");

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("DOMContentLoaded", function () {
    initReveal();
    initNavToggle();
    initSubscribe();
    initCart();
  });

  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (prefersReduced || !("IntersectionObserver" in window)) {
      for (var i = 0; i < items.length; i++) items[i].classList.add("is-visible");
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16 });
    items.forEach(function (el) { io.observe(el); });
  }

  function initNavToggle() {
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

  function initSubscribe() {
    var form = document.querySelector(".subscribe-form");
    var note = document.querySelector(".subscribe-note");
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

  function initCart() {
    var counter = document.querySelector(".cart-count");
    var buttons = document.querySelectorAll(".prod-add");
    if (!counter) return;
    var count = 0;
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        count += 1;
        counter.textContent = String(count);
      });
    });
  }
})();
