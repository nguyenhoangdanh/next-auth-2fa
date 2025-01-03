import 'dotenv/config';
import express, { Response, Request, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { config } from './config/app.config';
import { errorHandler } from './middlewares/errorHandler';
import { HTTPSTATUS } from './config/http.config';
import { asyncHandler } from './middlewares/asyncHandler';
import { authRoutes } from './modules/auth/auth.routes';
import connectDatabase from './database/database';
import passport from './middlewares/passport';

const app = express();
const BASE_PATH = config.BASE_PATH;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    cors({
        origin: config.APP_ORIGIN,
        credentials: true,
    })
)

app.use(cookieParser());
app.use(passport.initialize());

app.get(`/`, 
    asyncHandler(async(req: Request, res: Response, next: NextFunction) => {
        res.status(HTTPSTATUS.OK).json({
            message: 'Welcome to the API',
        });
    })
)

app.use(`${BASE_PATH}/auth`, authRoutes);

app.use(errorHandler);


app.listen(config.PORT, async() => {
    console.log(`Server is running on port ${config.PORT} in ${config.NODE_ENV} mode`);
    await connectDatabase();
});