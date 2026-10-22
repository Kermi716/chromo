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

const headerAccountBtn = document.getElementById('headerAccountBtn');
const accountPopover = document.getElementById('accountPopover');
const accountUserName = document.getElementById('accountUserName');
const signOutBtn = document.getElementById('signOutBtn');

const sidebarUserName = document.getElementById('sidebarUserName');
const sidebarUserStatus = document.getElementById('sidebarUserStatus');
const chatGuestBanner = document.getElementById('chatGuestBanner');

function getCurrentUser() {
    const user = localStorage.getItem('chromo_user');
    return user && user.trim() ? user.trim() : null;
}

function sendChatTelemetry(modelName, latencyMs) {
    const user = getCurrentUser();
    fetch(`${API_BASE}/api/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: modelName,
            username: user,
            latency_ms: Math.round(latencyMs || 0),
            timestamp: Date.now()
        }),
        keepalive: true
    }).catch(() => {});
}

const MODEL_TIERS = {
    'Gemini 3.8 Flash': 'Free',
    'Chat GPT Sol 5.6': 'Free',
    'Gemini 4.0': 'Spark',
    'Chat GPT Astra 6.1': 'Pulse',
    'Claude 5.5 Sonnet': 'Pulse',
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

    const activeModel = currentModel ? currentModel.textContent.trim() : 'Gemini 3.8 Flash';
    if (!isModelAccessible(activeModel, plan)) {
        const fallback = 'Gemini 3.8 Flash';
        if (currentModel) currentModel.textContent = fallback;
        items.forEach((item) => {
            item.classList.toggle('is-selected', item.dataset.model === fallback);
        });
        const user = getCurrentUser();
        if (chatInput) {
            chatInput.placeholder = user ? ('Message ' + fallback + '...') : ('Sign in to message ' + fallback + '...');
        }
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
            if (planEl) {
                planEl.textContent = data.subscription;
            }
            const tierText = document.querySelector('.account-popover__tier-text');
            if (tierText) {
                tierText.textContent = data.subscription + ' Member';
            }
            if (sidebarUserStatus) {
                sidebarUserStatus.innerHTML = '<span class="chat-sidebar__sub-label">Subscription:</span> <span class="chat-sidebar__sub-val">' + data.subscription + '</span>';
            }
            updateModelSelectPermissions();
        }
        fetchAndRenderLimits();
    } catch (e) { }
}

async function fetchAndRenderLimits() {
    const user = getCurrentUser();
    const limitsPlanName = document.getElementById('limitsPlanName');
    const limitsPlanBadge = document.getElementById('limitsPlanBadge');
    const limitsDailyStat = document.getElementById('limitsDailyStat');
    const limitsMainBar = document.getElementById('limitsMainBar');
    const limitsRemaining = document.getElementById('limitsRemaining');
    const limitsPercent = document.getElementById('limitsPercent');
    const limitsHeavyCard = document.getElementById('limitsHeavyCard');
    const limitsHeavyStat = document.getElementById('limitsHeavyStat');
    const limitsHeavyTrack = document.getElementById('limitsHeavyTrack');
    const limitsHeavyBar = document.getElementById('limitsHeavyBar');
    const limitsHeavyDesc = document.getElementById('limitsHeavyDesc');
    const limitsHeavyPct = document.getElementById('limitsHeavyPct');
    const limitsResetTime = document.getElementById('limitsResetTime');
    const limitsUpgradeCard = document.getElementById('limitsUpgradeCard');
    const popoverLimitsStat = document.getElementById('popoverLimitsStat');
    const popoverLimitsBar = document.getElementById('popoverLimitsBar');

    if (!user) {
        if (limitsPlanName) limitsPlanName.textContent = 'Guest';
        if (limitsPlanBadge) limitsPlanBadge.textContent = 'Not Signed In';
        if (limitsDailyStat) limitsDailyStat.textContent = '0 / 0';
        if (limitsMainBar) limitsMainBar.style.width = '0%';
        if (limitsRemaining) limitsRemaining.textContent = 'Sign in to view limits';
        if (limitsPercent) limitsPercent.textContent = '0%';
        if (limitsHeavyCard) limitsHeavyCard.style.display = 'none';
        if (limitsResetTime) limitsResetTime.textContent = 'Inactive';
        if (popoverLimitsStat) popoverLimitsStat.textContent = '0 / 0';
        if (popoverLimitsBar) popoverLimitsBar.style.width = '0%';
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/limits?username=${encodeURIComponent(user)}`);
        const data = await res.json();
        if (data.ok) {
            const plan = data.subscription || 'Free';
            localStorage.setItem('chromo_sub', plan);

            if (limitsPlanName) limitsPlanName.textContent = plan + ' Plan';
            if (limitsPlanBadge) {
                limitsPlanBadge.textContent = 'Active';
                limitsPlanBadge.classList.remove('limits-card__plan-badge--unlimited');
            }

            if (data.is_unlimited) {
                if (limitsDailyStat) limitsDailyStat.textContent = 'Unlimited';
                if (limitsMainBar) limitsMainBar.style.width = '100%';
                if (limitsRemaining) limitsRemaining.textContent = 'Unlimited messages';
                if (limitsPercent) limitsPercent.textContent = '100%';
                if (popoverLimitsStat) popoverLimitsStat.textContent = 'Unlimited';
                if (popoverLimitsBar) popoverLimitsBar.style.width = '100%';

                if (limitsHeavyCard) limitsHeavyCard.style.display = 'none';
                if (limitsResetTime) limitsResetTime.textContent = 'Zero limit tier';
                if (limitsUpgradeCard) limitsUpgradeCard.style.display = 'none';
            } else {
                const used = data.used || 0;
                const max = data.max || 5;
                const pct = Math.min(100, Math.max(0, data.percentage || 0));
                const remaining = data.remaining != null ? data.remaining : (max - used);

                if (limitsDailyStat) limitsDailyStat.textContent = used + ' / ' + max;
                if (limitsMainBar) limitsMainBar.style.width = pct + '%';
                if (limitsRemaining) limitsRemaining.textContent = remaining + ' remaining today';
                if (limitsPercent) limitsPercent.textContent = pct + '%';
                if (popoverLimitsStat) popoverLimitsStat.textContent = used + ' / ' + max;
                if (popoverLimitsBar) popoverLimitsBar.style.width = pct + '%';

                if (data.heavy_max && data.heavy_max > 0) {
                    const hUsed = data.heavy_used || 0;
                    const hMax = data.heavy_max;
                    const hPct = Math.min(100, Math.max(0, data.heavy_percentage || 0));
                    const hRem = data.heavy_remaining != null ? data.heavy_remaining : (hMax - hUsed);

                    if (limitsHeavyCard) limitsHeavyCard.style.display = 'flex';
                    if (limitsHeavyStat) limitsHeavyStat.textContent = hUsed + ' / ' + hMax;
                    if (limitsHeavyTrack) limitsHeavyTrack.style.display = 'block';
                    if (limitsHeavyBar) limitsHeavyBar.style.width = hPct + '%';
                    if (limitsHeavyDesc) limitsHeavyDesc.textContent = hRem + ' remaining today';
                    if (limitsHeavyPct) {
                        limitsHeavyPct.style.display = 'inline';
                        limitsHeavyPct.textContent = hPct + '%';
                    }
                } else {
                    if (limitsHeavyCard) limitsHeavyCard.style.display = 'none';
                }

                if (limitsResetTime) limitsResetTime.textContent = data.resets_in ? ('in ' + data.resets_in) : 'in 24 hours';
                if (limitsUpgradeCard) {
                    limitsUpgradeCard.style.display = (plan === 'Apex' || plan === 'Nova') ? 'none' : 'flex';
                }
            }

            const planEl = document.getElementById('accountUserPlan');
            if (planEl) planEl.textContent = plan;
            if (sidebarUserStatus) {
                sidebarUserStatus.innerHTML = '<span class="chat-sidebar__sub-label">Subscription:</span> <span class="chat-sidebar__sub-val">' + plan + '</span>';
            }
        }
    } catch (e) { }
}

