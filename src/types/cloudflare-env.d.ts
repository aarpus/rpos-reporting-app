declare global {
  interface CloudflareEnv {
    HYPERDRIVE: {
      connectionString: string;
    };
    NEXT_PUBLIC_VAPID_PUBLIC_KEY?: string;
    VAPID_PRIVATE_KEY?: string;
    VAPID_SUBJECT?: string;
    POS_CREDENTIAL_ENCRYPTION_KEY?: string;
  }
}

export {};
