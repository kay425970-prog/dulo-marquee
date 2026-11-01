"use client";

import React, { Suspense } from "react";
import { DuloShelfBrowser } from "@/app/browse/page";
import { Loader2 } from "lucide-react";

export default function ShowsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#da1b1b]" />
        </div>
      }
    >
      <DuloShelfBrowser defaultMedia="tv" />
    </Suspense>
  );
}
