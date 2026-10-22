const API_BASE = 'https://xk9m2pq.xyz';

const burgerBtn = document.getElementById('burgerBtn');
const mainNav = document.getElementById('mainNav');

if (burgerBtn && mainNav) {
    burgerBtn.addEventListener('click', () => {
        const isOpen = mainNav.classList.toggle('is-open');
        burgerBtn.classList.toggle('is-active', isOpen);
        burgerBtn.setAttribute('aria-expanded', isOpen);
    });

    mainNav.querySelectorAll('.header__nav-link').forEach((link) => {
        link.addEventListener('click', () => {
            mainNav.classList.remove('is-open');
            burgerBtn.classList.remove('is-active');
            burgerBtn.setAttribute('aria-expanded', 'false');
        });
    });
}

const navLinks = document.querySelectorAll('.header__nav-link');
const navHome = document.getElementById('navHome');
const navStats = document.getElementById('navStats');
const navProducts = document.getElementById('navProducts');
const navAbout = document.getElementById('navAbout');
const statsSection = document.getElementById('stats');
const productsSection = document.getElementById('products');
const aboutSection = document.getElementById('about');

let isClickScrolling = false;
let clickScrollTimer = null;

function setActiveNav(targetLink) {
    navLinks.forEach((link) => {
        link.classList.toggle('header__nav-link--active', link === targetLink);
    });
}

function smoothScrollToSection(section, activeLink) {
    if (!section) return;
    setActiveNav(activeLink);
    isClickScrolling = true;
    clearTimeout(clickScrollTimer);

    const headerOffset = 70;
    const targetY = section.getBoundingClientRect().top + window.pageYOffset - headerOffset;

    window.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth'
    });

    clickScrollTimer = setTimeout(() => {
        isClickScrolling = false;
    }, 900);
}

navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');

        if (href === '#stats' && statsSection) {
            e.preventDefault();
            smoothScrollToSection(statsSection, link);
        } else if (href === '#products' && productsSection) {
            e.preventDefault();
            smoothScrollToSection(productsSection, link);
        } else if (href === '#about' && aboutSection) {
            e.preventDefault();
            smoothScrollToSection(aboutSection, link);
        } else if (href === 'index.html' || href === './' || href === '/' || href === '#') {
            const isCurrentPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') || !window.location.pathname.includes('/');
            if (isCurrentPage) {
                e.preventDefault();
                setActiveNav(navHome);
                isClickScrolling = true;
                clearTimeout(clickScrollTimer);

                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });

                clickScrollTimer = setTimeout(() => {
                    isClickScrolling = false;
                }, 900);
            }
        } else {
            setActiveNav(link);
        }
    });
});

window.addEventListener('scroll', () => {
    if (isClickScrolling || !navHome) return;

    const windowHeight = window.innerHeight;
    const isScrolledToBottom = (windowHeight + window.scrollY) >= (document.documentElement.scrollHeight - 50);

    if (aboutSection) {
        const aboutRect = aboutSection.getBoundingClientRect();
        if (aboutRect.top <= windowHeight * 0.45 || isScrolledToBottom) {
            setActiveNav(navAbout);
            return;
        }
    }

    if (productsSection) {
        const prodRect = productsSection.getBoundingClientRect();
        if (prodRect.top <= windowHeight * 0.45) {
            setActiveNav(navProducts);
            return;
        }
    }

    if (statsSection) {
        const statsRect = statsSection.getBoundingClientRect();
        if (statsRect.top <= windowHeight * 0.45) {
            setActiveNav(navStats);
            return;
        }
    }

    setActiveNav(navHome);
}, { passive: true });

const textElement = document.getElementById('heroText');
const cursorElement = document.querySelector('.hero__cursor');
const smileElement = document.getElementById('heroSmile');

const phrase = 'Use AI to your advantage.';
let charIndex = 0;

function typeCharacter() {
    if (!textElement) return;

    if (charIndex < phrase.length) {
        textElement.textContent += phrase[charIndex];
        charIndex++;
        const delay = phrase[charIndex - 1] === '.' ? 250 : 45 + Math.random() * 20;
        setTimeout(typeCharacter, delay);
    } else {
        if (cursorElement) {
            setTimeout(() => {
                cursorElement.style.display = 'none';
            }, 1400);
        }
        if (smileElement) {
            smileElement.classList.add('is-visible');
            setTimeout(() => {
                smileElement.classList.add('is-drawing');
            }, 60);
        }
    }
}

setTimeout(typeCharacter, 400);

const headerAccountBtn = document.getElementById('headerAccountBtn');
const accountPopover = document.getElementById('accountPopover');
const accountUserName = document.getElementById('accountUserName');
const signOutBtn = document.getElementById('signOutBtn');

function getCurrentUser() {
    const user = localStorage.getItem('chromo_user');
    return user && user.trim() ? user.trim() : null;
}

const MODEL_TIERS = {
    'Gemini 3.8 Flash': 'Free',
    'Chat GPT Sol 5.6': 'Free',
    'Gemini 4.0': 'Spark',
    'Chat GPT Astra 6.1': 'Pulse',
    'Claude 5.5 Sonet': 'Pulse',
    'Claude 5.1 Fable': 'Pulse',
    'Claude 5.5 Opus': 'Pulse'
};

const PLAN_HIERARCHY = {
    'Free': 0,
    'Spark': 1,
    'Pulse': 2,
    'Apex': 3
};

function isModelAccessible(modelName, plan) {
    const requiredTier = MODEL_TIERS[modelName] || 'Free';
    const userRank = PLAN_HIERARCHY[plan] !== undefined ? PLAN_HIERARCHY[plan] : 0;
    const reqRank = PLAN_HIERARCHY[requiredTier] !== undefined ? PLAN_HIERARCHY[requiredTier] : 0;
    return userRank >= reqRank;
}

function updateModelSelectPermissions() {
    const plan = localStorage.getItem('chromo_sub') || 'Free';
    const items = document.querySelectorAll('.model-select__item');
    items.forEach((item) => {
        const m = item.dataset.model;
        const accessible = isModelAccessible(m, plan);
        item.classList.toggle('is-locked', !accessible);
        let badge = item.querySelector('.model-select__item-badge');
        if (!accessible) {
            const req = MODEL_TIERS[m] || 'Spark';
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'model-select__item-badge';
                item.appendChild(badge);
            }
            badge.textContent = req;
        } else if (badge) {
            badge.remove();
        }
    });

    const saved = localStorage.getItem('chromo_selected_model');
    const targetModel = (saved && isModelAccessible(saved, plan)) ? saved : (currentModel ? currentModel.textContent.trim() : 'Gemini 3.8 Flash');
    const effectiveModel = isModelAccessible(targetModel, plan) ? targetModel : 'Gemini 3.8 Flash';

    if (currentModel) currentModel.textContent = effectiveModel;
    items.forEach((item) => {
        item.classList.toggle('is-selected', item.dataset.model === effectiveModel);
    });
    const user = getCurrentUser();
    if (chatInput) {
        chatInput.placeholder = user ? ('Message ' + effectiveModel + '...') : ('Sign in to message ' + effectiveModel + '...');
    }
}

