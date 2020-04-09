export interface KeyValue {
  [key: string]: string;
}

export type Method =
  | 'get'
  | 'GET'
  | 'delete'
  | 'DELETE'
  | 'head'
  | 'HEAD'
  | 'post'
  | 'POST'
  | 'put'
  | 'PUT'
  | 'patch'
  | 'PATCH';

export interface LambdogOptions {
  method?: Method; // One of the supported HTTP request methods.
  functionPath?: string; // A string containing the name of the Lambda function and optional `:name` params.
  fetch?: () => Promise<Response>; // A function that impliments `window.fetch`. Default = `window.fetch`.
  params?: KeyValue; // A key/value object used for search paramaters.
  data?: any; // The data that you would like to send. Not valid for GET and HEAD methods.
  headers?: KeyValue; // A key/value object used for HTTP headers.
}

export interface LambdogResponse {
  status: number;
  statusText: string;
  headers: KeyValue;
  data: any;
  response: Response;
}

export interface LambdogInstance {
  (functionPath: string, options?: LambdogOptions): Promise<LambdogResponse>;

  request(config: LambdogOptions): Promise<LambdogResponse>;
  get(functionPath: string, config?: LambdogOptions): Promise<any>;
  delete(functionPath: string, config?: LambdogOptions): Promise<any>;
  head(functionPath: string, config?: LambdogOptions): Promise<any>;
  post(functionPath: string, data?: any, config?: LambdogOptions): Promise<any>;
  put(functionPath: string, data?: any, config?: LambdogOptions): Promise<any>;
  patch(
    functionPath: string,
    data?: any,
    config?: LambdogOptions
  ): Promise<any>;
}

declare const lambdog: LambdogInstance;

export default lambdog;
