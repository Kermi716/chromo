const API = "https://api.chromo-ltd.xyz";
const CHARS = " .,:;+*?%S#@";
const CHECK_CD_KEY = "chromo_check_cd";

const FONT = {
  C: [" 111 ", "1   1", "1    ", "1    ", "1    ", "1   1", " 111 "],
  H: ["1   1", "1   1", "1   1", "11111", "1   1", "1   1", "1   1"],
  R: ["1111 ", "1   1", "1   1", "1111 ", "1  1 ", "1   1", "1   1"],
  O: [" 111 ", "1   1", "1   1", "1   1", "1   1", "1   1", " 111 "],
  M: ["1   1", "11 11", "1 1 1", "1   1", "1   1", "1   1", "1   1"],
};

const state = {
  cfg: null,
  plan: null,
  method: null,
  cfPay: "",
  cfTrial: "",
  cfKey: "",
  payWidget: null,
  trialWidget: null,
  keyWidget: null,
  poll: null,
  order: null,
  checkTimer: null,
};

const bgCanvas = document.getElementById("bg");
const plansEl = document.getElementById("plans");
const methodsEl = document.getElementById("methods");
const methodNote = document.getElementById("method-note");
const payBtn = document.getElementById("pay-btn");
const offerCheck = document.getElementById("offer-check");
const buyForm = document.getElementById("buy-form");
const orderBox = document.getElementById("order-box");

const trialBtn = document.getElementById("trial-btn");
const trialForm = document.getElementById("trial-form");
const trialBox = document.getElementById("trial-box");

const keyInput = document.getElementById("key-input");
const checkBtn = document.getElementById("check-btn");
const checkBtnDefaultText = checkBtn.textContent;
const keyForm = document.getElementById("key-form");
const keyBox = document.getElementById("key-box");
const toastsEl = document.getElementById("toasts");

const METHOD_ICONS = [
  { test: /funpay|фанпей/i, src: "assets/fp.jpg" },
  { test: /ukr|укр/i, src: "assets/ukr.png" },
  { test: /crystal|кристал/i, src: "assets/crstlp.jpg" },
  { test: /crypto|крипт/i, src: "assets/crptbt.jpg" },
  { test: /free|фрикас|фри\s?кас|\bfk\b/i, src: "assets/frk.jpg" },
];

const SEEN_ORDERS_KEY = "chromo_seen_orders";

const INSTALL_STEPS = [
  "Поместите скачанный файл chromo.lua в папку moonloader.",
  "Запустите игру и откройте меню.",
  "Вставьте ключ в поле активации.",
];

function notify(text, kind = "info") {
  if (!text) return;
  const el = document.createElement("div");
  el.className = "toast " + kind;
  el.textContent = text;
  toastsEl.appendChild(el);

  requestAnimationFrame(() => el.classList.add("show"));

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    clearTimeout(timer);
    el.classList.add("hide");
    setTimeout(() => el.remove(), 200);
  };

  const timer = setTimeout(close, kind === "err" ? 4000 : 2800);
  el.addEventListener("click", close);
}

function fireConfetti() {
  if (typeof confetti !== "function") return;
  const end = Date.now() + 700;
  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.75 },
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.75 },
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

