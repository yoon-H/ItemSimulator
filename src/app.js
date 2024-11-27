import express from 'express';
import cookieParser from 'cookie-parser';
import UsersRouter from './routes/users.router.js';
import CharacterRouter from './routes/characters.router.js';

const app = express();
const PORT = 3018;

app.use(express.json());
app.use(cookieParser());
app.use('/api', [UsersRouter, CharacterRouter]);

app.listen(PORT, () => {
    console.log(PORT, '포트로 서버가 열렸어요!');
});