async function syncUserProfile() {
    const user = getCurrentUser();
    if (!user) return;
    try {
        const res = await fetch(`${API_BASE}/api/user?username=${encodeURIComponent(user)}`);
        const data = await res.json();
        if (data.ok && data.subscription) {
            localStorage.setItem('chromo_sub', data.subscription);
            const planEl = document.getElementById('accountUserPlan');
            if (planEl) planEl.textContent = data.subscription;
            const tierText = document.querySelector('.account-popover__tier-text');
            if (tierText) tierText.textContent = data.subscription + ' Member';
            updateModelSelectPermissions();
        }
        fetchLimitsPreview();
    } catch (e) {}
}

async function fetchLimitsPreview() {
    const user = getCurrentUser();
    const statEl = document.getElementById('popoverLimitsStat');
    const barEl = document.getElementById('popoverLimitsBar');
    if (!statEl || !barEl) return;

    if (!user) {
        statEl.textContent = '0 / 0';
        barEl.style.width = '0%';
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/limits?username=${encodeURIComponent(user)}`);
        const data = await res.json();
        if (data.ok) {
            if (data.is_unlimited) {
                statEl.textContent = 'Unlimited';
                barEl.style.width = '100%';
            } else {
                const used = data.used || 0;
                const max = data.max || 5;
                const pct = Math.min(100, Math.max(0, data.percentage || 0));
                statEl.textContent = used + ' / ' + max;
                barEl.style.width = pct + '%';
            }
        }
    } catch (e) { }
}

function updateAuthUI() {
    const user = getCurrentUser();
    const activeModel = currentModel ? currentModel.textContent.trim() : 'Gemini 3.8 Flash';

    if (user) {
        if (headerAccountBtn) {
            headerAccountBtn.classList.add('is-logged-in');
            headerAccountBtn.setAttribute('title', 'Signed in as ' + user);
            headerAccountBtn.setAttribute('aria-label', 'Account menu (' + user + ')');
        }
        if (accountUserName) {
            accountUserName.textContent = user;
        }
        const accountAvatar = document.getElementById('accountAvatar');
        const headerUserAvatar = document.getElementById('headerUserAvatar');
        const userInitial = (user[0] || 'U').toUpperCase();
        const userAvatarPhoto = localStorage.getItem('chromo_avatar');
        if (headerUserAvatar) {
            if (userAvatarPhoto) {
                headerUserAvatar.innerHTML = '<img src="' + userAvatarPhoto + '" alt="' + user + '" class="header__account-avatar-img">';
            } else {
                headerUserAvatar.textContent = userInitial;
            }
        }
        if (accountAvatar) {
            if (userAvatarPhoto) {
                accountAvatar.innerHTML = '<img src="' + userAvatarPhoto + '" alt="' + user + '" class="account-popover__avatar-img">';
            } else {
                accountAvatar.textContent = userInitial;
            }
        }
        const sub = localStorage.getItem('chromo_sub') || 'Free';
        const planEl = document.getElementById('accountUserPlan');
        if (planEl) {
            planEl.textContent = sub;
        }
        const tierText = document.querySelector('.account-popover__tier-text');
        if (tierText) {
            tierText.textContent = sub + ' Member';
        }
        if (chatInput) {
            chatInput.placeholder = 'Message ' + activeModel + '...';
        }
        syncUserProfile();
        updateModelSelectPermissions();
        fetchLimitsPreview();
    } else {
        if (headerAccountBtn) {
            headerAccountBtn.classList.remove('is-logged-in');
            headerAccountBtn.setAttribute('title', 'Sign in or register');
            headerAccountBtn.setAttribute('aria-label', 'Sign in or register');
        }
        if (accountPopover) {
            accountPopover.classList.remove('is-open');
            accountPopover.setAttribute('aria-hidden', 'true');
        }
        if (chatInput) {
            chatInput.placeholder = 'Sign in to message ' + activeModel + '...';
        }
        updateModelSelectPermissions();
        fetchLimitsPreview();
    }
}

if (headerAccountBtn) {
    headerAccountBtn.addEventListener('click', (e) => {
        if (getCurrentUser()) {
            e.preventDefault();
            if (accountPopover) {
                const isOpen = accountPopover.classList.toggle('is-open');
                accountPopover.setAttribute('aria-hidden', !isOpen);
            }
        }
    });
}

document.addEventListener('click', (e) => {
    if (accountPopover && accountPopover.classList.contains('is-open')) {
        if (!accountPopover.contains(e.target) && headerAccountBtn && !headerAccountBtn.contains(e.target)) {
            accountPopover.classList.remove('is-open');
            accountPopover.setAttribute('aria-hidden', 'true');
        }
    }
});

if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
        localStorage.removeItem('chromo_user');
        localStorage.removeItem('chromo_token');
        localStorage.removeItem('chromo_sub');
        if (accountPopover) {
            accountPopover.classList.remove('is-open');
            accountPopover.setAttribute('aria-hidden', 'true');
        }
        updateAuthUI();
    });
}

const authModal = document.getElementById('authModal');
const authModalBackdrop = document.getElementById('authModalBackdrop');
const authModalClose = document.getElementById('authModalClose');
const authModalTitle = document.getElementById('authModalTitle');
const authModalDesc = document.getElementById('authModalDesc');
const authModalCancelBtn = document.getElementById('authModalCancelBtn');
const authModalPrimaryBtn = document.getElementById('authModalPrimaryBtn');

function openAuthModal(title, description, btnText, btnHref) {
    if (!authModal) return;
    if (title && authModalTitle) authModalTitle.textContent = title;
    if (description && authModalDesc) authModalDesc.textContent = description;
    if (authModalPrimaryBtn) {
        if (btnText) {
            authModalPrimaryBtn.textContent = btnText;
        } else {
            authModalPrimaryBtn.textContent = getCurrentUser() ? 'Upgrade Plan' : 'Sign In or Register';
        }
        if (btnHref) {
            authModalPrimaryBtn.href = btnHref;
        } else {
            authModalPrimaryBtn.href = getCurrentUser() ? '#products' : 'reg/';
        }
    }
    authModal.classList.add('is-open');
    authModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
    if (!authModal) return;
    authModal.classList.remove('is-open');
    authModal.setAttribute('aria-hidden', 'true');
    const hasOtherModals = (checkoutModal && checkoutModal.classList.contains('is-open')) ||
                           (legalModal && legalModal.classList.contains('is-open'));
    if (!hasOtherModals) {
        document.body.style.overflow = '';
    }
}

if (authModalClose) authModalClose.addEventListener('click', closeAuthModal);
if (authModalBackdrop) authModalBackdrop.addEventListener('click', closeAuthModal);
if (authModalCancelBtn) authModalCancelBtn.addEventListener('click', closeAuthModal);

const legalModal = document.getElementById('legalModal');
const legalModalBackdrop = document.getElementById('legalModalBackdrop');
const legalModalClose = document.getElementById('legalModalClose');
const tabPrivacy = document.getElementById('tabPrivacy');
const tabTerms = document.getElementById('tabTerms');
const panelPrivacy = document.getElementById('panelPrivacy');
const panelTerms = document.getElementById('panelTerms');

function switchLegalTab(tab) {
    const isPrivacy = tab !== 'terms';

    if (tabPrivacy) {
        tabPrivacy.classList.toggle('is-active', isPrivacy);
        tabPrivacy.setAttribute('aria-selected', isPrivacy ? 'true' : 'false');
    }
    if (tabTerms) {
        tabTerms.classList.toggle('is-active', !isPrivacy);
        tabTerms.setAttribute('aria-selected', !isPrivacy ? 'true' : 'false');
    }
    if (panelPrivacy) {
        panelPrivacy.classList.toggle('is-active', isPrivacy);
    }
    if (panelTerms) {
        panelTerms.classList.toggle('is-active', !isPrivacy);
    }
}

function openLegalModal(tab) {
    if (!legalModal) return;
    switchLegalTab(tab);
    legalModal.classList.add('is-open');
    legalModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeLegalModal() {
    if (!legalModal) return;
    legalModal.classList.remove('is-open');
    legalModal.setAttribute('aria-hidden', 'true');
    const hasOtherModals = (checkoutModal && checkoutModal.classList.contains('is-open')) ||
                           (authModal && authModal.classList.contains('is-open'));
    if (!hasOtherModals) {
        document.body.style.overflow = '';
    }
}

if (tabPrivacy) tabPrivacy.addEventListener('click', () => switchLegalTab('privacy'));
if (tabTerms) tabTerms.addEventListener('click', () => switchLegalTab('terms'));
if (legalModalClose) legalModalClose.addEventListener('click', closeLegalModal);
if (legalModalBackdrop) legalModalBackdrop.addEventListener('click', closeLegalModal);

const privacyTriggers = [
    document.getElementById('linkPrivacy'),
    document.getElementById('legalPrivacy'),
    document.getElementById('linkSecurity')
];

const termsTriggers = [
    document.getElementById('linkTerms'),
    document.getElementById('legalTerms'),
    document.getElementById('linkCookies')
];

privacyTriggers.forEach((trigger) => {
    if (trigger) {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            openLegalModal('privacy');
        });
    }
});

termsTriggers.forEach((trigger) => {
    if (trigger) {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            openLegalModal('terms');
        });
    }
});

const chatInput = document.getElementById('chatInput');
const modelSelect = document.getElementById('modelSelect');
const modelBtn = document.getElementById('modelBtn');
const currentModel = document.getElementById('currentModel');
const modelItems = document.querySelectorAll('.model-select__item');
const attachBtn = document.getElementById('attachBtn');

if (modelBtn && modelSelect) {
    modelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = modelSelect.classList.toggle('is-open');
        modelBtn.setAttribute('aria-expanded', isOpen);
    });

    modelItems.forEach((item) => {
        item.addEventListener('click', () => {
            const selectedModel = item.dataset.model;
            const plan = localStorage.getItem('chromo_sub') || 'Free';

            if (!isModelAccessible(selectedModel, plan)) {
                const req = MODEL_TIERS[selectedModel] || 'Spark';
                openAuthModal(
                    selectedModel + ' is locked',
                    selectedModel + ' requires the ' + req + ' plan. Your current subscription is ' + plan + '.'
                );
                modelSelect.classList.remove('is-open');
                modelBtn.setAttribute('aria-expanded', 'false');
                return;
            }

            modelItems.forEach((i) => i.classList.remove('is-selected'));
            item.classList.add('is-selected');
            currentModel.textContent = selectedModel;
            localStorage.setItem('chromo_selected_model', selectedModel);
            if (chatInput) {
                const user = getCurrentUser();
                chatInput.placeholder = user ? ('Message ' + selectedModel + '...') : ('Sign in to message ' + selectedModel + '...');
            }
            modelSelect.classList.remove('is-open');
            modelBtn.setAttribute('aria-expanded', 'false');
        });
    });

    document.addEventListener('click', (e) => {
        if (!modelSelect.contains(e.target)) {
            modelSelect.classList.remove('is-open');
            modelBtn.setAttribute('aria-expanded', 'false');
        }
    });
}

function handleChatAttempt(e) {
    if (!getCurrentUser()) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (chatInput) chatInput.blur();
        const modelName = currentModel ? currentModel.textContent.trim() : 'AI';
        openAuthModal(
            'Sign in to message ' + modelName,
            'An active Chromo account is required to prompt neural models and start conversations. Please sign in or register to proceed.'
        );
        return false;
    }
    return true;
}

if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (chatBar) {
                chatBar.dispatchEvent(new Event('submit', { cancelable: true }));
            }
        }
    });

    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 140) + 'px';
    });
}

if (attachBtn) {
    attachBtn.addEventListener('click', (e) => {
        if (!getCurrentUser()) {
            e.preventDefault();
            e.stopPropagation();
            const modelName = currentModel ? currentModel.textContent.trim() : 'AI';
            openAuthModal(
                'Sign in to attach files',
                'Please sign in or register to upload context and media to ' + modelName + '.'
            );
        }
    });
}

const chatBar = document.getElementById('chatBar');
const fileInput = document.getElementById('fileInput');
const attachmentsList = document.getElementById('attachmentsList');
const sendBtn = document.getElementById('sendBtn');

function createFileDocumentIcon(size) {
    const s = size || 16;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', String(s));
    svg.setAttribute('height', String(s));
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.classList.add('doc-file-icon');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z');

    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    poly.setAttribute('points', '14 2 14 8 20 8');

    const l1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l1.setAttribute('x1', '16');
    l1.setAttribute('y1', '13');
    l1.setAttribute('x2', '8');
    l1.setAttribute('y2', '13');

    const l2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l2.setAttribute('x1', '16');
    l2.setAttribute('y1', '17');
    l2.setAttribute('x2', '8');
    l2.setAttribute('y2', '17');

    const l3 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l3.setAttribute('x1', '10');
    l3.setAttribute('y1', '9');
    l3.setAttribute('x2', '8');
    l3.setAttribute('y2', '9');

    svg.appendChild(path);
    svg.appendChild(poly);
    svg.appendChild(l1);
    svg.appendChild(l2);
    svg.appendChild(l3);
    return svg;
}

function addAttachment(file) {
    if (!file || !attachmentsList) return;

    if (file.size > 10 * 1024 * 1024) {
        showCenterToast('File Too Large', '"' + file.name + '" exceeds the 10 MB limit (' + formatFileSize(file.size) + ').');
        return;
    }

    const chip = document.createElement('div');
    chip.className = 'attachment-chip';

    const isImage = file.type && file.type.startsWith('image/');
    if (isImage) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = file.name;
        chip.appendChild(img);
    } else {
        const iconWrap = document.createElement('span');
        iconWrap.className = 'attachment-chip__icon-wrap';
        iconWrap.appendChild(createFileDocumentIcon(13));
        chip.appendChild(iconWrap);
    }

    const name = document.createElement('span');
    name.className = 'attachment-chip__name';
    name.textContent = file.name;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'attachment-chip__remove';
    removeBtn.setAttribute('aria-label', 'Remove file');

    const removeIcon = document.createElement('img');
    removeIcon.src = 'assets/pictures/kr.png';
    removeIcon.alt = '';

    removeBtn.appendChild(removeIcon);
    removeBtn.addEventListener('click', () => {
        chip.remove();
    });

    chip.appendChild(name);
    chip.appendChild(removeBtn);
    attachmentsList.appendChild(chip);
}

if (fileInput) {
    fileInput.addEventListener('change', () => {
        if (!getCurrentUser()) {
            fileInput.value = '';
            handleChatAttempt();
            return;
        }
        Array.from(fileInput.files).forEach(addAttachment);
        fileInput.value = '';
    });
}

if (chatBar) {
    let dragCounter = 0;

    chatBar.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dragCounter++;
        chatBar.classList.add('is-dragover');
    });

    chatBar.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    chatBar.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter <= 0) {
            dragCounter = 0;
            chatBar.classList.remove('is-dragover');
        }
    });

    chatBar.addEventListener('drop', (e) => {
        e.preventDefault();
        dragCounter = 0;
        chatBar.classList.remove('is-dragover');
        if (!getCurrentUser()) {
            handleChatAttempt();
            return;
        }
        if (e.dataTransfer && e.dataTransfer.files) {
            Array.from(e.dataTransfer.files).forEach(addAttachment);
        }
    });

    chatBar.addEventListener('submit', (e) => {
        e.preventDefault();
        if (typeof isDictating !== 'undefined' && isDictating) {
            finishVoiceDictation();
        }

        const text = chatInput ? chatInput.value.trim() : '';
        if (!text) {
            showCenterToast('Empty Message', 'Please enter a prompt or use voice dictation.');
            return;
        }

        const activeModel = currentModel ? currentModel.textContent.trim() : 'Gemini 3.8 Flash';
        localStorage.setItem('chromo_selected_model', activeModel);
        sessionStorage.setItem('chromo_pending_prompt', JSON.stringify({
            prompt: text,
            model: activeModel,
            autoSend: true
        }));

        if (!getCurrentUser()) {
            openAuthModal(
                'Sign in to message ' + activeModel,
                'An active Chromo account is required to prompt neural models and start conversations. Please sign in or register to proceed.'
            );
            return;
        }

        window.location.href = 'chat/';
    });
}

const checkoutModal = document.getElementById('checkoutModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalClose = document.getElementById('modalClose');
const modalPlanName = document.getElementById('modalPlanName');
const modalPlanTerm = document.getElementById('modalPlanTerm');
const modalPlanPrice = document.getElementById('modalPlanPrice');
const modalPlanPeriod = document.getElementById('modalPlanPeriod');
const modalSummaryName = document.getElementById('modalSummaryName');
const modalSummaryTerm = document.getElementById('modalSummaryTerm');
const modalSummaryTotal = document.getElementById('modalSummaryTotal');
const checkoutSubmit = document.getElementById('checkoutSubmit');
const purchaseBtns = document.querySelectorAll('.product-card__btn');

function openCheckout(btn) {
    if (!checkoutModal) return;

    const name = btn.dataset.name || 'Spark';
    const term = btn.dataset.term || '1 Month';
    const price = btn.dataset.price || '$10';
    const period = btn.dataset.period || '/ month';

    if (modalPlanName) modalPlanName.textContent = name;
    if (modalPlanTerm) modalPlanTerm.textContent = term;
    if (modalPlanPrice) modalPlanPrice.textContent = price;
    if (modalPlanPeriod) modalPlanPeriod.textContent = period;

    if (modalSummaryName) modalSummaryName.textContent = name;
    if (modalSummaryTerm) modalSummaryTerm.textContent = term;
    if (modalSummaryTotal) {
        modalSummaryTotal.textContent = price;
        modalSummaryTotal.style.color = '';
        modalSummaryTotal.style.fontSize = '';
    }

    if (checkoutSubmit) {
        checkoutSubmit.textContent = 'Pay Now';
        checkoutSubmit.style.backgroundColor = '';
        checkoutSubmit.disabled = false;
    }

    checkoutModal.classList.add('is-open');
    checkoutModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeCheckout() {
    if (!checkoutModal) return;

    checkoutModal.classList.remove('is-open');
    checkoutModal.setAttribute('aria-hidden', 'true');
    const hasOtherModals = (authModal && authModal.classList.contains('is-open')) ||
                           (legalModal && legalModal.classList.contains('is-open'));
    if (!hasOtherModals) {
        document.body.style.overflow = '';
    }
}

purchaseBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
        if (!getCurrentUser()) {
            const planName = btn.dataset.name || 'subscription';
            openAuthModal(
                'Sign in to purchase ' + planName,
                'Please sign in or create an account to activate the ' + planName + ' subscription.'
            );
            return;
        }
        openCheckout(btn);
    });
});

if (modalClose) {
    modalClose.addEventListener('click', closeCheckout);
}

if (modalBackdrop) {
    modalBackdrop.addEventListener('click', closeCheckout);
}

if (checkoutSubmit) {
    checkoutSubmit.addEventListener('click', async () => {
        checkoutSubmit.textContent = 'Creating invoice...';
        checkoutSubmit.disabled = true;

        const user = getCurrentUser() || 'User';
        const plan = modalPlanName ? modalPlanName.textContent.trim() : 'Spark';

        try {
            const res = await fetch(`${API_BASE}/api/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user, plan: plan })
            });
            const data = await res.json();

            if (data.ok && data.pay_url) {
                checkoutSubmit.textContent = 'Opening Telegram...';
                checkoutSubmit.style.backgroundColor = '#3b82f6';

                window.open(data.pay_url, '_blank');

                if (data.invoice_id) {
                    checkoutSubmit.textContent = 'Waiting for payment...';
                    const pollInterval = setInterval(async () => {
                        try {
                            const checkRes = await fetch(`${API_BASE}/api/payment/check?invoice_id=${data.invoice_id}`);
                            const checkData = await checkRes.json();
                            if (checkData.ok && checkData.paid) {
                                clearInterval(pollInterval);
                                checkoutSubmit.textContent = 'Paid successfully';
                                checkoutSubmit.style.backgroundColor = '#10b981';
                                localStorage.setItem('chromo_sub', checkData.subscription || plan);
                                syncUserProfile();
                                setTimeout(() => {
                                    closeCheckout();
                                }, 1500);
                            }
                        } catch (e) {}
                    }, 3000);
                }
            } else {
                checkoutSubmit.textContent = 'Declined';
                checkoutSubmit.style.backgroundColor = '#ef4444';
                if (modalSummaryTotal) {
                    modalSummaryTotal.textContent = data.error || 'Declined';
                    modalSummaryTotal.style.color = '#ef4444';
                }
                setTimeout(() => {
                    checkoutSubmit.textContent = 'Pay Now';
                    checkoutSubmit.style.backgroundColor = '';
                    checkoutSubmit.disabled = false;
                }, 2500);
            }
        } catch (err) {
            checkoutSubmit.textContent = 'Gateway Error';
            checkoutSubmit.style.backgroundColor = '#ef4444';
            setTimeout(() => {
                checkoutSubmit.textContent = 'Pay Now';
                checkoutSubmit.style.backgroundColor = '';
                checkoutSubmit.disabled = false;
            }, 2000);
        }
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (voicePanel && voicePanel.style.display !== 'none') {
            cancelVoiceDictation();
        }
        if (checkoutModal && checkoutModal.classList.contains('is-open')) {
            closeCheckout();
        }
        if (authModal && authModal.classList.contains('is-open')) {
            closeAuthModal();
        }
        if (legalModal && legalModal.classList.contains('is-open')) {
            closeLegalModal();
        }
        if (accountPopover && accountPopover.classList.contains('is-open')) {
            accountPopover.classList.remove('is-open');
            accountPopover.setAttribute('aria-hidden', 'true');
        }
        if (modelSelect && modelSelect.classList.contains('is-open')) {
            modelSelect.classList.remove('is-open');
            if (modelBtn) modelBtn.setAttribute('aria-expanded', 'false');
        }
    }
});

