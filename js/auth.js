document.addEventListener('DOMContentLoaded', () => {
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    
    const showRegisterBtn = document.getElementById('show-register');
    const showLoginBtn = document.getElementById('show-login');
    
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // View Toggling
    if (showRegisterBtn && showLoginBtn) {
        showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            clearErrors();
            loginView.style.display = 'none';
            registerView.style.display = 'block';
            registerView.classList.add('animate-fade-in');
            document.title = 'Register | Aura';
        });

        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            clearErrors();
            registerView.style.display = 'none';
            loginView.style.display = 'block';
            loginView.classList.add('animate-fade-in');
            document.title = 'Sign In | Aura';
        });
    }

    // Login Form Validation & Submission
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            clearErrors();

            const email = document.getElementById('login-email').value.trim();
            const pass = document.getElementById('login-password').value;
            let valid = true;

            if (!email) {
                showFieldError('login-email', 'Email is required');
                valid = false;
            } else if (!isValidEmail(email)) {
                showFieldError('login-email', 'Enter a valid email address');
                valid = false;
            }

            if (!pass) {
                showFieldError('login-password', 'Password is required');
                valid = false;
            } else if (pass.length < 6) {
                showFieldError('login-password', 'Password must be at least 6 characters');
                valid = false;
            }

            if (!valid) return;

            const btn = loginForm.querySelector('button');
            performAuth(btn, 'Sign In', 'login', { email, password: pass });
        });
    }

    // Register Form Validation & Submission
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            clearErrors();

            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const pass = document.getElementById('reg-password').value;
            let valid = true;

            if (!name) {
                showFieldError('reg-name', 'Full name is required');
                valid = false;
            } else if (name.length < 2) {
                showFieldError('reg-name', 'Name must be at least 2 characters');
                valid = false;
            }

            if (!email) {
                showFieldError('reg-email', 'Email is required');
                valid = false;
            } else if (!isValidEmail(email)) {
                showFieldError('reg-email', 'Enter a valid email address');
                valid = false;
            }

            if (!pass) {
                showFieldError('reg-password', 'Password is required');
                valid = false;
            } else if (pass.length < 6) {
                showFieldError('reg-password', 'Password must be at least 6 characters');
                valid = false;
            }

            if (!valid) return;

            const btn = registerForm.querySelector('button');
            performAuth(btn, 'Create Account', 'register', { name, email, password: pass });
        });
    }
});

// ============================================================
// Validation Helpers
// ============================================================
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFieldError(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.style.borderColor = '#ef4444';
    input.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.3)';

    // Create error message element
    const errorEl = document.createElement('div');
    errorEl.className = 'field-error';
    errorEl.textContent = message;
    errorEl.style.cssText = 'color:#ef4444; font-size:0.8rem; margin-top:0.35rem; font-weight:500;';
    input.parentNode.appendChild(errorEl);
}

function clearErrors() {
    document.querySelectorAll('.field-error').forEach(el => el.remove());
    document.querySelectorAll('.form-input').forEach(input => {
        input.style.borderColor = '';
        input.style.boxShadow = '';
    });
}

// ============================================================
// Auth API Call
// ============================================================
async function performAuth(btn, originalText, type, payload) {
    btn.innerHTML = 'Securely Authenticating...';
    btn.disabled = true;
    
    try {
        const res = await fetch(`backend/api/auth.php?action=${type}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        
        if (data.success) {
            // Save authentic user token/session
            localStorage.setItem('aura_user', JSON.stringify(data.user));
            
            btn.innerHTML = 'Success ✓ Redirecting...';
            btn.style.background = '#10b981'; 
            btn.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.4)';
            
            setTimeout(() => {
                window.location.href = data.user.role === 'admin' ? 'admin.html' : 'index.html';
            }, 800);
        } else {
             alert(data.error || "Authentication failed.");
             btn.innerHTML = originalText;
             btn.disabled = false;
        }
    } catch (e) {
        alert("Server Error. Please ensure XAMPP MySQL and Apache are running.");
        console.error(e);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}
