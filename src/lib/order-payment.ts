export type PaymentFeedback = "approved" | "rejected" | "pending";

export const getPaymentFeedback = (paymentStatus?: string | null, orderStatus?: string): PaymentFeedback => {
  const status = (paymentStatus || orderStatus || "pending").toLowerCase();
  if (["approved", "pago", "paid"].includes(status)) return "approved";
  if (["rejected", "cancelled", "failed", "cancelado"].includes(status)) return "rejected";
  return "pending";
};

export const getOrderConfirmationPath = (orderId: string) =>
  `/pedido-confirmado?order=${encodeURIComponent(orderId)}`;
