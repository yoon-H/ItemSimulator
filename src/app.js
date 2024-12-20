import express from 'express';
import cookieParser from 'cookie-parser';
import UsersRouter from './routes/users.router.js';
import CharacterRouter from './routes/characters.router.js';
import ItemRouter from './routes/items.router.js';
import ShopRouter from './routes/shop.router.js';
import EquipmentRouter from './routes/equipments.router.js'

const app = express();
const PORT = 3018;

app.use(express.json());
app.use(cookieParser());
app.use('/api', [UsersRouter, CharacterRouter, ItemRouter, ShopRouter, EquipmentRouter]);

app.listen(PORT, () => {
    console.log(PORT, '포트로 서버가 열렸어요!');
});