function updateAuthUI() {
    const user = getCurrentUser();
    const activeModel = currentModel ? currentModel.textContent.trim() : 'Gemini 3.8 Flash';
    const sub = localStorage.getItem('chromo_sub') || 'Free';

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
        const planEl = document.getElementById('accountUserPlan');
        if (planEl) {
            planEl.textContent = sub;
        }
        const tierText = document.querySelector('.account-popover__tier-text');
        if (tierText) {
            tierText.textContent = sub + ' Member';
        }
        if (sidebarUserName) {
            sidebarUserName.textContent = user;
        }
        if (sidebarUserStatus) {
            sidebarUserStatus.innerHTML = '<span class="chat-sidebar__sub-label">Subscription:</span> <span class="chat-sidebar__sub-val">' + sub + '</span>';
        }
        if (chatGuestBanner) {
            chatGuestBanner.classList.add('is-hidden');
        }
        if (chatInput) {
            chatInput.placeholder = 'Message ' + activeModel + '...';
        }
        syncUserProfile();
        updateModelSelectPermissions();
        fetchAndRenderLimits();
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
        if (sidebarUserName) {
            sidebarUserName.textContent = 'Guest Mode';
        }
        if (sidebarUserStatus) {
            sidebarUserStatus.textContent = 'Not signed in';
        }
        if (chatGuestBanner) {
            chatGuestBanner.classList.remove('is-hidden');
        }
        if (chatInput) {
            chatInput.placeholder = 'Sign in to message ' + activeModel + '...';
        }
        updateModelSelectPermissions();
        fetchAndRenderLimits();
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
            authModalPrimaryBtn.textContent = getCurrentUser() ? 'Upgrade Subscription' : 'Sign In or Register';
        }
        if (btnHref) {
            authModalPrimaryBtn.href = btnHref;
        } else {
            authModalPrimaryBtn.href = getCurrentUser() ? '../#products' : '../reg/';
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
    document.body.style.overflow = '';
}

if (authModalClose) authModalClose.addEventListener('click', closeAuthModal);
if (authModalBackdrop) authModalBackdrop.addEventListener('click', closeAuthModal);
if (authModalCancelBtn) authModalCancelBtn.addEventListener('click', closeAuthModal);

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

const modelSelect = document.getElementById('modelSelect');
const modelBtn = document.getElementById('modelBtn');
const currentModel = document.getElementById('currentModel');
const modelItems = document.querySelectorAll('.model-select__item');

function setSelectedModel(modelName, persist = true) {
    if (!modelName) return;
    const plan = localStorage.getItem('chromo_sub') || 'Free';
    if (!isModelAccessible(modelName, plan)) return;

    if (persist) {
        localStorage.setItem('chromo_selected_model', modelName);
    }

    if (currentModel) currentModel.textContent = modelName;
    modelItems.forEach((item) => {
        item.classList.toggle('is-selected', item.dataset.model === modelName);
    });

    const user = getCurrentUser();
    const inputEl = document.getElementById('chatInput');
    if (inputEl) {
        inputEl.placeholder = user ? ('Message ' + modelName + '...') : ('Sign in to message ' + modelName + '...');
    }
}

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

            setSelectedModel(selectedModel, true);

            if (activeChatId) {
                let chats = loadStoredChats();
                const currentChat = chats.find((c) => c.id === activeChatId);
                if (currentChat) {
                    currentChat.model = selectedModel;
                    saveStoredChats(chats);
                    renderHistoryList();
                }
            }

            modelSelect.classList.remove('is-open');
            modelBtn.setAttribute('aria-expanded', 'false');
            focusChatInput();
        });
    });

    document.addEventListener('click', (e) => {
        if (!modelSelect.contains(e.target)) {
            modelSelect.classList.remove('is-open');
            modelBtn.setAttribute('aria-expanded', 'false');
        }
    });
}

const chatSidebar = document.getElementById('chatSidebar');
const sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');
const sidebarOpenBtn = document.getElementById('sidebarOpenBtn');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const newChatSidebarBtn = document.getElementById('newChatSidebarBtn');
const tabChatsBtn = document.getElementById('tabChatsBtn');
const tabLimitsBtn = document.getElementById('tabLimitsBtn');
const sidebarChatsPane = document.getElementById('sidebarChatsPane');
const sidebarLimitsPane = document.getElementById('sidebarLimitsPane');
const openLimitsFromPopover = document.getElementById('openLimitsFromPopover');

function switchSidebarTab(tabName) {
    if (tabName === 'limits') {
        if (tabChatsBtn) {
            tabChatsBtn.classList.remove('is-active');
            tabChatsBtn.setAttribute('aria-selected', 'false');
        }
        if (tabLimitsBtn) {
            tabLimitsBtn.classList.add('is-active');
            tabLimitsBtn.setAttribute('aria-selected', 'true');
        }
        if (sidebarChatsPane) sidebarChatsPane.style.display = 'none';
        if (sidebarLimitsPane) sidebarLimitsPane.style.display = 'flex';
        fetchAndRenderLimits();
    } else {
        if (tabLimitsBtn) {
            tabLimitsBtn.classList.remove('is-active');
            tabLimitsBtn.setAttribute('aria-selected', 'false');
        }
        if (tabChatsBtn) {
            tabChatsBtn.classList.add('is-active');
            tabChatsBtn.setAttribute('aria-selected', 'true');
        }
        if (sidebarLimitsPane) sidebarLimitsPane.style.display = 'none';
        if (sidebarChatsPane) sidebarChatsPane.style.display = 'flex';
    }
}

if (tabChatsBtn) {
    tabChatsBtn.addEventListener('click', () => switchSidebarTab('chats'));
}

if (tabLimitsBtn) {
    tabLimitsBtn.addEventListener('click', () => switchSidebarTab('limits'));
}

if (openLimitsFromPopover) {
    openLimitsFromPopover.addEventListener('click', () => {
        if (accountPopover) {
            accountPopover.classList.remove('is-open');
            accountPopover.setAttribute('aria-hidden', 'true');
        }
        if (chatSidebar && chatSidebar.classList.contains('is-collapsed')) {
            chatSidebar.classList.remove('is-collapsed');
        }
        if (window.innerWidth <= 860 && chatSidebar) {
            chatSidebar.classList.add('is-open');
            if (sidebarOverlay) sidebarOverlay.classList.add('is-visible');
        }
        switchSidebarTab('limits');
    });
}

