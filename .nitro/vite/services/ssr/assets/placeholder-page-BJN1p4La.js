import { W as jsxRuntimeExports } from "./server-jgJDFZ6n.js";
function PlaceholderPage({ title, subtitle, icon: Icon }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-7 w-7" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-foreground", children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 max-w-xl text-sm leading-6 text-muted-foreground", children: subtitle })
  ] });
}
export {
  PlaceholderPage as P
};
