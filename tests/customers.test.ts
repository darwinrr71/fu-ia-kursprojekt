import request from "supertest";
import { createApp } from "../src/app";
import { db } from "../src/db";
import { closeDb, resetDb } from "./helpers/db";

const app = createApp();

beforeEach(resetDb);
afterAll(closeDb);

describe("POST /customers", () => {
  it("skapar en kund och returnerar 201", async () => {
    const res = await request(app)
      .post("/customers")
      .send({ name: "Ida Ström", email: "ida.strom@example.com" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: "Ida Ström", email: "ida.strom@example.com" });
    expect(res.body.uuid).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("returnerar 400 när name saknas", async () => {
    const res = await request(app).post("/customers").send({ email: "x@example.com" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_input");
  });

  it("returnerar 400 när email saknas", async () => {
    const res = await request(app).post("/customers").send({ name: "Ida Ström" });
    expect(res.status).toBe(400);
  });
});

describe("GET /customers/me", () => {
  it("returnerar den inloggade kunden", async () => {
    const res = await request(app).get("/customers/me").set("X-Customer-Id", "1");
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Alva Lind");
  });

  it("returnerar 401 utan inloggning", async () => {
    const res = await request(app).get("/customers/me");
    expect(res.status).toBe(401);
  });

  it("returnerar 404 för en kund som inte finns", async () => {
    const res = await request(app).get("/customers/me").set("X-Customer-Id", "999");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("not_found");
  });
});

describe("GET /customers/me/orders", () => {
  it("listar bara den inloggade kundens beställningar, nyast först", async () => {
    const res = await request(app).get("/customers/me/orders").set("X-Customer-Id", "2");
    expect(res.status).toBe(200);
    expect(res.body.map((o: { id: number }) => o.id)).toEqual([1047, 1041]);
  });

  it("kräver giltig autentisering även med page och status", async () => {
    const withoutHeader = await request(app).get("/customers/me/orders?page=1&status=paid");
    const invalidHeader = await request(app)
      .get("/customers/me/orders?page=1&status=paid")
      .set("X-Customer-Id", "ogiltig");

    expect(withoutHeader.status).toBe(401);
    expect(invalidHeader.status).toBe(401);
  });

  it("returnerar tio order per sida och hela stabilt sorterade listan utan page", async () => {
    const inserted = await db.query<{ id: number }>(
      `INSERT INTO orders (customer_id, status, created_at)
       SELECT $1, $2, $3::timestamptz
         FROM generate_series(1, 12)
      RETURNING id`,
      [2, "new", "2026-11-01T10:00:00+01:00"],
    );
    const insertedIds = inserted.rows.map(({ id }) => id).sort((a, b) => b - a);

    const withoutPage = await request(app).get("/customers/me/orders").set("X-Customer-Id", "2");
    const firstPage = await request(app)
      .get("/customers/me/orders?page=1")
      .set("X-Customer-Id", "2");
    const secondPage = await request(app)
      .get("/customers/me/orders?page=2")
      .set("X-Customer-Id", "2");

    expect(withoutPage.status).toBe(200);
    expect(Array.isArray(withoutPage.body)).toBe(true);
    expect(withoutPage.body.map((order: { id: number }) => order.id)).toEqual([
      ...insertedIds,
      1047,
      1041,
    ]);
    expect(
      withoutPage.body.every(
        (order: object) =>
          JSON.stringify(Object.keys(order).sort()) ===
          JSON.stringify(["createdAt", "id", "status"]),
      ),
    ).toBe(true);
    expect(firstPage.body.map((order: { id: number }) => order.id)).toEqual(
      insertedIds.slice(0, 10),
    );
    expect(secondPage.body.map((order: { id: number }) => order.id)).toEqual([
      ...insertedIds.slice(10),
      1047,
      1041,
    ]);
  });

  it("returnerar en tom lista på sida två när kunden har färre än tio beställningar", async () => {
    const res = await request(app).get("/customers/me/orders?page=2").set("X-Customer-Id", "2");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returnerar 400 när page är 0", async () => {
    const res = await request(app).get("/customers/me/orders?page=0").set("X-Customer-Id", "2");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: "invalid_input",
        message: expect.stringMatching(/\S/),
      },
    });
  });

  it("returnerar 400 när page har en inledande nolla", async () => {
    const res = await request(app).get("/customers/me/orders?page=01").set("X-Customer-Id", "2");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: "invalid_input",
        message: expect.stringMatching(/\S/),
      },
    });
  });

  it("returnerar 400 när pageparametern är upprepad", async () => {
    const res = await request(app)
      .get("/customers/me/orders?page=1&page=2")
      .set("X-Customer-Id", "2");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: "invalid_input",
        message: expect.stringMatching(/\S/),
      },
    });
  });

  it.each([
    ["tomt värde", ""],
    ["negativt tal", "-1"],
    ["decimaltal", "1.0"],
    ["exponentialform", "1e0"],
    ["text", "abc"],
    ["tal utanför säkert heltalsintervall", "9007199254740992"],
    ["tal vars beräknade offset inte är ett säkert heltal", "900719925474101"],
  ])("returnerar 400 när page är %s", async (_description, page) => {
    const res = await request(app)
      .get(`/customers/me/orders?page=${page}`)
      .set("X-Customer-Id", "2");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: "invalid_input",
        message: expect.stringMatching(/\S/),
      },
    });
  });

  it("filtrerar på status och listar bara den inloggade kundens beställningar", async () => {
    const res = await request(app)
      .get("/customers/me/orders?status=paid")
      .set("X-Customer-Id", "1");
    expect(res.status).toBe(200);
    expect(res.body.map((o: { id: number }) => o.id)).toEqual([1042]);
    expect(res.body.every((o: { status: string }) => o.status === "paid")).toBe(true);
  });

  it.each([
    ["okänd status", "saknas"],
    ["skiftlägesvariant", "PAID"],
  ])("returnerar en tom lista för %s", async (_description, status) => {
    const res = await request(app)
      .get(`/customers/me/orders?status=${status}`)
      .set("X-Customer-Id", "1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("filtrerar på status före sidindelning och behåller kundisoleringen", async () => {
    const inserted = await db.query<{ id: number; status: string }>(
      `INSERT INTO orders (customer_id, status, created_at)
       SELECT $1,
              CASE WHEN series % 2 = 1 THEN $2 ELSE $3 END,
              $4::timestamptz
         FROM generate_series(1, 30) AS series
      RETURNING id, status`,
      [2, "paid", "new", "2026-11-02T10:00:00+01:00"],
    );
    await db.query(
      `INSERT INTO orders (customer_id, status, created_at)
       VALUES ($1, $2, $3::timestamptz)`,
      [1, "paid", "2026-11-03T10:00:00+01:00"],
    );
    const paidIds = inserted.rows
      .filter(({ status }) => status === "paid")
      .map(({ id }) => id)
      .sort((a, b) => b - a);

    const allPaid = await request(app)
      .get("/customers/me/orders?status=paid")
      .set("X-Customer-Id", "2");
    const secondPaidPage = await request(app)
      .get("/customers/me/orders?status=paid&page=2")
      .set("X-Customer-Id", "2");

    expect(allPaid.status).toBe(200);
    expect(allPaid.body.map((order: { id: number }) => order.id)).toEqual(paidIds);
    expect(secondPaidPage.status).toBe(200);
    expect(secondPaidPage.body.map((order: { id: number }) => order.id)).toEqual(paidIds.slice(10));
    expect(secondPaidPage.body.every((order: { status: string }) => order.status === "paid")).toBe(
      true,
    );
  });

  it("returnerar 400 när statusparametern är tom", async () => {
    const res = await request(app).get("/customers/me/orders?status=").set("X-Customer-Id", "1");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: "invalid_input",
        message: expect.stringMatching(/\S/),
      },
    });
  });

  it("returnerar 400 när statusparametern är upprepad", async () => {
    const res = await request(app)
      .get("/customers/me/orders?status=paid&status=shipped")
      .set("X-Customer-Id", "1");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: "invalid_input",
        message: expect.stringMatching(/\S/),
      },
    });
  });
});
