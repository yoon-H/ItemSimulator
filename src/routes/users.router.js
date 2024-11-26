// src/routes/users.router.js

import express from "express";
import { prisma } from "../utils/prisma/index.js";
import Joi from "joi";
import bcrypt from "bcrypt";
const SALT_ROUNDS = 10; // salt를 얼마나 복잡하게 만들지 결정(비밀번호 암호화)

const router = express.Router();

const idSchema = Joi.string()
    .pattern(/^[a-z][a-z0-9]*$/)
    .required();

const passwordSchema = Joi.string().min(6).required();

/** 사용자 회원가입 API **/
router.post("/sign-up", async (req, res, next) => {
    //아이디, 비밀번호, 이름
    const { userId, password, confirmPassword, name } = req.body;

    //#region 아이디 유효성 검사
    const idValidation = await idSchema.validateAsync(userId);

    if (idValidation.error)
        return res
            .status(400)
            .json({ errorMessage: "아이디 형식이 맞지 않습니다." });

    // 아이디 중복 체크
    const isExistId = await prisma.users.findFirst({
        where: {
            id: userId,
        },
    });

    if (isExistId) {
        return res.status(409).json({ message: "이미 존재하는 아이디입니다." });
    }
    //#endrigion

    //#region 비밀번호 유효성 검사
    const passwordValidation = await passwordSchema.validateAsync(password);

    if (passwordValidation.error)
        return res
            .status(400)
            .json({ message: "비밀번호 형식이 맞지 않습니다." });

    if (password !== confirmPassword)
        return res
            .status(400)
            .json({ message: "비밀번호 확인과 일치하지 않습니다." });
    //#endregion

    //#region 닉네임 중복 검사
    const isExistName = await prisma.users.findFirst({
        where: {
            name,
        },
    });

    if (isExistName)
        return res.status(400).json({ message: "중복된 닉네임입니다." });
    //#endregion

    //비밀번호 변환
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Users 테이블에 사용자를 추가합니다.
    const user = await prisma.users.create({
        data: {
            id: userId,
            password: hashedPassword,
            name,
        },
    });

    return res.status(201).json({
        message: {
            userId: user.userId,
            id: user.id,
            name: user.name,
            createAt: user.createdAt,
            updateAt: user.updatedAt,
        },
    });
});

export default router;
