import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/800.css";
import "@fontsource/montserrat/900.css";
import "@fontsource/montserrat/800-italic.css";
import "@fontsource/montserrat/900-italic.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./theme/global.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
