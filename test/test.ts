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

    server.close();
  });

  it("Should handled nested routes", async () => {
    const router = myRoute(
      "/api",
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
      url: "/api/hello",
      data: {
        hello: "there",
      },
    });

    expect(response.data).to.deep.equal({
      hi: "back",
    });

    server.close();
  });

  it("Should handled more nested routes", async () => {
    const router = myRoute(
      "/api",
      [],
      [
        myRoute(
          "/admin",
          [],
          [
            post("/test", object({}), () => {
              return {
                body: {
                  admin: "super",
                },
              };
            }),
          ]
        ),
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
      url: "/api/admin/test",
      data: {
        hello: "there",
      },
    });

    expect(response.data).to.deep.equal({
      admin: "super",
    });

    server.close();
  });

  it("Should not match incorrect routes", async () => {
    const router = myRoute(
      "/api",
      [],
      [
        post("/something", object({}), (data) => {
          return {
            body: {},
          };
        }),
      ]
    );

    const port = 8394;

    const server = listen(router, port);

    const response = await axios({
      method: "POST",
      baseURL: `http://localhost:${port}`,
      url: "/api/otherThing",
      data: {},
      // Don't throw if response is 404
      validateStatus: null,
    });

    expect(response.status).to.be.equal(404);
    expect(response.data).to.deep.equal({
      error: "Route not found",
    });

    server.close();
  });
});
