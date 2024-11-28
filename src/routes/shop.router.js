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
                    invenId: isExistInven.invenId,
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

    const currentMoney = await prisma.characters.findFirst({
        where: {
            characterId: +characterId,
        },
        select: {
            money: true,
        },
    });

    return res
        .status(200)
        .json({ message: "성공적으로 구매되었습니다.", currentMoney });
    // #endregion
});
//#endregion

//#region 아이템 판매
router.delete("/shop/:characterId", authMiddleware, async (req, res, next) => {
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

    // #region 아이템 검사

    //판매할 아이템 목록
    let deleteItemList = [];

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

        const item = await prisma.inventory.findFirst({
            where: {
                characterId: +characterId,
                itemCode,
            },
        });

        if (!item)
            return res
                .status(400)
                .json({ message: "해당 아이템이 존재하지 않습니다." });

        if (item.quantity < count)
            return res
                .status(400)
                .json({
                    message: "보유한 아이템의 개수가 판매할 개수보다 적습니다.",
                });

        deleteItemList.push({
            id: item.invenId,
            num: item.quantity - count,
        });
    }
    // #endregion

    // #region 아이템 판매하기

    //금액
    let total = 0;

    for (const key in itemList) {
        const { itemCode, count } = itemList[key];

        // #region 아이템 금액 계산
        const item = await prisma.items.findFirst({
            where: {
                itemCode,
            },
        });

        total += item.price* count;
        // #endregion

        // #region 인벤토리 처리하기
        if (deleteItemList[key].num === 0) {
            await prisma.inventory.delete({
                where: {
                    invenId: deleteItemList[key].id,
                },
            });
        } else {
            await prisma.inventory.update({
                where: {
                    invenId: deleteItemList[key].id,
                },
                data: {
                    quantity: deleteItemList[key].num,
                },
            });
        }
        // #endregion
    }

    // 금액 처리
    total = Math.floor(total * 0.6);

    const currentMoney = await prisma.characters.update({
        where: {
            characterId: +characterId,
        },
        data: {
            money: character.money + total,
        },
        select: {
            money: true,
        },
    });

    return res
        .status(200)
        .json({ message: "성공적으로 판매되었습니다.", currentMoney });
    // #endregion
});
//#endregion

// #region 돈을 100원씩 벌어보자
router.patch("/work/:characterId", authMiddleware ,async (req, res, next) => {
    const { characterId } = req.params;

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


    const currentMoney = await prisma.characters.update({
        where : {
            characterId : +characterId
        },
        data : {
            money : character.money + 100
        },
        select : {
            money : true
        }
    })

    return res.status(200).json({ message : "100원을 벌었다!", currentMoney});

    // #endregion
})

// #endregion

export default router;
