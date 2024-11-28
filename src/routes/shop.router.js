import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import Joi from "joi";

const router = express.Router();

const numberSchema = Joi.number().integer().min(1).required().strict();

//#region 아이템 구매
router.post("/shop/:characterId", authMiddleware, async (req, res, next) => {
    const { characterId } = req.params;
    const itemList = req.body;

    // #region 캐릭터 검사
    if (!characterId)
        return res
            .status(400)
            .json({ message: "캐릭터 아이디를 입력해주세요." });

    const character = await prisma.characters.findFirst({
        where: {
            characterId: +characterId,
        },
    });

    if (!character)
        return res.status(400).json({ message: "캐릭터가 존재하지 않습니다." });

    if (character.userId !== req.user.userId)
        return res.status(400).json({ message: "사용자의 캐릭터가 아닙니다." });
    // #endregion

    // #region 금액 검사
    let total = 0;

    for (const idx in itemList) {
        const { itemCode, count } = itemList[+idx];

        try {
            await numberSchema.validateAsync(itemCode);
        } catch (error) {
            if (error.name === "ValidationError")
                return res.status(400).json({
                    message: `${+idx + 1}번째 아이템의 코드를 다시 입력해주세요.`,
                });
        }

        try {
            await numberSchema.validateAsync(count);
        } catch (error) {
            if (error.name === "ValidationError")
                return res.status(400).json({
                    message: `${+idx + 1}번째 아이템의 개수를 다시 입력해주세요.`,
                });
        }

        const item = await prisma.items.findFirst({
            where: {
                itemCode,
            },
        });

        if (!item)
            return res
                .status(400)
                .json({ message: "해당 아이템이 존재하지 않습니다." });

        total += item.price * count;
    }

    if (total > character.money)
        return res.status(400).json({ message: "가격이 부족합니다!" });
    // #endregion

    // #region 아이템 넣기
    for (const item of itemList) {
        const { itemCode, count } = item;

        const isExistInven = await prisma.inventory.findFirst({
            where: {
                characterId: +characterId,
                itemCode,
            },
        });

        if (!isExistInven) {
            await prisma.inventory.create({
                data: {
                    characterId: +characterId,
                    itemCode,
                    quantity: count,
                },
            });
        } else {
            await prisma.inventory.update({
                where: {
                    invenId : isExistInven.invenId
                },
                data: {
                    quantity: isExistInven.quantity + count,
                },
            });
        }

        await prisma.characters.update({
            where: {
                characterId: +characterId,
            },
            data: {
                money: character.money - total,
            },
        });
    }

    return res.status(200).json({ message: "성공적으로 구매되었습니다." });
    // #endregion
});
//#endregion

export default router;
