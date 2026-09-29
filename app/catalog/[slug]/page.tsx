"use client";

import { useParams } from "next/navigation";
import { CatalogStorefront } from "@/features/catalog/components/catalog-storefront";

export default function PublicCatalogPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  return <CatalogStorefront slug={slug ?? ""} />;
}
