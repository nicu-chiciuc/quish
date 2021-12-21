import { get, listen, route, post, router } from "./server";
import { router as tRouter } from "@trpc/server";
import axios from "axios";
import * as z from "zod";
import { object, string, number } from "zod";

import * as http from "http";
import { RequestOptions } from "http";

function main() {
  const userRoute = route(
    "/users",
    post(
      "/:what",
      object({
        name: string(),
      }),
      (data) => {
        return { body: [] };
      }
    )
  );

  const someStuff = route(
    "/api",
    post(
      "/main/:userId",
      object({
        name: number(),
      }),
      (req) => {
        return { body: {} };
      }
    ),

    post(
      "/:somethingElse",
      object({
        data: object({ name: string() }),
      }),
      () => {
        return { body: {} };
      }
    ),
    userRoute
  );

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
}
