const digitsOnly = (value: string) => value.replace(/\D/g, "");

export const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const formatCpf = (value: string) => {
  const digits = digitsOnly(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

export const formatCep = (value: string) => {
  const digits = digitsOnly(value).slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, "$1-$2");
};

export const formatPhone = (value: string) => {
  const digits = digitsOnly(value).slice(0, 11);
  if (digits.length <= 2) return digits.replace(/(\d{0,2})/, "($1");
  if (digits.length <= 10) return digits.replace(/(\d{2})(\d{0,4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
};

export const isValidCpf = (value: string) => {
  const cpf = digitsOnly(value);
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;

  const digitAt = (length: number) => {
    const sum = cpf.slice(0, length).split("").reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return digitAt(9) === Number(cpf[9]) && digitAt(10) === Number(cpf[10]);
};

export const isValidBrazilianPhone = (value: string) => {
  const phone = digitsOnly(value);
  return /^(?:[1-9]\d)(?:9\d{8}|[2-9]\d{7})$/.test(phone);
};

export const cleanDigits = digitsOnly;
