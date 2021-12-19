import type { trpcType } from "./index";
import { createTRPCClient } from "@trpc/client";
import { SplitRoute } from "./server";
import axios from "axios";

export function createQuishClient<Route extends SplitRoute>({ baseURL }: { baseURL: string }) {
  return {
    async post(
      path: string,
      body: unknown
    ): Promise<{
      body: unknown;
    }> {
      const response = await axios({
        method: "POST",
        baseURL,
        url: path,
        data: body,
      });

      return {
        body: response.data,
      };
    },
  };
}