function h(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function formatNow() {
  return new Date().toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isFirstPaidView(orderId) {
  try {
    const seen = JSON.parse(localStorage.getItem(SEEN_ORDERS_KEY) || "[]");
    if (seen.includes(orderId)) return false;
    localStorage.setItem(SEEN_ORDERS_KEY, JSON.stringify([...seen, orderId].slice(-50)));
  } catch (_) {}
  return true;
}

function formatAmount(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "";
  return n.toLocaleString("ru-RU") + " ₽";
}

function formatPaidAt(value) {
  const m = /^(\d{2}\.\d{2}\.\d{4}) (\d{2}:\d{2})/.exec(value || "");
  return m ? m[1] + " " + m[2] + " МСК" : formatNow();
}

function receiptUrl(orderId) {
  return location.origin + location.pathname + "?receipt=" + orderId;
}

function buildKey(key) {
  const wrap = h("div", "key-wrap");
  wrap.append(h("div", "field-label", "Ключ подписки"));

  const btn = h("button", "key");
  btn.type = "button";
  btn.title = "Копировать ключ";
  btn.append(h("span", "key-value", key));

  const icon = h("i", "fa-regular fa-copy");
  const copy = h("span", "key-copy");
  copy.append(icon);
  btn.append(copy);

  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(key);
    } catch (_) {
      notify("Не удалось скопировать", "err");
      return;
    }
    btn.classList.add("done");
    icon.className = "fa-solid fa-check";
    notify("Ключ скопирован", "ok");
    setTimeout(() => {
      btn.classList.remove("done");
      icon.className = "fa-regular fa-copy";
    }, 1500);
  });

  wrap.append(btn);
  return wrap;
}

function buildReceiptButton(link) {
  const btn = h("button", "btn-blue");
  btn.type = "button";
  btn.append(h("i", "fa-solid fa-link"), document.createTextNode("Скопировать ссылку на чек"));

  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(link);
      notify("Ссылка на чек скопирована", "ok");
    } catch (_) {
      notify("Не удалось скопировать", "err");
    }
  });
  return btn;
}

function buildInstruction() {
  const toggle = h("button", "btn-sec");
  toggle.type = "button";
  toggle.setAttribute("aria-expanded", "false");
  toggle.append(h("i", "fa-solid fa-circle-info"), document.createTextNode("Инструкция"));

  const steps = h("ol", "steps");
  steps.hidden = true;
  INSTALL_STEPS.forEach((s) => steps.append(h("li", "", s)));

  toggle.addEventListener("click", () => {
    steps.hidden = !steps.hidden;
    toggle.setAttribute("aria-expanded", String(!steps.hidden));
  });
  return [toggle, steps];
}

function buildResult(v) {
  const root = h("div", "result");

  const head = h("div", "result-head");
  const badge = h("div", "badge " + (v.tone || ""));
  badge.append(h("i", v.icon));
  head.append(badge, h("h2", "result-title", v.title));
  if (v.sub) head.append(h("p", "result-sub", v.sub));
  root.append(head);

  if (v.rows && v.rows.length) {
    const list = h("dl", "rows");
    v.rows.forEach(([label, value, mono]) => {
      const row = h("div", "row");
      row.append(h("dt", "", label), h("dd", mono ? "mono" : "", value));
      list.append(row);
    });
    root.append(list);
  }

  if (v.key) root.append(buildKey(v.key));

  const actions = h("div", "result-actions");

  if (v.downloadUrl) {
    const dl = h("a", "btn");
    dl.href = v.downloadUrl;
    dl.append(h("i", "fa-solid fa-download"), document.createTextNode("Скачать"));
    actions.append(dl);
  }

  if (v.receiptLink) actions.append(buildReceiptButton(v.receiptLink));

  if (v.install) actions.append(...buildInstruction());

  if (v.reopenUrl) {
    const open = h("a", "btn-sec");
    open.href = v.reopenUrl;
    open.target = "_blank";
    open.rel = "noopener";
    open.append(h("i", "fa-solid fa-arrow-up-right-from-square"), document.createTextNode("Открыть страницу оплаты"));
    actions.append(open);
  }

  if (actions.children.length) root.append(actions);

  const back = h("button", "back");
  back.type = "button";
  back.append(h("i", "fa-solid fa-arrow-left"), document.createTextNode(v.backLabel || "Назад"));
  back.addEventListener("click", () => hideView(v.box, v.form));
  root.append(back);

  return root;
}

function showView(box, form, view) {
  box.replaceChildren(buildResult({ ...view, box, form }));
  box.hidden = false;
  form.hidden = true;
}

