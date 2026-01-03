import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's stores (owned + member)
  const ownedStores = await prisma.store.findMany({
    where: { ownerId: user.id },
    include: {
      _count: {
        select: {
          products: true,
          customers: true,
          messages: { where: { isRead: false } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const memberStores = await prisma.storeMember.findMany({
    where: { userId: user.id },
    include: {
      store: {
        include: {
          _count: {
            select: {
              products: true,
              customers: true,
              messages: { where: { isRead: false } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Welcome back, {user.name}! Manage your stores and view statistics.
        </p>
      </div>

      <div className="mb-6">
        <Link
          href="/dashboard/stores/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Create New Store
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Owned Stores */}
        {ownedStores.map((store) => (
          <div
            key={store.id}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{store.name}</h3>
                <p className="text-sm text-gray-500 mt-1">Owner</p>
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <div>Products: {store._count.products}</div>
                  <div>Customers: {store._count.customers}</div>
                  <div>Unread Messages: {store._count.messages}</div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <Link
                href={`/dashboard/stores/${store.id}`}
                className="flex-1 text-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
              >
                Manage
              </Link>
              <Link
                href={`/store/${store.slug}`}
                target="_blank"
                className="flex-1 text-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                View Store
              </Link>
            </div>
          </div>
        ))}

        {/* Member Stores */}
        {memberStores.map((member) => (
          <div
            key={member.store.id}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{member.store.name}</h3>
                <p className="text-sm text-gray-500 mt-1">Role: {member.role}</p>
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <div>Products: {member.store._count.products}</div>
                  <div>Customers: {member.store._count.customers}</div>
                  <div>Unread Messages: {member.store._count.messages}</div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <Link
                href={`/dashboard/stores/${member.store.id}`}
                className="flex-1 text-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
              >
                Manage
              </Link>
              <Link
                href={`/store/${member.store.slug}`}
                target="_blank"
                className="flex-1 text-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                View Store
              </Link>
            </div>
          </div>
        ))}
      </div>

      {ownedStores.length === 0 && memberStores.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">You don't have any stores yet.</p>
          <Link
            href="/dashboard/stores/new"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Create Your First Store
          </Link>
        </div>
      )}
    </div>
  );
}

