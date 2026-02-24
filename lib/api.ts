const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function health(): Promise<string> {
	const url = `${base}/health`;
	const res = await fetch(url, { cache: "no-store" });
	if (!res.ok) return `error: ${res.status}`;
	try {
		const text = await res.text();
		return text || "ok";
	} catch {
		return "ok";
	}
}
