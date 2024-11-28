// src/middlewares/auth.middleware.js

import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma/index.js";

export default async function (req, res, next) {
    try {
        const accessToken = req.get('authorization');
        if (!accessToken) throw new Error("NotExist");

        const [tokenType, token] = accessToken.split(" ");

        if (tokenType !== "Bearer") throw new Error("TypeDifferenceError");

        const decodedToken = jwt.verify(
            token,
            process.env["ACCESS_TOKEN_SECRET_KEY"],
        );
        const userId = decodedToken.userId;

        const user = await prisma.users.findFirst({
            where: { id: userId },
        });

        if (!user) {
            throw new Error("UserError");
        }

        // req.user에 사용자 정보를 저장합니다.
        req.user = user;

        next();
    } catch (error) {
        // 토큰이 만료되었거나, 조작되었을 때, 에러 메시지를 다르게 출력합니다.
        switch (error.message) {
            case "NotExist":
                return res
                    .status(401)
                    .json({ message: "토큰이 존재하지 않습니다." });
            case "TypeDifferenceError":
                return res
                    .status(401)
                    .json({ message: "토큰 타입이 일치하지 않습니다." });
            case "UserError":
                return res
                    .status(401)
                    .json({ message: "토큰 사용자가 존재하지 않습니다." });
            default:
            
        }

        switch (error.name) {
            case "TokenExpiredError":
                return res
                    .status(401)
                    .json({ message: "토큰이 만료되었습니다." });
            case "JsonWebTokenError":
                return res
                    .status(401)
                    .json({ message: "토큰이 조작되었습니다." });
            default:
                return res.status(401).json({
                    message: error.message ?? "비정상적인 요청입니다.",
                });
        }
    }
}
