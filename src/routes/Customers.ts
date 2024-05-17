import express, { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const router: Router = express.Router();
router.get("/types", async (req: Request, res: Response) => {
  try {
    res.send(await prisma.customer_type.findMany());
  } catch (e: any) {
    res.status(500).send(e.toString());
  }
});

export default router;
