import express, { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { InternalError, setDateToStartOfDay } from "../utils";
import formidable from "formidable";
import { getFileExtension } from "../lib/utils";
import { uploadFile } from "../lib/cloud";
const prisma = new PrismaClient();

const router: Router = express.Router();

router.get("/activeServices", async (req: Request, res: Response) => {
  try {
    const data = await prisma.service.findMany({
      select: {
        id: true,
        status: true,
        startDate: true,
        vehicle_service_vehicleTovehicle: {
          select: {
            vehicles_db: true,
          },
        },
      },
      where: {
        status: "IN_PROGRESS",
      },
    });

    res.json({ data });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        e.name === "INTERNAL"
          ? e.message
          : "Error al consultar los datos de servicios. Por favor intente de nuevo.",
    });
  }
});

router.get("/reminders", async (req: Request, res: Response) => {
  try {
    const data = await prisma.service_reminder.findMany({
      select: {
        id: true,
        date: true,
        vehicle_service_reminder_vehicleTovehicle: {
          select: {
            vehicles_db: true,
          },
        },
      },
      orderBy: { date: "asc" },
      where: {
        date: {
          gte: setDateToStartOfDay(new Date()),
        },
      },
    });

    res.json({ data });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        e.name === "INTERNAL"
          ? e.message
          : "Error al consultar los datos de recordatorios. Por favor intente de nuevo.",
    });
  }
});

router.get("/inventory", async (req: Request, res: Response) => {
  try {
    const data = await prisma.products.findMany({
      where: {
        stock: {
          lte: prisma.products.fields.min,
        },
      },
    });

    res.json({ data });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        e.name === "INTERNAL"
          ? e.message
          : "Error al consultar los datos de recordatorios. Por favor intente de nuevo.",
    });
  }
});

export default router;
