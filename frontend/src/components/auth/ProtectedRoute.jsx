import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";

function ProtectedRoute({
  children,
  authMessage = "Please sign in to continue.",
  authSubMessage = "This feature is available only for logged-in users.",
}) {
  const location = useLocation();
  const [authState, setAuthState] = useState("loading");

  useEffect(() => {
    let isActive = true;

    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isActive) {
        setAuthState(session ? "authorized" : "unauthorized");
      }
    };

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isActive) {
        setAuthState(session ? "authorized" : "unauthorized");
      }
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  if (authState === "loading") {
    return (
      <div className="theme-app-bg flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (authState !== "authorized") {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
          authMessage,
          authSubMessage,
        }}
      />
    );
  }

  return children;
}

export default ProtectedRoute;
