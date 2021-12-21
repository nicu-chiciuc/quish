import { SimpleRoute, SplitRoute } from "./server";

/**
 * Prepend the path of SimpleRoute
 */
export type PrependPath<UpperPath extends string, CurrentRoute> = CurrentRoute extends SimpleRoute<
  infer Path,
  infer Validate,
  infer Method
>
  ? SimpleRoute<`${UpperPath}${Path}`, Validate, Method>
  : never;

// prettier-ignore
export type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20, ...0[]]

/**
 * Source: https://davidtimms.github.io/programming-languages/typescript/2020/11/20/exploring-template-literal-types-in-typescript-4.1.html
 * Extracts params from a route
 */
// prettier-ignore
export type PathParams<Path extends string> =
    Path extends `:${infer Param}/${infer Rest}` ? Param | PathParams<Rest> :
    Path extends `:${infer Param}` ? Param :

    // This is the base case, here we remove the unnecessary prefix
    Path extends `${infer _Prefix}:${infer Rest}` ? PathParams<`:${Rest}`> :
        never;

// prettier-ignore
export type PathClient<Path extends string> =
    Path extends `${infer Prefix}:${string}/${infer Rest}` ? `${Prefix}${string}${PathClient<`/${Rest}`>}` :
    Path extends `${infer Prefix}:${string}` ? `${Prefix}${string}` :
    Path;

export type PathArgs<Path extends string> = {
  [K in PathParams<Path>]: string;
};

/**
 * Transforms a simple route into a object where the key is the PathClient<> of the path
 * and the value is the Route
 */
export type ParseRoutes<SRoute extends SimpleRoute> = SRoute extends SimpleRoute<
  infer Path,
  infer Validation,
  infer Method
>
  ? {
      [k in PathClient<Path>]: SRoute;
    }
  : never;

/**
 * Transforms a recursive SplitRoute into a union of SimpleRoutes
 */
// prettier-ignore
export type ExtractRoutesInternal<Route, D extends number> =
    [D] extends [never] ? never :
        // to stop the execution if it's too long
        // we need to differentiate between an endpoint and a split
        Route extends SplitRoute<infer Path, infer Endpoints>
            ? PrependPath<Route["path"], ExtractRoutesInternal<Endpoints[number], Prev[D]>>
            : Route extends SimpleRoute
                ? Route
                : never;
export type ExtractRoutes<Route extends SimpleRoute | SplitRoute> = ExtractRoutesInternal<Route, 5>;
