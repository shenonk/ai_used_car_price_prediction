import { Component } from "react";
import i18n from "../i18n";

class AppRouteBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(previousProps) {
    if (previousProps.locationKey !== this.props.locationKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error, info) {
    console.error("Route render failed", error, info);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="app-route-error">
        <span>{i18n.t("app.page_error")}</span>
        <h1>{i18n.t("app.page_error_title")}</h1>
        <p>{this.state.error?.message || "The page failed to render. Please refresh and try again."}</p>
        <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
          {i18n.t("app.reload_page", { defaultValue: "Reload page" })}
        </button>
      </div>
    );
  }
}

export default AppRouteBoundary;
