import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setAuthTokenGetter } from "./lib/custom-fetch";
import { getToken } from "./lib/auth";

// Wire the auth token into every API call made via customFetch
setAuthTokenGetter(() => getToken());

createRoot(document.getElementById("root")!).render(<App />);
