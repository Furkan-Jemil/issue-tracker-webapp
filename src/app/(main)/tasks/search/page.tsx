import { redirect } from "next/navigation";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; density?: string; page?: string }>;
}) {
  const params = await searchParams;
  const nextParams = new URLSearchParams();

  const query = params?.q?.trim() || "";
  if (query) {
    nextParams.set("q", query);
  }

  if (params?.density === "compact" || params?.density === "comfortable") {
    nextParams.set("density", params.density);
  }

  if (params?.page && /^\d+$/.test(params.page) && Number(params.page) > 0) {
    nextParams.set("page", params.page);
  }

  redirect(
    nextParams.size > 0 ? `/tasks?${nextParams.toString()}` : "/tasks",
  );
}
