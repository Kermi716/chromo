const API_BASE = 'https://xk9m2pq.xyz';
const TURNSTILE_SITEKEY = '0x4AAAAAAFhYLr_deFUNiQ_2';

let signInWidgetId = null;
let signUpWidgetId = null;
let changePassWidgetId = null;

function renderTurnstileWidgets() {
  if (!window.turnstile) return;

  const signInContainer = document.getElementById('signInCaptcha');
  if (signInContainer && signInWidgetId === null) {
    signInWidgetId = window.turnstile.render(signInContainer, {
      sitekey: TURNSTILE_SITEKEY,
      theme: 'light'
    });
  }

  const signUpContainer = document.getElementById('signUpCaptcha');
  if (signUpContainer && signUpWidgetId === null) {
    signUpWidgetId = window.turnstile.render(signUpContainer, {
      sitekey: TURNSTILE_SITEKEY,
      theme: 'light'
    });
  }

  const changePassContainer = document.getElementById('changePassCaptcha');
  if (changePassContainer && changePassWidgetId === null) {
    changePassWidgetId = window.turnstile.render(changePassContainer, {
      sitekey: TURNSTILE_SITEKEY,
      theme: 'light'
    });
  }
}

const turnstilePoll = setInterval(() => {
  if (window.turnstile) {
    clearInterval(turnstilePoll);
    renderTurnstileWidgets();
  }
}, 100);

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

const tabSignIn = document.getElementById('tabSignIn');
const tabSignUp = document.getElementById('tabSignUp');
const panelSignIn = document.getElementById('panelSignIn');
const panelSignUp = document.getElementById('panelSignUp');
const panelChangePass = document.getElementById('panelChangePass');
const forgotLink = document.getElementById('forgotLink');
const switchToSignUp = document.getElementById('switchToSignUp');
const switchToSignIn = document.getElementById('switchToSignIn');
const switchToSignInFromChange = document.getElementById('switchToSignInFromChange');

function showSignIn() {
  if (!tabSignIn || !tabSignUp || !panelSignIn || !panelSignUp) return;
  tabSignIn.classList.add('is-active');
  tabSignIn.setAttribute('aria-selected', 'true');
  tabSignUp.classList.remove('is-active');
  tabSignUp.setAttribute('aria-selected', 'false');
  panelSignIn.classList.add('is-active');
  panelSignUp.classList.remove('is-active');
  if (panelChangePass) panelChangePass.classList.remove('is-active');
  if (window.turnstile && signInWidgetId !== null) {
    window.turnstile.reset(signInWidgetId);
  }
}

function showSignUp() {
  if (!tabSignIn || !tabSignUp || !panelSignIn || !panelSignUp) return;
  tabSignUp.classList.add('is-active');
  tabSignUp.setAttribute('aria-selected', 'true');
  tabSignIn.classList.remove('is-active');
  tabSignIn.setAttribute('aria-selected', 'false');
  panelSignUp.classList.add('is-active');
  panelSignIn.classList.remove('is-active');
  if (panelChangePass) panelChangePass.classList.remove('is-active');
  if (window.turnstile && signUpWidgetId !== null) {
    window.turnstile.reset(signUpWidgetId);
  }
}

function showChangePass() {
  if (!panelChangePass) return;
  if (tabSignIn) {
    tabSignIn.classList.remove('is-active');
    tabSignIn.setAttribute('aria-selected', 'false');
  }
  if (tabSignUp) {
    tabSignUp.classList.remove('is-active');
    tabSignUp.setAttribute('aria-selected', 'false');
  }
  if (panelSignIn) panelSignIn.classList.remove('is-active');
  if (panelSignUp) panelSignUp.classList.remove('is-active');
  panelChangePass.classList.add('is-active');
  const storedUser = localStorage.getItem('chromo_user');
  const changeUser = document.getElementById('changeUsername');
  const signInUser = document.getElementById('signInUsername');
  if (changeUser && !changeUser.value) {
    changeUser.value = (signInUser && signInUser.value) || storedUser || '';
  }
  if (window.turnstile && changePassWidgetId !== null) {
    window.turnstile.reset(changePassWidgetId);
  }
}

if (tabSignIn) tabSignIn.addEventListener('click', showSignIn);
if (tabSignUp) tabSignUp.addEventListener('click', showSignUp);
if (switchToSignUp) switchToSignUp.addEventListener('click', showSignUp);
if (switchToSignIn) switchToSignIn.addEventListener('click', showSignIn);
if (forgotLink) {
  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    showChangePass();
  });
}
if (switchToSignInFromChange) {
  switchToSignInFromChange.addEventListener('click', showSignIn);
}

if (window.location.hash === '#forgot' || window.location.hash === '#change-password') {
  showChangePass();
}

