import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import Joi from "joi";

const router = express.Router();

const DEFAULT_HP = 500;
const DEFAULT_POWER = 100;
const DEFAULT_MONEY = 10000;

//캐릭터 생성 api

const nameSchema = Joi.string().min(2).max(12).required();

router.post("/characters", authMiddleware, async (req, res, next) => {
    // JWT 인증하기
    const { name } = req.body;

    if (!name)
        return res.status(400).json({ message: "캐릭터명을 입력해주세요." });

    try {
        // 캐릭터명 유효성 검사
        const nameValidation = await nameSchema.validateAsync(name);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res
                .status(400)
                .json({ errorMessage: "캐릭터 형식에 맞춰주세요." });
        }
    }

    // 캐릭터명 중복 체크
    const isExistName = await prisma.characters.findFirst({
        where: {
            name,
        },
    });

    if (isExistName)
        return res.status(400).json({ message: "중복된 캐릭터명입니다." });

    //캐릭터 생성

    const character = await prisma.characters.create({
        data: {
            userId: req.user.userId,
            name,
            heath: DEFAULT_HP,
            power: DEFAULT_POWER,
            money: DEFAULT_MONEY,
        },
    });

    return res.status(201).json({ message: character.characterId });
});

export default router;
