/**
 * Ejecutor de órdenes para Polymarket CLOB.
 *
 * Levanta un servidor HTTP local en PORT. El bot Python le envía
 * POST /orders con { side, token_id, price, size_usdc } y este proceso
 * firma y coloca la orden GTC vía @polymarket/clob-client.
 *
 * NUNCA exponer este puerto fuera de localhost.
 */
import "dotenv/config";
import Fastify from "fastify";
import { Wallet } from "ethers";
import {
  ClobClient,
  OrderType,
  Side,
  type ApiKeyCreds,
} from "@polymarket/clob-client";

const {
  PRIVATE_KEY,
  POLY_FUNDER,
  CLOB_API_KEY,
  CLOB_API_SECRET,
  CLOB_API_PASSPHRASE,
  PORT = "8787",
  CLOB_HOST = "https://clob.polymarket.com",
  CHAIN_ID = "137",
} = process.env;

if (!PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY no está configurada en .env");
}

const chainId = Number(CHAIN_ID);
const signer = new Wallet(PRIVATE_KEY);

let creds: ApiKeyCreds | undefined;
if (CLOB_API_KEY && CLOB_API_SECRET && CLOB_API_PASSPHRASE) {
  creds = {
    key: CLOB_API_KEY,
    secret: CLOB_API_SECRET,
    passphrase: CLOB_API_PASSPHRASE,
  };
}

// Si no hay creds, las derivamos (firma onchain L1, sin gas)
async function getClient(): Promise<ClobClient> {
  // signatureType=2 = EOA con funder (proxy magic). Si usas wallet directa, 0.
  const sigType = POLY_FUNDER ? 2 : 0;
  if (!creds) {
    const bootstrap = new ClobClient(
      CLOB_HOST,
      chainId,
      signer,
      undefined,
      sigType,
      POLY_FUNDER,
    );
    creds = await bootstrap.createOrDeriveApiKey();
    console.log("== Guarda estas credenciales en tu .env ==");
    console.log("CLOB_API_KEY=" + creds.key);
    console.log("CLOB_API_SECRET=" + creds.secret);
    console.log("CLOB_API_PASSPHRASE=" + creds.passphrase);
  }
  return new ClobClient(CLOB_HOST, chainId, signer, creds, sigType, POLY_FUNDER);
}

interface OrderRequest {
  side: "BUY" | "SELL";
  outcome?: "YES" | "NO";
  token_id: string;
  price: number;      // 0-1
  size_usdc: number;  // monto en USDC a gastar
}

function validate(req: unknown): OrderRequest {
  const r = req as Partial<OrderRequest>;
  if (!r || typeof r !== "object") throw new Error("payload inválido");
  if (r.side !== "BUY" && r.side !== "SELL") throw new Error("side debe ser BUY|SELL");
  if (typeof r.token_id !== "string" || !r.token_id) throw new Error("token_id requerido");
  if (typeof r.price !== "number" || r.price <= 0 || r.price >= 1)
    throw new Error("price fuera de (0,1)");
  if (typeof r.size_usdc !== "number" || r.size_usdc <= 0)
    throw new Error("size_usdc inválido");
  return r as OrderRequest;
}

async function main() {
  const client = await getClient();
  console.log("CLOB client listo. Address:", await signer.getAddress());

  const app = Fastify({ logger: true });

  app.get("/health", async () => ({ ok: true }));

  app.post("/orders", async (request, reply) => {
    let body: OrderRequest;
    try {
      body = validate(request.body);
    } catch (e: any) {
      return reply.code(400).send({ error: e.message });
    }

    // size_shares = size_usdc / price  (en Polymarket 1 outcome token paga $1 si gana)
    const size = body.size_usdc / body.price;

    try {
      const order = await client.createOrder({
        tokenID: body.token_id,
        price: body.price,
        side: body.side === "BUY" ? Side.BUY : Side.SELL,
        size,
        feeRateBps: 0,
      });
      const resp = await client.postOrder(order, OrderType.GTC);
      app.log.info({ resp }, "orden colocada");
      return { status: "ok", order: resp };
    } catch (e: any) {
      app.log.error({ err: e?.message }, "fallo postOrder");
      return reply.code(500).send({ error: e?.message ?? "unknown" });
    }
  });

  await app.listen({ host: "127.0.0.1", port: Number(PORT) });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
