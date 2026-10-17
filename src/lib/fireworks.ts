// Fuegos artificiales compartidos (hero y festejo de gol).
// La librería se descarga recién la primera vez que se usa.
import type { Fireworks, FireworksOptions } from 'fireworks-js';

export const isLightTheme = () => !document.documentElement.classList.contains('dark');

// De día los colores van más oscuros para que se vean sobre el fondo claro
// y además más gruesos y con más estela.
export const themeColors = (light: boolean): FireworksOptions =>
  light
    ? {
        hue: { min: 195, max: 212 }, // celeste
        brightness: { min: 38, max: 52 },
        particles: 130,
        opacity: 0.3,
        lineWidth: { explosion: { min: 2, max: 4.5 }, trace: { min: 1.5, max: 2.5 } },
      }
    : {
        hue: { min: 185, max: 215 },
        brightness: { min: 55, max: 85 },
        particles: 90,
        opacity: 0.6,
        lineWidth: { explosion: { min: 1, max: 3 }, trace: { min: 1, max: 2 } },
      };

export async function createFireworks (
  container: HTMLElement,
  extra: FireworksOptions = {},
): Promise<Fireworks> {
  const { Fireworks } = await import('fireworks-js');
  return new Fireworks(container, {
    explosion: 6,
    intensity: 30,
    traceSpeed: 3,
    acceleration: 1.04,
    friction: 0.96,
    gravity: 1.4,
    sound: { enabled: false },
    ...themeColors(isLightTheme()),
    ...extra,
  });
}