const centerToast = document.getElementById('centerToast');
const centerToastTitle = document.getElementById('centerToastTitle');
const centerToastDesc = document.getElementById('centerToastDesc');
const centerToastClose = document.getElementById('centerToastClose');
let centerToastTimer = null;

function showCenterToast(title, desc) {
    if (!centerToast) return;
    if (centerToastTitle && title) centerToastTitle.textContent = title;
    if (centerToastDesc && desc) centerToastDesc.textContent = desc;

    centerToast.classList.add('is-visible');
    clearTimeout(centerToastTimer);
    centerToastTimer = setTimeout(() => {
        centerToast.classList.remove('is-visible');
    }, 4500);
}

if (centerToastClose) {
    centerToastClose.addEventListener('click', () => {
        if (centerToast) centerToast.classList.remove('is-visible');
        clearTimeout(centerToastTimer);
    });
}

function formatDuration(seconds) {
    const s = Math.max(0, Math.floor(seconds || 0));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

let speechRecognizer = null;
let dictationInitialText = '';
let isDictating = false;
let dictationStartTime = 0;
let dictationTimerInterval = null;

const voiceRecordBtn = document.getElementById('voiceRecordBtn');
const voicePanel = document.getElementById('voicePanel');
const voiceTimer = document.getElementById('voiceTimer');
const voiceCancelBtn = document.getElementById('voiceCancelBtn');
const voiceDoneBtn = document.getElementById('voiceDoneBtn') || document.getElementById('voiceSendBtn');

function cleanupVoiceDictation() {
    isDictating = false;
    clearInterval(dictationTimerInterval);
    if (voicePanel) voicePanel.style.display = 'none';
    if (voiceRecordBtn) voiceRecordBtn.classList.remove('is-active');
    if (speechRecognizer) {
        try { speechRecognizer.stop(); } catch (e) {}
        speechRecognizer = null;
    }
}

function startVoiceDictation(e) {
    if (!handleChatAttempt(e)) return;

    if (isDictating) {
        finishVoiceDictation();
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showCenterToast('Voice Dictation', 'Speech recognition is not supported in this browser.');
        return;
    }

    try {
        speechRecognizer = new SpeechRecognition();
    } catch (err) {
        showCenterToast('Voice Dictation', 'Could not initialize speech recognition.');
        return;
    }

    const currentVal = chatInput ? chatInput.value : '';
    dictationInitialText = currentVal ? (currentVal + (currentVal.endsWith(' ') ? '' : ' ')) : '';

    speechRecognizer.continuous = true;
    speechRecognizer.interimResults = true;
    speechRecognizer.lang = 'ru-RU';

    speechRecognizer.onresult = (ev) => {
        let fullTranscript = '';
        for (let i = 0; i < ev.results.length; ++i) {
            const piece = ev.results[i][0].transcript;
            if (!piece) continue;
            if (fullTranscript && !fullTranscript.endsWith(' ') && !piece.startsWith(' ')) {
                fullTranscript += ' ';
            }
            fullTranscript += piece;
        }
        const spoken = fullTranscript.trim();
        if (chatInput && spoken) {
            chatInput.value = dictationInitialText + spoken;
            chatInput.style.height = 'auto';
            chatInput.style.height = Math.min(chatInput.scrollHeight, 140) + 'px';
        }
    };

    speechRecognizer.onerror = (ev) => {
        if (ev.error === 'not-allowed') {
            showCenterToast('Microphone Access', 'Microphone permission was denied or is unavailable.');
        } else if (ev.error === 'no-speech') {
            return;
        } else if (ev.error !== 'aborted') {
            showCenterToast('Voice Dictation', 'Dictation error: ' + (ev.error || 'unknown'));
        }
        cleanupVoiceDictation();
    };

    speechRecognizer.onend = () => {
        if (isDictating) {
            cleanupVoiceDictation();
            if (chatInput) {
                chatInput.focus();
                chatInput.setSelectionRange(chatInput.value.length, chatInput.value.length);
            }
        }
    };

    try {
        speechRecognizer.start();
        isDictating = true;
        dictationStartTime = Date.now();
        if (voiceTimer) voiceTimer.textContent = '00:00';
        if (voicePanel) voicePanel.style.display = 'flex';
        if (voiceRecordBtn) voiceRecordBtn.classList.add('is-active');

        clearInterval(dictationTimerInterval);
        dictationTimerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - dictationStartTime) / 1000);
            const mins = Math.floor(elapsed / 60);
            const secs = elapsed % 60;
            if (voiceTimer) {
                voiceTimer.textContent = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
            }
        }, 500);
    } catch (startErr) {
        showCenterToast('Microphone Access', 'Unable to start speech recognition.');
        cleanupVoiceDictation();
    }
}