function toggleSidebar() {
    if (!chatSidebar) return;
    const isMobile = window.innerWidth <= 860;

    if (isMobile) {
        const isOpen = chatSidebar.classList.toggle('is-open');
        if (sidebarOverlay) sidebarOverlay.classList.toggle('is-visible', isOpen);
    } else {
        chatSidebar.classList.toggle('is-collapsed');
    }
}

function closeMobileSidebar() {
    if (!chatSidebar) return;
    chatSidebar.classList.remove('is-open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('is-visible');
}

if (sidebarCollapseBtn) {
    sidebarCollapseBtn.addEventListener('click', () => {
        const isMobile = window.innerWidth <= 860;
        if (isMobile) {
            closeMobileSidebar();
        } else {
            chatSidebar.classList.add('is-collapsed');
        }
    });
}
if (sidebarOpenBtn) {
    sidebarOpenBtn.addEventListener('click', () => {
        const isMobile = window.innerWidth <= 860;
        if (isMobile) {
            chatSidebar.classList.add('is-open');
            if (sidebarOverlay) sidebarOverlay.classList.add('is-visible');
        } else {
            chatSidebar.classList.remove('is-collapsed');
        }
    });
}
if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeMobileSidebar);

let activeChatId = null;

function loadStoredChats() {
    try {
        const stored = localStorage.getItem('chromo_chats');
        const chats = stored ? JSON.parse(stored) : [];
        let modified = false;
        chats.forEach((chat) => {
            if (Array.isArray(chat.messages) && chat.messages.length > 0) {
                for (let i = chat.messages.length - 1; i >= 0; i--) {
                    if (chat.messages[i].role === 'assistant' && chat.messages[i].model) {
                        if (chat.model !== chat.messages[i].model) {
                            chat.model = chat.messages[i].model;
                            modified = true;
                        }
                        break;
                    }
                }
            }
        });
        if (modified) {
            saveStoredChats(chats);
        }
        return chats;
    } catch (e) {
        return [];
    }
}

function saveStoredChats(chats) {
    try {
        localStorage.setItem('chromo_chats', JSON.stringify(chats));
    } catch (e) { }
}

function renderHistoryList() {
    if (!historyList) return;
    historyList.innerHTML = '';

    const chats = loadStoredChats();

    if (chats.length === 0) {
        const tip = document.createElement('div');
        tip.className = 'chat-sidebar__empty-tip';
        tip.textContent = 'No past conversations yet.';
        historyList.appendChild(tip);
        return;
    }

    chats.forEach((chat) => {
        const item = document.createElement('div');
        item.className = 'chat-history-item' + (chat.id === activeChatId ? ' is-active' : '');

        const body = document.createElement('div');
        body.className = 'chat-history-item__body';

        const title = document.createElement('span');
        title.className = 'chat-history-item__title';
        title.textContent = chat.title || 'Conversation';

        const meta = document.createElement('span');
        meta.className = 'chat-history-item__meta';
        meta.textContent = (chat.model || 'Chromo') + ' : ' + (chat.date || 'Today');

        body.appendChild(title);
        body.appendChild(meta);

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'chat-history-item__delete';
        deleteBtn.setAttribute('aria-label', 'Delete conversation');

        const delIcon = document.createElement('img');
        delIcon.src = '../assets/pictures/kr.png';
        delIcon.alt = '';
        deleteBtn.appendChild(delIcon);

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteChat(chat.id);
        });

        item.appendChild(body);
        item.appendChild(deleteBtn);

        item.addEventListener('click', () => {
            openChat(chat.id);
            closeMobileSidebar();
        });

        historyList.appendChild(item);
    });
}

function startNewChat() {
    activeChatId = null;
    switchSidebarTab('chats');
    const savedModel = localStorage.getItem('chromo_selected_model');
    if (savedModel) {
        setSelectedModel(savedModel, false);
    }
    if (chatEmptyState) chatEmptyState.classList.remove('is-hidden');
    if (chatFeed) chatFeed.innerHTML = '';
    renderHistoryList();
    closeMobileSidebar();
    focusChatInput();
}

function openChat(id) {
    const chats = loadStoredChats();
    const chat = chats.find((c) => c.id === id);
    if (!chat) return;

    activeChatId = id;
    switchSidebarTab('chats');
    if (chat.model) {
        setSelectedModel(chat.model, false);
    }
    if (chatEmptyState) chatEmptyState.classList.add('is-hidden');
    if (chatFeed) {
        chatFeed.innerHTML = '';
        chat.messages.forEach((msg) => {
            renderMessageBubble(msg.role, msg.text, msg.model, msg.files);
        });
        scrollToBottom();
    }
    renderHistoryList();
    focusChatInput();
}

function deleteChat(id) {
    let chats = loadStoredChats();
    chats = chats.filter((c) => c.id !== id);
    saveStoredChats(chats);

    if (activeChatId === id) {
        startNewChat();
    } else {
        renderHistoryList();
    }
}

if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
        saveStoredChats([]);
        startNewChat();
    });
}

if (newChatSidebarBtn) newChatSidebarBtn.addEventListener('click', startNewChat);

const chatFeed = document.getElementById('chatFeed');
const chatEmptyState = document.getElementById('chatEmptyState');
const chatMessages = document.getElementById('chatMessages');

function scrollToBottom() {
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

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

function isAudioFile(name) {
    if (!name || typeof name !== 'string') return false;
    const lower = name.toLowerCase();
    return lower.endsWith('.webm') || lower.endsWith('.ogg') || lower.endsWith('.wav') || lower.endsWith('.mp3') || lower.endsWith('.m4a');
}

function formatDuration(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds || 0));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
}

