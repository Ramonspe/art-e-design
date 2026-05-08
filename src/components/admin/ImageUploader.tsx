import { useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  bucket?: string;
  multiple?: boolean;
  value: string[]; // public URLs
  onChange: (urls: string[]) => void;
  hint?: string;
  recommended?: string; // e.g. "1920x800 px"
  pathPrefix?: string;
};

export const ImageUploader = ({
  bucket = "product-images",
  multiple = true,
  value,
  onChange,
  hint,
  recommended,
  pathPrefix = "",
}: Props) => {
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "jpg";
        const key = `${pathPrefix}${pathPrefix ? "/" : ""}${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from(bucket).upload(key, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });
        if (error) throw error;
        const { data } = supabase.storage.from(bucket).getPublicUrl(key);
        uploaded.push(data.publicUrl);
      }
      onChange(multiple ? [...value, ...uploaded] : uploaded);
      toast.success(`${uploaded.length} imagem(ns) enviada(s)`);
    } catch (e: any) {
      toast.error("Falha no upload", { description: e.message });
    } finally {
      setUploading(false);
    }
  };

  const remove = (i: number) => {
    const next = [...value];
    next.splice(i, 1);
    onChange(next);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center justify-center gap-2 px-4 py-6 rounded-md border-2 border-dashed border-input bg-background hover:border-primary cursor-pointer transition-smooth">
        {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
        <span className="text-sm font-medium">
          {uploading ? "Enviando..." : multiple ? "Selecionar imagens do computador" : "Selecionar imagem"}
        </span>
        <input
          type="file"
          accept="image/*"
          multiple={multiple}
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {recommended && (
        <p className="text-xs text-muted-foreground">📐 Tamanho recomendado: <strong>{recommended}</strong></p>
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
          {value.map((url, i) => (
            <div key={url + i} className="relative group rounded-md overflow-hidden border border-border bg-muted aspect-square">
              <img src={url} alt="" className="h-full w-full object-cover" />
              {multiple && i === 0 && (
                <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded">CAPA</span>
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-smooth"
                aria-label="Remover"
              >
                <X className="h-3 w-3" />
              </button>
              {multiple && value.length > 1 && (
                <div className="absolute bottom-1 left-1 right-1 flex justify-between opacity-0 group-hover:opacity-100">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                    className="px-1.5 py-0.5 bg-background/90 text-foreground text-xs rounded disabled:opacity-30">←</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1}
                    className="px-1.5 py-0.5 bg-background/90 text-foreground text-xs rounded disabled:opacity-30">→</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
