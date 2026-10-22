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

const tabSignIn = document.getElementById('tabSignIn');
const tabSignUp = document.getElementById('tabSignUp');
const panelSignIn = document.getElementById('panelSignIn');
const panelSignUp = document.getElementById('panelSignUp');
const switchToSignUp = document.getElementById('switchToSignUp');
const switchToSignIn = document.getElementById('switchToSignIn');

function showSignIn() {
  if (!tabSignIn || !tabSignUp || !panelSignIn || !panelSignUp) return;
  tabSignIn.classList.add('is-active');
  tabSignIn.setAttribute('aria-selected', 'true');
  tabSignUp.classList.remove('is-active');
  tabSignUp.setAttribute('aria-selected', 'false');
  panelSignIn.classList.add('is-active');
  panelSignUp.classList.remove('is-active');
}

function showSignUp() {
  if (!tabSignIn || !tabSignUp || !panelSignIn || !panelSignUp) return;
  tabSignUp.classList.add('is-active');
  tabSignUp.setAttribute('aria-selected', 'true');
  tabSignIn.classList.remove('is-active');
  tabSignIn.setAttribute('aria-selected', 'false');
  panelSignUp.classList.add('is-active');
  panelSignIn.classList.remove('is-active');
}

if (tabSignIn) tabSignIn.addEventListener('click', showSignIn);
if (tabSignUp) tabSignUp.addEventListener('click', showSignUp);
if (switchToSignUp) switchToSignUp.addEventListener('click', showSignUp);
if (switchToSignIn) switchToSignIn.addEventListener('click', showSignIn);

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
    window.location.href = isSubdir ? '../' : './';
  }, 1250);
}

if (signInForm && authNotice) {
  signInForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = (signInUsername && signInUsername.value.trim()) || '';
    const password = (signInPassword && signInPassword.value) || '';

    if (!username) return;

    if (signInSubmit) {
      signInSubmit.textContent = 'Signing In...';
      signInSubmit.disabled = true;
    }

    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
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
        if (signInSubmit) {
          signInSubmit.textContent = 'Sign In';
          signInSubmit.disabled = false;
        }
      }
    } catch (err) {
      authNotice.textContent = 'Connection error. Please try again.';
      authNotice.style.color = '#ef4444';
      authNotice.classList.add('is-visible');
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

    if (signUpSubmit) {
      signUpSubmit.textContent = 'Registering...';
      signUpSubmit.disabled = true;
    }

    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email: '' })
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
        if (signUpSubmit) {
          signUpSubmit.textContent = 'Register';
          signUpSubmit.disabled = false;
        }
      }
    } catch (err) {
      regNotice.textContent = 'Connection error. Please try again.';
      regNotice.style.color = '#ef4444';
      regNotice.classList.add('is-visible');
      if (signUpSubmit) {
        signUpSubmit.textContent = 'Register';
        signUpSubmit.disabled = false;
      }
    }
  });
}
