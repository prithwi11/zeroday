import express from "express";
import { database_router } from "./domain/database/routes/database_routes";
import { user_router } from "./domain/user/routes/user_routes";
const app = express();
app.disable('x-powered-by')

// import { user_routing } from "./domain/auth/routes/auth_route";
// import { admin_routing } from "./domain/admin/routes/admin_route";

// app.use('/user', auth_routing);
// app.use('/database', admin_routing);

app.use('/user', user_router)
app.use('/database', database_router)
export const app_route = app;