const CONTENT_TYPE = 'content-type';
const APPLICATION_JSON = 'application/json';
const functionsName = 'functions';

const buildUrl = (path, query) => {
  const mutatedQuery = { ...query };
  const newPath = path
    .split('/')
    .map((segment) => {
      if (segment.startsWith(':')) {
        const key = segment.substr(1);
        const value = mutatedQuery[key];
        delete mutatedQuery[key];
        return encodeURIComponent(value);
      }
      return segment;
    })
    .join('/');

  // build query string from remaining keys in mutatedQuery
  const url = new URL(newPath, 'http://example.com/'); // requires a value base URL
  Object.entries(mutatedQuery).forEach((pair) => {
    url.searchParams.set(...pair);
  });

  return `${url.pathname}${url.search}`;
};

const lambdog = async (name, options = {}) => {
  const {
    fetch = global.fetch,
    params = {},
    data,
    headers = {},
    ...rest
  } = options;

  if (data) {
    headers[CONTENT_TYPE] = headers[CONTENT_TYPE] || APPLICATION_JSON;
  }
  const body =
    data && headers[CONTENT_TYPE] === APPLICATION_JSON
      ? JSON.stringify(data)
      : data;
  const path = `/.netlify/${functionsName}/${name}`;
  const url = buildUrl(path, params);
  const fetchOptions = {
    ...(Object.keys(headers).length !== 0 && { headers }), // add if not empty object
    ...(!!body && { body }), // add if not empty object
    ...rest,
  };

  const response = await fetch(url, fetchOptions);
  if (response.ok) {
    if (response.headers.get(CONTENT_TYPE) === APPLICATION_JSON) {
      const responseObject = await response.json();
      return responseObject;
    }
    return response.text();
  }

  // if not OK then throw with text of body as the message
  const message = await response.text();
  throw new Error(message);
};

export default lambdog;
