import express from "express";
import customers from "./routes/Customers";
import vehicles from "./routes/Vehicles";
import services from "./routes/Services";
import works from "./routes/Works";
import inventory from "./routes/Inventory";
import suppliers from "./routes/Suppliers";
import catalogs from "./routes/Catalogs";
import serviceReminders from "./routes/ServiceReminders";
import summary from "./routes/Summary";
const app = express();
//import cors, { CorsRequest } from "cors";
const port = process.env.PORT || 9000;

//app.use(cors<CorsRequest>());
app.use(express.json());
app.use(express.raw({ type: "application/vnd.custom-type" }));
app.use(express.text({ type: "text/html" }));

app.use("/api/customers", customers);
app.use("/api/vehicles", vehicles);
app.use("/api/services", services);
app.use("/api/works", works);
app.use("/api/inventory", inventory);
app.use("/api/suppliers", suppliers);
app.use("/api/catalogs", catalogs);
app.use("/api/service-reminders", serviceReminders);
app.use("/api/summary", summary);
app.listen(Number(port), "0.0.0.0", () => {
  console.log(`Server listening at http://localhost:${port}`);
});
