import { listen, myRoute, post } from "../src/server";
import { object } from "zod";
import axios from "axios";
import { expect } from "chai";

describe("Routes", () => {
  it("Should print hello", async () => {
    const router = myRoute(
      "",
      [],
      [
        post("/hello", object({}), (data) => {
          return {
            body: {
              hi: "back",
            },
          };
        }),
      ]
    );

    const port = 8394;

    const server = listen(router, port);

    const response = await axios({
      method: "POST",
      baseURL: `http://localhost:${port}`,
      url: "/hello",
      data: {
        hello: "there",
      },
    });

    expect(response.data).to.deep.equal({
      hi: "back",
    });
  });
});
