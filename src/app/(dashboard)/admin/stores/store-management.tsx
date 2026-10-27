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
import {
  Select,
  SelectContent,
  SelectIndicator,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/tailgrids/core/select";
import type {
  AdminStore,
  IssuedPosCredential,
  PosCredentialSummary,
  StoreAccessUser,
} from "@/types/store-admin";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  LuBuilding2,
  LuCopy,
  LuKeyRound,
  LuPencil,
  LuPlus,
  LuSearch,
  LuShieldCheck,
  LuStore,
  LuUsers,
} from "react-icons/lu";
import { toast } from "sonner";
import type { IconType } from "react-icons";
import { storeTypeLabel, type StoreType } from "@/lib/store-type";

const inputClass =
  "h-10 w-full rounded-lg border border-card-border bg-input-background px-3 text-sm text-text-primary outline-none focus:border-input-primary-focus-border focus:ring-4 focus:ring-input-primary-focus-border/20 disabled:cursor-not-allowed disabled:opacity-60";
const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:pointer-events-none disabled:opacity-60";
const outlineButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-card-border bg-card-background px-3 py-2 text-sm font-semibold text-text-secondary transition hover:bg-background-gray-secondary disabled:pointer-events-none disabled:opacity-60";

function getTimezones(current?: string) {
  const supported =
    typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : [];
  return [...new Set(["UTC", ...(current ? [current] : []), ...supported])];
}

async function readResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;
  if (!response.ok)
    throw new Error(body?.error || "The request could not be completed.");
  return body as T;
}

