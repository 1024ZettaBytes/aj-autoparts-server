import express from "express";
import customers from "./routes/Customers";
import vehicles from "./routes/Vehicles";
import services from "./routes/Services";

const app = express();
const port = process.env.PORT || 9000;

app.use(express.json());
app.use(express.raw({ type: "application/vnd.custom-type" }));
app.use(express.text({ type: "text/html" }));

app.use("/api/customers", customers);
app.use("/api/vehicles", vehicles);
app.use("/api/services", services);
app.listen(Number(port), "0.0.0.0", () => {
  console.log(`Server listening at http://localhost:${port}`);
});