function cancelVoiceDictation() {
    if (chatInput) {
        chatInput.value = dictationInitialText.trim();
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 140) + 'px';
    }
    if (speechRecognizer) {
        try { speechRecognizer.abort(); } catch (e) {}
    }
    cleanupVoiceDictation();
    if (chatInput) chatInput.focus();
}

function finishVoiceDictation() {
    if (speechRecognizer) {
        try { speechRecognizer.stop(); } catch (e) {}
    }
    cleanupVoiceDictation();
    if (chatInput) {
        chatInput.focus();
        chatInput.setSelectionRange(chatInput.value.length, chatInput.value.length);
    }
}

if (voiceRecordBtn) voiceRecordBtn.addEventListener('click', startVoiceDictation);
if (voiceCancelBtn) voiceCancelBtn.addEventListener('click', cancelVoiceDictation);
if (voiceDoneBtn) voiceDoneBtn.addEventListener('click', finishVoiceDictation);

updateAuthUI();

const MODEL_BRAND_COLORS = {
    'Claude 5.5 Opus': { color: '#d97706', gradient: 'linear-gradient(90deg, #d97706, #ea580c)' },
    'Claude 5.5 Sonet': { color: '#f59e0b', gradient: 'linear-gradient(90deg, #f59e0b, #d97706)' },
    'Claude 5.1 Fable': { color: '#b45309', gradient: 'linear-gradient(90deg, #b45309, #92400e)' },
    'Gemini 4.0': { color: '#2563eb', gradient: 'linear-gradient(90deg, #2563eb, #3b82f6)' },
    'Gemini 3.8 Flash': { color: '#0284c7', gradient: 'linear-gradient(90deg, #0284c7, #38bdf8)' },
    'Chat GPT Astra 6.1': { color: '#059669', gradient: 'linear-gradient(90deg, #059669, #10b981)' },
    'Chat GPT Sol 5.6': { color: '#10b981', gradient: 'linear-gradient(90deg, #10b981, #34d399)' }
};

