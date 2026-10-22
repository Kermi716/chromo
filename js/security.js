(function () {
    try {
        if (window.location.protocol.startsWith('http') && window.history && window.history.replaceState) {
            const path = window.location.pathname;
            if (path.endsWith('/index.html')) {
                const clean = path.slice(0, -10) || '/';
                window.history.replaceState(null, '', clean + window.location.search + window.location.hash);
            } else if (path === '/index.html' || path.endsWith('index.html')) {
                const clean = path.replace(/index\.html$/, '') || '/';
                window.history.replaceState(null, '', clean + window.location.search + window.location.hash);
            }
        }
    } catch (e) {}

    const ALLOWED_HOSTS = ['xk9m2pq.xyz', 'www.xk9m2pq.xyz', 'localhost', '127.0.0.1', 'chromo-ltd.xyz'];

    function triggerLockdown(reason) {
        try {
            window.stop();
        } catch (e) {}

        const overlay = document.createElement('div');
        overlay.id = 'chromoSecLockdown';
        overlay.innerHTML = `
<div class="sec-guard-wrap">
    <div class="sec-guard-icon">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
    </div>
    <div class="sec-guard-badge">Security Guard</div>
    <h1 class="sec-guard-title">Security Violation: Execution Blocked</h1>
    <p class="sec-guard-desc">This web application is protected by Chromo Security Shield. Running downloaded offline copies (file://), cloned sources, or unauthorized mirror hosts is strictly prohibited.</p>
    <div class="sec-guard-box">
        <div class="sec-guard-row"><span class="sec-guard-label">Violation:</span> <span class="sec-guard-val">${reason}</span></div>
        <div class="sec-guard-row"><span class="sec-guard-label">Protocol:</span> <span class="sec-guard-val">${window.location.protocol}</span></div>
        <div class="sec-guard-row"><span class="sec-guard-label">Detected Host:</span> <span class="sec-guard-val">${window.location.hostname || 'local_file'}</span></div>
        <div class="sec-guard-row"><span class="sec-guard-label">Integrity Status:</span> <span class="sec-guard-val sec-guard-val--danger">TERMINATED</span></div>
    </div>
    <a href="https://xk9m2pq.xyz" class="sec-guard-btn">Return to Official Website</a>
</div>
`;
        const style = document.createElement('style');
        style.textContent = `
#chromoSecLockdown {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: #09090b !important;
    color: #f4f4f5 !important;
    z-index: 2147483647 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 24px !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif !important;
    box-sizing: border-box !important;
    user-select: none !important;
}
.sec-guard-wrap {
    max-width: 520px;
    width: 100%;
    background: #121215;
    border: 1px solid #27272a;
    border-radius: 18px;
    padding: 36px 30px;
    text-align: center;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7);
}
.sec-guard-icon {
    width: 60px;
    height: 60px;
    margin: 0 auto 16px;
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ef4444;
}
.sec-guard-badge {
    display: inline-block;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
    padding: 3px 10px;
    border-radius: 20px;
    margin-bottom: 12px;
}
.sec-guard-title {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 12px;
    color: #ffffff;
    line-height: 1.3;
}
.sec-guard-desc {
    font-size: 13.5px;
    color: #a1a1aa;
    line-height: 1.6;
    margin-bottom: 22px;
}
.sec-guard-box {
    background: #09090b;
    border: 1px solid #27272a;
    border-radius: 12px;
    padding: 14px 16px;
    font-family: monospace;
    font-size: 12px;
    text-align: left;
    margin-bottom: 24px;
}
.sec-guard-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 6px;
}
.sec-guard-row:last-child {
    margin-bottom: 0;
}
.sec-guard-label {
    color: #71717a;
}
.sec-guard-val {
    color: #f4f4f5;
    word-break: break-all;
}
.sec-guard-val--danger {
    color: #ef4444;
    font-weight: 700;
}
.sec-guard-btn {
    display: inline-block;
    background: #ffffff;
    color: #000000;
    font-size: 13px;
    font-weight: 600;
    padding: 11px 26px;
    border-radius: 9px;
    text-decoration: none;
    transition: opacity 0.15s ease;
}
.sec-guard-btn:hover {
    opacity: 0.88;
}
`;
        function applyLock() {
            try {
                document.body.innerHTML = '';
                document.head.appendChild(style);
                document.body.appendChild(overlay);
            } catch (err) {
                document.documentElement.appendChild(style);
                document.documentElement.appendChild(overlay);
            }
        }

        if (document.body) {
            applyLock();
        } else {
            document.addEventListener('DOMContentLoaded', applyLock);
        }

        throw new Error('Chromo Security: Execution terminated due to integrity policy.');
    }

    if (window.location.protocol === 'file:') {
        triggerLockdown('Local file download execution (file:// protocol is forbidden)');
        return;
    }

    const host = (window.location.hostname || '').toLowerCase();
    if (host && !ALLOWED_HOSTS.includes(host)) {
        triggerLockdown('Unauthorized host or mirror domain (' + host + ')');
        return;
    }

    if (window.top !== window.self) {
        try {
            window.top.location = window.self.location;
        } catch (e) {
            triggerLockdown('Unauthorized iframe embedding detected');
            return;
        }
    }

    if (navigator.webdriver) {
        triggerLockdown('Automated browser scraping bot detected');
        return;
    }

    window.addEventListener('keydown', function (e) {
        const isMac = navigator.platform && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

        if (e.key === 'F12') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        if (cmdOrCtrl && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        if (cmdOrCtrl && (e.key === 'u' || e.key === 'U')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        if (cmdOrCtrl && e.shiftKey && (e.key === 'i' || e.key === 'I' || e.key === 'j' || e.key === 'J' || e.key === 'c' || e.key === 'C')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, true);

    document.addEventListener('contextmenu', function (e) {
        const target = e.target;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || (target.closest && target.closest('a')))) {
            return;
        }
        e.preventDefault();
        return false;
    }, true);

    document.addEventListener('dragstart', function (e) {
        if (e.target && e.target.tagName === 'IMG') {
            e.preventDefault();
        }
    }, true);

    const originalFetch = window.fetch;
    window.fetch = async function (resource, init) {
        const response = await originalFetch.apply(this, arguments);

        try {
            const urlStr = typeof resource === 'string' ? resource : (resource && resource.url ? resource.url : '');
            if (urlStr.includes('/api/')) {
                const cloned = response.clone();
                cloned.json().then(function (data) {
                    if (data && data.error && typeof data.error === 'string') {
                        if (data.error.includes('AI Service Error (401)') || data.error.includes('gsk_')) {
                            data.error = 'Unable to connect to AI provider. Please try again.';
                        }
                    }
                }).catch(function () {});
            }
        } catch (e) {}

        return response;
    };
})();
