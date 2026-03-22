document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('auth-form');
    const switchAuthLink = document.getElementById('switch-auth-link');
    const authSubtitle = document.getElementById('auth-subtitle');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const authError = document.getElementById('auth-error');
    const authModeText = document.getElementById('auth-mode-text');

    let isLogin = true;

    // Check if user is already logged in - Only redirect from login page
    const token = localStorage.getItem('token');
    if (token && window.location.pathname.includes('login.html')) {
        window.location.href = '/index.html';
    }

    if (switchAuthLink) {
        switchAuthLink.addEventListener('click', (e) => {
            e.preventDefault();
            isLogin = !isLogin;
            authError.classList.add('hidden');

            if (isLogin) {
                authSubtitle.textContent = 'Welcome back! Please enter your details.';
                authSubmitBtn.textContent = 'Sign In';
                authModeText.textContent = "Don't have an account?";
                switchAuthLink.textContent = 'Sign up';
            } else {
                authSubtitle.textContent = 'Create an account to track applications.';
                authSubmitBtn.textContent = 'Create Account';
                authModeText.textContent = "Already have an account?";
                switchAuthLink.textContent = 'Sign In';
            }
        });
    }

    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

            const origText = authSubmitBtn.textContent;
            authSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            authSubmitBtn.disabled = true;

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('username', data.username);
                    window.location.href = '/index.html';
                } else {
                    authError.textContent = data.message || 'Authentication failed';
                    authError.classList.remove('hidden');
                }
            } catch (error) {
                authError.textContent = 'Server error. Please try again later.';
                authError.classList.remove('hidden');
            }

            authSubmitBtn.innerHTML = origText;
            authSubmitBtn.disabled = false;
        });
    }
});
