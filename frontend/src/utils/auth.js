import { supabase } from './supabaseClient';

// Auth utility — Supabase-based authentication

export async function register(email, password, username) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { username }
        }
    });

    if (error) {
        return { success: false, error: error.message };
    }
    return { success: true, user: data.user };
}

export async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { success: false, error: error.message };
    }
    return { success: true, user: data.user, session: data.session };
}

export async function logout() {
    await supabase.auth.signOut();
}

export async function isLoggedIn() {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
}

export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user ? { email: user.email, username: user.user_metadata?.username } : null;
}

export async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
    });

    if (error) {
        return { success: false, error: error.message };
    }
    return { success: true };
}

export async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({
        password: newPassword
    });

    if (error) {
        return { success: false, error: error.message };
    }
    return { success: true };
}
