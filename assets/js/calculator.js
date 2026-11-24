/* ============================================================
   靓掂品牌特卖 · 投入收益测算器
   agent（区域代理·三重收益+自营） / store（店中店·双收益线）
   计算口径与 copy/site-copy.md 测算表一致：
   - 代理表：20 家 × 5,000 = 100,000；20 × 120,000 × 15% = 360,000；
     20 × 500 × 600 × 10% = 600,000；日销 1,000 计 160,000（原文口径）；
     合计 1,220,000 元
   - 店中店表：首批毛利 2,600 元（原文口径）；500 × 600 × 20% = 60,000；
     日销 500 计 62,650（原文口径系数 125.3）；合计 125,250 元
   所有结果为测算示例，不构成收益承诺。
   ============================================================ */
(function () {
  "use strict";

  function fmt(n) {
    return Math.round(n).toLocaleString("zh-CN");
  }

  function clamp(v, min, max) {
    if (isNaN(v)) return null;
    return Math.min(max, Math.max(min, v));
  }

  /* ---------- 模型定义 ---------- */
  var AGENT_MODEL = {
    root: "agent-calc",
    resultId: "agent-calc-result",
    resetId: "agent-calc-reset",
    inputs: [
      { id: "ac-shops",   key: "shops",   def: 20,     min: 1,     max: 60 },
      { id: "ac-restock", key: "restock", def: 120000, min: 0,     max: 1000000 },
      { id: "ac-users",   key: "users",   def: 500,    min: 0,     max: 10000 },
      { id: "ac-spend",   key: "spend",   def: 600,    min: 0,     max: 10000 },
      { id: "ac-daily",   key: "daily",   def: 1000,   min: 0,     max: 50000 }
    ],
    rows: [
      { key: "first",  name: "加盟首次铺货款", formula: "店中店数量 × 5,000 元/家" },
      { key: "restock", name: "加盟店后续铺货提成", formula: "店中店数量 × 单店年铺货 × 约 15%" },
      { key: "online", name: "线上平台提成款", formula: "店中店数量 × 专属用户数 × 人均年消费 × 约 10%" },
      { key: "self",   name: "中心仓自营收入", formula: "日均销售额 × 160 元（方案原文口径）" }
    ],
    compute: function (v) {
      return {
        first: v.shops * 5000,
        restock: v.shops * v.restock * 0.15,
        online: v.shops * v.users * v.spend * 0.10,
        self: v.daily * 160
      };
    }
  };

  var STORE_MODEL = {
    root: "store-calc",
    resultId: "store-calc-result",
    resetId: "store-calc-reset",
    inputs: [
      { id: "sc-users", key: "users", def: 500, min: 0, max: 10000 },
      { id: "sc-spend", key: "spend", def: 600, min: 0, max: 10000 },
      { id: "sc-daily", key: "daily", def: 500, min: 0, max: 50000 }
    ],
    rows: [
      { key: "first",  name: "首批货品毛利", formula: "5,000 元标准配货（方案原文口径：2,600 元）" },
      { key: "online", name: "线上专属用户提成", formula: "专属用户数 × 人均年消费 × 约 20%" },
      { key: "restock", name: "持续补货销售", formula: "日均补货销售额 × 125.3 元（方案原文口径）" }
    ],
    compute: function (v) {
      return {
        first: 2600, /* 方案原文：5,000 元货品对应毛利 2,600 元（照抄原文） */
        online: v.users * v.spend * 0.20,
        restock: v.daily * 125.3 /* 方案原文：日销 500 元对应 62,650 元/年 */
      };
    }
  };

  /* ---------- 渲染 ---------- */
  function setup(model) {
    var rootEl = document.getElementById(model.root);
    if (!rootEl) return;

    var resultBox = document.getElementById(model.resultId);
    var resetBtn = document.getElementById(model.resetId);
    var inputs = {};
    var values = {};

    model.inputs.forEach(function (spec) {
      var el = document.getElementById(spec.id);
      if (!el) return;
      inputs[spec.key] = { el: el, spec: spec };
      values[spec.key] = spec.def;
      el.value = spec.def;
      el.addEventListener("input", function () {
        var box = document.getElementById(spec.id + "-error");
        var raw = parseFloat(el.value);
        var v = clamp(raw, spec.min, spec.max);
        if (v === null) {
          if (box) box.classList.add("show");
          el.setAttribute("aria-invalid", "true");
          values[spec.key] = 0;
        } else {
          if (box) box.classList.remove("show");
          el.removeAttribute("aria-invalid");
          values[spec.key] = v;
          if (raw !== v) el.value = v; /* 超范围时收敛 */
        }
        render();
      });
    });

    function render() {
      var amounts = model.compute(values);
      var total = 0;
      var html = "";

      model.rows.forEach(function (row) {
        var amt = amounts[row.key] || 0;
        total += amt;
        html +=
          '<div class="calc-row">' +
          '<div><span class="calc-row-name">' + row.name + "</span>" +
          '<span class="calc-row-formula">' + row.formula + "</span></div>" +
          '<span class="calc-row-amt">' + fmt(amt) + " 元</span></div>";
      });

      html +=
        '<div class="calc-row calc-row-total">' +
        '<div><span class="calc-row-name">预计年度总收益</span></div>' +
        '<span class="calc-row-amt">' + fmt(total) + " 元</span></div>";

      resultBox.innerHTML = html;
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        model.inputs.forEach(function (spec) {
          values[spec.key] = spec.def;
          var el = inputs[spec.key] && inputs[spec.key].el;
          if (el) {
            el.value = spec.def;
            el.removeAttribute("aria-invalid");
          }
          var box = document.getElementById(spec.id + "-error");
          if (box) box.classList.remove("show");
        });
        render();
      });
    }

    render();
  }

  setup(AGENT_MODEL);
  setup(STORE_MODEL);
})();
