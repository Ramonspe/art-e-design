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

export const waLink = (msg = "Olá! Vim pelo site da Art & Personalizados e gostaria de mais informações.") =>
  `https://api.whatsapp.com/send?phone=${CONTACT.whatsappRaw}&text=${encodeURIComponent(msg)}`;
