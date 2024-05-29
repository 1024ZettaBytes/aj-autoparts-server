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
            { VIN: { startsWith: searchTerm?.toString() } },
            { plates: { startsWith: searchTerm?.toString() } },
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

router.get("/catalog", async (req: Request, res: Response) => {
  const { year, make } = req.query;
  try {
    let data;
    if (make)
      data = await prisma.vehicles_db.findMany({
        where: { year: Number(year), make: make.toString() },
      });
    else {
      if (year) {
        data = await prisma.vehicles_db.groupBy({
          by: ["make"],
          where: { year: Number(year) },
        });
        data = data.map((make) => make.make);
      } else {
        data = await prisma.vehicles_db.groupBy({
          by: ["year"],
        });
        data = data.map((year) => year.year + "");
      }
    }
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
