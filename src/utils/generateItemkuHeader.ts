import * as crypto from 'crypto'

export function generateItemkuHeader(payload: any){
    const header = { alg: 'HS256' };

    const nonce = Math.floor(new Date().getTime() / 1000).toString();

    const encodeBase64Url = (data) => {
        const base64 = Buffer.from(JSON.stringify(data)).toString('base64');
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    };

    const unsignedToken = encodeBase64Url(header) + '.' + encodeBase64Url(payload);

    const signature = crypto.createHmac('sha256', process.env.ITEMKU_SECRET_KEY ?? '').update(unsignedToken).digest('base64');
    const encodedSignature = signature.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const authToken = unsignedToken + '.' + encodedSignature;

    return {
        authToken,
        nonce
    }
}