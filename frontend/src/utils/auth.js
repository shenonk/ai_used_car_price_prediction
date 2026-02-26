// Auth utility — localStorage-based authentication
// Default admin: admin@gmail.com / 1234

const USERS_KEY = 'carpriceai_users';
const SESSION_KEY = 'carpriceai_session';

// Initialize default admin account if none exist
function initDefaults() {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.length === 0) {
        users.push({ email: 'admin@gmail.com', password: '1234' });
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
}

export function register(email, password) {
    initDefaults();
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
        return { success: false, error: 'An account with this email already exists.' };
    }
    users.push({ email, password });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return { success: true };
}

export function login(email, password) {
    initDefaults();
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) {
        return { success: false, error: 'Invalid email or password.' };
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email, loggedInAt: Date.now() }));
    return { success: true };
}

export function logout() {
    localStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn() {
    return !!localStorage.getItem(SESSION_KEY);
}

export function getCurrentUser() {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    return session ? session.email : null;
}
