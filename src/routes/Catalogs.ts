import express, { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { InternalError } from "../utils";
const prisma = new PrismaClient();
const router: Router = express.Router();

router.get("/vehicles", async (req: Request, res: Response) => {
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
