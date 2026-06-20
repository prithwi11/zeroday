import express from "express";
import { database_router } from "./domain/database/routes/database_routes";
import { user_router } from "./domain/user/routes/user_routes";
import { snapshot_router } from "./domain/snapshot/routes/snapshot_routes";
import { dashboard_router } from "./domain/dashboard/routes/dashboard_routes";
import { recommendation_router } from "./domain/recommendation/routes/recommendation_routes";
const app = express();
app.disable('x-powered-by')

app.use('/user', user_router);
app.use('/database', database_router);
app.use('/snapshot', snapshot_router);
app.use('/dashboard', dashboard_router);
app.use('/recommendation', recommendation_router);

export const app_route = app;