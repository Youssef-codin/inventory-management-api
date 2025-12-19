import express from "express";
import helmet from "helmet";
import errorHandler, { ERROR_CODE } from "./middleware/errorHandler";
import log from "./middleware/logger";
import authRouter from "./modules/auth/auth.router"
import productRouter from "./modules/product/product.router";
import adminRouter from "./modules/admin/admin.router";
import customerOrderRouter from "./modules/customerorder/customerorder.router";
import purchaseOrderRouter from "./modules/purchaseorder/purchaseorder.router";
import supplierRouter from "./modules/supplier/supplier.router";
import { fail, respond } from "./util/apiresponse";
import { authenticate } from "./middleware/authenticate";

const app = express();

app.use(helmet());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(log);
app.use("/auth", authRouter);

app.use(authenticate);
app.use("/product", productRouter);
app.use("/admin", adminRouter);
app.use("/customer-order", customerOrderRouter);
app.use("/purchase-order", purchaseOrderRouter);
app.use("/supplier", supplierRouter);

//-- catch all 404
app.use((req, res) => {
    return respond(res, 404, fail("Route not found", ERROR_CODE.NOT_FOUND));
});
//-- error handler -- 
app.use(errorHandler);

export default app;
