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
  checkTimer: null,
};

const bgCanvas = document.getElementById("bg");
const plansEl = document.getElementById("plans");
const methodsEl = document.getElementById("methods");
const methodNote = document.getElementById("method-note");
const payBtn = document.getElementById("pay-btn");
const orderBox = document.getElementById("order-box");
const orderHead = document.getElementById("order-head");
const orderIcon = document.getElementById("order-icon");
const orderStatus = document.getElementById("order-status");
const orderKeyRow = document.getElementById("order-key-row");
const orderKey = document.getElementById("order-key");
const orderActions = document.getElementById("order-actions");
const orderDl = document.getElementById("order-dl");
const copyKeyBtn = document.getElementById("copy-key");

const trialBtn = document.getElementById("trial-btn");
const trialBox = document.getElementById("trial-box");
const trialInfo = document.getElementById("trial-info");
const trialKey = document.getElementById("trial-key");
const trialDl = document.getElementById("trial-dl");
const trialActions = trialBox.querySelector(".actions");
const trialInstall = trialBox.querySelector(".install");
const copyTrialKeyBtn = document.getElementById("copy-trial-key");

const keyInput = document.getElementById("key-input");
const checkBtn = document.getElementById("check-btn");
const checkBtnDefaultText = checkBtn.textContent;
const keyBox = document.getElementById("key-box");
const keyInfo = document.getElementById("key-info");
const keyDl = document.getElementById("key-dl");
const keyActions = keyBox.querySelector(".actions");
const keyInstall = keyBox.querySelector(".install");
const toastsEl = document.getElementById("toasts");

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

function bindCopy(btn, sourceEl) {
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(sourceEl.textContent);
      const icon = btn.querySelector("i");
      btn.classList.add("done");
      icon.className = "fa-solid fa-check";
      notify("Ключ скопирован", "ok");
      setTimeout(() => {
        btn.classList.remove("done");
        icon.className = "fa-regular fa-copy";
      }, 1500);
    } catch (_) {}
  });
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
    btn.className = "item" + (active ? " active" : "");
    btn.textContent = m.label;
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

  payBtn.disabled = false;
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

function startPolling(orderId) {
  if (state.poll) clearInterval(state.poll);

  orderBox.hidden = false;
  orderHead.classList.remove("ok");
  orderIcon.className = "fa-solid fa-spinner fa-spin";
  orderStatus.textContent = "Ожидание оплаты";
  orderKeyRow.hidden = true;
  orderActions.hidden = true;

  const check = async () => {
    try {
      const res = await fetch(API + "/web/order/" + encodeURIComponent(orderId));
      const data = await res.json();
      if (data.status === "paid") {
        clearInterval(state.poll);
        state.poll = null;
        orderHead.classList.add("ok");
        orderIcon.className = "fa-solid fa-circle-check";
        orderStatus.textContent = "Оплачено " + data.days + " дн.";
        orderKey.textContent = data.key;
        orderKeyRow.hidden = false;
        orderDl.href = data.download_url;
        orderActions.hidden = false;
        notify("Оплата подтверждена", "ok");
        fireConfetti();
      }
    } catch (_) {}
  };

  check();
  state.poll = setInterval(check, 4000);
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

payBtn.addEventListener("click", async () => {
  const plan = currentPlan();
  const method = currentMethod();
  if (!plan || !method) return;

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

    payBtn.disabled = false;
    window.open(data.url, "_blank", "noopener");
    startPolling(data.order_id);
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
    trialInfo.classList.toggle("ok", !expired);
    trialInfo.classList.toggle("err", expired);
    const icon = expired ? "fa-circle-xmark" : "fa-circle-check";
    const text = expired ? "Ключ " + data.status : data.status;
    trialInfo.innerHTML = "<i class=\"fa-solid " + icon + "\"></i><span>" + text + "</span>";
    trialKey.textContent = data.key;
    trialActions.hidden = expired || !data.download_url;
    trialInstall.hidden = expired;
    trialDl.href = expired ? "#" : (data.download_url || "#");
    trialBox.hidden = false;
    notify(expired ? "Пробный ключ истек" : (data.is_new ? "Пробный ключ выдан" : "Показан ранее выданный ключ"), expired ? "err" : "ok");
  } catch (_) {
    resetWidget("trial");
    trialBtn.disabled = false;
    notify("Нет связи с сервером", "err");
  }
});

bindCopy(copyKeyBtn, orderKey);
bindCopy(copyTrialKeyBtn, trialKey);

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
  keyBox.hidden = true;
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
    keyInfo.classList.toggle("ok", !expired);
    keyInfo.classList.toggle("err", expired);
    const icon = expired ? "fa-circle-xmark" : "fa-circle-check";
    const text = expired
      ? "Ключ " + data.status
      : "Активен " + data.days_left + " дн. (" + data.status + ")";
    keyInfo.innerHTML = "<i class=\"fa-solid " + icon + "\"></i><span>" + text + "</span>";
    keyActions.hidden = expired || !data.download_url;
    keyInstall.hidden = expired;
    keyDl.href = expired ? "#" : (data.download_url || "#");
    keyBox.hidden = false;
    notify(expired ? "Срок действия ключа истек" : "Ключ подтвержден", expired ? "err" : "ok");
  } catch (_) {
    resetWidget("key");
    notify("Нет связи с сервером", "err");
    checkBtn.disabled = false;
  }
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