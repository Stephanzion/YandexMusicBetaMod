import { err, ok, Result } from "neverthrow";

export async function signRequestUrl(originalUrl: string): Promise<Result<string, Error>> {
	const secretKey = "***REMOVED***";

	try {
		// Текущая дата в формате yMMdd
		const now = new Date();
		const y = now.getFullYear().toString();
		const M = (now.getMonth() + 1).toString().padStart(2, "0");
		const d = now.getDate().toString().padStart(2, "0");
		const yMMdd = y[3] + M + d; // Берем только последнюю цифру года

		const urlWithDate = originalUrl + yMMdd;

		// Создание подписи
		const encoder = new TextEncoder();
		const keyData = encoder.encode(secretKey);
		const messageData = encoder.encode(urlWithDate);

		const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
		const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
		// Преобразование в base64
		const byteArray = new Uint8Array(signatureBuffer);
		const base64Signature = btoa(String.fromCharCode(...byteArray));
		const encodedSignature = encodeURIComponent(base64Signature);

		// Добавляем параметры к URL
		const separator = originalUrl.includes("?") ? "&" : "?";
		return ok(`${originalUrl}${separator}signature=${encodedSignature}&signature_protocol=sha1`);
	} catch (error) {
		return err(error as Error);
	}
}
