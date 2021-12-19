import { route, post, listen, put, SplitRoute, SimpleRoute } from "../src/server";
import { number, object, string } from "zod";
import axios from "axios";
import { expect } from "chai";
import { createQuishClient } from "../src/client";

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

// prettier-ignore
type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20, ...0[]]

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

const test23: TestExtract<typeof router> = 3;

/**
 * Prepend the path of SimpleRoute
 */
type PrependPath<UpperPath extends string, CurrentRoute> = CurrentRoute extends SimpleRoute<
  infer Path,
  infer Validate,
  infer Method
>
  ? SimpleRoute<`${UpperPath}${Path}`, Validate, Method>
  : never;

// prettier-ignore
type ExtractRoutes<Route, D extends number = 4> =
    // to stop the execution if it's too long
    [D] extends [never] ? never
    // we need to differentiate between an endpoint and a split
    : Route extends SplitRoute<any, infer Endpoints>
    ? (Endpoints[number] extends (infer R)
                ? PrependPath<Route['path'], ExtractRoutes<R, Prev[D]>>
                : never)
    : Route;

type Test = ExtractRoutes<typeof router>;

const test: Test = {
  type: "ENDPOINT",
  path: "/api/hello",
  validate: object({
    hello: number(),
  }),
  method: "PUT",
  callback: (): any => {},
};

describe("Client", () => {
  it("Should call a post method", async () => {
    const router = route(
      "/api",

      post("/hello", object({ name: string() }), (data) => {
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

    // @ts-expect-error
    const response = await client.post("/hello", { name: "nicusor" });

    expect(response.body).to.deep.equal({
      hi: "nicusor",
    });

    server.close();
  });
});
