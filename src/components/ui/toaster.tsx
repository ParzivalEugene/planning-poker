"use client";

import * as React from "react";
import { Toaster as Sonner } from "sonner";

import { cn } from "@/lib/utils";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = React.forwardRef<React.ElementRef<typeof Sonner>, ToasterProps>(
  ({ className, ...props }, ref) => (
    <Sonner
      ref={ref}
      className={cn(className)}
      toastOptions={{
        classNames: {
          toast: "group border border-border bg-background text-foreground",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
      {...props}
    />
  ),
);
Toaster.displayName = "Toaster";

export { Toaster };
