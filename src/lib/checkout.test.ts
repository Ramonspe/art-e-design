import { describe, expect, it } from "vitest";
import { replaceShippingAddressFromCep } from "./checkout";

describe("CEP address refresh", () => {
  it("replaces address fields and clears number and complement for a new CEP", () => {
    expect(replaceShippingAddressFromCep({
      shipping_cep: "09891-070",
      shipping_street: "Rua anterior",
      shipping_number: "100",
      shipping_complement: "Casa",
      shipping_district: "Bairro anterior",
      shipping_city: "São Bernardo do Campo",
      shipping_state: "SP",
    }, {
      street: "Rua nova",
      district: "Centro",
      city: "Teresina",
      state: "PI",
    })).toEqual({
      shipping_cep: "09891-070",
      shipping_street: "Rua nova",
      shipping_number: "",
      shipping_complement: "",
      shipping_district: "Centro",
      shipping_city: "Teresina",
      shipping_state: "PI",
    });
  });
});