let telemetryState = {
    period: 'week',
    data: null
};

function formatCompactNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
}

function formatFullNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    return num.toLocaleString();
}

function generateFallbackTelemetry() {
    const models = [
        { model: 'Claude 5.5 Opus', vendor: 'Anthropic Frontier', wWeight: 0.35, mWeight: 0.33, yWeight: 0.31 },
        { model: 'Gemini 3.8 Flash', vendor: 'Google DeepMind', wWeight: 0.24, mWeight: 0.25, yWeight: 0.23 },
        { model: 'Chat GPT Astra 6.1', vendor: 'OpenAI Frontier', wWeight: 0.18, mWeight: 0.17, yWeight: 0.18 },
        { model: 'Claude 5.5 Sonet', vendor: 'Anthropic Frontier', wWeight: 0.10, mWeight: 0.11, yWeight: 0.12 },
        { model: 'Gemini 4.0', vendor: 'Google DeepMind', wWeight: 0.07, mWeight: 0.08, yWeight: 0.09 },
        { model: 'Chat GPT Sol 5.6', vendor: 'OpenAI Frontier', wWeight: 0.04, mWeight: 0.04, yWeight: 0.04 },
        { model: 'Claude 5.1 Fable', vendor: 'Anthropic Frontier', wWeight: 0.02, mWeight: 0.02, yWeight: 0.03 }
    ];

    function makePeriod(periodName, totalReqs, pointCount, labelFn) {
        const weightKey = periodName === 'week' ? 'wWeight' : (periodName === 'month' ? 'mWeight' : 'yWeight');
        const breakdown = models.map((m) => {
            const count = Math.round(totalReqs * m[weightKey]);
            return {
                model: m.model,
                vendor: m.vendor,
                count: count,
                percentage: +(m[weightKey] * 100).toFixed(1)
            };
        }).sort((a, b) => b.count - a.count);

        const timeline = [];
        const basePoint = totalReqs / pointCount;
        for (let i = 0; i < pointCount; i++) {
            const variance = 0.88 + Math.sin(i * 0.9) * 0.15 + (i / pointCount) * 0.18;
            const ptTotal = Math.round(basePoint * variance);
            timeline.push({
                label: labelFn(i, pointCount),
                date: 'P' + (i + 1),
                total: ptTotal,
                top_model: breakdown[0].model,
                top_count: Math.round(ptTotal * breakdown[0].percentage / 100)
            });
        }

        return {
            top_model: breakdown[0].model,
            top_vendor: breakdown[0].vendor,
            top_count: breakdown[0].count,
            top_percentage: breakdown[0].percentage,
            total_requests: totalReqs,
            breakdown: breakdown,
            timeline: timeline
        };
    }

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];

    return {
        week: makePeriod('week', 32480, 7, (i) => days[i % 7]),
        month: makePeriod('month', 142600, 15, (i) => `Day ${i * 2 + 1}`),
        year: makePeriod('year', 1845200, 12, (i) => months[i % 12])
    };
}