function hideView(box, form) {
  if (location.search) history.replaceState(null, "", location.pathname + location.hash);
  box.hidden = true;
  box.replaceChildren();
  form.hidden = false;
}

function methodIcon(m) {
  const haystack = m.id + " " + m.label;
  const found = METHOD_ICONS.find((x) => x.test.test(haystack));
  const fallback = () => h("i", "fa-solid fa-credit-card method-icon");
  if (!found) return fallback();

  const img = h("img", "method-icon");
  img.src = found.src;
  img.alt = "";
  img.addEventListener("error", () => img.replaceWith(fallback()));
  return img;
}

function buildMask(word, cols, rows) {
  const mask = new Uint8Array(cols * rows);
  const rawW = word.length * 6 - 1;
  const rawH = 7;
  const sx = Math.max(1, Math.min(3, Math.floor((cols * 0.6) / rawW)));
  const sy = Math.max(1, Math.min(2, Math.floor((rows * 0.24) / rawH)));
  const totalW = rawW * sx;
  const ox = Math.floor((cols - totalW) / 2);
  const oy = Math.max(4, Math.floor(rows * 0.09));

  for (let i = 0; i < word.length; i++) {
    const mat = FONT[word[i]];
    if (!mat) continue;
    for (let r = 0; r < rawH; r++) {
      for (let c = 0; c < 5; c++) {
        if (mat[r][c] !== "1") continue;
        for (let dy = 0; dy < sy; dy++) {
          for (let dx = 0; dx < sx; dx++) {
            const x = ox + (i * 6 + c) * sx + dx;
            const y = oy + r * sy + dy;
            if (x >= 0 && x < cols && y >= 0 && y < rows) {
              mask[y * cols + x] = 1;
            }
          }
        }
      }
    }
  }
  return mask;
}

function startBg() {
  const ctx = bgCanvas.getContext("2d");
  const cellW = 10;
  const cellH = 16;
  let cols = 0;
  let rows = 0;
  let mask = new Uint8Array(0);
  let mx = 0.5;
  let my = 0.5;
  let t = 0;
  let cycle = 0;
  let last = performance.now();

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    bgCanvas.width = Math.floor(w * dpr);
    bgCanvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = "13px 'JetBrains Mono', Consolas, monospace";
    ctx.textBaseline = "top";
    cols = Math.ceil(w / cellW);
    rows = Math.ceil(h / cellH);
    mask = buildMask("CHROMO", cols, rows);
  };

  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", (e) => {
    mx = e.clientX / Math.max(1, window.innerWidth);
    my = e.clientY / Math.max(1, window.innerHeight);
  });

  resize();

  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = now - last;
    if (dt < 36) return;
    last = now;

    t += 0.03;
    cycle = (cycle + dt / 1000) % 14;

    let form = 0;
    if (cycle > 5 && cycle <= 7.5) {
      form = (cycle - 5) / 2.5;
    } else if (cycle > 7.5 && cycle <= 11.5) {
      form = 1;
    } else if (cycle > 11.5) {
      form = 1 - (cycle - 11.5) / 2.5;
    }

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const cx = mx * cols;
    const cy = my * rows;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const dx = (x - cx) * 0.1;
        const dy = (y - cy) * 0.18;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const wave = Math.sin(x * 0.09 + t) + Math.cos(y * 0.13 - t * 0.7) + Math.cos(dist - t * 1.2);
        const inWord = mask[y * cols + x] === 1;

        if (inWord && form > 0.02) {
          const threshold = (Math.sin(x * 0.7 + y * 0.9 + t * 2) + 1) * 0.5;
          if (form > threshold * 0.85) {
            const idx = Math.floor(8 + ((wave + 3) / 6) * (CHARS.length - 9));
            const alpha = 0.25 + form * 0.45;
            ctx.fillStyle = "rgba(212, 212, 224, " + alpha.toFixed(2) + ")";
            ctx.fillText(CHARS[Math.max(0, Math.min(CHARS.length - 1, idx))], x * cellW, y * cellH);
            continue;
          }
        }

        const idx = Math.floor(((wave + 3) / 6) * (CHARS.length - 1));
        const ch = CHARS[Math.max(0, Math.min(CHARS.length - 1, idx))];
        if (ch !== " ") {
          ctx.fillStyle = "#202028";
          ctx.fillText(ch, x * cellW, y * cellH);
        }
      }
    }
  };

  requestAnimationFrame(frame);
}

