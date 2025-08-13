import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useGetProductByIdQuery } from "../../features/product/productSlice2";

const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const currency = (n) => fmt.format(Number.isFinite(+n) ? +n : 0);

const FALLBACK_IMG = "/placeholder-image.png";

export default function ProductDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, isLoading, isError, refetch, isFetching } = useGetProductByIdQuery(id);

  // Build gallery: first thumbnail, then images (unique & truthy)
  const gallery = useMemo(() => {
    if (!data) return [];
    const base = [];
    if (data.thumbnail) base.push(data.thumbnail);
    if (Array.isArray(data.images)) base.push(...data.images.filter(Boolean));
    return Array.from(new Set(base)).filter(Boolean);
  }, [data]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [qty, setQty] = useState(1);

  // Reset active image when product/gallery changes
  useEffect(() => {
    setActiveIdx(0);
  }, [id, gallery.length]);

  const stock = Number(data?.stockQuantity ?? 0);
  const hasStock = stock > 0;

  const priceOut = Number(data?.priceOut || 0);
  const discountPct = Math.min(Math.max(Number(data?.discount || 0), 0), 100);
  const hasDiscount = discountPct > 0;
  const discounted = hasDiscount ? priceOut * (1 - discountPct / 100) : priceOut;

  const clampQty = useCallback(
    (n) => Math.min(Math.max(n, 1), Math.max(stock, 1)),
    [stock]
  );

  const add = () => setQty((q) => clampQty(q + 1));
  const sub = () => setQty((q) => clampQty(q - 1));
  const onQtyChange = (e) => {
    const onlyDigits = e.target.value.replace(/[^\d]/g, "");
    const n = onlyDigits === "" ? 1 : Number(onlyDigits);
    setQty(clampQty(n));
  };

  const onKeyNav = (e) => {
    if (!gallery.length) return;
    if (e.key === "ArrowRight") setActiveIdx((i) => (i + 1) % gallery.length);
    if (e.key === "ArrowLeft") setActiveIdx((i) => (i - 1 + gallery.length) % gallery.length);
  };

  const mainImage = gallery[activeIdx] || FALLBACK_IMG;

  // --- Loading skeleton
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 lg:p-6">
        <div className="grid lg:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square bg-gray-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="w-40 h-5 bg-gray-200 rounded" />
            <div className="w-3/4 h-8 bg-gray-200 rounded" />
            <div className="w-24 h-6 bg-gray-200 rounded" />
            <div className="w-full h-24 bg-gray-200 rounded" />
            <div className="flex gap-2">
              <div className="w-28 h-10 bg-gray-200 rounded" />
              <div className="w-40 h-10 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Error / Empty
  if (isError || !data) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load product.
          <button
            onClick={() => refetch()}
            className="ml-2 underline hover:opacity-80"
          >
            Retry
          </button>
          <button
            onClick={() => navigate(-1)}
            className="ml-3 underline hover:opacity-80"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6">
      {/* Breadcrumbs */}
      <nav className="mb-4 text-sm text-gray-500">
        <Link to="/" className="hover:underline">Home</Link>
        <span className="mx-2">/</span>
        <Link
          to={`/category/${data?.category?.slug || ""}`}
          className="hover:underline"
        >
          {data?.category?.name || "Category"}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700 line-clamp-1">{data?.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Gallery (sticky on desktop) */}
        <div
          className="flex flex-col gap-3 lg:sticky lg:top-24"
          onKeyDown={onKeyNav}
          tabIndex={0}
          aria-label="Product image gallery"
        >
          <div className="w-full bg-gray-50 rounded-2xl p-2 relative">
            {!hasStock && (
              <span className="absolute left-3 top-3 z-10 rounded-full bg-gray-900/80 px-3 py-1 text-xs text-white">
                Out of stock
              </span>
            )}
            <img
              src={mainImage}
              alt={data?.name}
              className="w-full aspect-square object-contain rounded-xl bg-white"
              onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
              draggable={false}
            />
          </div>

          {gallery.length > 1 && (
            // Thumbs: grid on desktop, horizontal scroll on mobile
            <div className="gap-3 grid grid-cols-5 max-lg:grid-cols-4 max-sm:grid-cols-3 overflow-x-auto no-scrollbar">
              {gallery.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  aria-label={`Select image ${idx + 1}`}
                  className={`rounded-xl border p-1 bg-gray-50 hover:shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                    idx === activeIdx
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-200"
                  }`}
                >
                  <img
                    src={img}
                    alt={`thumbnail ${idx + 1}`}
                    className="aspect-square w-full object-contain rounded-lg bg-white"
                    onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details */}
        <section aria-labelledby="product-title">
          <p className="text-xs sm:text-sm text-gray-600">{data?.brand?.name}</p>
          <h1 id="product-title" className="mt-2 text-2xl lg:text-3xl font-semibold text-gray-900">
            {data?.name}
          </h1>

          {/* Ratings placeholder */}
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <div className="flex" aria-label="Rating: 4.5 out of 5">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className="w-4 h-4 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.347l-2.985 2.134c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.38 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <button className="hover:underline focus:underline">22 reviews</button>
          </div>

          {/* Price */}
          <div className="mt-5 flex items-end gap-3">
            <span className="text-teal-600 font-bold text-2xl">
              {currency(discounted)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-gray-400 line-through">
                  {currency(priceOut)}
                </span>
                <span className="text-xs rounded bg-red-100 text-red-600 px-2 py-1 font-semibold">
                  -{discountPct}%
                </span>
              </>
            )}
            {isFetching && (
              <span className="text-xs text-gray-400">updating…</span>
            )}
          </div>

          {/* Short description */}
          {data?.shortDescription && (
            <p className="mt-3 text-gray-700">{data.shortDescription}</p>
          )}
          <p className="mt-3 text-gray-700 leading-7 whitespace-pre-line">
            {data?.description}
          </p>

          {/* Stock/Status */}
          <div className="mt-4">
            {hasStock ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-green-700 text-sm">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                In stock ({stock})
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-gray-600 text-sm">
                <span className="h-2 w-2 rounded-full bg-gray-400" />
                Out of stock
              </span>
            )}
          </div>

          {/* Quantity */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="qty">
              Quantity
            </label>
            <div className="inline-flex items-center rounded border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={sub}
                className="px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
                disabled={!hasStock}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <input
                id="qty"
                className="w-16 text-center outline-none py-2"
                value={qty}
                onChange={onQtyChange}
                inputMode="numeric"
                pattern="[0-9]*"
                disabled={!hasStock}
                aria-live="polite"
              />
              <button
                type="button"
                onClick={add}
                className="px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
                disabled={!hasStock}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Max: {Math.max(stock, 1)}</p>
          </div>

          {/* CTA */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={!hasStock}
              className={`w-full sm:w-auto inline-flex items-center justify-center rounded-lg px-5 py-3 text-white font-medium transition focus:outline-none focus:ring-2 focus:ring-gray-300 ${
                hasStock ? "bg-gray-900 hover:bg-black" : "bg-gray-400 cursor-not-allowed"
              }`}
              onClick={() => {
                // TODO: wire to your cart action
                // addToCart({ id, qty })
              }}
              aria-disabled={!hasStock}
            >
              Add to Cart
            </button>
            <button
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg px-5 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
          </div>

          {/* Collapsible Specifications */}
          <div className="mt-8 border-t pt-4">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between text-gray-800 font-medium">
                Specifications
                <span className="transition-transform group-open:rotate-180">
                  <svg width="16" height="16" viewBox="0 0 10 6" fill="none" aria-hidden="true">
                    <path
                      d="M9 1L5 5L1 1"
                      stroke="#4B5563"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </summary>

              <div className="mt-3 text-sm text-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
                <Spec label="Processor" value={data?.computerSpec?.processor} />
                <Spec label="RAM" value={data?.computerSpec?.ram} />
                <Spec label="Storage" value={data?.computerSpec?.storage} />
                <Spec label="GPU" value={data?.computerSpec?.gpu} />
                <Spec label="OS" value={data?.computerSpec?.os} />
                <Spec label="Screen" value={data?.computerSpec?.screenSize} />
                <Spec label="Battery" value={data?.computerSpec?.battery} />
              </div>
            </details>
          </div>

          {/* Trust badges / policies */}
          <div className="mt-6 grid sm:grid-cols-3 gap-3 text-xs text-gray-600">
            <Badge>🚚 Fast shipping</Badge>
            <Badge>🔄 7-day returns</Badge>
            <Badge>🔒 Secure checkout</Badge>
          </div>
        </section>
      </div>
    </div>
  );
}

function Spec({ label, value }) {
  return (
    <div className="flex justify-between sm:justify-start sm:gap-3">
      <span className="text-gray-500">{label}:</span>
      <span className="font-medium">{value ?? "N/A"}</span>
    </div>
  );
}

function Badge({ children }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-center">
      {children}
    </div>
  );
}

/* Tailwind helpers (optional)
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
*/
