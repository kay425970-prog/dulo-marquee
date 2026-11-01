import { redirect } from "next/navigation";

export default async function DuloTvAlias({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/title/tv/${id}`);
}
