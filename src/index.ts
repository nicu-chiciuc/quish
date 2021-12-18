import { get, listen, route, post, router } from "./server";
import { router as tRouter } from "@trpc/server";
import axios from "axios";
import * as z from "zod";
import { object, string, number } from "zod";

import * as http from "http";
import { RequestOptions } from "http";

let trpcRouter = tRouter();

trpcRouter = trpcRouter.query("createUser", {
  // validate input with Zod
  input: z.object({ name: z.string().min(5) }),
  async resolve(req) {
    req.input;
    // use your ORM of choice
    return {};
  },
});

export type trpcType = typeof trpcRouter;

// How to use middleware?
// How to combine routes

try {
  router().get("/:userId", (req) => {
    req.params.userId;
    console.log(req);
  });
} catch (e) {
  console.error(e);
}

const userRoute = route(
  "/users",
  [],
  [
    post(
      "/:what",
      object({
        name: string(),
      }),
      (data) => {
        //
      }
    ),
  ]
);

const someStuff = route(
  "/api",
  [],
  [
    post(
      "/main/:userId",
      object({
        name: number(),
      }),
      (req) => {
        req.userId;
      }
    ),

    post(
      "/:somethingElse",
      object({
        data: object({ name: string() }),
      }),
      () => {
        //
      }
    ),
    userRoute,
  ]
);

console.log(someStuff);

const port = 8394;

const stuff = listen(someStuff, port);

// Send the request
axios({
  method: "GET",
  baseURL: `http://localhost:${port}`,
  url: `/api/main/123`,
  data: {
    hello: "there",
  },
})
  .then((data) => {
    console.log(data);
  })
  .catch((error) => {
    console.log(error);
  });

//

export type Router = typeof stuff;
