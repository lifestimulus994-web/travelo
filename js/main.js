(function () {
  var nav = document.getElementById("nav");
  var burgerBtn = document.getElementById("burgerBtn");
  var mobileNav = document.getElementById("mobileNav");
  var mobileNavClose = document.getElementById("mobileNavClose");
  var scrim = document.getElementById("scrim");
  var yearEl = document.getElementById("year");

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  function openMenu() {
    mobileNav.classList.add("open");
    scrim.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeMenu() {
    mobileNav.classList.remove("open");
    scrim.classList.remove("open");
    document.body.style.overflow = "";
  }
  burgerBtn.addEventListener("click", openMenu);
  mobileNavClose.addEventListener("click", closeMenu);
  scrim.addEventListener("click", closeMenu);
  mobileNav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeMenu);
  });

  var lastScroll = window.scrollY;
  var ticking = false;

  function onScroll() {
    var current = window.scrollY;
    if (current > 60) {
      nav.classList.add("scrolled");
    } else {
      nav.classList.remove("scrolled");
    }
    if (current > lastScroll && current > 160) {
      nav.classList.add("nav-hidden");
    } else {
      nav.classList.remove("nav-hidden");
    }
    lastScroll = current;
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      requestAnimationFrame(onScroll);
      ticking = true;
    }
  });

  var revealEls = document.querySelectorAll(".reveal");
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );
  revealEls.forEach(function (el) {
    io.observe(el);
  });
})();
