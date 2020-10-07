let bytes = require('bytes');

let KoaBody = Object.assign(async function(ctx, {
	limit = Infinity,
} = {}) {
	let req = ctx.req || ctx;
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
}, {
	async text(ctx, {
		limit = '56kb',
		...options
	} = {}) {
		return `${await KoaBody(ctx, {limit, ...options})}`;
	},
	async json(ctx, {
		limit = '1mb',
		...options
	} = {}) {
		return JSON.parse(await KoaBody.text(ctx, {limit, ...options}));
	},
});

module.exports = KoaBody;