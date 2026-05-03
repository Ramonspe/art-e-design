import { Phone, Mail, MapPin, Instagram, Facebook, MessageCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONTACT, waLink } from "@/data/contact";

const Contato = () => (
  <div>
    <section className="bg-primary text-primary-foreground">
      <div className="container py-14">
        <h1 className="text-4xl font-bold">Fale com a Art & Personalizados</h1>
        <p className="mt-3 text-primary-foreground/85 max-w-2xl">Estamos prontos para tirar suas dúvidas, fazer orçamentos e ajudar com seu projeto personalizado.</p>
      </div>
    </section>

    <section className="container py-14 grid md:grid-cols-2 gap-8">
      <div className="space-y-5">
        <Card icon={<MessageCircle className="h-5 w-5" />} title="WhatsApp" subtitle="Resposta rápida em horário comercial">
          <a href={waLink()} target="_blank" rel="noreferrer" className="text-primary font-semibold hover:underline">{CONTACT.whatsappDisplay}</a>
        </Card>
        <Card icon={<Phone className="h-5 w-5" />} title="Telefone">
          <p>{CONTACT.whatsappDisplay}</p>
        </Card>
        <Card icon={<Mail className="h-5 w-5" />} title="E-mail">
          <a href={`mailto:${CONTACT.email}`} className="text-primary font-semibold hover:underline">{CONTACT.email}</a>
        </Card>
        <Card icon={<MapPin className="h-5 w-5" />} title="Endereço">
          <p className="text-sm">{CONTACT.address}</p>
        </Card>
        <Card icon={<Clock className="h-5 w-5" />} title="Horário de atendimento">
          <p className="text-sm">Segunda a sexta — 9h às 18h<br />Sábados — 9h às 13h</p>
        </Card>
        <div className="flex gap-3 pt-2">
          <a href={CONTACT.instagramUrl} target="_blank" rel="noreferrer" className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-secondary transition-smooth" aria-label="Instagram"><Instagram className="h-5 w-5" /></a>
          <a href={CONTACT.facebookUrl} target="_blank" rel="noreferrer" className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-secondary transition-smooth" aria-label="Facebook"><Facebook className="h-5 w-5" /></a>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8">
        <h2 className="text-2xl font-bold">Envie uma mensagem</h2>
        <p className="text-sm text-muted-foreground mt-1">Preencha o formulário e responderemos em breve.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const msg = `Olá! Sou ${fd.get("name")}.\n${fd.get("message")}`;
            window.open(waLink(msg), "_blank");
          }}
          className="mt-6 space-y-4"
        >
          <Input label="Seu nome" name="name" required />
          <Input label="E-mail ou telefone" name="contact" required />
          <div>
            <label className="text-xs font-medium mb-1 block">Mensagem</label>
            <textarea name="message" rows={5} required maxLength={1000} className="w-full rounded-md border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <Button type="submit" variant="cta" size="lg" className="w-full"><MessageCircle className="h-5 w-5" /> Enviar via WhatsApp</Button>
        </form>
      </div>
    </section>
  </div>
);

const Card = ({ icon, title, subtitle, children }: any) => (
  <div className="flex gap-4 p-5 rounded-xl border border-border bg-card">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div>
    <div>
      <h3 className="font-semibold">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      <div className="mt-1">{children}</div>
    </div>
  </div>
);

const Input = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <label className="text-xs font-medium mb-1 block">{label}</label>
    <input {...props} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
  </div>
);

export default Contato;