function renderVoiceCard(fileItem) {
    const card = document.createElement('div');
    card.className = 'chat-msg__voice-card';

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'chat-msg__voice-play';
    playBtn.setAttribute('aria-label', 'Play voice message');

    const playIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    playIcon.setAttribute('viewBox', '0 0 24 24');
    playIcon.setAttribute('fill', 'currentColor');
    playIcon.innerHTML = '<polygon points="7 4 19 12 7 20 7 4"></polygon>';
    playBtn.appendChild(playIcon);

    const track = document.createElement('div');
    track.className = 'chat-msg__voice-track';

    const wave = document.createElement('div');
    wave.className = 'chat-msg__voice-waveform';
    const barHeights = [8, 12, 16, 10, 14, 18, 12, 8, 14, 16, 12, 10, 16, 18, 14, 8, 12, 16, 14, 10, 18, 16, 12, 8];
    const bars = [];
    barHeights.forEach((h) => {
        const bar = document.createElement('span');
        bar.className = 'chat-msg__voice-bar';
        bar.style.height = h + 'px';
        wave.appendChild(bar);
        bars.push(bar);
    });

    const durationSpan = document.createElement('span');
    durationSpan.className = 'chat-msg__voice-duration';
    durationSpan.textContent = fileItem.duration || '0:00';

    track.appendChild(wave);
    track.appendChild(durationSpan);

    const audio = document.createElement('audio');
    audio.src = fileItem.url || fileItem.data || '';
    audio.preload = 'metadata';

    audio.addEventListener('loadedmetadata', () => {
        if (audio.duration && isFinite(audio.duration)) {
            durationSpan.textContent = formatDuration(Math.round(audio.duration));
        }
    });

    let isPlaying = false;
    playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isPlaying) {
            audio.pause();
        } else {
            document.querySelectorAll('audio').forEach((a) => {
                if (a !== audio) a.pause();
            });
            audio.play().catch(() => {});
        }
    });

    wave.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!audio.duration || !isFinite(audio.duration)) return;
        const rect = wave.getBoundingClientRect();
        const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const pct = clickX / rect.width;
        audio.currentTime = pct * audio.duration;
        if (!isPlaying) {
            document.querySelectorAll('audio').forEach((a) => {
                if (a !== audio) a.pause();
            });
            audio.play().catch(() => {});
        }
    });

    audio.addEventListener('play', () => {
        isPlaying = true;
        card.classList.add('is-playing');
        playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
    });

    audio.addEventListener('pause', () => {
        isPlaying = false;
        card.classList.remove('is-playing');
        playIcon.innerHTML = '<polygon points="7 4 19 12 7 20 7 4"></polygon>';
    });

    audio.addEventListener('ended', () => {
        isPlaying = false;
        card.classList.remove('is-playing');
        playIcon.innerHTML = '<polygon points="7 4 19 12 7 20 7 4"></polygon>';
        if (audio.duration && isFinite(audio.duration)) {
            durationSpan.textContent = formatDuration(Math.round(audio.duration));
        }
        bars.forEach((b) => b.classList.remove('is-active'));
    });

    audio.addEventListener('timeupdate', () => {
        if (audio.duration && isFinite(audio.duration)) {
            const rem = Math.max(0, audio.duration - audio.currentTime);
            durationSpan.textContent = formatDuration(Math.round(rem));
            const progress = audio.currentTime / audio.duration;
            const activeIdx = Math.floor(progress * bars.length);
            bars.forEach((b, idx) => {
                b.classList.toggle('is-active', idx <= activeIdx);
            });
        }
    });

    card.appendChild(playBtn);
    card.appendChild(track);
    card.appendChild(audio);
    return card;
}

