export const CONTACT = {
  whatsappRaw: "5511992862300",
  whatsappDisplay: "+55 (11) 9 9286-2300",
  instagram: "TecnoBrin",
  facebook: "TecnoBrin",
  instagramUrl: "https://instagram.com/TecnoBrin",
  facebookUrl: "https://facebook.com/TecnoBrin",
  email: "contato@artepersonalizados.com.br",
  address: "Rua Joracy Camargo, 204 - Jordanópolis, São Bernardo do Campo - SP",
  brand: "Art & Personalizados",
};

export const DEFAULT_WHATSAPP_MESSAGE = "Vim pelo site da Art Personalizados e gostaria de mais informações!";

export const waLink = (msg = DEFAULT_WHATSAPP_MESSAGE) =>
  `https://web.whatsapp.com/send?phone=${CONTACT.whatsappRaw}&text=${encodeURIComponent(msg)}`;

export const openWhatsApp = (msg = DEFAULT_WHATSAPP_MESSAGE) => {
  window.location.assign(waLink(msg));
};
