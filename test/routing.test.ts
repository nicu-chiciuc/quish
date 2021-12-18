import { listen, route, post, use } from "../src/server";
import { object, string } from "zod";
import axios from "axios";
import { expect } from "chai";

describe("Routes", () => {
  it("Should print hello", async () => {
    const router = route(
      "",

      post("/hello", object({}), (data) => {
        return {
          body: {
            hi: "back",
          },
        };
      })
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
    const router = route(
      "/api",

      post("/hello", object({}), (data) => {
        return {
          body: {
            hi: "back",
          },
        };
      })
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
    const router = route(
      "/api",

      route(
        "/admin",

        post("/test", object({}), () => {
          return {
            body: {
              admin: "super",
            },
          };
        })
      ),
      post("/hello", object({}), (data) => {
        return {
          body: {
            hi: "back",
          },
        };
      })
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
    const router = route(
      "/api",

      post("/something", object({}), (data) => {
        return {
          body: {},
        };
      })
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

  it("Should support dynamic routes", async () => {
    const router = route(
      "/api",

      post("/zone/:zoneId", object({}), ({ params, body }) => {
        return {
          body: {
            yourZone: params.zoneId,
          },
        };
      })
    );

    const port = 8394;

    const server = listen(router, port);

    const response = await axios({
      method: "POST",
      baseURL: `http://localhost:${port}`,
      url: "/api/zone/1234",
      data: {},
      // Don't throw if response is 404
      validateStatus: null,
    });

    expect(response.status).to.be.equal(200);
    expect(response.data).to.deep.equal({
      yourZone: "1234",
    });

    server.close();
  });

  it("Should support dynamic routes from upper routes", async () => {
    const router = route(
      "/api/:userId",

      post("/zone/:zoneId", object({}), ({ params, body }) => {
        return {
          body: {
            yourUserId: params["userId"],
            yourZone: params.zoneId,
          },
        };
      })
    );

    const port = 8394;

    const server = listen(router, port);

    const response = await axios({
      method: "POST",
      baseURL: `http://localhost:${port}`,
      url: "/api/nicu/zone/1234",
      data: {},
      // Don't throw if response is 404
      validateStatus: null,
    });

    expect(response.status).to.be.equal(200);
    expect(response.data).to.deep.equal({
      yourUserId: "nicu",
      yourZone: "1234",
    });

    server.close();
  });

  it("Should pass only the defined body", async () => {
    const router = route(
      "/api/:userId",

      post("/zone/:zoneId", object({ name: string() }), ({ params, body }) => {
        // We don't expect other properties
        expect(body).to.deep.equal({
          name: "nicusor",
        });

        return {
          body: {
            yourUserId: params["userId"],
            yourZone: params.zoneId,
            yourName: body.name,
          },
        };
      })
    );

    const port = 8394;

    const server = listen(router, port);

    const response = await axios({
      method: "POST",
      baseURL: `http://localhost:${port}`,
      url: "/api/nicu/zone/1234",
      data: {
        name: "nicusor",
        surname: "My Surname",
      },
      // Don't throw if response is 404
      validateStatus: null,
    });

    expect(response.status).to.be.equal(200);
    expect(response.data).to.deep.equal({
      yourUserId: "nicu",
      yourZone: "1234",
      yourName: "nicusor",
    });

    server.close();
  });

  it("Should return 404 if request body is incorrect", async () => {
    const router = route(
      "",

      post("/user", object({ name: string() }), ({ params, body }) => {
        return {
          body: {
            yourName: body.name,
          },
        };
      })
    );

    const port = 8394;

    const server = listen(router, port);

    const response = await axios({
      method: "POST",
      baseURL: `http://localhost:${port}`,
      url: "/user",
      data: {
        names: "nicusor",
      },
      // Don't throw if response is 404
      validateStatus: null,
    });

    expect(response.status).to.be.equal(400);
    // TODO: Maybe we should also returns the error messages from zod

    server.close();
  });
});
