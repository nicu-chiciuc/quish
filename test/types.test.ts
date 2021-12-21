import { object } from "zod";
import { post, put, route, SimpleRoute } from "../src/server";
import {
  ExtractRoutes,
  ParseRoutes,
  PathArgs,
  PathClient,
  PathParams,
  PrependPath,
} from "../src/types";

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

    const test: Equals<
      ExtractRoutes<typeof router>,
      //
      | SimpleRoute<"/api/hello/:userId", {}, "POST">
      | SimpleRoute<"/api/:dataId/test/:testId", {}, "PUT">
    > = true;
  });

  it("PrependPath", () => {
    type SampleRoute = SimpleRoute<"/any", {}, "PUT">;

    const test: Equals<
      PrependPath<"/api", SampleRoute>,
      //
      SimpleRoute<"/api/any", {}, "PUT">
    > = true;
  });

  it("ParseRoutes", () => {
    type SampleRoute = SimpleRoute<"/any/:userId", {}, "PUT">;

    const test: Equals<
      ParseRoutes<SampleRoute>,
      //
      {
        [x: `/any/${string}`]: SampleRoute;
      }
    > = true;
  });

  describe("PathParams, PathArgs", () => {
    it("/api", () => {
      const test: Equals<
        PathParams<"/api">,
        //
        never
      > = true;

      const test2: Equals<
        PathArgs<"/api">,
        //
        {}
      > = true;
    });

    it("/api/:userId", () => {
      const test: Equals<
        PathParams<"/api/:userId">,
        //
        "userId"
      > = true;

      const test2: Equals<
        PathArgs<"/api/:userId">,
        //
        { userId: string }
      > = true;
    });

    it("/api/:userId/zone/:zoneId", () => {
      const test: Equals<
        PathParams<"/api/:userId/zone/:zoneId">,
        //
        "userId" | "zoneId"
      > = true;

      const test2: Equals<
        PathArgs<"/api/:userId/zone/:zoneId">,
        //
        { userId: string; zoneId: string }
      > = true;
    });
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
