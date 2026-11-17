import QRCode from "qrcode";
import { payloadEpc, type Virement } from "@/lib/virement-qr";

/**
 * Le QR code d'un virement, dessiné en SVG (net à toutes les tailles, rien à
 * télécharger). Fonctionne côté serveur comme dans le navigateur.
 */
export function QrVirement({ virement, taille = 176, className = "" }: { virement: Virement; taille?: number; className?: string }) {
  const qr = QRCode.create(payloadEpc(virement), { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const marge = 2;
  let chemin = "";
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) if (qr.modules.get(y, x)) chemin += `M${x + marge} ${y + marge}h1v1h-1z`;
  return (
    <svg
      viewBox={`0 0 ${n + marge * 2} ${n + marge * 2}`}
      width={taille}
      height={taille}
      role="img"
      aria-label="QR code de virement : scannez-le avec l'application de votre banque"
      className={`rounded-xl bg-white ${className}`}
      shapeRendering="crispEdges"
    >
      <rect width="100%" height="100%" fill="#fff" />
      <path d={chemin} fill="#0f1e3d" />
    </svg>
  );
}
