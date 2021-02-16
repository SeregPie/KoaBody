let bytes = require('bytes');
let formidable = require('formidable');
let qs = require('qs');
let {
	createBrotliDecompress,
	createGunzip,
	createInflate,
} = require('zlib');

let {isArray} = Array;

function isObject(value) {
	if (value) {
		let type = typeof value;
		return type === 'object' || type === 'function';
	}
	return false;
}

function parseBytes(string) {
	return require('bytes').parse(string);
}

function parseContentType(string) {
	return require('content-type').parse(string);
}

class MyError extends Error {
	constructor(status, message) {
		super(message);
		Object.assign(this, {status});
	}
}


async function cccc(
	source,
	target,
	requiredLength,
	maxLength,

) {

}


// length know
async function a1(req, {
	limit = Infinity,
	lengthRequired = false,
} = {}) {
	let maxLength;
	let requiredLength;
	{
		if (requiredLength > maxLength) {
			throw new MyError(413, 'Payload Too Large');
		}
	}
	let currentLength = 0;
	{
		let onData;
		let onEnd;
		let onError;
		let onClose;
		try {
			await new Promise((resolve, reject) => {
				(req
					.on('data', onData = (({length}) => {
						currentLength += length;
						try {
							if (currentLength > requiredLength) {
								throw new MyError(400, 'ERR_CONTENT_LENGTH_MISMATCH');
							}
						} catch (error) {
							reject(error);
						}
					}))
					.on('end', onEnd = resolve)
					.on('error', onError = (() => {
						reject(new MyError(500, 'Internal Server Error'));
					}))
					.on('close', onClose = (() => {
						reject(new MyError(500, 'Internal Server Error'));
					}))
				);
			});
		} finally {
			(req
				.off('data', onData)
				.off('end', onEnd)
				.off('error', onError)
				.off('close', onClose)
			);
		}
	}
	if (currentLength < requiredLength) {
		throw new MyError(400, 'ERR_CONTENT_LENGTH_MISMATCH');
	}
}

// length unknow
async function a2(req, {
	limit = Infinity,
	lengthRequired = false,
} = {}) {
	let maxLength;
	let requiredLength;
	let currentLength = 0;
	{
		let onData;
		let onEnd;
		let onError;
		let onClose;
		try {
			await new Promise((resolve, reject) => {
				(req
					.on('data', onData = (({length}) => {
						currentLength += length;
						try {
							if (currentLength > maxLength) {
								throw new MyError(413, 'Payload Too Large');
							}
						} catch (error) {
							reject(error);
						}
					}))
					.on('end', onEnd = resolve)
					.on('error', onError = (() => {
						reject(new MyError(500, 'Internal Server Error'));
					}))
					.on('close', onClose = (() => {
						reject(new MyError(500, 'Internal Server Error'));
					}))
				);
			});
		} finally {
			(req
				.off('data', onData)
				.off('end', onEnd)
				.off('error', onError)
				.off('close', onClose)
			);
		}
	}
}

