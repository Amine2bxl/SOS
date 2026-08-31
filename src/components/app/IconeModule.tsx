import type { Module } from "@/components/app/modules";

const CHEMINS: Record<Module["icone"], string> = {
  boussole: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.2 5.8-2.4 5.6-5.6 2.4 2.4-5.6 5.6-2.4ZM12 10.8a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z",
  scan: "M3 7V5a2 2 0 0 1 2-2h2v2H5v2H3Zm16-2h-2V3h2a2 2 0 0 1 2 2v2h-2V5ZM5 17v2h2v2H5a2 2 0 0 1-2-2v-2h2Zm14 2v-2h2v2a2 2 0 0 1-2 2h-2v-2h2ZM3 11h18v2H3v-2Z",
  lettre: "M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm2 4v2h12V8H6Zm0 4v2h12v-2H6Zm0 4v2h7v-2H6Z",
  livre: "M4 3h9a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4V3Zm16 0h-2.2A4.98 4.98 0 0 1 18 6v13h2a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1Z",
  carte: "m9 2 6 2.4L20.4 2A1 1 0 0 1 22 3v15.3a1 1 0 0 1-.6.9L15 21.9 9 19.5l-5.4 2.4A1 1 0 0 1 2 21V5.7a1 1 0 0 1 .6-.9L9 2Zm0 2.4L4 6.5v12.2l5-2.2V4.4Zm2 12.2 4 1.6V7.4l-4-1.6v10.8Z",
  reglages: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm9.4 5.6-1.9-1.1a7.8 7.8 0 0 0 0-1l1.9-1.1a.6.6 0 0 0 .2-.8l-1.8-3.1a.6.6 0 0 0-.7-.3l-2.1.7a7.7 7.7 0 0 0-.9-.5l-.3-2.2a.6.6 0 0 0-.6-.5h-3.6a.6.6 0 0 0-.6.5l-.3 2.2c-.3.1-.6.3-.9.5l-2.1-.7a.6.6 0 0 0-.7.3L4.4 9.6a.6.6 0 0 0 .2.8l1.9 1.1a7.8 7.8 0 0 0 0 1l-1.9 1.1a.6.6 0 0 0-.2.8l1.8 3.1c.1.3.4.4.7.3l2.1-.7c.3.2.6.4.9.5l.3 2.2c0 .3.3.5.6.5h3.6c.3 0 .5-.2.6-.5l.3-2.2c.3-.1.6-.3.9-.5l2.1.7c.3.1.6 0 .7-.3l1.8-3.1a.6.6 0 0 0-.2-.8Z",
};

export function IconeModule({
  nom,
  className = "h-5 w-5",
}: {
  nom: Module["icone"];
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d={CHEMINS[nom]} />
    </svg>
  );
}
