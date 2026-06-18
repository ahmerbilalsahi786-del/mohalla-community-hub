import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import { setAuthTokenGetter, setBaseUrl } from "./lib/custom-fetch";
import { getToken } from "./lib/auth";

setBaseUrl(import.meta.env.VITE_API_BASE_URL || null);

// Wire the auth token into every API call made via customFetch
setAuthTokenGetter(() => getToken());

createRoot(document.getElementById("root")!).render(<App />);
