import { Router } from "express";
import { paths } from "../schema";
import setupTransaction from "../utils/setupTransaction";
import HttpError from "../utils/HttpError";
import { User, sequelize } from "../database";
import { serializeUser } from "../serializers";
import getOrNotFound from "../utils/getOrNotFound";

export default function addUsersRoutes(router: Router) {
    router.post<
        null,
        | paths["/users/register"]["post"]["responses"][200]["content"]["application/json"]
        | paths["/users/register"]["post"]["responses"][400]["content"]["application/json"],
        paths["/users/register"]["post"]["requestBody"]["content"]["application/json"]
    >("/users/register", async (req, res) => {
        await setupTransaction(sequelize, async (transaction) => {
            const name = req.body["name"];

            // Check if name is already taken
            if ((await User.count({ where: { name } })) > 0) {
                throw new HttpError(400, "name_taken", "");
            }

            await res.locals.user.update(
                { name, registered: true },
                { transaction },
            );

            res.json({});
        });
    });

    router.get<
        null,
        paths["/users/me"]["get"]["responses"][200]["content"]["application/json"],
        null
    >("/users/me", async (req, res) => {
        res.json(serializeUser(res.locals.user, true));
    });

    router.get<
        paths["/users/{userId}"]["get"]["parameters"]["path"],
        paths["/users/{userId}"]["get"]["responses"][200]["content"]["application/json"],
        null
    >("/users/:userId", async (req, res) => {
        const user = await getOrNotFound<User>(User, req.params["userId"], res);

        res.json(serializeUser(user, false));
    });
}