function switchTab(name) {
  document.querySelectorAll(".tab").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === name);
  });
  document.querySelectorAll(".pane").forEach((p) => {
    p.classList.toggle("active", p.id === "pane-" + name);
  });
}

document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

function loadTurnstile(siteKey) {
  if (!siteKey) return;
  const s = document.createElement("script");
  s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  s.async = true;
  s.defer = true;
  s.onload = () => {
    if (!window.turnstile) return;
    state.payWidget = window.turnstile.render("#cf-pay", {
      sitekey: siteKey,
      theme: "dark",
      callback: (t) => {
        state.cfPay = t;
      },
      "expired-callback": () => {
        state.cfPay = "";
      },
    });
    state.trialWidget = window.turnstile.render("#cf-trial", {
      sitekey: siteKey,
      theme: "dark",
      callback: (t) => {
        state.cfTrial = t;
      },
      "expired-callback": () => {
        state.cfTrial = "";
      },
    });
    state.keyWidget = window.turnstile.render("#cf-key", {
      sitekey: siteKey,
      theme: "dark",
      callback: (t) => {
        state.cfKey = t;
      },
      "expired-callback": () => {
        state.cfKey = "";
      },
    });
  };
  document.head.appendChild(s);
}

function resetWidget(kind) {
  if (!window.turnstile) return;
  if (kind === "pay" && state.payWidget !== null) {
    state.cfPay = "";
    window.turnstile.reset(state.payWidget);
  }
  if (kind === "trial" && state.trialWidget !== null) {
    state.cfTrial = "";
    window.turnstile.reset(state.trialWidget);
  }
  if (kind === "key" && state.keyWidget !== null) {
    state.cfKey = "";
    window.turnstile.reset(state.keyWidget);
  }
}

function currentPlan() {
  if (!state.cfg) return null;
  return state.cfg.plans.find((p) => p.id === state.plan) || null;
}

function currentMethod() {
  if (!state.cfg) return null;
  return state.cfg.methods.find((m) => m.id === state.method) || null;
}

function renderOptions() {
  plansEl.innerHTML = "";
  state.cfg.plans.forEach((p) => {
    const active = p.id === state.plan;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "item" + (active ? " active" : "");
    btn.innerHTML = "<span>" + p.label + "</span><span class=\"price\">" + p.price_rub + " ₽</span>";
    btn.addEventListener("click", () => {
      state.plan = p.id;
      renderOptions();
    });
    plansEl.appendChild(btn);
  });

  methodsEl.innerHTML = "";
  state.cfg.methods.forEach((m) => {
    const active = m.id === state.method;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "item method" + (active ? " active" : "");
    btn.append(methodIcon(m), h("span", "", m.label));
    btn.addEventListener("click", () => {
      state.method = m.id;
      renderOptions();
    });
    methodsEl.appendChild(btn);
  });

  syncPayUi();
}

