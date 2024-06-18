import express, { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { InternalError } from "../utils";
import formidable from "formidable";
import { getFileExtension } from "../lib/utils";
import { uploadFile } from "../lib/cloud";
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
        used_product_used_product_serviceToservice: {
          include: {
            products: {
              select: { name: true },
            },
          },
        },
        vehicle_service_vehicleTovehicle: {
          select: {
            VIN: true,
            vehicles_db: true,
            customer_vehicle_customerTocustomer: {
              select: {
                name: true,
              },
            },
          },
        },
        service_attachment_service_attachment_serviceToservice: true,
      },
      where: {
        id: Number(id),
      },
    });
    if (!data) throw InternalError("El servicio indicado no existe");
    data.work_work_serviceToservice.forEach((work) => {
      workTotal = workTotal + Number(work.total);
    });
    data.used_product_used_product_serviceToservice.forEach((product) => {
      snacksTotal = snacksTotal + Number(product.total);
    });
    res.json({ data: { ...data, workTotal, snacksTotal, images: [] } });
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

router.post("/service/usedProduct", async (req: Request, res: Response) => {
  try {
    let { service, product, qty, unitPrice, discountPercentage } = req.body;
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
    let existingProduct = await prisma.products.findUnique({
      where: { code: product },
    });
    if (!existingProduct) throw InternalError("El producto indicado no existe");
    if (qty > existingProduct.stock)
      throw InternalError("No hay suficiente inventario");
    const total = (unitPrice - unitPrice * (discountPercentage * 0.01)) * qty;
    let newUsedProduct;
    await prisma.$transaction(async (tx) => {
      newUsedProduct = await tx.used_product.create({
        data: { ...req.body, total, date: new Date() },
      });
      // reduce product stock
      let stock = existingProduct?.stock ?? 0;
      stock -= newUsedProduct.qty;
      await tx.products.update({
        where: { code: existingProduct?.code },
        data: { stock },
      });
    });
    res
      .status(200)
      .json({ data: newUsedProduct, msg: "¡Refacción agregada con éxito!" });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Ocurrió un error al agregar la refacción. Por favor intente de nuevo.",
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

router.post("/attachment/:serviceId", async (req: Request, res: Response) => {
  try {
    let { serviceId } = req.params;
    const form = formidable({ multiples: false });
    const { files } = (await new Promise(function (resolve, reject) {
      form.parse(req, function (err: any, fields: any, files: any) {
        if (err) {
          console.error(err);
          reject(
            InternalError(
              "Ocurrió un error interno, por favor contacte al administrador."
            )
          );
          return;
        }
        resolve({ files });
      });
    })) as { files: any };
    const fileData = files.file[0];

    const existingService = await prisma.service.findUnique({
      where: { id: parseInt(serviceId) },
    });
    if (!existingService)
      throw InternalError("El servicio indicado no existe.");
    const fileName = `attachment_${serviceId}_${new Date().getTime()}.${getFileExtension(
      fileData.originalFilename
    )}`;
    const url = await uploadFile(fileData.filepath, fileName);
    await prisma.service_attachment.create({
      data: {
        service: parseInt(serviceId),
        type: fileData.mimetype,
        url,
        date: new Date(),
      },
    });
    res.status(200).json({ msg: "¡Archivo guardado con éxito!" });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Ocurrió un error al crear el servicio. Por favor intente de nuevo.",
    });
  }
});

router.put("/", async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const id = parseInt(data.id);
    const { status, comments } = data;
    delete data.id;
    const service = await prisma.service.update({
      where: { id },
      data: { status, comments },
    });
    res
      .status(200)
      .json({ data: service, msg: "¡Servicio actualizado con éxito!" });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      errorMsg:
        "Ocurrió un error al actualizar el servicio. Por favor intente de nuevo.",
    });
  }
});

export default router;
