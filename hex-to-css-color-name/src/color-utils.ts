// @ts-ignore
import cssColorNames from 'css-color-names';
// @ts-ignore
import { getDeltaE00 } from 'delta-e';

// Color‐space conversion helpers
interface RGB { r: number; g: number; b: number; }
interface XYZ { x: number; y: number; z: number; }
interface Lab { L: number; a: number; b: number; }
interface colorCalculation { [key: string]: string }

export interface HexReplacement {
    index: number;
    originalText: string;
    newText: string;
}

export function hexToRgb(hex: string): RGB {
    const bigint = parseInt(hex.slice(1), 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

export function closestColorName(hex: string): { lab: string; euclidean?: string } {
    // if the first character is not '#', prepend it
    if (hex[0] !== '#') {
        hex = `#${hex}`;
    }

    const colorCalculation: { lab: string; euclidean?: string } = {
        lab: closestColorNameLab(hex)
    };

    if (process.env.MODE === 'TESTING') {
        colorCalculation.euclidean = calculateColorEuc(hex);
    }

    return colorCalculation;
}

function calculateColorEuc(hex: string) {
    const target = hexToRgb(hex);
    let best = { name: 'black', dist: Infinity };
    for (const [name, val] of Object.entries(cssColorNames)) {
        const c = hexToRgb(val as string);
        const d = (c.r - target.r) ** 2 + (c.g - target.g) ** 2 + (c.b - target.b) ** 2;
        if (d < best.dist) { best = { name, dist: d }; }
    }
    return best.name;
}

// from hex → linearized sRGB [0..1]
function hexToRgbLinear(hex: string): RGB {
    const { r, g, b } = hexToRgb(hex);
    const f = (v: number) => {
        v /= 255;
        return v <= 0.04045
            ? v / 12.92
            : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return { r: f(r), g: f(g), b: f(b) };
}

// linear sRGB → CIE‐XYZ
function rgbToXyz({ r, g, b }: RGB): XYZ {
    // sRGB→XYZ D65 matrix
    return {
        x: r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
        y: r * 0.2126729 + g * 0.7151522 + b * 0.0721750,
        z: r * 0.0193339 + g * 0.1191920 + b * 0.9503041
    };
}

// CIE‐XYZ → CIE‐Lab
function xyzToLab({ x, y, z }: XYZ): Lab {
    // D65 white point
    const Xn = 0.95047, Yn = 1.00000, Zn = 1.08883;
    const f = (t: number) => t > 0.008856
        ? Math.cbrt(t)
        : (7.787 * t) + (16 / 116);
    const fx = f(x / Xn), fy = f(y / Yn), fz = f(z / Zn);
    return {
        L: (116 * fy) - 16,
        a: 500 * (fx - fy),
        b: 200 * (fy - fz)
    };
}

// convenience: hex → Lab
function hexToLab(hex: string): Lab {
    const lin = hexToRgbLinear(hex);
    return xyzToLab(rgbToXyz(lin));
}

// 2. ΔE calculation
function deltaE00(c1: Lab, c2: Lab): number {
    return getDeltaE00(
        { L: c1.L, A: c1.a, B: c1.b },
        { L: c2.L, A: c2.a, B: c2.b }
    );
}

// 3. Find closest CSS name using ΔE
export function closestColorNameLab(hex: string): string {
    const targetLab = hexToLab(hex);
    let bestName = 'black';
    let bestDistance = Infinity;

    for (const [name, val] of Object.entries(cssColorNames)) {
        const lab = hexToLab(val as string);
        const d = deltaE00(targetLab, lab);
        if (d < bestDistance) {
            bestDistance = d;
            bestName = name;
        }
    }

    return bestName;
}

export function findHexReplacements(text: string): HexReplacement[] {
    const regex = /#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b/g;
    const replacements: HexReplacement[] = [];

    for (const match of text.matchAll(regex)) {
        let hex = match[0];
        if (hex.length === 4) {
            // convert 3-digit hex to 6-digit hex
            const r = hex[1], g = hex[2], b = hex[3];
            hex = `#${r}${r}${g}${g}${b}${b}`;
        }
        const colorName = closestColorName(hex);
        if (match.index !== undefined) {
            replacements.push({
                index: match.index,
                originalText: match[0],
                newText: colorName.lab
            });
        }
    }
    return replacements;
}