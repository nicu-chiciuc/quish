import { object } from "zod";
import { createQuishClient, ExtractRoutes } from "../src/client";
import { PathClient, post, put, route, SimpleRoute } from "../src/server";

// https://github.com/microsoft/TypeScript/issues/27024#issuecomment-421529650
export type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
  ? true
  : false;

describe("Types", () => {
  it("ExtractRoutes", () => {
    const router = route(
      "/api",
      post("/hello/:userId", object({}), () => ({ body: null })),
      route(
        "/:dataId",
        put("/test/:testId", object({}), () => ({ body: null }))
      )
    );

    type RouterType = typeof router;
    type ExtractedRoutes = ExtractRoutes<RouterType>;

    type Test = Equals<
      ExtractedRoutes,
      //
      | SimpleRoute<"/api/hello/:userId", {}, "POST">
      | SimpleRoute<"/api/:dataId/test/:testId", {}, "PUT">
    >;

    const test: Test = true;
  });

  describe("PathClient", () => {
    it("/api/:userId/data/:zoneId", () => {
      const test: Equals<
        PathClient<"/api/:userId/data/:zoneId">,
        //
        `/api/${string}/data/${string}`
      > = true;
    });

    it("/:dataId", () => {
      const test: Equals<
        PathClient<"/:dataId">,
        //
        `/${string}`
      > = true;
    });

    it(":dataId/hello", () => {
      const test: Equals<
        PathClient<":dataId/hello">,
        //
        `${string}/hello`
      > = true;
    });
  });
});
