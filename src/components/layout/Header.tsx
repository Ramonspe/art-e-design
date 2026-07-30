import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { Search, ShoppingCart, Menu, X, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { CONTACT } from "@/data/contact";
import logo from "@/assets/logo.png";

const nav = [
  { to: "/", label: "Início" },
  { to: "/produtos", label: "Produtos" },
  { to: "/personalizado", label: "Personalizado" },
  { to: "/contato", label: "Contato" },
];

const Header = () => {
  const { count } = useCart();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  useEffect(() => { setQ(params.get("q") || ""); }, [params]);
  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/produtos?q=${encodeURIComponent(term)}` : "/produtos");
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="bg-primary text-primary-foreground text-xs">
        <div className="container flex h-8 items-center justify-between">
          <span className="hidden sm:inline">Personalize com sua arte</span>
          <span>WhatsApp {CONTACT.whatsappDisplay}</span>
        </div>
      </div>
      <div className="container flex h-20 items-center gap-6">
        <Link to="/" className="flex items-center gap-3 shrink-0" aria-label="Art & Personalizados">
          <img src={logo} alt="Art & Personalizados" className="h-14 w-14 object-contain" />
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-base font-bold text-primary">Art & Personalizados</span>
            <span className="text-[11px] text-muted-foreground tracking-wide uppercase">Gráfica & Personalizados</span>
          </div>
        </Link>

        <form
          onSubmit={submitSearch}
          className="hidden md:flex flex-1 max-w-xl items-center rounded-full border border-border bg-muted px-4 h-11 focus-within:ring-2 focus-within:ring-ring"
        >
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="O que você procura hoje?"
            className="flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Buscar produtos"
          />
        </form>

        <nav className="hidden lg:flex items-center gap-1 ml-auto">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) =>
                `px-3 py-2 text-sm font-medium rounded-md transition-smooth ${
                  isActive ? "text-primary" : "text-foreground/70 hover:text-primary"
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 ml-auto lg:ml-0">
          <Link to={user ? "/conta" : "/auth"} aria-label="Minha conta">
            <Button variant="ghost" size="icon"><User className="h-5 w-5" /></Button>
          </Link>
          <Link to="/carrinho" aria-label="Carrinho" className="relative">
            <Button variant="ghost" size="icon"><ShoppingCart className="h-5 w-5" /></Button>
            {count > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-cta px-1 text-[10px] font-bold text-cta-foreground">{count}</span>
            )}
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <div className="container py-3 space-y-1">
            <form onSubmit={submitSearch} className="flex md:hidden items-center rounded-full border border-border bg-muted px-4 h-10 mb-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." className="flex-1 bg-transparent px-3 text-sm outline-none" />
            </form>
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-sm font-medium ${
                    isActive ? "bg-muted text-primary" : "text-foreground/80 hover:bg-muted"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
