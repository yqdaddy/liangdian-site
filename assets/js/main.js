/* ============================================================
   靓掂品牌特卖 · 全站脚本
   功能：导航开关 / 滚动显现 / 留资表单校验与引导面板
   说明：纯静态站，表单不做任何网络发送
   ============================================================ */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  /* ---------- 移动端导航 ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });

    document.addEventListener("click", function (e) {
      if (
        nav.classList.contains("open") &&
        !nav.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- 滚动显现 ---------- */
  var reveals = document.querySelectorAll(".reveal");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reveals.length && "IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in-view"); });
  }

  /* ---------- 留资表单（静态演示：不发送任何数据） ---------- */
  var form = document.getElementById("consult-form");
  var guide = document.getElementById("form-guide");
  var backBtn = document.getElementById("guide-back");
  var consent = document.getElementById("cf-consent");
  var submitBtn = form ? form.querySelector('button[type="submit"]') : null;

  if (!form || !guide) return;

  var PHONE_RE = /^(1[3-9]\d{9}|0\d{2,3}-?\d{7,8})$/;

  function setError(id, msg) {
    var input = document.getElementById(id);
    var box = document.getElementById(id + "-error");
    if (!input || !box) return;
    if (msg) {
      input.setAttribute("aria-invalid", "true");
      if (box.querySelector(".error-text")) {
        box.querySelector(".error-text").textContent = msg;
      }
      box.classList.add("show");
    } else {
      input.removeAttribute("aria-invalid");
      box.classList.remove("show");
    }
  }

  function validate() {
    var ok = true;
    var name = document.getElementById("cf-name");
    var phone = document.getElementById("cf-phone");
    var region = document.getElementById("cf-region");
    var type = document.getElementById("cf-type");

    if (!name.value.trim()) {
      setError("cf-name", "请填写姓名");
      ok = false;
    } else {
      setError("cf-name", null);
    }

    var phoneVal = phone.value.trim();
    if (!phoneVal) {
      setError("cf-phone", "请填写电话");
      ok = false;
    } else if (!PHONE_RE.test(phoneVal.replace(/\s/g, ""))) {
      setError("cf-phone", "请填写正确的手机号或座机号（区号-号码）");
      ok = false;
    } else {
      setError("cf-phone", null);
    }

    if (!region.value.trim()) {
      setError("cf-region", "请填写意向区域，如：XX 省 XX 县（区）");
      ok = false;
    } else {
      setError("cf-region", null);
    }

    if (!type.value) {
      setError("cf-type", "请选择店铺类型");
      ok = false;
    } else {
      setError("cf-type", null);
    }

    return ok;
  }

  /* 同意框默认未勾选：未勾选时提交按钮保持不可用 */
  if (consent && submitBtn) {
    submitBtn.disabled = !consent.checked;
    consent.addEventListener("change", function () {
      submitBtn.disabled = !consent.checked;
    });
  }

  /* 输入时即时清除错误提示 */
  ["cf-name", "cf-phone", "cf-region", "cf-type"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", function () { setError(id, null); });
      el.addEventListener("change", function () { setError(id, null); });
    }
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!consent.checked) return; /* 双保险：未同意不提交 */
    if (!validate()) {
      var firstErr = form.querySelector('[aria-invalid="true"]');
      if (firstErr) firstErr.focus();
      return;
    }

    /* 演示用短暂 loading 态，随后展示引导面板；数据不离开本页 */
    if (submitBtn) {
      submitBtn.classList.add("is-loading");
      submitBtn.disabled = true;
    }

    window.setTimeout(function () {
      form.hidden = true;
      guide.hidden = false;
      guide.focus();
    }, 400);
  });

  if (backBtn) {
    backBtn.addEventListener("click", function () {
      guide.hidden = true;
      form.hidden = false;
      if (submitBtn) {
        submitBtn.classList.remove("is-loading");
        submitBtn.disabled = !(consent && consent.checked);
      }
      var name = document.getElementById("cf-name");
      if (name) name.focus();
    });
  }
})();
