import axios from "axios";
import { SimpleRoute, SplitRoute } from "./server";
import { UnionToIntersection } from "dependent-ts";
import { ExtractRoutes, ParseRoutes } from "./types";

export function createQuishClient<
  Route extends SplitRoute,
  ParsedData = UnionToIntersection<ParseRoutes<ExtractRoutes<Route>>>
>({ baseURL }: { baseURL: string }) {
  return {
    post: async <Path extends keyof ParsedData, Method extends "POST" | "PUT">(
      path: Path & string,
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
