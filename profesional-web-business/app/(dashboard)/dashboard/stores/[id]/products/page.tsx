import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireStoreAccess } from "@/lib/store-access";
import ProductsList from "@/components/products-list";

export default async function ProductsPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  let role;
  try {
    const access = await requireStoreAccess(params.id);
    role = access.role;
  } catch (error: any) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error.message || "Access denied"}
        </div>
      </div>
    );
  }

  const [store, products, categories, tags] = await Promise.all([
    prisma.store.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, slug: true },
    }),
    prisma.product.findMany({
      where: { storeId: params.id },
      include: {
        category: true,
        tags: true,
        images: { orderBy: { order: "asc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { storeId: params.id },
      orderBy: { name: "asc" },
    }),
    prisma.tag.findMany({
      where: { storeId: params.id },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!store) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          Store not found
        </div>
      </div>
    );
  }

  return (
    <ProductsList
      storeId={params.id}
      store={store}
      products={products}
      categories={categories}
      tags={tags}
      role={role}
    />
  );
}

