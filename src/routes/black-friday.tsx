import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

type ShopifyImage = { src: string; alt?: string };
type ShopifyVariant = { price: string; compare_at_price?: string | null; available: boolean };
type ShopifyProduct = {
  id: number;
  title: string;
  handle: string;
  product_type?: string;
  tags?: string[];
  images: ShopifyImage[];
  variants: ShopifyVariant[];
};

export const Route = createFileRoute("/black-friday")({
  component: BlackFridayPage,
});

const STORE = "https://www.myfyxx.com";

function BlackFridayPage() {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("All");
  const [discount, setDiscount] = useState(0);
  const [sort, setSort] = useState("featured");

  useEffect(() => {
    let cancelled = false;
    fetch(`${STORE}/products.json?limit=250`)
      .then((response) => {
        if (!response.ok) throw new Error("The Shopify product feed is unavailable.");
        return response.json();
      })
      .then((data) => {
        if (!cancelled) setProducts(Array.isArray(data.products) ? data.products : []);
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load products.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.product_type).filter(Boolean) as string[])).sort()],
    [products],
  );

  const getPrice = (product: ShopifyProduct) => {
    const variant = product.variants?.find((v) => v.available) ?? product.variants?.[0];
    const price = Number(variant?.price ?? 0);
    const compare = Number(variant?.compare_at_price ?? 0);
    const percent = compare > price && compare > 0 ? Math.round(((compare - price) / compare) * 100) : 0;
    return { price, compare, percent, available: Boolean(variant?.available) };
  };

  const visibleProducts = useMemo(() => {
    const list = products.filter((p) => {
      const price = getPrice(p);
      const categoryMatch = category === "All" || p.product_type === category;
      return categoryMatch && price.percent >= discount && price.percent > 0;
    });
    if (sort === "discount") list.sort((a, b) => getPrice(b).percent - getPrice(a).percent);
    if (sort === "low") list.sort((a, b) => getPrice(a).price - getPrice(b).price);
    if (sort === "high") list.sort((a, b) => getPrice(b).price - getPrice(a).price);
    return list;
  }, [products, category, discount, sort]);

  const money = (amount: number) => new Intl.NumberFormat("en-JO", {
    style: "currency", currency: "JOD", maximumFractionDigits: 2,
  }).format(amount);

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <div className="bg-neutral-950 px-4 py-3 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-white">
        FYXX · Black Friday
      </div>
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <a href={STORE} className="font-serif text-3xl font-bold tracking-[0.22em]">FYXX</a>
          <a href={STORE} className="text-xs uppercase tracking-[0.16em] underline underline-offset-4">Shop FYXX</a>
        </div>
      </header>
      <section className="bg-[#eeeae4] px-5 py-20 text-center sm:py-28">
        <p className="text-[10px] uppercase tracking-[0.28em]">The FYXX sale edit</p>
        <h1 className="mt-5 font-serif text-5xl leading-none tracking-tight sm:text-7xl md:text-8xl">BLACK FRIDAY</h1>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-6 text-neutral-600">Your FYXX favourites, marked down. Find the offers by category and discount.</p>
        <a href="#offers" className="mt-8 inline-flex bg-neutral-950 px-8 py-4 text-[10px] uppercase tracking-[0.18em] text-white">Explore offers</a>
      </section>
      <main id="offers" className="mx-auto max-w-7xl px-5 py-14 sm:py-20">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div><p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">The collection</p><h2 className="mt-2 font-serif text-4xl">Shop the offers</h2></div>
          <p className="text-xs text-neutral-500">{loading ? "Loading Shopify products…" : `${visibleProducts.length} offers`}</p>
        </div>
        <div className="mt-8 grid gap-7 border-y border-neutral-200 py-7 md:grid-cols-[1fr_1fr_auto]">
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.18em]">Category</p>
            <div className="flex flex-wrap gap-2">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`border px-3 py-2 text-[10px] ${category === item ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-300 bg-white"}`}>{item}</button>)}</div>
          </div>
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.18em]">Discount</p>
            <div className="flex flex-wrap gap-2">{[0, 10, 20, 30, 40, 50, 60, 70].map((value) => <button key={value} onClick={() => setDiscount(value)} className={`border px-3 py-2 text-[10px] ${discount === value ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-300 bg-white"}`}>{value === 0 ? "All" : `${value}%+`}</button>)}</div>
          </div>
          <div className="flex flex-col justify-between gap-3 md:items-end">
            <button onClick={() => { setCategory("All"); setDiscount(0); setSort("featured"); }} className="text-left text-[11px] underline md:text-right">Clear filters</button>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="border border-neutral-300 bg-white px-3 py-2 text-xs">
              <option value="featured">Featured</option><option value="discount">Highest discount</option><option value="low">Lowest price</option><option value="high">Highest price</option>
            </select>
          </div>
        </div>
        {error && <p className="my-8 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">{error} If this feed is blocked by the store, connect a Shopify Storefront API token to load products securely.</p>}
        {loading ? <div className="py-20 text-center text-sm text-neutral-500">Loading live products…</div> :
          visibleProducts.length ? <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
            {visibleProducts.map((product) => {
              const price = getPrice(product);
              return <a key={product.id} href={`${STORE}/products/${product.handle}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden bg-[#f4f2ef]">
                  {product.images?.[0]?.src && <img src={product.images[0].src} alt={product.images[0].alt || product.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />}
                  <span className="absolute left-3 top-3 bg-neutral-950 px-2 py-1 text-[10px] text-white">{price.percent}% OFF</span>
                </div>
                <p className="mt-3 line-clamp-2 text-xs leading-5">{product.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs"><span className="font-semibold">{money(price.price)}</span><span className="text-neutral-400 line-through">{money(price.compare)}</span></div>
              </a>;
            })}
          </div> : !error ? <div className="py-20 text-center"><p className="font-serif text-2xl">No discounted products found</p><p className="mt-2 text-sm text-neutral-500">Try another category or discount filter.</p></div> : null}
      </main>
      <footer className="border-t border-neutral-200 px-5 py-8 text-center text-[10px] uppercase tracking-[0.18em] text-neutral-500">FYXX · Amman, Jordan</footer>
    </div>
  );
}
