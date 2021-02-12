let KoaRoute = require('@seregpie/koa-route');
let assert = require('assert').strict;
let FormData = require('form-data');
let JustMyLuck = require('just-my-luck');
let Koa = require('koa');
let fetch = require('node-fetch');
let {URLSearchParams} = require('url');
let {isDeepStrictEqual} = require('util');
let {
	brotliCompressSync,
	deflateSync,
	gzipSync,
} = require('zlib');

let {pipeline, finished} = require('stream');

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
				let {req} = ctx;
				(req
					.on('data', data => {
						console.log('onData', 1, data);
					})
					.on('data', data => {
						console.log('onData', 2, data);
					})
					.on('end', () => {
						console.log('onEnd', 1);
					})
					.on('error', () => {
						console.log('onError', 1);
					})
					.on('close', () => {
						console.log('onClose', 1);
					})
				);
				let a = pipeline(req, (arg0, arg1) => {
					console.log('pipeline', arg1);
					throw new Error('WOOOT');
				}, (err) => {
					if (err) {
						console.error('Pipeline failed.', err);
					} else {
						console.log('Pipeline succeeded.');
					}
				});
				finished(a, (err) => {
					if (err) {
						console.error('finished failed.', err);
					} else {
						console.log('finished succeeded.');
					}
				});
				/*let body = await KoaBody(ctx);
				if (!isDeepStrictEqual(body, value)) {
					throw 0;
				}*/
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
				{
					let res = await fetch(origin, {
						method: 'POST',
						headers: {
							'Content-Encoding': 'gzip',
							'Content-Type': 'application/json',
						},
						body: gzipSync(JSON.stringify(value)),
					});
					assert(res.ok);
				}
				{
					let res = await fetch(origin, {
						method: 'POST',
						headers: {
							'Content-Encoding': 'deflate',
							'Content-Type': 'application/json',
						},
						body: deflateSync(JSON.stringify(value)),
					});
					assert(res.ok);
				}
				{
					let res = await fetch(origin, {
						method: 'POST',
						headers: {
							'Content-Encoding': 'br',
							'Content-Type': 'application/json',
						},
						body: brotliCompressSync(JSON.stringify(value)),
					});
					assert(res.ok);
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
