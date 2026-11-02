import { redirect } from "next/navigation";

export default async function ArkaflixMovieAlias({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/title/movie/${id}`);
}
