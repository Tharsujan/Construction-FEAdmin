"use client";

import { useRef, useState, type DragEvent, type FormEvent } from "react";
import {
  Alert,
  Button,
  CheckField,
  EmptyState,
  Field,
  FilterBar,
  Flag,
  LoadState,
  Notice,
  PageHeading,
  Records,
  Sheet,
  inputClass,
} from "@/components/ui";
import { send, TOKEN_KEY } from "@/lib/api";
import { errorText, formatQty, money } from "@/lib/format";
import { useQueryFilter } from "@/lib/use-query-filter";
import { useResource } from "@/lib/use-resource";
import type { CementProduct, ProductUnit } from "@/lib/types";

type Editor =
  | { mode: "create" }
  | { mode: "edit"; product: CementProduct }
  | null;

export function ProductsScreen() {
  const products = useResource<CementProduct[]>("/api/admin/cement/products");
  const [active, setActive] = useQueryFilter("active");
  const [editor, setEditor] = useState<Editor>(null);
  const [stockProduct, setStockProduct] = useState<CementProduct | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const rows = (products.data ?? []).filter((product) => {
    if (active === "true") return product.isActive;
    if (active === "false") return !product.isActive;
    return true;
  });

  function saved(message: string) {
    setNotice(message);
    setEditor(null);
    setStockProduct(null);
    products.reload();
  }

  return (
    <div>
      <PageHeading
        kicker="Cement"
        title="Products"
        lede="A new product starts with no stock. Image, name, unit, and price are edited here. Quantity stays on Stock. Inactive products stay in this list and leave the client catalog."
        action={<Button onClick={() => setEditor({ mode: "create" })}>Add product</Button>}
      />
      <div className="mt-6 space-y-4">
        {notice ? <Notice>{notice}</Notice> : null}
        <FilterBar
          label="Product visibility"
          value={active}
          onChange={setActive}
          options={[
            { value: "", label: "All" },
            { value: "true", label: "Active" },
            { value: "false", label: "Inactive" },
          ]}
        />
        <LoadState
          loading={products.loading}
          error={products.error}
          ready={products.data !== null}
          onRetry={products.reload}
          label="Loading cement products…"
        >
          {products.data && rows.length === 0 ? (
            <EmptyState title="No products in this view" body="Add a cement product, or switch the filter." />
          ) : null}
          {rows.length > 0 ? (
            <Records
              rows={rows}
              rowKey={(row) => row.id}
              columns={[
                {
                  key: "name",
                  header: "Product",
                  cell: (row) => (
                    <span className="flex items-center gap-3">
                      <ProductImage url={row.imageUrl} />
                      <span className="font-semibold">{row.name}</span>
                    </span>
                  ),
                },
                { key: "unit", header: "Unit", cell: (row) => row.unitName },
                { key: "price", header: "Price", cell: (row) => `${money(row.price)} / ${row.unitName}` },
                {
                  key: "stock",
                  header: "Stock",
                  cell: (row) => (
                    <span className={row.isActive && row.stockQuantity <= 10 ? "font-semibold text-danger" : ""}>
                      {formatQty(row.stockQuantity)} {row.unitName}
                    </span>
                  ),
                },
                { key: "active", header: "Catalog", cell: (row) => <Flag on={row.isActive} onLabel="Active" offLabel="Inactive" /> },
                {
                  key: "actions",
                  header: "Actions",
                  cell: (row) => (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="quiet" onClick={() => setEditor({ mode: "edit", product: row })}>
                        Edit
                      </Button>
                      <Button variant="secondary" onClick={() => setStockProduct(row)}>
                        Stock
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          ) : null}
        </LoadState>
      </div>
      <Sheet open={editor !== null} title={editor?.mode === "edit" ? "Edit product" : "Add product"} onClose={() => setEditor(null)}>
        {editor ? (
          <ProductForm
            key={editor.mode === "edit" ? editor.product.id : "new"}
            product={editor.mode === "edit" ? editor.product : null}
            onSaved={saved}
          />
        ) : null}
      </Sheet>
      <Sheet open={stockProduct !== null} title="Adjust stock" onClose={() => setStockProduct(null)}>
        {stockProduct ? <StockForm key={stockProduct.id} product={stockProduct} onSaved={saved} /> : null}
      </Sheet>
    </div>
  );
}

function ProductForm({ product, onSaved }: { product: CementProduct | null; onSaved: (message: string) => void }) {
  const units = useResource<ProductUnit[]>("/api/admin/units");
  const activeUnits = (units.data ?? []).filter((unit) => unit.isActive);
  const currentUnit = product ? (units.data ?? []).find((unit) => unit.id === product.unitId) : undefined;
  const keepCurrent = Boolean(product && currentUnit && !currentUnit.isActive);
  const choices = keepCurrent && currentUnit ? [currentUnit, ...activeUnits] : activeUnits;
  const [pickedId, setPickedId] = useState<string | null>(null);
  const unitId = pickedId ?? (product && choices.some((unit) => unit.id === product.unitId) ? product.unitId : (activeUnits[0]?.id ?? ""));
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError("Enter a price above zero.");
      return;
    }
    if (!unitId) {
      setError("Add an active unit before saving a product.");
      return;
    }
    if (uploading) {
      setError("Wait for the image to finish uploading.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const body = {
        imageUrl: imageUrl.trim() || null,
        name: name.trim(),
        unitId,
        price: parsedPrice,
        isActive,
      };
      if (product) {
        await send<CementProduct>(`/api/admin/cement/products/${product.id}`, "PUT", body);
        onSaved(`${name.trim()} was updated. Stock was left unchanged.`);
      } else {
        await send<CementProduct>("/api/admin/cement/products", "POST", body);
        onSaved(`${name.trim()} was added with stock at 0.`);
      }
    } catch (caught) {
      setError(errorText(caught));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <ImageUpload url={imageUrl} onChange={setImageUrl} onUploading={setUploading} />
      <Field label="Name">
        <input required maxLength={160} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Unit" hint={keepCurrent ? `${product?.unitName} is inactive. It stays on this product until you pick an active unit.` : undefined}>
          <select required value={unitId} onChange={(event) => setPickedId(event.target.value)} className={inputClass} disabled={units.loading || choices.length === 0}>
            {units.loading ? <option value="">Loading units…</option> : null}
            {!units.loading && choices.length === 0 ? <option value="">No active units</option> : null}
            {choices.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.isActive ? unit.name : `${unit.name} (inactive)`}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Price">
          <input required type="number" min="0.01" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} className={inputClass} />
        </Field>
      </div>
      {units.error ? <Alert>{units.error}</Alert> : null}
      <p className="text-sm text-muted">
        {product
          ? `Stock stays at ${formatQty(product.stockQuantity)} ${product.unitName}. Use Stock to change it.`
          : "A new product starts at stock 0. Use Stock after it is saved."}
      </p>
      <CheckField checked={isActive} onChange={setIsActive} label="Active on the client catalog" />
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" className="w-full sm:w-auto" disabled={busy || uploading || choices.length === 0}>
        {busy ? "Saving…" : product ? "Save product" : "Add product"}
      </Button>
    </form>
  );
}

function ImageUpload({
  url,
  onChange,
  onUploading,
}: {
  url: string;
  onChange: (url: string) => void;
  onUploading: (uploading: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function upload(file: File) {
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setError("Use a JPEG, PNG, WebP, or GIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Images must be 5 MB or smaller.");
      return;
    }
    setBusy(true);
    onUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch("/uploads", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const body = (await response.json().catch(() => null)) as { url?: string; message?: string } | null;
      if (!response.ok || !body?.url) {
        throw new Error(body?.message || "The image could not be uploaded.");
      }
      onChange(body.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The image could not be uploaded.");
    } finally {
      setBusy(false);
      onUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function drop(event: DragEvent) {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) void upload(file);
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold">Image</span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={drop}
        disabled={busy}
        className={`flex min-h-28 w-full flex-col items-center justify-center gap-2 border border-dashed px-4 py-5 text-center ${
          dragOver ? "border-clay bg-sand" : "border-line bg-card"
        }`}
      >
        <span className="text-sm font-semibold">{busy ? "Uploading…" : url ? "Replace image" : "Upload image"}</span>
        <span className="text-sm text-muted">JPEG, PNG, WebP, or GIF, up to 5 MB. Drop a file here, or click to choose one.</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <ImagePreview url={url} />
      {url ? (
        <button type="button" className="mt-2 text-sm font-semibold text-clay hover:text-clay-deep" onClick={() => onChange("")}>
          Remove image
        </button>
      ) : (
        <p className="mt-1.5 text-sm text-muted">Optional. Leave this empty when the product has no picture.</p>
      )}
      {error ? (
        <div className="mt-2">
          <Alert>{error}</Alert>
        </div>
      ) : null}
    </div>
  );
}

function ProductImage({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) {
    return <span className="inline-block size-12 shrink-0 border border-dashed border-line bg-sand" aria-hidden />;
  }
  return (
    // Remote product photos are staff-supplied URLs, so they are not passed through the image optimizer.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="size-12 shrink-0 border border-line bg-sand object-cover" onError={() => setFailed(true)} />
  );
}

function ImagePreview({ url }: { url: string }) {
  const trimmed = url.trim();
  if (!trimmed) return null;
  return <ImagePreviewFrame key={trimmed} url={trimmed} />;
}

function ImagePreviewFrame({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <p className="text-sm text-muted">The image preview could not be loaded.</p>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="mt-3 h-36 w-full max-w-xs border border-line bg-sand object-cover" onError={() => setFailed(true)} />
  );
}

function StockForm({ product, onSaved }: { product: CementProduct; onSaved: (message: string) => void }) {
  const [mode, setMode] = useState<"set" | "adjust">("set");
  const [amount, setAmount] = useState(String(product.stockQuantity));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = Number(amount);
    if (!Number.isFinite(parsed)) {
      setError("Enter a number.");
      return;
    }
    if (mode === "set" && parsed < 0) {
      setError("Stock cannot go below zero.");
      return;
    }
    if (mode === "adjust" && product.stockQuantity + parsed < 0) {
      setError("Stock cannot go below zero.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const body = mode === "set" ? { stockQuantity: parsed } : { adjustment: parsed };
      await send<CementProduct>(`/api/admin/cement/products/${product.id}/stock`, "PATCH", body);
      onSaved(`Stock for ${product.name} was updated.`);
    } catch (caught) {
      setError(errorText(caught));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-muted">
        {product.name} currently has {formatQty(product.stockQuantity)} {product.unitName}.
      </p>
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold">How to change it</legend>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="radio" name="stock-mode" checked={mode === "set"} onChange={() => setMode("set")} />
          Set the quantity on hand
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="radio" name="stock-mode" checked={mode === "adjust"} onChange={() => setMode("adjust")} />
          Adjust by a number
        </label>
      </fieldset>
      <Field label={mode === "set" ? "New quantity" : "Adjustment"} hint={mode === "adjust" ? "Use a negative number to remove stock." : "This replaces the quantity on hand."}>
        <input required type="number" step="any" min={mode === "set" ? "0" : undefined} value={amount} onChange={(event) => setAmount(event.target.value)} className={inputClass} />
      </Field>
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" className="w-full sm:w-auto" disabled={busy}>
        {busy ? "Saving…" : "Update stock"}
      </Button>
    </form>
  );
}
