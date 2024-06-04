import express, { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { InternalError } from "../utils";
const prisma = new PrismaClient();
const router: Router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  const { searchTerm } = req.query;
  try {
    let idFilter = 0;
    if (searchTerm) {
      try {
        idFilter = parseInt(searchTerm?.toString());
      } catch (e) {}
    }
    const filter = searchTerm
      ? {
          OR: [
            { id: idFilter || 0 },
            {
              vehicle_service_vehicleTovehicle: {
                vehicles_db: { model: searchTerm?.toString() },
              },
            },
            {
              vehicle_service_vehicleTovehicle: {
                customer_vehicle_customerTocustomer: {
                  name: { startsWith: searchTerm?.toString() },
                },
              },
            },
          ],
        }
      : {};

    const data = await prisma.service.findMany({
      select: {
        id: true,
        status: true,
        billed: true,
        startDate: true,
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
  let workTotal = 0;
  let snacksTotal = 0;
  try {
    const data = await prisma.service.findUnique({
      select: {
        id: true,
        status: true,
        billed: true,
        work_work_serviceToservice: true,
        used_product_used_product_serviceToservice: true,
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
      where: {
        id: Number(id),
      },
    });
    if (!data) throw InternalError("El servicio indicado no existe");
    data.work_work_serviceToservice.forEach(work=>{
      workTotal = workTotal + Number(work.total);
    })
    data.used_product_used_product_serviceToservice.forEach(product=>{
      snacksTotal = snacksTotal + Number(product.total);
    })
    res.json({ data:{...data, workTotal, snacksTotal }});
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
    const serviceInProgress = await prisma.service.findFirst({
      select: {
        vehicle: true,
        status: true,
      },
      where: {
        vehicle: data?.vehicle,
        status: { not: "IN_PROGRESS" },
      },
    });
    if (serviceInProgress)
      throw InternalError(
        "El vehículo indicado ya cuenta con un servicio activo"
      );
    const newService = await prisma.service.create({
      data: { ...data, createdAt: new Date() },
    });
    res
      .status(200)
      .json({ data: newService, msg: "Servicio creado con éxito!" });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Ocurrió un error al crear el servicio. Por favor intente de nuevo.",
    });
  }
});

export default router;
