import { createServer, Server, RequestListener } from "http";
import { unreachable, split } from "dependent-ts";
import { Key, pathToRegexp } from "path-to-regexp";
import z, { object, SafeParseReturnType, SomeZodObject, string, ZodObject } from "zod";

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

/**
 * Decode param value.
 * Copied from express
 *
 * @param {string} val
 * @return {string}
 * @private
 */

function decode_param(val?: string) {
  if (typeof val !== "string" || val.length === 0) {
    return val;
  }

  try {
    return decodeURIComponent(val);
  } catch (err) {
    if (err instanceof URIError) {
      err.message = "Failed to decode param '" + val + "'";
      // err.status = err.statusCode = 400;
    }

    throw err;
  }
}

function matchRouter(
  url: string,
  router: SplitRoute | SimpleRoute,
  upperParams: Record<string, string>
): { params: Record<string, string>; endpoint: SimpleRoute } | null {
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

  // Get all the keys
  const params = { ...upperParams };
  {
    for (let i = 1; i < matches.length; i++) {
      const key = keys[i - 1];
      if (!key) throw new Error("key is undefined??");

      const prop = key.name;

      const value = decode_param(matches[i]);
      if (value === undefined) throw new Error("Value is not defined");

      params[prop] = value;
    }
  }

  if (router.type === "ENDPOINT") {
    return {
      params,
      endpoint: router,
    };
  }

  const nextPath = matches.input.substring(firstMatch.length);

  for (const endpoint of router.endpoints) {
    const found = matchRouter(nextPath, endpoint, params);
    if (found) return found;
  }

  return null;
}

const listener =
  <Route extends SplitRoute>(router: Route): RequestListener =>
  async (req, res) => {
    const buffers = [];

    for await (const chunk of req) {
      buffers.push(chunk);
    }

    console.log({ router });

    const obj = JSON.parse(Buffer.concat(buffers).toString());

    // Find the correct router based on the url
    req.url;

    const matchedEndpoint = matchRouter(req.url ?? "", router, {});

    if (!matchedEndpoint) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.write(
        JSON.stringify({
          error: "Route not found",
        })
      );
      res.end();
      return;
    }

    const { endpoint, params } = matchedEndpoint;

    const zodResult = endpoint.validate.safeParse(obj);

    if (!zodResult.success) {
      res.writeHead(400);
      res.write("Incorrect request body");
      res.end();
      return;
    }

    const data = endpoint.callback({
      params,
      body: zodResult.data,
    });

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

export type SplitRoute<
  Path extends string = string,
  Endpoints extends (SimpleRoute<any, any, any> | SplitRoute<any, any>)[] = (
    | SimpleRoute<any, any, any>
    | SplitRoute<any, any>
  )[]
> = {
  type: "ROUTE";
  path: Path;
  endpoints: Endpoints;
};

export function route<
  Path extends string,
  Route extends (SimpleRoute<any, any, any> | SplitRoute<any, any>)[]
>(path: Path, ...endpoints: Route): SplitRoute<Path, Route> {
  return {
    type: "ROUTE",
    path,
    endpoints,
  };
}

export function listen<
  Route extends SplitRoute<any, any>,
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

export type SimpleRoute<
  Path extends string = string,
  Validate = unknown,
  Method extends "POST" | "GET" | "PUT" = "POST" | "GET" | "PUT"
> = {
  type: "ENDPOINT";
  path: Path;
  method: Method;
  validate: z.ZodType<Validate>;
  callback: (req: { body: unknown; params: PathArgs<Path> & Record<string, string> }) => {
    body: unknown;
  };
};

/**
 * This type is already defined and can be imported from 'zod/lib/cjs/types/base'.
 * Unfortunately that causes problems when the types are exported for consumption by the mobile app.
 * Thus, the following definition is a copy of the one in zod/base.ts
 */
export type ZodRawShape = {
  [k: string]: z.ZodTypeAny;
};

export function post<Path extends string, ValidateInput extends SomeZodObject>(
  path: Path,
  validate: ValidateInput,
  run: (req: { body: z.infer<ValidateInput>; params: PathArgs<Path> & Record<string, string> }) => {
    body: unknown;
  }
): SimpleRoute<Path, z.infer<typeof validate>, "POST"> {
  return {
    type: "ENDPOINT",
    path,
    method: "POST",
    validate,
    callback: run,
  };
}

export function put<Path extends string, ValidateInput extends SomeZodObject>(
  path: Path,
  validate: ValidateInput,
  run: (req: { body: z.infer<ValidateInput>; params: PathArgs<Path> & Record<string, string> }) => {
    body: unknown;
  }
): SimpleRoute<Path, z.infer<typeof validate>, "PUT"> {
  return {
    type: "ENDPOINT",
    path,
    method: "PUT",
    validate,
    callback: run,
  };
}

const obj = object({
  hello: string(),
});

export function get<Path extends string, ValidateInput extends SomeZodObject>(
  path: Path,
  validate: ValidateInput,
  run: (req: { body: unknown; params: PathArgs<Path> & Record<string, string> }) => {
    body: unknown;
  }
): SimpleRoute<Path, z.infer<typeof validate>, "GET"> {
  return {
    type: "ENDPOINT",
    path,
    method: "GET",
    validate,
    callback: run,
  };
}
