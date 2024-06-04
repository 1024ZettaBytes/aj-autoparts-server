import express, { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { InternalError } from "../utils";
const prisma = new PrismaClient();
const router: Router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const existing = await prisma.products.findUnique({
      where: { code: data?.code },
    });
    if (existing)
      throw InternalError("El código indicado ya se encuentra registrado");
    const newProduct = await prisma.products.create({
      data: { ...data, createdAt: new Date() },
    });
    res
      .status(200)
      .json({ data: newProduct, msg: "Producto creado con éxito!" });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        e.name === "INTERNAL"
          ? e.message
          : "Ocurrió un error al crear el producto. Por favor intente de nuevo.",
    });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const { searchTerm } = req.query;

    const filter = searchTerm
      ? {
          OR: [
            { code: { startsWith: searchTerm?.toString() } },
            {
              name: { contains: searchTerm?.toString() },
            },
          ],
        }
      : {};
    const data = await prisma.products.findMany({
      select: {
        code: true,
        name: true,
        stock: true,
        min: true,
      },
      where: {
        ...filter,
      },
    });

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
export default router;
