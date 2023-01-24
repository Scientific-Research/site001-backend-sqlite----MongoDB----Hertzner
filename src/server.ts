import session from "express-session";
import express from "express";
import cors from "cors";
import * as model from "./model.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import * as config from "./config.js";
import { INewFlashcard } from "./interfaces.js";

declare module "express-session" {
  export interface SessionData {
    user: { [key: string]: any };
  }
}

dotenv.config();

const app = express();
app.use(
  cors({
    origin: config.FRONTEND_URL,
    methods: ["POST", "GET", "DELETE", "PUT", "OPTIONS", "HEAD"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
// const port = config.port;

app.use(
  session({
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    },
  })
);

// PUBLIC ROUTES

// app.get("/", (req: express.Request, res: express.Response) => {
//   res.send(model.getApiInstructions());
// });

app.get("/", (req: express.Request, res: express.Response) => {
  res.send(model.getApiInstructions());
});

// app.get("/flashcards", (req: express.Request, res: express.Response) => {
//   res.json(model.getFlashcards());
// });

app.get("/flashcards", async (req, res) => {
  const flashcards = await model.getFlashcards();
  res.status(200).json(flashcards);
});

app.post("/login", (req: express.Request, res: express.Response) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.user = "admin" as any;
    req.session.cookie.expires = new Date(
      Date.now() + config.SECONDS_TILL_SESSION_TIMEOUT * 1000
    );
    req.session.save();
    res.status(200).send("ok");
  } else {
    res.status(401).send({});
  }
});

app.get("/get-current-user", (req: express.Request, res: express.Response) => {
  if (req.session.user) {
    res.send(req.session.user);
  } else {
    res.send("anonymousUser");
  }
});

// PROTECTED ROUTES

const authorizeUser = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (req.session.user === ("admin" as any)) {
    next();
  } else {
    res.status(401).send({});
  }
};

// app.post(
//   "/flashcard",
//   authorizeUser,
//   (req: express.Request, res: express.Response) => {
//     const flashcard = req.body.flashcard;
//     const result = model.addFlashcard(flashcard);
//     res.json(result);
//   }
// );

app.post("/flashcard", authorizeUser, async (req, res) => {
  const flashcard: INewFlashcard = req.body;
  const result = await model.addFlashcard(flashcard);
  res.status(200).send(result);
});

// app.put(
//   "/flashcard/:id",
//   authorizeUser,
//   (req: express.Request, res: express.Response) => {
//     const id = Number(req.params.id);
//     const newFlashcard: INewFlashcard = req.body.flashcard;
//     if (isNaN(id)) {
//       res.status(400).send({
//         error: true,
//         message: "sent string as id, should be number",
//       });
//     } else {
//       const result = model.editFlashcard(id, newFlashcard);
//       res.json(result);
//     }
//   }
// );

app.put("/flashcard/:id", authorizeUser, async (req, res) => {
  const _id = req.params.id;
  const flashcard: INewFlashcard = req.body;
  const result = await model.editFlashcard(_id, flashcard);
  res.status(200).json({
    oldFlashcard: result.oldFlashcard,
    result: result.newFlashcard,
  });
});

// app.delete(
//   "/flashcard/:id",
//   authorizeUser,
//   (req: express.Request, res: express.Response) => {
//     const id = Number(req.params.id);
//     if (isNaN(id)) {
//       res.status(400).send({
//         error: true,
//         message: "sent string, should be number",
//       });
//     } else {
//       const result = model.deleteFlashcard(id);
//       res.json(result);
//     }
//   }
// );

app.delete("/flashcard/:id", authorizeUser, async (req, res) => {
  const _id = req.params.id;
  const result = await model.deleteFlashcard(_id);
  res.status(200).json(result);
});

app.get("/logout", authorizeUser, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.send("ERROR");
    } else {
      res.send("logged out");
    }
  });
});

// SERVER

app.listen(config.PORT, () => {
  console.log(`listening on port http://localhost:${config.PORT}`);
});
