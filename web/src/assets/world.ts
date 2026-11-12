/**
 * THE JOURNEY: one fixed stage, one stop per scene (scroll-world model).
 *
 *  - `still`      the picture when the camera is AT this stop (HD keyframe).
 *  - `clipToNext` the flight from this stop to the next, scrubbed by scroll. It starts
 *                 exactly on this still and ends exactly on the next one.
 *  - `length`     scroll distance of the stop. The first part is for reading (camera
 *                 still), the middle part is the flight (see FLIGHT in ScrollWorld).
 *  - `focusX`     horizontal point kept in view on narrow (phone) screens.
 */
import { flights, stills, type MediaImage, type MediaVideo } from "./media";

export type StopId = "identity" | "transport" | "schools" | "health" | "daily-life";

export type Stop = {
  id: StopId;
  still: MediaImage;
  clipToNext?: MediaVideo | null;
  focusX?: number;
  /** Tailwind min-height class: literal string so Tailwind can see it */
  length: string;
};

export const stops: Stop[] = [
  { id: "identity", still: stills.welcome, clipToNext: flights.welcomeToStation, focusX: 0.5, length: "min-h-[300lvh]" },
  { id: "transport", still: stills.station, clipToNext: flights.stationToFactory, focusX: 0.5, length: "min-h-[300lvh]" },
  { id: "schools", still: stills.factory, clipToNext: flights.factoryToHospital, focusX: 0.5, length: "min-h-[300lvh]" },
  { id: "health", still: stills.hospital, clipToNext: flights.hospitalToDailyLife, focusX: 0.5, length: "min-h-[300lvh]" },
  { id: "daily-life", still: stills.dailyLife, clipToNext: null, focusX: 0.5, length: "min-h-[160lvh]" },
];
