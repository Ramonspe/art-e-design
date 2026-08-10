import { describe, expect, it } from "vitest";
import { parseShippingQuotes } from "./shipping";

describe("SuperFrete quotes", () => {
  it("normalizes valid delivery options returned by the server", () => {
    expect(parseShippingQuotes([{
      service_id: 2,
      label: "SEDEX",
      price: 24.5,
      delivery_min: 2,
      delivery_max: 3,
    }])).toEqual([{
      serviceId: 2,
      label: "SEDEX",
      price: 24.5,
      deliveryMin: 2,
      deliveryMax: 3,
    }]);
  });

  it("does not expose malformed shipping options to checkout", () => {
    expect(parseShippingQuotes([{ service_id: "invalid", price: 10, delivery_min: 1, delivery_max: 2 }])).toEqual([]);
  });
});
