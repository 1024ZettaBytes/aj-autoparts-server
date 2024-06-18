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
router.get("/entries", async (req: Request, res: Response) => {
  try {
    const { searchTerm } = req.query;

    const filter = searchTerm
      ? {
          OR: [
            { products: { code: { contains: searchTerm?.toString() } } },
            { products: { name: { contains: searchTerm?.toString() } } },
            {
              supplier_product_entry_supplierTosupplier: {
                name: { contains: searchTerm?.toString() },
              },
            },
          ],
        }
      : {};
    const data = await prisma.product_entry.findMany({
      select: {
        id: true,
        qty: true,
        cost: true,
        date: true,
        products: { select: { code: true, name: true } },
        supplier_product_entry_supplierTosupplier: { select: { name: true } },
      },
      where: { ...filter },
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

router.post("/entries", async (req: Request, res: Response) => {
  try {
    let newEntry;
    const data = req.body;
    let product = await prisma.products.findUnique({
      where: { code: data.product },
    });
    if (!product) throw InternalError("El producto indicado no existe");

    await prisma.$transaction(async (tx) => {
      newEntry = await tx.product_entry.create({
        data: { ...data, qty: parseInt(data.qty) },
      });

      let stock = product?.stock || 0;
      stock += newEntry.qty;
      await tx.products.update({
        where: { code: product?.code },
        data: { stock },
      });
    });

    res
      .status(200)
      .json({ data: newEntry, msg: "Entrada registrada con éxito!" });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        e.name === "INTERNAL"
          ? e.message
          : "Ocurrió un error al registrar la entrada. Por favor intente de nuevo.",
    });
  }
});

router.get("/issues", async (req: Request, res: Response) => {
  try {
    const { searchTerm } = req.query;

    const filter = searchTerm
      ? {
          OR: [
            { product: { contains: searchTerm?.toString() } },
            {
              products: { name: { contains: searchTerm?.toString() } },
            },
          ],
        }
      : {};
    const data = await prisma.used_product.findMany({
      include: {
        products: {
          select: { name: true },
        },
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
