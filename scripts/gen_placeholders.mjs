// Writes 20 placeholder posters (posters/01.svg … 20.svg).
// Replace them with the real glued-poster photos, same file names or
// change the paths in js/bikes.js.
import { writeFileSync } from "node:fs";

const tints = ["#d9d4c7", "#cfc9bb", "#ddd8cc", "#c9c3b6", "#d4cfc2"];
for (let i = 1; i <= 20; i += 1) {
  const n = String(i).padStart(2, "0");
  const tint = tints[i % tints.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1414" viewBox="0 0 1000 1414">
  <rect width="1000" height="1414" fill="${tint}"/>
  <rect x="40" y="40" width="920" height="1334" fill="none" stroke="#000" stroke-width="1.5"/>
  <line x1="40" y1="40" x2="960" y2="1374" stroke="#000" stroke-width="1"/>
  <line x1="960" y1="40" x2="40" y2="1374" stroke="#000" stroke-width="1"/>
  <rect x="380" y="652" width="240" height="110" fill="${tint}"/>
  <text x="500" y="722" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="56" font-weight="700">Plakat ${n}</text>
</svg>
`;
  writeFileSync(new URL(`../posters/${n}.svg`, import.meta.url), svg);
}
