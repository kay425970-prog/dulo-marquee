"use client";

import React, { Suspense } from "react";
import { ArkaflixShelfBrowser } from "@/app/browse/page";
import { Loader2 } from "lucide-react";

export default function MoviesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#da1b1b]" />
        </div>
      }
    >
      <ArkaflixShelfBrowser defaultMedia="movie" />
    </Suspense>
  );
}
