import { Link } from "react-router-dom";
import { Instagram, Facebook, MapPin, Phone, Mail } from "lucide-react";
import { CONTACT, waLink } from "@/data/contact";

const Footer = () => (
  <footer className="mt-20 bg-primary text-primary-foreground">
    <div className="container py-14 grid gap-10 md:grid-cols-4">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gold-gradient font-bold">A&P</div>
          <span className="font-bold">Art & Personalizados</span>
        </div>
        <p className="text-sm text-primary-foreground/80">
          Gráfica especializada em produtos personalizados de qualidade para empresas e pessoas.
        </p>
      </div>

      <div>
        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider">Navegue</h3>
        <ul className="space-y-2 text-sm text-primary-foreground/80">
          <li><Link to="/" className="hover:text-accent">Início</Link></li>
          <li><Link to="/produtos" className="hover:text-accent">Produtos</Link></li>
          <li><Link to="/personalizado" className="hover:text-accent">Personalizado</Link></li>
          <li><Link to="/contato" className="hover:text-accent">Contato</Link></li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider">Contato</h3>
        <ul className="space-y-3 text-sm text-primary-foreground/80">
          <li className="flex gap-2"><Phone className="h-4 w-4 shrink-0 mt-0.5" /><a href={waLink()} target="_blank" rel="noreferrer" className="hover:text-accent">{CONTACT.whatsappDisplay}</a></li>
          <li className="flex gap-2"><Mail className="h-4 w-4 shrink-0 mt-0.5" /><a href={`mailto:${CONTACT.email}`} className="hover:text-accent">{CONTACT.email}</a></li>
          <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 mt-0.5" /><span>{CONTACT.address}</span></li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider">Redes Sociais</h3>
        <div className="flex gap-3">
          <a href={CONTACT.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/10 hover:bg-accent hover:text-accent-foreground transition-smooth">
            <Instagram className="h-5 w-5" />
          </a>
          <a href={CONTACT.facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/10 hover:bg-accent hover:text-accent-foreground transition-smooth">
            <Facebook className="h-5 w-5" />
          </a>
        </div>
        <p className="text-xs text-primary-foreground/60 mt-4">@{CONTACT.instagram}</p>
      </div>
    </div>
    <div className="border-t border-primary-foreground/10">
      <div className="container py-4 text-xs text-primary-foreground/60 flex flex-col md:flex-row justify-between gap-2">
        <span>© {new Date().getFullYear()} {CONTACT.brand}. Todos os direitos reservados.</span>
        <span>CNPJ a definir • São Bernardo do Campo, SP</span>
      </div>
    </div>
  </footer>
);

export default Footer;
