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

router.delete('/characters/:characterId', authMiddleware,async(req, res, next) => {
    const {characterId} = req.params;

    if(!characterId) return res.status(400).json({message : "캐릭터 아이디를 입력해주세요."});

    // Id로 캐릭터 찾기
    const character = await prisma.characters.findFirst({
        where: {
            characterId : +characterId,
        },
    });

    if(!character) return res.status(400).json({message : "캐릭터가 존재하지 않습니다."});

    if(character.userId !== req.user.userId) return res.status(400).json({message : "해당 캐릭터의 유저가 아닙니다."});

    const deleteData = await prisma.characters.delete({
        where : {
            characterId : +characterId
        }
    });

    return res.status(200).json({message : deleteData});
    
})

export default router;
