"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";
import { api } from "@/lib/api";
import { CATEGORIES, CONDITIONS, ListingDetail, currencyLabel, defaultListingCurrency, listingCurrencies } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, Input, Label, Select, Skeleton, Textarea } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { PrivacyNote } from "@/components/privacy-note";

const schema = z.object({
  title: z.string().min(3, "Title needs a few more characters.").max(120),
  description: z.string().min(8, "Add a short description.").max(4000),
  price: z.string().min(1, "Enter a price."),
  currency: z.string().length(3),
  category: z.string(),
  condition: z.string(),
  location: z.string().optional(),
});

const MAX_IMAGES = 6;

function PhotoPicker({
  files,
  onChange,
  existingImages,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  existingImages?: string[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files, ...Array.from(list)].slice(0, MAX_IMAGES);
    onChange(next);
  }

  function removeAt(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div>
      <Label htmlFor="images">Photos ({files.length}/{MAX_IMAGES})</Label>
      {existingImages && existingImages.length > 0 && files.length === 0 && (
        <div className="mb-2 space-y-2">
          <div className="flex flex-wrap gap-2">
            {existingImages.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="" className="size-20 rounded-[var(--radius-sm)] object-cover" />
            ))}
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">Uploading new photos will replace all current photos.</p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {previews.map((src, i) => (
          <div key={src} className="group relative size-20 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="size-20 rounded-[var(--radius-sm)] object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label="Remove photo"
              className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--danger)] text-white shadow-[var(--shadow-sm)]"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        {files.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] border border-dashed border-[var(--border-strong)] text-[var(--muted-foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <ImagePlus className="size-5" />
            <span className="text-[10px] font-medium">Add</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        id="images"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="sr-only"
        onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}

export default function ListingFormPage() {
  const router = useRouter();
  const params = useParams<{ publicId?: string }>();
  const editing = Boolean(params.publicId);
  const [photos, setPhotos] = useState<File[]>([]);
  const [saving, setSaving] = useState<"draft" | "submit" | null>(null);
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
      currency: existing.data.currency ?? defaultListingCurrency(),
      category: existing.data.category,
      condition: existing.data.condition,
      location: existing.data.location ?? "",
    } : undefined,
    defaultValues: { title: "", description: "", price: "", currency: defaultListingCurrency(), category: "HOME", condition: "GOOD", location: "" },
  });

  async function save(asSubmit: boolean, values: z.infer<typeof schema>) {
    setSaving(asSubmit ? "submit" : "draft");
    try {
      const listing = {
        title: values.title,
        description: values.description,
        price: Number(values.price),
        currency: values.currency,
        category: values.category,
        condition: values.condition,
        location: values.location,
      };
      const body = new FormData();
      body.append("listing", new Blob([JSON.stringify(listing)], { type: "application/json" }));
      photos.forEach((file) => body.append("images", file));
      const path = editing ? `/listings/${params.publicId}` : "/listings";
      const saved = await api<ListingDetail>(path, { method: editing ? "PATCH" : "POST", body });
      if (asSubmit) await api(`/listings/${saved.publicId}/submit`, { method: "POST" });
      toast.success(asSubmit ? "Submitted for review." : "Draft saved.");
      router.push(asSubmit ? "/listings/mine" : `/listing/${saved.publicId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save listing");
    } finally {
      setSaving(null);
    }
  }

  if (editing && existing.isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={editing ? "Edit listing" : "New listing"}
        description="Saved as a draft until you submit. Community admins review before it goes live."
      />
      <Card>
        <form className="space-y-5" onSubmit={form.handleSubmit((values) => save(false, values))}>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="What are you selling?" {...form.register("title")} />
            {form.formState.errors.title && <p className="mt-1.5 text-sm text-[var(--danger)]">{form.formState.errors.title.message}</p>}
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Condition, details, why you're selling..." {...form.register("description")} />
            {form.formState.errors.description && <p className="mt-1.5 text-sm text-[var(--danger)]">{form.formState.errors.description.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="price">Price</Label>
              <Input id="price" inputMode="decimal" placeholder="0.00" {...form.register("price")} />
              {form.formState.errors.price && <p className="mt-1.5 text-sm text-[var(--danger)]">{form.formState.errors.price.message}</p>}
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select id="currency" {...form.register("currency")}>
                {listingCurrencies().map((code) => <option key={code} value={code}>{currencyLabel(code)}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="Optional" {...form.register("location")} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select id="category" {...form.register("category")}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="condition">Condition</Label>
              <Select id="condition" {...form.register("condition")}>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
              </Select>
            </div>
          </div>
          <PhotoPicker files={photos} onChange={setPhotos} existingImages={existing.data?.images} />
          <PrivacyNote>Photos and details are visible only to members of your community.</PrivacyNote>
          <div className="flex flex-wrap gap-3 border-t border-[var(--border)] pt-5">
            <Button type="submit" variant="outline" loading={saving === "draft"} disabled={saving !== null}>Save draft</Button>
            <Button type="button" loading={saving === "submit"} disabled={saving !== null} onClick={form.handleSubmit((values) => save(true, values))}>
              Submit for review
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
