import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: "md" | "sm";
}

export function Button({ variant = "secondary", size = "md", className, ...rest }: ButtonProps) {
  const classes = [styles.btn, styles[variant], size === "sm" ? styles.sm : "", className]
    .filter(Boolean)
    .join(" ");
  return <button type="button" className={classes} {...rest} />;
}
