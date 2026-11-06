import { Router } from "express";
import { AuthedRequest, requireCustomer } from "../auth";
import { sendError, sendResult } from "../http";
import {
  createCustomer,
  getCustomer,
  listOrdersForCustomer,
  ordersPerPage,
} from "../services/customerService";

export const customers = Router();

function parsePageParam(value: unknown): number | undefined | null {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const page = Number(value);
  const offset = (page - 1) * ordersPerPage;
  if (!Number.isSafeInteger(page) || !Number.isSafeInteger(offset)) {
    return null;
  }
  return page;
}

// Registrera en ny kund.
customers.post("/customers", async (req, res) => {
  const result = await createCustomer(req.body ?? {});
  sendResult(res, result, 201);
});

// Den inloggade kunden.
customers.get("/customers/me", requireCustomer, async (req, res) => {
  const result = await getCustomer((req as AuthedRequest).customerId);
  sendResult(res, result);
});

// Den inloggade kundens beställningar.
customers.get("/customers/me/orders", requireCustomer, async (req, res) => {
  const statusParam = req.query.status;
  if (statusParam === "" || (statusParam !== undefined && typeof statusParam !== "string")) {
    sendError(res, {
      code: "invalid_input",
      message: "status måste anges exakt en gång och får inte vara tom.",
    });
    return;
  }

  const status = typeof statusParam === "string" ? statusParam : undefined;
  const page = parsePageParam(req.query.page);
  if (page === null) {
    sendError(res, {
      code: "invalid_input",
      message:
        "page måste anges exakt en gång som ett positivt säkert heltal utan inledande nollor och ge en säker offset.",
    });
    return;
  }

  const orders = await listOrdersForCustomer((req as AuthedRequest).customerId, { page, status });
  res.json(orders);
});