function renderMessageBubble(role, text, modelName, files) {
    if (!chatFeed) return;

    const msg = document.createElement('div');
    msg.className = 'chat-msg chat-msg--' + (role === 'user' ? 'user' : 'assistant');

    if (role === 'assistant') {
        const bubble = document.createElement('div');
        bubble.className = 'chat-msg__bubble';
        formatMessageContent(bubble, text);
        msg.appendChild(bubble);
    } else {
        const bubble = document.createElement('div');
        bubble.className = 'chat-msg__bubble';

        if (files && files.length > 0) {
            const mediaWrap = document.createElement('div');
            mediaWrap.className = 'chat-msg__media';

            files.forEach((fileItem) => {
                if (fileItem.type === 'image' && (fileItem.url || fileItem.data)) {
                    const img = document.createElement('img');
                    img.src = fileItem.url || fileItem.data;
                    img.alt = fileItem.name;
                    img.className = 'chat-msg__img';
                    mediaWrap.appendChild(img);
                } else if (fileItem.type === 'audio' || isAudioFile(fileItem.name)) {
                    const voiceCard = renderVoiceCard(fileItem);
                    mediaWrap.appendChild(voiceCard);
                } else {
                    const card = document.createElement('div');
                    card.className = 'chat-msg__file-card';

                    const iconWrap = document.createElement('div');
                    iconWrap.className = 'chat-msg__file-icon';
                    iconWrap.appendChild(createFileDocumentIcon(18));

                    const info = document.createElement('div');
                    info.className = 'chat-msg__file-info';

                    const name = document.createElement('span');
                    name.className = 'chat-msg__file-name';
                    name.textContent = fileItem.name;
                    name.title = fileItem.name;
                    info.appendChild(name);

                    if (fileItem.size) {
                        const size = document.createElement('span');
                        size.className = 'chat-msg__file-size';
                        size.textContent = fileItem.size;
                        info.appendChild(size);
                    }

                    card.appendChild(iconWrap);
                    card.appendChild(info);
                    mediaWrap.appendChild(card);
                }
            });

            bubble.appendChild(mediaWrap);
        }

        if (text && text.trim().length > 0) {
            const p = document.createElement('p');
            p.textContent = text;
            bubble.appendChild(p);
        }

        msg.appendChild(bubble);
    }

    chatFeed.appendChild(msg);
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatInlineMarkdown(text) {
    if (!text) return '';
    let res = escapeHtml(text);
    res = res.replace(/[\u2014\u2013]/g, '-');
    res = res.replace(/`([^`]+?)`/g, '<code class="chat-inline-code">$1</code>');

    const links = [];
    const linkIcon = '<svg class="chat-msg__link-icon" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 9.5L9.5 2.5"></path><path d="M4.5 2.5H9.5V7.5"></path></svg>';

    res = res.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
        let href = url.trim();
        if (!/^https?:\/\/|^mailto:/i.test(href)) {
            href = 'https://' + href.replace(/^\/\//, '');
        }
        const token = '\x01LNK_' + links.length + '\x02';
        links.push('<a href="' + href + '" target="_blank" rel="noopener noreferrer" class="chat-msg__link" title="' + href + '"><span>' + label + '</span>' + linkIcon + '</a>');
        return token;
    });

    res = res.replace(/(^|[\s(])(https?:\/\/[^\s<)"']+)/g, (match, prefix, url) => {
        const cleanUrl = url.replace(/[.,;!?]+$/, '');
        const trailing = url.slice(cleanUrl.length);
        const token = '\x01LNK_' + links.length + '\x02';
        links.push('<a href="' + cleanUrl + '" target="_blank" rel="noopener noreferrer" class="chat-msg__link" title="' + cleanUrl + '"><span>' + cleanUrl + '</span>' + linkIcon + '</a>');
        return prefix + token + trailing;
    });

    res = res.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');
    res = res.replace(/__([\s\S]+?)__/g, '<strong>$1</strong>');
    res = res.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');
    res = res.replace(/_([^_\n]+?)_/g, '<em>$1</em>');

    for (let i = 0; i < links.length; i++) {
        res = res.replace('\x01LNK_' + i + '\x02', links[i]);
    }

    return res;
}

function highlightSyntax(code) {
    if (!code) return '';

    const tokenRegex = /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(#.*$|\/\/.*$|\/\*[\s\S]*?\*\/)|(@[a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*)|(\bdef\s+)([a-zA-Z_]\w*)|(\bclass\s+)([a-zA-Z_]\w*)|(\b(?:def|class|return|import|from|as|if|elif|else|for|while|try|except|finally|with|in|is|not|and|or|lambda|pass|break|continue|async|await|yield|global|nonlocal|raise|const|let|var|function|export|default|switch|case|new|typeof|instanceof|void|delete)\b)|(\b(?:print|input|len|range|enumerate|int|str|float|list|dict|set|tuple|bool|open|type|super|isinstance|issubclass|map|filter|sum|min|max|any|all|zip|sorted|reversed|dir|id|repr|document|window|console|Math|JSON|Promise|setTimeout|setInterval)\b(?=\s*\())|(\b(?:True|False|None|self|cls|this|true|false|null|undefined|NaN|Infinity)\b)|(\b0x[0-9a-fA-F]+\b|\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|([=+\-*/%&|^~<>!]=?|==|!=|<=|>=|=>|\->)/gm;

    let result = '';
    let lastIndex = 0;
    let match;

    while ((match = tokenRegex.exec(code)) !== null) {
        result += escapeHtml(code.slice(lastIndex, match.index));

        if (match[1]) {
            result += '<span class="tok-string">' + escapeHtml(match[1]) + '</span>';
        } else if (match[2]) {
            result += '<span class="tok-comment">' + escapeHtml(match[2]) + '</span>';
        } else if (match[3]) {
            result += '<span class="tok-decorator">' + escapeHtml(match[3]) + '</span>';
        } else if (match[4] && match[5]) {
            result += '<span class="tok-keyword">' + escapeHtml(match[4]) + '</span><span class="tok-func-name">' + escapeHtml(match[5]) + '</span>';
        } else if (match[6] && match[7]) {
            result += '<span class="tok-keyword">' + escapeHtml(match[6]) + '</span><span class="tok-class-name">' + escapeHtml(match[7]) + '</span>';
        } else if (match[8]) {
            result += '<span class="tok-keyword">' + escapeHtml(match[8]) + '</span>';
        } else if (match[9]) {
            result += '<span class="tok-builtin">' + escapeHtml(match[9]) + '</span>';
        } else if (match[10]) {
            result += '<span class="tok-constant">' + escapeHtml(match[10]) + '</span>';
        } else if (match[11]) {
            result += '<span class="tok-number">' + escapeHtml(match[11]) + '</span>';
        } else if (match[12]) {
            result += '<span class="tok-operator">' + escapeHtml(match[12]) + '</span>';
        }

        lastIndex = tokenRegex.lastIndex;
    }

    result += escapeHtml(code.slice(lastIndex));
    return result;
}

function createCodeBlockElement(codeText, lang) {
    const wrap = document.createElement('div');
    wrap.className = 'chat-code';

    const header = document.createElement('div');
    header.className = 'chat-code__header';

    const headerLeft = document.createElement('div');
    headerLeft.className = 'chat-code__header-left';

    const langSpan = document.createElement('span');
    langSpan.className = 'chat-code__lang';
    langSpan.textContent = (lang || 'code').toUpperCase();

    headerLeft.appendChild(langSpan);

    const headerRight = document.createElement('div');
    headerRight.className = 'chat-code__header-right';

    const rawLines = codeText.split('\n');
    const lineCount = rawLines.length;

    const countSpan = document.createElement('span');
    countSpan.className = 'chat-code__lines-count';
    countSpan.textContent = lineCount + (lineCount === 1 ? ' line' : ' lines');

    const downloadBtn = document.createElement('button');
    downloadBtn.type = 'button';
    downloadBtn.className = 'chat-code__btn chat-code__download';
    downloadBtn.setAttribute('aria-label', 'Download code file');
    downloadBtn.innerHTML = '<svg class="chat-code__btn-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3v9m0 0l-3-3m3 3l3-3"></path><path d="M4 14v1.5a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5V14"></path></svg><span class="chat-code__btn-text">Download</span>';

    downloadBtn.addEventListener('click', () => {
        const langMap = {
            python: 'py', py: 'py',
            javascript: 'js', js: 'js',
            typescript: 'ts', ts: 'ts',
            html: 'html', htm: 'html',
            css: 'css', scss: 'scss',
            json: 'json', bash: 'sh',
            sh: 'sh', shell: 'sh', zsh: 'sh',
            sql: 'sql', c: 'c', h: 'h',
            cpp: 'cpp', 'c++': 'cpp', hpp: 'hpp',
            csharp: 'cs', 'c#': 'cs', cs: 'cs',
            java: 'java', rust: 'rs', rs: 'rs',
            go: 'go', php: 'php', ruby: 'rb', rb: 'rb',
            swift: 'swift', kotlin: 'kt', kt: 'kt',
            markdown: 'md', md: 'md',
            xml: 'xml', yaml: 'yaml', yml: 'yaml',
            code: 'txt', text: 'txt', txt: 'txt'
        };
        const cleanLang = (lang || '').toLowerCase().trim();
        const ext = langMap[cleanLang] || (/^[a-z0-9]{1,5}$/.test(cleanLang) ? cleanLang : 'txt');

        let randId = '';
        if (window.crypto && window.crypto.getRandomValues) {
            const arr = new Uint8Array(16);
            window.crypto.getRandomValues(arr);
            randId = Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
        } else {
            randId = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Date.now().toString(36);
        }

        const fileName = 'chromo_' + randId + '.' + ext;
        const blob = new Blob([codeText], { type: 'text/plain;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    });

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'chat-code__btn chat-code__copy';
    copyBtn.setAttribute('aria-label', 'Copy code');
    copyBtn.innerHTML = '<svg class="chat-code__btn-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="7" width="10" height="10" rx="2"></rect><path d="M4 13V4a1 1 0 011-1h9"></path></svg><span class="chat-code__btn-text">Copy code</span>';

    function setCopied() {
        copyBtn.classList.add('is-success');
        copyBtn.innerHTML = '<svg class="chat-code__btn-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10l4 4 8-8"></path></svg><span class="chat-code__btn-text">Copied!</span>';
        setTimeout(() => {
            copyBtn.classList.remove('is-success');
            copyBtn.innerHTML = '<svg class="chat-code__btn-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="7" width="10" height="10" rx="2"></rect><path d="M4 13V4a1 1 0 011-1h9"></path></svg><span class="chat-code__btn-text">Copy code</span>';
        }, 2200);
    }

    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(codeText);
            setCopied();
        } catch (e) {
            const ta = document.createElement('textarea');
            ta.value = codeText;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopied();
        }
    });

    headerRight.appendChild(countSpan);
    headerRight.appendChild(downloadBtn);
    headerRight.appendChild(copyBtn);

    header.appendChild(headerLeft);
    header.appendChild(headerRight);

    const body = document.createElement('div');
    body.className = 'chat-code__body';

    const gutter = document.createElement('div');
    gutter.className = 'chat-code__gutter';
    gutter.setAttribute('aria-hidden', 'true');

    for (let i = 1; i <= lineCount; i++) {
        const numSpan = document.createElement('span');
        numSpan.className = 'chat-code__num';
        numSpan.textContent = String(i);
        gutter.appendChild(numSpan);
    }

    const pre = document.createElement('pre');
    pre.className = 'chat-code__pre';

    const code = document.createElement('code');
    code.className = 'chat-code__content';
    code.innerHTML = highlightSyntax(codeText);

    pre.appendChild(code);
    body.appendChild(gutter);
    body.appendChild(pre);

    wrap.appendChild(header);
    wrap.appendChild(body);

    return wrap;
}

function isDefiniteCodeStart(line) {
    const t = line.trim();
    if (!t) return false;
    return /^def\s+[a-zA-Z_]\w*\s*\(|^class\s+[a-zA-Z_]\w*[:(]|^import\s+[a-zA-Z_]|^from\s+[a-zA-Z_].*\s+import|^if\s+__name__\s*==\s*["']__main__["']|^function\s+[a-zA-Z_]\w*\s*\(|^const\s+[a-zA-Z_]\w*\s*=\s*\(?.*=>|^async\s+def\s+[a-zA-Z_]/.test(t);
}

function isCodeContinuation(line) {
    if (!line.trim()) return true;
    if (line.startsWith('    ') || line.startsWith('\t')) return true;
    const t = line.trim();
    if (isDefiniteCodeStart(line)) return true;
    if (/^(return\b|print\(|while\b|for\b|try:|except[\s:]|finally:|elif\b|else:|if\b|pass\b|break\b|continue\b|with\b|raise\b|console\.log|import\b|from\b)/.test(t)) return true;
    if (/^[}\])]+[;,]?$/.test(t)) return true;
    if (/^[a-zA-Z_]\w*\s*=\s*.+/.test(t) && !t.includes('  ')) return true;
    if (/^[a-zA-Z_]\w*\s*\(.*\)[;]?$/.test(t)) return true;
    return false;
}

function formatMessageContent(container, rawText) {
    if (!container || !rawText) return;
    const lines = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

    let inFencedBlock = false;
    let fencedLang = '';
    let fencedBuffer = [];

    let inRawCodeBlock = false;
    let rawCodeBuffer = [];

    let currentListType = null;
    let currentListEl = null;

    let paraBuffer = [];

    function flushPara() {
        if (paraBuffer.length > 0) {
            const p = document.createElement('p');
            p.className = 'chat-msg__p';
            p.innerHTML = formatInlineMarkdown(paraBuffer.join(' '));
            container.appendChild(p);
            paraBuffer = [];
        }
    }

    function flushList() {
        if (currentListEl) {
            container.appendChild(currentListEl);
            currentListEl = null;
            currentListType = null;
        }
    }

    function flushFencedBlock() {
        if (fencedBuffer.length > 0 || inFencedBlock) {
            const codeText = fencedBuffer.join('\n');
            const blockEl = createCodeBlockElement(codeText, fencedLang || 'code');
            container.appendChild(blockEl);
            fencedBuffer = [];
            fencedLang = '';
            inFencedBlock = false;
        }
    }

    function flushRawCodeBlock() {
        if (rawCodeBuffer.length > 0) {
            while (rawCodeBuffer.length > 0 && rawCodeBuffer[rawCodeBuffer.length - 1].trim() === '') {
                rawCodeBuffer.pop();
            }
            if (rawCodeBuffer.length > 0) {
                const codeText = rawCodeBuffer.join('\n');
                const blockEl = createCodeBlockElement(codeText, 'python');
                container.appendChild(blockEl);
            }
            rawCodeBuffer = [];
            inRawCodeBlock = false;
        }
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (trimmed.startsWith('```')) {
            if (inFencedBlock) {
                flushFencedBlock();
            } else {
                flushPara();
                flushList();
                flushRawCodeBlock();
                inFencedBlock = true;
                fencedLang = trimmed.slice(3).trim().toLowerCase() || 'code';
                fencedBuffer = [];
            }
            continue;
        }

        if (inFencedBlock) {
            fencedBuffer.push(line);
            continue;
        }

        if (inRawCodeBlock) {
            if (trimmed.startsWith('#') && trimmed.startsWith('###')) {
                flushRawCodeBlock();
            } else if (isCodeContinuation(line)) {
                rawCodeBuffer.push(line);
                continue;
            } else {
                flushRawCodeBlock();
            }
        }

        if (!inRawCodeBlock && isDefiniteCodeStart(line)) {
            flushPara();
            flushList();
            inRawCodeBlock = true;
            rawCodeBuffer = [line];
            continue;
        }

        if (trimmed === '') {
            flushPara();
            flushList();
            continue;
        }

        const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
        if (headingMatch) {
            flushPara();
            flushList();
            const level = 'h' + Math.min(headingMatch[1].length + 1, 4);
            const h = document.createElement(level);
            h.className = 'chat-msg__' + level;
            h.innerHTML = formatInlineMarkdown(headingMatch[2]);
            container.appendChild(h);
            continue;
        }

        const bulletMatch = line.match(/^[-*]\s+(.+)$/);
        if (bulletMatch) {
            flushPara();
            if (currentListType !== 'ul') {
                flushList();
                currentListType = 'ul';
                currentListEl = document.createElement('ul');
                currentListEl.className = 'chat-msg__ul';
            }
            const li = document.createElement('li');
            li.innerHTML = formatInlineMarkdown(bulletMatch[1]);
            currentListEl.appendChild(li);
            continue;
        }

        const numMatch = line.match(/^(\d+)\.\s+(.+)$/);
        if (numMatch) {
            flushPara();
            if (currentListType !== 'ol') {
                flushList();
                currentListType = 'ol';
                currentListEl = document.createElement('ol');
                currentListEl.className = 'chat-msg__ol';
            }
            const li = document.createElement('li');
            li.innerHTML = formatInlineMarkdown(numMatch[2]);
            currentListEl.appendChild(li);
            continue;
        }

        paraBuffer.push(trimmed);
    }

    flushPara();
    flushList();
    flushFencedBlock();
    flushRawCodeBlock();
}

