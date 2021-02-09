let KoaRoute = require('@seregpie/koa-route');
let assert = require('assert').strict;
let FormData = require('form-data');
let JustMyLuck = require('just-my-luck');
let Koa = require('koa');
let fetch = require('node-fetch');
let {URLSearchParams} = require('url');
let {
	isDeepStrictEqual,
	promisify,
} = require('util');
let {gzip} = require('zlib');

gzip = promisify(gzip);

let KoaBody = require('./index');

(async () => {

	let app = new Koa();
	app.on('error', () => {
		// pass
	});
	let handle;
	app.use(ctx => handle(ctx));
	await new Promise(resolve => {
		app.server = app.listen(resolve);
	});
	try {
		let {port} = app.server.address();
		let origin = `http://localhost:${port}`;
		{
			let value;
			handle = (async ctx => {
				console.log(ctx.headers);
				let body = await KoaBody(ctx);
				if (!isDeepStrictEqual(body, value)) {
					throw 0;
				}
				ctx.body = null;
			});
			{
				value = 'aaa';
				{
					let res = await fetch(origin, {
						method: 'POST',
						body: value,
					});
					assert(res.ok);
				}
				{
					console.log(await gzip(value));
					let res = await fetch(origin, {
						method: 'POST',
						headers: {
							'Content-Encoding': 'gzip',
							'Content-Type': 'text/plain',
						},
						body: await gzip(value),
					});
					assert(res.ok);
				}
				{
					let value = 'bbb';
					let res = await fetch(origin, {
						method: 'POST',
						body: value,
					});
					assert(!res.ok);
				}
			}
			{
				value = {a: 1, b: 2};
				{
					let res = await fetch(origin, {
						method: 'POST',
						headers: {'Content-Type': 'application/json'},
						body: JSON.stringify(value),
					});
					assert(res.ok);
				}
				{
					let value = {a: 2, b: 1};
					let res = await fetch(origin, {
						method: 'POST',
						headers: {'Content-Type': 'application/json'},
						body: JSON.stringify(value),
					});
					assert(!res.ok);
				}
			}
			{
				value = {a: 'aaa', b: 'bbb'};
				{
					let data = new URLSearchParams();
					Object.entries(value).forEach(([key, value]) => {
						data.append(key, value);
					});
					let res = await fetch(origin, {
						method: 'POST',
						body: data,
					});
					assert(res.ok);
				}
				{
					let value = {a: 'bbb', b: 'aaa'};
					let data = new URLSearchParams();
					Object.entries(value).forEach(([key, value]) => {
						data.append(key, value);
					});
					let res = await fetch(origin, {
						method: 'POST',
						body: data,
					});
					assert(!res.ok);
				}
			}
		}
		{
			handle = (async ctx => {
				await KoaBody(ctx, {limit: '2b'});
				ctx.body = null;
			});
			{
				let res = await fetch(origin, {
					method: 'POST',
					body: 'a',
				});
				assert(res.ok);
			}
			{
				let res = await fetch(origin, {
					method: 'POST',
					body: 'aaa',
				});
				assert(!res.ok);
			}
		}
	} finally {
		await new Promise(resolve => {
			app.server.close(resolve);
		});
	}

})();
