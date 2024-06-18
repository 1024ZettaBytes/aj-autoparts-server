import express, { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { InternalError } from "../utils";
const prisma = new PrismaClient();
const router: Router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const vehicle = await prisma.vehicle.findUnique({
      select: {
        VIN: true,
      },
      where: {
        VIN: data?.vehicle,
      },
    });
    if (!vehicle) throw InternalError("El vehículo indicado no existe");
    const newReminder = await prisma.service_reminder.create({
      data: { ...data },
    });
    res
      .status(200)
      .json({ data: newReminder, msg: "¡Recordatorio guardado con éxito!" });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Ocurrió un error al guardar el recordatorio. Por favor intente de nuevo.",
    });
  }
});

export default router;
