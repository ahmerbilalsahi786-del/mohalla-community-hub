import { e as ue } from "./router-BL8uHQDh.js";
function toast({ title, description, variant }) {
  const message = title ?? "";
  const opts = description ? { description } : void 0;
  if (variant === "destructive") return ue.error(message, opts);
  return ue(message, opts);
}
function useToast() {
  return { toast };
}
export {
  useToast as u
};
