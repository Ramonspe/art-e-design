import { describe, expect, it } from "vitest";
import { getPaymentFeedback } from "@/lib/order-payment";

describe("getPaymentFeedback", () => {
  it("só apresenta pagamento recebido quando o status do pedido está aprovado", () => {
    expect(getPaymentFeedback("pending")).toBe("pending");
    expect(getPaymentFeedback("approved")).toBe("approved");
  });

  it("apresenta uma orientação de nova tentativa para pagamentos recusados", () => {
    expect(getPaymentFeedback("rejected")).toBe("rejected");
  });
});
