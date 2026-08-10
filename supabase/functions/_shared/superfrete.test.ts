import { describe, expect, it } from "vitest";
import { parseQuotes } from "./superfrete";

describe("SuperFrete calculator response", () => {
  it("accepts the dimensions nested in packages returned by the calculator", () => {
    expect(parseQuotes([{
      id: 2,
      name: "SEDEX",
      price: 18.61,
      delivery_range: { min: 2, max: 3 },
      packages: [{
        dimensions: { height: "10", width: "15", length: "20" },
        weight: "0.3",
      }],
    }])).toEqual([{
      serviceId: 2,
      serviceName: "SEDEX",
      price: 18.61,
      deliveryMin: 2,
      deliveryMax: 3,
      volume: { height: 10, width: 15, length: 20, weight: 0.3 },
    }]);
  });
});
