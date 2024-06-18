import express, { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { InternalError } from "../utils";
const prisma = new PrismaClient();
const router: Router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    let { service, basePrice, discountPercentage } = req.body;
    const serviceInProgress = await prisma.service.findFirst({
      select: {
        id: true,
        status: true,
      },
      where: {
        id: service,
        status: "IN_PROGRESS",
      },
    });
    if (!serviceInProgress)
      throw InternalError("El servicio indicado no se encuentra en progreso");
    const total = basePrice - basePrice * (discountPercentage * 0.01);
    const newWork = await prisma.work.create({
      data: { ...req.body, total, date: new Date() },
    });

    res.status(200).json({ data: newWork, msg: "Trabajo agregado con éxito!" });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Ocurrió un error al agregar el trabajo. Por favor intente de nuevo.",
    });
  }
});

export default router;
