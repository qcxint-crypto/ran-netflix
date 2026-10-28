import Image from 'next/image'

/**
 * Full-bleed blurred backdrop used at the top of the detail pages. Kept
 * separate from the page body so the two detail pages share the same treatment.
 */
export default function DetailBackdrop({ image, alt }: { image?: string; alt: string }) {
  if (!image) {
    return <div className="h-[30vh] md:h-[38vh]" />
  }

  return (
    <div className="relative w-full h-[34vh] md:h-[44vh] overflow-hidden">
      <Image
        src={image}
        alt={alt}
        fill
        priority
        sizes="(max-width: 768px) 100vw, 1400px"
        className="object-cover object-center scale-110 blur-md opacity-45"
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background" />
    </div>
  )
}
