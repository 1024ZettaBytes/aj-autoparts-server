import express, { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { InternalError } from "../utils";
const prisma = new PrismaClient();
const router: Router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  const { nondetail, searchTerm } = req.query;
  const searchFilter =
    searchTerm && searchTerm !== ""
      ? { name: { contains: searchTerm?.toString() } }
      : {};
  try {
    const data = nondetail
      ? await prisma.supplier.findMany({
          select: {
            id: true,
            name: true,
          },
        })
      : await prisma.supplier.findMany({
          where: searchFilter,
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

router.post("/", async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const newSupplier = await prisma.supplier.create({
      data: { ...data, createdAt: new Date() },
    });
    res
      .status(200)
      .json({ data: newSupplier, msg: "¡Proveedor creado con éxito!" });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Ocurrió un error al crear el proveedor. Por favor intente de nuevo.",
    });
  }
});
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const data = await prisma.supplier.findUnique({
      where: { id: parseInt(id) },
    });
    res.json({ data });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        e.name === "INTERNAL"
          ? e.message
          : "Error al consultar los datos del proveedor. Por favor intente de nuevo.",
    });
  }
});
router.put("/", async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const id = parseInt(data.id);
    delete data.id;
    const newSupplier = await prisma.supplier.update({
      where: { id },
      data,
    });
    res
      .status(200)
      .json({ data: newSupplier, msg: "¡Proveedor actualizado con éxito!" });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Ocurrió un error al actualizar el proveedor. Por favor intente de nuevo.",
    });
  }
});
export default router;