function syncPayUi() {
  const plan = currentPlan();
  const method = currentMethod();

  if (!plan || !method) {
    payBtn.disabled = true;
    methodNote.hidden = true;
    return;
  }

  payBtn.disabled = !offerCheck.checked;
  const cfSlot = document.getElementById("cf-pay");

  if (method.id === "funpay") {
    cfSlot.hidden = true;
    methodNote.hidden = false;
    methodNote.textContent = "Оплати заказ на FunPay, затем вставь ключ во вкладке «Проверить ключ».";
    payBtn.textContent = "Перейти на FunPay";
  } else if (method.id === "ukr") {
    cfSlot.hidden = true;
    methodNote.hidden = false;
    methodNote.textContent = "Напиши @" + state.cfg.support_username + ", укажи тариф " + plan.label + ". После оплаты вставь ключ во вкладке «Проверить ключ».";
    payBtn.textContent = "Написать @" + state.cfg.support_username;
  } else {
    cfSlot.hidden = false;
    methodNote.hidden = true;
    payBtn.textContent = "Оплатить " + plan.price_rub + " ₽";
  }
}

function startPolling(orderId, payUrl) {
  if (state.poll) clearInterval(state.poll);

  const order = state.order && state.order.id === orderId ? state.order : null;
  const orderRows = [["Заказ", orderId.toUpperCase(), true]];
  if (order) {
    orderRows.push(["Сумма", order.price + " ₽"], ["Способ оплаты", order.method]);
  }

  showView(orderBox, buyForm, {
    icon: "fa-solid fa-spinner fa-spin",
    title: "Ожидание оплаты",
    sub: "Ключ появится здесь сразу после оплаты. Страницу можно не закрывать.",
    rows: orderRows,
    reopenUrl: payUrl,
  });

  const check = async () => {
    try {
      const res = await fetch(API + "/web/order/" + encodeURIComponent(orderId));
      const data = await res.json();
      if (data.status === "paid") {
        clearInterval(state.poll);
        state.poll = null;
        switchTab("buy");
        const paidRows = [["Заказ", orderId.toUpperCase(), true]];
        const amount = formatAmount(data.amount) || (order ? order.price + " ₽" : "");
        const method = data.provider_label || (order ? order.method : "");
        if (amount) paidRows.push(["Сумма", amount]);
        if (method) paidRows.push(["Способ оплаты", method]);
        paidRows.push(["Срок", data.days + " дн."], ["Дата оплаты", formatPaidAt(data.paid_at)]);
        showView(orderBox, buyForm, {
          tone: "ok",
          icon: "fa-solid fa-check",
          title: "Оплачено",
          sub: "Подписка активирована",
          rows: paidRows,
          key: data.key,
          downloadUrl: data.download_url,
          install: true,
          receiptLink: receiptUrl(orderId),
          backLabel: "Новая оплата",
        });
        if (isFirstPaidView(orderId)) {
          notify("Оплата подтверждена", "ok");
          fireConfetti();
        }
      }
    } catch (_) {}
  };

  check();
  state.poll = setInterval(check, 4000);
}

async function showReceipt(orderId) {
  try {
    const res = await fetch(API + "/web/receipt/" + encodeURIComponent(orderId));
    const data = await res.json();
    if (!res.ok || !data.ok) {
      notify(data.error || "Чек не найден", "err");
      return;
    }
    const rows = [["Заказ", data.order_id.toUpperCase(), true]];
    const amount = formatAmount(data.amount);
    if (amount) rows.push(["Сумма", amount]);
    if (data.provider_label) rows.push(["Способ оплаты", data.provider_label]);
    rows.push(
      ["Срок", data.days + " дн."],
      ["Дата оплаты", formatPaidAt(data.paid_at)],
      ["Ключ", data.key_masked, true],
      ["Статус ключа", data.key_status]
    );
    showView(orderBox, buyForm, {
      tone: "ok",
      icon: "fa-solid fa-check",
      title: "Чек об оплате",
      rows,
      receiptLink: receiptUrl(data.order_id),
      backLabel: "На главную",
    });
  } catch (_) {
    notify("Нет связи с сервером", "err");
  }
}

