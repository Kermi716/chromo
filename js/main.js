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
const navProducts = document.getElementById('navProducts');
const navAbout = document.getElementById('navAbout');
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

        if (href === '#products' && productsSection) {
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
    if (isClickScrolling || !productsSection || !navHome) return;

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
    chatInput.addEventListener('focus', (e) => {
        if (!getCurrentUser()) {
            handleChatAttempt(e);
        }
    });

    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!handleChatAttempt(e)) return;
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
        if (!handleChatAttempt(e)) return;

        const text = chatInput ? chatInput.value.trim() : '';
        if (text !== '') {
            const activeModel = currentModel ? currentModel.textContent.trim() : 'Gemini 3.8 Flash';
            localStorage.setItem('chromo_selected_model', activeModel);
            sessionStorage.setItem('chromo_pending_prompt', JSON.stringify({
                prompt: text,
                model: activeModel
            }));
            window.location.href = 'chat/';
        } else {
            showCenterToast('Empty Message', 'Please enter a prompt or use voice dictation.');
        }
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
