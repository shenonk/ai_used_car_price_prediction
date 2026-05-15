import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../../utils/supabaseClient";

function ProtectedRoute({
  children,
  authMessage = "Please sign in to continue.",
  authSubMessage = "This feature is available only for logged-in users.",
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const [authState, setAuthState] = useState("loading");

  useEffect(() => {
    let isActive = true;

    const syncSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (isActive) {
          setAuthState(session ? "authorized" : "unauthorized");
        }
      } catch (error) {
        console.error("Unable to read auth session", error);
        if (isActive) {
          setAuthState("unauthorized");
        }
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
      subscription?.unsubscribe?.();
    };
  }, []);

  if (authState === "loading") {
    return (
      <div className="protected-route-loading">
        <div className="protected-route-spinner" />
        <p>{t("app.protected_loading")}</p>
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
