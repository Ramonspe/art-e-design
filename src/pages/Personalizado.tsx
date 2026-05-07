import { useState } from "react";
import { Link } from "react-router-dom";
import { Upload, ArrowRight, Palette, FileImage, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { openWhatsApp, waLink } from "@/data/contact";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(100),
  contact: z.string().trim().min(8, "Contato inválido").max(60),
  productType: z.string().trim().min(2).max(80),
  size: z.string().trim().max(80),
  quantity: z.string().trim().min(1).max(20),
  notes: z.string().max(800).optional(),
});

const Personalizado = () => {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());
    const parsed = schema.safeParse(data);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message || "Verifique os campos"); return; }
    if (file && file.size > 20 * 1024 * 1024) { toast.error("Arquivo maior que 20MB"); return; }

    setSubmitting(true);
    try {
      let fileUrl = "";
      if (file) {
        const path = `arts/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error } = await supabase.storage.from("custom-uploads").upload(path, file);
        if (error) throw error;
        fileUrl = path;
      }
      const msg = `Pedido de orçamento personalizado\n\nNome: ${parsed.data.name}\nContato: ${parsed.data.contact}\nProduto: ${parsed.data.productType}\nTamanho: ${parsed.data.size || "-"}\nQuantidade: ${parsed.data.quantity}\nObs: ${parsed.data.notes || "-"}${fileUrl ? `\nArquivo enviado: ${fileUrl}` : ""}`;
      toast.success("Pedido enviado!", { description: "Abrindo WhatsApp para confirmação..." });
      setTimeout(() => openWhatsApp(msg), 600);
      (e.target as HTMLFormElement).reset();
      setFile(null);
    } catch (err: any) {
      toast.error("Falha ao enviar", { description: err.message });
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      <section className="bg-gold-gradient text-primary-foreground">
        <div className="container py-16 text-center">
          <span className="inline-block rounded-full bg-cta text-cta-foreground px-3 py-1 text-xs font-bold uppercase tracking-wider">Personalização sob medida</span>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold">Sua arte, nosso acabamento.</h1>
          <p className="mt-4 max-w-2xl mx-auto text-primary-foreground/90">Escolha um modelo pronto e edite, ou envie sua própria arte para receber um orçamento personalizado.</p>
        </div>
      </section>

      <section className="container py-14">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="group rounded-2xl border-2 border-border bg-card p-8 hover:border-primary transition-smooth">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary"><Palette className="h-7 w-7" /></div>
            <h2 className="mt-5 text-2xl font-bold">Escolher um modelo pronto</h2>
            <p className="mt-3 text-muted-foreground">Navegue pela nossa coleção de produtos personalizáveis com templates editáveis e modifique conforme sua necessidade.</p>
            <ul className="mt-5 space-y-2 text-sm">
              <li>✓ Mais de 100 modelos prontos</li>
              <li>✓ Pronto para personalizar nome, foto e cores</li>
              <li>✓ Compra direta pelo site</li>
            </ul>
            <Button asChild variant="gold" size="lg" className="mt-7"><Link to="/produtos">Ver modelos prontos <ArrowRight className="h-4 w-4" /></Link></Button>
          </div>

          <div className="group rounded-2xl border-2 border-cta bg-card p-8 hover:shadow-elegant transition-smooth">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cta/10 text-cta"><FileImage className="h-7 w-7" /></div>
            <h2 className="mt-5 text-2xl font-bold">Enviar minha própria arte</h2>
            <p className="mt-3 text-muted-foreground">Você já tem o arquivo pronto? Envie para nossa análise e receberá um orçamento personalizado via WhatsApp.</p>
            <ul className="mt-5 space-y-2 text-sm">
              <li>✓ Aceitamos PDF, AI, PSD, PNG, JPG</li>
              <li>✓ Retorno em até 24h úteis</li>
              <li>✓ Suporte com nossa equipe de arte</li>
            </ul>
            <a href="#enviar-arte" className="inline-flex"><Button variant="cta" size="lg" className="mt-7">Enviar arte agora <ArrowRight className="h-4 w-4" /></Button></a>
          </div>
        </div>
      </section>

      <section id="enviar-arte" className="container py-10">
        <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-card p-8 shadow-card-soft">
          <h2 className="text-2xl font-bold">Envie sua arte para orçamento</h2>
          <p className="text-sm text-muted-foreground mt-1">Preencha os dados abaixo. Não há cobrança automática — analisamos e retornamos pelo WhatsApp.</p>

          <form onSubmit={onSubmit} className="mt-6 grid sm:grid-cols-2 gap-4">
            <Field label="Seu nome" name="name" required />
            <Field label="WhatsApp ou e-mail" name="contact" required />
            <Field label="Tipo de produto desejado" name="productType" placeholder="Ex.: Camiseta, Banner, Caneca" required wrapperClass="sm:col-span-2" />
            <Field label="Tamanho / dimensões" name="size" placeholder="Ex.: 1m x 2m, Tam. M" />
            <Field label="Quantidade" name="quantity" type="number" min={1} required />

            <div className="sm:col-span-2">
              <label className="text-xs font-medium mb-1 block">Observações (opcional)</label>
              <textarea name="notes" rows={3} maxLength={800} className="w-full rounded-md border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-medium mb-2 block">Arquivo de arte</label>
              <label htmlFor="art-file" className="flex flex-col items-center justify-center gap-2 p-8 rounded-lg border-2 border-dashed border-border bg-muted/30 hover:border-primary cursor-pointer transition-smooth">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">{file ? file.name : "Clique para enviar ou arraste o arquivo"}</span>
                <span className="text-xs text-muted-foreground">PDF, AI, PSD, PNG, JPG • até 20MB</span>
                <input id="art-file" type="file" className="hidden" accept=".pdf,.ai,.psd,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>

            <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3 mt-2">
              <Button type="submit" variant="cta" size="lg" className="flex-1" disabled={submitting}>{submitting ? "Enviando..." : "Enviar para análise"}</Button>
              <Button type="button" variant="outline" size="lg" asChild>
                <a href={waLink()} onClick={(e) => { e.preventDefault(); openWhatsApp(); }} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> Falar no WhatsApp</a>
              </Button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

const Field = ({ label, wrapperClass = "", ...props }: { label: string; wrapperClass?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className={wrapperClass}>
    <label className="text-xs font-medium mb-1 block">{label}</label>
    <input {...props} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
  </div>
);

export default Personalizado;
