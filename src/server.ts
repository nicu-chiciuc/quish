import { createServer, Server, RequestListener } from "http";
import { unreachable } from "dependent-ts";
import { Key, pathToRegexp } from "path-to-regexp";
import z, { object, SomeZodObject, string, ZodObject } from "zod";

// Source of inspiration
// https://davidtimms.github.io/programming-languages/typescript/2020/11/20/exploring-template-literal-types-in-typescript-4.1.html

// prettier-ignore
type PathParams<Path extends string> =
    Path extends `:${infer Param}/${infer Rest}`  ? Param | PathParams<Rest> :
    Path extends `:${infer Param}`                ? Param :

    // This is the base case, here we remove the unnecessary prefix
    Path extends `${infer _Prefix}:${infer Rest}` ? PathParams<`:${Rest}`> :
    never;

// Split a string by
type Split<
  At extends string,
  Value extends string
> = Value extends `${infer First}${At}${infer Rest}` ? [First, ...Split<At, Rest>] : [Value];

type SplitSecond<
  At extends string,
  Value extends string
> = Value extends `${infer First}${At}${infer Second}` ? Second : never;

type Second<Arr extends unknown[]> = Arr extends [unknown, infer R, ...unknown[]] ? R : never;

type DefinedOr<
  MaybeDefined extends string | undefined,
  Or extends string
> = MaybeDefined extends string ? Or : MaybeDefined;

type TestSplit = Split<" ", "POST /hello">;

type Test3 = Second<Split<" ", "POST /hello">>;

type PathArgs<Path extends string> = {
  [K in PathParams<Path>]: string;
};

type Test = PathArgs<"/hello/:there/:here">;

function getRouterPaths<
  Route extends Router<string, (SimpleRoute<any, any, any> | Router<any, any>)[]>
>(
  router: Route
): Array<{
  path: string;
  callback: (args: PathArgs<any>) => unknown;
}> {
  const paths = router.endpoints.flatMap((endpoint) => {
    if (endpoint.type === "ROUTE") {
      const innerPaths = getRouterPaths(endpoint);

      return innerPaths.map((path) => ({
        path: `${router.path}${path.path}`,
        callback: path.callback,
      }));

      //
    }

    return [
      {
        path: `${router.path}${endpoint.path}`,
        callback: endpoint.callback,
      },
    ];
  });

  return paths;
}

function matchRouter(url: string, router: Router): SimpleRoute | null {
  const keys: Key[] = [];
  const rex = pathToRegexp(router.path, keys, {
    sensitive: false,
    strict: false,
    // This is the most important, since we don't want to match the end, just the beginning
    end: false,
  });

  const matches = rex.exec(url);

  if (!matches) return null;

  const firstMatch = matches[0];

  if (typeof firstMatch !== "string") {
    console.error("First match doesn't exist");
    return null;
  }

  const nextPath = matches.input.substring(firstMatch.length);

  for (const endpoint of router.endpoints) {
    switch (endpoint.type) {
      case "ROUTE":
        return matchRouter(nextPath, endpoint);

      case "ENDPOINT":
        return endpoint;

      default: {
        unreachable(endpoint);
      }
    }
  }

  return null;

  // Split the url and pass it next
}

// function findFunction<Route extends Router>() {
//     if
//
// }

const listener =
  <Route extends Router>(router: Route): RequestListener =>
  async (req, res) => {
    const buffers = [];

    for await (const chunk of req) {
      buffers.push(chunk);
    }

    console.log({ router });

    const obj = JSON.parse(Buffer.concat(buffers).toString());

    // Find the correct router based on the url
    req.url;

    const routeCallback = matchRouter(req.url ?? "", router);

    if (!routeCallback) {
      const message = "Didn't find route";
      throw new Error(message);
    }

    if (false) {
      // Get all routes
      const paths = getRouterPaths(router);

      for (const path of paths) {
        const curRegex = pathToRegexp(path.path);

        const test = curRegex.exec(req.url ?? "");

        if (test) {
          path.callback(obj);
          // Call that specific endpoint
        }
      }

      console.log(paths);
    }

    const data = routeCallback.callback(obj);

    const sendObj = JSON.stringify(data.body);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.write(sendObj);
    res.end();
  };

type Test4 = PathArgs<"POST /:userId">;

export function router<Key extends string>() {
  return {
    get: <Path extends string>(
      path: Path,
      callback: (req: { params: PathArgs<Path> }) => unknown
    ) => {
      // return
    },
  };
}

/**
 * Add the Prefix to all the types of the `path` property
 */
export type PathProp<Prefix extends string, T extends { path: string }> = T extends T
  ? DistributiveOmit<T, "path"> & {
      path: `${Prefix}${T["path"]}`;
    }
  : never;

// https://stackoverflow.com/questions/57103834/typescript-omit-a-property-from-all-interfaces-in-a-union-but-keep-the-union-s
type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;

type Other = Omit<{ path: string; name: number }, "path">;

type Test_PathProp = PathProp<
  "/hello",
  { path: "/test"; method: "GET" } | { path: "/:userId"; method: "POST" }
>;

const tes2: Test_PathProp = {
  path: "/hello/:userId",
  method: "POST",
};

type Router<
  Path extends string = string,
  M extends (SimpleRoute<any, any, any> | Router<any, any>)[] = (
    | SimpleRoute<any, any, any>
    | Router<any, any>
  )[]
> = {
  type: "ROUTE";
  path: Path;
  endpoints: M;
};

export function myRoute<
  Path extends string,
  M extends (SimpleRoute<any, any, any> | Router<any, any>)[]
>(path: Path, middleware: {}[], boys: M): Router<Path, M> {
  return {
    type: "ROUTE",
    path,
    endpoints: boys,
  };
}

export function listen<
  Route extends Router<any, any>,
  Keys extends string,
  Some extends {
    [P in Keys]: (args: unknown) => unknown;
  }
>(opts: Route, ...args: Parameters<Server["listen"]>) {
  console.log("here");
  const server = createServer(listener(opts));

  server.on("close", function () {
    console.log(" Stopping ...");
  });

  process.on("SIGINT", function () {
    server.close();
  });

  return server.listen(...args);
}

type SimpleRoute<
  Path extends string = string,
  Validate = unknown,
  Method extends "POST" | "GET" = "POST" | "GET"
> = {
  type: "ENDPOINT";
  path: Path;
  method: Method;
  validate: (body: unknown) => Validate;
  callback: (req: PathArgs<Path>) => {
    body: unknown;
  };
};

export function post<T extends string, ValidateInput extends SomeZodObject>(
  path: T,
  validate: ValidateInput,
  run: (req: PathArgs<T>) => {
    body: unknown;
  }
): SimpleRoute<T, z.infer<typeof validate>, "POST"> {
  return {
    type: "ENDPOINT",
    path,
    method: "POST",
    validate: (data: unknown) => {
      const test = validate.parse(data);
      return test;
    },
    callback: run,
  };
}

const obj = object({
  hello: string(),
});

export function get<T extends string, ValidateInput extends SomeZodObject>(
  path: T,
  validate: ValidateInput,
  run: (req: PathArgs<T>) => {
    body: unknown;
  }
): SimpleRoute<T, z.infer<typeof validate>, "GET"> {
  return {
    type: "ENDPOINT",
    path,
    method: "GET",
    validate: (data: unknown) => {
      const test = validate.parse(data);
      return test;
    },
    callback: run,
  };
}
