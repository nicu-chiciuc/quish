import axios from "axios";
import { SimpleRoute, SplitRoute } from "./server";
import { UnionToIntersection } from "dependent-ts";

// prettier-ignore
export type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20, ...0[]]

export type ParseRoutes<SRoute extends SimpleRoute> = SRoute extends SimpleRoute<
  infer Path,
  infer Validation,
  infer Method
>
  ? {
      [k in Path]: SRoute;
    }
  : never;

export function createQuishClient<
  Route extends SplitRoute,
  ParsedData = UnionToIntersection<ParseRoutes<ExtractRoutes<Route>>>
>({ baseURL }: { baseURL: string }) {
  return {
    post: async <Path extends keyof ParsedData, Method extends "POST" | "PUT">(
      path: Path,
      body: ParsedData[Path] extends SimpleRoute<any, infer Validation, any> ? Validation : never
    ): Promise<{
      body: unknown;
    }> => {
      const response = await axios({
        method: "POST",
        baseURL,
        url: path,
        data: body,
      });

      return {
        body: response.data,
      };
    },
  };
}

/**
 * Prepend the path of SimpleRoute
 */
type PrependPath<UpperPath extends string, CurrentRoute> = CurrentRoute extends SimpleRoute<
  infer Path,
  infer Validate,
  infer Method
>
  ? SimpleRoute<`${UpperPath}${Path}`, Validate, Method>
  : never;

// prettier-ignore
export type ExtractRoutes<Route, D extends number = 4> =
  [D] extends [never] ? never :
    // to stop the execution if it's too long
    // we need to differentiate between an endpoint and a split
    Route extends SplitRoute<infer Path, infer Endpoints>
      ? PrependPath<Route["path"], ExtractRoutes<Endpoints[number], Prev[D]>>
      : Route extends SimpleRoute
      ? Route
      : never;
