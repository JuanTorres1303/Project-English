/**
 * MEDIA MANIFEST: the single place to swap images and videos.
 *
 * Put files in /public/media and point to them here.
 * Points (hotspots, card anchors, focus) are fractions of the IMAGE (0..1):
 * open the image, read the pixel, divide by its width / height.
 *
 * THE SEAM RULE: each clip starts EXACTLY on the still of its stop and ends EXACTLY
 * on the still of the next one (they are rendered from these same keyframes by
 * tools/intro/make-clips.mjs), so the page can swap still <-> video with no jump.
 * Sources live in /videos (fotogramas + clips). Web encodes: GOP 6 for scrubbing.
 */

export type Point = { x: number; y: number };

export type MediaImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

/** Where the stop photo sits inside a video frame, as fractions of that frame. */
export type Window = { x: number; y: number; w: number; h: number };

export type MediaVideo = {
  src: string;
  width: number;
  height: number;
  poster?: string;
  /** where the stop still sits inside this video's frame (full frame by default) */
  photoWindow?: Window;
};

const FULL: Window = { x: 0, y: 0, w: 1, h: 1 };
const HD = { width: 1920, height: 1080 };

/** Hero background film: Bogota is drawn and built while the page UI arrives. */
export const introFilm: MediaVideo = {
  src: "/media/bogota-0-intro.mp4",
  poster: "/media/bogota-intro-poster.webp",
  ...HD,
  photoWindow: FULL, // its last frame IS stills.welcome
};

export const stills = {
  welcome: {
    src: "/media/bogota-1.webp",
    ...HD,
    alt: "Aerial view of Bogota at sunset: the elevated metro station Bienvenidos a Bogota, the hospital, the shopping centre, the police station and the eco factory along a green avenue.",
  },
  station: {
    src: "/media/bogota-2.webp",
    ...HD,
    alt: "Estacion Banderas: an elevated metro station with a silver train, blue electric buses, a red cycle lane with cyclists and EV charging points.",
  },
  factory: {
    src: "/media/bogota-3.webp",
    ...HD,
    alt: "A modern eco factory with solar panels and steel silos on the roof, a glass entrance and young trees in front.",
  },
  hospital: {
    src: "/media/bogota-4.webp",
    ...HD,
    alt: "A smart hospital with a glass facade, a garden with flowers, a pond with fountains and people walking.",
  },
  dailyLife: {
    src: "/media/bogota-5.webp",
    ...HD,
    alt: "A pedestrian boulevard at dusk with a red cycle lane, cafes, an electric bus to Banderas and green towers.",
  },
} satisfies Record<string, MediaImage>;

/** Scroll-scrubbed flights between consecutive stops. */
export const flights = {
  welcomeToStation: { src: "/media/bogota-1-a-2.mp4", ...HD, photoWindow: FULL },
  stationToFactory: { src: "/media/bogota-2-a-3.mp4", ...HD, photoWindow: FULL },
  factoryToHospital: { src: "/media/bogota-3-a-4.mp4", ...HD, photoWindow: FULL },
  hospitalToDailyLife: { src: "/media/bogota-4-a-5.mp4", ...HD, photoWindow: FULL },
} satisfies Record<string, MediaVideo>;
