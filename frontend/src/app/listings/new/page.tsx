"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CATEGORIES, CONDITIONS, ListingDetail } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, Input, Label, Textarea } from "@/components/ui/field";
import { PrivacyNote } from "@/components/privacy-note";

const schema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(8).max(4000),
  price: z.string().min(1),
  category: z.string(),
  condition: z.string(),
  location: z.string().optional(),
});

export default function ListingFormPage() {
  const router = useRouter();
  const params = useParams<{ publicId?: string }>();
  const editing = Boolean(params.publicId);
  const existing = useQuery({
    queryKey: ["listing", params.publicId],
    queryFn: () => api<ListingDetail>(`/listings/${params.publicId}`),
    enabled: editing,
  });
  const form = useForm({
    resolver: zodResolver(schema),
    values: existing.data ? {
      title: existing.data.title,
      description: existing.data.description,
      price: String(existing.data.price),
      category: existing.data.category,
      condition: existing.data.condition,
      location: existing.data.location ?? "",
    } : undefined,
    defaultValues: { title: "", description: "", price: "", category: "HOME", condition: "GOOD", location: "" },
  });

  async function save(asSubmit: boolean) {
    const values = form.getValues();
    const listing = {
      title: values.title,
      description: values.description,
      price: Number(values.price),
      category: values.category,
      condition: values.condition,
      location: values.location,
    };
    const files = (document.getElementById("images") as HTMLInputElement)?.files;
    const body = new FormData();
    body.append("listing", new Blob([JSON.stringify(listing)], { type: "application/json" }));
    if (files) Array.from(files).slice(0, 6).forEach((file) => body.append("images", file));
    const path = editing ? `/listings/${params.publicId}` : "/listings";
    const saved = await api<ListingDetail>(path, { method: editing ? "PATCH" : "POST", body });
    if (asSubmit) await api(`/listings/${saved.publicId}/submit`, { method: "POST" });
    router.push(asSubmit ? "/listings/mine" : `/listing/${saved.publicId}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <h1 className="text-3xl">{editing ? "Edit listing" : "New listing"}</h1>
        <PrivacyNote>Saved as a draft until you submit. Community admins review before it goes live.</PrivacyNote>
        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(() => save(false))}>
          <div><Label>Title</Label><Input {...form.register("title")} />{form.formState.errors.title && <p className="text-sm text-[var(--warn)]">Title needs a few more characters.</p>}</div>
          <div><Label>Description</Label><Textarea {...form.register("description")} />{form.formState.errors.description && <p className="text-sm text-[var(--warn)]">Add a short description.</p>}</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Price</Label><Input inputMode="decimal" {...form.register("price")} /></div>
            <div><Label>Location</Label><Input {...form.register("location")} /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Category</Label>
              <select className="h-11 w-full rounded-2xl border border-[var(--border)] bg-transparent px-3" {...form.register("category")}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label>Condition</Label>
              <select className="h-11 w-full rounded-2xl border border-[var(--border)] bg-transparent px-3" {...form.register("condition")}>
                {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="images">Photos (max 6)</Label>
            <Input id="images" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit">Save draft</Button>
            <Button type="button" variant="outline" onClick={form.handleSubmit(() => save(true))}>Submit for review</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
