"use client";

import { Button } from "@/components/ui/button";
import { useShell, type ToastTone } from "./shell-context";

/** Button that simply confirms a (simulated) action with a toast. */
export function ToastButton({
  message,
  tone = "success",
  ...props
}: React.ComponentProps<typeof Button> & { message: string; tone?: ToastTone }) {
  const { toast } = useShell();
  return <Button {...props} onClick={() => toast(message, tone)} />;
}
