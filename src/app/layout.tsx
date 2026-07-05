import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AreaModal } from "@/components/customer/area-modal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlameGrill - Premium Burgers & Grills",
  description: "Order delicious handcrafted burgers, crispy chicken, loaded sides, and refreshing drinks from FlameGrill. Premium quality food delivered to your door.",
  icons: {
    icon: "/logo.svg",
  },
};

/* Inline script that runs BEFORE React hydrates — fetches branding and sets CSS variables.
   This prevents colour flash on first load. */
const brandingInitScript = `
(function(){
  try {
    var c = document.cookie.split('; ').find(function(r){return r.startsWith('fg-branding=')});
    if (c) {
      var b = JSON.parse(decodeURIComponent(c.split('=')[1]));
      if (b.ts && Date.now() - b.ts < 300000) {
        apply(b); return;
      }
    }
    fetch('/api/branding').then(function(r){return r.json()}).then(function(b){
      apply(b);
      document.cookie = 'fg-branding=' + encodeURIComponent(JSON.stringify(Object.assign({}, b, {ts:Date.now()}))) + ';path=/;max-age=300';
    }).catch(function(){});
  } catch(e) {}
  function apply(b) {
    var r = document.documentElement.style;
    r.setProperty('--brand-color', b.primaryColor || '#DC2626');
    r.setProperty('--brand-secondary', b.secondaryColor || '#1E3A5F');
    r.setProperty('--brand-accent', b.accentColor || '#F59E0B');
    r.setProperty('--brand-fg', '#FFFFFF');
    /* Derive hover shade */
    r.setProperty('--brand-color-hover', darken(b.primaryColor || '#DC2626', 15));
    r.setProperty('--brand-color-light', (b.primaryColor || '#DC2626') + '1A');
    r.setProperty('--brand-color-lighter', (b.primaryColor || '#DC2626') + '0D');
    r.setProperty('--brand-color-shadow', (b.primaryColor || '#DC2626') + '40');
  }
  function darken(hex, pct) {
    var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    r = Math.max(0, Math.round(r * (1 - pct/100)));
    g = Math.max(0, Math.round(g * (1 - pct/100)));
    b = Math.max(0, Math.round(b * (1 - pct/100)));
    return '#' + [r,g,b].map(function(c){return c.toString(16).padStart(2,'0')}).join('');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: brandingInitScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <AreaModal />
        <Toaster />
      </body>
    </html>
  );
}