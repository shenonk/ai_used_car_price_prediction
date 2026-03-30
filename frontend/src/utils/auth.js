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
    return user ? { 
        id: user.id,
        email: user.email, 
        username: user.user_metadata?.username,
        avatar_url: user.user_metadata?.avatar_url
    } : null;
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

function isAuthSessionMissingError(error) {
    return typeof error?.message === 'string' && error.message.toLowerCase().includes('auth session missing');
}

export async function updatePassword(newPassword) {
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            return {
                success: false,
                error: "Session expired. Please refresh the page or log in again before updating your password.",
                requiresRelogin: true,
                isSessionMissing: true,
            };
        }

        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            const isSessionMissing = isAuthSessionMissingError(error);
            return {
                success: false,
                error: isSessionMissing
                    ? "Auth session missing. Please refresh the page or log in again for security before updating your password."
                    : error.message,
                requiresRelogin: isSessionMissing,
                isSessionMissing,
            };
        }

        const { data: { session: refreshedSession }, error: refreshedSessionError } = await supabase.auth.getSession();

        if (refreshedSessionError || !refreshedSession) {
            await supabase.auth.signOut();
            return {
                success: true,
                requiresRelogin: true,
                message: "Password updated, please log in again.",
            };
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return {
                success: true,
                requiresRelogin: true,
                message: "Password updated, please log in again.",
            };
        }

        return { success: true, user, requiresRelogin: false };
    } catch (error) {
        const isSessionMissing = isAuthSessionMissingError(error);
        return {
            success: false,
            error: isSessionMissing
                ? "Auth session missing. Please refresh the page or log in again for security before updating your password."
                : error?.message || "Unable to update password right now. Please refresh the page and try again.",
            requiresRelogin: isSessionMissing,
            isSessionMissing,
        };
    }
}

export async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/'
        }
    });

    if (error) {
        return { success: false, error: error.message };
    }
    return { success: true };
}
