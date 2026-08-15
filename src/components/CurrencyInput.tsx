"use client";

import { ChangeEvent, InputHTMLAttributes } from "react";

type CurrencyInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
> & {
  /** Valor decimal em string (ex: "12.50") ou "" quando vazio. */
  value: string;
  onChange: (value: string) => void;
  /** Valor máximo permitido (opcional). */
  max?: number;
};

/**
 * Input com máscara monetária no padrão brasileiro (0,00).
 * Os dígitos digitados são interpretados da direita para a esquerda,
 * como em um caixa eletrônico: "1250" vira "12,50".
 */
export default function CurrencyInput({
  value,
  onChange,
  max,
  placeholder = "0,00",
  ...rest
}: CurrencyInputProps) {
  const display =
    value === ""
      ? ""
      : Number(value).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, "");
    if (digits === "") {
      onChange("");
      return;
    }
    let parsed = parseInt(digits, 10) / 100;
    if (max !== undefined && parsed > max) parsed = max;
    onChange(parsed.toFixed(2));
  }

  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      value={display}
      onChange={handleChange}
    />
  );
}
