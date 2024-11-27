import express from "express";
import { prisma } from "../utils/prisma/index.js";
//import authMiddleware from "../middlewares/auth.middleware.js";
import Joi from "joi";

const router = express.Router();

const status = ["health", "power"];

const numberSchema = Joi.number().integer().strict().required();
const stringSchema = Joi.string().required().strict();

router.post("/items", async (req, res, next) => {
    const { itemCode, itemName, itemStat, itemPrice } = req.body;

    // #region 아이템 코드 검사
    try {
        await numberSchema.validateAsync(itemCode);
    } catch (error) {
        if (error.name === "ValidationError")
            return res
                .status(400)
                .json({ message: "아이템 코드를 숫자로 입력해주세요." });
    }

    const isExistCode = await prisma.items.findFirst({
        where: {
            itemCode,
        },
    });

    if(isExistCode) return res.status(400).json({message : "중복된 아이템 코드입니다."});
    // #endregion

    // #region 아이템 이름 검사
    try {
        await stringSchema.validateAsync(itemName);
    } catch (error) {
        if(error.name === "ValidationError") return res.status(400).json({message : "아이템 이름을 문자열로 입력해주세요."});
    }

    const isExistName = await prisma.items.findFirst({
        where: {
            name : itemName,
        },
    });

    if(isExistName) return res.status(400).json({message : "중복된 아이템 이름입니다."});
    // #endregion

    // #region 아이템 스탯 검사
    if(!itemStat) return res.status(400).json({message : "스탯을 입력해주세요."});

    try {
        for(const idx in status) {
            if(!itemStat[status[idx]]) return res.status(400).json({message : "아이템 스탯 타입을 형식에 맞게 작성해주세요."});

            const result = await numberSchema.validateAsync(itemStat[status[idx]]);
        }
    } catch (error) {
        if(error.name === "ValidationError") return res.status(400).json({message : "아이템 스탯 값을 숫자로 입력해주세요."});
    }
    // #endregion

    // #region 아이템 가격 검사
    try {
        await numberSchema.validateAsync(itemPrice);
    } catch (error) {
        if(error.name === "ValidationError") return res.status(400).json({message : "아이템 가격을 숫자로 입력해주세요."});
    }
    // #endregion

    const item = await prisma.items.create({
        data: {
            itemCode,
            name : itemName,
            health: itemStat.health,
            power: itemStat.power,
            price: itemPrice,
        },
    });

    return res.status(201).json({ message: "아이템이 생성되었습니다." });
});

export default router;