const chatBar = document.getElementById('chatBar');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const fileInput = document.getElementById('fileInput');
const attachBtn = document.getElementById('attachBtn');
const attachmentsList = document.getElementById('attachmentsList');
const fileNotice = document.getElementById('fileNotice');

const MAX_FILE_SIZE = 10 * 1024 * 1024;
let currentAttachedFiles = [];
let noticeTimer = null;

function showFileNotice(text) {
    if (!fileNotice) return;
    fileNotice.textContent = text;
    fileNotice.classList.add('is-visible');
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => {
        fileNotice.classList.remove('is-visible');
    }, 4000);
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
            'An active Chromo account is required to prompt neural models and save your conversation history.'
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
            sendMessage();
        }
    });

    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 140) + 'px';
    });
}

function focusChatInput() {
    if (chatInput && getCurrentUser()) {
        requestAnimationFrame(() => {
            chatInput.focus();
        });
    }
}

if (chatBar && chatInput) {
    chatBar.addEventListener('click', (e) => {
        if (!e.target.closest('button') && !e.target.closest('label') && !e.target.closest('.model-select')) {
            focusChatInput();
        }
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
                'Please sign in or register to upload files up to 10 MB to ' + modelName + '.'
            );
        }
    });
}

function addAttachment(file) {
    if (!file || !attachmentsList) return;

    if (file.size > MAX_FILE_SIZE) {
        showFileNotice('"' + file.name + '" exceeds the 10 MB limit (' + formatFileSize(file.size) + ').');
        return;
    }

    const chip = document.createElement('div');
    chip.className = 'attachment-chip';

    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/') || isAudioFile(file.name);
    const extension = file.name.includes('.') ? file.name.split('.').pop().toUpperCase() : 'FILE';
    const formattedSize = formatFileSize(file.size);

    let fileRecord = {
        name: file.name,
        size: formattedSize,
        type: isImage ? 'image' : (isAudio ? 'audio' : 'file'),
        ext: extension,
        rawSize: file.size,
        data: ''
    };

    const reader = new FileReader();
    fileRecord.ready = new Promise((resolve) => {
        reader.onload = () => {
            fileRecord.data = typeof reader.result === 'string' ? reader.result : '';
            resolve();
        };
        reader.onerror = () => resolve();
    });
    reader.readAsDataURL(file);

    if (isImage) {
        const img = document.createElement('img');
        const objectUrl = URL.createObjectURL(file);
        img.src = objectUrl;
        img.alt = file.name;
        chip.appendChild(img);
        fileRecord.url = objectUrl;
    } else if (isAudio) {
        const objectUrl = URL.createObjectURL(file);
        fileRecord.url = objectUrl;
        const iconWrap = document.createElement('span');
        iconWrap.className = 'attachment-chip__icon-wrap';
        iconWrap.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path></svg>';
        chip.appendChild(iconWrap);
    } else {
        const iconWrap = document.createElement('span');
        iconWrap.className = 'attachment-chip__icon-wrap';
        iconWrap.appendChild(createFileDocumentIcon(13));
        chip.appendChild(iconWrap);
    }

    const nameSpan = document.createElement('span');
    nameSpan.className = 'attachment-chip__name';
    nameSpan.textContent = file.name;

    const sizeSpan = document.createElement('span');
    sizeSpan.className = 'attachment-chip__size';
    sizeSpan.textContent = formattedSize;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'attachment-chip__remove';
    removeBtn.setAttribute('aria-label', 'Remove file');

    const removeIcon = document.createElement('img');
    removeIcon.src = '../assets/pictures/kr.png';
    removeIcon.alt = '';

    removeBtn.appendChild(removeIcon);
    removeBtn.addEventListener('click', () => {
        chip.remove();
        currentAttachedFiles = currentAttachedFiles.filter((item) => item !== fileRecord);
    });

    chip.appendChild(nameSpan);
    chip.appendChild(sizeSpan);
    chip.appendChild(removeBtn);

    attachmentsList.appendChild(chip);
    currentAttachedFiles.push(fileRecord);
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
        if (!handleChatAttempt(e)) return;
        sendMessage();
    });
}

