import type { OpenAPIObject } from "openapi3-ts/oas31";
import { expect, test } from "vitest";
import { generateZodClientFromOpenAPI } from "../src";

test("sse-support", async () => {
    const openApiDoc: OpenAPIObject = {
        openapi: "3.0.3",
        info: {
            version: "1.0.0",
            title: "SSE",
        },
        paths: {
            "/sample": {
                get: {
                    responses: {
                        "200": {
                            content: {
                                 "text/event-stream": {
                                     itemSchema: {
                                        properties: {
                                            data: {
                                                $ref: "#/components/schemas/test1" 
                                            },
                                            event: {
                                                type: "string"
                                            },
                                            id: {
                                                type: "string"
                                            },
                                            retry: {
                                                minimum: 0,
                                                type: "integer",
                                            }
                                        },
                                        type: "object"
                                     }
                                    }
                                },
                        },
                    },
                },
            },
        },
        components: {
            schemas: {
                test1: {
                    type: "object",
                    properties: {
                        text: { type: "string" },
                    },
                },
            },
        },
    };

    const output = await generateZodClientFromOpenAPI({ disableWriteToFile: true, openApiDoc });
    expect(output).toMatchInlineSnapshot(`
      "import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
      import { z } from "zod";

      const test1 = z.object({ text: z.string() }).partial().passthrough();

      export const schemas = {
        test1,
      };

      const endpoints = makeApi([
        {
          method: "get",
          path: "/sample",
          requestFormat: "json",
          sse: true,
          response: z
            .object({
              data: test1,
              event: z.string(),
              id: z.string(),
              retry: z.number().int().gte(0),
            })
            .partial()
            .passthrough(),
        },
      ]);

      export const api = new Zodios(endpoints);

      export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
        return new Zodios(baseUrl, endpoints, options);
      }
      "
    `);
});
