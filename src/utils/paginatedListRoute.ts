import { Request, Response } from "express";
import HttpError from "./HttpError";
import {
    Attributes,
    Includeable,
    Model,
    ModelStatic,
    Op,
    WhereOptions,
} from "sequelize";
import _ from "lodash";

export default async function paginatedListRoute<E extends Model>(
    req: Request<
        any,
        any,
        any,
        { count?: number; pagePrevious?: string; pageNext?: string }
    >,
    res: Response,
    modelToList: ModelStatic<E>,
    sortingKeys: string[],
    serializer: (e: E) => any,
    whereConditions: WhereOptions<Attributes<E>> = {},
    includes: Includeable | Includeable[] = [],
) {
    const count = req.query["count"] || 20;
    const pagePrevious = req.query["pagePrevious"]?.split(",");
    const pageNext = req.query["pageNext"]?.split(",");

    if (pageNext != null && pagePrevious != null) {
        throw new HttpError(
            400,
            "both_cursor_not_allowed",
            "You must provide neither or either cursorBefore or cursorAfter, but not both at the same time",
        );
    }
    const isGoingForward = pagePrevious == null;

    const whereConditionsForPaginations: WhereOptions<Attributes<E>> = {
        ...(isGoingForward && pageNext != null
            ? Object.assign(
                  {},
                  ...sortingKeys.map((key, i) => ({
                      [key]: { [Op.gt]: pageNext[i] },
                  })),
              )
            : {}),
        ...(!isGoingForward
            ? Object.assign(
                  {},
                  ...sortingKeys.map((key, i) => ({
                      [key]: { [Op.lt]: pagePrevious[i] },
                  })),
              )
            : {}),
    };

    const rows = await modelToList.findAll({
        where: {
            ...whereConditions,
            ...whereConditionsForPaginations,
        },
        order: [
            // @ts-expect-error Again...
            sortingKeys.map((sortingKey) => [
                sortingKey,
                ...(isGoingForward ? [] : ["DESC"]),
            ]),
        ],
        limit: count,
        include: includes,
    });

    const totalLeft = await modelToList.count({
        where: {
            ...whereConditions,
            ...whereConditionsForPaginations,
        },
    });

    // To keep `rows`in
    if (!isGoingForward) {
        rows.reverse();
    }

    const total = await modelToList.count({
        where: {
            ...whereConditions,
        },
    });

    const potentialPageNext = sortingKeys
        .map((sortingKey) => rows[rows.length - 1][sortingKey])
        .join(",");
    const potentialPagePrevious = sortingKeys
        .map((sortingKey) => rows[0][sortingKey])
        .join(",");

    res.send({
        items: rows.map((item) => serializer(item)),
        pagination: {
            total,
            ...(isGoingForward
                ? totalLeft - rows.length > 0
                    ? { pageNext: potentialPageNext }
                    : {}
                : {}),
            ...(isGoingForward
                ? total - totalLeft > 0
                    ? { pagePrevious: potentialPagePrevious }
                    : {}
                : {}),
            ...(!isGoingForward
                ? totalLeft - rows.length > 0
                    ? { pagePrevious: potentialPagePrevious }
                    : {}
                : {}),
            ...(!isGoingForward
                ? total - totalLeft > 0
                    ? { pageNext: potentialPageNext }
                    : {}
                : {}),
        },
    });
}
