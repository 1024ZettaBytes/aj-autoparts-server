import express, { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { InternalError } from "../utils";
const prisma = new PrismaClient();
const router: Router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  const { forService, searchTerm } = req.query;
  try {
    const filter = searchTerm
      ? {
          OR: [
            { VIN: { contains: searchTerm?.toString() } },
            { plates: { contains: searchTerm?.toString() } },
            {
              customer_vehicle_customerTocustomer: {
                name: {
                  contains: searchTerm?.toString(),
                },
              },
            },
          ],
        }
      : {};
    const data = forService
      ? await prisma.vehicle.findMany({
          select: {
            VIN: true,
            plates: true,
            mileage: true,
            customer_vehicle_customerTocustomer: { select: { name: true } },
            vehicles_db: { select: { model: true, make: true, year: true } },
          },
          where: {
            ...filter,

            VIN: {
              notIn: (
                await prisma.service.findMany({
                  select: {
                    vehicle: true,
                    status: true,
                  },
                  where: {
                    status: "IN_PROGRESS",
                  },
                })
              ).map((serv) => serv.vehicle),
            },
          },
        })
      : await prisma.vehicle.findMany({
          select: {
            VIN: true,
            plates: true,
            mileage: true,
            customer_vehicle_customerTocustomer: { select: { name: true } },
            vehicles_db: { select: { model: true, make: true, year: true } },
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
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const data = await prisma.vehicle.findUnique({
      select: {
        VIN: true,
        cilinders: true,
        engine: true,
        plates: true,
        color: true,
        customer_vehicle_customerTocustomer: {
          select: { id: true, name: true },
        },
        vehicles_db: true,
        service_service_vehicleTovehicle: true,
        service_reminder_service_reminder_vehicleTovehicle: {
          select: { id: true, date: true },
          orderBy: { date: "desc" },
        },
      },
      where: { VIN: id?.toString() },
    });
    res.json({ data });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        e.name === "INTERNAL"
          ? e.message
          : "Error al consultar los datos del vehiculo. Por favor intente de nuevo.",
    });
  }
});
router.post("/", async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const newVehicle = await prisma.vehicle.create({
      data: { ...data, createdAt: new Date() },
    });
    res
      .status(200)
      .json({ data: newVehicle, msg: "Vehículo creado con éxito!" });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Ocurrió un error al guardar el vehículo. Por favor intente de nuevo.",
    });
  }
});

router.put("/", async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const VIN = data.VIN;
    delete data.id;
    const vehicle = await prisma.vehicle.update({
      where: { VIN },
      data,
    });
    res
      .status(200)
      .json({ data: vehicle, msg: "¡Vehículo actualizado con éxito!" });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Ocurrió un error al actualizar el vehículo. Por favor intente de nuevo.",
    });
  }
});

export default router;