async function sendMessage(overrideText) {
    if (typeof isDictating !== 'undefined' && isDictating) {
        finishVoiceDictation();
    }
    const text = (typeof overrideText === 'string' ? overrideText : (chatInput ? chatInput.value : '')).trim();
    const files = [...currentAttachedFiles];

    if (text === '' && files.length === 0) return;

    const user = getCurrentUser();
    if (!user) {
        handleChatAttempt();
        return;
    }

    if (chatEmptyState) chatEmptyState.classList.add('is-hidden');

    renderMessageBubble('user', text, null, files);

    if (chatInput) {
        chatInput.value = '';
        chatInput.style.height = 'auto';
    }
    if (attachmentsList) attachmentsList.innerHTML = '';
    currentAttachedFiles = [];
    focusChatInput();

    const activeModel = currentModel ? currentModel.textContent.trim() : 'Gemini 3.8 Flash';
    localStorage.setItem('chromo_selected_model', activeModel);

    const typingMsg = document.createElement('div');
    typingMsg.className = 'chat-msg chat-msg--assistant chat-msg--typing';
    typingMsg.id = 'activeTypingIndicator';

    const bubble = document.createElement('div');
    bubble.className = 'chat-msg__bubble';

    const typing = document.createElement('div');
    typing.className = 'chat-typing';
    typing.innerHTML = '<span class="chat-typing__dot"></span><span class="chat-typing__dot"></span><span class="chat-typing__dot"></span>';

    bubble.appendChild(typing);
    typingMsg.appendChild(bubble);

    if (chatFeed) chatFeed.appendChild(typingMsg);
    scrollToBottom();

    if (sendBtn) sendBtn.disabled = true;

    try {
        await Promise.all(files.map((f) => f.ready || Promise.resolve()));

        const payloadFiles = files.map((f) => ({
            name: f.name,
            data: f.data || '',
            rawSize: f.rawSize || 0
        }));

        let historyPayload = [];
        const chats = loadStoredChats();
        const existingChat = chats.find((c) => c.id === activeChatId);
        if (existingChat && Array.isArray(existingChat.messages)) {
            historyPayload = existingChat.messages.slice(-10).map((m) => ({
                role: m.role,
                text: m.text
            }));
        }

        const reqStart = performance.now();
        const res = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: user,
                prompt: text,
                model: activeModel,
                history: historyPayload,
                files: payloadFiles
            })
        });

        const data = await res.json();

        const ind = document.getElementById('activeTypingIndicator');
        if (ind) ind.remove();

        if (data.ok) {
            sendChatTelemetry(activeModel, performance.now() - reqStart);
            const replyText = data.reply || '';
            renderMessageBubble('assistant', replyText, activeModel, null);
            scrollToBottom();
            persistConversation(text, replyText, activeModel, files);
            if (data.subscription) {
                localStorage.setItem('chromo_sub', data.subscription);
                const planEl = document.getElementById('accountUserPlan');
                if (planEl) {
                    planEl.textContent = data.subscription;
                }
                if (sidebarUserStatus) {
                    sidebarUserStatus.innerHTML = '<span class="chat-sidebar__sub-label">Subscription:</span> <span class="chat-sidebar__sub-val">' + data.subscription + '</span>';
                }
            }
            fetchAndRenderLimits();
        } else {
            const errText = data.error || 'The model did not return a response.';
            const isLimitErr = res.status === 429 || errText.toLowerCase().includes('limit');
            showCenterToast(isLimitErr ? 'Quota Reached' : 'Connection Error', errText);
            fetchAndRenderLimits();
            if (isLimitErr) {
                if (window.innerWidth <= 860 && chatSidebar) {
                    chatSidebar.classList.add('is-open');
                    if (sidebarOverlay) sidebarOverlay.classList.add('is-visible');
                } else if (chatSidebar && chatSidebar.classList.contains('is-collapsed')) {
                    chatSidebar.classList.remove('is-collapsed');
                }
                switchSidebarTab('limits');
            }
        }
    } catch (networkErr) {
        const ind = document.getElementById('activeTypingIndicator');
        if (ind) ind.remove();
        showCenterToast('Connection Error', 'Unable to reach the AI server. Please try again.');
    } finally {
        if (sendBtn) sendBtn.disabled = false;
        focusChatInput();
    }
}

