import express from "express";
import customers from "./routes/Customers";

const app = express();
const port = process.env.PORT || 9000;

app.use(express.json());
app.use(express.raw({ type: "application/vnd.custom-type" }));
app.use(express.text({ type: "text/html" }));

app.use("/customers", customers);

app.listen(Number(port), "0.0.0.0", () => {
  console.log(`Server listening at http://localhost:${port}`);
});
