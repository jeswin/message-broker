export type RequestHandler<TParameters, TResult> = (
  parameters: TParameters
) => Promise<TResult>;

export type HandlerParameters<P, R> = {
  parameters: P;
  result: R;
};

type AttachHandlerFunction<TRequestMap> = <K extends string, P, R>(
  type: K,
  handler: RequestHandler<P, R>
) => MessageBroker<TRequestMap & { [key in K]: HandlerParameters<P, R> }>;

// // Structure for the request we receive
// export interface Request<TParameters> {
//   id: string; // Unique ID to match requests and responses
//   type: string; // Request type
//   parameters: TParameters; // Parameters to be passed to the handler
// }

// export interface Response<TResult> {
//   id: string; // Same unique ID to respond back to the correct request
//   result: TResult; // Handler's response
// }

// Structure for the request we receive, now typed by the request map
export interface Request<
  TRequestMap extends {
    [key: string]: HandlerParameters<any, any>; // Each key should have a 'parameters' and 'result' field
  },
  K extends keyof TRequestMap
> {
  id: string; // Unique ID to match requests and responses
  type: K; // Request type
  parameters: TRequestMap[K]["parameters"]; // Parameters tied to specific request type
}

// Structure for the response sent back, typed by the result of the request
export interface Response<
  TRequestMap extends {
    [key: string]: HandlerParameters<any, any>; // Each key should have a 'parameters' and 'result' field
  },
  K extends keyof TRequestMap
> {
  id: string; // Same unique ID to respond back to the correct request
  result: TRequestMap[K]["result"]; // Result tied to the specific request's result
}

export interface MessageBroker<
  TRequestMap extends {
    [key: string]: HandlerParameters<any, any>; // Each key should have a 'parameters' and 'result' field
  }
> {
  attachHandler: AttachHandlerFunction<TRequestMap>;
  onRequest: <K extends keyof TRequestMap & string>(
    request: Request<TRequestMap, K>
  ) => void;
}

export function createMessageBroker<
  TRequestMap extends {
    [key: string]: HandlerParameters<any, any>; // Each key should have a 'parameters' and 'result' field
  },
  TResponse
>(
  sendResponse: <K extends keyof TRequestMap & string>(
    response: Response<TRequestMap, K>
  ) => void,
  requestHandlers: Map<string, RequestHandler<any, any>> = new Map()
): MessageBroker<TRequestMap> {
  // The attachHandler function adds request handlers and updates the broker's types
  const attachHandler: AttachHandlerFunction<TRequestMap> = <
    K extends string,
    P,
    R
  >(
    type: K,
    handler: RequestHandler<P, R>
  ) => {
    requestHandlers.set(type, handler);
    // Return a new broker instance with extended types (previous request types + new request type)
    return createMessageBroker<
      TRequestMap & { [key in K]: { parameters: P; result: R } },
      TResponse
    >(sendResponse, requestHandlers);
  };

  async function onRequest<K extends keyof TRequestMap & string>(
    request: Request<TRequestMap, K>
  ) {
    const { id, type, parameters } = request;

    // Check if a handler exists for this request type
    const handler = requestHandlers.get(type);

    if (handler) {
      // Call the handler with the unwrapped payload
      const handlerResult = await handler(parameters);

      // Send the response back, wrapping it in the Response structure
      const response: Response<TRequestMap, K> = {
        id: id + "-response", // Use the same ID to match the original request
        result: handlerResult,
      };

      sendResponse(response);
    }
  }

  // Return the broker with attachHandler, startListening, and stopListening methods
  return {
    attachHandler,
    onRequest,
  };
}

export type BrokerType<
  TGetBroker extends (...params: any[]) => MessageBroker<any>
> = ReturnType<TGetBroker> extends MessageBroker<infer T> ? T : never;
