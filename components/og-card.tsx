/* eslint-disable @next/next/no-img-element -- ImageResponse (satori) ne rend
   que du HTML brut : next/image n'y est pas disponible. */
import { tmdbImage } from "@/lib/media";

export const OG_SIZE = { width: 1200, height: 630 };

export const OG_CONTENT_TYPE = "image/png";

const BACKGROUND = "#09090b";

/**
 * Gabarit partagé des images Open Graph. Satori ne gère que flexbox et un
 * sous-ensemble de CSS : styles en ligne, pas de grille, pas de raccourci
 * `inset`.
 */
export function OgCard({
  badge,
  title,
  subtitle,
  poster,
  backdrop,
  round = false,
}: {
  badge: string;
  title: string;
  subtitle?: string;
  poster: string | null;
  backdrop: string | null;
  round?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: BACKGROUND,
        color: "#fafafa",
        fontFamily: "sans-serif",
      }}
    >
      {backdrop && (
        <img
          alt=""
          src={tmdbImage(backdrop, "w1280")}
          width={OG_SIZE.width}
          height={OG_SIZE.height}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: OG_SIZE.width,
            height: OG_SIZE.height,
            objectFit: "cover",
            opacity: 0.4,
          }}
        />
      )}

      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          backgroundImage: `linear-gradient(90deg, ${BACKGROUND} 30%, rgba(9,9,11,0.7) 70%, rgba(9,9,11,0.4) 100%)`,
        }}
      />

      <div
        style={{
          display: "flex",
          position: "relative",
          width: "100%",
          height: "100%",
          alignItems: "center",
          gap: 56,
          padding: 72,
        }}
      >
        {poster && (
          <img
            alt=""
            src={tmdbImage(poster, "w500")}
            width={round ? 360 : 300}
            height={round ? 360 : 450}
            style={{
              width: round ? 360 : 300,
              height: round ? 360 : 450,
              objectFit: "cover",
              objectPosition: "top",
              borderRadius: round ? 180 : 28,
            }}
          />
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: -1,
              color: "#a1a1aa",
            }}
          >
            JUST.
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 22,
              textTransform: "uppercase",
              letterSpacing: 3,
              color: "#a1a1aa",
            }}
          >
            {badge}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 14,
              fontSize: title.length > 34 ? 58 : 72,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: -2,
            }}
          >
            {title}
          </div>

          {subtitle && (
            <div
              style={{
                display: "flex",
                marginTop: 22,
                fontSize: 28,
                color: "#d4d4d8",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
