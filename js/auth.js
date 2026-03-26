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
            loginView.style.display = 'none';
            registerView.style.display = 'block';
            registerView.classList.add('animate-fade-in');
            document.title = 'Register | Aura';
        });

        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            registerView.style.display = 'none';
            loginView.style.display = 'block';
            loginView.classList.add('animate-fade-in');
            document.title = 'Sign In | Aura';
        });
    }

    // Secure Database API Submissions
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            const btn = loginForm.querySelector('button');
            performAuth(btn, 'Sign In', 'login', { email, password: pass });
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('reg-email').value;
            const pass = document.getElementById('reg-password').value;
            const name = document.getElementById('reg-name').value;
            const btn = registerForm.querySelector('button');
            performAuth(btn, 'Create Account', 'register', { name, email, password: pass });
        });
    }
});

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
