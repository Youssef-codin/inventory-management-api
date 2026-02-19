import http from "k6/http";
import { check, sleep } from "k6";

// ─── Options ────────────────────────────────────────────────────────────────
export const options = {
    scenarios: {
        load: {
            executor: "ramping-vus",
            startVUs: 0,
            stages: [
                { duration: "15s", target: 100 }, // ramp up
                { duration: "30s", target: 100 }, // steady state
                { duration: "10s", target: 0 }, // ramp down
            ],
        },
    },
    thresholds: {
        http_req_failed: ["rate<0.01"],
        http_req_duration: ["p(95)<500"],
    },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const CREDS = {
    username: __ENV.USERNAME || "admin",
    password: __ENV.PASSWORD || "admin",
};

// ─── Setup: login + fetch real entity IDs ───────────────────────────────────
export function setup() {
    const loginRes = http.post(
        `${BASE_URL}/auth/login`,
        JSON.stringify(CREDS),
        { headers: { "Content-Type": "application/json" } }
    );
    check(loginRes, { "login succeeded": (r) => r.status === 200 });

    const token = JSON.parse(loginRes.body).data;
    const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };

    // Fetch real IDs from the seeded database
    const products = JSON.parse(
        http.get(`${BASE_URL}/product`, { headers }).body
    ).data;

    const suppliers = JSON.parse(
        http.get(`${BASE_URL}/supplier`, { headers }).body
    ).data;

    const shops = JSON.parse(
        http.get(`${BASE_URL}/shop`, { headers }).body
    ).data;

    const admins = JSON.parse(
        http.get(`${BASE_URL}/admin`, { headers }).body
    ).data;

    if (!products?.length || !suppliers?.length || !shops?.length || !admins?.length) {
        console.error("Seed data missing — run `npm run seed` first.");
    }

    return {
        token,
        adminId: admins[0].id,
        productIds: products.map((p) => p.id),
        supplierId: suppliers[0].id,
        shopId: shops[0].id,
    };
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Main VU function ───────────────────────────────────────────────────────
export default function (data) {
    const headers = {
        Authorization: `Bearer ${data.token}`,
        "Content-Type": "application/json",
    };

    const roll = Math.random();

    // ── 40% — list all products ───────────────────────────────────────────
    if (roll < 0.4) {
        const res = http.get(`${BASE_URL}/product`, { headers });
        check(res, { "GET /product 200": (r) => r.status === 200 });

        // ── 20% — low-stock check ─────────────────────────────────────────────
    } else if (roll < 0.6) {
        const res = http.get(`${BASE_URL}/product/low-stock`, { headers });
        check(res, { "GET /product/low-stock 200": (r) => r.status === 200 });

        // ── 15% — search products ─────────────────────────────────────────────
    } else if (roll < 0.75) {
        const res = http.get(`${BASE_URL}/product/search?name=laptop`, {
            headers,
        });
        check(res, { "GET /product/search 200": (r) => r.status === 200 });

        // ── 10% — get single product ──────────────────────────────────────────
    } else if (roll < 0.85) {
        const id = pick(data.productIds);
        const res = http.get(`${BASE_URL}/product/${id}`, { headers });
        check(res, { "GET /product/:id 200": (r) => r.status === 200 });

        // ── 10% — create customer order ───────────────────────────────────────
    } else if (roll < 0.95) {
        const productId = pick(data.productIds);
        const order = {
            adminId: data.adminId,
            shopId: data.shopId,
            orderDate: new Date().toISOString(),
            items: [{ productId, quantity: 1, unitPrice: 9.99 }],
        };
        const res = http.post(`${BASE_URL}/customer-order`, JSON.stringify(order), {
            headers,
        });
        check(res, { "POST /customer-order 2xx": (r) => r.status < 300 });

        // ── 5% — create purchase order (restock) ──────────────────────────────
    } else {
        const productId = pick(data.productIds);
        const po = {
            adminId: data.adminId,
            shopId: data.shopId,
            orderDate: new Date().toISOString(),
            arrived: true,
            supplierId: data.supplierId,
            items: [{ productId, quantity: 5, unitPrice: 50.0 }],
        };
        const res = http.post(`${BASE_URL}/purchase-order`, JSON.stringify(po), {
            headers,
        });
        check(res, { "POST /purchase-order 2xx": (r) => r.status < 300 });
    }

    sleep(0.1);
}
