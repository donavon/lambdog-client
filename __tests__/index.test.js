import lambdog from '../src';

const fooBarData = { foo: 'bar' };

const createMockFetch = (options = {}) => {
  const {
    status = 200,
    ok = true,
    contentType = 'application/json',
    jsonResult = { foo: 'bar' },
    textResult = '',
  } = options;

  return jest.fn(() =>
    Promise.resolve({
      status,
      ok,
      headers: {
        get: () => contentType,
      },
      json: () => jsonResult,
      text: () => textResult,
    })
  );
};

global.fetch = createMockFetch();

describe('lambdog', () => {
  it('returns a promise', () => {
    const fn = lambdog('foo');
    expect(fn instanceof Promise).toBe(true);
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
  it('JSON encodes data by default', () => {
    const fetch = createMockFetch();
    lambdog('foo', { fetch, data: fooBarData });
    expect(fetch).toBeCalledWith('/.netlify/functions/foo', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(fooBarData),
      method: 'POST',
    });
  });
  it('does not encode if content-type is NOT application/json', () => {
    const fetch = createMockFetch();
    lambdog('foo', {
      fetch,
      headers: { 'content-type': 'text/plain' },
      data: 'this is plain text',
    });
    expect(fetch).toBeCalledWith('/.netlify/functions/foo', {
      headers: { 'content-type': 'text/plain' },
      body: 'this is plain text',
      method: 'POST',
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
    it('it resolves with a parsed JSON object', async () => {
      const fetch = createMockFetch();
      const obj = await lambdog('foo', { fetch });
      expect(obj).toEqual({ foo: 'bar' });
    });
  });
  describe('when response is NOT application/json', () => {
    it('it resolves with the body text as a string', async () => {
      const fetch = createMockFetch({ contentType: '', textResult: 'footext' });
      const txt = await lambdog('foo', { fetch });
      expect(txt).toBe('footext');
    });
  });
  describe('when the fetch returns a status <200 or >= 300', () => {
    it('it throws with the body text as the error message', async () => {
      const fetch = createMockFetch({ ok: false, textResult: 'footext' });
      await expect(lambdog('foo', { fetch })).rejects.toThrow('footext');
    });
  });
});

describe('lambdog.post', () => {
  it('defaults the method to POST and adds data as a required second argument', () => {
    const fetch = createMockFetch();
    lambdog.post('foo', 'data', { fetch });
    expect(fetch).toBeCalledWith('/.netlify/functions/foo', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify('data'),
      method: 'POST',
    });
  });
});

describe('lambdog.put', () => {
  it('defaults the method to PUT and adds data as a required second argument', () => {
    const fetch = createMockFetch();
    lambdog.put('foo', 'data', { fetch });
    expect(fetch).toBeCalledWith('/.netlify/functions/foo', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify('data'),
      method: 'PUT',
    });
  });
});

describe('lambdog.patch', () => {
  it('defaults the method to PATCH and adds data as a required second argument', () => {
    const fetch = createMockFetch();
    lambdog.patch('foo', 'data', { fetch });
    expect(fetch).toBeCalledWith('/.netlify/functions/foo', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify('data'),
      method: 'PATCH',
    });
  });
});

describe('lambdog.request', () => {
  it('has no name argument, instead use options.name', () => {
    const fetch = createMockFetch();
    lambdog.request({ name: 'foo', fetch });
    expect(fetch).toBeCalledWith('/.netlify/functions/foo', {});
  });
});

describe('lambdog.get', () => {
  it('defaults the method to GET', () => {
    const fetch = createMockFetch();
    lambdog.get('foo', { fetch });
    expect(fetch).toBeCalledWith('/.netlify/functions/foo', {
      method: 'GET',
    });
  });
});

describe('lambdog.head', () => {
  it('defaults the method to HEAD', () => {
    const fetch = createMockFetch();
    lambdog.head('foo', { fetch });
    expect(fetch).toBeCalledWith('/.netlify/functions/foo', {
      method: 'HEAD',
    });
  });
});

describe('lambdog.delete', () => {
  it('defaults the method to DELETE', () => {
    const fetch = createMockFetch();
    lambdog.delete('foo', { fetch });
    expect(fetch).toBeCalledWith('/.netlify/functions/foo', {
      method: 'DELETE',
    });
  });
});