function runCheckTimer(until) {
  if (state.checkTimer) clearInterval(state.checkTimer);

  const tick = () => {
    const left = Math.ceil((until - Date.now()) / 1000);
    if (left <= 0) {
      clearInterval(state.checkTimer);
      state.checkTimer = null;
      checkBtn.disabled = false;
      checkBtn.textContent = checkBtnDefaultText;
      try {
        localStorage.removeItem(CHECK_CD_KEY);
      } catch (_) {}
      return;
    }
    checkBtn.disabled = true;
    checkBtn.textContent = "Подождите " + left + " сек.";
  };

  tick();
  state.checkTimer = setInterval(tick, 500);
}

function startCheckCooldown(sec) {
  const duration = Number(sec);
  if (!Number.isFinite(duration) || duration <= 0) return;
  const until = Date.now() + duration * 1000;
  try {
    localStorage.setItem(CHECK_CD_KEY, String(until));
  } catch (_) {}
  runCheckTimer(until);
}

offerCheck.addEventListener("change", syncPayUi);

payBtn.addEventListener("click", async () => {
  const plan = currentPlan();
  const method = currentMethod();
  if (!plan || !method) return;

  if (!offerCheck.checked) {
    notify("Примите условия оферты", "err");
    return;
  }

  if (method.id === "funpay") {
    if (plan.funpay_url) window.open(plan.funpay_url, "_blank", "noopener");
    return;
  }

  if (method.id === "ukr") {
    window.open(state.cfg.support_url, "_blank", "noopener");
    return;
  }

  if (state.cfg.turnstile_site_key && !state.cfPay) {
    notify("Пройди проверку капчи", "err");
    return;
  }

  payBtn.disabled = true;
  notify("Создание счета...", "info");

  try {
    const res = await fetch(API + "/web/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: plan.id,
        method: method.id,
        offer_accepted: true,
        cf_token: state.cfPay,
      }),
    });
    const data = await res.json();
    resetWidget("pay");

    if (!res.ok || !data.ok) {
      notify(data.error || "Ошибка создания счета", "err");
      payBtn.disabled = false;
      return;
    }

    payBtn.disabled = !offerCheck.checked;
    window.open(data.url, "_blank", "noopener");
    state.order = { id: data.order_id, price: plan.price_rub, method: method.label };
    startPolling(data.order_id, data.url);
  } catch (_) {
    resetWidget("pay");
    notify("Нет связи с сервером", "err");
    payBtn.disabled = false;
  }
});

trialBtn.addEventListener("click", async () => {
  if (state.cfg && state.cfg.turnstile_site_key && !state.cfTrial) {
    notify("Пройди проверку капчи", "err");
    return;
  }

  trialBtn.disabled = true;
  notify("Выдача ключа...", "info");

  try {
    const res = await fetch(API + "/web/trial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cf_token: state.cfTrial }),
    });
    const data = await res.json();
    resetWidget("trial");
    trialBtn.disabled = false;

    if (!res.ok || !data.ok) {
      notify(data.error || "Ошибка выдачи ключа", "err");
      return;
    }

    const expired = data.days_left <= 0;
    showView(trialBox, trialForm, {
      tone: expired ? "err" : "ok",
      icon: expired ? "fa-solid fa-xmark" : "fa-solid fa-check",
      title: expired ? "Срок истёк" : "Ключ выдан",
      rows: [["Статус", data.status], ["Осталось", Math.max(0, data.days_left) + " дн."]],
      key: data.key,
      downloadUrl: expired ? "" : data.download_url,
      install: !expired,
    });
    notify(expired ? "Пробный ключ истек" : (data.is_new ? "Пробный ключ выдан" : "Показан ранее выданный ключ"), expired ? "err" : "ok");
  } catch (_) {
    resetWidget("trial");
    trialBtn.disabled = false;
    notify("Нет связи с сервером", "err");
  }
});

keyInput.addEventListener("input", () => {
  const raw = keyInput.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
  const parts = raw.match(/.{1,4}/g);
  keyInput.value = parts ? parts.join("-") : raw;
});

