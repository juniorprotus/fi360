import assert from "node:assert/strict";
import http from "node:http";
import express, { NextFunction, Request, Response } from "express";
import { gzipSync } from "node:zlib";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.post("/", (req: Request, res: Response) => {
  res.status(200).json({ received: req.body });
});
app.use((error: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  res.status(error.status ?? 500).json({ message: "Request rejected" });
});

function request(
  server: http.Server,
  body: Buffer,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: string }> {
  const address = server.address();
  if (!address || typeof address === "string") {
    return Promise.reject(new Error("Test server is not listening on a TCP port."));
  }

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port: address.port,
        path: "/",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": body.length,
          ...headers,
        },
      },
      (res) => {
        let responseBody = "";
        res.setEncoding("utf8");
        res.on("data", (chunk: string) => (responseBody += chunk));
        res.on("end", () => resolve({ status: res.statusCode ?? 500, body: responseBody }));
      }
    );

    req.on("error", reject);
    req.end(body);
  });
}

async function run(): Promise<void> {
  const server = await new Promise<http.Server>((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });

  try {
    const valid = await request(server, Buffer.from(JSON.stringify({ valid: true })));
    assert.equal(valid.status, 200);
    assert.deepEqual(JSON.parse(valid.body), { received: { valid: true } });
    console.log("PASS: valid JSON is parsed");

    const malformed = await request(server, Buffer.from("{"));
    assert.equal(malformed.status, 400);
    console.log("PASS: malformed JSON is rejected");

    const oversized = await request(
      server,
      Buffer.from(JSON.stringify({ value: "x".repeat(1024 * 1024) }))
    );
    assert.equal(oversized.status, 413);
    console.log("PASS: JSON larger than the 1 MB body limit is rejected");

    const compressed = await request(
      server,
      gzipSync(Buffer.from(JSON.stringify({ compressed: true }))),
      { "Content-Encoding": "gzip" }
    );
    assert.equal(compressed.status, 200);
    assert.deepEqual(JSON.parse(compressed.body), { received: { compressed: true } });
    console.log("PASS: valid gzip-compressed JSON remains supported");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

run().catch((error: unknown) => {
  console.error("Body-parser regression tests failed:", error);
  process.exitCode = 1;
});
