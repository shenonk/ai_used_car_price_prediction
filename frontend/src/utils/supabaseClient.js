import { createClient } from '@supabase/supabase-js';

const env = import.meta.env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

function createConfigError() {
  return {
    message:
      'Supabase is not configured for the frontend app. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the app env.',
  };
}

function createNoopSupabaseClient() {
  const configError = createConfigError();

  const createQueryBuilder = () => {
    const builder = {
      then(onFulfilled, onRejected) {
        return Promise.resolve({ data: null, error: configError, count: 0 }).then(onFulfilled, onRejected);
      },
    };

    const chainableMethods = [
      'select',
      'insert',
      'update',
      'upsert',
      'delete',
      'eq',
      'neq',
      'gt',
      'gte',
      'lt',
      'lte',
      'like',
      'ilike',
      'in',
      'contains',
      'containedBy',
      'is',
      'match',
      'or',
      'filter',
      'order',
      'limit',
      'range',
      'single',
      'maybeSingle',
    ];

    chainableMethods.forEach((method) => {
      builder[method] = () => builder;
    });

    return builder;
  };

  return {
    auth: {
      async signUp() {
        return { data: { user: null, session: null }, error: configError };
      },
      async signInWithPassword() {
        return { data: { user: null, session: null }, error: configError };
      },
      async signOut() {
        return { error: null };
      },
      async getSession() {
        return { data: { session: null }, error: configError };
      },
      async getUser() {
        return { data: { user: null }, error: configError };
      },
      async resetPasswordForEmail() {
        return { data: null, error: configError };
      },
      async updateUser() {
        return { data: { user: null }, error: configError };
      },
      async signInWithOAuth() {
        return { data: null, error: configError };
      },
      onAuthStateChange() {
        return {
          data: {
            subscription: {
              unsubscribe() {},
            },
          },
        };
      },
    },
    from() {
      return createQueryBuilder();
    },
    storage: {
      from() {
        return {
          async upload() {
            return { data: null, error: configError };
          },
          getPublicUrl() {
            return { data: { publicUrl: '' } };
          },
        };
      },
    },
  };
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createNoopSupabaseClient();

export { isSupabaseConfigured };
