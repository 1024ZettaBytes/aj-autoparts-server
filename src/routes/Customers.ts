import express, { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { InternalError } from "../utils";
const prisma = new PrismaClient();
const router: Router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  const { nondetail } = req.query;
  try {
    const data = nondetail
      ? await prisma.customer.findMany({
          select: {
            id: true,
            name: true,
            customer_type: { select: { description: true } },
          },
        })
      : await prisma.customer.findMany();
    res.json({ data });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        e.name === "INTERNAL"
          ? e.message
          : "Error al consultar los datos. Por favor intente de nuevo.",
    });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const newCustomer = await prisma.customer.create({
      data: { ...data, createdAt: new Date() },
    });
    res
      .status(200)
      .json({ data: newCustomer, msg: "¡Cliente creado con éxito!" });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Ocurrió un error al crear el cliente. Por favor intente de nuevo.",
    });
  }
});

router.get("/types", async (req: Request, res: Response) => {
  try {
    res.json({ data: await prisma.customer_type.findMany() });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      errorMsg: "Error al consultar los datos. Por favor intente de nuevo.",
    });
  }
});

export default router;
