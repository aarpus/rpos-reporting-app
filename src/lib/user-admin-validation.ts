export type UserInput = {
  name: string;
  email: string;
  password: string;
};

export type UserUpdateInput = {
  name?: string;
  email?: string;
  password?: string;
  active?: boolean;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseName(value: unknown) {
  if (typeof value !== "string") return null;
  const name = value.trim();
  return name.length > 0 && name.length <= 120 ? name : null;
}

function parseEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL_PATTERN.test(email) ? email : null;
}

function parsePassword(value: unknown) {
  return typeof value === "string" && value.length >= 8 && value.length <= 256
    ? value
    : null;
}

export function parseUserInput(value: unknown):
  | { data: UserInput; error?: never }
  | { data?: never; error: string } {
  if (!value || typeof value !== "object") return { error: "Invalid request body." };
  const body = value as Record<string, unknown>;
  const name = parseName(body.name);
  const email = parseEmail(body.email);
  const password = parsePassword(body.password);

  if (!name) return { error: "Name is required and must be 120 characters or fewer." };
  if (!email) return { error: "Enter a valid email address with no more than 254 characters." };
  if (!password) return { error: "Password must be between 8 and 256 characters." };
  return { data: { name, email, password } };
}

export function parseUserUpdate(value: unknown):
  | { data: UserUpdateInput; error?: never }
  | { data?: never; error: string } {
  if (!value || typeof value !== "object") return { error: "Invalid request body." };
  const body = value as Record<string, unknown>;
  const data: UserUpdateInput = {};

  if ("name" in body) {
    const name = parseName(body.name);
    if (!name) return { error: "Name is required and must be 120 characters or fewer." };
    data.name = name;
  }
  if ("email" in body) {
    const email = parseEmail(body.email);
    if (!email) return { error: "Enter a valid email address with no more than 254 characters." };
    data.email = email;
  }
  if ("password" in body && body.password !== "") {
    const password = parsePassword(body.password);
    if (!password) return { error: "Password must be between 8 and 256 characters." };
    data.password = password;
  }
  if ("active" in body) {
    if (typeof body.active !== "boolean") return { error: "Active status must be true or false." };
    data.active = body.active;
  }
  if (Object.keys(data).length === 0) return { error: "No user changes were provided." };
  return { data };
}

export function parseStoreCodes(value: unknown):
  | { data: string[]; error?: never }
  | { data?: never; error: string } {
  if (!value || typeof value !== "object") return { error: "Invalid request body." };
  const storeCodes = (value as Record<string, unknown>).storeCodes;
  if (!Array.isArray(storeCodes) || storeCodes.length > 10_000) {
    return { error: "storeCodes must be an array with no more than 10,000 entries." };
  }

  const parsed = storeCodes.map((code) => typeof code === "string" ? code.trim().toUpperCase() : "");
  if (parsed.some((code) => !code || code.length > 64)) {
    return { error: "Every store code must be a non-empty string with no more than 64 characters." };
  }
  return { data: [...new Set(parsed)] };
}

export function parseUserId(value: unknown) {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}
