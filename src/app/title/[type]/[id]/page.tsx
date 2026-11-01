"use client";

import React, { Suspense, use } from "react";
import { DuloTitleInfoView } from "@/app/media/[type]/[id]/page";
import { Loader2 } from "lucide-react";

export default function TitleDetailPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = use(params);
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[75vh] items-center justify-center bg-[#070707]">
          <Loader2 className="h-7 w-7 animate-spin text-[#da1b1b]" />
        </div>
      }
    >
      <DuloTitleInfoView type={type} id={id} />
    </Suspense>
  );
}
