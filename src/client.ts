import type { trpcType } from "./index";
import { createTRPCClient } from "@trpc/client";

const client = createTRPCClient<trpcType>({
  url: "http://localhost:8000/trpc",
});

client.query("createUser", { name: "hello" });
