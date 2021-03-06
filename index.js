let bytes = require('bytes');

async function blob(ctx, {
	limit = Infinity,
} = {}) {
	let {req} = ctx;
	let minLength = 0;
	let maxLength = bytes.parse(limit);
	{
		let header = req.headers['content-length'];
		if (header) {
			minLength = Number(header);
			if (minLength > maxLength) {
				throw new Error();
			}
			maxLength = minLength;
		}
	}
	let currentData = [];
	let currentLength = 0;
	let onData;
	let onEnd;
	let onError;
	let onClose;
	try {
		await new Promise((resolve, reject) => {
			(req
				.on('data', onData = (data => {
					currentLength += data.length;
					if (currentLength > maxLength) {
						reject(new Error());
					}
					currentData.push(data);
				}))
				.on('end', onEnd = resolve)
				.on('error', onError = reject)
				.on('close', onClose = (() => {
					reject(new Error());
				}))
			);
		});
	} finally {
		(req
			.removeListener('data', onData)
			.removeListener('end', onEnd)
			.removeListener('error', onError)
			.removeListener('close', onClose)
		);
	}
	if (currentLength < minLength) {
		throw new Error();
	}
	return Buffer.concat(currentData);
}

async function text(ctx, {
	limit = '56kb',
	...options
} = {}) {
	let v = await blob(ctx, {limit, ...options});
	return `${v}`;
}

async function json(ctx, {
	limit = '1mb',
	...options
} = {}) {
	let v = await text(ctx, {limit, ...options});
	return JSON.parse(v);
}

module.exports = Object.assign(async function(ctx, options) {
	if (ctx.is('text')) {
		return await text(ctx, options);
	}
	if (ctx.is('json')) {
		return await json(ctx, options);
	}
	return await blob(ctx, options);
}, {
	json,
	text,
});
