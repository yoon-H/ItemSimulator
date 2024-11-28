import express from "express";
import { prisma } from "../utils/prisma/index.js";
import Joi from "joi";

const router = express.Router();

const status = new Set(["health", "power"]);
const slotEnum = new Set(["ARMOR", "WEAPON", "RING", "AMULET"])

const numberSchema = Joi.number().integer().strict().required();
const stringSchema = Joi.string().required().strict();

// #region 아이템 생성
router.post("/items", async (req, res, next) => {
    const { itemCode, itemName, itemStat, itemPrice } = req.body;
    let {itemSlot} = req.body;

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

    if (isExistCode)
        return res.status(400).json({ message: "중복된 아이템 코드입니다." });
    // #endregion

    // #region 아이템 이름 검사
    try {
        await stringSchema.validateAsync(itemName);
    } catch (error) {
        if (error.name === "ValidationError")
            return res
                .status(400)
                .json({ message: "아이템 이름을 문자열로 입력해주세요." });
    }

    const isExistName = await prisma.items.findFirst({
        where: {
            name: itemName,
        },
    });

    if (isExistName)
        return res.status(400).json({ message: "중복된 아이템 이름입니다." });
    // #endregion

    // #region 아이템 스탯 검사
    if (!itemStat)
        return res.status(400).json({ message: "스탯을 입력해주세요." });

    try {
        for (const key in itemStat) {
            if (!status.has(key))
                return res.status(400).json({
                    message: "아이템 스탯 타입을 형식에 맞게 작성해주세요.",
                });

            const result = await numberSchema.validateAsync(itemStat[key]);
        }
    } catch (error) {
        if (error.name === "ValidationError")
            return res
                .status(400)
                .json({ message: "아이템 스탯 값을 숫자로 입력해주세요." });
    }
    // #endregion

    // #region 아이템 슬롯 검사
    if(!itemSlot) return res.status(400).json({message : "슬롯을 입력해주세요."});

    try {
        await stringSchema.validateAsync(itemSlot);
    } catch (error) {
        if (error.name === "ValidationError")
            return res
                .status(400)
                .json({ message: "아이템 슬롯을 문자열로 입력해주세요." });
    }

    itemSlot = itemSlot.toUpperCase();

    if(!slotEnum.has(itemSlot)) return res.status(400).json({message : "슬롯 enum 중에 하나를 적어주세요."});
    // #endregion

    // #region 아이템 가격 검사
    try {
        await numberSchema.validateAsync(itemPrice);
    } catch (error) {
        if (error.name === "ValidationError")
            return res
                .status(400)
                .json({ message: "아이템 가격을 숫자로 입력해주세요." });
    }
    // #endregion

    const item = await prisma.items.create({
        data: {
            itemCode,
            name: itemName,
            stat: itemStat,
            slot : itemSlot,
            price: itemPrice,
        },
    });

    return res.status(201).json({ message: "아이템이 생성되었습니다." });
});
// #endregion

// #region 아이템 수정
router.patch("/items/:itemCode", async (req, res, next) => {
    const { itemCode } = req.params;
    const { itemName, itemStat } = req.body;

    if (!itemCode)
        return res.status(400).json({ message: "아이템 코드를 입력해주세요." });

    const targetItem = await prisma.items.findFirst({
        where: {
            itemCode: +itemCode,
        },
    });

    if (!targetItem)
        return res
            .status(400)
            .json({ message: "해당 아이템이 존재하지 않습니다." });

    // #region 아이템 이름 유효성 검사
    if (!itemName)
        return res.status(400).json({ message: "아이템 이름을 입력해주세요." });

    try {
        await stringSchema.validateAsync(itemName);
    } catch (error) {
        if (error.name === "ValidationError")
            return res
                .status(400)
                .json({ message: "아이템 이름을 문자열로 입력해주세요." });
    }

    const isExistName = await prisma.items.findFirst({
        where: {
            name: itemName,
        },
    });

    if (isExistName)
        return res.status(400).json({ message: "중복되는 이름입니다." });

    // #endregion

    // #region 스탯 유효성 검사
    if (!itemStat)
        return res.status(400).json({ message: "아이템 스탯을 입력해주세요." });

    try {
        for (const key in itemStat) {
            console.log(key, status.has(key));
            if (!status.has(key))
                return res
                    .status(400)
                    .json({ message: "스탯이 존재하지 않습니다." });

            await numberSchema.validateAsync(itemStat[key]);
        }
    } catch (error) {
        if (error.name === "ValidationError")
            return res
                .status(400)
                .json({ message: "값을 숫자로 입력해주세요." });
    }
    // #endregion

    const updateItem = await prisma.items.update({
        where: {
            itemCode: +itemCode,
        },
        data: {
            name: itemName,
            stat: itemStat,
        },
    });

    return res
        .status(200)
        .json({ message: "성공적으로 수정되었습니다.", updateItem });
});
// #endregion

// #region 아이템 목록 조회
router.get("/items", async (req, res, next) => {
    const items = await prisma.items.findMany({
        select: {
            itemCode: true,
            name: true,
            price: true,
        },
    });

    return res.status(200).json(items);
});
// #endregion

// #region 아이템 상세 조회
router.get("/items/:itemCode", async (req, res, next) => {
    const { itemCode } = req.params;

    if (!itemCode)
        return res.status(400).json({ message: "아이템 코드를 입력해주세요." });

    const item = await prisma.items.findFirst({
        where: {
            itemCode: +itemCode,
        },
        select: {
            itemCode: true,
            name: true,
            stat: true,
            slot : true,
            price: true,
        },
    });

    if (!item)
        return res.status(400).json({ message: "해당하는 아이템이 없습니다." });

    return res.status(200).json(item);
});

export default router;