checkBtn.addEventListener("click", async () => {
  if (state.checkTimer) return;

  const key = keyInput.value.trim().toUpperCase();
  if (!/^[A-Z0-9]{4}(-[A-Z0-9]{4}){3}$/.test(key)) {
    notify("Формат: XXXX-XXXX-XXXX-XXXX", "err");
    return;
  }
  if (state.cfg && state.cfg.turnstile_site_key && !state.cfKey) {
    notify("Пройди проверку капчи", "err");
    return;
  }

  checkBtn.disabled = true;
  notify("Проверка ключа...", "info");

  try {
    const res = await fetch(API + "/web/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, cf_token: state.cfKey }),
    });
    const data = await res.json();
    resetWidget("key");

    if (data.retry_after) {
      startCheckCooldown(data.retry_after);
    } else {
      checkBtn.disabled = false;
    }

    if (!res.ok || !data.ok) {
      notify(data.error || "Ключ не найден", "err");
      return;
    }

    const expired = data.days_left <= 0;
    showView(keyBox, keyForm, {
      tone: expired ? "err" : "ok",
      icon: expired ? "fa-solid fa-xmark" : "fa-solid fa-check",
      title: expired ? "Срок истёк" : "Ключ активен",
      rows: [["Статус", data.status], ["Осталось", Math.max(0, data.days_left) + " дн."]],
      key,
      downloadUrl: expired ? "" : data.download_url,
      install: !expired,
      backLabel: "Проверить другой ключ",
    });
    notify(expired ? "Срок действия ключа истек" : "Ключ подтвержден", expired ? "err" : "ok");
  } catch (_) {
    resetWidget("key");
    notify("Нет связи с сервером", "err");
    checkBtn.disabled = false;
  }
});

const offerDialog = document.getElementById("offer");

document.querySelectorAll("[data-offer]").forEach((btn) => {
  btn.addEventListener("click", () => offerDialog.showModal());
});
document.getElementById("offer-close").addEventListener("click", () => offerDialog.close());
offerDialog.addEventListener("click", (e) => {
  if (e.target === offerDialog) offerDialog.close();
});

async function init() {
  startBg();

  try {
    const savedUntil = Number(localStorage.getItem(CHECK_CD_KEY) || 0);
    if (savedUntil > Date.now()) runCheckTimer(savedUntil);
  } catch (_) {}

  try {
    const res = await fetch(API + "/web/config");
    state.cfg = await res.json();

    const params = new URLSearchParams(location.search);
    const fkOrder = params.get("MERCHANT_ORDER_ID");
    if (fkOrder && fkOrder.split("_").length === 3 && fkOrder.split("_")[0] !== "0" && state.cfg.bot_url) {
      location.replace(state.cfg.bot_url);
      return;
    }

    if (state.cfg.support_url) {
      const sLink = document.getElementById("support-link");
      sLink.href = state.cfg.support_url;
      sLink.hidden = false;
    }
    if (state.cfg.bot_url) {
      const bLink = document.getElementById("bot-link");
      bLink.href = state.cfg.bot_url;
      bLink.hidden = false;
    }

    if (state.cfg.plans.length) state.plan = state.cfg.plans[0].id;
    if (state.cfg.methods.length) state.method = state.cfg.methods[0].id;
    renderOptions();
    loadTurnstile(state.cfg.turnstile_site_key);

    const receiptId = params.get("receipt");
    if (receiptId && /^[0-9a-f]{16}$/.test(receiptId)) {
      showReceipt(receiptId);
      return;
    }

    let orderId = params.get("order");
    if (!orderId && fkOrder) {
      const parts = fkOrder.split("_");
      if (parts.length === 3) orderId = parts[2];
    }
    if (orderId && /^[0-9a-f]{16}$/.test(orderId)) {
      startPolling(orderId);
    }
  } catch (_) {
    notify("Сервер недоступен", "err");
  }
}

init();