document.querySelectorAll('.auth-toggle-pass').forEach((btn) => {
  btn.addEventListener('click', () => {
    const wrap = btn.closest('.auth-input-wrap');
    if (!wrap) return;
    const input = wrap.querySelector('.auth-input');
    if (!input) return;
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    btn.style.color = isPass ? 'var(--text-primary)' : 'var(--text-muted)';
  });
});

const signInForm = document.getElementById('signInForm');
const authNotice = document.getElementById('authNotice');
const signInSubmit = document.getElementById('signInSubmit');
const signInUsername = document.getElementById('signInUsername');
const signInPassword = document.getElementById('signInPassword');

function triggerWelcomeRedirect() {
  document.body.classList.add('is-welcoming');
  setTimeout(() => {
    const isSubdir = window.location.pathname.includes('/reg/');
    const pending = sessionStorage.getItem('chromo_pending_prompt');
    if (pending) {
      window.location.href = isSubdir ? '../chat/' : 'chat/';
      return;
    }
    window.location.href = isSubdir ? '../' : './';
  }, 1250);
}

if (signInForm && authNotice) {
  signInForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = (signInUsername && signInUsername.value.trim()) || '';
    const password = (signInPassword && signInPassword.value) || '';

    if (!username) return;

    const cfToken = window.turnstile && signInWidgetId !== null
      ? window.turnstile.getResponse(signInWidgetId)
      : '';

    if (!cfToken) {
      authNotice.textContent = 'Please complete the security check.';
      authNotice.style.color = '#ef4444';
      authNotice.classList.add('is-visible');
      return;
    }

    if (signInSubmit) {
      signInSubmit.textContent = 'Signing In...';
      signInSubmit.disabled = true;
    }

    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, cf_token: cfToken })
      });
      const data = await res.json();

      if (data.ok) {
        localStorage.setItem('chromo_user', data.username);
        if (data.token) localStorage.setItem('chromo_token', data.token);
        if (data.subscription) localStorage.setItem('chromo_sub', data.subscription);
        triggerWelcomeRedirect();
      } else {
        authNotice.textContent = data.error || 'Invalid credentials.';
        authNotice.style.color = '#ef4444';
        authNotice.classList.add('is-visible');
        if (window.turnstile && signInWidgetId !== null) {
          window.turnstile.reset(signInWidgetId);
        }
        if (signInSubmit) {
          signInSubmit.textContent = 'Sign In';
          signInSubmit.disabled = false;
        }
      }
    } catch (err) {
      authNotice.textContent = 'Connection error. Please try again.';
      authNotice.style.color = '#ef4444';
      authNotice.classList.add('is-visible');
      if (window.turnstile && signInWidgetId !== null) {
        window.turnstile.reset(signInWidgetId);
      }
      if (signInSubmit) {
        signInSubmit.textContent = 'Sign In';
        signInSubmit.disabled = false;
      }
    }
  });
}

const signUpForm = document.getElementById('signUpForm');
const regNotice = document.getElementById('regNotice');
const signUpSubmit = document.getElementById('signUpSubmit');
const signUpUsername = document.getElementById('signUpUsername');
const signUpPassword = document.getElementById('signUpPassword');
const signUpConfirm = document.getElementById('signUpConfirm');

if (signUpForm && regNotice) {
  signUpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = (signUpUsername && signUpUsername.value.trim()) || '';
    const password = (signUpPassword && signUpPassword.value) || '';
    const confirm = (signUpConfirm && signUpConfirm.value) || '';

    if (!username) return;

    if (password !== confirm) {
      regNotice.textContent = 'Passwords do not match.';
      regNotice.style.color = '#ef4444';
      regNotice.classList.add('is-visible');
      return;
    }

    const cfToken = window.turnstile && signUpWidgetId !== null
      ? window.turnstile.getResponse(signUpWidgetId)
      : '';

    if (!cfToken) {
      regNotice.textContent = 'Please complete the security check.';
      regNotice.style.color = '#ef4444';
      regNotice.classList.add('is-visible');
      return;
    }

    if (signUpSubmit) {
      signUpSubmit.textContent = 'Registering...';
      signUpSubmit.disabled = true;
    }

    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email: '', cf_token: cfToken })
      });
      const data = await res.json();

      if (data.ok) {
        localStorage.setItem('chromo_user', data.username);
        if (data.token) localStorage.setItem('chromo_token', data.token);
        if (data.subscription) localStorage.setItem('chromo_sub', data.subscription);
        triggerWelcomeRedirect();
      } else {
        regNotice.textContent = data.error || 'Registration failed.';
        regNotice.style.color = '#ef4444';
        regNotice.classList.add('is-visible');
        if (window.turnstile && signUpWidgetId !== null) {
          window.turnstile.reset(signUpWidgetId);
        }
        if (signUpSubmit) {
          signUpSubmit.textContent = 'Register';
          signUpSubmit.disabled = false;
        }
      }
    } catch (err) {
      regNotice.textContent = 'Connection error. Please try again.';
      regNotice.style.color = '#ef4444';
      regNotice.classList.add('is-visible');
      if (window.turnstile && signUpWidgetId !== null) {
        window.turnstile.reset(signUpWidgetId);
      }
      if (signUpSubmit) {
        signUpSubmit.textContent = 'Register';
        signUpSubmit.disabled = false;
      }
    }
  });
}

