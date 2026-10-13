import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { toAppError, type RpcClient } from "@/lib/db/rpc";

/** RpcClient respaldado por Supabase (service role). Solo servidor. */
export function getRpc(): RpcClient {
  const admin = createAdminClient();
  return {
    async call<T>(fn: string, args: Record<string, unknown>): Promise<T> {
      const { data, error } = await admin.rpc(fn, args);
      if (error) throw toAppError(error);
      return data as T;
    },
  };
}
