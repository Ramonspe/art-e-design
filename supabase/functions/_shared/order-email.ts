type OrderEmailInput = {
  customer_email: string;
  customer_name: string;
  order_number: number;
  status: string;
  total: number | string;
};

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
})[character] ?? character);

const formatBRL = (value: number | string) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const messageForStatus = (status: string) => {
  const messages: Record<string, { title: string; description: string }> = {
    pendente: { title: "Pedido recebido", description: "Recebemos seu pedido e estamos aguardando a confirmação do pagamento." },
    confirmado: { title: "Pagamento confirmado", description: "Seu pagamento foi aprovado e seu pedido seguirá para produção." },
    em_producao: { title: "Pedido em produção", description: "Nossa equipe já está preparando o seu pedido." },
    enviado: { title: "Pedido enviado", description: "Seu pedido foi despachado. Em breve ele chegará ao endereço informado." },
    entregue: { title: "Pedido entregue", description: "Seu pedido foi marcado como entregue. Esperamos que você aproveite!" },
    cancelado: { title: "Pedido cancelado", description: "O pedido foi cancelado. Se precisar de ajuda, fale com nossa equipe." },
  };
  return messages[status] ?? messages.pendente;
};

export async function sendOrderStatusEmail(order: OrderEmailInput) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL");
  if (!apiKey || !from) {
    console.warn("Order email skipped: RESEND_API_KEY or RESEND_FROM_EMAIL is not configured", { orderNumber: order.order_number });
    return { sent: false, skipped: true };
  }

  const status = messageForStatus(order.status);
  const customerName = escapeHtml(order.customer_name || "cliente");
  const protocol = `#${order.order_number}`;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [order.customer_email],
        subject: `${status.title} — protocolo ${protocol}`,
        html: `<main style="font-family:Arial,sans-serif;color:#2f251e;max-width:600px;margin:auto"><h1 style="font-size:24px">${status.title}</h1><p>Olá, ${customerName}.</p><p>${status.description}</p><p><strong>Protocolo:</strong> ${protocol}<br><strong>Total do pedido:</strong> ${formatBRL(order.total)}</p><p>Guarde este protocolo para acompanhar o pedido. Em caso de dúvida, responda a este e-mail ou fale com a Art & Personalizados.</p></main>`,
        text: `Olá, ${order.customer_name}. ${status.description}\n\nProtocolo: ${protocol}\nTotal do pedido: ${formatBRL(order.total)}\n\nGuarde este protocolo para acompanhar o pedido.`,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error("Order email failed", { orderNumber: order.order_number, status: response.status, details });
      return { sent: false, skipped: false };
    }
    return { sent: true, skipped: false };
  } catch (error: unknown) {
    console.error("Order email request failed", { orderNumber: order.order_number, error: error instanceof Error ? error.message : "Unknown error" });
    return { sent: false, skipped: false };
  }
}
