import { useState } from "react";

export function PostImage({ src, titulo }: { src: string; titulo: string }) {
  const [failedSource, setFailedSource] = useState("");
  if (failedSource === src) return null;
  return <img src={src} alt={`Foto da publicação: ${titulo}`} loading="lazy" onError={() => setFailedSource(src)} className="mt-4 aspect-[4/3] w-full max-w-full rounded-lg border border-border bg-muted object-contain" />;
}