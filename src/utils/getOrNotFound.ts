import { Response } from "express";
import { ModelType } from "sequelize-typescript";
import { FindOptions } from "sequelize";
import HttpError from "./HttpError";

export default async function getOrNotFound<E>(
    model: ModelType<any, any>,
    pk: any,
    res: Response,
    queryOptions: Omit<FindOptions<any>, "where"> = {},
): Promise<E> {
    // @ts-expect-error Can't find a way to have typing here :'(
    const instance = (await model.findByPk(pk, queryOptions)) as E;

    if (instance == null) {
        throw new HttpError(
            404,
            "not_found",
            `Couldn't find entity with id "${pk}"`,
        );
    }

    return instance;
}