function persistConversation(userText, assistantText, modelName, files) {
    let chats = loadStoredChats();
    let currentChat = chats.find((c) => c.id === activeChatId);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (!currentChat) {
        const titleText = userText.length > 32 ? (userText.slice(0, 32) + '...') : (userText || 'File Upload');
        currentChat = {
            id: 'chat_' + Date.now(),
            title: titleText,
            model: modelName,
            date: 'Today ' + timeStr,
            messages: []
        };
        chats.unshift(currentChat);
        activeChatId = currentChat.id;
    } else {
        currentChat.model = modelName;
        currentChat.date = 'Today ' + timeStr;
    }

    const savedFiles = (files || []).map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        ext: f.ext,
        duration: f.duration || '',
        url: (f.type === 'image' || f.type === 'audio') ? (f.data || f.url || '') : ''
    }));

    currentChat.messages.push({
        role: 'user',
        text: userText,
        time: timeStr,
        files: savedFiles
    });

    currentChat.messages.push({
        role: 'assistant',
        text: assistantText,
        model: modelName,
        time: timeStr
    });

    saveStoredChats(chats);
    renderHistoryList();
}

function checkPendingPrompt() {
    const raw = sessionStorage.getItem('chromo_pending_prompt');
    if (raw) {
        sessionStorage.removeItem('chromo_pending_prompt');
        let promptText = raw;
        let selectedModel = null;
        let voiceFile = null;
        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                promptText = parsed.prompt || '';
                selectedModel = parsed.model || null;
                voiceFile = parsed.voiceFile || null;
            }
        } catch (e) { }

        if (selectedModel) {
            setSelectedModel(selectedModel);
        }

        if (voiceFile) {
            if (getCurrentUser()) {
                sendVoiceMessageDirectly(promptText || '', voiceFile);
                return;
            } else {
                openAuthModal(
                    'Sign in to message ' + (selectedModel || 'neural models'),
                    'Please sign in or register to send your voice message.'
                );
                return;
            }
        }

        if (promptText) {
            if (chatInput) {
                chatInput.value = '';
                chatInput.style.height = 'auto';
            }
            if (getCurrentUser()) {
                setTimeout(() => {
                    sendMessage(promptText);
                }, 30);
            } else {
                sessionStorage.setItem('chromo_pending_prompt', JSON.stringify({
                    prompt: promptText,
                    model: selectedModel || 'Gemini 3.8 Flash'
                }));
                openAuthModal(
                    'Sign in to message ' + (selectedModel || 'neural models'),
                    'Please sign in or register to send your prompt and view responses.'
                );
            }
        }
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (authModal && authModal.classList.contains('is-open')) {
            closeAuthModal();
        }
        if (accountPopover && accountPopover.classList.contains('is-open')) {
            accountPopover.classList.remove('is-open');
            accountPopover.setAttribute('aria-hidden', 'true');
        }
        if (modelSelect && modelSelect.classList.contains('is-open')) {
            modelSelect.classList.remove('is-open');
            if (modelBtn) modelBtn.setAttribute('aria-expanded', 'false');
        }
        if (voicePanel && voicePanel.style.display !== 'none') {
            cancelVoiceDictation();
        }
        closeMobileSidebar();
    }
});

updateAuthUI();
renderHistoryList();
const savedModel = localStorage.getItem('chromo_selected_model');
if (savedModel) {
    setSelectedModel(savedModel, false);
}
checkPendingPrompt();
focusChatInput();

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

function startVoiceDictation() {
    if (!handleChatAttempt()) return;

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
    } catch (e) {
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

async function sendVoiceMessageDirectly(text, voiceFileRecord) {
    const user = getCurrentUser();
    if (!user) {
        handleChatAttempt();
        return;
    }

    if (chatEmptyState) chatEmptyState.classList.add('is-hidden');

    renderMessageBubble('user', text || '', null, [voiceFileRecord]);
    scrollToBottom();

    const activeModel = currentModel ? currentModel.textContent.trim() : 'Gemini 3.8 Flash';
    localStorage.setItem('chromo_selected_model', activeModel);

    const typingMsg = document.createElement('div');
    typingMsg.className = 'chat-msg chat-msg--assistant chat-msg--typing';
    typingMsg.id = 'activeTypingIndicator';

    const bubble = document.createElement('div');
    bubble.className = 'chat-msg__bubble';
    const typing = document.createElement('div');
    typing.className = 'chat-typing';
    typing.innerHTML = '<span class="chat-typing__dot"></span><span class="chat-typing__dot"></span><span class="chat-typing__dot"></span>';
    bubble.appendChild(typing);
    typingMsg.appendChild(bubble);
    if (chatFeed) chatFeed.appendChild(typingMsg);
    scrollToBottom();

    if (sendBtn) sendBtn.disabled = true;

    try {
        const payloadFiles = [{
            name: voiceFileRecord.name,
            data: voiceFileRecord.data || '',
            rawSize: voiceFileRecord.rawSize || 0
        }];

        let historyPayload = [];
        const chats = loadStoredChats();
        const existingChat = chats.find((c) => c.id === activeChatId);
        if (existingChat && Array.isArray(existingChat.messages)) {
            historyPayload = existingChat.messages.slice(-10).map((m) => ({
                role: m.role,
                text: m.text
            }));
        }

        const reqStart = performance.now();
        const res = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: user,
                prompt: text || '',
                model: activeModel,
                history: historyPayload,
                files: payloadFiles
            })
        });

        const data = await res.json();
        const ind = document.getElementById('activeTypingIndicator');
        if (ind) ind.remove();

        if (data.ok) {
            sendChatTelemetry(activeModel, performance.now() - reqStart);
            const replyText = data.reply || '';
            renderMessageBubble('assistant', replyText, activeModel, null);
            scrollToBottom();
            persistConversation(text || '', replyText, activeModel, [voiceFileRecord]);
            if (data.subscription) {
                localStorage.setItem('chromo_sub', data.subscription);
                const planEl = document.getElementById('accountUserPlan');
                if (planEl) planEl.textContent = data.subscription;
                if (sidebarUserStatus) {
                    sidebarUserStatus.innerHTML = '<span class="chat-sidebar__sub-label">Subscription:</span> <span class="chat-sidebar__sub-val">' + data.subscription + '</span>';
                }
            }
            fetchAndRenderLimits();
        } else {
            const errText = data.error || 'The model did not return a response.';
            const isLimitErr = res.status === 429 || errText.toLowerCase().includes('limit');
            showCenterToast(isLimitErr ? 'Quota Reached' : 'Connection Error', errText);
            fetchAndRenderLimits();
            if (isLimitErr) {
                if (window.innerWidth <= 860 && chatSidebar) {
                    chatSidebar.classList.add('is-open');
                    if (sidebarOverlay) sidebarOverlay.classList.add('is-visible');
                } else if (chatSidebar && chatSidebar.classList.contains('is-collapsed')) {
                    chatSidebar.classList.remove('is-collapsed');
                }
                switchSidebarTab('limits');
            }
        }
    } catch (networkErr) {
        const ind = document.getElementById('activeTypingIndicator');
        if (ind) ind.remove();
        showCenterToast('Connection Error', 'Unable to reach the AI server. Please try again.');
    } finally {
        if (sendBtn) sendBtn.disabled = false;
        focusChatInput();
    }
}

if (voiceRecordBtn) voiceRecordBtn.addEventListener('click', startVoiceDictation);
if (voiceCancelBtn) voiceCancelBtn.addEventListener('click', cancelVoiceDictation);
if (voiceDoneBtn) voiceDoneBtn.addEventListener('click', finishVoiceDictation);
