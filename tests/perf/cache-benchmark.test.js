import http from "k6/http";
import { check, sleep } from "k6";

// ─── Options ────────────────────────────────────────────────────────────────
export const options = {
    scenarios: {
        load: {
            executor: "ramping-vus",
            startVUs: 0,
            stages: [
                { duration: "15s", target: 100 },
                { duration: "30s", target: 100 },
                { duration: "10s", target: 0 },
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

    // Get some orders for testing
    const customerOrders = JSON.parse(
        http.get(`${BASE_URL}/customer-order`, { headers }).body
    ).data;

    const purchaseOrders = JSON.parse(
        http.get(`${BASE_URL}/purchase-order`, { headers }).body
    ).data;

    if (!products?.length || !suppliers?.length || !shops?.length) {
        console.error("Seed data missing — run `npm run seed` first.");
    }

    return {
        token,
        productIds: products.map((p) => p.id),
        supplierIds: suppliers.map((s) => s.id),
        shopIds: shops.map((s) => s.id),
        customerOrderIds: customerOrders?.map((o) => o.id) || [],
        purchaseOrderIds: purchaseOrders?.map((o) => o.id) || [],
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

    // ── 20% — get single product (cached) ─────────────────────────────────
    if (roll < 0.20) {
        const id = pick(data.productIds);
        const res = http.get(`${BASE_URL}/product/${id}`, { headers });
        check(res, { "GET /product/:id 200": (r) => r.status === 200 });

        // ── 20% — get single shop (cached) ────────────────────────────────────
    } else if (roll < 0.40) {
        const id = pick(data.shopIds);
        const res = http.get(`${BASE_URL}/shop/${id}`, { headers });
        check(res, { "GET /shop/:id 200": (r) => r.status === 200 });

        // ── 20% — get single supplier (cached) ────────────────────────────────
    } else if (roll < 0.60) {
        const id = pick(data.supplierIds);
        const res = http.get(`${BASE_URL}/supplier/${id}`, { headers });
        check(res, { "GET /supplier/:id 200": (r) => r.status === 200 });

        // ── 20% — get single customer order (cached) ──────────────────────────
    } else if (roll < 0.80) {
        if (data.customerOrderIds.length > 0) {
            const id = pick(data.customerOrderIds);
            const res = http.get(`${BASE_URL}/customer-order/${id}`, { headers });
            check(res, { "GET /customer-order/:id 200": (r) => r.status === 200 });
        }

        // ── 20% — get single purchase order (cached) ──────────────────────────
    } else {
        if (data.purchaseOrderIds.length > 0) {
            const id = pick(data.purchaseOrderIds);
            const res = http.get(`${BASE_URL}/purchase-order/${id}`, { headers });
            check(res, { "GET /purchase-order/:id 200": (r) => r.status === 200 });
        }
    }

    sleep(0.1);
}
