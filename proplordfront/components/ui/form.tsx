"use client";

import { ChevronDown } from "lucide-react";
import { useFormStatus } from "react-dom";
import type { ChangeEvent } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

const control =
  "w-full rounded-full border border-input bg-background px-5 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-4 focus:ring-ring/20";

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  hint?: string;
  minLength?: number;
  required?: boolean;
  placeholder?: string;
  step?: string;
  min?: string;
  max?: string;
  defaultValue?: string;
  value?: string;
  readOnly?: boolean;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Spans every column of a multi-column `ActionForm`. */
  wide?: boolean;
};

export function Field({
  label,
  hint,
  required = true,
  type = "text",
  wide,
  ...props
}: FieldProps) {
  return (
    <label className={cn("block", wide && "col-span-full")}>
      <span className="mb-1.5 block px-2 text-sm font-semibold">{label}</span>
      <input type={type} required={required} className={control} {...props} />
      {hint && (
        <span className="mt-1.5 block px-2 text-xs text-muted-foreground">{hint}</span>
      )}
    </label>
  );
}

export function SelectField({
  label,
  name,
  options,
  required = true,
  hint,
  emptyLabel,
  wide,
  value,
  defaultValue,
  onChange,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  required?: boolean;
  hint?: string;
  emptyLabel?: string;
  wide?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className={cn("block", wide && "col-span-full")}>
      <span className="mb-1.5 block px-2 text-sm font-semibold">{label}</span>
      <div className="relative">
        <select
          name={name}
          required={required}
          className={cn(control, "appearance-none truncate pr-11")}
          {...(value === undefined ? { defaultValue } : { value })}
          onChange={onChange && ((e) => onChange(e.target.value))}
        >
          {(emptyLabel || !required) && <option value="">{emptyLabel ?? "None"}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
      </div>
      {hint && (
        <span className="mt-1.5 block px-2 text-xs text-muted-foreground">{hint}</span>
      )}
    </label>
  );
}

export function SubmitButton({
  children,
  variant = "primary",
  fullWidth = true,
}: {
  children: string;
  variant?: "primary" | "accent";
  fullWidth?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      size="lg"
      disabled={pending}
      className={fullWidth ? "w-full" : undefined}
    >
      {pending ? "Please wait..." : children}
    </Button>
  );
}

export function FormError({ message, className }: { message?: string; className?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className={cn("rounded-md bg-destructive px-5 py-3 text-sm font-semibold text-destructive-foreground", className)}>
      {message}
    </p>
  );
}