const changePassForm = document.getElementById('changePassForm');
const changePassNotice = document.getElementById('changePassNotice');
const changePassSubmit = document.getElementById('changePassSubmit');
const changeUsername = document.getElementById('changeUsername');
const changeOldPassword = document.getElementById('changeOldPassword');
const changeNewPassword = document.getElementById('changeNewPassword');
const changeConfirmPassword = document.getElementById('changeConfirmPassword');

if (changePassForm && changePassNotice) {
  changePassForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = (changeUsername && changeUsername.value.trim()) || '';
    const old_password = (changeOldPassword && changeOldPassword.value) || '';
    const new_password = (changeNewPassword && changeNewPassword.value) || '';
    const confirm = (changeConfirmPassword && changeConfirmPassword.value) || '';

    if (!username) {
      changePassNotice.textContent = 'Please enter your username.';
      changePassNotice.style.color = '#ef4444';
      changePassNotice.classList.add('is-visible');
      return;
    }

    if (!old_password) {
      changePassNotice.textContent = 'Please enter your current password.';
      changePassNotice.style.color = '#ef4444';
      changePassNotice.classList.add('is-visible');
      return;
    }

    if (!new_password) {
      changePassNotice.textContent = 'Please enter a new password.';
      changePassNotice.style.color = '#ef4444';
      changePassNotice.classList.add('is-visible');
      return;
    }

    if (new_password.length < 8) {
      changePassNotice.textContent = 'New password must be at least 8 characters.';
      changePassNotice.style.color = '#ef4444';
      changePassNotice.classList.add('is-visible');
      return;
    }

    if (old_password === new_password) {
      changePassNotice.textContent = 'New password must be different from current password.';
      changePassNotice.style.color = '#ef4444';
      changePassNotice.classList.add('is-visible');
      return;
    }

    if (new_password !== confirm) {
      changePassNotice.textContent = 'Passwords do not match.';
      changePassNotice.style.color = '#ef4444';
      changePassNotice.classList.add('is-visible');
      return;
    }

    const cfToken = window.turnstile && changePassWidgetId !== null
      ? window.turnstile.getResponse(changePassWidgetId)
      : '';

    if (!cfToken) {
      changePassNotice.textContent = 'Please complete the security check.';
      changePassNotice.style.color = '#ef4444';
      changePassNotice.classList.add('is-visible');
      return;
    }

    if (changePassSubmit) {
      changePassSubmit.textContent = 'Updating...';
      changePassSubmit.disabled = true;
    }

    try {
      const res = await fetch(`${API_BASE}/api/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          old_password,
          new_password,
          cf_token: cfToken
        })
      });
      const data = await res.json();

      if (data.ok) {
        changePassNotice.textContent = 'Password updated successfully.';
        changePassNotice.style.color = '#10b981';
        changePassNotice.classList.add('is-visible');
        if (changeOldPassword) changeOldPassword.value = '';
        if (changeNewPassword) changeNewPassword.value = '';
        if (changeConfirmPassword) changeConfirmPassword.value = '';
        if (data.token) {
          localStorage.setItem('chromo_token', data.token);
        }
        localStorage.setItem('chromo_user', data.username || username);
        setTimeout(() => {
          showSignIn();
          if (signInUsername) signInUsername.value = username;
          if (signInPassword) signInPassword.value = '';
          authNotice.textContent = 'Password updated. Please sign in with your new password.';
          authNotice.style.color = '#10b981';
          authNotice.classList.add('is-visible');
          if (changePassSubmit) {
            changePassSubmit.textContent = 'Change Password';
            changePassSubmit.disabled = false;
          }
        }, 1200);
      } else {
        changePassNotice.textContent = data.error || 'Failed to update password.';
        changePassNotice.style.color = '#ef4444';
        changePassNotice.classList.add('is-visible');
        if (window.turnstile && changePassWidgetId !== null) {
          window.turnstile.reset(changePassWidgetId);
        }
        if (changePassSubmit) {
          changePassSubmit.textContent = 'Change Password';
          changePassSubmit.disabled = false;
        }
      }
    } catch (err) {
      changePassNotice.textContent = 'Connection error. Please try again.';
      changePassNotice.style.color = '#ef4444';
      changePassNotice.classList.add('is-visible');
      if (window.turnstile && changePassWidgetId !== null) {
        window.turnstile.reset(changePassWidgetId);
      }
      if (changePassSubmit) {
        changePassSubmit.textContent = 'Change Password';
        changePassSubmit.disabled = false;
      }
    }
  });
}