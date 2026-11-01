import { redirect } from "next/navigation";

export default async function DuloMovieAlias({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/title/movie/${id}`);
}
