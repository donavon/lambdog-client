<div align="center">
<img
  height="200"
  width="200"
  alt="part lamb, part dog"
  src="https://user-images.githubusercontent.com/887639/56451023-b2ef9280-62f7-11e9-8897-7de261cf0797.png"
/>
<p>It's part lamb. It's part dog. It's Lambdog.</p>
</div>

Ok, so what IS Lambdog? Lambdog is a set of packages (one for the client, and one for the server)
that makes it easy to call and write Lambda functions for use on Netlify. You can use either one independently, or use them together.

## @lambdog/client

@lambdog/client ealilly connects your front-end app with your back-end Netlify function.
No need to worry about `fetch` or JSON encoding/decoding.

## Installation

```bash
$ npm i @lambdog/client
```

or

```bash
$ yarn add @lambdog/client
```

## Usage

Here is a basic setup.

```js
import lambdog from '@lambdog/client';

const hello = (name) => lambdog('hello', { params { name }});

// Then to use it

const text = await hello('World');
console.log(text); // "Hello World"

// or

hello('World').then(text => console.log(text));
```

To pass date, specify the `method` and the `data`. Lambdog will automatically JSON stringify the data on the way out and parse on the way back.

```js
const addToto = (data) =>
  lambdog('todo-add', {
    method: 'POST',
    data,
  });
```

Then to update a todo on the server

```js
const id = await addToto({ text: 'buy milk', completed: false });
```

### Parameters

Here are the parameters that you can use.

| Parameter      | Description                                                                        |
| :------------- | :--------------------------------------------------------------------------------- |
| `functionName` | A string containing the Netlify function to call. See below for passed parameters. |
| `options`      | An optional configuration object.                                                  |

### Return

`lambdog` returns a promise that resolves to the output from your
Netlify function.

### Configuration object

The configuration object has the following options.

A string used for URL pattern matching. For example, if you want the URL `/.netlify/functions/hello/World` to call your `hello` function and pass "World" as the `name` prop, set `pathToProps` to ":name"
| Parameter | Description |
| :-------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `params` | An object that will be converted to search params or replaces in the path. If you call with `fn('hello', {params: {foo: 'bar'}})` the the URL will be `/.netlify/functions/hello?name=World`. If you call with `fn('hello/:name', {params: {foo: 'bar'}})` the the URL will be `/.netlify/functions/hello/World` |
| `headers` | An optional object with key/values to use in the HTTP header. Defaults to `{'content-type': 'application/json'}` for calls that include data.|
| `data` | Any data that you would like serialized in the HTTP body. By default, this will be `JSON.stringify`ed. |

## License

**[MIT](LICENSE)** Licensed