async function aaaa(req, {
	limit = Infinity,
	required = false,
	lengthRequired = false,
} = {}) {
	let maxLength = bytes.parse(limit); // todo
	let currentLength = 0;
	{
		let header = req.headers['content-length'];
		if (header) {
			let requiredLength = Number(header); // todo: validate
			if (requiredLength > maxLength) {
				throw new MyError(413, 'Payload Too Large');
			}
			on111 = (() => {
				if (currentLength > requiredLength) {
					throw new MyError(400, 'ERR_CONTENT_LENGTH_MISMATCH');
				}
			});
			on222 = (() => {
				if (currentLength < requiredLength) {
					throw new MyError(400, 'ERR_CONTENT_LENGTH_MISMATCH');
				}
			});
		} else
		if (lengthRequired) {
			throw new MyError(411, 'Length Required');
		} else {
			on111 = (() => {
				if (currentLength > maxLength) {
					throw new MyError(413, 'Payload Too Large');
				}
			});
		}
	}
	{
		let header = req.headers['content-encoding'];
		if (header) {
			let encoding = header;
			switch (encoding) {
				case 'gzip': {
					z = createGunzip();
					break;
				}
				case 'deflate': {
					z = createInflate();
					break;
				}
				case 'identity': {
					break;
				}
				case 'br': {
					z = createBrotliDecompress();
					break;
				}
				default: {
					throw new MyError(415, 'Unsupported Media Type');
				}
			}
		}
	}
	{
		let onData;
		let onEnd;
		let onError;
		let onClose;
		try {
			await new Promise((resolve, reject) => {
				(req
					.on('data', onData = (({length}) => {
						currentLength += length;
						try {
							on111();
						} catch (error) {
							reject(error);
						}
					}))
					.on('end', onEnd = resolve)
					.on('error', onError = (() => {
						reject(new MyError(500, 'Internal Server Error'));
					}))
					.on('close', onClose = (() => {
						reject(new MyError(500, 'Internal Server Error'));
					}))
				);
			});
		} finally {
			(req
				.off('data', onData)
				.off('end', onEnd)
				.off('error', onError)
				.off('close', onClose)
			);
		}
	}
	on222();
	if (ctx.is('json')) {
		let {
			strict = false,
		} = jsonOptions;
		let v = JSON.parse(await toString(req));
		if (strict) {
			if (!isArray(v) && !isObject(v)) {
				throw new Error();
			}
		}
	}
	if (ctx.is('text')) {
		let v = await toString(req);
	}
	if (ctx.is('application/x-www-form-urlencoded')) {
		v = qs.parse(await toString(req), {
			depth: Infinity,
			parameterLimit: Infinity,
		});
		console.log(v);
		return v;
	}
	if (ctx.is('multipart/form-data')) {
		let v = {};
		on('file')
		on('data')
	}
	throw new MyError(415, 'Unsupported Media Type');
}

async function text(ctx, {
	limit = '56kb',
	...options
} = {}) {
	let v = await aaaa(ctx, {limit, ...options});
	return `${v}`;
}

async function json(ctx, {
	limit = '1mb',
	strict = false,
	...options
} = {}) {
	let v = await text(ctx, {limit, ...options});
	v = JSON.parse(v);
	if (strict) {
		if (!isArray(v) && !isObject(v)) {
			throw new Error();
		}
	}
	return v;
}

// MIME sniffing
async function form(ctx, {
	limit = '56kb',
	...options
} = {}) {
	console.log(ctx.headers);
	let form = formidable({multiples: true});
	await new Promise((resolve, reject) => {
		form.parse(ctx.req, (error, fields, files) => {
			if (error) {
				reject(error);
			} else {
				console.log(fields, files);
				resolve();
			}
		});
	});
	return {};
}

module.exports = Object.assign(async function(ctx, {
	limit,
	json: jsonOptions,
	text: textOptions,
	form: formOptions,
	...options
} = {}) {
	let jsonLimit;
	let textLimit;
	let formLimit;
	if (isObject(limit)) {
		({
			json: jsonLimit,
			text: textLimit,
			form: formLimit,
		} = limit);
	} else {
		jsonLimit = textLimit = formLimit = limit;
	}
	if (ctx.is('json')) {
		return await json(ctx, {
			limit: jsonLimit,
			...jsonOptions,
			...options,
		});
	}
	if (ctx.is('text')) {
		return await text(ctx, {
			limit: textLimit,
			...textOptions,
			...options,
		});
	}
	if (ctx.is('application/x-www-form-urlencoded')) {
		let v = await text(ctx, options);
		v = qs.parse(v, {
			depth: Infinity,
			parameterLimit: Infinity,
		});
		console.log(v);
		return v;
	}
	if (ctx.is('multipart/form-data')) {
		let v = await text(ctx, options);
		v = qs.parse(v, {
			depth: Infinity,
			parameterLimit: Infinity,
		});
		console.log(v);
		return v;
	}

}, {
	json,
	text,
});
