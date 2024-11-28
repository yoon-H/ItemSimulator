import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import Joi from "joi";

const router = express.Router();

const numberSchema = Joi.number().integer().strict().required();

// #region 아이템 장착
router.post(
    "/equipments/:characterId",
    authMiddleware,
    async (req, res, next) => {
        const { characterId } = req.params;
        const { itemCode } = req.body;

        // 캐릭터 검사
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
            return res
                .status(400)
                .json({ message: "캐릭터가 존재하지 않습니다." });

        if (character.userId !== req.user.userId)
            return res
                .status(400)
                .json({ message: "사용자의 캐릭터가 아닙니다." });

        // 아이템 코드 유효성 검사
        try {
            await numberSchema.validateAsync(itemCode);
        } catch (err) {
            if (err.name === "ValidationError") {
                return res
                    .status(400)
                    .json({
                        errorMessage: "아이템 코드는 숫자로 입력해주세요.",
                    });
            }
        }

        //아이템 코드가 존재하나?
        const item = await prisma.items.findFirst({
            where: {
                itemCode,
            },
        });

        if (!item)
            return res
                .status(400)
                .json({ message: "아이템이 존재하지 않습니다." });

        //이미 장착되어 있나?
        const isExistEquipment = await prisma.equipments.findFirst({
            where: {
                characterId: +characterId,
                itemCode: itemCode,
            },
        });

        if (isExistEquipment)
            return res
                .status(400)
                .json({ message: "같은 아이템이 이미 장착되어 있습니다." });

        //인벤토리에 있니?
        const isExistInven = await prisma.inventory.findFirst({
            where: {
                characterId: +characterId,
                itemCode: itemCode,
            },
        });

        if (!isExistInven)
            return res
                .status(400)
                .json({ message: "인벤토리에 아이템이 없습니다." });

        //인벤토리에서 하나 꺼내오기
        if (isExistInven.quantity === 1) {
            await prisma.inventory.delete({
                where: {
                    invenId: isExistInven.invenId,
                },
            });
        } else {
            await prisma.inventory.update({
                where: {
                    invenId: isExistInven.invenId,
                },
                data: {
                    quantity: isExistInven.quantity - 1,
                },
            });
        }

        //아이템 장착
        await prisma.equipments.create({
            data: {
                characterId: +characterId,
                itemCode,
                slot: item.slot,
            },
        });

        //캐릭터 스탯 변경
        const newStat = {
            health: character.stat.health + item.stat.health,
            power: character.stat.power + character.stat.power,
        };

        await prisma.characters.update({
            where: {
                characterId: +characterId,
            },
            data: {
                stat: newStat
            },
        });

        return res.status(200).json({ message: "장착에 성공했습니다." });
    },
);
// #endregion

router.get("/equipments/:characterId", async (req, res, next) => {
    const { characterId } = req.params;

    // 캐릭터 검사
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
        return res
            .status(400)
            .json({ message: "캐릭터가 존재하지 않습니다." });


    const equipments = await prisma.equipments.findMany({
        where : {
            characterId : +characterId
        },
        select :{
            itemCode : true,
            items : {
                select : {
                    name : true
                }
            }
        }
    })

    if(!equipments) return res.status(200).json({message : "장착된 아이템이 없습니다."});

    return res.status(200).json(equipments);
})

export default router;