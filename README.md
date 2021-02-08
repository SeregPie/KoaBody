# KoaBody

A simple body fetcher for Koa.

## setup

```shell
npm i @seregpie/koa-body
```

## usage

```javascript
let Koa = require('koa');
let KoaBody = require('@seregpie/koa-body');

let app = new Koa();

app.use(async ctx => {
  ctx.body = await KoaBody.json(ctx);
});
```

---

Fetch the body as `application/json`. The default limit of the content length is 1mb.

```javascript
let body = await KoaBody.json(ctx);
```

---

Set an explicit limit.

```javascript
let body = await KoaBody.json(ctx, {limit: '16mb'});
```

---

Fetch the body as `text/plain`. The default limit of the content length is 56kb.

```javascript
let body = await KoaBody.text(ctx);
```

---

Detect the content type automatically.

```javascript
let body = await KoaBody(ctx);
```
