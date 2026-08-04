import { describe, expect, it } from "vitest";
import { formatCep, formatCpf, formatPhone, isValidBrazilianPhone, isValidCpf } from "./checkout";

describe("checkout field validation", () => {
  it("formats Brazilian document and contact fields without accepting extra digits", () => {
    expect(formatCpf("52998224725123")).toBe("529.982.247-25");
    expect(formatCep("010010001")).toBe("01001-000");
    expect(formatPhone("119876543219")).toBe("(11) 98765-4321");
  });

  it("validates CPF check digits and Brazilian phone length", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("529.982.247-24")).toBe(false);
    expect(isValidBrazilianPhone("(11) 98765-4321")).toBe(true);
    expect(isValidBrazilianPhone("(11) 987-4321")).toBe(false);
  });
});
