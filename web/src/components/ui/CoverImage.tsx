import Image from "next/image";
import type { CSSProperties, ReactNode, Ref } from "react";
import type { MediaImage } from "@/assets/media";

type Props = {
  image: MediaImage;
  /** focal x (0..1) kept on screen when the viewport is narrower than the image */
  focusX?: number;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
  boxRef?: Ref<HTMLDivElement>;
  /** overlays positioned in image percentages (hotspots, cards) */
  children?: ReactNode;
};

/**
 * Full-viewport image whose box keeps the image's aspect ratio (see .cover-box).
 * Children can be placed with left/top percentages of the IMAGE.
 */
export function CoverImage({ image, focusX = 0.5, priority, className = "", style, boxRef, children }: Props) {
  const ar = image.width / image.height;
  return (
    <div
      ref={boxRef}
      className={`cover-box ${className}`}
      style={{ ["--ar" as string]: ar.toFixed(4), ["--fx" as string]: focusX, ...style }}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority={priority}
        quality={85}
        sizes={`(min-aspect-ratio: ${image.width}/${image.height}) 100vw, ${Math.ceil(ar * 100)}vh`}
        className="object-cover select-none"
        draggable={false}
      />
      {children}
    </div>
  );
}
