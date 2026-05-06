import { MessageCircle } from "lucide-react";
import { waLink } from "@/data/contact";

const WhatsAppFloat = () => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.open(waLink(), "_blank", "noopener,noreferrer");
  };

  return (
    <a
      href={waLink()}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-elegant hover:scale-110 transition-smooth"
    >
      <MessageCircle className="h-7 w-7" fill="currentColor" />
      <span className="absolute -top-1 -right-1 flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366] opacity-75"></span>
        <span className="relative inline-flex h-3 w-3 rounded-full bg-[#25D366]"></span>
      </span>
    </a>
  );
};

export default WhatsAppFloat;
