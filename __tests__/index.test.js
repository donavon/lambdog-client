import lambdog from '../src';

if (!Object.fromEntries) {
  Object.fromEntries = function ObjectFromEntries(iter) {
    const obj = {};

    // eslint-disable-next-line no-restricted-syntax
    for (const pair of iter) {
      if (Object(pair) !== pair) {
        throw new TypeError('iterable for fromEntries should yield objects');
      }

      // Consistency with Map: contract is that entry has "0" and "1" keys, not
      // that it is an array or iterable.

      // eslint-disable-next-line quote-props
      const { '0': key, '1': val } = pair;

      Object.defineProperty(obj, key, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: val,
      });
    }

    return obj;
  };
}

const fooBarData = { foo: 'bar' };

const createMockFetch = (options = {}) => {
  const {
    status = 200,
    ok = true,
    statusText = 'ok',
    contentType = 'application/json',
    jsonResult = fooBarData,
    textResult = 'text',
  } = options;

  const response = {
    status,
    statusText,
    ok,
    headers: {
      get: () => contentType,
      entries: () => [['content-type', contentType]],
    },
    json: async () => jsonResult,
    text: async () => textResult,
  };

  const fetch = jest.fn(() => Promise.resolve(response));
  fetch.response = response;
  return fetch;
};

global.fetch = createMockFetch();

describe('lambdog', () => {
  it('returns a promise', () => {
    const fn = lambdog('foo');
    expect(fn instanceof Promise).toBe(true);
  });
  it('lambdog(functionName, options) resolves to a LambdogResponse object', async () => {
    const fetch = createMockFetch();
    const data = await lambdog('foo', {
      fetch,
      foo: 'bar',
    });
    expect(fetch).toBeCalledWith('/.netlify/functions/foo', fooBarData);
    expect(data).toEqual({
      data: fooBarData,
      headers: {
        'content-type': 'application/json',
      },
      status: 200,
      statusText: 'ok',
      response: fetch.response,
    });
  });
  it('builds a URL to Netlify', () => {
    const fetch = createMockFetch();
    lambdog('foo', { fetch });
    expect(fetch).toBeCalledWith('/.netlify/functions/foo', {});
  });
  it('builds a URL to Netlify with params in the URL', () => {
    const fetch = createMockFetch();
    lambdog('foo/:id', { fetch, params: { id: 123 } });
    expect(fetch).toBeCalledWith('/.netlify/functions/foo/123', {});
  });
  it('builds a URL to Netlify with params as a search query', () => {
    const fetch = createMockFetch();
    lambdog('foo', { fetch, params: { id: 123 } });
    expect(fetch).toBeCalledWith('/.netlify/functions/foo?id=123', {});
  });
  it('defaults to POST is data is present and method not specified', async () => {
    const fetch = createMockFetch();
    await lambdog('foo', { method: 'foo', fetch, data: fooBarData });
    expect(fetch).toBeCalledWith('/.netlify/functions/foo', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(fooBarData),
      method: 'foo',
    });
    await lambdog('foo', { fetch, data: fooBarData });
    expect(fetch).toBeCalledWith('/.netlify/functions/foo', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(fooBarData),
      method: 'post',
    });
  });
  it('encode only if content-type is application/json', async () => {
    const fetch = createMockFetch();
    await lambdog('foo', {
      fetch,
      headers: { 'content-type': 'text/plain' },
      data: 'this is plain text',
    });
    expect(fetch).toBeCalledWith('/.netlify/functions/foo', {
      headers: { 'content-type': 'text/plain' },
      body: 'this is plain text',
      method: 'post',
    });
    await lambdog('foo', {
      fetch,
      headers: { 'content-type': 'application/json' },
      data: fooBarData,
    });
    expect(fetch).toBeCalledWith('/.netlify/functions/foo', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(fooBarData),
      method: 'post',
    });
  });

  it('does not override method (if specified) when data present', () => {
    const fetch = createMockFetch();
    lambdog('foo', {
      fetch,
      headers: { 'content-type': 'text/plain' },
      data: 'this is plain text',
      method: 'FOO',
    });
    expect(fetch).toBeCalledWith('/.netlify/functions/foo', {
      headers: { 'content-type': 'text/plain' },
      body: 'this is plain text',
      method: 'FOO',
    });
  });

  describe('when response is application/json', () => {
    it('resolves with a parsed JSON object', async () => {
      const fetch = createMockFetch();
      const { data } = await lambdog('foo', { fetch });
      expect(data).toEqual({ foo: 'bar' });
    });
  });
  describe('when response is NOT application/json', () => {
    it('resolves with the body text as a string', async () => {
      const fetch = createMockFetch({ contentType: '', textResult: 'footext' });
      const { data } = await lambdog('foo', { fetch });
      expect(data).toBe('footext');
    });
  });
  describe('when the fetch returns a status <200 or >= 300', () => {
    it('throws with the body text as the error message', async () => {
      const fetch = createMockFetch({ ok: false, textResult: 'footext' });
      await expect(lambdog('foo', { fetch })).rejects.toThrow('footext');
    });
  });
});

describe('lambdog convenience functions', async () => {
  // eslint-disable-next-line no-restricted-syntax
  for (const method of ['post', 'put', 'patch']) {
    // eslint-disable-next-line no-await-in-loop
    it(`lambdog.${method}(name, data, options) defaults to ${method.toUpperCase()} and resolves to data`, async () => {
      const fetch = createMockFetch();
      const data = await lambdog[method]('foo', 'data', { fetch });
      expect(fetch).toBeCalledWith('/.netlify/functions/foo', {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify('data'),
        method,
      });
      expect(data).toEqual(fooBarData);
    });
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const method of ['get', 'delete', 'head']) {
    // eslint-disable-next-line no-await-in-loop
    it(`lambdog.${method}(name, options) defaults to ${method.toUpperCase()} and resolves to data`, async () => {
      const fetch = createMockFetch();
      const data = await lambdog[method]('foo', { fetch });
      expect(fetch).toBeCalledWith('/.netlify/functions/foo', {
        method,
      });
      expect(data).toEqual(fooBarData);
    });
  }

  it('lambdog.request(options) resolves to a LambdogResponse object', async () => {
    const fetch = createMockFetch();
    const data = await lambdog.request({
      functionName: 'foo',
      fetch,
      foo: 'bar',
    });
    expect(fetch).toBeCalledWith('/.netlify/functions/foo', fooBarData);
    expect(data).toEqual({
      data: fooBarData,
      headers: {
        'content-type': 'application/json',
      },
      status: 200,
      statusText: 'ok',
      response: fetch.response,
    });
  });
});
