/**
 * CONTENT: every visible English string of the journey, per stop.
 * Grammar focus follows the B1 brief (must / comparatives / will / should-can / will + routine).
 */
import type { Point } from "./media";

export type FeatureCard = {
  id: string;
  icon: "train" | "bus" | "bicycle" | "charging";
  title: string;
  points: [string, string];
  /** where the card's leader dot points to, in station-image fractions */
  anchor: Point;
  /** which side of the anchor the card sits on */
  side: "left" | "right";
  /** optional vertical nudge in px (to keep neighbouring cards apart) */
  offsetY?: number;
};

export type SceneCopy = {
  id: "schools" | "health" | "daily-life";
  title: string;
  body: string;
  grammar: string;
  facts: string[];
};

export const brand = {
  name: "BOGOTÁ",
  tag: "B1 English Project",
};

export const navItems = [
  { id: "identity", label: "Identity" },
  { id: "transport", label: "Transit & Eco" },
  { id: "schools", label: "Schools & Jobs" },
  { id: "health", label: "Health & Fun" },
  { id: "daily-life", label: "Daily Life" },
] as const;

export const hero = {
  kicker: "Welcome to",
  title: "BOGOTÁ",
  body: "Our ideal Bogotá: a sustainable city where technology, mobility and nature coexist. Every citizen must respect the environment.",
  grammar: "must / have to",
  primary: "Explore City",
  secondary: "Watch Presentation",
  hotspots: [
    { label: "Bus & Bike Lanes", detail: "Clean mobility", icon: "train", at: { x: 0.585, y: 0.66 } },
    { label: "Police", detail: "Public safety", icon: "shield", at: { x: 0.79, y: 0.49 } },
    { label: "Eco Factory", detail: "Solar powered", icon: "factory", at: { x: 0.77, y: 0.8 } },
  ] as { label: string; detail: string; icon: "train" | "shield" | "factory"; at: Point }[],
};

export const transport = {
  title: "Transport & Clean Environment",
  body: "Our electric metro is cleaner and faster than old gas buses, and the streets are quieter than in traditional cities.",
  grammar: "comparatives",
  cards: [
    {
      id: "metro",
      icon: "train",
      title: "Smart Metro",
      points: ["100% electric", "Powered by renewable energy"],
      anchor: { x: 0.155, y: 0.44 },
      side: "right",
    },
    {
      id: "transit",
      icon: "bus",
      title: "Public Transport",
      points: ["Electric buses every 4 minutes", "One ticket for metro and bus"],
      anchor: { x: 0.48, y: 0.75 },
      side: "right",
      offsetY: 30,
    },
    {
      id: "bike",
      icon: "bicycle",
      title: "Cycle Lanes",
      points: ["Safe, separated lanes", "Connected to every station"],
      anchor: { x: 0.73, y: 0.8 },
      side: "right",
      offsetY: 40,
    },
    {
      id: "charging",
      icon: "charging",
      title: "Clean Mobility",
      points: ["Zero emission vehicles", "Public charging points"],
      anchor: { x: 0.855, y: 0.78 },
      side: "left",
      offsetY: -120,
    },
  ] satisfies FeatureCard[],
};

export const scenes: SceneCopy[] = [
  {
    id: "schools",
    title: "Future Schools & Green Jobs",
    body: "Students will learn with AI tutors, and many citizens will work in clean factories with zero emissions. People will work four days a week.",
    grammar: "future: will",
    facts: ["Solar powered factory", "Green jobs for young people"],
  },
  {
    id: "health",
    title: "Health, Green Spaces & Fun",
    body: "You should visit the hospital gardens after work. You can relax by the fountains, and you can practise free sports in the parks.",
    grammar: "should / can",
    facts: ["Smart hospital", "Parks in every district"],
  },
  {
    id: "daily-life",
    title: "A Day in Bogotá",
    body: "A citizen will wake up in a solar home, take the metro to work and ride a bike home. In the evening she will walk along the boulevard.",
    grammar: "will + daily routine",
    facts: ["Clean air all day", "Everything 15 minutes away"],
  },
];

/** Large statement section (landing-page-design B11): words light up one by one on scroll. */
export const tagline = {
  text: "Our Bogotá is cleaner than yesterday and quieter than ever. It is a city built for people, not for cars.",
  grammar: "comparatives",
};

export const finale = {
  title: "Bogotá is ready for you.",
  body: "A city that is cleaner, quieter and fairer. We will build it together.",
  cta: "Back to the start",
};
