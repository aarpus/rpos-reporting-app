"use client";

import { Badge } from "@/components/tailgrids/core/badge";
import { Checkbox } from "@/components/tailgrids/core/checkbox";
import {
  Dialog,
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/tailgrids/core/dialog";
import type { AdminUser, UserAccessStore } from "@/types/user-admin";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { IconType } from "react-icons";
import {
  LuCircleCheck,
  LuPencil,
  LuPlus,
  LuSearch,
  LuStore,
  LuUserRound,
  LuUsers,
} from "react-icons/lu";
import { toast } from "sonner";

const inputClass =
  "h-10 w-full rounded-lg border border-card-border bg-input-background px-3 text-sm text-text-primary outline-none focus:border-input-primary-focus-border focus:ring-4 focus:ring-input-primary-focus-border/20 disabled:cursor-not-allowed disabled:opacity-60";
const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:pointer-events-none disabled:opacity-60";
const outlineButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-card-border bg-card-background px-3 py-2 text-sm font-semibold text-text-secondary transition hover:bg-background-gray-secondary disabled:pointer-events-none disabled:opacity-60";

async function readResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null) as (T & { error?: string }) | null;
  if (!response.ok) throw new Error(body?.error || "The request could not be completed.");
  return body as T;
}

export function UserManagement({ initialUsers }: { initialUsers: AdminUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [formUser, setFormUser] = useState<AdminUser | "new" | null>(null);
  const [accessUser, setAccessUser] = useState<AdminUser | null>(null);
  const [statusUser, setStatusUser] = useState<AdminUser | null>(null);
  const router = useRouter();

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      [user.name, user.email, user.active ? "active" : "inactive"]
        .some((value) => value.toLowerCase().includes(term)),
    );
  }, [query, users]);

  function upsertUser(user: AdminUser) {
    setUsers((current) => {
      const exists = current.some((item) => item.id === user.id);
      const next = exists
        ? current.map((item) => item.id === user.id ? user : item)
        : [...current, user];
      return next.sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));
    });
    router.refresh();
  }

  function updateAssignedCount(userId: string, assignedStoreCount: number) {
    setUsers((current) => current.map((user) =>
      user.id === userId ? { ...user, assignedStoreCount } : user,
    ));
  }

  const activeCount = users.filter((user) => user.active).length;
  const totalAssignments = users.reduce((total, user) => total + user.assignedStoreCount, 0);

  return (
    <div className="space-y-6 px-3 py-6 sm:px-5 lg:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary-500">Administration</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary sm:text-[28px]">
            User Management
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-text-tertiary">
            Create user accounts, maintain their details, and assign the stores they can access.
          </p>
        </div>
        <button type="button" onClick={() => setFormUser("new")} className={primaryButtonClass}>
          <LuPlus className="size-4" /> Add User
        </button>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <SummaryCard icon={LuUsers} label="Total users" value={users.length} />
        <SummaryCard icon={LuCircleCheck} label="Active users" value={activeCount} />
        <SummaryCard icon={LuStore} label="Store assignments" value={totalAssignments} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-card-border bg-card-surface-area shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-card-border px-4 py-4 sm:px-5">
          <div>
            <h2 className="font-semibold text-text-primary">Users</h2>
            <p className="mt-0.5 text-xs text-text-tertiary">Administrator accounts are not shown or editable here.</p>
          </div>
          <label className="relative block w-full sm:w-72">
            <span className="sr-only">Search users</span>
            <LuSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-icon-tertiary" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users"
              className={`${inputClass} pl-9`}
            />
          </label>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <LuUserRound className="mx-auto size-9 text-icon-tertiary" />
            <p className="mt-3 text-sm font-semibold text-text-primary">
              {users.length ? "No users match your search" : "No users yet"}
            </p>
            <p className="mt-1 text-xs text-text-tertiary">
              {users.length ? "Try another name, email address, or status." : "Add the first user to get started."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left">
                <thead className="bg-background-gray-secondary text-xs text-text-tertiary">
                  <tr>
                    <th className="px-5 py-3 font-medium">User</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Stores</th>
                    <th className="px-5 py-3 font-medium">Created</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-text-primary">{user.name}</p>
                        <p className="mt-0.5 text-xs text-text-tertiary">{user.email}</p>
                      </td>
                      <td className="px-5 py-4"><UserStatus active={user.active} /></td>
                      <td className="px-5 py-4 text-sm text-text-secondary">{user.assignedStoreCount}</td>
                      <td className="px-5 py-4 text-sm text-text-secondary">
                        {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(user.createdAt))}
                      </td>
                      <td className="px-5 py-4">
                        <UserActions
                          user={user}
                          onEdit={() => setFormUser(user)}
                          onAccess={() => setAccessUser(user)}
                          onStatus={() => setStatusUser(user)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-card-border md:hidden">
              {filteredUsers.map((user) => (
                <article key={user.id} className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-text-primary">{user.name}</h3>
                      <p className="mt-0.5 truncate text-xs text-text-tertiary">{user.email}</p>
                    </div>
                    <UserStatus active={user.active} />
                  </div>
                  <p className="text-xs text-text-secondary">{user.assignedStoreCount} assigned stores</p>
                  <UserActions
                    user={user}
                    onEdit={() => setFormUser(user)}
                    onAccess={() => setAccessUser(user)}
                    onStatus={() => setStatusUser(user)}
                  />
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {formUser && (
        <UserFormDialog
          key={formUser === "new" ? "new" : formUser.id}
          user={formUser === "new" ? null : formUser}
          onClose={() => setFormUser(null)}
          onSaved={upsertUser}
        />
      )}
      {accessUser && (
        <AccessDialog
          key={accessUser.id}
          user={accessUser}
          onClose={() => setAccessUser(null)}
          onSaved={(count) => updateAssignedCount(accessUser.id, count)}
        />
      )}
      {statusUser && (
        <StatusDialog
          key={`${statusUser.id}-${statusUser.active}`}
          user={statusUser}
          onClose={() => setStatusUser(null)}
          onSaved={upsertUser}
        />
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: IconType; label: string; value: number }) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-card-border bg-card-surface-area p-4 shadow-xs">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-badge-primary-background text-badge-primary-icon-color">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-xs text-text-tertiary">{label}</p>
        <p className="mt-0.5 text-xl font-semibold text-text-primary">{value}</p>
      </div>
    </article>
  );
}

function UserStatus({ active }: { active: boolean }) {
  return <Badge color={active ? "success" : "gray"}>{active ? "Active" : "Inactive"}</Badge>;
}

function UserActions({
  user,
  onEdit,
  onAccess,
  onStatus,
}: {
  user: AdminUser;
  onEdit: () => void;
  onAccess: () => void;
  onStatus: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <button type="button" onClick={onAccess} className={outlineButtonClass}>
        <LuStore className="size-4" /> Stores
      </button>
      <button type="button" onClick={onEdit} className={outlineButtonClass}>
        <LuPencil className="size-4" /> Edit
      </button>
      <button
        type="button"
        onClick={onStatus}
        className={user.active ? `${outlineButtonClass} text-error-500` : outlineButtonClass}
      >
        {user.active ? "Deactivate" : "Reactivate"}
      </button>
    </div>
  );
}

function UserFormDialog({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUser | null;
  onClose: () => void;
  onSaved: (user: AdminUser) => void;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch(user ? `/api/admin/users/${user.id}` : "/api/admin/users", {
        method: user ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user ? { name, email, ...(password ? { password } : {}) } : { name, email, password }),
      });
      const body = await readResponse<{ user: AdminUser }>(response);
      onSaved(body.user);
      toast.success(user ? "User updated." : "User created.");
      onClose();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save the user.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog isOpen onOpenChange={(open) => !open && onClose()}>
      <form onSubmit={submit}>
        <DialogHeader>
          <DialogTitle>{user ? "Edit user" : "Add user"}</DialogTitle>
          <DialogDescription>
            {user ? "Update the account details or enter a new password to reset it." : "Create a user account. Store access can be assigned after creation."}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-input-label-text">Name</span>
            <input required maxLength={120} disabled={pending} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} placeholder="Jane Smith" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-input-label-text">Email address</span>
            <input required type="email" maxLength={254} disabled={pending} value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} placeholder="jane@example.com" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-input-label-text">{user ? "New password (optional)" : "Password"}</span>
            <input required={!user} type="password" minLength={8} maxLength={256} autoComplete="new-password" disabled={pending} value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} />
            <span className="block text-xs text-text-tertiary">Use at least 8 characters.</span>
          </label>
          {error && <p role="alert" className="rounded-lg bg-badge-error-background px-3 py-2 text-sm text-badge-error-text">{error}</p>}
        </DialogBody>
        <DialogFooter>
          <button type="button" disabled={pending} onClick={onClose} className={outlineButtonClass}>Cancel</button>
          <button type="submit" disabled={pending} className={primaryButtonClass}>
            {pending ? "Saving…" : user ? "Save changes" : "Add user"}
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

function AccessDialog({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUser;
  onClose: () => void;
  onSaved: (count: number) => void;
}) {
  const [stores, setStores] = useState<UserAccessStore[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void fetch(`/api/admin/users/${user.id}/access`)
      .then((response) => readResponse<{ stores: UserAccessStore[] }>(response))
      .then((body) => {
        setStores(body.stores);
        setSelected(new Set(body.stores.filter((store) => store.assigned).map((store) => store.storeCode)));
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Unable to load stores."));
  }, [user.id]);

  const filteredStores = useMemo(() => {
    if (!stores) return [];
    const term = query.trim().toLowerCase();
    if (!term) return stores;
    return stores.filter((store) => `${store.name} ${store.storeCode}`.toLowerCase().includes(term));
  }, [query, stores]);

  function toggleStore(storeCode: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(storeCode);
      else next.delete(storeCode);
      return next;
    });
  }

  async function save() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/access`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeCodes: [...selected] }),
      });
      const body = await readResponse<{ assignedStoreCount: number }>(response);
      onSaved(body.assignedStoreCount);
      toast.success("User store access updated.");
      onClose();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update store access.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog isOpen onOpenChange={(open) => !open && onClose()} className="max-w-160">
      <DialogHeader>
        <DialogTitle>Assign stores</DialogTitle>
        <DialogDescription>{user.name} ({user.email})</DialogDescription>
      </DialogHeader>
      <DialogBody className="space-y-3">
        <label className="relative block">
          <span className="sr-only">Search stores</span>
          <LuSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-icon-tertiary" />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search stores" className={`${inputClass} pl-9`} />
        </label>
        <div className="max-h-80 overflow-y-auto rounded-xl border border-card-border">
          {!stores && !error ? (
            <p className="p-5 text-sm text-text-tertiary">Loading stores…</p>
          ) : filteredStores.length ? (
            <div className="divide-y divide-card-border">
              {filteredStores.map((store) => (
                <Checkbox
                  key={store.storeCode}
                  size="md"
                  isSelected={selected.has(store.storeCode)}
                  onChange={(checked) => toggleStore(store.storeCode, checked)}
                  className="flex w-full px-4 py-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                      {store.name}
                      {!store.active && <Badge color="gray">Inactive</Badge>}
                    </span>
                    <span className="block truncate text-xs text-text-tertiary">{store.storeCode}</span>
                  </span>
                </Checkbox>
              ))}
            </div>
          ) : (
            <p className="p-5 text-sm text-text-tertiary">No stores found.</p>
          )}
        </div>
        <p className="text-xs text-text-tertiary">{selected.size} stores selected. Inactive stores retain assignments but are unavailable in reporting.</p>
        {error && <p role="alert" className="rounded-lg bg-badge-error-background px-3 py-2 text-sm text-badge-error-text">{error}</p>}
      </DialogBody>
      <DialogFooter>
        <button type="button" disabled={pending} onClick={onClose} className={outlineButtonClass}>Cancel</button>
        <button type="button" disabled={pending || !stores} onClick={() => void save()} className={primaryButtonClass}>
          {pending ? "Saving…" : "Save access"}
        </button>
      </DialogFooter>
    </Dialog>
  );
}

function StatusDialog({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUser;
  onClose: () => void;
  onSaved: (user: AdminUser) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !user.active }),
      });
      const body = await readResponse<{ user: AdminUser }>(response);
      onSaved(body.user);
      toast.success(user.active ? "User deactivated." : "User reactivated.");
      onClose();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update user status.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog isOpen onOpenChange={(open) => !open && onClose()}>
      <DialogHeader>
        <DialogTitle>{user.active ? "Deactivate user?" : "Reactivate user?"}</DialogTitle>
        <DialogDescription>
          {user.active
            ? `${user.name} will no longer be able to sign in. Their store assignments and historical data will be kept.`
            : `${user.name} will be able to sign in and access their assigned active stores again.`}
        </DialogDescription>
      </DialogHeader>
      {error && <DialogBody><p role="alert" className="rounded-lg bg-badge-error-background px-3 py-2 text-sm text-badge-error-text">{error}</p></DialogBody>}
      <DialogFooter>
        <button type="button" disabled={pending} onClick={onClose} className={outlineButtonClass}>Cancel</button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void updateStatus()}
          className={user.active ? `${primaryButtonClass} bg-error-500 hover:bg-error-600` : primaryButtonClass}
        >
          {pending ? "Saving…" : user.active ? "Deactivate" : "Reactivate"}
        </button>
      </DialogFooter>
    </Dialog>
  );
}
