export const config = { runtime: "edge" };

export default async function handler(request) {
  try {
    if (request.method === "GET") {
      return new Response(JSON.stringify({ e: "Relay is Active." }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ e: "Method not allowed." }), { status: 405 });
    }

    const req = await request.json();
    if (!req.u) {
      return new Response(JSON.stringify({ e: "missing url" }), { status: 400 });
    }

    const targetUrl = new URL(req.u);
    const headers = new Headers();
    
    if (req.h && typeof req.h === "object") {
      for (const [k, v] of Object.entries(req.h)) {
        headers.set(k, v);
      }
    }

    const fetchOptions = {
      method: (req.m || "GET").toUpperCase(),
      headers,
      redirect: req.r === false ? "manual" : "follow"
    };

    if (req.b) {
      const binaryString = atob(req.b);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      fetchOptions.body = bytes;
    }

    const resp = await fetch(targetUrl.toString(), fetchOptions);
    const buffer = await resp.arrayBuffer();
    const uint8 = new Uint8Array(buffer);
    
    let binary = "";
    for (let i = 0; i < uint8.length; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    const base64 = btoa(binary);

    const responseHeaders = {};
    resp.headers.forEach((v, k) => { responseHeaders[k] = v; });

    return new Response(JSON.stringify({
      s: resp.status,
      h: responseHeaders,
      b: base64
    }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ e: String(err) }), { status: 500 });
  }
}
