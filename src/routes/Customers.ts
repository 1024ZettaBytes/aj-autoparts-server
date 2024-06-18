import express, { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { InternalError } from "../utils";
const prisma = new PrismaClient();
const router: Router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  const { nondetail, searchTerm } = req.query;
  try {
    const filter = searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm?.toString() } },
            { phone: { contains: searchTerm?.toString() } },
            { email: { contains: searchTerm?.toString() } },
          ],
        }
      : {};
    const data = nondetail
      ? await prisma.customer.findMany({
          select: {
            id: true,
            name: true,
            customer_type: { select: { description: true } },
          },
        })
      : await prisma.customer.findMany({
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
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const customer = await prisma.customer.findUnique({
      include: { customer_type: true },
      where: { id: parseInt(id) },
    });

    const vehicles = await prisma.vehicle.findMany({
      include: {
        customer_vehicle_customerTocustomer: { select: { name: true } },

        vehicles_db: { select: { model: true, make: true, year: true } },
      },
      where: { customer: parseInt(id) },
    });
    const services = await prisma.service.findMany({
      include: {
        vehicle_service_vehicleTovehicle: {
          select: {
            vehicles_db: true,
            customer_vehicle_customerTocustomer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      where: { vehicle: { in: vehicles.map((v) => v.VIN) } },
      orderBy: { startDate: "desc" },
    });
    res.json({ data: { ...customer, vehicles, services } });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        e.name === "INTERNAL"
          ? e.message
          : "Error al consultar los datos del cliente. Por favor intente de nuevo.",
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
router.put("/", async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const id = parseInt(data.id);
    delete data.id;
    const customer = await prisma.customer.update({
      where: { id },
      data,
    });
    res
      .status(200)
      .json({ data: customer, msg: "¡Cliente actualizado con éxito!" });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Ocurrió un error al actualizar el cliente. Por favor intente de nuevo.",
    });
  }
});
router.get("/types/get", async (req: Request, res: Response) => {
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