async function fetchTelemetryStats() {
    try {
        const res = await fetch(`${API_BASE}/api/telemetry/stats`);
        if (!res.ok) throw new Error('Bad response');
        const json = await res.json();
        if (json.ok && json.stats) {
            telemetryState.data = json.stats;
            renderTelemetry();
            return;
        }
    } catch (err) {}

    if (!telemetryState.data) {
        telemetryState.data = generateFallbackTelemetry();
        renderTelemetry();
    }
}

let telemetryAnimState = {
    rafId: null,
    renderedPoints: null,
    hasAnimatedInitial: false,
    lastTotal: 0,
    observer: null
};

function buildSmoothLinePath(pts) {
    if (!pts || pts.length === 0) return '';
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        const cpX = (p0.x + p1.x) / 2;
        d += ` C ${cpX.toFixed(1)} ${p0.y.toFixed(1)}, ${cpX.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }
    return d;
}

function buildSmoothAreaPath(pts, baseBottom) {
    if (!pts || pts.length === 0) return '';
    const lineD = buildSmoothLinePath(pts);
    return `${lineD} L ${pts[pts.length - 1].x.toFixed(1)} ${baseBottom.toFixed(1)} L ${pts[0].x.toFixed(1)} ${baseBottom.toFixed(1)} Z`;
}

function animateNumberValue(el, startVal, endVal, duration, suffix = '') {
    if (!el) return;
    const startTime = performance.now();
    function tick(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(startVal + (endVal - startVal) * ease);
        el.textContent = formatFullNumber(current) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

function renderTelemetry() {
    if (!telemetryState.data) return;
    const current = telemetryState.data[telemetryState.period];
    if (!current) return;

    const leaderNameEl = document.getElementById('analyticsLeaderName');
    const leaderShareEl = document.getElementById('analyticsLeaderShare');
    const totalRequestsEl = document.getElementById('analyticsTotalRequests');

    if (leaderNameEl) leaderNameEl.textContent = current.top_model || 'Claude 5.5 Opus';
    if (leaderShareEl) leaderShareEl.textContent = (current.top_percentage || 0) + '%';
    if (totalRequestsEl) {
        const startVal = telemetryAnimState.lastTotal || current.total_requests;
        animateNumberValue(totalRequestsEl, startVal, current.total_requests, 420, ' queries');
        telemetryAnimState.lastTotal = current.total_requests;
    }

    renderTelemetryChart(current.timeline || []);
    renderTelemetryDistribution(current.breakdown || []);
}

function renderTelemetryChart(timeline) {
    const svg = document.getElementById('analyticsChartSvg');
    const tooltip = document.getElementById('analyticsTooltip');
    const wrapper = document.getElementById('analyticsChartWrapper');
    if (!svg || !timeline || timeline.length === 0) return;

    if (telemetryAnimState.rafId) {
        cancelAnimationFrame(telemetryAnimState.rafId);
        telemetryAnimState.rafId = null;
    }

    const width = Math.max(300, Math.round(wrapper.getBoundingClientRect().width || wrapper.clientWidth || 680));
    const height = 190;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const padL = 44;
    const padR = 20;
    const padT = 16;
    const padB = 32;

    const plotW = width - padL - padR;
    const plotH = height - padT - padB;
    const baseBottom = padT + plotH;

    const values = timeline.map((pt) => pt.total || 0);
    const maxVal = Math.max(...values, 100);
    const minVal = 0;

    const targetPts = timeline.map((pt, i) => {
        const x = padL + (i / Math.max(1, timeline.length - 1)) * plotW;
        const norm = (pt.total - minVal) / Math.max(1, maxVal - minVal);
        const y = padT + plotH - norm * plotH;
        return { x, y, pt };
    });

    const prevPts = telemetryAnimState.renderedPoints;
    const isInitial = !telemetryAnimState.hasAnimatedInitial || !prevPts || prevPts.length === 0;

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    const clip = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clip.setAttribute('id', 'telemetryDrawClip');
    const clipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    clipRect.setAttribute('x', '0');
    clipRect.setAttribute('y', '0');
    clipRect.setAttribute('width', isInitial ? '0' : String(width + 50));
    clipRect.setAttribute('height', String(height));
    clip.appendChild(clipRect);
    defs.appendChild(clip);

    const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.setAttribute('id', 'telemetryAreaGrad');
    grad.setAttribute('x1', '0');
    grad.setAttribute('y1', '0');
    grad.setAttribute('x2', '0');
    grad.setAttribute('y2', '1');

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#111111');
    stop1.setAttribute('stop-opacity', '0.07');

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#111111');
    stop2.setAttribute('stop-opacity', '0.00');

    grad.appendChild(stop1);
    grad.appendChild(stop2);
    defs.appendChild(grad);
    svg.appendChild(defs);

    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const gridSteps = 3;
    for (let i = 0; i <= gridSteps; i++) {
        const y = padT + (plotH / gridSteps) * i;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', String(padL));
        line.setAttribute('y1', String(y));
        line.setAttribute('x2', String(width - padR));
        line.setAttribute('y2', String(y));
        line.setAttribute('stroke', 'rgba(0, 0, 0, 0.04)');
        line.setAttribute('stroke-width', '1');
        line.setAttribute('stroke-dasharray', i === gridSteps ? 'none' : '2 3');
        gridGroup.appendChild(line);

        const valAtGrid = Math.round(maxVal - (maxVal / gridSteps) * i);
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', String(padL - 8));
        label.setAttribute('y', String(y + 3));
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('font-size', '11');
        label.setAttribute('fill', '#a1a1aa');
        label.setAttribute('font-family', 'inherit');
        label.textContent = formatCompactNumber(valAtGrid);
        gridGroup.appendChild(label);
    }
    svg.appendChild(gridGroup);

    const chartClippedGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    chartClippedGroup.setAttribute('clip-path', 'url(#telemetryDrawClip)');

    const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    areaPath.setAttribute('fill', 'url(#telemetryAreaGrad)');
    chartClippedGroup.appendChild(areaPath);

    const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    linePath.setAttribute('fill', 'none');
    linePath.setAttribute('stroke', '#111111');
    linePath.setAttribute('stroke-width', '1.8');
    linePath.setAttribute('stroke-linecap', 'round');
    linePath.setAttribute('stroke-linejoin', 'round');
    chartClippedGroup.appendChild(linePath);

    svg.appendChild(chartClippedGroup);

    const labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const maxLabels = timeline.length <= 12 ? timeline.length : 8;
    const step = Math.ceil(timeline.length / maxLabels);

    targetPts.forEach((p, idx) => {
        if (idx % step === 0 || idx === targetPts.length - 1) {
            const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            txt.setAttribute('x', String(p.x));
            txt.setAttribute('y', String(height - 10));
            txt.setAttribute('text-anchor', 'middle');
            txt.setAttribute('font-size', '11');
            txt.setAttribute('fill', '#8e8e93');
            txt.setAttribute('font-family', 'inherit');
            txt.textContent = p.pt.label || '';
            labelsGroup.appendChild(txt);
        }
    });
    svg.appendChild(labelsGroup);

    const interactiveGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const crosshair = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    crosshair.setAttribute('stroke', 'rgba(0, 0, 0, 0.2)');
    crosshair.setAttribute('stroke-width', '1');
    crosshair.setAttribute('stroke-dasharray', '2 2');
    crosshair.style.opacity = '0';
    interactiveGroup.appendChild(crosshair);

    const highlightCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    highlightCircle.setAttribute('r', '4');
    highlightCircle.setAttribute('fill', '#111111');
    highlightCircle.setAttribute('stroke', '#ffffff');
    highlightCircle.setAttribute('stroke-width', '2');
    highlightCircle.style.opacity = '0';
    interactiveGroup.appendChild(highlightCircle);
    svg.appendChild(interactiveGroup);

    if (isInitial) {
        linePath.setAttribute('d', buildSmoothLinePath(targetPts));
        areaPath.setAttribute('d', buildSmoothAreaPath(targetPts, baseBottom));
        areaPath.style.opacity = '0';

        const rider = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        rider.setAttribute('r', '4');
        rider.setAttribute('fill', '#111111');
        rider.setAttribute('stroke', '#ffffff');
        rider.setAttribute('stroke-width', '2');
        rider.setAttribute('cx', String(targetPts[0].x));
        rider.setAttribute('cy', String(targetPts[0].y));
        rider.style.filter = 'drop-shadow(0 2px 5px rgba(0,0,0,0.25))';
        rider.style.opacity = '0';
        svg.appendChild(rider);

        function startInitialAnimation() {
            if (telemetryAnimState.hasAnimatedInitial) return;
            telemetryAnimState.hasAnimatedInitial = true;
            rider.style.opacity = '1';

            const duration = 1250;
            const startTime = performance.now();

            function drawStep(now) {
                const elapsed = now - startTime;
                const progress = Math.min(1, elapsed / duration);
                const ease = 1 - Math.pow(1 - progress, 2.5);

                const currentX = padL + ease * plotW;
                const prevIdx = ease * (targetPts.length - 1);
                const idx0 = Math.floor(prevIdx);
                const idx1 = Math.min(targetPts.length - 1, Math.ceil(prevIdx));
                const frac = prevIdx - idx0;
                const currentY = targetPts[idx0].y + (targetPts[idx1].y - targetPts[idx0].y) * frac;

                clipRect.setAttribute('width', String(currentX));
                rider.setAttribute('cx', String(currentX));
                rider.setAttribute('cy', String(currentY));

                if (ease < 0.6) {
                    areaPath.style.opacity = '0';
                } else {
                    const factor = (ease - 0.6) / 0.4;
                    areaPath.style.opacity = String((factor * factor).toFixed(3));
                }

                if (progress < 1) {
                    telemetryAnimState.rafId = requestAnimationFrame(drawStep);
                } else {
                    clipRect.setAttribute('width', String(width + 50));
                    areaPath.style.transition = 'opacity 0.45s ease';
                    areaPath.style.opacity = '1';
                    rider.style.transition = 'opacity 0.3s ease';
                    rider.style.opacity = '0';
                    setTimeout(() => {
                        if (rider.parentNode) rider.parentNode.removeChild(rider);
                    }, 350);
                    telemetryAnimState.renderedPoints = targetPts;
                    telemetryAnimState.rafId = null;
                }
            }

            telemetryAnimState.rafId = requestAnimationFrame(drawStep);
        }

        if ('IntersectionObserver' in window && wrapper) {
            if (telemetryAnimState.observer) {
                telemetryAnimState.observer.disconnect();
            }
            telemetryAnimState.observer = new IntersectionObserver((entries) => {
                if (entries[0] && entries[0].isIntersecting) {
                    telemetryAnimState.observer.disconnect();
                    telemetryAnimState.observer = null;
                    setTimeout(startInitialAnimation, 120);
                }
            }, { threshold: 0.15 });
            telemetryAnimState.observer.observe(wrapper);
        } else {
            setTimeout(startInitialAnimation, 180);
        }
    } else {
        areaPath.style.opacity = '1';
        areaPath.style.transition = 'none';
        clipRect.setAttribute('width', String(width + 50));
        const startYs = targetPts.map((tp) => {
            const u = Math.max(0, Math.min(1, (tp.x - padL) / plotW));
            const prevIdx = u * (prevPts.length - 1);
            const idx0 = Math.floor(prevIdx);
            const idx1 = Math.min(prevPts.length - 1, Math.ceil(prevIdx));
            const frac = prevIdx - idx0;
            return prevPts[idx0].y + (prevPts[idx1].y - prevPts[idx0].y) * frac;
        });

        const duration = 440;
        const startTime = performance.now();

        function morphStep(now) {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            const ease = 1 - Math.pow(1 - progress, 3);

            const framePts = targetPts.map((tp, idx) => ({
                x: tp.x,
                y: startYs[idx] + (tp.y - startYs[idx]) * ease,
                pt: tp.pt
            }));

            linePath.setAttribute('d', buildSmoothLinePath(framePts));
            areaPath.setAttribute('d', buildSmoothAreaPath(framePts, baseBottom));

            if (progress < 1) {
                telemetryAnimState.rafId = requestAnimationFrame(morphStep);
            } else {
                telemetryAnimState.renderedPoints = targetPts;
                telemetryAnimState.rafId = null;
                linePath.setAttribute('d', buildSmoothLinePath(targetPts));
                areaPath.setAttribute('d', buildSmoothAreaPath(targetPts, baseBottom));
            }
        }

        telemetryAnimState.rafId = requestAnimationFrame(morphStep);
    }

    if (wrapper && tooltip) {
        function handlePointer(clientX, clientY) {
            const activePts = telemetryAnimState.renderedPoints || targetPts;
            const rect = svg.getBoundingClientRect();
            const posX = clientX - rect.left;

            let closest = activePts[0];
            let minDist = Math.abs(activePts[0].x - posX);
            for (let i = 1; i < activePts.length; i++) {
                const dist = Math.abs(activePts[i].x - posX);
                if (dist < minDist) {
                    minDist = dist;
                    closest = activePts[i];
                }
            }

            crosshair.setAttribute('x1', String(closest.x));
            crosshair.setAttribute('y1', String(padT));
            crosshair.setAttribute('x2', String(closest.x));
            crosshair.setAttribute('y2', String(padT + plotH));
            crosshair.style.opacity = '1';

            highlightCircle.setAttribute('cx', String(closest.x));
            highlightCircle.setAttribute('cy', String(closest.y));
            highlightCircle.style.opacity = '1';

            tooltip.innerHTML = `
                <div class="stats__tooltip-date">${closest.pt.label || closest.pt.date || ''}</div>
                <div class="stats__tooltip-val">${formatFullNumber(closest.pt.total)} queries</div>
            `;
            tooltip.style.left = `${closest.x}px`;
            tooltip.style.top = `${closest.y}px`;
            tooltip.classList.add('is-visible');
        }

        wrapper.onmousemove = (e) => handlePointer(e.clientX, e.clientY);
        wrapper.ontouchmove = (e) => {
            if (e.touches && e.touches[0]) {
                handlePointer(e.touches[0].clientX, e.touches[0].clientY);
            }
        };

        wrapper.onmouseleave = () => {
            crosshair.style.opacity = '0';
            highlightCircle.style.opacity = '0';
            tooltip.classList.remove('is-visible');
        };
        wrapper.ontouchend = () => {
            crosshair.style.opacity = '0';
            highlightCircle.style.opacity = '0';
            tooltip.classList.remove('is-visible');
        };
    }
}

function renderTelemetryDistribution(breakdown) {
    const list = document.getElementById('analyticsDistList');
    if (!list) return;
    list.innerHTML = '';

    breakdown.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'stats__row';

        row.innerHTML = `
            <span class="stats__row-name" title="${item.model}">${item.model}</span>
            <div class="stats__row-track">
                <div class="stats__row-fill" style="width: ${Math.max(2, item.percentage)}%;"></div>
            </div>
            <div class="stats__row-meta">
                <span class="stats__row-pct">${item.percentage}%</span>
                <span class="stats__row-cnt">${formatCompactNumber(item.count)}</span>
            </div>
        `;
        list.appendChild(row);
    });
}

function initTelemetryControls() {
    const btns = document.querySelectorAll('.stats__tab');
    btns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const p = btn.dataset.period;
            if (!p || p === telemetryState.period) return;
            btns.forEach((b) => {
                const active = b === btn;
                b.classList.toggle('is-active', active);
                b.setAttribute('aria-selected', active ? 'true' : 'false');
            });
            telemetryState.period = p;
            renderTelemetry();
        });
    });

    window.addEventListener('resize', () => {
        if (telemetryState.data) {
            const current = telemetryState.data[telemetryState.period];
            if (current) renderTelemetryChart(current.timeline || []);
        }
    });

    fetchTelemetryStats();
    setInterval(fetchTelemetryStats, 30000);
}

initTelemetryControls();

function initProductsCarousel() {
    const grid = document.querySelector('.products__grid');
    const dots = document.querySelectorAll('.products__dot');
    if (!grid || !dots.length) return;

    const cards = Array.from(grid.querySelectorAll('.product-card'));
    dots.forEach((dot) => {
        dot.addEventListener('click', () => {
            const idx = parseInt(dot.dataset.index, 10);
            if (cards[idx]) {
                cards[idx].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
            }
        });
    });

    let ticking = false;
    grid.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const gridRect = grid.getBoundingClientRect();
            let activeIdx = 0;
            let minDiff = Infinity;
            cards.forEach((card, idx) => {
                const cardRect = card.getBoundingClientRect();
                const diff = Math.abs(cardRect.left - gridRect.left);
                if (diff < minDiff) {
                    minDiff = diff;
                    activeIdx = idx;
                }
            });
            dots.forEach((d, idx) => {
                d.classList.toggle('is-active', idx === activeIdx);
            });
            ticking = false;
        });
    }, { passive: true });
}

initProductsCarousel();
