import { listen, post, put, route, SimpleRoute, SplitRoute } from "../src/server";
import { number, object, string } from "zod";
import { expect } from "chai";
import { createQuishClient } from "../src/client";
import { UnionToIntersection } from "dependent-ts";
import { ExtractRoutes, ParseRoutes, Prev } from "../src/types";

const router = route(
  "/api",

  post("/hello", object({ date: string() }), (data) => {
    return {
      body: {
        hi: data.body.date,
      },
    };
  }),
  route(
    "/user",
    put("/get/:userId", object({ hello: number() }), () => {
      return {
        body: {
          helo: "ahasdf",
        },
      };
    })
  )
);

type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${"" extends P ? "" : "."}${P}`
    : never
  : never;

type Paths<T, D extends number = 10> = [D] extends [never]
  ? never
  : T extends object
  ? {
      [K in keyof T]-?: K extends string | number ? `${K}` | Join<K, Paths<T[K], Prev[D]>> : never;
    }[keyof T]
  : "";

// Why we use `[D] extends [never]` instead of `D extends never`
type Leaves<T, D extends number = 10> = [D] extends [never]
  ? never
  : T extends object
  ? { [K in keyof T]-?: Join<K, Leaves<T[K], Prev[D]>> }[keyof T]
  : "";

type NestedObjectType = {
  a: string;
  b: {
    test: number;
    data: {
      test: string;
    };
  };
};

type NestedObjectPaths = Paths<NestedObjectType>;
// type NestedObjectPaths = "a" | "b" | "nest" | "otherNest" | "nest.c" | "otherNest.c"
type NestedObjectLeaves = Leaves<NestedObjectType>;
// type NestedObjectLeaves = "a" | "b" | "nest.c" | "otherNest.c"

type TestExtract<Route extends SplitRoute> = Route["endpoints"][number];

export type Test = ExtractRoutes<typeof router>;

type Sample = {
  [x: `hello${string}`]: number;
} & {
  [x: `${string} bye`]: string;
};

type Test2 = UnionToIntersection<ParseRoutes<Test>>;

const test: Test = {
  type: "ENDPOINT",
  path: "/api/hello",
  validate: object({
    date: string(),
  }),
  method: "POST",
  callback: (): any => {},
};

describe("Client", () => {
  it("Should call a post method", async () => {
    const router = route(
      "/api",
      post("/hello/:userId", object({ name: string() }), (data) => {
        return {
          body: {
            hi: data.body.name,
          },
        };
      }),
      put("/goodbye", object({ name: string() }), (data) => {
        return {
          body: {
            hi: data.body.name,
          },
        };
      })
    );

    const port = 8394;

    const server = listen(router, port);

    // test
    type Temp = typeof router;

    const client = createQuishClient<typeof router>({
      baseURL: `http://localhost:${port}`,
    });

    const response = await client.post("/api/hello/34", { name: "nicusor" });

    expect(response.body).to.deep.equal({
      hi: "nicusor",
    });

    server.close();
  });
});