export function StoreManagement({
  initialStores,
}: {
  initialStores: AdminStore[];
}) {
  const [stores, setStores] = useState(initialStores);
  const [query, setQuery] = useState("");
  const [formStore, setFormStore] = useState<AdminStore | "new" | null>(null);
  const [accessStore, setAccessStore] = useState<AdminStore | null>(null);
  const [statusStore, setStatusStore] = useState<AdminStore | null>(null);
  const [credentialStore, setCredentialStore] = useState<AdminStore | null>(
    null,
  );
  const router = useRouter();

  const filteredStores = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return stores;
    return stores.filter((store) =>
      [
        store.storeCode,
        store.name,
        store.timezone,
        store.storeType,
        storeTypeLabel(store.storeType),
        store.active ? "active" : "inactive",
      ].some((value) => value.toLowerCase().includes(term)),
    );
  }, [query, stores]);

  function upsertStore(store: AdminStore, refresh = true) {
    setStores((current) => {
      const exists = current.some((item) => item.storeCode === store.storeCode);
      const next = exists
        ? current.map((item) =>
            item.storeCode === store.storeCode ? store : item,
          )
        : [...current, store];
      return next.sort(
        (a, b) =>
          a.name.localeCompare(b.name) ||
          a.storeCode.localeCompare(b.storeCode),
      );
    });
    if (refresh) router.refresh();
  }

  function updateAssignedCount(storeCode: string, assignedUserCount: number) {
    setStores((current) =>
      current.map((store) =>
        store.storeCode === storeCode ? { ...store, assignedUserCount } : store,
      ),
    );
  }

  const activeCount = stores.filter((store) => store.active).length;
  const totalAssignments = stores.reduce(
    (total, store) => total + store.assignedUserCount,
    0,
  );

  return (
    <div className="space-y-6 px-3 py-6 sm:px-5 lg:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary-500">Administration</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary sm:text-[28px]">
            Store Management
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-text-tertiary">
            Create stores, issue POS credentials, and control which users can
            access each location.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormStore("new")}
          className={primaryButtonClass}
        >
          <LuPlus className="size-4" /> Add Store
        </button>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={LuStore}
          label="Total stores"
          value={stores.length}
        />
        <SummaryCard
          icon={LuBuilding2}
          label="Active stores"
          value={activeCount}
        />
        <SummaryCard
          icon={LuShieldCheck}
          label="User assignments"
          value={totalAssignments}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-card-border bg-card-surface-area shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-card-border px-4 py-4 sm:px-5">
          <div>
            <h2 className="font-semibold text-text-primary">Stores</h2>
            <p className="mt-0.5 text-xs text-text-tertiary">
              Inactive stores retain their data and assignments.
            </p>
          </div>
          <label className="relative block w-full sm:w-72">
            <span className="sr-only">Search stores</span>
            <LuSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-icon-tertiary" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search stores"
              className={`${inputClass} pl-9`}
            />
          </label>
        </div>

        {filteredStores.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <LuStore className="mx-auto size-9 text-icon-tertiary" />
            <p className="mt-3 text-sm font-semibold text-text-primary">
              {stores.length ? "No stores match your search" : "No stores yet"}
            </p>
            <p className="mt-1 text-xs text-text-tertiary">
              {stores.length
                ? "Try another name, code, timezone, or status."
                : "Add the first store to get started."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left">
                <thead className="bg-background-gray-secondary text-xs text-text-tertiary">
                  <tr>
                    <th className="px-5 py-3 font-medium">Store</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Timezone</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Users</th>
                    <th className="px-5 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {filteredStores.map((store) => (
                    <tr key={store.storeCode}>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-text-primary">
                          {store.name}
                        </p>
                        <p className="mt-0.5 text-xs text-text-tertiary">
                          {store.storeCode}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm text-text-secondary">
                        {storeTypeLabel(store.storeType)}
                      </td>
                      <td className="px-5 py-4 text-sm text-text-secondary">
                        {store.timezone}
                      </td>
                      <td className="px-5 py-4">
                        <StoreStatus active={store.active} />
                      </td>
                      <td className="px-5 py-4 text-sm text-text-secondary">
                        {store.assignedUserCount}
                      </td>
                      <td className="px-5 py-4">
                        <StoreActions
                          store={store}
                          onEdit={() => setFormStore(store)}
                          onAccess={() => setAccessStore(store)}
                          onStatus={() => setStatusStore(store)}
                          onCredential={() => setCredentialStore(store)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-card-border md:hidden">
              {filteredStores.map((store) => (
                <article key={store.storeCode} className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-text-primary">
                        {store.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-text-tertiary">
                        {store.storeCode} · {storeTypeLabel(store.storeType)} ·{" "}
                        {store.timezone}
                      </p>
                    </div>
                    <StoreStatus active={store.active} />
                  </div>
                  <p className="text-xs text-text-secondary">
                    {store.assignedUserCount} assigned users
                  </p>
                  <StoreActions
                    store={store}
                    onEdit={() => setFormStore(store)}
                    onAccess={() => setAccessStore(store)}
                    onStatus={() => setStatusStore(store)}
                    onCredential={() => setCredentialStore(store)}
                  />
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {formStore && (
        <StoreFormDialog
          key={formStore === "new" ? "new" : formStore.storeCode}
          store={formStore === "new" ? null : formStore}
          onClose={() => setFormStore(null)}
          onSaved={(saved, refresh = true) => upsertStore(saved, refresh)}
          onCreated={(created) => {
            setFormStore(null);
            setCredentialStore(created);
          }}
        />
      )}
      {credentialStore && (
        <PosCredentialDialog
          key={credentialStore.storeCode}
          store={credentialStore}
          onClose={() => {
            setCredentialStore(null);
            router.refresh();
          }}
        />
      )}
      {accessStore && (
        <AccessDialog
          key={accessStore.storeCode}
          store={accessStore}
          onClose={() => setAccessStore(null)}
          onSaved={(count) => updateAssignedCount(accessStore.storeCode, count)}
        />
      )}
      {statusStore && (
        <StatusDialog
          key={`${statusStore.storeCode}-${statusStore.active}`}
          store={statusStore}
          onClose={() => setStatusStore(null)}
          onSaved={upsertStore}
        />
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: IconType;
  label: string;
  value: number;
}) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-card-border bg-card-surface-area p-4 shadow-xs">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-badge-primary-background text-badge-primary-icon-color">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-xs text-text-tertiary">{label}</p>
        <p className="mt-0.5 text-xl font-semibold text-text-primary">
          {value}
        </p>
      </div>
    </article>
  );
}

function StoreStatus({ active }: { active: boolean }) {
  return (
    <Badge color={active ? "success" : "gray"}>
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

function StoreActions({
  store,
  onEdit,
  onAccess,
  onStatus,
  onCredential,
}: {
  store: AdminStore;
  onEdit: () => void;
  onAccess: () => void;
  onStatus: () => void;
  onCredential: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <button
        type="button"
        onClick={onCredential}
        className={outlineButtonClass}
      >
        <LuKeyRound className="size-4" /> POS credential
      </button>
      <button type="button" onClick={onAccess} className={outlineButtonClass}>
        <LuUsers className="size-4" /> Access
      </button>
      <button type="button" onClick={onEdit} className={outlineButtonClass}>
        <LuPencil className="size-4" /> Edit
      </button>
      <button
        type="button"
        onClick={onStatus}
        className={
          store.active
            ? `${outlineButtonClass} text-error-500`
            : outlineButtonClass
        }
      >
        {store.active ? "Deactivate" : "Reactivate"}
      </button>
    </div>
  );
}

function StoreFormDialog({
  store,
  onClose,
  onSaved,
  onCreated,
}: {
  store: AdminStore | null;
  onClose: () => void;
  onSaved: (store: AdminStore, refresh?: boolean) => void;
  onCreated: (store: AdminStore) => void;
}) {
  const [storeCode, setStoreCode] = useState(store?.storeCode ?? "");
  const [name, setName] = useState(store?.name ?? "");
  const [timezone, setTimezone] = useState(store?.timezone ?? "UTC");
  const [storeType, setStoreType] = useState<StoreType>(
    store?.storeType ?? "RESTAURANT",
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timezones = useMemo(
    () => getTimezones(store?.timezone),
    [store?.timezone],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch(
        store
          ? `/api/admin/stores/${encodeURIComponent(store.storeCode)}`
          : "/api/admin/stores",
        {
          method: store ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            store
              ? { name, timezone }
              : { storeCode, name, timezone, storeType },
          ),
        },
      );
      const body = await readResponse<{ store: AdminStore }>(response);
      if (store) {
        onSaved(body.store);
        toast.success("Store updated.");
        onClose();
      } else {
        onSaved(body.store, false);
        toast.success("Store created.");
        onCreated(body.store);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save the store.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog isOpen onOpenChange={(open) => !open && onClose()}>
      <form onSubmit={submit}>
        <DialogHeader>
          <DialogTitle>{store ? "Edit store" : "Add store"}</DialogTitle>
          <DialogDescription>
            {store
              ? "Update the store name or operating timezone."
              : "Create a new location and choose Restaurant POS or Retail POS."}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-input-label-text">
              Store code
            </span>
            <input
              required
              maxLength={64}
              disabled={Boolean(store) || pending}
              value={storeCode}
              onChange={(event) =>
                setStoreCode(event.target.value.toUpperCase())
              }
              className={inputClass}
              placeholder="DT01"
            />
            <span className="block text-xs text-text-tertiary">
              Store codes are permanent after creation.
            </span>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-input-label-text">
              Store name
            </span>
            <input
              required
              maxLength={160}
              disabled={pending}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClass}
              placeholder="Downtown Store"
            />
          </label>
          {!store && (
            <Select
              value={storeType}
              isDisabled={pending}
              onChange={(key) => {
                if (key === "RESTAURANT" || key === "RETAIL") setStoreType(key);
              }}
              className="gap-1.5"
            >
              <SelectLabel>Store type</SelectLabel>
              <SelectTrigger className="h-10">
                <SelectValue />
                <SelectIndicator />
              </SelectTrigger>
              <SelectContent>
                <SelectItem id="RESTAURANT" textValue="Restaurant POS">
                  Restaurant POS
                </SelectItem>
                <SelectItem id="RETAIL" textValue="Retail POS">
                  Retail POS
                </SelectItem>
              </SelectContent>
            </Select>
          )}
          {store && (
            <p className="text-sm text-text-secondary">
              Store type: {storeTypeLabel(store.storeType)} for the life of this store.
            </p>
          )}
          <Select
            value={timezone}
            isDisabled={pending}
            onChange={(key) => setTimezone(String(key))}
            className="gap-1.5"
          >
            <SelectLabel>Timezone</SelectLabel>
            <SelectTrigger className="h-10">
              <SelectValue />
              <SelectIndicator />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {timezones.map((zone) => (
                <SelectItem key={zone} id={zone} textValue={zone}>
                  {zone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-badge-error-background px-3 py-2 text-sm text-badge-error-text"
            >
              {error}
            </p>
          )}
        </DialogBody>
        <DialogFooter>
          <button
            type="button"
            disabled={pending}
            onClick={onClose}
            className={outlineButtonClass}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className={primaryButtonClass}
          >
            {pending ? "Saving…" : store ? "Save changes" : "Add store"}
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

function AccessDialog({
  store,
  onClose,
  onSaved,
}: {
  store: AdminStore;
  onClose: () => void;
  onSaved: (count: number) => void;
}) {
  const [users, setUsers] = useState<StoreAccessUser[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void fetch(
      `/api/admin/stores/${encodeURIComponent(store.storeCode)}/access`,
    )
      .then((response) => readResponse<{ users: StoreAccessUser[] }>(response))
      .then((body) => {
        setUsers(body.users);
        setSelected(
          new Set(
            body.users.filter((user) => user.assigned).map((user) => user.id),
          ),
        );
      })
      .catch((requestError) =>
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load users.",
        ),
      );
  }, [store.storeCode]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const term = query.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      `${user.name} ${user.email}`.toLowerCase().includes(term),
    );
  }, [query, users]);

  function toggleUser(userId: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(userId);
      else next.delete(userId);
      return next;
    });
  }

  async function save() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/stores/${encodeURIComponent(store.storeCode)}/access`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: [...selected] }),
        },
      );
      const body = await readResponse<{ assignedUserCount: number }>(response);
      onSaved(body.assignedUserCount);
      toast.success("Store access updated.");
      onClose();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update store access.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      isOpen
      onOpenChange={(open) => !open && onClose()}
      className="max-w-160"
    >
      <DialogHeader>
        <DialogTitle>Manage access</DialogTitle>
        <DialogDescription>
          {store.name} ({store.storeCode})
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="space-y-3">
        <label className="relative block">
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
        <div className="max-h-80 overflow-y-auto rounded-xl border border-card-border">
          {!users && !error ? (
            <p className="p-5 text-sm text-text-tertiary">Loading users…</p>
          ) : filteredUsers.length ? (
            <div className="divide-y divide-card-border">
              {filteredUsers.map((user) => (
                <Checkbox
                  key={user.id}
                  size="md"
                  isSelected={selected.has(user.id)}
                  onChange={(checked) => toggleUser(user.id, checked)}
                  className="flex w-full px-4 py-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                      {user.name}
                      {!user.active && <Badge color="gray">Inactive</Badge>}
                    </span>
                    <span className="block truncate text-xs text-text-tertiary">
                      {user.email}
                    </span>
                  </span>
                </Checkbox>
              ))}
            </div>
          ) : (
            <p className="p-5 text-sm text-text-tertiary">
              No USER accounts found.
            </p>
          )}
        </div>
        <p className="text-xs text-text-tertiary">
          {selected.size} users selected. ADMIN accounts always have access.
        </p>
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-badge-error-background px-3 py-2 text-sm text-badge-error-text"
          >
            {error}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <button
          type="button"
          disabled={pending}
          onClick={onClose}
          className={outlineButtonClass}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={pending || !users}
          onClick={() => void save()}
          className={primaryButtonClass}
        >
          {pending ? "Saving…" : "Save access"}
        </button>
      </DialogFooter>
    </Dialog>
  );
}

function StatusDialog({
  store,
  onClose,
  onSaved,
}: {
  store: AdminStore;
  onClose: () => void;
  onSaved: (store: AdminStore) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/stores/${encodeURIComponent(store.storeCode)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: !store.active }),
        },
      );
      const body = await readResponse<{ store: AdminStore }>(response);
      onSaved(body.store);
      toast.success(store.active ? "Store deactivated." : "Store reactivated.");
      onClose();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update store status.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog isOpen onOpenChange={(open) => !open && onClose()}>
      <DialogHeader>
        <DialogTitle>
          {store.active ? "Deactivate store?" : "Reactivate store?"}
        </DialogTitle>
        <DialogDescription>
          {store.active
            ? `${store.name} will disappear from store selectors and stop accepting POS events. Historical data and user assignments will be kept.`
            : `${store.name} will become available to administrators and assigned users again.`}
        </DialogDescription>
      </DialogHeader>
      {error && (
        <DialogBody>
          <p
            role="alert"
            className="rounded-lg bg-badge-error-background px-3 py-2 text-sm text-badge-error-text"
          >
            {error}
          </p>
        </DialogBody>
      )}
      <DialogFooter>
        <button
          type="button"
          disabled={pending}
          onClick={onClose}
          className={outlineButtonClass}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void updateStatus()}
          className={
            store.active
              ? `${primaryButtonClass} bg-error-500 hover:bg-error-600`
              : primaryButtonClass
          }
        >
          {pending ? "Saving…" : store.active ? "Deactivate" : "Reactivate"}
        </button>
      </DialogFooter>
    </Dialog>
  );
}

function PosCredentialDialog({
  store,
  onClose,
}: {
  store: AdminStore;
  onClose: () => void;
}) {
  const [credentials, setCredentials] = useState<PosCredentialSummary[] | null>(
    null,
  );
  const [issued, setIssued] = useState<IssuedPosCredential | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void fetch(
      `/api/admin/stores/${encodeURIComponent(store.storeCode)}/pos-credentials`,
    )
      .then((response) =>
        readResponse<{ credentials: PosCredentialSummary[] }>(response),
      )
      .then((body) => setCredentials(body.credentials))
      .catch((requestError) =>
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load POS credentials.",
        ),
      );
  }, [store.storeCode]);

  async function copyValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch {
      setError(`Unable to copy the ${label.toLowerCase()}.`);
    }
  }

  async function createCredential() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/stores/${encodeURIComponent(store.storeCode)}/pos-credentials`,
        { method: "POST" },
      );
      const body = await readResponse<IssuedPosCredential>(response);
      setIssued(body);
      setCredentials((current) => [
        {
          keyId: body.keyId,
          active: true,
          createdAt: new Date().toISOString(),
        },
        ...(current ?? []).filter((item) => item.keyId !== body.keyId),
      ]);
      toast.success("POS credential created.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create a POS credential.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog isOpen onOpenChange={(open) => !open && onClose()}>
      <DialogHeader>
        <DialogTitle>POS credential</DialogTitle>
        <DialogDescription>
          {store.name} ({store.storeCode})
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="space-y-4">
        <p className="text-sm text-text-secondary">
          {issued
            ? "Save this secret in the POS installation. It will not be shown again."
            : "Create a credential for this store. A new credential does not deactivate an existing one."}
        </p>
        {issued && (
          <div className="space-y-3 rounded-xl border border-card-border bg-background-gray-secondary p-3">
            <CredentialField
              label="Store code"
              value={issued.storeCode}
              onCopy={() => void copyValue(issued.storeCode, "Store code")}
            />
            <CredentialField
              label="Key ID"
              value={issued.keyId}
              onCopy={() => void copyValue(issued.keyId, "Key ID")}
            />
            <CredentialField
              label="Secret"
              value={issued.secret}
              onCopy={() => void copyValue(issued.secret, "Secret")}
            />
          </div>
        )}
        <div className="space-y-2">
          <p className="text-xs font-medium text-text-tertiary">
            Issued credentials
          </p>
          {!credentials && !error ? (
            <p className="text-sm text-text-tertiary">Loading credentials…</p>
          ) : credentials?.length ? (
            <ul className="divide-y divide-card-border rounded-xl border border-card-border">
              {credentials.map((credential) => (
                <li
                  key={credential.keyId}
                  className="flex items-center justify-between gap-3 px-3 py-2"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-xs text-text-primary">
                      {credential.keyId}
                    </span>
                    <span className="block text-xs text-text-tertiary">
                      {new Date(credential.createdAt).toLocaleString()}
                    </span>
                  </span>
                  <Badge color={credential.active ? "success" : "gray"}>
                    {credential.active ? "Active" : "Inactive"}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : credentials ? (
            <p className="text-sm text-text-tertiary">
              No POS credentials yet.
            </p>
          ) : null}
        </div>
        {!store.active && (
          <p className="text-sm text-text-secondary">
            Activate this store before creating a POS credential.
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-badge-error-background px-3 py-2 text-sm text-badge-error-text"
          >
            {error}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <button
          type="button"
          disabled={pending}
          onClick={onClose}
          className={outlineButtonClass}
        >
          {issued ? "Done" : "Skip"}
        </button>
        <button
          type="button"
          disabled={pending || !store.active}
          onClick={() => void createCredential()}
          className={primaryButtonClass}
        >
          <LuKeyRound className="size-4" />
          {pending ? "Creating…" : "Create POS credential"}
        </button>
      </DialogFooter>
    </Dialog>
  );
}

function CredentialField({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-text-tertiary">{label}</span>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-500"
        >
          <LuCopy className="size-3.5" /> Copy
        </button>
      </div>
      <p className="break-all font-mono text-xs text-text-primary">{value}</p>
    </div>
  );
}
